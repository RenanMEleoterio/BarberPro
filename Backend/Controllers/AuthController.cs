using BarbeariaSaaS.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
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
        private readonly IGoogleAuthService _googleAuthService;

        public AuthController(BarbeariaContext context, IAuthService authService, IGoogleAuthService googleAuthService)
        {
            _context = context;
            _authService = authService;
            _googleAuthService = googleAuthService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<SecureLoginResponseDto>> Login(LoginDto loginDto)
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

            var response = new SecureLoginResponseDto
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
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroCliente(CadastroClienteDto cadastroDto)
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
                BarbeariaId = null,
                DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
            };

            try
            {
                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                var token = _authService.GenerateJwtToken(usuario);

                var response = new SecureLoginResponseDto
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
                Console.WriteLine($"Erro ao cadastrar cliente: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar cliente", details = ex.Message });
            }
        }

        [HttpPost("cadastro-barbeiro")]
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroBarbeiro(CadastroBarbeiroDto cadastroDto)
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

            // Validação de código da barbearia
            if (string.IsNullOrWhiteSpace(cadastroDto.CodigoBarbearia))
            {
                return BadRequest(new { message = "Código da barbearia é obrigatório", field = "codigoBarbearia" });
            }

            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Este email já está em uso", field = "email" });
            }

            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.CodigoBarbearia == cadastroDto.CodigoBarbearia);

            if (barbearia == null)
            {
                return BadRequest(new { message = "Código da barbearia inválido", field = "codigoBarbearia" });
            }

            var usuario = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Barbeiro,
                BarbeariaId = barbearia.Id,
                Especialidades = cadastroDto.Especialidades,
                Descricao = cadastroDto.Descricao,
                DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateJwtToken(usuario);

            var response = new SecureLoginResponseDto
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
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroGerente(CadastroGerenteDto cadastroDto)
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
                BarbeariaId = cadastroDto.BarbeariaId,
                DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
            };

            _context.Usuarios.Add(gerente);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateJwtToken(gerente);

            var response = new SecureLoginResponseDto
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
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroBarbearia(CadastroBarbeariaDto cadastroDto)
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
                // Gerar código único para a barbearia
                string codigoConvite;
                do
                {
                    codigoConvite = _authService.GenerateCodigoConvite();
                } while (await _context.Barbearias.AnyAsync(b => b.CodigoConvite == codigoConvite));

                // Gerar código único da barbearia
                string codigoBarbearia;
                do
                {
                    codigoBarbearia = _authService.GenerateCodigoBarbearia();
                } while (await _context.Barbearias.AnyAsync(b => b.CodigoBarbearia == codigoBarbearia));

                // Criar barbearia
                var barbearia = new Barbearia
                {
                    Nome = cadastroDto.Nome,
                    Endereco = cadastroDto.Endereco,
                    Telefone = cadastroDto.Telefone,
                    Email = cadastroDto.Email,
                    Logo = cadastroDto.Logo,
                    CodigoConvite = codigoConvite,
                    CodigoBarbearia = codigoBarbearia,
                    DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
                };

                _context.Barbearias.Add(barbearia);
                await _context.SaveChangesAsync();

                // Criar usuário gerente para a barbearia
                var gerente = new Usuario
                {
                    Nome = cadastroDto.Nome, // Usar o nome da barbearia como nome do gerente
                    Email = cadastroDto.Email, // Usar o email da barbearia como email do gerente
                    SenhaHash = _authService.HashPassword(cadastroDto.Senha), // Usar a senha fornecida
                    TipoUsuario = TipoUsuario.Gerente,
                    BarbeariaId = barbearia.Id,
                    DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
                };

                _context.Usuarios.Add(gerente);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Gerar token para o gerente
                var token = _authService.GenerateJwtToken(gerente);

                var response = new SecureLoginResponseDto
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
                // Log da exceção completa para depuração
                Console.WriteLine($"Erro ao cadastrar barbearia: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar barbearia", details = ex.Message });
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

        [HttpPost("google-auth")]
        public async Task<ActionResult<SecureLoginResponseDto>> GoogleAuth(GoogleAuthDto googleAuthDto)
        {
            try
            {
                // Verificar o token do Google
                var googleUser = await _googleAuthService.VerifyGoogleTokenAsync(googleAuthDto.IdToken);

                // Verificar se o usuário já existe
                var existingUser = await _context.Usuarios
                    .Include(u => u.Barbearia)
                    .FirstOrDefaultAsync(u => u.Email == googleUser.Email || u.GoogleId == googleUser.Sub);

                if (existingUser != null)
                {
                    // Usuário já existe, fazer login
                    // Atualizar GoogleId se não estiver definido
                    if (string.IsNullOrEmpty(existingUser.GoogleId))
                    {
                        existingUser.GoogleId = googleUser.Sub;
                        await _context.SaveChangesAsync();
                    }

                    var token = _authService.GenerateJwtToken(existingUser);

                    var response = new SecureLoginResponseDto
                    {
                        Id = existingUser.Id,
                        Nome = existingUser.Nome,
                        Email = existingUser.Email,
                        TipoUsuario = existingUser.TipoUsuario.ToString(),
                        BarbeariaId = existingUser.BarbeariaId,
                        NomeBarbearia = existingUser.Barbearia?.Nome,
                        Token = token
                    };

                    return Ok(response);
                }

                // Usuário não existe, criar novo
                return await CreateGoogleUser(googleUser, googleAuthDto);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor" });
            }
        }

        private async Task<ActionResult<SecureLoginResponseDto>> CreateGoogleUser(GoogleUserInfo googleUser, GoogleAuthDto googleAuthDto)
        {
            // Validar tipo de usuário
            if (!Enum.TryParse<TipoUsuario>(googleAuthDto.TipoUsuario, out var tipoUsuario))
            {
                return BadRequest(new { message = "Tipo de usuário inválido", field = "tipoUsuario" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                switch (tipoUsuario)
                {
                    case TipoUsuario.Cliente:
                        return await CreateGoogleClient(googleUser, transaction);

                    case TipoUsuario.Barbeiro:
                        if (string.IsNullOrEmpty(googleAuthDto.CodigoBarbearia))
                        {
                            return BadRequest(new { message = "Código da barbearia é obrigatório para barbeiros", field = "codigoBarbearia" });
                        }
                        var barbeariaBarbeiro = await _context.Barbearias.FirstOrDefaultAsync(b => b.CodigoBarbearia == googleAuthDto.CodigoBarbearia);
                        if (barbeariaBarbeiro == null)
                        {
                            return BadRequest(new { message = "Código da barbearia inválido", field = "codigoBarbearia" });
                        }
                        return await CreateGoogleBarber(googleUser, barbeariaBarbeiro.Id, transaction);

                    case TipoUsuario.Gerente:
                        if (!googleAuthDto.BarbeariaId.HasValue)
                        {
                            return BadRequest(new { message = "ID da barbearia é obrigatório para gerentes", field = "barbeariaId" });
                        }
                        var barbeariaGerente = await _context.Barbearias.FindAsync(googleAuthDto.BarbeariaId.Value);
                        if (barbeariaGerente == null)
                        {
                            return BadRequest(new { message = "Barbearia não encontrada", field = "barbeariaId" });
                        }
                        return await CreateGoogleManager(googleUser, googleAuthDto.BarbeariaId.Value, transaction);

                    default:
                        return BadRequest(new { message = "Tipo de usuário não suportado para cadastro via Google", field = "tipoUsuario" });
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Erro ao criar usuário Google: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao criar usuário Google" });
            }
        }

        private async Task<ActionResult<SecureLoginResponseDto>> CreateGoogleClient(GoogleUserInfo googleUser, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction)
        {
            var usuario = new Usuario
            {
                Nome = googleUser.Name,
                Email = googleUser.Email,
                GoogleId = googleUser.Sub,
                TipoUsuario = TipoUsuario.Cliente,
                DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var token = _authService.GenerateJwtToken(usuario);

            return Ok(new SecureLoginResponseDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario.ToString(),
                Token = token
            });
        }

        private async Task<ActionResult<SecureLoginResponseDto>> CreateGoogleBarber(GoogleUserInfo googleUser, int barbeariaId, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction)
        {
            var usuario = new Usuario
            {
                Nome = googleUser.Name,
                Email = googleUser.Email,
                GoogleId = googleUser.Sub,
                TipoUsuario = TipoUsuario.Barbeiro,
                BarbeariaId = barbeariaId,
                DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var token = _authService.GenerateJwtToken(usuario);

            var barbearia = await _context.Barbearias.FindAsync(barbeariaId);

            return Ok(new SecureLoginResponseDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario.ToString(),
                BarbeariaId = usuario.BarbeariaId,
                NomeBarbearia = barbearia?.Nome,
                Token = token
            });
        }

        private async Task<ActionResult<SecureLoginResponseDto>> CreateGoogleManager(GoogleUserInfo googleUser, int barbeariaId, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction)
        {
            var usuario = new Usuario
            {
                Nome = googleUser.Name,
                Email = googleUser.Email,
                GoogleId = googleUser.Sub,
                TipoUsuario = TipoUsuario.Gerente,
                BarbeariaId = barbeariaId,
                DataCriacao = DateTime.UtcNow // Garantir que DataCriacao seja UTC
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var token = _authService.GenerateJwtToken(usuario);

            var barbearia = await _context.Barbearias.FindAsync(barbeariaId);

            return Ok(new SecureLoginResponseDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario.ToString(),
                BarbeariaId = usuario.BarbeariaId,
                NomeBarbearia = barbearia?.Nome,
                Token = token
            });
        }
    }
}


