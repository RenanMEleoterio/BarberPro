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
    [Route("api/[controller]")]
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
            var usuario = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (usuario == null || !_authService.VerifyPassword(loginDto.Senha, usuario.SenhaHash))
            {
                return Unauthorized(new { message = "Email ou senha inválidos" });
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
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email já está em uso" });
            }

            var usuario = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Cliente,
                BarbeariaId = cadastroDto.BarbeariaId
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateJwtToken(usuario);

            string? nomeBarbearia = null;
            if (cadastroDto.BarbeariaId.HasValue)
            {
                var barbearia = await _context.Barbearias.FindAsync(cadastroDto.BarbeariaId.Value);
                nomeBarbearia = barbearia?.Nome;
            }

            var response = new LoginResponseDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario.ToString(),
                BarbeariaId = usuario.BarbeariaId,
                NomeBarbearia = nomeBarbearia,
                Token = token
            };

            return Ok(response);
        }

        [HttpPost("cadastro-barbeiro")]
        public async Task<ActionResult<LoginResponseDto>> CadastroBarbeiro(CadastroBarbeiroDto cadastroDto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email já está em uso" });
            }

            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.CodigoConvite == cadastroDto.CodigoConvite);

            if (barbearia == null)
            {
                return BadRequest(new { message = "Código de convite inválido" });
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

        [HttpPost("cadastro-barbearia")]
        public async Task<ActionResult<CadastroBarbeariaResponseDto>> CadastroBarbearia(CadastroBarbeariaDto cadastroDto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.EmailGerente))
            {
                return BadRequest(new { message = "Email do gerente já está em uso" });
            }

            if (await _context.Barbearias.AnyAsync(b => b.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email da barbearia já está em uso" });
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

                // Criar gerente
                var gerente = new Usuario
                {
                    Nome = cadastroDto.NomeGerente,
                    Email = cadastroDto.EmailGerente,
                    SenhaHash = _authService.HashPassword(cadastroDto.SenhaGerente),
                    TipoUsuario = TipoUsuario.Gerente,
                    BarbeariaId = barbearia.Id
                };

                _context.Usuarios.Add(gerente);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                var token = _authService.GenerateJwtToken(gerente);

                var response = new CadastroBarbeariaResponseDto
                {
                    BarbeariaId = barbearia.Id,
                    NomeBarbearia = barbearia.Nome,
                    CodigoConvite = barbearia.CodigoConvite,
                    Gerente = new LoginResponseDto
                    {
                        Id = gerente.Id,
                        Nome = gerente.Nome,
                        Email = gerente.Email,
                        TipoUsuario = gerente.TipoUsuario.ToString(),
                        BarbeariaId = gerente.BarbeariaId,
                        NomeBarbearia = barbearia.Nome,
                        Token = token
                    }
                };

                return Ok(response);
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Erro interno do servidor" });
            }
        }
    }
}

