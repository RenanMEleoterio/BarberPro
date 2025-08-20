using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;
using System.Security.Claims;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        public DashboardController(BarbeariaContext context)
        {
            _context = context;
        }

        [HttpGet("client/{id}")]
        public async Task<ActionResult> GetClientDashboard(int id)
        {
            var cliente = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Id == id && u.TipoUsuario == TipoUsuario.Cliente);

            if (cliente == null)
                return NotFound();

            var agendamentosCount = await _context.Agendamentos
                .Where(a => a.ClienteId == id)
                .CountAsync();

            var proximoAgendamento = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Where(a => a.ClienteId == id && a.DataHora > DateTime.UtcNow)
                .OrderBy(a => a.DataHora)
                .FirstOrDefaultAsync();

            var agendamentosRecentes = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Where(a => a.ClienteId == id)
                .OrderByDescending(a => a.DataHora)
                .Take(5)
                .Select(a => new {
                    Id = a.Id,
                    Data = a.DataHora.ToString("dd/MM/yyyy"),
                    Hora = a.DataHora.ToString("HH:mm"),
                    Barbeiro = a.Barbeiro.Nome,
                    Barbearia = a.Barbearia.Nome,
                    Status = a.Status.ToString(),
                    Preco = a.PrecoServico
                })
                .ToListAsync();

            var barbearias = await _context.Barbearias
                .Select(b => new {
                    Id = b.Id,
                    Nome = b.Nome,
                    Endereco = b.Endereco,
                    Telefone = b.Telefone,
                    Email = b.Email
                })
                .ToListAsync();

            var response = new {
                Cliente = new {
                    Id = cliente.Id,
                    Nome = cliente.Nome,
                    Email = cliente.Email
                },
                TotalAgendamentos = agendamentosCount,
                ProximoAgendamento = proximoAgendamento != null ? new {
                    Id = proximoAgendamento.Id,
                    Data = proximoAgendamento.DataHora.ToString("dd/MM/yyyy"),
                    Hora = proximoAgendamento.DataHora.ToString("HH:mm"),
                    Barbeiro = proximoAgendamento.Barbeiro?.Nome,
                    Barbearia = proximoAgendamento.Barbearia?.Nome
                } : null,
                AgendamentosRecentes = agendamentosRecentes,
                Barbearias = barbearias
            };

            return Ok(response);
        }

        [HttpGet("barber/{id}")]
        public async Task<ActionResult> GetBarberDashboard(int id)
        {
            var barbeiro = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Id == id && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
                return NotFound();

            var hoje = DateTime.UtcNow.Date;
            var inicioSemana = hoje.AddDays(-(int)hoje.DayOfWeek);
            var fimSemana = inicioSemana.AddDays(7);

            var agendamentosHoje = await _context.Agendamentos
                .Where(a => a.BarbeiroId == id && a.DataHora.Date == DateTime.UtcNow.Date)
                .CountAsync();

            var agendamentosConcluidos = await _context.Agendamentos
                .Where(a => a.BarbeiroId == id && a.DataHora.Date == hoje && a.Status == StatusAgendamento.Realizado)
                .CountAsync();

            var ganhosSemana = await _context.Agendamentos
                .Where(a => a.BarbeiroId == id && 
                           a.DataHora >= inicioSemana && 
                           a.DataHora < fimSemana && 
                           a.Status == StatusAgendamento.Realizado)
                .SumAsync(a => a.PrecoServico ?? 0);

            var agendamentosHojeDetalhes = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Where(a => a.BarbeiroId == id && a.DataHora.Date == DateTime.UtcNow.Date)
                .OrderBy(a => a.DataHora)
                .Select(a => new {
                    Id = a.Id,
                    Cliente = a.Cliente.Nome,
                    Hora = a.DataHora.ToString("HH:mm"),
                    Status = a.Status.ToString(),
                    Preco = a.PrecoServico,
                    Telefone = a.Cliente.Telefone
                })
                .ToListAsync();

            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i).ToUniversalTime();
                performanceSemanal[i] = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == id && a.DataHora.Date == dia.Date && a.Status == StatusAgendamento.Realizado)
                    .CountAsync();
            }

            var response = new {
                Barbeiro = new {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Email = barbeiro.Email,
                    Barbearia = barbeiro.Barbearia?.Nome
                },
                AgendamentosHoje = agendamentosHoje,
                ConcluídosHoje = agendamentosConcluidos,
                GanhosSemana = ganhosSemana,
                Porcentagem = agendamentosHoje > 0 ? (agendamentosConcluidos * 100 / agendamentosHoje) : 0,
                AgendamentosDetalhes = agendamentosHojeDetalhes,
                PerformanceSemanal = performanceSemanal
            };

            return Ok(response);
        }

        [HttpGet("manager/{barbeariaId}")]
        public async Task<ActionResult> GetManagerDashboard(int barbeariaId)
        {
            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.Id == barbeariaId);

            if (barbearia == null)
                return NotFound();

            var totalBarbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .CountAsync();

            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = inicioMes.AddMonths(1);

            var agendamentosMes = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes)
                .CountAsync();

            var agendamentosConcluidos = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado)
                .CountAsync();

            var receitaTotal = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado)
                .SumAsync(a => a.PrecoServico ?? 0);

            var inicioSemana = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.Date.DayOfWeek);
            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i).ToUniversalTime();
                performanceSemanal[i] = await _context.Agendamentos
                    .Where(a => a.BarbeariaId == barbeariaId && 
                               a.DataHora.Date == dia.Date && 
                               a.Status == StatusAgendamento.Realizado)
                    .CountAsync();
            }

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .Select(u => new {
                    Id = u.Id,
                    Nome = u.Nome,
                    Email = u.Email
                })
                .ToListAsync();

            var barbeirosComEstatisticas = new List<object>();
            foreach (var barbeiro in barbeiros)
            {
                var agendamentosBarbeiro = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioSemana.ToUniversalTime() && 
                               a.DataHora < inicioSemana.AddDays(7).ToUniversalTime())
                    .CountAsync();

                var agendamentosConcluidosBarbeiro = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioSemana.ToUniversalTime() && 
                               a.DataHora < inicioSemana.AddDays(7).ToUniversalTime() && 
                               a.Status == StatusAgendamento.Realizado)
                    .CountAsync();

                var ganhosSemana = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioSemana.ToUniversalTime() && 
                               a.DataHora < inicioSemana.AddDays(7).ToUniversalTime() && 
                               a.Status == StatusAgendamento.Realizado)
                    .SumAsync(a => a.PrecoServico ?? 0);

                barbeirosComEstatisticas.Add(new {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Email = barbeiro.Email,
                    Porcentagem = agendamentosBarbeiro > 0 ? (agendamentosConcluidosBarbeiro * 100 / agendamentosBarbeiro) : 0,
                    GanhosSemana = ganhosSemana,
                    Agendamentos = agendamentosBarbeiro
                });
            }

            var totalPagamentos = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado)
                .CountAsync();

            var pagamentosPix = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado &&
                           a.MetodoPagamento == "Pix")
                .CountAsync();

            var pagamentosCartao = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado &&
                           a.MetodoPagamento == "Cartao")
                .CountAsync();

            var pagamentosDinheiro = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado &&
                           a.MetodoPagamento == "Dinheiro")
                .CountAsync();

            var response = new {
                Barbearia = new {
                    Id = barbearia.Id,
                    Nome = barbearia.Nome,
                    CodigoConvite = barbearia.CodigoConvite,
                    CodigoBarbearia = barbearia.CodigoBarbearia,
                    Endereco = barbearia.Endereco,
                    Telefone = barbearia.Telefone,
                    Email = barbearia.Email
                },
                TotalBarbeiros = totalBarbeiros,
                AgendamentosMes = agendamentosMes,
                ConcluídosMes = agendamentosConcluidos,
                ReceitaTotal = receitaTotal,
                PerformanceSemanal = performanceSemanal,
                Barbeiros = barbeirosComEstatisticas,
                FormasPagamento = new {
                    Pix = totalPagamentos > 0 ? (pagamentosPix * 100 / totalPagamentos) : 0,
                    Cartao = totalPagamentos > 0 ? (pagamentosCartao * 100 / totalPagamentos) : 0,
                    Dinheiro = totalPagamentos > 0 ? (pagamentosDinheiro * 100 / totalPagamentos) : 0
                }
            };

            return Ok(response);
        }

        private int? GetUserIdFromClaims()
        {
            // Tenta ClaimTypes.NameIdentifier (mapa padrão para "nameid")
            var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("NameId")?.Value
                ?? User.FindFirst("UserId")?.Value;
            if (int.TryParse(id, out var userId)) return userId;
            return null;
        }

        [HttpGet("manager/{barbeariaId}/barbers")]
        public async Task<ActionResult> GetManagerBarbers(int barbeariaId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null) return Unauthorized();

            var gerente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == userId && 
                                        u.TipoUsuario == TipoUsuario.Gerente && 
                                        u.BarbeariaId == barbeariaId);

            if (gerente == null)
                return Forbid("Acesso negado. Apenas gerentes desta barbearia podem acessar estes dados.");

            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.Id == barbeariaId);

            if (barbearia == null)
                return NotFound("Barbearia não encontrada.");

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .ToListAsync();

            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = inicioMes.AddMonths(1);

            var barbeirosDetalhados = new List<object>();
            decimal receitaTotalBarbearia = 0;
            int totalClientesUnicos = 0;
            double somaAvaliacoes = 0;
            int totalAvaliacoes = 0;

            foreach (var barbeiro in barbeiros)
            {
                var agendamentosMes = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioMes && 
                               a.DataHora < fimMes)
                    .ToListAsync();

                var agendamentosRealizados = agendamentosMes
                    .Where(a => a.Status == StatusAgendamento.Realizado)
                    .ToList();

                var receitaMensal = agendamentosRealizados
                    .Sum(a => a.PrecoServico ?? 0);

                var clientesUnicos = agendamentosMes
                    .Select(a => a.ClienteId)
                    .Distinct()
                    .Count();

                // Avaliação média fica 0 por ora (sem mock)
                var avaliacaoMedia = 0.0;

                var ultimaAtividade = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id)
                    .OrderByDescending(a => a.DataHora)
                    .Select(a => a.DataHora)
                    .FirstOrDefaultAsync();

                var status = (ultimaAtividade != default(DateTime) && (DateTime.UtcNow - ultimaAtividade).TotalDays <= 30)
                    ? "active" : "inactive";

                barbeirosDetalhados.Add(new
                {
                    Id = barbeiro.Id,
                    Name = barbeiro.Nome,
                    Email = barbeiro.Email,
                    Phone = string.Empty,
                    Specialties = new List<string>(),
                    Rating = avaliacaoMedia,
                    TotalClients = clientesUnicos,
                    MonthlyRevenue = receitaMensal,
                    Status = status,
                    JoinDate = barbeiro.DataCriacao.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                });

                receitaTotalBarbearia += receitaMensal;
                totalClientesUnicos += clientesUnicos;
                somaAvaliacoes += avaliacaoMedia;
                totalAvaliacoes++;
            }

            var estatisticas = new
            {
                TotalBarbeiros = barbeiros.Count,
                BarbeirosAtivos = barbeirosDetalhados.Count(b => (string)b.GetType().GetProperty("Status").GetValue(b) == "active"),
                ReceitaTotal = receitaTotalBarbearia,
                AvaliacaoMedia = totalAvaliacoes > 0 ? somaAvaliacoes / totalAvaliacoes : 0
            };

            return Ok(new { Barbeiros = barbeirosDetalhados, Estatisticas = estatisticas });
        }

        [HttpGet("manager/{barbeariaId}/stats")]
        public async Task<ActionResult> GetManagerStats(int barbeariaId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null) return Unauthorized();

            var gerente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == userId && 
                                        u.TipoUsuario == TipoUsuario.Gerente && 
                                        u.BarbeariaId == barbeariaId);

            if (gerente == null)
                return Forbid("Acesso negado. Apenas gerentes desta barbearia podem acessar estes dados.");

            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.Id == barbeariaId);

            if (barbearia == null)
                return NotFound("Barbearia não encontrada.");

            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = inicioMes.AddMonths(1);

            var agendamentosMes = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes)
                .CountAsync();

            var agendamentosConcluidos = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado)
                .CountAsync();

            var receitaTotal = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado)
                .SumAsync(a => a.PrecoServico ?? 0);

            var inicioSemana = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.Date.DayOfWeek);
            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i).ToUniversalTime();
                performanceSemanal[i] = await _context.Agendamentos
                    .Where(a => a.BarbeariaId == barbeariaId && 
                               a.DataHora.Date == dia.Date && 
                               a.Status == StatusAgendamento.Realizado)
                    .CountAsync();
            }

            var totalPagamentos = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado)
                .CountAsync();

            var pagamentosPix = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado &&
                           a.MetodoPagamento == "Pix")
                .CountAsync();

            var pagamentosCartao = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado &&
                           a.MetodoPagamento == "Cartao")
                .CountAsync();

            var pagamentosDinheiro = await _context.Agendamentos
                .Where(a => a.BarbeariaId == barbeariaId && 
                           a.DataHora >= inicioMes && 
                           a.DataHora < fimMes && 
                           a.Status == StatusAgendamento.Realizado &&
                           a.MetodoPagamento == "Dinheiro")
                .CountAsync();

            var response = new {
                TotalBarbeiros = await _context.Usuarios.Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro).CountAsync(),
                AgendamentosMes = agendamentosMes,
                ConcluidosMes = agendamentosConcluidos,
                ReceitaTotal = receitaTotal,
                PerformanceSemanal = performanceSemanal,
                FormasPagamento = new {
                    Pix = totalPagamentos > 0 ? (pagamentosPix * 100 / totalPagamentos) : 0,
                    Cartao = totalPagamentos > 0 ? (pagamentosCartao * 100 / totalPagamentos) : 0,
                    Dinheiro = totalPagamentos > 0 ? (pagamentosDinheiro * 100 / totalPagamentos) : 0
                }
            };

            return Ok(response);
        }
    }
}


