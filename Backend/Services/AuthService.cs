using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BarbeariaSaaS.Models;
using System.Linq;
using System.Collections.Generic;
using System;

namespace BarbeariaSaaS.Services
{
    /// <summary>
    /// Interface para o serviço de autenticação, definindo os métodos disponíveis.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Gera um hash seguro para uma senha.
        /// </summary>
        /// <param name="password">A senha em texto puro.</param>
        /// <returns>O hash da senha.</returns>
        string HashPassword(string password);
        /// <summary>
        /// Verifica se uma senha em texto puro corresponde a um hash de senha.
        /// </summary>
        /// <param name="password">A senha em texto puro.</param>
        /// <param name="hash">O hash da senha armazenado.</param>
        /// <returns>True se a senha corresponder ao hash, caso contrário, false.</returns>
        bool VerifyPassword(string password, string hash);
        /// <summary>
        /// Gera um JSON Web Token (JWT) para um usuário autenticado.
        /// </summary>
        /// <param name="usuario">O objeto Usuario para o qual o token será gerado.</param>
        /// <returns>O token JWT como uma string.</returns>
        string GenerateJwtToken(Usuario usuario);
        /// <summary>
        /// Gera um código de convite único para barbearias.
        /// </summary>
        /// <returns>Um código de convite único.</returns>
        string GenerateCodigoConvite();
        /// <summary>
        /// Gera um código de barbearia único.
        /// </summary>
        /// <returns>Um código de barbearia único.</returns>
        string GenerateCodigoBarbearia();
        /// <summary>
        /// Gera um token de redefinição de senha seguro.
        /// </summary>
        /// <returns>Um token de redefinição de senha.</returns>
        string GeneratePasswordResetToken();
    }

    /// <summary>
    /// Implementação do serviço de autenticação, responsável por hashing de senhas, geração de tokens JWT
    /// e geração de códigos únicos para convites e barbearias.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Construtor do serviço de autenticação. Injeta a configuração da aplicação para acessar chaves JWT.
        /// </summary>
        /// <param name="configuration">A configuração da aplicação.</param>
        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Gera um hash seguro para uma senha usando o algoritmo BCrypt.
        /// </summary>
        /// <param name="password">A senha em texto puro.</param>
        /// <returns>O hash da senha.</returns>
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Verifica se uma senha em texto puro corresponde a um hash de senha BCrypt.
        /// </summary>
        /// <param name="password">A senha em texto puro.</param>
        /// <param name="hash">O hash da senha armazenado.</param>
        /// <returns>True se a senha corresponder ao hash, caso contrário, false.</returns>
        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        /// <summary>
        /// Gera um JSON Web Token (JWT) para um usuário, incluindo claims como ID, nome, email e tipo de usuário.
        /// Se o usuário estiver associado a uma barbearia, o ID da barbearia também é incluído.
        /// O token é assinado com uma chave simétrica e tem um tempo de expiração.
        /// </summary>
        /// <param name="usuario">O objeto Usuario para o qual o token será gerado.</param>
        /// <returns>O token JWT como uma string.</returns>
        public string GenerateJwtToken(Usuario usuario)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not found"));
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Nome),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim("TipoUsuario", usuario.TipoUsuario.ToString())
            };

            if (usuario.BarbeariaId.HasValue)
            {
                claims.Add(new Claim("BarbeariaId", usuario.BarbeariaId.Value.ToString()));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Gera um código de convite alfanumérico de 8 caracteres para barbearias.
        /// Utiliza caracteres que são menos propensos a confusão visual (excluindo 0, O, I, 1).
        /// A geração é criptograficamente segura.
        /// </summary>
        /// <returns>Um código de convite único de 8 caracteres.</returns>
        public string GenerateCodigoConvite()
        {
            // Usar caracteres alfanuméricos (excluindo caracteres confusos como 0, O, I, 1)
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            
            // Usar RNGCryptoServiceProvider para geração criptograficamente segura
            using (var rng = RandomNumberGenerator.Create())
            {
                var bytes = new byte[8];
                var result = new char[8];
                
                for (int i = 0; i < 8; i++)
                {
                    rng.GetBytes(bytes);
                    result[i] = chars[bytes[0] % chars.Length];
                }
                
                return new string(result);
            }
        }

        /// <summary>
        /// Gera um código de barbearia alfanumérico de 8 caracteres.
        /// Utiliza caracteres alfanuméricos (incluindo números e letras maiúsculas e minúsculas).
        /// A geração é criptograficamente segura.
        /// </summary>
        /// <returns>Um código de barbearia único de 8 caracteres.</returns>
        public string GenerateCodigoBarbearia()
        {
            // Usar caracteres alfanuméricos (incluindo números e letras maiúsculas e minúsculas)
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
            
            // Usar RNGCryptoServiceProvider para geração criptograficamente segura
            using (var rng = RandomNumberGenerator.Create())
            {
                var bytes = new byte[8];
                var result = new char[8];
                
                for (int i = 0; i < 8; i++)
                {
                    rng.GetBytes(bytes);
                    result[i] = chars[bytes[0] % chars.Length];
                }
                
                return new string(result);
            }
        }

        /// <summary>
        /// Gera um token de redefinição de senha seguro usando um gerador de números aleatórios criptograficamente seguro.
        /// O token é retornado como uma string Base64.
        /// </summary>
        /// <returns>Uma string representando o token de redefinição de senha.</returns>
        public string GeneratePasswordResetToken()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                var bytes = new byte[32]; // 32 bytes para um token de 256 bits
                rng.GetBytes(bytes);
                return Convert.ToBase64String(bytes); // Converte para string Base64
            }
        }
    }
}


