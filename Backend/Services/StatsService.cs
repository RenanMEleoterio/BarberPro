using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;
using BarbeariaSaaS.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BarbeariaSaaS.Services
{
    public interface IStatsService
    {
        Task<object> GetBarberStatsAsync(int barberId, string periodo);
        Task<ManagerStatsDto> GetManagerStatsAsync(int barbeariaId, string barbeariaNome, string periodo);
    }

    public class StatsService : IStatsService
    {
        private readonly BarbeariaContext _context;
        private readonly ILogger<StatsService> _logger;

        public StatsService(BarbeariaContext context, ILogger<StatsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetBarberStatsAsync(int barberId, string periodo)
        {
            var now = AppDateTime.UtcNow();
            var (dataInicio, dataFim, isWeeklyFilter) = ResolveBarberPeriod(periodo, now);

            var agendamentos = await _context.Agendamentos
                .AsNoTracking()
                .Where(a => a.BarbeiroId == barberId && a.DataHora >= dataInicio && a.DataHora < dataFim)
                .ToListAsync();

            _logger.LogInformation(
                "Barber stats gerados para {BarbeiroId}. Periodo={Periodo}, Inicio={Inicio}, Fim={Fim}, Agendamentos={Total}",
                barberId,
                periodo,
                dataInicio,
                dataFim,
                agendamentos.Count);

            var totalClientes = agendamentos.Select(a => a.ClienteId).Distinct().Count();
            var receitaTotal = agendamentos.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0);
            var totalAgendamentos = agendamentos.Count;
            var avaliacaoMedia = 4.8m;

            var performanceSemanal = BuildBarberPerformance(agendamentos, dataInicio, isWeeklyFilter);
            var servicosPopulares = agendamentos
                .Where(a => !string.IsNullOrEmpty(a.TipoServico))
                .GroupBy(a => a.TipoServico)
                .Select(g => new
                {
                    Servico = g.Key,
                    Quantidade = g.Count(),
                    Receita = g.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                })
                .OrderByDescending(s => s.Quantidade)
                .Take(4)
                .ToList();

            var pontualidade = 98;
            var taxaRetorno = 85;
            var ticketMedio = receitaTotal / Math.Max(agendamentos.Count(a => a.Status == StatusAgendamento.Realizado), 1);

            return new
            {
                TotalClientes = totalClientes,
                ReceitaTotal = receitaTotal,
                TotalAgendamentos = totalAgendamentos,
                AvaliacaoMedia = avaliacaoMedia,
                PerformanceSemanal = performanceSemanal,
                ServicosPopulares = servicosPopulares,
                Insights = new
                {
                    Pontualidade = pontualidade,
                    TaxaRetorno = taxaRetorno,
                    TicketMedio = ticketMedio
                }
            };
        }

        public async Task<ManagerStatsDto> GetManagerStatsAsync(int barbeariaId, string barbeariaNome, string periodo)
        {
            var now = AppDateTime.UtcNow();
            var (dataInicio, dataFim) = ResolveManagerPeriod(periodo, now);

            var agendamentos = await _context.Agendamentos
                .AsNoTracking()
                .Include(a => a.Barbeiro)
                .Include(a => a.AgendamentoServicos)
                    .ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= dataInicio && a.DataHora < dataFim)
                .ToListAsync();

            var agendamentosRealizados = agendamentos.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
            var receitaTotal = agendamentosRealizados.Sum(CalculateAppointmentRevenue);
            var totalClientes = agendamentos.Select(a => a.ClienteId).Distinct().Count();
            var totalAgendamentos = agendamentos.Count;
            var avaliacaoMedia = 4.7m;

            _logger.LogWarning("==== DEBUG MANAGER STATS ====");
            _logger.LogWarning("BarbeariaId Refletido: {BarbeariaId} ({Nome})", barbeariaId, barbeariaNome);
            _logger.LogWarning("Filtro de Data (Periodo: {Periodo}): Entre {Inicio} e {Fim}", periodo, dataInicio, dataFim);
            _logger.LogWarning("Agendamentos Recuperados Bruto no BD: {Count}", agendamentos.Count);
            _logger.LogWarning("Desses, qtd com Status == Realizado(4): {Count}", agendamentosRealizados.Count);
            _logger.LogWarning("Total de Clientes Distintos: {Count}", totalClientes);
            _logger.LogWarning("Receita Mensal Somada: {Receita}", receitaTotal);
            _logger.LogWarning("=============================");

            var performanceMensal = await BuildMonthlyPerformanceAsync(barbeariaId, now);

            var servicosRelacionados = agendamentos
                .SelectMany(a => a.AgendamentoServicos
                    .Where(asv => asv.Servico != null)
                    .Select(asv => new
                    {
                        AppointmentStatus = a.Status,
                        Servico = asv.Servico!
                    }))
                .ToList();

            var totalServicosRelacionados = Math.Max(servicosRelacionados.Count, 1);
            var servicosPopulares = servicosRelacionados
                .GroupBy(item => item.Servico.Nome)
                .Select(g => new ServicoPopularDto
                {
                    Servico = g.Key,
                    Quantidade = g.Count(),
                    Porcentagem = Math.Round((decimal)g.Count() / totalServicosRelacionados * 100, 1),
                    Receita = g.Where(item => item.AppointmentStatus == StatusAgendamento.Realizado)
                        .Sum(item => item.Servico.Preco)
                })
                .OrderByDescending(s => s.Quantidade)
                .Take(4)
                .ToList();

            var rankingBarbeiros = agendamentosRealizados
                .GroupBy(a => a.BarbeiroId)
                .Select(g => new BarbeiroTopDto
                {
                    BarbeiroId = g.Key,
                    Nome = g.FirstOrDefault()?.Barbeiro?.Nome ?? "N/A",
                    Receita = g.Sum(CalculateAppointmentRevenue),
                    Clientes = g.Select(a => a.ClienteId).Distinct().Count(),
                    Avaliacao = 4.8m
                })
                .OrderByDescending(b => b.Receita)
                .Take(4)
                .ToList();

            _logger.LogWarning("Servicos Populares: {Count} detectados", servicosPopulares.Count);
            _logger.LogWarning("Top Barbeiros: {Count} detectados", rankingBarbeiros.Count);

            var metaMensal = 20000m;
            var progressoMeta = metaMensal > 0 ? Math.Round((receitaTotal / metaMensal) * 100, 1) : 0;

            return new ManagerStatsDto
            {
                ReceitaTotal = receitaTotal,
                TotalClientes = totalClientes,
                TotalAgendamentos = totalAgendamentos,
                AvaliacaoMedia = avaliacaoMedia,
                PerformanceMensal = performanceMensal,
                ServicosPopulares = servicosPopulares,
                RankingBarbeiros = rankingBarbeiros,
                MetaMensal = new MetaMensalDto
                {
                    Meta = metaMensal,
                    Atual = receitaTotal,
                    Progresso = progressoMeta
                },
                Eficiencia = new EficienciaDto
                {
                    TempoMedioCorte = 25,
                    TempoMedioBarba = 15,
                    TempoMedioCompleto = 40
                },
                Satisfacao = new SatisfacaoDto
                {
                    Excelente = 78,
                    Bom = 18,
                    Regular = 4
                }
            };
        }

        private static (DateTime dataInicio, DateTime dataFim, bool isWeeklyFilter) ResolveBarberPeriod(string periodo, DateTime now)
        {
            switch ((periodo ?? string.Empty).ToLower())
            {
                case "mes":
                case "month":
                    var inicioMes = AppDateTime.StartOfBusinessMonth(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioMes), AppDateTime.NormalizeClientDateTimeToUtc(inicioMes.AddMonths(1)), false);
                case "trimestre":
                case "quarter":
                    var inicioTrimestre = AppDateTime.StartOfBusinessQuarter(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioTrimestre), AppDateTime.NormalizeClientDateTimeToUtc(inicioTrimestre.AddMonths(3)), false);
                case "ano":
                case "year":
                    var inicioAno = AppDateTime.StartOfBusinessYear(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioAno), AppDateTime.NormalizeClientDateTimeToUtc(inicioAno.AddYears(1)), false);
                case "semana":
                case "week":
                default:
                    var inicioSemana = AppDateTime.StartOfBusinessWeek(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioSemana), AppDateTime.NormalizeClientDateTimeToUtc(inicioSemana.AddDays(7)), true);
            }
        }

        private static (DateTime dataInicio, DateTime dataFim) ResolveManagerPeriod(string periodo, DateTime now)
        {
            switch ((periodo ?? string.Empty).ToLower())
            {
                case "trimestre":
                    var inicioTrimestre = AppDateTime.StartOfBusinessQuarter(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioTrimestre), AppDateTime.NormalizeClientDateTimeToUtc(inicioTrimestre.AddMonths(3)));
                case "ano":
                    var inicioAno = AppDateTime.StartOfBusinessYear(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioAno), AppDateTime.NormalizeClientDateTimeToUtc(inicioAno.AddYears(1)));
                case "semana":
                    var inicioSemana = AppDateTime.StartOfBusinessWeek(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioSemana), AppDateTime.NormalizeClientDateTimeToUtc(inicioSemana.AddDays(7)));
                default:
                    var inicioMes = AppDateTime.StartOfBusinessMonth(now);
                    return (AppDateTime.NormalizeClientDateTimeToUtc(inicioMes), AppDateTime.NormalizeClientDateTimeToUtc(inicioMes.AddMonths(1)));
            }
        }

        private static object[] BuildBarberPerformance(List<Agendamento> agendamentos, DateTime dataInicio, bool isWeeklyFilter)
        {
            var diasSemanaPt = new[] { "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab" };
            var performanceSemanal = new object[7];

            if (isWeeklyFilter)
            {
                for (var i = 0; i < 7; i++)
                {
                    var dia = AppDateTime.GetBusinessDate(dataInicio).AddDays(i);
                    var agendamentosDia = agendamentos.Where(a => AppDateTime.GetBusinessDate(a.DataHora) == dia);
                    performanceSemanal[i] = new
                    {
                        Dia = diasSemanaPt[i],
                        Agendamentos = agendamentosDia.Count(),
                        Receita = agendamentosDia.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                    };
                }

                return performanceSemanal;
            }

            for (var i = 0; i < 7; i++)
            {
                var agendamentosDiaDaSemana = agendamentos.Where(a => AppDateTime.GetBusinessDayOfWeek(a.DataHora) == i);
                performanceSemanal[i] = new
                {
                    Dia = diasSemanaPt[i],
                    Agendamentos = agendamentosDiaDaSemana.Count(),
                    Receita = agendamentosDiaDaSemana.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                };
            }

            return performanceSemanal;
        }

        private async Task<List<PerformanceMesDto>> BuildMonthlyPerformanceAsync(int barbeariaId, DateTime now)
        {
            var monthCursor = AppDateTime.StartOfBusinessMonth(now).AddMonths(-4);
            var monthEndExclusive = AppDateTime.StartOfBusinessMonth(now).AddMonths(1);
            var monthCursorUtc = AppDateTime.NormalizeClientDateTimeToUtc(monthCursor);
            var monthEndExclusiveUtc = AppDateTime.NormalizeClientDateTimeToUtc(monthEndExclusive);

            var agendamentosMeses = await _context.Agendamentos
                .AsNoTracking()
                .Include(a => a.AgendamentoServicos)
                    .ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= monthCursorUtc && a.DataHora < monthEndExclusiveUtc)
                .ToListAsync();

            var groupedByMonth = agendamentosMeses
                .GroupBy(a => AppDateTime.GetBusinessYearMonth(a.DataHora))
                .ToDictionary(g => g.Key, g => g.ToList());

            var performanceMensal = new List<PerformanceMesDto>();

            for (var i = 0; i < 5; i++)
            {
                var mesInicio = monthCursor.AddMonths(i);
                groupedByMonth.TryGetValue((mesInicio.Year, mesInicio.Month), out var agendamentosDoMes);
                agendamentosDoMes ??= new List<Agendamento>();

                performanceMensal.Add(new PerformanceMesDto
                {
                    Mes = mesInicio.ToString("MMM"),
                    Receita = agendamentosDoMes
                        .Where(a => a.Status == StatusAgendamento.Realizado)
                        .Sum(CalculateAppointmentRevenue),
                    Agendamentos = agendamentosDoMes.Count
                });
            }

            return performanceMensal;
        }

        private static decimal CalculateAppointmentRevenue(Agendamento agendamento)
        {
            return agendamento.PrecoServico ?? (agendamento.AgendamentoServicos?.Sum(s => s.Servico?.Preco ?? 0) ?? 0);
        }
    }
}
