using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BarbeiroController : ControllerBase
    {
        private readonly BarbeariaContext _context;

        public BarbeiroController(BarbeariaContext context)
        {
            _context = context;
        }

        [HttpGet("perfil/{id}")]
        public async Task<ActionResult> GetPerfil(int id)
        {
            var barbeiro = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == id && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
                return NotFound("Barbeiro não encontrado");

            var perfil = new
            {
                Id = barbeiro.Id,
                Nome = barbeiro.Nome,
                Email = barbeiro.Email,
                Telefone = barbeiro.Telefone ?? "",
                Endereco = barbeiro.Endereco ?? "",
                Especialidades = barbeiro.Especialidades ?? "",
                Descricao = barbeiro.Descricao ?? "",
                BarbeariaId = barbeiro.BarbeariaId,
                DataCriacao = barbeiro.DataCriacao
            };

            return Ok(perfil);
        }

        [HttpPut("perfil/{id}")]
        public async Task<ActionResult> UpdatePerfil(int id, [FromBody] UpdatePerfilBarbeiroDto dto)
        {
            var barbeiro = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == id && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro == null)
                return NotFound("Barbeiro não encontrado");

            // Verificar se o email já está em uso por outro usuário
            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != barbeiro.Email)
            {
                var emailExists = await _context.Usuarios
                    .AnyAsync(u => u.Email == dto.Email && u.Id != id);
                
                if (emailExists)
                    return BadRequest("Este email já está em uso");
            }

            // Atualizar os dados
            if (!string.IsNullOrEmpty(dto.Nome))
                barbeiro.Nome = dto.Nome;
            
            if (!string.IsNullOrEmpty(dto.Email))
                barbeiro.Email = dto.Email;
            
            barbeiro.Telefone = dto.Telefone ?? barbeiro.Telefone;
            barbeiro.Endereco = dto.Endereco ?? barbeiro.Endereco;
            barbeiro.Especialidades = dto.Especialidades ?? barbeiro.Especialidades;
            barbeiro.Descricao = dto.Descricao ?? barbeiro.Descricao;

            try
            {
                await _context.SaveChangesAsync();
                
                var perfilAtualizado = new
                {
                    Id = barbeiro.Id,
                    Nome = barbeiro.Nome,
                    Email = barbeiro.Email,
                    Telefone = barbeiro.Telefone ?? "",
                    Endereco = barbeiro.Endereco ?? "",
                    Especialidades = barbeiro.Especialidades ?? "",
                    Descricao = barbeiro.Descricao ?? "",
                    BarbeariaId = barbeiro.BarbeariaId,
                    DataCriacao = barbeiro.DataCriacao
                };

                return Ok(perfilAtualizado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }

    public class UpdatePerfilBarbeiroDto
    {
        public string? Nome { get; set; }
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? Endereco { get; set; }
        public string? Especialidades { get; set; }
        public string? Descricao { get; set; }
    }
}

