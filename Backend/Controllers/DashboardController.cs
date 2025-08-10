using System;
using System.Collections.Generic;
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

            var hoje = DateTime.Today;
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
                    Telefone = "(11) 99999-9999" // Mock - adicionar campo no modelo se necessário
                })
                .ToListAsync();

            // Dados para gráfico de performance semanal
            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i);
                performanceSemanal[i] = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == id && a.DataHora.Date == dia && a.Status == StatusAgendamento.Realizado)
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

            var hoje = DateTime.Today;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
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

            // Performance semanal para gráfico
            var inicioSemana = hoje.AddDays(-(int)hoje.DayOfWeek);
            var performanceSemanal = new int[7];
            for (int i = 0; i < 7; i++)
            {
                var dia = inicioSemana.AddDays(i);
                performanceSemanal[i] = await _context.Agendamentos
                    .Where(a => a.BarbeariaId == barbeariaId && 
                               a.DataHora.Date == dia && 
                               a.Status == StatusAgendamento.Realizado)
                    .CountAsync();
            }

            // Lista de barbeiros com cálculos reais
            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .Select(u => new {
                    Id = u.Id,
                    Nome = u.Nome,
                    Email = u.Email
                })
                .ToListAsync();

            // Calcular estatísticas reais para cada barbeiro
            var barbeirosComEstatisticas = new List<object>();
            foreach (var barbeiro in barbeiros)
            {
                var agendamentosBarbeiro = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioSemana && 
                               a.DataHora < inicioSemana.AddDays(7))
                    .CountAsync();

                var agendamentosConcluidosBarbeiro = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioSemana && 
                               a.DataHora < inicioSemana.AddDays(7) && 
                               a.Status == StatusAgendamento.Realizado)
                    .CountAsync();

                var ganhosSemana = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioSemana && 
                               a.DataHora < inicioSemana.AddDays(7) && 
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

            // Calcular formas de pagamento reais
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
    }
}

