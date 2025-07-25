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
    public class HorarioController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        public HorarioController(BarbeariaContext context)
        {
            _context = context;
        }

        private int GetUsuarioId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private string GetTipoUsuario()
        {
            return User.FindFirst("TipoUsuario")?.Value ?? "";
        }

        [HttpPost]
        public async Task<ActionResult<HorarioDisponivelDto>> CriarHorario(CriarHorarioDto criarDto)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            if (tipoUsuario != "Barbeiro")
            {
                return Forbid("Apenas barbeiros podem criar horários");
            }

            // Verificar se já existe horário para esta data/hora
            var horarioExistente = await _context.HorariosDisponiveis
                .AnyAsync(h => h.BarbeiroId == usuarioId && h.DataHora == criarDto.DataHora);

            if (horarioExistente)
            {
                return BadRequest(new { message = "Já existe um horário cadastrado para esta data/hora" });
            }

            var horario = new HorarioDisponivel
            {
                BarbeiroId = usuarioId,
                DataHora = criarDto.DataHora,
                EstaDisponivel = true
            };

            _context.HorariosDisponiveis.Add(horario);
            await _context.SaveChangesAsync();

            var barbeiro = await _context.Usuarios.FindAsync(usuarioId);

            var horarioDto = new HorarioDisponivelDto
            {
                Id = horario.Id,
                DataHora = horario.DataHora,
                BarbeiroId = horario.BarbeiroId,
                NomeBarbeiro = barbeiro?.Nome ?? "",
                EstaDisponivel = horario.EstaDisponivel
            };

            return Ok(horarioDto);
        }

        [HttpGet("meus-horarios")]
        public async Task<ActionResult<List<HorarioDisponivelDto>>> GetMeusHorarios()
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            if (tipoUsuario != "Barbeiro")
            {
                return Forbid("Apenas barbeiros podem visualizar seus horários");
            }

            var horarios = await _context.HorariosDisponiveis
                .Where(h => h.BarbeiroId == usuarioId)
                .Include(h => h.Barbeiro)
                .OrderBy(h => h.DataHora)
                .Select(h => new HorarioDisponivelDto
                {
                    Id = h.Id,
                    DataHora = h.DataHora,
                    BarbeiroId = h.BarbeiroId,
                    NomeBarbeiro = h.Barbeiro.Nome,
                    EstaDisponivel = h.EstaDisponivel
                })
                .ToListAsync();

            return Ok(horarios);
        }

        [HttpPut("{id}/disponibilidade")]
        public async Task<IActionResult> AlterarDisponibilidade(int id, [FromBody] bool disponivel)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            var horario = await _context.HorariosDisponiveis
                .FirstOrDefaultAsync(h => h.Id == id);

            if (horario == null)
            {
                return NotFound();
            }

            // Verificar permissões
            if (tipoUsuario == "Barbeiro" && horario.BarbeiroId != usuarioId)
            {
                return Forbid();
            }
            else if (tipoUsuario == "Gerente")
            {
                var barbeariaId = int.Parse(User.FindFirst("BarbeariaId")?.Value ?? "0");
                var barbeiro = await _context.Usuarios.FindAsync(horario.BarbeiroId);
                if (barbeiro?.BarbeariaId != barbeariaId)
                {
                    return Forbid();
                }
            }
            else if (tipoUsuario == "Cliente")
            {
                return Forbid();
            }

            horario.EstaDisponivel = disponivel;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoverHorario(int id)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            var horario = await _context.HorariosDisponiveis
                .FirstOrDefaultAsync(h => h.Id == id);

            if (horario == null)
            {
                return NotFound();
            }

            // Verificar permissões
            if (tipoUsuario == "Barbeiro" && horario.BarbeiroId != usuarioId)
            {
                return Forbid();
            }
            else if (tipoUsuario == "Gerente")
            {
                var barbeariaId = int.Parse(User.FindFirst("BarbeariaId")?.Value ?? "0");
                var barbeiro = await _context.Usuarios.FindAsync(horario.BarbeiroId);
                if (barbeiro?.BarbeariaId != barbeariaId)
                {
                    return Forbid();
                }
            }
            else if (tipoUsuario == "Cliente")
            {
                return Forbid();
            }

            // Verificar se há agendamentos para este horário
            var temAgendamento = await _context.Agendamentos
                .AnyAsync(a => a.BarbeiroId == horario.BarbeiroId && 
                              a.DataHora == horario.DataHora && 
                              a.Status == StatusAgendamento.Confirmado);

            if (temAgendamento)
            {
                return BadRequest(new { message = "Não é possível remover horário com agendamento confirmado" });
            }

            _context.HorariosDisponiveis.Remove(horario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("lote")]
        public async Task<ActionResult<List<HorarioDisponivelDto>>> CriarHorariosLote([FromBody] List<CriarHorarioDto> horariosDto)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            if (tipoUsuario != "Barbeiro")
            {
                return Forbid("Apenas barbeiros podem criar horários");
            }

            var horariosExistentes = await _context.HorariosDisponiveis
                .Where(h => h.BarbeiroId == usuarioId && 
                           horariosDto.Select(dto => dto.DataHora).Contains(h.DataHora))
                .Select(h => h.DataHora)
                .ToListAsync();

            var novosHorarios = horariosDto
                .Where(dto => !horariosExistentes.Contains(dto.DataHora))
                .Select(dto => new HorarioDisponivel
                {
                    BarbeiroId = usuarioId,
                    DataHora = dto.DataHora,
                    EstaDisponivel = true
                })
                .ToList();

            if (novosHorarios.Any())
            {
                _context.HorariosDisponiveis.AddRange(novosHorarios);
                await _context.SaveChangesAsync();
            }

            var barbeiro = await _context.Usuarios.FindAsync(usuarioId);

            var horariosResponse = novosHorarios.Select(h => new HorarioDisponivelDto
            {
                Id = h.Id,
                DataHora = h.DataHora,
                BarbeiroId = h.BarbeiroId,
                NomeBarbeiro = barbeiro?.Nome ?? "",
                EstaDisponivel = h.EstaDisponivel
            }).ToList();

            return Ok(horariosResponse);
        }
    }
}

