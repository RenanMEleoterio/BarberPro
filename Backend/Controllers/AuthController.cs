using BarbeariaSaaS.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;
using BarbeariaSaaS.Services;
using System.Text.RegularExpressions;

namespace BarbeariaSaaS.Controllers
{
    [ApiController] // Indica que esta classe é um controlador de API.
    [Route("api/auth")] // Define a rota base para todos os endpoints neste controlador.
    public class AuthController : ControllerBase // Herda de ControllerBase para funcionalidades de controlador de API.
    {
        private readonly BarbeariaContext _context; // Contexto do banco de dados para interagir com o EF Core.
        private readonly IAuthService _authService; // Serviço para operações de autenticação (hash de senha, geração de token).
        private readonly IGoogleAuthService _googleAuthService; // Serviço para autenticação via Google.

        /// <summary>
        /// Construtor do controlador, injetando as dependências necessárias.
        /// </summary>
        /// <param name="context">Contexto do banco de dados para interagir com o EF Core.</param>
        /// <param name="authService">Serviço para operações de autenticação (hash de senha, geração de token).</param>
        /// <param name="googleAuthService">Serviço para autenticação via Google.</param>
        public AuthController(BarbeariaContext context, IAuthService authService, IGoogleAuthService googleAuthService)
        {
            _context = context;
            _authService = authService;
            _googleAuthService = googleAuthService;
        }

        /// <summary>
        /// Autentica um usuário no sistema. Valida o email e a senha fornecidos, verifica as credenciais no banco de dados
        /// e, se válidas, gera um token JWT para o usuário.
        /// </summary>
        /// <param name="loginDto">Objeto contendo o email e a senha do usuário para login.</param>
        /// <returns>ActionResult<SecureLoginResponseDto> contendo os dados do usuário logado e o token JWT, ou um erro de autenticação.</returns>
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

        /// <summary>
        /// Registra um novo cliente no sistema. Valida os dados fornecidos (nome, email, senha), verifica se o email já está em uso,
        /// cria um novo usuário com tipo Cliente, faz o hash da senha e gera um token JWT.
        /// </summary>
        /// <param name="cadastroDto">Objeto contendo os dados para o cadastro do cliente (nome, email, senha).</param>
        /// <returns>ActionResult<SecureLoginResponseDto> contendo os dados do cliente registrado e o token JWT, ou um erro de validação/cadastro.</returns>
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

        /// <summary>
        /// Registra um novo barbeiro no sistema. Valida os dados (nome, email, senha, código da barbearia), verifica a existência da barbearia pelo código,
        /// cria um usuário Barbeiro associado à barbearia, faz o hash da senha e gera um token JWT.
        /// </summary>
        /// <param name="cadastroDto">Objeto contendo os dados para o cadastro do barbeiro (nome, email, senha, código da barbearia, especialidades, descrição).</param>
        /// <returns>ActionResult<SecureLoginResponseDto> contendo os dados do barbeiro registrado e o token JWT, ou um erro de validação/cadastro.</returns>
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

            // Validação de código de identificação da barbearia (pode ser Código da Barbearia ou Código de Convite).
            var codigoIdentificacao = !string.IsNullOrWhiteSpace(cadastroDto.CodigoBarbearia)
                ? cadastroDto.CodigoBarbearia
                : cadastroDto.CodigoConvite;

            if (string.IsNullOrWhiteSpace(codigoIdentificacao))
            {
                return BadRequest(new { message = "Código da barbearia é obrigatório", field = "codigoBarbearia" });
            }

            // Verifica se o email já está em uso.
            if (await _context.Usuarios.AnyAsync(u => u.Email == cadastroDto.Email))
            {
                return BadRequest(new { message = "Este email já está em uso", field = "email" });
            }

            // Busca a barbearia pelo código fornecido (prioriza Código da Barbearia, mas aceita também Código de Convite).
            var barbeariaQuery = _context.Barbearias.AsQueryable();
            var barbearia = !string.IsNullOrWhiteSpace(cadastroDto.CodigoBarbearia)
                ? await barbeariaQuery.FirstOrDefaultAsync(b => b.CodigoBarbearia == cadastroDto.CodigoBarbearia)
                : await barbeariaQuery.FirstOrDefaultAsync(b => b.CodigoConvite == cadastroDto.CodigoConvite);

