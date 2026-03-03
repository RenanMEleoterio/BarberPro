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
using Microsoft.Extensions.Logging;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AgendamentoController : ControllerBase
    {
        private readonly BarbeariaContext _context;
        private readonly ILogger<AgendamentoController> _logger;

        public AgendamentoController(BarbeariaContext context, ILogger<AgendamentoController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retorna o ID do usuário logado a partir dos claims do token JWT.
        /// </summary>
        /// <returns>Um inteiro representando o ID do usuário.</returns>
        private int GetUsuarioId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        /// <summary>
        /// Retorna o ID da barbearia associada ao usuário logado a partir dos claims do token JWT.
        /// Pode ser nulo se o usuário não estiver vinculado a uma barbearia.
        /// </summary>
        /// <returns>Um inteiro anulável (int?) representando o ID da barbearia.</returns>
        private int? GetBarbeariaId()
        {
            var barbeariaIdClaim = User.FindFirst("BarbeariaId")?.Value;
            return barbeariaIdClaim != null ? int.Parse(barbeariaIdClaim) : null;
        }

        /// <summary>
        /// Retorna o tipo de usuário logado (e.g., "Cliente", "Barbeiro", "Gerente") a partir dos claims do token JWT.
        /// </summary>
        /// <returns>Uma string representando o tipo de usuário.</returns>
        private string GetTipoUsuario()
        {
            return User.FindFirst("TipoUsuario")?.Value ?? "";
        }

        /// <summary>
        /// Retorna uma lista de barbeiros disponíveis. Clientes podem ver barbeiros de todas as barbearias
        /// ou filtrar por uma barbearia específica informando o parâmetro barbeariaId.
        /// Outros tipos de usuário veem apenas os barbeiros de sua barbearia.
        /// </summary>
        /// <param name="barbeariaId">Opcional: ID da barbearia para filtrar os barbeiros.</param>
        /// <returns>ActionResult<List<BarbeiroDto>> contendo uma lista de objetos BarbeiroDto com informações dos barbeiros e seus horários disponíveis.</returns>
        [HttpGet("barbeiros")]
        public async Task<ActionResult<List<BarbeiroDto>>> GetBarbeiros([FromQuery] int? barbeariaId = null)
        {
            var tipoUsuario = GetTipoUsuario();
            IQueryable<Usuario> query = _context.Usuarios.Where(u => u.TipoUsuario == TipoUsuario.Barbeiro);

            if (tipoUsuario == "Cliente")
            {
                if (barbeariaId.HasValue)
                {
                    query = query.Where(u => u.BarbeariaId == barbeariaId);
                }
            }
            else
            {
                var usuarioBarbeariaId = GetBarbeariaId();
                if (!usuarioBarbeariaId.HasValue)
                {
                    return BadRequest(new { message = "Usuário não está vinculado a uma barbearia" });
                }
                query = query.Where(u => u.BarbeariaId == usuarioBarbeariaId);
            }

            var barbeiros = await query.ToListAsync();

            var barbeiroDtos = new List<BarbeiroDto>();
            
            // Para depuração e para resolver o problema imediato:
            // Vamos mostrar TODOS os horários de HOJE em diante, sem filtrar pela hora atual.
            // Isso evita que problemas de fuso horário escondam horários válidos.
            var hojeInicio = DateTime.UtcNow.Date.AddDays(-1); // Ontem em diante para ter certeza

            _logger.LogInformation("Buscando barbeiros. BarbeariaId: {BarbeariaId}, Tipo: {Tipo}", barbeariaId, tipoUsuario);

            foreach (var barbeiro in barbeiros)
            {
                var queryHorarios = _context.HorariosDisponiveis
                    .Where(h => h.BarbeiroId == barbeiro.Id && h.EstaDisponivel);

                var horariosDisponiveis = await queryHorarios
                    .Where(h => h.DataHora >= hojeInicio)
                    .OrderBy(h => h.DataHora)
                    .Select(h => new HorarioDisponivelDto
                    {
                        Id = h.Id,
                        DataHora = h.DataHora,
                        BarbeiroId = h.BarbeiroId,
                        NomeBarbeiro = barbeiro.Nome ?? "Barbeiro",
                        EstaDisponivel = h.EstaDisponivel
                    })
                    .ToListAsync();

                _logger.LogInformation("Barbeiro {Nome}: {Count} horários", barbeiro.Nome, horariosDisponiveis.Count);

                barbeiroDtos.Add(new BarbeiroDto
                {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome ?? "Barbeiro",
                    Foto = barbeiro.Foto,
                    Especialidades = barbeiro.Especialidades,
                    Descricao = barbeiro.Descricao,
                    HorariosDisponiveis = horariosDisponiveis
                });
            }

            return Ok(barbeiroDtos);
        }

        /// <summary>
        /// Permite que um cliente crie um novo agendamento. Realiza validações para garantir que o horário não está no passado,
        /// o barbeiro existe, o cliente não tem agendamento duplicado e o horário está disponível.
        /// </summary>
        /// <param name="criarDto">Objeto contendo os dados necessários para criar um agendamento (ID do barbeiro, data/hora, observações, tipo de serviço).</param>
        /// <returns>ActionResult<AgendamentoDto> contendo o agendamento criado ou um erro.</returns>
        [HttpPost]
        public async Task<ActionResult<AgendamentoDto>> CriarAgendamento(CriarAgendamentoDto criarDto)
        {
            try
            {
                var clienteId = GetUsuarioId();
                var tipoUsuario = GetTipoUsuario();

                if (tipoUsuario != "Cliente")
                {
                    return Forbid("Apenas clientes podem criar agendamentos");
                }

                // Validar se a data/hora não é no passado
                // Assume que a data recebida está no horário de Brasília (UTC-3) se não tiver timezone definido
                var dataHoraInput = criarDto.DataHora;
                DateTime dataHoraUtc;

                if (dataHoraInput.Kind == DateTimeKind.Utc)
                {
                    dataHoraUtc = dataHoraInput;
                }
                else
                {
                    // Considera UTC-3 (Horário de Brasília) para inputs sem timezone
                    var offsetBrasil = TimeSpan.FromHours(-3);
                    var dataHoraBrasil = new DateTimeOffset(dataHoraInput, offsetBrasil);
                    dataHoraUtc = dataHoraBrasil.UtcDateTime;
                }

                // Tolerância de 5 minutos para diferenças de relógio/rede
                if (dataHoraUtc < DateTime.UtcNow.AddMinutes(-5))
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

                // Validação de segurança: Barbeiro deve ter uma barbearia vinculada
                if (!barbeiro.BarbeariaId.HasValue)
                {
                    _logger.LogError("Tentativa de agendamento para barbeiro {BarbeiroId} sem barbearia vinculada.", criarDto.BarbeiroId);
                    return StatusCode(500, new { message = "Erro interno: Cadastro do barbeiro inconsistente." });
                }

                // Verificar se o cliente já tem um agendamento ativo (não cancelado/expirado) para o mesmo horário
                var clienteTemAgendamento = await _context.Agendamentos
                    .AnyAsync(a => a.ClienteId == clienteId &&
                                  a.DataHora.Date == dataHoraInput.Date &&
                                  a.DataHora.Hour == dataHoraInput.Hour &&
                                  a.DataHora.Minute == dataHoraInput.Minute &&
                                  a.Status != StatusAgendamento.Cancelado &&
                                  a.Status != StatusAgendamento.Expirado);

                if (clienteTemAgendamento)
                {
                    return BadRequest(new { message = "Você já possui um agendamento para este horário" });
                }

                // Verificar se já existe um agendamento ativo (não cancelado/expirado) para este barbeiro neste horário
                var barbeiroTemAgendamento = await _context.Agendamentos
                    .AnyAsync(a => a.BarbeiroId == criarDto.BarbeiroId &&
                                  a.DataHora.Date == dataHoraInput.Date &&
                                  a.DataHora.Hour == dataHoraInput.Hour &&
                                  a.DataHora.Minute == dataHoraInput.Minute &&
                                  a.Status != StatusAgendamento.Cancelado &&
                                  a.Status != StatusAgendamento.Expirado);

                if (barbeiroTemAgendamento)
                {
                    return BadRequest(new { message = "Este horário já está ocupado. Por favor, escolha outro horário disponível" });
                }

                // Verificar se existe um horário disponível para este barbeiro nesta data/hora
                // Usamos uma comparação mais flexível para evitar problemas com o Kind do DateTime (Utc vs Unspecified)
                var horarioDisponivel = await _context.HorariosDisponiveis
                    .FirstOrDefaultAsync(h => h.BarbeiroId == criarDto.BarbeiroId && 
                                             h.DataHora.Date == dataHoraInput.Date &&
                                             h.DataHora.Hour == dataHoraInput.Hour &&
                                             h.DataHora.Minute == dataHoraInput.Minute &&
                                             h.EstaDisponivel);

                if (horarioDisponivel == null)
                {
                    return BadRequest(new { message = "Horário não disponível para este barbeiro" });
                }

                // Recalcular preço e descrição dos serviços para garantir integridade e persistência correta
                decimal precoTotal = 0;
                var nomesServicos = new List<string>();
                var agendamentoServicos = new List<AgendamentoServico>();

                if (criarDto.ServicoIds != null && criarDto.ServicoIds.Any())
                {
                    var servicosDb = await _context.Servicos
                        .Where(s => criarDto.ServicoIds.Contains(s.Id))
                        .ToListAsync();

                    foreach (var servico in servicosDb)
                    {
                        precoTotal += servico.Preco;
                        nomesServicos.Add(servico.Nome);
                        agendamentoServicos.Add(new AgendamentoServico { ServicoId = servico.Id });
                    }
                }

                // Define TipoServico e PrecoServico baseados nos dados do banco (prioridade) ou no DTO (fallback)
                string tipoServicoFinal = nomesServicos.Any() ? string.Join(" + ", nomesServicos) : criarDto.TipoServico;
                decimal? precoFinal = nomesServicos.Any() ? precoTotal : criarDto.PrecoServico;

                // Validar tamanho da string para evitar erro no banco (limite de 100 caracteres)
                if (tipoServicoFinal.Length > 100)
                {
                    tipoServicoFinal = tipoServicoFinal.Substring(0, 97) + "...";
                }

                var agendamento = new Agendamento
                {
                    ClienteId = clienteId,
                    BarbeiroId = criarDto.BarbeiroId,
                    DataHora = dataHoraInput,
                    Observacoes = criarDto.Observacoes,
                    BarbeariaId = barbeiro.BarbeariaId.Value, // Seguro devido à validação anterior
                    Status = StatusAgendamento.Pendente,
                    TipoServico = tipoServicoFinal,
                    PrecoServico = precoFinal,
                    HorarioDisponivelId = horarioDisponivel.Id,
                    AgendamentoServicos = agendamentoServicos
                };

                _context.Agendamentos.Add(agendamento);

                // Marcar o horário como indisponível
                horarioDisponivel.EstaDisponivel = false;

                await _context.SaveChangesAsync();

                var agendamentoDto = await _context.Agendamentos
                    .Where(a => a.Id == agendamento.Id)
                    .Include(a => a.Cliente)
                    .Include(a => a.Barbeiro)
                    .Include(a => a.Barbearia)
                    .Select(a => new AgendamentoDto
                    {
                        Id = a.Id,
                        ClienteId = a.ClienteId,
                        NomeCliente = a.Cliente.Nome,
                        EmailCliente = a.Cliente.Email,
                        BarbeiroId = a.BarbeiroId,
                        NomeBarbeiro = a.Barbeiro.Nome,
                        BarbeariaId = a.BarbeariaId,
                        NomeBarbearia = a.Barbearia.Nome,
                        DataHora = a.DataHora,
                        Observacoes = a.Observacoes,
                        Status = a.Status.ToString(),
                        TipoServico = a.TipoServico,
                        PrecoServico = a.PrecoServico,
                        DataCriacao = a.DataCriacao,
                        ServicoIds = a.AgendamentoServicos != null ? a.AgendamentoServicos.Select(s => s.ServicoId).ToList() : new List<int>()
                    })
                    .FirstAsync();

                return Ok(agendamentoDto);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Erro de banco de dados ao criar agendamento para Cliente {ClienteId}, Barbeiro {BarbeiroId}", GetUsuarioId(), criarDto.BarbeiroId);
                return StatusCode(500, new { message = "Erro ao processar o agendamento no banco de dados. Verifique os dados e tente novamente." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao criar agendamento para Cliente {ClienteId}", GetUsuarioId());
                return StatusCode(500, new { message = "Ocorreu um erro interno no servidor ao processar sua solicitação." });
            }
        }

        /// <summary>
        /// Retorna uma lista de agendamentos para o usuário logado. Clientes veem seus próprios agendamentos,
        /// barbeiros veem os agendamentos atribuídos a eles, e gerentes veem todos os agendamentos de sua barbearia.
        /// </summary>
        /// <returns>ActionResult<List<AgendamentoDto>> contendo uma lista de objetos AgendamentoDto.</returns>
        [HttpGet("meus-agendamentos")]
        public async Task<ActionResult<List<AgendamentoDto>>> GetMeusAgendamentos()
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();
            var agoraUtc = DateTime.UtcNow;

            IQueryable<Agendamento> query = _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Include(a => a.AgendamentoServicos)
                    .ThenInclude(asv => asv.Servico);

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

            var agendamentosExpirados = await query
                .Where(a => a.DataHora <= agoraUtc
                            && a.Status == StatusAgendamento.Pendente)
                .ToListAsync();

            if (agendamentosExpirados.Count > 0)
            {
                foreach (var agendamento in agendamentosExpirados)
                {
                    agendamento.Status = StatusAgendamento.Expirado;
                    agendamento.DataAtualizacao = agoraUtc;
                }

                await _context.SaveChangesAsync();
            }

            // Recarrega a query para garantir que os status atualizados sejam refletidos
            // Nota: Como os objetos foram atualizados no contexto, a query subsequente deve retornar os dados atualizados
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
                    BarbeariaId = a.BarbeariaId,
                    NomeBarbearia = a.Barbearia.Nome,
                    DataHora = a.DataHora,
                    Observacoes = a.Observacoes,
                    Status = a.Status.ToString(),
                    TipoServico = a.AgendamentoServicos != null && a.AgendamentoServicos.Any() 
                        ? string.Join(" + ", a.AgendamentoServicos.Select(s => s.Servico.Nome)) 
                        : a.TipoServico,
                    PrecoServico = a.PrecoServico,
                    DataCriacao = a.DataCriacao,
                    ServicoIds = a.AgendamentoServicos != null ? a.AgendamentoServicos.Select(s => s.ServicoId).ToList() : new List<int>()
                })
                .ToListAsync();

            return Ok(agendamentos);
        }

        /// <summary>
        /// Atualiza um agendamento existente. Permite modificar a data/hora, observações e status do agendamento,
        /// com validações de permissão baseadas no tipo de usuário.
        /// </summary>
        /// <param name="id">O ID do agendamento a ser atualizado.</param>
        /// <param name="atualizarDto">Objeto contendo os dados para atualização (nova data/hora, observações, status).</param>
        /// <returns>ActionResult<AgendamentoDto> contendo o agendamento atualizado ou um erro.</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<AgendamentoDto>> AtualizarAgendamento(int id, AtualizarAgendamentoDto atualizarDto)
        {
            var usuarioId = GetUsuarioId();
            var tipoUsuario = GetTipoUsuario();

            var agendamento = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Barbeiro)
                .Include(a => a.Barbearia)
                .Include(a => a.AgendamentoServicos)
                    .ThenInclude(asv => asv.Servico)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (agendamento == null)
            {
                return NotFound();
            }

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

            if (agendamento.DataHora <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "Não é possível editar um agendamento com data/hora já expirada." });
            }

            if (agendamento.Status == StatusAgendamento.Realizado || agendamento.Status == StatusAgendamento.Cancelado)
            {
                return BadRequest(new { message = "Não é possível editar um agendamento concluído ou cancelado." });
            }

            // Atualizar campos
            if (atualizarDto.NovaDataHora.HasValue && atualizarDto.NovaDataHora.Value != agendamento.DataHora)
            {
                var novaDataHora = DateTime.SpecifyKind(atualizarDto.NovaDataHora.Value, DateTimeKind.Utc);

                if (novaDataHora <= DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Não é possível reagendar para uma data no passado." });
                }

                // Verificar disponibilidade do novo horário
                var novoHorarioDisponivel = await _context.HorariosDisponiveis
                    .FirstOrDefaultAsync(h => h.BarbeiroId == agendamento.BarbeiroId && 
                                            h.DataHora == novaDataHora && 
                                            h.EstaDisponivel);

                if (novoHorarioDisponivel == null)
                {
                    return BadRequest(new { message = "O novo horário escolhido não está disponível." });
                }

                // Liberar o horário antigo
                if (agendamento.HorarioDisponivelId.HasValue)
                {
                    var horarioAntigo = await _context.HorariosDisponiveis.FindAsync(agendamento.HorarioDisponivelId.Value);
                    if (horarioAntigo != null)
                    {
                        horarioAntigo.EstaDisponivel = true;
                    }
                }
                else
                {
                    // Tentar encontrar o horário antigo pela data/hora se o ID for nulo (compatibilidade)
                    var horarioAntigo = await _context.HorariosDisponiveis
                        .FirstOrDefaultAsync(h => h.BarbeiroId == agendamento.BarbeiroId && h.DataHora == agendamento.DataHora);
                    if (horarioAntigo != null)
                    {
                        horarioAntigo.EstaDisponivel = true;
                    }
                }

                // Ocupar o novo horário
                novoHorarioDisponivel.EstaDisponivel = false;
                agendamento.HorarioDisponivelId = novoHorarioDisponivel.Id;
                agendamento.DataHora = novaDataHora;
            }

            if (!string.IsNullOrEmpty(atualizarDto.Observacoes))
            {
                agendamento.Observacoes = atualizarDto.Observacoes;
            }

            if (atualizarDto.Status.HasValue)
            {
                agendamento.Status = atualizarDto.Status.Value;
            }

            if (atualizarDto.ServicoIds != null)
            {
                // Remover serviços antigos
                if (agendamento.AgendamentoServicos != null && agendamento.AgendamentoServicos.Any())
                {
                    _context.AgendamentoServicos.RemoveRange(agendamento.AgendamentoServicos);
                }

                // Buscar novos serviços
                var novosServicos = await _context.Servicos
                    .Where(s => atualizarDto.ServicoIds.Contains(s.Id))
                    .ToListAsync();

                var novosAgendamentoServicos = new List<AgendamentoServico>();
                decimal precoTotal = 0;
                var nomesServicos = new List<string>();

                foreach (var servico in novosServicos)
                {
                    novosAgendamentoServicos.Add(new AgendamentoServico 
                    { 
                        AgendamentoId = agendamento.Id, 
                        ServicoId = servico.Id 
                    });
                    precoTotal += servico.Preco;
                    nomesServicos.Add(servico.Nome);
                }

                await _context.AgendamentoServicos.AddRangeAsync(novosAgendamentoServicos);
                
                agendamento.PrecoServico = precoTotal;
                string tipoServicoFinal = nomesServicos.Any() ? string.Join(" + ", nomesServicos) : "Serviço Personalizado";
                 if (tipoServicoFinal.Length > 100)
                {
                    tipoServicoFinal = tipoServicoFinal.Substring(0, 97) + "...";
                }
                agendamento.TipoServico = tipoServicoFinal;
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
                BarbeariaId = agendamento.BarbeariaId,
                NomeBarbearia = agendamento.Barbearia.Nome,
                DataHora = agendamento.DataHora,
                Observacoes = agendamento.Observacoes,
                Status = agendamento.Status.ToString(),
                TipoServico = agendamento.AgendamentoServicos != null && agendamento.AgendamentoServicos.Any()
                    ? string.Join(" + ", agendamento.AgendamentoServicos.Select(s => s.Servico.Nome))
                    : agendamento.TipoServico,
                PrecoServico = agendamento.PrecoServico,
                DataCriacao = agendamento.DataCriacao,
                ServicoIds = agendamento.AgendamentoServicos != null ? agendamento.AgendamentoServicos.Select(s => s.ServicoId).ToList() : new List<int>()
            };

            return Ok(agendamentoDto);
        }

        /// <summary>
        /// Cancela um agendamento existente. Verifica permissões e garante que o agendamento não está no passado
        /// e ainda não foi cancelado. Libera o horário do barbeiro após o cancelamento.
        /// </summary>
        /// <param name="id">O ID do agendamento a ser cancelado.</param>
        /// <returns>IActionResult indicando sucesso ou falha no cancelamento.</returns>
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


