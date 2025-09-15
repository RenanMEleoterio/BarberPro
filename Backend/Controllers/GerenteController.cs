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

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) para permitir a interação com o Entity Framework Core.
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public GerenteController(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retorna informações detalhadas sobre uma barbearia específica, como ID, nome, endereço, telefone, e-mail e código de convite.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia a ser consultada.</param>
        /// <returns>ActionResult contendo um objeto anônimo com as informações da barbearia ou NotFound se a barbearia não for encontrada.</returns>
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

        /// <summary>
        /// Retorna uma lista de barbeiros associados a uma barbearia específica, incluindo seus IDs, nomes, especialidades e descrições.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <returns>ActionResult contendo uma lista de objetos BarbeiroDto.</returns>
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

        /// <summary>
        /// Retorna uma lista de clientes que possuem agendamentos ou estão associados a uma barbearia específica,
        /// incluindo seus IDs, nomes e e-mails.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <returns>ActionResult contendo uma lista de objetos anônimos com informações dos clientes.</returns>
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

        /// <summary>
        /// Retorna uma lista de todos os agendamentos de uma barbearia específica, incluindo o nome do cliente,
        /// nome do barbeiro, data/hora e status do agendamento.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <returns>ActionResult contendo uma lista de objetos anônimos com informações dos agendamentos.</returns>
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

        /// <summary>
        /// Retorna a contagem de agendamentos para o dia atual em uma barbearia específica.
        /// </summary>
        /// <param name="barbeariaId">O ID da barbearia.</param>
        /// <returns>ActionResult contendo um objeto anônimo com a contagem de agendamentos para hoje.</returns>
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


