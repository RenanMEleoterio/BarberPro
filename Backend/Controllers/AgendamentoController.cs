using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.DTOs;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AgendamentoController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        public AgendamentoController(BarbeariaContext context)
        {
            _context = context;
        }

        private int GetUsuarioId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private int? GetBarbeariaId()
        {
            var barbeariaIdClaim = User.FindFirst("BarbeariaId")?.Value;
            return barbeariaIdClaim != null ? int.Parse(barbeariaIdClaim) : null;
        }

        private string GetTipoUsuario()
        {
            return User.FindFirst("TipoUsuario")?.Value ?? "";
        }

        [HttpGet("barbeiros")]
        public async Task<ActionResult<List<BarbeiroDto>>> GetBarbeiros()
        {
            var tipoUsuario = GetTipoUsuario();
            IQueryable<Usuario> query = _context.Usuarios.Where(u => u.TipoUsuario == TipoUsuario.Barbeiro);

            if (tipoUsuario == "Cliente")
            {
                // Clientes podem ver todos os barbeiros de todas as barbearias
                // ou podemos adicionar um filtro por barbeariaId se for passado na query string
                // Por enquanto, retorna todos os barbeiros.
            }
            else
            {
                var barbeariaId = GetBarbeariaId();
                if (!barbeariaId.HasValue)
                {
                    return BadRequest(new { message = "Usuário não está vinculado a uma barbearia" });
                }
                query = query.Where(u => u.BarbeariaId == barbeariaId);
            }

            var barbeiros = await query
                .Include(u => u.HorariosDisponiveis.Where(h => h.EstaDisponivel && h.DataHora > DateTime.UtcNow))
                .ToListAsync();

            var result = new List<BarbeiroDto>();

            foreach (var barbeiro in barbeiros)
            {
                // Buscar agendamentos confirmados para este barbeiro
                var agendamentosConfirmados = await _context.Agendamentos
                    .Where(a => a.BarbeiroId == barbeiro.Id && 
                               a.Status == StatusAgendamento.Confirmado &&
                               a.DataHora > DateTime.UtcNow)
                    .Select(a => a.DataHora)
                    .ToListAsync();

                // Filtrar horários que não têm agendamentos confirmados
                var horariosDisponiveis = barbeiro.HorariosDisponiveis
                    .Where(h => !agendamentosConfirmados.Contains(h.DataHora))
                    .Select(h => new HorarioDisponivelDto
                    {
                        Id = h.Id,
                        DataHora = h.DataHora,
                        BarbeiroId = h.BarbeiroId,
                        NomeBarbeiro = barbeiro.Nome,
                        EstaDisponivel = true
                    }).ToList();

                result.Add(new BarbeiroDto
                {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Foto = barbeiro.Foto,
                    Especialidades = barbeiro.Especialidades,
                    Descricao = barbeiro.Descricao,
                    HorariosDisponiveis = horariosDisponiveis
                });
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<AgendamentoDto>> CriarAgendamento(CriarAgendamentoDto criarDto)
        {
            var clienteId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            if (tipoUsuario != "Cliente")
            {
                return Forbid("Apenas clientes podem criar agendamentos");
            }

            // Validar se a data/hora não é no passado
            var dataHoraUtc = DateTime.SpecifyKind(criarDto.DataHora, DateTimeKind.Utc);
            if (dataHoraUtc <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "Não é possível agendar para uma data/hora no passado" });
            }

            var barbeiro = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Id == criarDto.BarbeiroId && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
            {
                return BadRequest(new { message = "Barbeiro não encontrado" });
            }

            // Verificar se o cliente já tem um agendamento confirmado para o mesmo horário (com qualquer barbeiro)
            var clienteTemAgendamento = await _context.Agendamentos
                .AnyAsync(a => a.ClienteId == clienteId && 
                              a.DataHora == dataHoraUtc && 
                              a.Status == StatusAgendamento.Confirmado);

            if (clienteTemAgendamento)
            {
                return BadRequest(new { message = "Você já possui um agendamento confirmado para este horário" });
            }

            // Verificar se já existe agendamento confirmado para este barbeiro neste horário
            var barbeiroTemAgendamento = await _context.Agendamentos
                .AnyAsync(a => a.BarbeiroId == criarDto.BarbeiroId && 
                              a.DataHora == dataHoraUtc && 
                              a.Status == StatusAgendamento.Confirmado);

            if (barbeiroTemAgendamento)
            {
                return BadRequest(new { message = "Este horário já está ocupado. Por favor, escolha outro horário disponível" });
            }

            // Verificar se existe um horário disponível para este barbeiro nesta data/hora
            var horarioDisponivel = await _context.HorariosDisponiveis
                .FirstOrDefaultAsync(h => h.BarbeiroId == criarDto.BarbeiroId && 
                                         h.DataHora == dataHoraUtc && 
                                         h.EstaDisponivel);

            if (horarioDisponivel == null)
            {
                return BadRequest(new { message = "Horário não disponível para este barbeiro" });
            }

            var agendamento = new Agendamento
            {
                ClienteId = clienteId,
                BarbeiroId = criarDto.BarbeiroId,
                DataHora = dataHoraUtc,
                Observacoes = criarDto.Observacoes,
                BarbeariaId = barbeiro.BarbeariaId.Value,
                Status = StatusAgendamento.Confirmado,
                TipoServico = criarDto.TipoServico,
                HorarioDisponivelId = horarioDisponivel.Id
            };

            _context.Agendamentos.Add(agendamento);

            // Marcar o horário como indisponível
            horarioDisponivel.EstaDisponivel = false;

            await _context.SaveChangesAsync();

            var agendamentoDto = await _context.Agendamentos
                .Where(a => a.Id == agendamento.Id)
                .Include(a => a.Cliente)
                .Include(a => a.Barbeiro)
                .Select(a => new AgendamentoDto
                {
                    Id = a.Id,
                    ClienteId = a.ClienteId,
                    NomeCliente = a.Cliente.Nome,
                    EmailCliente = a.Cliente.Email,
                    BarbeiroId = a.BarbeiroId,
                    NomeBarbeiro = a.Barbeiro.Nome,
                    DataHora = a.DataHora,
                    Observacoes = a.Observacoes,
                    Status = a.Status.ToString(),
                    DataCriacao = a.DataCriacao
                })
                .FirstAsync();

            return Ok(agendamentoDto);
        }

        [HttpGet("meus-agendamentos")]
        public async Task<ActionResult<List<AgendamentoDto>>> GetMeusAgendamentos()
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            IQueryable<Agendamento> query = _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Barbeiro);

            if (tipoUsuario == "Cliente")
            {
                query = query.Where(a => a.ClienteId == usuarioId);
            }
            else if (tipoUsuario == "Barbeiro")
            {
                query = query.Where(a => a.BarbeiroId == usuarioId);
            }
            else if (tipoUsuario == "Gerente")
            {
                var barbeariaId = GetBarbeariaId();
                query = query.Where(a => a.BarbeariaId == barbeariaId);
            }
            else
            {
                return Forbid();
            }

            var agendamentos = await query
                .OrderByDescending(a => a.DataHora)
                .Select(a => new AgendamentoDto
                {
                    Id = a.Id,
                    ClienteId = a.ClienteId,
                    NomeCliente = a.Cliente.Nome,
                    EmailCliente = a.Cliente.Email,
                    BarbeiroId = a.BarbeiroId,
                    NomeBarbeiro = a.Barbeiro.Nome,
                    DataHora = a.DataHora,
                    Observacoes = a.Observacoes,
                    Status = a.Status.ToString(),
                    DataCriacao = a.DataCriacao
                })
                .ToListAsync();

            return Ok(agendamentos);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<AgendamentoDto>> AtualizarAgendamento(int id, AtualizarAgendamentoDto atualizarDto)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            var agendamento = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Barbeiro)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (agendamento == null)
            {
                return NotFound();
            }

            // Verificar permissões
            if (tipoUsuario == "Cliente" && agendamento.ClienteId != usuarioId)
            {
                return Forbid();
            }
            else if (tipoUsuario == "Barbeiro" && agendamento.BarbeiroId != usuarioId)
            {
                return Forbid();
            }
            else if (tipoUsuario == "Gerente")
            {
                var barbeariaId = GetBarbeariaId();
                if (agendamento.BarbeariaId != barbeariaId)
                {
                    return Forbid();
                }
            }

            // Atualizar campos
            if (atualizarDto.NovaDataHora.HasValue)
            {
                agendamento.DataHora = atualizarDto.NovaDataHora.Value;
            }

            if (!string.IsNullOrEmpty(atualizarDto.Observacoes))
            {
                agendamento.Observacoes = atualizarDto.Observacoes;
            }

            if (atualizarDto.Status.HasValue)
            {
                agendamento.Status = atualizarDto.Status.Value;
            }

            agendamento.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var agendamentoDto = new AgendamentoDto
            {
                Id = agendamento.Id,
                ClienteId = agendamento.ClienteId,
                NomeCliente = agendamento.Cliente.Nome,
                EmailCliente = agendamento.Cliente.Email,
                BarbeiroId = agendamento.BarbeiroId,
                NomeBarbeiro = agendamento.Barbeiro.Nome,
                DataHora = agendamento.DataHora,
                Observacoes = agendamento.Observacoes,
                Status = agendamento.Status.ToString(),
                DataCriacao = agendamento.DataCriacao
            };

            return Ok(agendamentoDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelarAgendamento(int id)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            var agendamento = await _context.Agendamentos
                .FirstOrDefaultAsync(a => a.Id == id);

            if (agendamento == null)
            {
                return NotFound(new { message = "Agendamento não encontrado" });
            }

            // Verificar permissões
            if (tipoUsuario == "Cliente" && agendamento.ClienteId != usuarioId)
            {
                return Forbid("Você não tem permissão para cancelar este agendamento");
            }
            else if (tipoUsuario == "Barbeiro" && agendamento.BarbeiroId != usuarioId)
            {
                return Forbid("Você não tem permissão para cancelar este agendamento");
            }
            else if (tipoUsuario == "Gerente")
            {
                var barbeariaId = GetBarbeariaId();
                if (agendamento.BarbeariaId != barbeariaId)
                {
                    return Forbid("Você não tem permissão para cancelar este agendamento");
                }
            }

            // Verificar se o agendamento pode ser cancelado (não está no passado)
            if (agendamento.DataHora <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "Não é possível cancelar agendamentos que já passaram" });
            }

            // Verificar se o agendamento já foi cancelado
            if (agendamento.Status == StatusAgendamento.Cancelado)
            {
                return BadRequest(new { message = "Este agendamento já foi cancelado" });
            }

            agendamento.Status = StatusAgendamento.Cancelado;
            agendamento.DataAtualizacao = DateTime.UtcNow;

            // Liberar horário - buscar pelo HorarioDisponivelId se existir, senão buscar por data/hora
            HorarioDisponivel horario = null;
            
            if (agendamento.HorarioDisponivelId.HasValue)
            {
                horario = await _context.HorariosDisponiveis
                    .FirstOrDefaultAsync(h => h.Id == agendamento.HorarioDisponivelId.Value);
            }
            else
            {
                horario = await _context.HorariosDisponiveis
                    .FirstOrDefaultAsync(h => h.BarbeiroId == agendamento.BarbeiroId && h.DataHora == agendamento.DataHora);
            }

            if (horario != null)
            {
                horario.EstaDisponivel = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Agendamento cancelado com sucesso" });
        }
    }
}

