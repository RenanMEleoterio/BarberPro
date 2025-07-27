using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

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
    }
}

