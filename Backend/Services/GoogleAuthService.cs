using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using BarbeariaSaaS.DTOs;
using Microsoft.Extensions.Configuration;

namespace BarbeariaSaaS.Services
{
    /// <summary>
    /// Interface para o serviço de autenticação com Google, definindo os métodos disponíveis.
    /// </summary>
    public interface IGoogleAuthService
    {
        /// <summary>
        /// Verifica a validade de um token de ID do Google e retorna as informações do usuário.
        /// </summary>
        /// <param name="idToken">O token de ID emitido pelo Google.</param>
        /// <returns>Um objeto GoogleUserInfo contendo as informações do usuário se o token for válido.</returns>
        /// <exception cref="UnauthorizedAccessException">Lançada se o token for inválido ou não verificado.</exception>
        Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken);
    }

    /// <summary>
    /// Implementação do serviço de autenticação com Google, responsável por verificar tokens de ID do Google.
    /// </summary>
    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Construtor do serviço de autenticação Google. Injeta HttpClient para fazer requisições HTTP
        /// e IConfiguration para acessar configurações da aplicação (como o Client ID do Google).
        /// </summary>
        /// <param name="httpClient">Cliente HTTP para realizar requisições.</param>
        /// <param name="configuration">Configurações da aplicação.</param>
        public GoogleAuthService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        /// <summary>
        /// Verifica a validade de um token de ID do Google usando a API de tokeninfo do Google.
        /// Garante que o token é válido para esta aplicação e que o email do usuário foi verificado.
        /// </summary>
        /// <param name="idToken">O token de ID do Google a ser verificado.</param>
        /// <returns>Um objeto GoogleUserInfo com os dados do usuário do Google.</returns>
        /// <exception cref="UnauthorizedAccessException">Lançada se o token for inválido, não pertencer à aplicação ou o email não for verificado.</exception>
        public async Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken)
        {
            try
            {
                // Faz uma requisição à API de tokeninfo do Google para verificar o token.
                var response = await _httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");
                
                // Se a resposta não for de sucesso, o token é considerado inválido.
                if (!response.IsSuccessStatusCode)
                {
                    throw new UnauthorizedAccessException("Token inválido");
                }

                // Lê o conteúdo da resposta e desserializa para um JsonElement.
                var content = await response.Content.ReadAsStringAsync();
                var tokenInfo = JsonSerializer.Deserialize<JsonElement>(content);

                // Obtém o Client ID da configuração da aplicação.
                var clientId = _configuration["Google:ClientId"];
                // Verifica se o token foi emitido para o Client ID correto da aplicação.
                if (tokenInfo.GetProperty("aud").GetString() != clientId)
                {
                    throw new UnauthorizedAccessException("Token não é válido para esta aplicação");
                }

                // Verifica se o email do usuário foi verificado pelo Google.
                var emailVerified = tokenInfo.GetProperty("email_verified").GetString() == "true";
                if (!emailVerified)
                {
                    throw new UnauthorizedAccessException("Email não verificado pelo Google");
                }

                // Retorna as informações do usuário do Google em um objeto GoogleUserInfo.
                return new GoogleUserInfo
                {
                    Sub = tokenInfo.GetProperty("sub").GetString() ?? string.Empty, // ID único do usuário no Google.
                    Email = tokenInfo.GetProperty("email").GetString() ?? string.Empty, // Email do usuário.
                    Name = tokenInfo.GetProperty("name").GetString() ?? string.Empty, // Nome completo do usuário.
                    Picture = tokenInfo.TryGetProperty("picture", out var picture) ? picture.GetString() ?? string.Empty : string.Empty, // URL da foto de perfil (se disponível).
                    EmailVerified = emailVerified // Status de verificação do email.
                };
            }
            catch (Exception ex) when (!(ex is UnauthorizedAccessException))
            {
                // Captura outras exceções e as encapsula em UnauthorizedAccessException para padronizar o tratamento de erros de autenticação.
                throw new UnauthorizedAccessException("Erro ao verificar token do Google", ex);
            }
        }
    }
}


