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

            var agoraUtc = DateTime.UtcNow;

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
                Data = a.DataHora.ToString("dd/MM/yyyy"),
                Hora = a.DataHora.ToString("HH:mm"),
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
                    Data = proximoAgendamento.DataHora.ToString("dd/MM/yyyy"),
                    Hora = proximoAgendamento.DataHora.ToString("HH:mm"),
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

            var hoje = DateTime.UtcNow.Date;
            var inicioSemana = hoje.AddDays(-(int)hoje.DayOfWeek);
            var fimSemana = inicioSemana.AddDays(7);

            var agendamentosHoje = await _context.Agendamentos
                .CountAsync(a => a.BarbeiroId == barbeiroId && a.DataHora.Date == hoje);

            var agendamentosConcluidos = await _context.Agendamentos
                .CountAsync(a => a.BarbeiroId == barbeiroId && a.DataHora.Date == hoje && a.Status == StatusAgendamento.Realizado);

            var ganhosSemana = await _context.Agendamentos
                .Include(a => a.AgendamentoServicos)
                .ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeiroId == barbeiroId && a.DataHora >= inicioSemana && a.DataHora < fimSemana &&
                           (a.Status == StatusAgendamento.Realizado || a.Status == StatusAgendamento.Atendido))
                .SumAsync(a => (a.PrecoServico.HasValue && a.PrecoServico.Value > 0)
                    ? a.PrecoServico.Value
                    : (a.AgendamentoServicos != null ? a.AgendamentoServicos.Sum(s => s.Servico != null ? s.Servico.Preco : 0) : 0));

            var agendamentosHojeDetalhes = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.AgendamentoServicos).ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeiroId == barbeiroId && a.DataHora.Date == hoje)
                .OrderBy(a => a.DataHora)
                .Select(a => new
                {
                    Id = a.Id,
                    Cliente = a.Cliente != null ? a.Cliente.Nome : string.Empty,
                    Hora = a.DataHora.ToString("HH:mm"),
                    Status = a.Status.ToString(),
                    Preco = a.PrecoServico,
                    TipoServico = a.AgendamentoServicos != null && a.AgendamentoServicos.Any()
                        ? string.Join(" + ", a.AgendamentoServicos.Select(s => s.Servico != null ? s.Servico.Nome : string.Empty))
                        : a.TipoServico,
                    Telefone = a.Cliente != null ? a.Cliente.Telefone : string.Empty
                }).ToListAsync();

            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i).ToUniversalTime();
                performanceSemanal[i] = await _context.Agendamentos
                    .CountAsync(a => a.BarbeiroId == barbeiroId && a.DataHora.Date == dia.Date && a.Status == StatusAgendamento.Realizado);
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

        public async Task<object> GetManagerDashboardAsync(int barbeariaId)
        {
            var barbearia = await _context.Barbearias.FirstOrDefaultAsync(b => b.Id == barbeariaId);
            if (barbearia == null)
                return null;

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .Select(u => new { u.Id, u.Nome, u.Email })
                .ToListAsync();

            var totalBarbeiros = barbeiros.Count;

            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = inicioMes.AddMonths(1);

            // Refatoração N+1: Buscar todos agendamentos relevantes do mês para a barbearia
            var agendamentosMes = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= inicioMes && a.DataHora < fimMes)
                .Select(a => new { a.Id, a.BarbeiroId, a.Status, a.PrecoServico, a.MetodoPagamento, a.DataHora, a.ClienteId })
                .ToListAsync();

            var agendamentosRealizadosMes = agendamentosMes.Where(a => a.Status == StatusAgendamento.Realizado).ToList();

            var totalAgendamentosMesBarbearia = agendamentosMes.Count;
            var agendamentosConcluidos = agendamentosRealizadosMes.Count;
            var receitaTotal = agendamentosRealizadosMes.Sum(a => a.PrecoServico ?? 0);

            var inicioSemana = hoje.AddDays(-(int)hoje.DayOfWeek);
            var performanceSemanal = new int[7];
            
            // Otimização: Agrupa em memória para a semana atual
            var agendamentosSemanaRealizados = agendamentosRealizadosMes
                .Where(a => a.DataHora.Date >= inicioSemana && a.DataHora.Date < inicioSemana.AddDays(7))
                .GroupBy(a => a.DataHora.Date)
                .ToDictionary(g => g.Key, g => g.Count());

            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i).Date;
                performanceSemanal[i] = agendamentosSemanaRealizados.ContainsKey(dia) ? agendamentosSemanaRealizados[dia] : 0;
            }

            // Otimização N+1: Agrupando dados dos barbeiros em memória ao invés de buscar individualmente no banco
            var barbeirosComEstatisticas = barbeiros.Select(barbeiro =>
            {
                var agsBarbeiro = agendamentosMes.Where(a => a.BarbeiroId == barbeiro.Id).ToList();
                var realizados = agsBarbeiro.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
                var receitaMensal = realizados.Sum(a => a.PrecoServico ?? 0);
                var clientesUnicos = agsBarbeiro.Select(a => a.ClienteId).Distinct().Count();
                var ultimaAtividade = agsBarbeiro.OrderByDescending(a => a.DataHora).Select(a => (DateTime?)a.DataHora).FirstOrDefault();

                return new
                {
                    barbeiro.Id,
                    barbeiro.Nome,
                    barbeiro.Email,
                    ReceitaMensal = receitaMensal,
                    ClientesUnicos = clientesUnicos,
                    AvaliacaoMedia = 0.0,
                    UltimaAtividade = ultimaAtividade
                };
            }).ToList();

            var pagamentosPix = agendamentosRealizadosMes.Count(a => a.MetodoPagamento == "Pix");
            var pagamentosCartao = agendamentosRealizadosMes.Count(a => a.MetodoPagamento == "Cartao");
            var pagamentosDinheiro = agendamentosRealizadosMes.Count(a => a.MetodoPagamento == "Dinheiro");

            return new
            {
                Barbearia = new { barbearia.Id, barbearia.Nome, barbearia.CodigoConvite, barbearia.CodigoBarbearia, barbearia.Endereco, barbearia.Telefone, barbearia.Email },
                TotalBarbeiros = totalBarbeiros,
                AgendamentosMes = totalAgendamentosMesBarbearia,
                ConcluidosMes = agendamentosConcluidos,
                ReceitaTotal = receitaTotal,
                PerformanceSemanal = performanceSemanal,
                Barbeiros = barbeirosComEstatisticas,
                FormasPagamento = new { Pix = pagamentosPix, Cartao = pagamentosCartao, Dinheiro = pagamentosDinheiro }
            };
        }

        public async Task<object> GetManagerBarbersAsync(int barbeariaId, int userId)
        {
            var gerente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == userId && u.TipoUsuario == TipoUsuario.Gerente && u.BarbeariaId == barbeariaId);

            if (gerente == null)
                throw new UnauthorizedAccessException("Usuário ausente ou não tem permissão nesta barbearia");

            var barbearia = await _context.Barbearias.FirstOrDefaultAsync(b => b.Id == barbeariaId);
            if (barbearia == null)
                throw new KeyNotFoundException("Barbearia não encontrada.");

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .ToListAsync();

            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = inicioMes.AddMonths(1);

            // Refatoração N+1 Similar à GetManagerDashboardAsync
            var agendamentosMes = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && a.DataHora >= inicioMes && a.DataHora < fimMes)
                .Select(a => new { a.BarbeiroId, a.Status, a.PrecoServico, a.MetodoPagamento, a.DataHora, a.ClienteId })
                .ToListAsync();

            var barbeirosComEstatisticas = barbeiros.Select(barbeiro =>
            {
                var agsBarbeiro = agendamentosMes.Where(a => a.BarbeiroId == barbeiro.Id).ToList();
                var agsRealizados = agsBarbeiro.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
                
                return new
                {
                    barbeiro.Id,
                    barbeiro.Nome,
                    barbeiro.Email,
                    ReceitaMensal = agsRealizados.Sum(a => a.PrecoServico ?? 0),
                    ClientesUnicos = agsBarbeiro.Select(a => a.ClienteId).Distinct().Count(),
                    AvaliacaoMedia = 0.0,
                    UltimaAtividade = agsBarbeiro.OrderByDescending(a => a.DataHora).Select(a => (DateTime?)a.DataHora).FirstOrDefault()
                };
            }).ToList();

            var agsAllRealizados = agendamentosMes.Where(a => a.Status == StatusAgendamento.Realizado).ToList();
            var totalPagamentos = agsAllRealizados.Count;

            return new
            {
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
