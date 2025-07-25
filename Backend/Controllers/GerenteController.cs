using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.DTOs;
using BarbeariaSaaS.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Linq;
using System;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GerenteController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        public GerenteController(BarbeariaContext context)
        {
            _context = context;
        }

        [HttpGet("barbearia/{barbeariaId}")]
        public async Task<ActionResult> GetBarbeariaInfo(int barbeariaId)
        {
            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.Id == barbeariaId);

            if (barbearia == null)
            {
                return NotFound(new { message = "Barbearia não encontrada" });
            }

            var response = new
            {
                id = barbearia.Id,
                nome = barbearia.Nome,
                endereco = barbearia.Endereco,
                telefone = barbearia.Telefone,
                email = barbearia.Email,
                codigoConvite = barbearia.CodigoConvite
            };

            return Ok(response);
        }

        [HttpGet("barbeiros/{barbeariaId}")]
        public async Task<ActionResult> GetBarbeiros(int barbeariaId)
        {
            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == Models.TipoUsuario.Barbeiro)
                .Select(b => new BarbeiroDto
                {
                    Id = b.Id,
                    Nome = b.Nome,
                    Especialidades = b.Especialidades,
                    Descricao = b.Descricao
                })
                .ToListAsync();

            return Ok(barbeiros);
        }

        [HttpGet("clientes/{barbeariaId}")]
        public async Task<ActionResult> GetClientes(int barbeariaId)
        {
            var clientes = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == Models.TipoUsuario.Cliente)
                .Select(c => new
                {
                    id = c.Id,
                    nome = c.Nome,
                    email = c.Email
                })
                .ToListAsync();

            return Ok(clientes);
        }

        [HttpGet("agendamentos/{barbeariaId}")]
        public async Task<ActionResult> GetAgendamentos(int barbeariaId)
        {
            var agendamentos = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Barbeiro)
                .Where(a => a.Barbeiro.BarbeariaId == barbeariaId)
                .Select(a => new
                {
                    id = a.Id,
                    clienteNome = a.Cliente.Nome,
                    barbeiroNome = a.Barbeiro.Nome,
                    dataHora = a.DataHora,
                    status = a.Status.ToString()
                })
                .ToListAsync();

            return Ok(agendamentos);
        }

        [HttpGet("agendamentos/hoje/{barbeariaId}")]
        public async Task<ActionResult> GetAgendamentosHoje(int barbeariaId)
        {
            var hoje = DateTime.Today;
            var amanha = hoje.AddDays(1);

            var agendamentosHoje = await _context.Agendamentos
                .Include(a => a.Barbeiro)
                .Where(a => a.Barbeiro.BarbeariaId == barbeariaId && 
                           a.DataHora >= hoje && 
                           a.DataHora < amanha)
                .CountAsync();

            return Ok(new { count = agendamentosHoje });
        }
    }
}

