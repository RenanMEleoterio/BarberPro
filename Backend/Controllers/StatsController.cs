using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) para permitir a interação com o Entity Framework Core.
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public StatsController(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retorna estatísticas detalhadas para um barbeiro específico, como total de clientes, receita total, total de agendamentos,
        /// avaliação média (mock), performance semanal e serviços mais populares. O período das estatísticas pode ser especificado (semana, mês, trimestre, ano).
        /// </summary>
        /// <param name="id">O ID do barbeiro.</param>
        /// <param name="periodo">O período para o qual as estatísticas devem ser calculadas (ex: "semana", "mes", "trimestre", "ano"). Padrão é "semana".</param>
        /// <returns>ActionResult contendo um objeto anônimo com as estatísticas do barbeiro ou NotFound se o barbeiro não for encontrado.</returns>
        [HttpGet("barber/{id}")]
        public async Task<ActionResult> GetBarberStats(int id, [FromQuery] string periodo = "semana")
        {
            var barbeiro = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == id && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
                return NotFound();

            DateTime dataInicio, dataFim;
            switch (periodo.ToLower())
            {
                case "mes":
                case "month":
                    dataInicio = DateTime.SpecifyKind(new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1), DateTimeKind.Utc);
                    dataFim = dataInicio.AddMonths(1);
                    break;
                case "trimestre":
                case "quarter":
                    var trimestre = (DateTime.Now.Month - 1) / 3;
                    dataInicio = DateTime.SpecifyKind(new DateTime(DateTime.Now.Year, trimestre * 3 + 1, 1), DateTimeKind.Utc);
                    dataFim = dataInicio.AddMonths(3);
                    break;
                case "ano":
                case "year":
                    dataInicio = DateTime.SpecifyKind(new DateTime(DateTime.Now.Year, 1, 1), DateTimeKind.Utc);
                    dataFim = dataInicio.AddYears(1);
                    break;
                case "semana":
                case "week":
                default:
                    // Ajuste para garantir que a semana comece no domingo (ou segunda, dependendo da regra de negócio)
                    // Aqui vamos usar Domingo como início da semana (DayOfWeek.Sunday = 0)
                    dataInicio = DateTime.SpecifyKind(DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek), DateTimeKind.Utc);
                    dataFim = dataInicio.AddDays(7);
                    break;
            }

            var agendamentos = await _context.Agendamentos
                .Where(a => a.BarbeiroId == id && a.DataHora >= dataInicio && a.DataHora < dataFim)
                .ToListAsync();

            Console.WriteLine($"Stats for Barber {id}: Period={periodo}, Range={dataInicio} to {dataFim}, Found {agendamentos.Count} appointments.");

            var totalClientes = agendamentos.Select(a => a.ClienteId).Distinct().Count();
            var receitaTotal = agendamentos.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0);
            var totalAgendamentos = agendamentos.Count;
            var avaliacaoMedia = 4.8m; // Mock - implementar sistema de avaliação

            // Performance por dia da semana
            var performanceSemanal = new object[7];
            string[] diasSemanaPt = { "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb" };
            
            bool isWeeklyFilter = periodo.ToLower() == "semana" || periodo.ToLower() == "week";
            
            if (isWeeklyFilter)
            {
                // Lógica para Semana: Mostrar os dias específicos da semana atual
                var hoje = DateTime.UtcNow.Date;
                var inicioSemanaAtual = DateTime.SpecifyKind(hoje.AddDays(-(int)hoje.DayOfWeek), DateTimeKind.Utc);
                
                for (int i = 0; i < 7; i++)
                {
                    var dia = inicioSemanaAtual.AddDays(i);
                    var agendamentosDiaQuery = agendamentos.Where(a => a.DataHora.Date == dia.Date);
                    
                    performanceSemanal[i] = new {
                        Dia = diasSemanaPt[i],
                        Agendamentos = agendamentosDiaQuery.Count(),
                        Receita = agendamentosDiaQuery.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                    };
                }
            }
            else
            {
                // Lógica para Mês/Trimestre/Ano: Agregar por dia da semana em todo o período selecionado
                for (int i = 0; i < 7; i++)
                {
                    var agendamentosDiaDaSemanaQuery = agendamentos.Where(a => (int)a.DataHora.DayOfWeek == i);
                    
                    performanceSemanal[i] = new {
                        Dia = diasSemanaPt[i],
                        Agendamentos = agendamentosDiaDaSemanaQuery.Count(),
                        Receita = agendamentosDiaDaSemanaQuery.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                    };
                }
            }

            // Serviços mais populares
            var servicosPopulares = agendamentos
                .Where(a => !string.IsNullOrEmpty(a.TipoServico))
                .GroupBy(a => a.TipoServico)
                .Select(g => new {
                    Servico = g.Key,
                    Quantidade = g.Count(),
                    Receita = g.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                })
                .OrderByDescending(s => s.Quantidade)
                .Take(4)
                .ToList();

            // Insights de performance
            var pontualidade = 98; // Mock - calcular baseado em dados reais
            var taxaRetorno = 85; // Mock - calcular baseado em dados reais
            var ticketMedio = receitaTotal / Math.Max(agendamentos.Where(a => a.Status == StatusAgendamento.Realizado).Count(), 1);

            var response = new {
                TotalClientes = totalClientes,
                ReceitaTotal = receitaTotal,
                TotalAgendamentos = totalAgendamentos,
                AvaliacaoMedia = avaliacaoMedia,
                PerformanceSemanal = performanceSemanal,
                ServicosPopulares = servicosPopulares,
                Insights = new {
                    Pontualidade = pontualidade,
                    TaxaRetorno = taxaRetorno,
                    TicketMedio = ticketMedio
                }
            };

            return Ok(response);
        }

        /// <summary>
        /// Retorna estatísticas detalhadas para uma barbearia específica, destinadas a gerentes.
        /// Inclui receita total, total de clientes, total de agendamentos, avaliação média (mock),
        /// performance mensal, serviços mais populares, ranking de barbeiros e progresso da meta mensal.
        /// O período das estatísticas pode ser especificado (mês, trimestre, ano, semana).
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <param name="periodo">O período para o qual as estatísticas devem ser calculadas (ex: "mes", "trimestre", "ano", "semana"). Padrão é "mes".</param>
        /// <returns>ActionResult contendo um objeto anônimo com as estatísticas da barbearia ou NotFound se a barbearia não for encontrada.</returns>
        [HttpGet("manager/{barbeariaId}")]
        public async Task<ActionResult> GetManagerStats(int barbeariaId, [FromQuery] string periodo = "mes")
        {
            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.Id == barbeariaId);

            if (barbearia == null)
                return NotFound();

            DateTime dataInicio, dataFim;
            switch (periodo.ToLower())
            {
                case "trimestre":
                    var trimestre = (DateTime.Now.Month - 1) / 3;
                    dataInicio = DateTime.SpecifyKind(new DateTime(DateTime.Now.Year, trimestre * 3 + 1, 1), DateTimeKind.Utc);
                    dataFim = dataInicio.AddMonths(3);
                    break;
                case "ano":
                    dataInicio = DateTime.SpecifyKind(new DateTime(DateTime.Now.Year, 1, 1), DateTimeKind.Utc);
                    dataFim = dataInicio.AddYears(1);
                    break;
                case "semana":
                    dataInicio = DateTime.SpecifyKind(DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek), DateTimeKind.Utc);
                    dataFim = dataInicio.AddDays(7);
                    break;
                default: // mes
                    dataInicio = DateTime.SpecifyKind(new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1), DateTimeKind.Utc);
                    dataFim = dataInicio.AddMonths(1);
                    break;
            }

            var agendamentos = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= dataInicio && a.DataHora < dataFim)
                .ToListAsync();

            var receitaTotal = agendamentos.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0);
            var totalClientes = agendamentos.Select(a => a.ClienteId).Distinct().Count();
            var totalAgendamentos = agendamentos.Count;
            var avaliacaoMedia = 4.7m; // Mock

            // Performance mensal (últimos 5 meses)
            var performanceMensal = new object[5];
            for (int i = 4; i >= 0; i--)
            {
                var mesInicio = DateTime.Now.AddMonths(-i).Date;
                mesInicio = DateTime.SpecifyKind(new DateTime(mesInicio.Year, mesInicio.Month, 1), DateTimeKind.Utc);
                var mesFim = mesInicio.AddMonths(1);

                var agendamentosMes = await _context.Agendamentos
                    .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= mesInicio && a.DataHora < mesFim)
                    .CountAsync();

                var receitaMes = await _context.Agendamentos
                    .Where(a => a.BarbeariaId == barbeariaId && 
                               a.DataHora >= mesInicio && 
                               a.DataHora < mesFim && 
                               a.Status == StatusAgendamento.Realizado)
                    .SumAsync(a => a.PrecoServico ?? 0);

                performanceMensal[4 - i] = new {
                    Mes = mesInicio.ToString("MMM"),
                    Receita = receitaMes,
                    Agendamentos = agendamentosMes
                };
            }

            // Serviços mais populares
            var servicosPopulares = agendamentos
                .Where(a => !string.IsNullOrEmpty(a.TipoServico))
                .GroupBy(a => a.TipoServico)
                .Select(g => new {
                    Servico = g.Key,
                    Quantidade = g.Count(),
                    Porcentagem = Math.Round((double)g.Count() / agendamentos.Count * 100, 1),
                    Receita = g.Where(a => a.Status == StatusAgendamento.Realizado).Sum(a => a.PrecoServico ?? 0)
                })
                .OrderByDescending(s => s.Quantidade)
                .Take(4)
                .ToList();

            // Ranking de barbeiros
            var rankingBarbeiros = agendamentos
                .Where(a => a.Status == StatusAgendamento.Realizado)
                .GroupBy(a => a.BarbeiroId)
                .Select(g => new {
                    BarbeiroId = g.Key,
                    Nome = g.First().Barbeiro.Nome,
                    Receita = g.Sum(a => a.PrecoServico ?? 0),
                    Clientes = g.Select(a => a.ClienteId).Distinct().Count(),
                    Avaliacao = 4.8m // Mock
                })
                .OrderByDescending(b => b.Receita)
                .Take(4)
                .ToList();

            // Meta mensal
            var metaMensal = 20000m; // Mock - implementar configuração
            var progressoMeta = Math.Round((double)(receitaTotal / metaMensal) * 100, 1);

            var response = new {
                ReceitaTotal = receitaTotal,
                TotalClientes = totalClientes,
                TotalAgendamentos = totalAgendamentos,
                AvaliacaoMedia = avaliacaoMedia,
                PerformanceMensal = performanceMensal,
                ServicosPopulares = servicosPopulares,
                RankingBarbeiros = rankingBarbeiros,
                MetaMensal = new {
                    Meta = metaMensal,
                    Atual = receitaTotal,
                    Progresso = progressoMeta
                },
                Eficiencia = new {
                    TempoMedioCorte = 25,
                    TempoMedioBarba = 15,
                    TempoMedioCompleto = 40
                },
                Satisfacao = new {
                    Excelente = 78,
                    Bom = 18,
                    Regular = 4
                }
            };

            return Ok(response);
        }
    }
}


