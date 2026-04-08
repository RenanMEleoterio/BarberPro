using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;
using BarbeariaSaaS.DTOs;
using BarbeariaSaaS.Services;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BarbeariaController : ControllerBase
    {
        private readonly BarbeariaContext _context;
        private readonly HorarioService _horarioService;

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) para permitir a interação com o Entity Framework Core.
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public BarbeariaController(BarbeariaContext context, HorarioService horarioService)
        {
            _context = context;
            _horarioService = horarioService;
        }

        /// <summary>
        /// Retorna uma lista de todas as barbearias registradas no sistema, incluindo seus IDs, nomes, endereços, telefones e e-mails.
        /// </summary>
        /// <returns>ActionResult<IEnumerable<Barbearia>> contendo uma lista de objetos anônimos com informações básicas das barbearias.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Barbearia>>> GetBarbearias()
        {
            var barbearias = await _context.Barbearias
                .AsNoTracking()
                .Select(b => new {
                    b.Id,
                    b.Nome,
                    b.Endereco,
                    b.Telefone,
                    b.Email,
                    b.OpenTime,
                    b.CloseTime,
                    Barbers = b.Usuarios
                        .Where(u => u.TipoUsuario == TipoUsuario.Barbeiro)
                        .Select(u => new
                        {
                            u.Id,
                            u.Nome
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(barbearias);
        }

        /// <summary>
        /// Retorna os detalhes de uma barbearia específica com base no seu ID. Inclui informações como nome, endereço, telefone, e-mail, logo,
        /// códigos de convite e barbearia, data de criação, dias de trabalho e horários de funcionamento.
        /// </summary>
        /// <param name="id">O ID da barbearia a ser consultada.</param>
        /// <returns>ActionResult<Barbearia> contendo um objeto anônimo com os detalhes da barbearia ou NotFound se a barbearia não for encontrada.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Barbearia>> GetBarbearia(int id)
        {
            var barbearia = await _context.Barbearias.FindAsync(id);

            if (barbearia == null)
            {
                return NotFound();
            }

            return Ok(new {
                barbearia.Id,
                barbearia.Nome,
                barbearia.Endereco,
                barbearia.Telefone,
                barbearia.Email,
                barbearia.Logo,
                barbearia.CodigoConvite,
                barbearia.CodigoBarbearia,
                barbearia.DataCriacao,
                barbearia.WorkDays,
                barbearia.OpenTime,
                barbearia.CloseTime
            });
        }

        /// <summary>
        /// Retorna uma lista de barbeiros associados a uma barbearia específica. Filtra os usuários pelo BarbeariaId e TipoUsuario (Barbeiro).
        /// </summary>
        /// <param name="id">O ID da barbearia.</param>
        /// <returns>ActionResult<IEnumerable<Usuario>> contendo uma lista de objetos anônimos com ID, nome, email, especialidades e descrição dos barbeiros.</returns>
        [HttpGet("{id}/barbeiros")]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetBarbeirosPorBarbearia(int id)
        {
            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == id && u.TipoUsuario == TipoUsuario.Barbeiro)
                .Select(u => new {
                    u.Id,
                    u.Nome,
                    u.Email,
                    u.Especialidades,
                    u.Descricao
                })
                .ToListAsync();

            return Ok(barbeiros);
        }

        /// <summary>
        /// Retorna detalhes completos de uma barbearia, incluindo uma lista de seus barbeiros com informações adicionais como rating (valor padrão) e agendamentos confirmados.
        /// </summary>
        /// <param name="id">O ID da barbearia.</param>
        /// <returns>ActionResult contendo um objeto anônimo com os detalhes da barbearia e seus barbeiros, ou NotFound se a barbearia não for encontrada.</returns>
        [HttpGet("{id}/detalhes")]
        public async Task<ActionResult> GetBarbeariaDetalhes(int id)
        {
            var barbearia = await _context.Barbearias.FindAsync(id);

            if (barbearia == null)
            {
                return NotFound();
            }

            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == id && u.TipoUsuario == TipoUsuario.Barbeiro)
                .Select(u => new {
                    id = u.Id,
                    name = u.Nome,
                    rating = 4.8, // Valor padrão por enquanto, pode ser calculado posteriormente
                    agendamentos = _context.Agendamentos
                                    .Where(a => a.BarbeiroId == u.Id && a.Status == StatusAgendamento.Atendido)
                                    .Select(a => new { a.DataHora })
                                    .ToList()
                })
                .ToListAsync();

            var resultado = new {
                id = barbearia.Id,
                name = barbearia.Nome,
                barbers = barbeiros
            };

            return Ok(resultado);
        }

        /// <summary>
        /// Atualiza as informações de uma barbearia existente. Permite modificar o nome, endereço, telefone, e-mail, dias de trabalho e horários de funcionamento.
        /// Lida com exceções de concorrência no banco de dados.
        /// </summary>
        /// <param name="id">O ID da barbearia a ser atualizada.</param>
        /// <param name="updateDto">Objeto contendo os novos dados da barbearia.</param>
        /// <returns>IActionResult indicando sucesso (NoContent) ou falha (NotFound, BadRequest).</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBarbearia(int id, [FromBody] UpdateBarbeariaDto updateDto)
        {
            var barbearia = await _context.Barbearias.FindAsync(id);

            if (barbearia == null)
            {
                return NotFound();
            }

            var scheduleChanged =
                !string.Equals(barbearia.WorkDays, updateDto.WorkDays, System.StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(barbearia.OpenTime, updateDto.OpenTime, System.StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(barbearia.CloseTime, updateDto.CloseTime, System.StringComparison.OrdinalIgnoreCase);

            barbearia.Nome = updateDto.Nome;
            barbearia.Endereco = updateDto.Endereco;
            barbearia.Telefone = updateDto.Telefone;
            barbearia.Email = updateDto.Email;
            barbearia.WorkDays = updateDto.WorkDays;
            barbearia.OpenTime = updateDto.OpenTime;
            barbearia.CloseTime = updateDto.CloseTime;

            try
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                await _context.SaveChangesAsync();

                if (scheduleChanged)
                {
                    var hoje = AppDateTime.TodayInBusinessTimeZone();
                    await _horarioService.GerarHorariosParaBarbearia(id, hoje, hoje.AddDays(30));
                }

                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Barbearias.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }
    }
}
