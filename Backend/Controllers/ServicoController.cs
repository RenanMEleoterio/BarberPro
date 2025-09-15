using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;
using BarbeariaSaaS.DTOs;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicoController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) para permitir a interação com o Entity Framework Core.
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public ServicoController(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retorna uma lista de serviços. Pode ser filtrada por ID da barbearia.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia para filtrar os serviços (opcional).</param>
        /// <returns>ActionResult<IEnumerable<Servico>> contendo uma lista de serviços.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Servico>>> GetServicos([FromQuery] int? barbeariaId)
        {
            if (barbeariaId.HasValue)
            {
                return await _context.Servicos.Where(s => s.BarbeariaId == barbeariaId.Value).ToListAsync();
            }
            return await _context.Servicos.ToListAsync();
        }

        /// <summary>
        /// Retorna um serviço específico com base no seu ID.
        /// </summary>
        /// <param name="id">O ID do serviço a ser consultado.</param>
        /// <returns>ActionResult<Servico> contendo o serviço encontrado ou NotFound se o serviço não for encontrado.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Servico>> GetServico(int id)
        {
            var servico = await _context.Servicos.FindAsync(id);

            if (servico == null)
            {
                return NotFound();
            }

            return servico;
        }

        /// <summary>
        /// Adiciona um novo serviço ao sistema.
        /// </summary>
        /// <param name="addServicoDto">Objeto contendo os dados do novo serviço (nome, preço, duração, ID da barbearia).</param>
        /// <returns>ActionResult<Servico> contendo o serviço recém-criado.</returns>
        [HttpPost]
        public async Task<ActionResult<Servico>> AddServico(AddServicoDto addServicoDto)
        {
            var servico = new Servico
            {
                Nome = addServicoDto.Nome,
                Preco = addServicoDto.Preco,
                DuracaoMinutos = addServicoDto.DuracaoMinutos,
                BarbeariaId = addServicoDto.BarbeariaId
            };

            _context.Servicos.Add(servico);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetServico), new { id = servico.Id }, servico);
        }

        /// <summary>
        /// Atualiza um serviço existente. Lida com exceções de concorrência no banco de dados.
        /// </summary>
        /// <param name="id">O ID do serviço a ser atualizado.</param>
        /// <param name="servico">Objeto Servico contendo os dados atualizados.</param>
        /// <returns>IActionResult indicando sucesso (NoContent) ou falha (BadRequest, NotFound).</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServico(int id, Servico servico)
        {
            if (id != servico.Id)
            {
                return BadRequest();
            }

            _context.Entry(servico).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Servicos.Any(e => e.Id == id))
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

        /// <summary>
        /// Exclui um serviço existente com base no seu ID.
        /// </summary>
        /// <param name="id">O ID do serviço a ser excluído.</param>
        /// <returns>IActionResult indicando sucesso (NoContent) ou falha (NotFound).</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServico(int id)
        {
            var servico = await _context.Servicos.FindAsync(id);
            if (servico == null)
            {
                return NotFound();
            }

            _context.Servicos.Remove(servico);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}


