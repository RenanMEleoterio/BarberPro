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
    [ApiController] // Indica que esta classe é um controlador de API.
    [Route("api/auth")] // Define a rota base para todos os endpoints neste controlador.
    public class AuthController : ControllerBase // Herda de ControllerBase para funcionalidades de controlador de API.
    {
        private readonly BarbeariaContext _context; // Contexto do banco de dados para interagir com o EF Core.
        private readonly IAuthService _authService; // Serviço para operações de autenticação (hash de senha, geração de token).
        private readonly IGoogleAuthService _googleAuthService; // Serviço para autenticação via Google.

        // Construtor do controlador, injetando as dependências necessárias.
        public AuthController(BarbeariaContext context, IAuthService authService, IGoogleAuthService googleAuthService)
        {
            _context = context;
            _authService = authService;
            _googleAuthService = googleAuthService;
        }

        [HttpPost("login")] // Define um endpoint POST para login de usuários.
        public async Task<ActionResult<SecureLoginResponseDto>> Login(LoginDto loginDto)
        {
            // Validação de email: verifica se o email não está vazio e é válido.
            if (string.IsNullOrWhiteSpace(loginDto.Email) || !IsValidEmail(loginDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Validação de senha: verifica se a senha não está vazia.
            if (string.IsNullOrWhiteSpace(loginDto.Senha))
            {
                return BadRequest(new { message = "Senha é obrigatória", field = "senha" });
            }

            // Busca o usuário no banco de dados pelo email, incluindo os dados da barbearia associada.
            var usuario = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            // Verifica se o usuário existe e se a senha fornecida corresponde ao hash armazenado.
            if (usuario == null || !_authService.VerifyPassword(loginDto.Senha, usuario.SenhaHash))
            {
                return Unauthorized(new { message = "Email ou senha incorretos", field = "credentials" });
            }

            // Gera um token JWT para o usuário autenticado.
            var token = _authService.GenerateJwtToken(usuario);

            // Cria o objeto de resposta com os dados do usuário e o token.
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

            return Ok(response); // Retorna sucesso com os dados do usuário e o token.
        }

        [HttpPost("cadastro-cliente")] // Define um endpoint POST para cadastro de clientes.
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroCliente(CadastroClienteDto cadastroDto)
        {
            // Validação de nome: verifica se o nome não está vazio e tem pelo menos 2 caracteres.
            if (string.IsNullOrWhiteSpace(cadastroDto.Nome) || cadastroDto.Nome.Length < 2)
            {
                return BadRequest(new { message = "Nome deve ter pelo menos 2 caracteres", field = "nome" });
            }

            // Validação de email: verifica se o email não está vazio e é válido.
            if (string.IsNullOrWhiteSpace(cadastroDto.Email) || !IsValidEmail(cadastroDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Validação de senha: verifica se a senha não está vazia e tem pelo menos 6 caracteres.
            if (string.IsNullOrWhiteSpace(cadastroDto.Senha) || cadastroDto.Senha.Length < 6)
            {
                return BadRequest(new { message = "Senha deve ter pelo menos 6 caracteres", field = "senha" });
            }

            // Verifica se já existe um usuário com o email fornecido.
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Este email já está em uso", field = "email" });
            }

            // Cria um novo objeto de usuário com os dados fornecidos.
            var usuario = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha), // Gera o hash da senha.
                TipoUsuario = TipoUsuario.Cliente, // Define o tipo de usuário como Cliente.
                BarbeariaId = null, // Clientes não estão associados a uma barbearia específica inicialmente.
                DataCriacao = DateTime.UtcNow // Define a data de criação como UTC.
            };

            try
            {
                _context.Usuarios.Add(usuario); // Adiciona o novo usuário ao contexto do banco de dados.
                await _context.SaveChangesAsync(); // Salva as alterações no banco de dados.

                var token = _authService.GenerateJwtToken(usuario); // Gera um token JWT para o novo cliente.

                // Cria o objeto de resposta.
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

                return Ok(response); // Retorna sucesso com os dados do cliente e o token.
            }
            catch (Exception ex)
            {
                // Em caso de erro, loga a exceção e retorna um erro interno do servidor.
                Console.WriteLine($"Erro ao cadastrar cliente: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar cliente", details = ex.Message });
            }
        }

        [HttpPost("cadastro-barbeiro")] // Define um endpoint POST para cadastro de barbeiros.
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroBarbeiro(CadastroBarbeiroDto cadastroDto)
        {
            // Validação de nome.
            if (string.IsNullOrWhiteSpace(cadastroDto.Nome) || cadastroDto.Nome.Length < 2)
            {
                return BadRequest(new { message = "Nome deve ter pelo menos 2 caracteres", field = "nome" });
            }

            // Validação de email.
            if (string.IsNullOrWhiteSpace(cadastroDto.Email) || !IsValidEmail(cadastroDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Validação de senha.
            if (string.IsNullOrWhiteSpace(cadastroDto.Senha) || cadastroDto.Senha.Length < 6)
            {
                return BadRequest(new { message = "Senha deve ter pelo menos 6 caracteres", field = "senha" });
            }

            // Validação de código da barbearia.
            if (string.IsNullOrWhiteSpace(cadastroDto.CodigoBarbearia))
            {
                return BadRequest(new { message = "Código da barbearia é obrigatório", field = "codigoBarbearia" });
            }

            // Verifica se o email já está em uso.
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Este email já está em uso", field = "email" });
            }

            // Busca a barbearia pelo código fornecido.
            var barbearia = await _context.Barbearias
                .FirstOrDefaultAsync(b => b.CodigoBarbearia == cadastroDto.CodigoBarbearia);

            // Se a barbearia não for encontrada, retorna erro.
            if (barbearia == null)
            {
                return BadRequest(new { message = "Código da barbearia inválido", field = "codigoBarbearia" });
            }

            // Cria um novo objeto de usuário para o barbeiro.
            var usuario = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Barbeiro,
                BarbeariaId = barbearia.Id,
                Especialidades = cadastroDto.Especialidades,
                Descricao = cadastroDto.Descricao,
                DataCriacao = DateTime.UtcNow // Define a data de criação como UTC.
            };

            _context.Usuarios.Add(usuario); // Adiciona o barbeiro ao contexto.
            await _context.SaveChangesAsync(); // Salva as alterações.

            var token = _authService.GenerateJwtToken(usuario); // Gera o token JWT.

            // Cria o objeto de resposta.
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

            return Ok(response); // Retorna sucesso.
        }

        [HttpPost("cadastro-gerente")] // Define um endpoint POST para cadastro de gerentes.
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroGerente(CadastroGerenteDto cadastroDto)
        {
            // Verifica se o email já está em uso.
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email já está em uso" });
            }

            // Busca a barbearia pelo ID.
            var barbearia = await _context.Barbearias.FindAsync(cadastroDto.BarbeariaId);
            if (barbearia == null)
            {
                return BadRequest(new { message = "Barbearia não encontrada" });
            }

            // Cria um novo objeto de usuário para o gerente.
            var gerente = new Usuario
            {
                Nome = cadastroDto.Nome,
                Email = cadastroDto.Email,
                SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                TipoUsuario = TipoUsuario.Gerente,
                BarbeariaId = cadastroDto.BarbeariaId,
                DataCriacao = DateTime.UtcNow // Define a data de criação como UTC.
            };

            _context.Usuarios.Add(gerente); // Adiciona o gerente ao contexto.
            await _context.SaveChangesAsync(); // Salva as alterações.

            var token = _authService.GenerateJwtToken(gerente); // Gera o token JWT.

            // Cria o objeto de resposta.
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

            return Ok(response); // Retorna sucesso.
        }

        [HttpPost("cadastro-barbearia")] // Define um endpoint POST para cadastro de barbearias e seu gerente inicial.
        public async Task<ActionResult<SecureLoginResponseDto>> CadastroBarbearia(CadastroBarbeariaDto cadastroDto)
        {
            // Validação de nome da barbearia.
            if (string.IsNullOrWhiteSpace(cadastroDto.Nome) || cadastroDto.Nome.Length < 2)
            {
                return BadRequest(new { message = "Nome da barbearia deve ter pelo menos 2 caracteres", field = "nome" });
            }

            // Validação de email da barbearia.
            if (string.IsNullOrWhiteSpace(cadastroDto.Email) || !IsValidEmail(cadastroDto.Email))
            {
                return BadRequest(new { message = "Email da barbearia inválido", field = "email" });
            }

            // Validação de telefone da barbearia.
            if (string.IsNullOrWhiteSpace(cadastroDto.Telefone))
            {
                return BadRequest(new { message = "Telefone da barbearia é obrigatório", field = "telefone" });
            }

            // Verifica se o email da barbearia já está em uso.
            if (await _context.Barbearias.AnyAsync(b => b.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Email da barbearia já está em uso", field = "email" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync(); // Inicia uma transação de banco de dados para garantir atomicidade.

            try
            {
                // Gera um código de convite único para a barbearia.
                string codigoConvite;
                do
                {
                    codigoConvite = _authService.GenerateCodigoConvite();
                } while (await _context.Barbearias.AnyAsync(b => b.CodigoConvite == codigoConvite));

                // Gera um código de barbearia único.
                string codigoBarbearia;
                do
                {
                    codigoBarbearia = _authService.GenerateCodigoBarbearia();
                } while (await _context.Barbearias.AnyAsync(b => b.CodigoBarbearia == codigoBarbearia));

                // Cria um novo objeto de barbearia.
                var barbearia = new Barbearia
                {
                    Nome = cadastroDto.Nome,
                    Endereco = cadastroDto.Endereco,
                    Telefone = cadastroDto.Telefone,
                    Email = cadastroDto.Email,
                    Logo = cadastroDto.Logo,
                    CodigoConvite = codigoConvite,
                    CodigoBarbearia = codigoBarbearia,
                    DataCriacao = DateTime.UtcNow // Define a data de criação como UTC.
                };

                _context.Barbearias.Add(barbearia); // Adiciona a barbearia ao contexto.
                await _context.SaveChangesAsync(); // Salva a barbearia no banco de dados.

                // Cria um usuário gerente para a barbearia recém-criada.
                var gerente = new Usuario
                {
                    Nome = cadastroDto.Nome, // Usa o nome da barbearia como nome do gerente.
                    Email = cadastroDto.Email, // Usa o email da barbearia como email do gerente.
                    SenhaHash = _authService.HashPassword(cadastroDto.Senha), // Gera o hash da senha do gerente.
                    TipoUsuario = TipoUsuario.Gerente, // Define o tipo de usuário como Gerente.
                    BarbeariaId = barbearia.Id, // Associa o gerente à barbearia criada.
                    DataCriacao = DateTime.UtcNow // Define a data de criação como UTC.
                };

                _context.Usuarios.Add(gerente); // Adiciona o gerente ao contexto.
                await _context.SaveChangesAsync(); // Salva o gerente no banco de dados.

                await transaction.CommitAsync(); // Confirma a transação se todas as operações forem bem-sucedidas.

                // Gera um token para o gerente.
                var token = _authService.GenerateJwtToken(gerente);

                // Cria o objeto de resposta.
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

                return Ok(response); // Retorna sucesso.
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(); // Em caso de erro, reverte a transação.
                // Loga a exceção completa para depuração.
                Console.WriteLine($"Erro ao cadastrar barbearia: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar barbearia", details = ex.Message });
            }
        }

        // Método auxiliar para validar o formato de um email.
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

        [HttpPost("google-auth")] // Define um endpoint POST para autenticação via Google.
        public async Task<ActionResult<SecureLoginResponseDto>> GoogleAuth(GoogleAuthDto googleAuthDto)
        {
            try
            {
                // Verifica o token do Google fornecido.
                var googleUser = await _googleAuthService.VerifyGoogleTokenAsync(googleAuthDto.IdToken);

                // Verifica se o usuário já existe no banco de dados pelo email ou GoogleId.
                var existingUser = await _context.Usuarios
                    .Include(u => u.Barbearia)
                    .FirstOrDefaultAsync(u => u.Email == googleUser.Email || u.GoogleId == googleUser.Sub);

                if (existingUser != null)
                {
                    // Se o usuário já existe, realiza o login.
                    // Atualiza o GoogleId se ainda não estiver definido.
                    if (string.IsNullOrEmpty(existingUser.GoogleId))
                    {
                        existingUser.GoogleId = googleUser.Sub;
                        await _context.SaveChangesAsync();
                    }

                    var token = _authService.GenerateJwtToken(existingUser); // Gera o token JWT para o usuário existente.

                    // Cria o objeto de resposta.
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

                    return Ok(response); // Retorna sucesso.
                }

                // Se o usuário não existe, cria um novo usuário Google.
                return await CreateGoogleUser(googleUser, googleAuthDto);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message }); // Retorna erro de não autorizado.
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno do servidor" }); // Retorna erro interno do servidor.
            }
        }

        // Método auxiliar para criar um novo usuário a partir dos dados do Google.
        private async Task<ActionResult<SecureLoginResponseDto>> CreateGoogleUser(GoogleUserInfo googleUser, GoogleAuthDto googleAuthDto)
        {
            // Valida o tipo de usuário fornecido na requisição.
            if (!Enum.TryParse<TipoUsuario>(googleAuthDto.TipoUsuario, out var tipoUsuario))
            {
                return BadRequest(new { message = "Tipo de usuário inválido", field = "tipoUsuario" });
            }

            // Validações adicionais para barbeiro/gerente.
            Barbearia barbearia = null;
            if (tipoUsuario == TipoUsuario.Barbeiro || tipoUsuario == TipoUsuario.Gerente)
            {
                if (string.IsNullOrWhiteSpace(googleAuthDto.CodigoBarbearia))
                {
                    return BadRequest(new { message = "Código da barbearia é obrigatório para barbeiro/gerente", field = "codigoBarbearia" });
                }

                barbearia = await _context.Barbearias.FirstOrDefaultAsync(b => b.CodigoBarbearia == googleAuthDto.CodigoBarbearia);
                if (barbearia == null)
                {
                    return BadRequest(new { message = "Código da barbearia inválido", field = "codigoBarbearia" });
                }
            }

            // Verifica se o email do Google já está em uso por um usuário local.
            if (await _context.Usuarios.AnyAsync(u => u.Email == googleUser.Email && u.GoogleId == null))
            {
                return BadRequest(new { message = "Este email já está registrado localmente. Por favor, faça login com sua senha ou use outro email.", field = "email" });
            }

            // Cria um novo usuário com base nas informações do Google.
            var newUser = new Usuario
            {
                Nome = googleUser.Name,
                Email = googleUser.Email,
                GoogleId = googleUser.Sub,
                TipoUsuario = tipoUsuario,
                BarbeariaId = barbearia?.Id, // Associa à barbearia se for barbeiro/gerente.
                DataCriacao = DateTime.UtcNow
            };

            _context.Usuarios.Add(newUser); // Adiciona o novo usuário ao contexto.
            await _context.SaveChangesAsync(); // Salva as alterações.

            var token = _authService.GenerateJwtToken(newUser); // Gera o token JWT para o novo usuário.

            // Cria o objeto de resposta.
            var response = new SecureLoginResponseDto
            {
                Id = newUser.Id,
                Nome = newUser.Nome,
                Email = newUser.Email,
                TipoUsuario = newUser.TipoUsuario.ToString(),
                BarbeariaId = newUser.BarbeariaId,
                NomeBarbearia = barbearia?.Nome,
                Token = token
            };

            return Ok(response); // Retorna sucesso.
        }

        [HttpPost("forgot-password")] // Define um endpoint POST para recuperação de senha.
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            // Validação de email.
            if (string.IsNullOrWhiteSpace(forgotPasswordDto.Email) || !IsValidEmail(forgotPasswordDto.Email))
            {
                return BadRequest(new { message = "Email inválido", field = "email" });
            }

            // Busca o usuário pelo email.
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == forgotPasswordDto.Email);
            if (user == null)
            {
                // Retorna sucesso mesmo se o usuário não for encontrado para evitar enumeração de usuários.
                return Ok(new { message = "Se o email estiver registrado, um link de redefinição de senha será enviado." });
            }

            // Gera um token de redefinição de senha e o salva no banco de dados.
            var resetToken = _authService.GeneratePasswordResetToken();
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1); // Token expira em 1 hora.
            await _context.SaveChangesAsync();

            // TODO: Enviar email com o link de redefinição de senha.
            // Por enquanto, apenas loga o token para fins de desenvolvimento/teste.
            Console.WriteLine($"Password Reset Token for {user.Email}: {resetToken}");

            return Ok(new { message = "Se o email estiver registrado, um link de redefinição de senha será enviado." });
        }

        [HttpPost("reset-password")] // Define um endpoint POST para redefinição de senha.
        public async Task<ActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            // Validação de token e nova senha.
            if (string.IsNullOrWhiteSpace(resetPasswordDto.Token) || string.IsNullOrWhiteSpace(resetPasswordDto.NewPassword) || resetPasswordDto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Token inválido ou senha muito curta (mínimo 6 caracteres)" });
            }

            // Busca o usuário pelo token de redefinição.
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.PasswordResetToken == resetPasswordDto.Token && u.PasswordResetTokenExpires > DateTime.UtcNow);

            if (user == null)
            {
                return BadRequest(new { message = "Token de redefinição de senha inválido ou expirado." });
            }

            // Atualiza a senha do usuário.
            user.SenhaHash = _authService.HashPassword(resetPasswordDto.NewPassword);
            user.PasswordResetToken = null; // Invalida o token após o uso.
            user.PasswordResetTokenExpires = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Senha redefinida com sucesso." });
        }
    }
}


