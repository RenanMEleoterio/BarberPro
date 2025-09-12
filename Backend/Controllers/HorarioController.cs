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
using BarbeariaSaaS.Services;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HorarioController : ControllerBase
    {
        private readonly BarbeariaContext _context;
        private readonly HorarioService _horarioService;

        public HorarioController(BarbeariaContext context, HorarioService horarioService)
        {
            _context = context;
            _horarioService = horarioService;
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

        /// <summary>
        /// Gera horários disponíveis para um barbeiro específico
        /// </summary>
        [HttpPost("gerar-barbeiro/{barbeiroId}")]
        public async Task<IActionResult> GerarHorariosParaBarbeiro(
            int barbeiroId,
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null,
            [FromQuery] int intervaloMinutos = 30)
        {
            try
            {
                var tipoUsuario = GetTipoUsuario();
                
                // Apenas gerentes e barbeiros podem gerar horários
                if (tipoUsuario != "Gerente" && tipoUsuario != "Barbeiro")
                {
                    return Forbid("Apenas gerentes e barbeiros podem gerar horários");
                }

                // Se for barbeiro, só pode gerar para si mesmo
                if (tipoUsuario == "Barbeiro" && GetUsuarioId() != barbeiroId)
                {
                    return Forbid("Barbeiros só podem gerar horários para si mesmos");
                }

                // Definir período padrão se não fornecido (próximos 30 dias)
                var inicio = dataInicio ?? DateTime.Today;
                var fim = dataFim ?? DateTime.Today.AddDays(30);

                var horariosGerados = await _horarioService.GerarHorariosParaBarbeiro(
                    barbeiroId, inicio, fim, intervaloMinutos);

                return Ok(new 
                { 
                    message = $"{horariosGerados.Count} horários gerados com sucesso",
                    horariosGerados = horariosGerados.Count,
                    periodo = new { inicio, fim },
                    intervaloMinutos
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor", details = ex.Message });
            }
        }

        /// <summary>
        /// Gera horários para todos os barbeiros de uma barbearia
        /// </summary>
        [HttpPost("gerar-barbearia")]
        public async Task<IActionResult> GerarHorariosParaBarbearia(
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null,
            [FromQuery] int intervaloMinutos = 30)
        {
            try
            {
                var tipoUsuario = GetTipoUsuario();
                
                // Apenas gerentes podem gerar horários para toda a barbearia
                if (tipoUsuario != "Gerente")
                {
                    return Forbid("Apenas gerentes podem gerar horários para toda a barbearia");
                }

                var barbeariaId = int.Parse(User.FindFirst("BarbeariaId")?.Value ?? "0");
                if (barbeariaId == 0)
                {
                    return BadRequest(new { message = "Usuário não está vinculado a uma barbearia" });
                }

                // Definir período padrão se não fornecido (próximos 30 dias)
                var inicio = dataInicio ?? DateTime.Today;
                var fim = dataFim ?? DateTime.Today.AddDays(30);

                var totalHorarios = await _horarioService.GerarHorariosParaBarbearia(
                    barbeariaId, inicio, fim, intervaloMinutos);

                return Ok(new 
                { 
                    message = $"{totalHorarios} horários gerados com sucesso para toda a barbearia",
                    horariosGerados = totalHorarios,
                    periodo = new { inicio, fim },
                    intervaloMinutos
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor", details = ex.Message });
            }
        }
    }
}

