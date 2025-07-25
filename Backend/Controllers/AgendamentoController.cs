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
            var barbeariaId = GetBarbeariaId();
            if (!barbeariaId.HasValue)
            {
                return BadRequest(new { message = "Usuário não está vinculado a uma barbearia" });
            }

            var barbeiros = await _context.Usuarios
                .Where(u => u.TipoUsuario == TipoUsuario.Barbeiro && u.BarbeariaId == barbeariaId)
                .Include(u => u.HorariosDisponiveis.Where(h => h.EstaDisponivel && h.DataHora > DateTime.Now))
                .Select(u => new BarbeiroDto
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    Foto = u.Foto,
                    Especialidades = u.Especialidades,
                    Descricao = u.Descricao,
                    HorariosDisponiveis = u.HorariosDisponiveis.Select(h => new HorarioDisponivelDto
                    {
                        Id = h.Id,
                        DataHora = h.DataHora,
                        BarbeiroId = h.BarbeiroId,
                        NomeBarbeiro = u.Nome,
                        EstaDisponivel = h.EstaDisponivel
                    }).ToList()
                })
                .ToListAsync();

            return Ok(barbeiros);
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

            var barbeiro = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Id == criarDto.BarbeiroId && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
            {
                return BadRequest(new { message = "Barbeiro não encontrado" });
            }

            // Verificar se o horário está disponível
            var horarioDisponivel = await _context.HorariosDisponiveis
                .FirstOrDefaultAsync(h => h.BarbeiroId == criarDto.BarbeiroId && 
                                         h.DataHora == criarDto.DataHora && 
                                         h.EstaDisponivel);

            if (horarioDisponivel == null)
            {
                return BadRequest(new { message = "Horário não disponível" });
            }

            // Verificar se já existe agendamento para este horário
            var agendamentoExistente = await _context.Agendamentos
                .AnyAsync(a => a.BarbeiroId == criarDto.BarbeiroId && 
                              a.DataHora == criarDto.DataHora && 
                              a.Status == StatusAgendamento.Confirmado);

            if (agendamentoExistente)
            {
                return BadRequest(new { message = "Horário já está agendado" });
            }

            var agendamento = new Agendamento
            {
                ClienteId = clienteId,
                BarbeiroId = criarDto.BarbeiroId,
                DataHora = criarDto.DataHora,
                Observacoes = criarDto.Observacoes,
                BarbeariaId = barbeiro.BarbeariaId.Value,
                Status = StatusAgendamento.Confirmado
            };

            _context.Agendamentos.Add(agendamento);

            // Marcar horário como indisponível
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

            agendamento.Status = StatusAgendamento.Cancelado;
            agendamento.DataAtualizacao = DateTime.UtcNow;

            // Liberar horário
            var horario = await _context.HorariosDisponiveis
                .FirstOrDefaultAsync(h => h.BarbeiroId == agendamento.BarbeiroId && h.DataHora == agendamento.DataHora);

            if (horario != null)
            {
                horario.EstaDisponivel = true;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

