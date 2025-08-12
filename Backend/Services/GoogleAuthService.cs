using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using BarbeariaSaaS.DTOs;
using Microsoft.Extensions.Configuration;

namespace BarbeariaSaaS.Services
{
    public interface IGoogleAuthService
    {
        Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken);
    }

    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GoogleAuthService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken)
        {
            try
            {
                // Verificar o token com a API do Google
                var response = await _httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");
                
                if (!response.IsSuccessStatusCode)
                {
                    throw new UnauthorizedAccessException("Token inválido");
                }

                var content = await response.Content.ReadAsStringAsync();
                var tokenInfo = JsonSerializer.Deserialize<JsonElement>(content);

                // Verificar se o token é válido para nossa aplicação
                var clientId = _configuration["Google:ClientId"];
                if (tokenInfo.GetProperty("aud").GetString() != clientId)
                {
                    throw new UnauthorizedAccessException("Token não é válido para esta aplicação");
                }

                // Verificar se o email foi verificado
                var emailVerified = tokenInfo.GetProperty("email_verified").GetString() == "true";
                if (!emailVerified)
                {
                    throw new UnauthorizedAccessException("Email não verificado pelo Google");
                }

                return new GoogleUserInfo
                {
                    Sub = tokenInfo.GetProperty("sub").GetString(),
                    Email = tokenInfo.GetProperty("email").GetString(),
                    Name = tokenInfo.GetProperty("name").GetString(),
                    Picture = tokenInfo.TryGetProperty("picture", out var picture) ? picture.GetString() : null,
                    EmailVerified = emailVerified
                };
            }
            catch (Exception ex) when (!(ex is UnauthorizedAccessException))
            {
                throw new UnauthorizedAccessException("Erro ao verificar token do Google", ex);
            }
        }
    }
}

