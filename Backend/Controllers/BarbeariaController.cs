using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
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
        public async Task<ActionResult<List<BarbeariaDto>>> GetBarbearias()
        {
            var barbearias = await _context.Barbearias
                .Select(b => new BarbeariaDto
                {
                    Id = b.Id,
                    Nome = b.Nome,
                    Endereco = b.Endereco,
                    Telefone = b.Telefone,
                    Email = b.Email
                })
                .ToListAsync();

            return Ok(barbearias);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<BarbeariaDto>>> SearchBarbearias([FromQuery] string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
            {
                return await GetBarbearias();
            }

            var barbearias = await _context.Barbearias
                .Where(b => b.Nome.ToLower().Contains(nome.ToLower()))
                .Select(b => new BarbeariaDto
                {
                    Id = b.Id,
                    Nome = b.Nome,
                    Endereco = b.Endereco,
                    Telefone = b.Telefone,
                    Email = b.Email
                })
                .ToListAsync();

            return Ok(barbearias);
        }

        [HttpGet("{barbeariaId}/barbeiros")]
        public async Task<ActionResult<List<BarbeiroDto>>> GetBarbeirosByBarbearia(int barbeariaId)
        {
            var barbeiros = await _context.Usuarios
                .Where(u => u.TipoUsuario == Models.TipoUsuario.Barbeiro && u.BarbeariaId == barbeariaId)
                .Select(u => new BarbeiroDto
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    Especialidades = u.Especialidades,
                    Descricao = u.Descricao
                })
                .ToListAsync();

            return Ok(barbeiros);
        }
    }
}