            // Se a barbearia não for encontrada, retorna erro.
            if (barbearia == null)
            {
                return BadRequest(new { message = "Código da barbearia inválido", field = "codigoBarbearia" });
            }

            try
            {
                // Cria um novo objeto de usuário para o barbeiro.
                var usuario = new Usuario
                {
                    Nome = cadastroDto.Nome,
                    Email = cadastroDto.Email,
                    SenhaHash = _authService.HashPassword(cadastroDto.Senha),
                    TipoUsuario = TipoUsuario.Barbeiro,
                    BarbeariaId = barbearia.Id,
                    Especialidades = cadastroDto.Especialidades ?? string.Empty,
                    Descricao = cadastroDto.Descricao ?? string.Empty,
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
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao cadastrar barbeiro: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar barbeiro", details = ex.Message });
            }
        }

        /// <summary>
        /// Registra um novo gerente no sistema. Valida os dados (email, ID da barbearia), verifica a existência da barbearia,
        /// cria um usuário Gerente associado à barbearia, faz o hash da senha e gera um token JWT.
        /// </summary>
        /// <param name="cadastroDto">Objeto contendo os dados para o cadastro do gerente (nome, email, senha, ID da barbearia).</param>
        /// <returns>ActionResult<SecureLoginResponseDto> contendo os dados do gerente registrado e o token JWT, ou um erro de validação/cadastro.</returns>
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

        /// <summary>
        /// Registra uma nova barbearia e seu gerente inicial. Valida os dados da barbearia e do gerente, gera códigos únicos de convite e de barbearia,
        /// cria a barbearia e um usuário Gerente associado a ela, tudo dentro de uma transação para garantir a integridade dos dados.
        /// </summary>
        /// <param name="cadastroDto">Objeto contendo os dados para o cadastro da barbearia (nome, endereço, telefone, email, logo) e do gerente (nome, email, senha).</param>
        /// <returns>ActionResult<SecureLoginResponseDto> contendo os dados do gerente da barbearia registrada e o token JWT, ou um erro de validação/cadastro.</returns>
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
                await transaction.RollbackAsync(); // Em caso de erro, desfaz a transação.
                Console.WriteLine($"Erro ao cadastrar barbearia: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor ao cadastrar barbearia", details = ex.Message });
            }
        }

        /// <summary>
        /// Inicia o processo de recuperação de senha. Se o email fornecido estiver registrado, gera um token de redefinição de senha,
        /// o armazena no banco de dados com um tempo de expiração e simula o envio de um link de redefinição (atualmente, apenas loga o token).
        /// </summary>
        /// <param name="forgotPasswordDto">Objeto contendo o email do usuário que esqueceu a senha.</param>
        /// <returns>ActionResult indicando que um link de redefinição será enviado se o email estiver registrado.</returns>
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
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

        /// <summary>
        /// Redefine a senha do usuário usando um token de redefinição. Valida o token e a nova senha, atualiza a senha do usuário no banco de dados
        /// e invalida o token de redefinição.
        /// </summary>
        /// <param name="resetPasswordDto">Objeto contendo o token de redefinição e a nova senha.</param>
        /// <returns>ActionResult indicando sucesso ou falha na redefinição da senha.</returns>
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

        /// <summary>
        /// Função auxiliar privada que valida o formato de um endereço de e-mail usando uma expressão regular.
        /// </summary>
        /// <param name="email">O endereço de e-mail a ser validado.</param>
        /// <returns>bool - true se o e-mail for válido, false caso contrário.</returns>
        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                // Usa uma expressão regular para validar o formato do email.
                // Esta é uma validação básica e pode ser ajustada para ser mais rigorosa se necessário.
                return Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(250));
            }
            catch (RegexMatchTimeoutException)
            {
                return false;
            }
        }
    }
}


