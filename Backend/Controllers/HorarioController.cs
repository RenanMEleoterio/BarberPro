using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.DTOs;
using BarbeariaSaaS.Extensions;
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

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) e o serviço de horários (HorarioService).
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        /// <param name="horarioService">O serviço responsável pela lógica de negócios de horários.</param>
        public HorarioController(BarbeariaContext context, HorarioService horarioService)
        {
            _context = context;
            _horarioService = horarioService;
        }

        /// <summary>
        /// Cria um novo horário disponível para o barbeiro logado. Verifica se o usuário é um barbeiro e se o horário já existe.
        /// </summary>
        /// <param name="criarDto">Objeto contendo a data e hora do novo horário.</param>
        /// <returns>ActionResult<HorarioDisponivelDto> contendo o horário criado ou um erro.</returns>
        [HttpPost]
        public async Task<ActionResult<HorarioDisponivelDto>> CriarHorario(CriarHorarioDto criarDto)
        {
            var usuarioId = User.GetUserIdOrDefault();
            var tipoUsuario = User.GetTipoUsuario();
            var dataHoraUtc = AppDateTime.NormalizeClientDateTimeToUtc(criarDto.DataHora);

            if (tipoUsuario != "Barbeiro")
            {
                return Forbid("Apenas barbeiros podem criar horários");
            }

            // Verificar se já existe horário para esta data/hora
            var horarioExistente = await _context.HorariosDisponiveis
                .AnyAsync(h => h.BarbeiroId == usuarioId && h.DataHora == dataHoraUtc);

            if (horarioExistente)
            {
                return BadRequest(new { message = "Já existe um horário cadastrado para esta data/hora" });
            }

            var horario = new HorarioDisponivel
            {
                BarbeiroId = usuarioId,
                DataHora = dataHoraUtc,
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

        /// <summary>
        /// Retorna uma lista de todos os horários disponíveis criados pelo barbeiro logado.
        /// </summary>
        /// <returns>ActionResult<List<HorarioDisponivelDto>> contendo uma lista de objetos HorarioDisponivelDto.</returns>
        [HttpGet("meus-horarios")]
        public async Task<ActionResult<List<HorarioDisponivelDto>>> GetMeusHorarios()
        {
            var usuarioId = User.GetUserIdOrDefault();
            var tipoUsuario = User.GetTipoUsuario();

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
                    NomeBarbeiro = h.Barbeiro != null ? h.Barbeiro.Nome : string.Empty,
                    EstaDisponivel = h.EstaDisponivel
                })
                .ToListAsync();

            return Ok(horarios);
        }

        /// <summary>
        /// Altera a disponibilidade de um horário específico. Permite que barbeiros alterem seus próprios horários
        /// e gerentes alterem horários de barbeiros de sua barbearia.
        /// </summary>
        /// <param name="id">O ID do horário a ser alterado.</param>
        /// <param name="disponivel">O novo status de disponibilidade (true para disponível, false para indisponível).</param>
        /// <returns>IActionResult indicando sucesso (NoContent) ou falha (NotFound, Forbid).</returns>
        [HttpPut("{id}/disponibilidade")]
        public async Task<IActionResult> AlterarDisponibilidade(int id, [FromBody] bool disponivel)
        {
            var usuarioId = User.GetUserIdOrDefault();
            var tipoUsuario = User.GetTipoUsuario();

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
                var barbeariaId = User.GetBarbeariaId() ?? 0;
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

        /// <summary>
        /// Remove um horário disponível. Permite que barbeiros removam seus próprios horários
        /// e gerentes removam horários de barbeiros de sua barbearia. Impede a remoção se houver agendamentos confirmados para o horário.
        /// </summary>
        /// <param name="id">O ID do horário a ser removido.</param>
        /// <returns>IActionResult indicando sucesso (NoContent) ou falha (NotFound, Forbid, BadRequest).</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoverHorario(int id)
        {
            var usuarioId = User.GetUserIdOrDefault();
            var tipoUsuario = User.GetTipoUsuario();

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
                var barbeariaId = User.GetBarbeariaId() ?? 0;
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
                              a.Status == StatusAgendamento.Atendido);

            if (temAgendamento)
            {
                return BadRequest(new { message = "Não é possível remover horário com agendamento confirmado" });
            }

            _context.HorariosDisponiveis.Remove(horario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Cria múltiplos horários disponíveis em lote para o barbeiro logado. Ignora horários que já existem.
        /// </summary>
        /// <param name="horariosDto">Uma lista de objetos CriarHorarioDto contendo as datas e horas dos novos horários.</param>
        /// <returns>ActionResult<List<HorarioDisponivelDto>> contendo uma lista dos horários que foram efetivamente criados.</returns>
        [HttpPost("lote")]
        public async Task<ActionResult<List<HorarioDisponivelDto>>> CriarHorariosLote([FromBody] List<CriarHorarioDto> horariosDto)
        {
            var usuarioId = User.GetUserIdOrDefault();
            var tipoUsuario = User.GetTipoUsuario();

            if (tipoUsuario != "Barbeiro")
            {
                return Forbid("Apenas barbeiros podem criar horários");
            }

            var datasHoraUtc = horariosDto
                .Select(dto => AppDateTime.NormalizeClientDateTimeToUtc(dto.DataHora))
                .Distinct()
                .ToList();

            var horariosExistentes = await _context.HorariosDisponiveis
                .Where(h => h.BarbeiroId == usuarioId && 
                           datasHoraUtc.Contains(h.DataHora))
                .Select(h => h.DataHora)
                .ToListAsync();

            var novosHorarios = datasHoraUtc
                .Where(dataHoraUtc => !horariosExistentes.Contains(dataHoraUtc))
                .Select(dataHoraUtc => new HorarioDisponivel
                {
                    BarbeiroId = usuarioId,
                    DataHora = dataHoraUtc,
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
        /// Gera horários disponíveis para um barbeiro específico dentro de um período definido.
        /// Apenas gerentes e barbeiros podem usar esta função. Barbeiros só podem gerar horários para si mesmos.
        /// </summary>
        /// <param name="barbeiroId">O ID do barbeiro para o qual os horários serão gerados.</param>
        /// <param name="dataInicio">Data de início para a geração de horários (opcional, padrão é hoje).</param>
        /// <param name="dataFim">Data de fim para a geração de horários (opcional, padrão é 30 dias a partir de hoje).</param>
        /// <param name="intervaloMinutos">Intervalo em minutos entre os horários gerados (opcional, padrão é 30).</param>
        /// <returns>IActionResult indicando sucesso com o número de horários gerados ou um erro.</returns>
        [HttpPost("gerar-barbeiro/{barbeiroId}")]
        public async Task<IActionResult> GerarHorariosParaBarbeiro(
            int barbeiroId,
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null,
            [FromQuery] int intervaloMinutos = 30)
        {
            try
            {
                var tipoUsuario = User.GetTipoUsuario();
                var hoje = AppDateTime.TodayInBusinessTimeZone();
                if (tipoUsuario != "Gerente" && tipoUsuario != "Barbeiro")
                {
                    return Forbid("Apenas gerentes e barbeiros podem gerar horários");
                }

                if (tipoUsuario == "Barbeiro" && User.GetUserIdOrDefault() != barbeiroId)
                {
                    return Forbid("Barbeiros só podem gerar horários para si mesmos");
                }

                var inicio = dataInicio.HasValue ? AppDateTime.GetBusinessDate(dataInicio.Value) : hoje;
                var fim = dataFim.HasValue ? AppDateTime.GetBusinessDate(dataFim.Value) : hoje.AddDays(30);

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
                var innerMessage = ex.InnerException?.Message ?? string.Empty;
                if (innerMessage.Contains("IX_HorariosDisponiveis_BarbeiroId_DataHora") || innerMessage.Contains("23505"))
                {
                    Console.WriteLine($"Tentativa de gerar horários duplicados para barbeiro {barbeiroId}: {innerMessage}");
                    return Ok(new 
                    { 
                        message = "Horários já existentes foram ignorados",
                        detalhes = "Foram detectados horários duplicados para o barbeiro informado",
                        codigo = "HORARIOS_DUPLICADOS"
                    });
                }

                Console.WriteLine($"Erro ao gerar horários para barbeiro: {ex.Message}\n{ex.StackTrace}\nInner: {ex.InnerException?.Message}");
                return StatusCode(500, new 
                { 
                    message = "Erro interno do servidor", 
                    details = ex.Message,
                    inner = ex.InnerException?.Message 
                });
            }
        }

        /// <summary>
        /// Gera horários disponíveis para todos os barbeiros de uma barbearia dentro de um período definido.
        /// Apenas gerentes podem usar esta função.
        /// </summary>
        /// <param name="dataInicio">Data de início para a geração de horários (opcional, padrão é hoje).</param>
        /// <param name="dataFim">Data de fim para a geração de horários (opcional, padrão é 30 dias a partir de hoje).</param>
        /// <param name="intervaloMinutos">Intervalo em minutos entre os horários gerados (opcional, padrão é 30).</param>
        /// <returns>IActionResult indicando sucesso com o número total de horários gerados ou um erro.</returns>
        [HttpPost("gerar-barbearia")]
        public async Task<IActionResult> GerarHorariosParaBarbearia(
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null,
            [FromQuery] int intervaloMinutos = 30)
        {
            try
            {
                var tipoUsuario = User.GetTipoUsuario();
                var hoje = AppDateTime.TodayInBusinessTimeZone();
                if (tipoUsuario != "Gerente")
                {
                    return Forbid("Apenas gerentes podem gerar horários para toda a barbearia");
                }

                var barbeariaId = User.GetBarbeariaId() ?? 0;
                if (barbeariaId == 0)
                {
                    return BadRequest(new { message = "Usuário não está vinculado a uma barbearia" });
                }

                var inicio = dataInicio.HasValue ? AppDateTime.GetBusinessDate(dataInicio.Value) : hoje;
                var fim = dataFim.HasValue ? AppDateTime.GetBusinessDate(dataFim.Value) : hoje.AddDays(30);

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
                var innerMessage = ex.InnerException?.Message ?? string.Empty;
                if (innerMessage.Contains("IX_HorariosDisponiveis_BarbeiroId_DataHora") || innerMessage.Contains("23505"))
                {
                    Console.WriteLine($"Tentativa de gerar horários duplicados para barbearia: {innerMessage}");
                    return Ok(new 
                    { 
                        message = "Horários já existentes foram ignorados",
                        detalhes = "Foram detectados horários duplicados para um ou mais barbeiros da barbearia",
                        codigo = "HORARIOS_DUPLICADOS"
                    });
                }

                Console.WriteLine($"Erro ao gerar horários para barbearia: {ex.Message}\n{ex.StackTrace}\nInner: {ex.InnerException?.Message}");
                return StatusCode(500, new 
                { 
                    message = "Erro interno do servidor", 
                    details = ex.Message,
                    inner = ex.InnerException?.Message 
                });
            }
        }
        [HttpGet("fix-slots/{barbeiroId}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<IActionResult> FixSlots(int barbeiroId)
        {
            var hoje = AppDateTime.TodayInBusinessTimeZone();
            var inicio = hoje;
            var fim = hoje.AddDays(30);
            var result = await _horarioService.GerarHorariosParaBarbeiro(barbeiroId, inicio, fim);
            return Ok(new { message = "Horários corrigidos", count = result.Count });
        }
    }
}
