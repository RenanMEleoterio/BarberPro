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
    public class BarbeariaController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        public BarbeariaController(BarbeariaContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Barbearia>>> GetBarbearias()
        {
            var barbearias = await _context.Barbearias
                .Select(b => new {
                    b.Id,
                    b.Nome,
                    b.Endereco,
                    b.Telefone,
                    b.Email
                })
                .ToListAsync();

            return Ok(barbearias);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Barbearia>> GetBarbearia(int id)
        {
            var barbearia = await _context.Barbearias.FindAsync(id);

            if (barbearia == null)
            {
                return NotFound();
            }

            return barbearia;
        }

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
                    rating = 4.8 // Valor padrão por enquanto, pode ser calculado posteriormente
                })
                .ToListAsync();

            var resultado = new {
                id = barbearia.Id,
                name = barbearia.Nome,
                barbers = barbeiros
            };

            return Ok(resultado);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBarbearia(int id, [FromBody] UpdateBarbeariaDto updateDto)
        {
            var barbearia = await _context.Barbearias.FindAsync(id);

            if (barbearia == null)
            {
                return NotFound();
            }

            barbearia.Nome = updateDto.Nome;
            barbearia.Endereco = updateDto.Endereco;
            barbearia.Telefone = updateDto.Telefone;
            barbearia.Email = updateDto.Email;

            try
            {
                await _context.SaveChangesAsync();
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


