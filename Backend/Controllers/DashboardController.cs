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

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) para permitir a interação com o Entity Framework Core.
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public DashboardController(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retorna os dados do dashboard para um cliente específico.
        /// Inclui o total de agendamentos, o próximo agendamento, uma lista de agendamentos recentes e uma lista de barbearias disponíveis.
        /// </summary>
        /// <param name="id">O ID do cliente.</param>
        /// <returns>ActionResult contendo um objeto anônimo com os dados do dashboard do cliente ou NotFound se o cliente não for encontrado.</returns>
        [HttpGet("client/{id}")]
        public async Task<ActionResult> GetClientDashboard(int id)
        {
            var cliente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == id && u.TipoUsuario == TipoUsuario.Cliente);

            if (cliente == null)
                return NotFound();

            var agoraUtc = DateTime.UtcNow;

            var agendamentosExpiradosCliente = await _context.Agendamentos
                .Where(a => a.ClienteId == id
                            && a.DataHora <= agoraUtc
                            && a.Status == StatusAgendamento.Pendente)
                .ToListAsync();

            if (agendamentosExpiradosCliente.Count > 0)
            {
                foreach (var agendamento in agendamentosExpiradosCliente)
                {
                    agendamento.Status = StatusAgendamento.Expirado;
                    agendamento.DataAtualizacao = agoraUtc;
                }

                await _context.SaveChangesAsync();
            }

            // Conta apenas agendamentos futuros que estão Pendentes (conforme solicitado: "somente os agendamentos pendendes")
            // Agendamentos Confirmados NÃO entram nesta contagem.
            var agendamentosCount = await _context.Agendamentos
                .Where(a => a.ClienteId == id
                            && a.DataHora > agoraUtc
                            && a.Status == StatusAgendamento.Pendente)
                .CountAsync();

            var proximoAgendamento = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Where(a => a.ClienteId == id && a.DataHora > DateTime.UtcNow && a.Status == StatusAgendamento.Pendente)
                .OrderBy(a => a.DataHora)
                .FirstOrDefaultAsync();

            var agendamentosRecentesDb = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Where(a => a.ClienteId == id)
                .OrderByDescending(a => a.DataHora)
                .Take(5)
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

            // Ajuste de fuso horário (UTC para BRT -3) - REMOVIDO: O frontend/banco já tratam o horário corretamente
            var agendamentosRecentes = agendamentosRecentesDb.Select(a => {
                var dataLocal = a.DataHora;
                return new {
                    Id = a.Id,
                    Data = dataLocal.ToString("dd/MM/yyyy"),
                    Hora = dataLocal.ToString("HH:mm"),
                    Barbeiro = a.Barbeiro.Nome,
                    Barbearia = a.Barbearia.Nome,
                    Status = a.Status.ToString(),
                    Preco = a.PrecoServico
                };
            }).ToList();

            object proximoAgendamentoObj = null;
            if (proximoAgendamento != null)
            {
                var dataLocal = proximoAgendamento.DataHora;
                proximoAgendamentoObj = new {
                    Id = proximoAgendamento.Id,
                    Data = dataLocal.ToString("dd/MM/yyyy"),
                    Hora = dataLocal.ToString("HH:mm"),
                    Barbeiro = proximoAgendamento.Barbeiro?.Nome,
                    Barbearia = proximoAgendamento.Barbearia?.Nome
                };
            }

            var response = new {
                Cliente = new {
                    Id = cliente.Id,
                    Nome = cliente.Nome,
                    Email = cliente.Email
                },
                TotalAgendamentos = agendamentosCount,
                ProximoAgendamento = proximoAgendamentoObj,
                AgendamentosRecentes = agendamentosRecentes,
                Barbearias = barbearias
            };

            return Ok(response);
        }

        /// <summary>
        /// Retorna os dados do dashboard para um barbeiro específico.
        /// Inclui o número de agendamentos para o dia atual, agendamentos concluídos, ganhos na semana,
        /// porcentagem de conclusão e um detalhamento dos agendamentos do dia, além de uma performance semanal.
        /// </summary>
        /// <param name="id">O ID do barbeiro.</param>
        /// <returns>ActionResult contendo um objeto anônimo com os dados do dashboard do barbeiro ou NotFound se o barbeiro não for encontrado.</returns>
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
                .Include(a => a.AgendamentoServicos)
                .ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeiroId == id && 
                           a.DataHora >= inicioSemana && 
                           a.DataHora < fimSemana && 
                           (a.Status == StatusAgendamento.Realizado || a.Status == StatusAgendamento.Atendido))
                .SumAsync(a => (a.PrecoServico.HasValue && a.PrecoServico.Value > 0) 
                    ? a.PrecoServico.Value 
                    : (a.AgendamentoServicos != null ? a.AgendamentoServicos.Sum(s => s.Servico.Preco) : 0));

            // Logs de depuração
            Console.WriteLine($"[Dashboard] Calculando ganhos semanais para Barbeiro ID: {id}");
            Console.WriteLine($"[Dashboard] Período: {inicioSemana} a {fimSemana}");
            Console.WriteLine($"[Dashboard] Ganhos calculados: {ganhosSemana}");

            var agendamentosHojeDetalhes = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.AgendamentoServicos)
                    .ThenInclude(asv => asv.Servico)
                .Where(a => a.BarbeiroId == id && a.DataHora.Date == DateTime.UtcNow.Date)
                .OrderBy(a => a.DataHora)
                .Select(a => new {
                    Id = a.Id,
                    Cliente = a.Cliente.Nome,
                    Hora = a.DataHora.ToString("HH:mm"),
                    Status = a.Status.ToString(),
                    Preco = a.PrecoServico,
                    TipoServico = a.AgendamentoServicos != null && a.AgendamentoServicos.Any() 
                        ? string.Join(" + ", a.AgendamentoServicos.Select(s => s.Servico.Nome)) 
                        : a.TipoServico,
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

        /// <summary>
        /// Retorna os dados do dashboard para um gerente de uma barbearia específica.
        /// Inclui o total de barbeiros, agendamentos do mês, agendamentos concluídos, receita total,
        /// performance semanal da barbearia, estatísticas detalhadas por barbeiro e a distribuição de formas de pagamento.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <returns>ActionResult contendo um objeto anônimo com os dados do dashboard do gerente ou NotFound se a barbearia não for encontrada.</returns>
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

            var totalAgendamentosMesBarbearia = await _context.Agendamentos
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
            decimal receitaTotalBarbearia = 0;
            int totalClientesUnicos = 0;
            double somaAvaliacoes = 0;
            int totalAvaliacoes = 0;

            foreach (var barbeiro in barbeiros)
            {
                var agendamentosDoBarbeiro = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioMes && 
                               a.DataHora < fimMes)
                    .ToListAsync();

                var agendamentosRealizados = agendamentosDoBarbeiro
                    .Where(a => a.Status == StatusAgendamento.Realizado)
                    .ToList();

                var receitaMensal = agendamentosRealizados
                    .Sum(a => a.PrecoServico ?? 0);

                var clientesUnicos = agendamentosDoBarbeiro
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

                barbeirosComEstatisticas.Add(new {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Email = barbeiro.Email,
                    ReceitaMensal = receitaMensal,
                    ClientesUnicos = clientesUnicos,
                    AvaliacaoMedia = avaliacaoMedia,
                    UltimaAtividade = ultimaAtividade
                });

                receitaTotalBarbearia += receitaMensal;
                totalClientesUnicos += clientesUnicos;
                // somaAvaliacoes += avaliacaoMedia; // Somar avaliações reais
                // totalAvaliacoes++; // Contar avaliações reais
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

                FormasPagamento = new {
                    Pix = totalPagamentos > 0 ? (pagamentosPix * 100 / totalPagamentos) : 0,
                    Cartao = totalPagamentos > 0 ? (pagamentosCartao * 100 / totalPagamentos) : 0,
                    Dinheiro = totalPagamentos > 0 ? (pagamentosDinheiro * 100 / totalPagamentos) : 0
                }
            };

            return Ok(response);
        }

        /// <summary>
        /// Função auxiliar privada para extrair o ID do usuário dos claims do token JWT.
        /// Tenta diferentes nomes de claims para compatibilidade.
        /// </summary>
        /// <returns>Um inteiro anulável (int?) representando o ID do usuário, ou null se não for encontrado.</returns>
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

        /// <summary>
        /// Retorna uma lista detalhada de barbeiros para um gerente de uma barbearia específica,
        /// incluindo estatísticas como agendamentos mensais, receita mensal, clientes únicos e última atividade.
        /// Requer que o usuário logado seja um gerente da barbearia especificada.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <returns>ActionResult contendo uma lista de objetos anônimos com os detalhes e estatísticas dos barbeiros,
        /// ou Unauthorized/Forbid/NotFound em caso de erro de permissão ou barbearia não encontrada.</returns>
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
                var agendamentosDoBarbeiro = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.DataHora >= inicioMes && 
                               a.DataHora < fimMes)
                    .ToListAsync();

                var agendamentosRealizados = agendamentosDoBarbeiro
                    .Where(a => a.Status == StatusAgendamento.Realizado)
                    .ToList();

                var receitaMensal = agendamentosRealizados
                    .Sum(a => a.PrecoServico ?? 0);

                var clientesUnicos = agendamentosDoBarbeiro
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

                barbeirosDetalhados.Add(new {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Email = barbeiro.Email,
                    ReceitaMensal = receitaMensal,
                    ClientesUnicos = clientesUnicos,
                    AvaliacaoMedia = avaliacaoMedia,
                    UltimaAtividade = ultimaAtividade
                });

                receitaTotalBarbearia += receitaMensal;
                totalClientesUnicos += clientesUnicos;
                // somaAvaliacoes += avaliacaoMedia; // Somar avaliações reais
                // totalAvaliacoes++; // Contar avaliações reais
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


