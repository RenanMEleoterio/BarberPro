using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.DTOs;
using BarbeariaSaaS.Models;
using BarbeariaSaaS.Services;

namespace BarbeariaSaaS.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly BarbeariaContext _context;
        private readonly IAuthService _authService;

        public AuthController(BarbeariaContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginDto loginDto)
        {
            // Validação de email
            if (string.IsNullOrWhiteSpace(loginDto.Email) || !IsValidEmail(loginDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Validação de senha
            if (string.IsNullOrWhiteSpace(loginDto.Senha))
            {
                return BadRequest(new { message = "Senha é obrigatória", field = "senha" });
            }

            var usuario = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (usuario == null || !_authService.VerifyPassword(loginDto.Senha, usuario.SenhaHash))
            {
                return Unauthorized(new { message = "Email ou senha incorretos", field = "credentials" });
            }

            var token = _authService.GenerateJwtToken(usuario);

            var response = new LoginResponseDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario.ToString(),
                BarbeariaId = usuario.BarbeariaId,
                NomeBarbearia = usuario.Barbearia?.Nome,
                Token = token
            };

            return Ok(response);
        }

        [HttpPost("cadastro-cliente")]
        public async Task<ActionResult<LoginResponseDto>> CadastroCliente(CadastroClienteDto cadastroDto)
        {
            // Validação de nome
            if (string.IsNullOrWhiteSpace(cadastroDto.Nome) || cadastroDto.Nome.Length < 2)
            {
                return BadRequest(new { message = "Nome deve ter pelo menos 2 caracteres", field = "nome" });
            }

            // Validação de email
            if (string.IsNullOrWhiteSpace(cadastroDto.Email) || !IsValidEmail(cadastroDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Validação de senha
            if (string.IsNullOrWhiteSpace(cadastroDto.Senha) || cadastroDto.Senha.Length < 6)
            {
                return BadRequest(new { message = "Senha deve ter pelo menos 6 caracteres", field = "senha" });
            }

            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Este email já está em uso", field = "email" });
            }

            var usuario = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Cliente,
                BarbeariaId = null
            };

            try
            {
                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                var token = _authService.GenerateJwtToken(usuario);

                var response = new LoginResponseDto
                {
                    Id = usuario.Id,
                    Nome = usuario.Nome,
                    Email = usuario.Email,
                    TipoUsuario = usuario.TipoUsuario.ToString(),
                    BarbeariaId = null,
                    NomeBarbearia = null,
                    Token = token
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro no cadastro de cliente: {ex.Message}");
                Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar cliente", details = ex.Message });
            }
        }

        [HttpPost("cadastro-barbeiro")]
        public async Task<ActionResult<LoginResponseDto>> CadastroBarbeiro(CadastroBarbeiroDto cadastroDto)
        {
            // Validação de nome
            if (string.IsNullOrWhiteSpace(cadastroDto.Nome) || cadastroDto.Nome.Length < 2)
            {
                return BadRequest(new { message = "Nome deve ter pelo menos 2 caracteres", field = "nome" });
            }

            // Validação de email
            if (string.IsNullOrWhiteSpace(cadastroDto.Email) || !IsValidEmail(cadastroDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Validação de senha
            if (string.IsNullOrWhiteSpace(cadastroDto.Senha) || cadastroDto.Senha.Length < 6)
            {
                return BadRequest(new { message = "Senha deve ter pelo menos 6 caracteres", field = "senha" });
            }

            // Validação de código de convite
            if (string.IsNullOrWhiteSpace(cadastroDto.CodigoConvite))
            {
                return BadRequest(new { message = "Código de convite é obrigatório", field = "codigoConvite" });
            }

            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Este email já está em uso", field = "email" });
            }

            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.CodigoConvite == cadastroDto.CodigoConvite);

            if (barbearia == null)
            {
                return BadRequest(new { message = "Código de convite inválido", field = "codigoConvite" });
            }

            var usuario = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Barbeiro,
                BarbeariaId = barbearia.Id,
                Especialidades = cadastroDto.Especialidades,
                Descricao = cadastroDto.Descricao
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateJwtToken(usuario);

            var response = new LoginResponseDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario.ToString(),
                BarbeariaId = usuario.BarbeariaId,
                NomeBarbearia = barbearia.Nome,
                Token = token
            };

            return Ok(response);
        }

        [HttpPost("cadastro-gerente")]
        public async Task<ActionResult<LoginResponseDto>> CadastroGerente(CadastroGerenteDto cadastroDto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email já está em uso" });
            }

            var barbearia = await _context.Barbearias.FindAsync(cadastroDto.BarbeariaId);
            if (barbearia == null)
            {
                return BadRequest(new { message = "Barbearia não encontrada" });
            }

            var gerente = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Gerente,
                BarbeariaId = cadastroDto.BarbeariaId
            };

            _context.Usuarios.Add(gerente);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateJwtToken(gerente);

            var response = new LoginResponseDto
            {
                Id = gerente.Id,
                Nome = gerente.Nome,
                Email = gerente.Email,
                TipoUsuario = gerente.TipoUsuario.ToString(),
                BarbeariaId = gerente.BarbeariaId,
                NomeBarbearia = barbearia.Nome,
                Token = token
            };

            return Ok(response);
        }

        [HttpPost("cadastro-barbearia")]
        public async Task<ActionResult<LoginResponseDto>> CadastroBarbearia(CadastroBarbeariaDto cadastroDto)
        {
            // Validação de nome
            if (string.IsNullOrWhiteSpace(cadastroDto.Nome) || cadastroDto.Nome.Length < 2)
            {
                return BadRequest(new { message = "Nome da barbearia deve ter pelo menos 2 caracteres", field = "nome" });
            }

            // Validação de email
            if (string.IsNullOrWhiteSpace(cadastroDto.Email) || !IsValidEmail(cadastroDto.Email))
            {
                return BadRequest(new { message = "Email da barbearia inválido", field = "email" });
            }

            // Validação de telefone
            if (string.IsNullOrWhiteSpace(cadastroDto.Telefone))
            {
                return BadRequest(new { message = "Telefone da barbearia é obrigatório", field = "telefone" });
            }

            if (await _context.Barbearias.AnyAsync(b => b.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email da barbearia já está em uso", field = "email" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Criar barbearia
                var barbearia = new Barbearia
                {
                    Nome = cadastroDto.Nome,
                    Endereco = cadastroDto.Endereco,
                    Telefone = cadastroDto.Telefone,
                    Email = cadastroDto.Email,
                    Logo = cadastroDto.Logo,
                    CodigoConvite = _authService.GenerateCodigoConvite()
                };

                _context.Barbearias.Add(barbearia);
                await _context.SaveChangesAsync();

                // Criar usuário gerente para a barbearia
                var gerente = new Usuario
                {
                    Nome = "Gerente " + barbearia.Nome, // Nome padrão para o gerente
                    Email = cadastroDto.Email, // Usar o email da barbearia como email do gerente
                    SenhaHash = _authService.HashPassword("admin123"), // Senha padrão para o gerente
                    TipoUsuario = TipoUsuario.Gerente,
                    BarbeariaId = barbearia.Id
                };

                _context.Usuarios.Add(gerente);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Gerar token para o gerente
                var token = _authService.GenerateJwtToken(gerente);

                var response = new LoginResponseDto
                {
                    Id = gerente.Id,
                    Nome = gerente.Nome,
                    Email = gerente.Email,
                    TipoUsuario = gerente.TipoUsuario.ToString(),
                    BarbeariaId = gerente.BarbeariaId,
                    NomeBarbearia = barbearia.Nome,
                    Token = token
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Erro interno do servidor: " + ex.Message });
            }
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}