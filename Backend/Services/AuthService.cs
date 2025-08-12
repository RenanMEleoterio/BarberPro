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
    public interface IAuthService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
        string GenerateJwtToken(Usuario usuario);
        string GenerateCodigoConvite();
        string GenerateCodigoBarbearia();
    }

    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        public string GenerateJwtToken(Usuario usuario)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            
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
    }
}

