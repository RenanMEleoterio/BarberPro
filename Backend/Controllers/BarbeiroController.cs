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

        /// <summary>
        /// Construtor do controlador. Injeta o contexto do banco de dados (BarbeariaContext) para permitir a interação com o Entity Framework Core.
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public BarbeiroController(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retorna o perfil de um barbeiro específico com base no seu ID.
        /// </summary>
        /// <param name="id">O ID do barbeiro a ser consultado.</param>
        /// <returns>ActionResult contendo um objeto anônimo com os detalhes do perfil do barbeiro ou NotFound se o barbeiro não for encontrado.</returns>
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
                Especialidades = barbeiro.Especialidades ?? "",
                Descricao = barbeiro.Descricao ?? "",
                BarbeariaId = barbeiro.BarbeariaId,
                DataCriacao = barbeiro.DataCriacao
            };

            return Ok(perfil);
        }

        /// <summary>
        /// Atualiza as informações do perfil de um barbeiro existente.
        /// Permite modificar o nome, email, telefone, especialidades e descrição.
        /// Inclui validação para garantir que o novo email não esteja em uso por outro usuário.
        /// </summary>
        /// <param name="id">O ID do barbeiro a ser atualizado.</param>
        /// <param name="dto">Objeto contendo os novos dados do perfil do barbeiro.</param>
        /// <returns>ActionResult contendo o perfil atualizado ou um erro (NotFound, BadRequest, StatusCode 500).</returns>
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
                    Especialidades = barbeiro.Especialidades ?? "",
                    Descricao = barbeiro.Descricao ?? "",
                    BarbeariaId = barbeiro.BarbeariaId,
                    DataCriacao = barbeiro.DataCriacao
                };

                return Ok(perfilAtualizado);
            }
            catch
            {
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }

    /// <summary>
    /// DTO para atualização do perfil do barbeiro.
    /// </summary>
    public class UpdatePerfilBarbeiroDto
    {
        /// <summary>
        /// Nome do barbeiro (opcional).
        /// </summary>
        public string? Nome { get; set; }
        /// <summary>
        /// Email do barbeiro (opcional).
        /// </summary>
        public string? Email { get; set; }
        /// <summary>
        /// Telefone do barbeiro (opcional).
        /// </summary>
        public string? Telefone { get; set; }
        /// <summary>
        /// Especialidades do barbeiro (opcional).
        /// </summary>
        public string? Especialidades { get; set; }
        /// <summary>
        /// Descrição do barbeiro (opcional).
        /// </summary>
        public string? Descricao { get; set; }
    }
}


