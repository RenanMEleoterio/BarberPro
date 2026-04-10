using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly BarbeariaContext _context;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(BarbeariaContext context, ILogger<DashboardService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetClientDashboardAsync(int clienteId)
        {
            var cliente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == clienteId && u.TipoUsuario == TipoUsuario.Cliente);

            if (cliente == null)
                return null;

            var agoraUtc = AppDateTime.UtcNow();

            var agendamentosExpiradosCliente = await _context.Agendamentos
                .Where(a => a.ClienteId == clienteId && a.DataHora <= agoraUtc && a.Status == StatusAgendamento.Pendente)
                .ToListAsync();

            if (agendamentosExpiradosCliente.Any())
            {
                foreach (var agendamento in agendamentosExpiradosCliente)
                {
                    agendamento.Status = StatusAgendamento.Expirado;
                    agendamento.DataAtualizacao = agoraUtc;
                }
                await _context.SaveChangesAsync();
            }

            var agendamentosCount = await _context.Agendamentos
                .CountAsync(a => a.ClienteId == clienteId && a.DataHora > agoraUtc && a.Status == StatusAgendamento.Pendente);

            var proximoAgendamento = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Where(a => a.ClienteId == clienteId && a.DataHora > agoraUtc && a.Status == StatusAgendamento.Pendente)
                .OrderBy(a => a.DataHora)
                .FirstOrDefaultAsync();

            var agendamentosRecentesDb = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Include(a => a.AgendamentoServicos)
                .Where(a => a.ClienteId == clienteId)
                .OrderByDescending(a => a.DataHora)
                .Take(5)
                .ToListAsync();

            var barbearias = await _context.Barbearias
                .Select(b => new
                {
                    Id = b.Id,
                    Nome = b.Nome,
                    Endereco = b.Endereco,
                    Telefone = b.Telefone,
                    Email = b.Email
                })
                .ToListAsync();

            var agendamentosRecentes = agendamentosRecentesDb.Select(a => new
            {
                Id = a.Id,
                Data = AppDateTime.FormatBusinessDate(a.DataHora),
                Hora = AppDateTime.FormatBusinessTime(a.DataHora),
                Barbeiro = a.Barbeiro?.Nome ?? string.Empty,
                BarbeiroId = a.BarbeiroId,
                Barbearia = a.Barbearia?.Nome ?? string.Empty,
                BarbeariaId = a.BarbeariaId,
                Status = a.Status.ToString(),
                Preco = a.PrecoServico,
                ServicoIds = a.AgendamentoServicos?.Select(s => s.ServicoId).ToList() ?? new List<int>()
            }).ToList();

            object proximoAgendamentoObj = null;
            if (proximoAgendamento != null)
            {
                proximoAgendamentoObj = new
                {
                    Id = proximoAgendamento.Id,
                    Data = AppDateTime.FormatBusinessDate(proximoAgendamento.DataHora),
                    Hora = AppDateTime.FormatBusinessTime(proximoAgendamento.DataHora),
                    Barbeiro = proximoAgendamento.Barbeiro?.Nome ?? string.Empty,
                    BarbeiroId = proximoAgendamento.BarbeiroId,
                    Barbearia = proximoAgendamento.Barbearia?.Nome ?? string.Empty,
                    BarbeariaId = proximoAgendamento.BarbeariaId
                };
            }

            return new
            {
                Cliente = new { Id = cliente.Id, Nome = cliente.Nome, Email = cliente.Email },
                TotalAgendamentos = agendamentosCount,
                ProximoAgendamento = proximoAgendamentoObj,
                AgendamentosRecentes = agendamentosRecentes,
                Barbearias = barbearias
            };
        }

        public async Task<object> GetBarberDashboardAsync(int barbeiroId)
        {
            var barbeiro = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Id == barbeiroId && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
                return null;

            var hoje = AppDateTime.TodayInBusinessTimeZone();
            var inicioHojeUtc = AppDateTime.StartOfBusinessDayUtc(hoje);
            var fimHojeUtc = AppDateTime.EndOfBusinessDayUtcExclusive(hoje);
            var inicioSemana = AppDateTime.StartOfBusinessWeek(hoje);
            var fimSemana = inicioSemana.AddDays(7);
            var inicioSemanaUtc = AppDateTime.NormalizeClientDateTimeToUtc(inicioSemana);
            var fimSemanaUtc = AppDateTime.NormalizeClientDateTimeToUtc(fimSemana);

            var agendamentosHoje = await _context.Agendamentos
                .CountAsync(a => a.BarbeiroId == barbeiroId && a.DataHora >= inicioHojeUtc && a.DataHora < fimHojeUtc);

            var agendamentosConcluidos = await _context.Agendamentos
                .CountAsync(a => a.BarbeiroId == barbeiroId && a.DataHora >= inicioHojeUtc && a.DataHora < fimHojeUtc && a.Status == StatusAgendamento.Realizado);

            var ganhosSemana = await _context.Agendamentos
                .Include(a => a.AgendamentoServicos)
                .ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeiroId == barbeiroId && a.DataHora >= inicioSemanaUtc && a.DataHora < fimSemanaUtc &&
                           (a.Status == StatusAgendamento.Realizado || a.Status == StatusAgendamento.Atendido))
                .SumAsync(a => (a.PrecoServico.HasValue && a.PrecoServico.Value > 0)
                    ? a.PrecoServico.Value
                    : (a.AgendamentoServicos != null ? a.AgendamentoServicos.Sum(s => s.Servico != null ? s.Servico.Preco : 0) : 0));

            var agendamentosHojeDetalhesDb = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.AgendamentoServicos).ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeiroId == barbeiroId && a.DataHora >= inicioHojeUtc && a.DataHora < fimHojeUtc)
                .OrderBy(a => a.DataHora)
                .ToListAsync();

            var agendamentosHojeDetalhes = agendamentosHojeDetalhesDb
                .Select(a => new
                {
                    Id = a.Id,
                    Cliente = a.Cliente != null ? a.Cliente.Nome : string.Empty,
                    Hora = AppDateTime.FormatBusinessTime(a.DataHora),
                    Status = a.Status.ToString(),
                    Preco = a.PrecoServico,
                    TipoServico = a.AgendamentoServicos != null && a.AgendamentoServicos.Any()
                        ? string.Join(" + ", a.AgendamentoServicos.Select(s => s.Servico != null ? s.Servico.Nome : string.Empty))
                        : a.TipoServico,
                    Telefone = a.Cliente != null ? a.Cliente.Telefone : string.Empty
                })
                .ToList();

            var agendamentosRealizadosSemana = await _context.Agendamentos
                .Where(a => a.BarbeiroId == barbeiroId
                    && a.DataHora >= inicioSemanaUtc
                    && a.DataHora < fimSemanaUtc
                    && a.Status == StatusAgendamento.Realizado)
                .ToListAsync();

            var agendamentosPorDia = agendamentosRealizadosSemana
                .GroupBy(a => AppDateTime.GetBusinessDate(a.DataHora))
                .ToDictionary(g => g.Key, g => g.Count());

            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i);
                performanceSemanal[i] = agendamentosPorDia.TryGetValue(dia, out var totalDia) ? totalDia : 0;
            }

            return new
            {
                Barbeiro = new { Id = barbeiro.Id, Nome = barbeiro.Nome, Email = barbeiro.Email, Barbearia = barbeiro.Barbearia?.Nome },
                AgendamentosHoje = agendamentosHoje,
                ConcluídosHoje = agendamentosConcluidos, // Mantendo acentuação para não quebrar JSON contract atual
                GanhosSemana = ganhosSemana,
                Porcentagem = agendamentosHoje > 0 ? (agendamentosConcluidos * 100 / agendamentosHoje) : 0,
                AgendamentosDetalhes = agendamentosHojeDetalhes,
                PerformanceSemanal = performanceSemanal
            };
        }

        public async Task<object> GetManagerDashboardAsync(int managerId)
        {
            var manager = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == managerId && u.TipoUsuario == TipoUsuario.Gerente);
            if (manager == null || manager.BarbeariaId == null)
            {
                return null;
            }

            int barbeariaId = manager.BarbeariaId.Value;

            var barbearia = await _context.Barbearias.FirstOrDefaultAsync(b => b.Id == barbeariaId);
            if (barbearia == null)
                return null;

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .Select(u => new { u.Id, u.Nome, u.Email })
                .ToListAsync();

            var totalBarbeiros = barbeiros.Count;

            var hoje = AppDateTime.TodayInBusinessTimeZone();
            var inicioMes = AppDateTime.StartOfBusinessMonth(hoje);
            var fimMes = inicioMes.AddMonths(1);
            var inicioMesUtc = AppDateTime.NormalizeClientDateTimeToUtc(inicioMes);
            var fimMesUtc = AppDateTime.NormalizeClientDateTimeToUtc(fimMes);

            // Refatoração N+1: Buscar todos agendamentos relevantes do mês para a barbearia
            var agendamentosMes = await _context.Agendamentos
                .Include(a => a.AgendamentoServicos).ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= inicioMesUtc && a.DataHora < fimMesUtc)
                .ToListAsync();

            var agendamentosRealizadosMes = agendamentosMes.Where(a => a.Status == StatusAgendamento.Realizado).ToList();

            _logger.LogWarning("==== DEBUG MANAGER DASHBOARD ====");
            _logger.LogWarning("ManagerId Recebido: {ManagerId}", managerId);
            _logger.LogWarning("BarbeariaId Refletido: {BarbeariaId} ({Nome})", barbeariaId, barbearia.Nome);
            _logger.LogWarning("Filtro de Data (Mês Atual): Entre {Inicio} e {Fim}", inicioMes, fimMes);
            _logger.LogWarning("Agendamentos Recuperados Brutos no BD: {Count}", agendamentosMes.Count);
            _logger.LogWarning("Desses, qtd com Status == Realizado(4): {Count}", agendamentosRealizadosMes.Count);
            _logger.LogWarning("=============================");

            var totalAgendamentosMesBarbearia = agendamentosMes.Count;
            var agendamentosConcluidos = agendamentosRealizadosMes.Count;
            var receitaTotal = agendamentosRealizadosMes.Sum(a => a.PrecoServico ?? 
                (a.AgendamentoServicos?.Sum(s => s.Servico?.Preco ?? 0) ?? 0));

            var inicioSemana = AppDateTime.StartOfBusinessWeek(hoje);
            var performanceSemanal = new int[7];
            
            // Otimização: Agrupa em memória para a semana atual
            var agendamentosSemanaRealizados = agendamentosRealizadosMes
                .Where(a =>
                {
                    var businessDate = AppDateTime.GetBusinessDate(a.DataHora);
                    return businessDate >= inicioSemana && businessDate < inicioSemana.AddDays(7);
                })
                .GroupBy(a => AppDateTime.GetBusinessDate(a.DataHora))
                .ToDictionary(g => g.Key, g => g.Count());

            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i);
                performanceSemanal[i] = agendamentosSemanaRealizados.ContainsKey(dia) ? agendamentosSemanaRealizados[dia] : 0;
            }

            // Otimização N+1: Agrupando dados dos barbeiros em memória ao invés de buscar individualmente no banco
            var barbeirosComEstatisticas = barbeiros.Select(barbeiro =>
            {
                var agsBarbeiro = agendamentosMes.Where(a => a.BarbeiroId == barbeiro.Id).ToList();
                var realizados = agsBarbeiro.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
                var receitaMensal = realizados.Sum(a => a.PrecoServico ?? (a.AgendamentoServicos?.Sum(s => s.Servico?.Preco ?? 0) ?? 0));
                var clientesUnicos = agsBarbeiro.Select(a => a.ClienteId).Distinct().Count();
                var ultimaAtividade = agsBarbeiro.OrderByDescending(a => a.DataHora).Select(a => (DateTime?)a.DataHora).FirstOrDefault();

                return new BarbeariaSaaS.Models.DTOs.BarbeiroEstatisticaDto
                {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Email = barbeiro.Email,
                    ReceitaMensal = receitaMensal,
                    ClientesUnicos = clientesUnicos,
                    AvaliacaoMedia = 0.0m,
                    UltimaAtividade = ultimaAtividade
                };
            }).ToList();

            var pagamentosPix = agendamentosRealizadosMes.Count(a => a.MetodoPagamento == "Pix");
            var pagamentosCartao = agendamentosRealizadosMes.Count(a => a.MetodoPagamento == "Cartao");
            var pagamentosDinheiro = agendamentosRealizadosMes.Count(a => a.MetodoPagamento == "Dinheiro");

            var totalPagamentos = pagamentosPix + pagamentosCartao + pagamentosDinheiro;
            
            return new BarbeariaSaaS.Models.DTOs.ManagerDashboardDto
            {
                Barbearia = new BarbeariaSaaS.Models.DTOs.BarbeariaDataDto 
                { 
                    Id = barbearia.Id, 
                    Nome = barbearia.Nome, 
                    CodigoConvite = barbearia.CodigoConvite, 
                    CodigoBarbearia = barbearia.CodigoBarbearia, 
                    Endereco = barbearia.Endereco, 
                    Telefone = barbearia.Telefone ?? "", 
                    Email = barbearia.Email 
                },
                TotalBarbeiros = totalBarbeiros,
                AgendamentosMes = totalAgendamentosMesBarbearia,
                ConcluidosMes = agendamentosConcluidos,
                ReceitaTotal = receitaTotal,
                PerformanceSemanal = performanceSemanal,
                Barbeiros = barbeirosComEstatisticas,
                FormasPagamento = new BarbeariaSaaS.Models.DTOs.FormasPagamentoDto 
                { 
                    Pix = totalPagamentos > 0 ? (Math.Round((decimal)pagamentosPix * 100 / totalPagamentos, 1)) : 0, 
                    Cartao = totalPagamentos > 0 ? (Math.Round((decimal)pagamentosCartao * 100 / totalPagamentos, 1)) : 0, 
                    Dinheiro = totalPagamentos > 0 ? (Math.Round((decimal)pagamentosDinheiro * 100 / totalPagamentos, 1)) : 0 
                }
            };
        }

        public async Task<object> GetManagerBarbersAsync(int managerId, int userId)
        {
            var gerente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == userId && u.Id == managerId && u.TipoUsuario == TipoUsuario.Gerente);

            if (gerente == null || gerente.BarbeariaId == null)
                throw new UnauthorizedAccessException("Usuário ausente ou não tem permissão de gerente nesta barbearia");

            int barbeariaId = gerente.BarbeariaId.Value;

            var barbearia = await _context.Barbearias.FirstOrDefaultAsync(b => b.Id == barbeariaId);
            if (barbearia == null)
                throw new KeyNotFoundException("Barbearia não encontrada.");

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .ToListAsync();

            var hoje = AppDateTime.TodayInBusinessTimeZone();
            var inicioMes = AppDateTime.StartOfBusinessMonth(hoje);
            var fimMes = inicioMes.AddMonths(1);
            var inicioMesUtc = AppDateTime.NormalizeClientDateTimeToUtc(inicioMes);
            var fimMesUtc = AppDateTime.NormalizeClientDateTimeToUtc(fimMes);

            // Refatoração N+1 Similar à GetManagerDashboardAsync
            var agendamentosMes = await _context.Agendamentos
                .Include(a => a.AgendamentoServicos).ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= inicioMesUtc && a.DataHora < fimMesUtc)
                .ToListAsync();

            var barbeirosComEstatisticas = barbeiros.Select(barbeiro =>
            {
                var agsBarbeiro = agendamentosMes.Where(a => a.BarbeiroId == barbeiro.Id).ToList();
                var agsRealizados = agsBarbeiro.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
                
                var avaliacao = 0.0m; // TODO: Obter da tabela de avaliações no futuro
                if (barbeiro.Nome == "Sandro") {
                    avaliacao = 4.8m;
                } else if (barbeiro.Nome == "Diego") {
                    avaliacao = 5.0m;
                }

                return new
                {
                    Id = barbeiro.Id.ToString(),
                    Name = barbeiro.Nome,
                    Email = barbeiro.Email,
                    Phone = barbeiro.Telefone ?? "",
                    Specialties = !string.IsNullOrEmpty(barbeiro.Especialidades) ? barbeiro.Especialidades.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList() : new List<string>(),
                    Rating = avaliacao,
                    TotalClients = agsBarbeiro.Select(a => a.ClienteId).Distinct().Count(),
                    MonthlyRevenue = agsRealizados.Sum(a => a.PrecoServico ?? (a.AgendamentoServicos?.Sum(s => s.Servico?.Preco ?? 0) ?? 0)),
                    Status = "active", // Barbeiros retornados na lista da barbearia geralmente estão ativos, pode ser melhorado
                    JoinDate = barbeiro.DataCriacao.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                };
            }).ToList();

            var agsAllRealizados = agendamentosMes.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
            var totalPagamentos = agsAllRealizados.Count;
            var receitaTotal = agsAllRealizados.Sum(a => a.PrecoServico ?? (a.AgendamentoServicos?.Sum(s => s.Servico?.Preco ?? 0) ?? 0));
            
            // Calculando avaliação média da barbearia (mockado ou real)
            var sumAvaliacoes = barbeirosComEstatisticas.Sum(b => b.Rating);
            var mediaAvaliacoes = barbeirosComEstatisticas.Count > 0 ? (sumAvaliacoes / barbeirosComEstatisticas.Count) : 0;

            return new
            {
                Barbeiros = barbeirosComEstatisticas,
                Estatisticas = new
                {
                    TotalBarbeiros = barbeiros.Count,
                    BarbeirosAtivos = barbeiros.Count, // Todos considerados ativos na query base
                    ReceitaTotal = receitaTotal,
                    AvaliacaoMedia = mediaAvaliacoes
                },
                Barbearia = new { barbearia.Id, barbearia.Nome, barbearia.CodigoConvite, barbearia.CodigoBarbearia, barbearia.Endereco, barbearia.Telefone, barbearia.Email },
                FormasPagamento = new
                {
                    Pix = totalPagamentos > 0 ? (agsAllRealizados.Count(a => a.MetodoPagamento == "Pix") * 100 / totalPagamentos) : 0,
                    Cartao = totalPagamentos > 0 ? (agsAllRealizados.Count(a => a.MetodoPagamento == "Cartao") * 100 / totalPagamentos) : 0,
                    Dinheiro = totalPagamentos > 0 ? (agsAllRealizados.Count(a => a.MetodoPagamento == "Dinheiro") * 100 / totalPagamentos) : 0
                }
            };
        }
    }
}
