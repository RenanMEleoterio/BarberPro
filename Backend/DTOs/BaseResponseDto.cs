using System.Text.Json.Serialization;

namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) base para respostas de usuário.
    /// Contém informações comuns do usuário que podem ser retornadas em diversas operações.
    /// </summary>
    public class BaseUserResponseDto
    {
        /// <summary>
        /// O ID único do usuário.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// O nome completo do usuário.
        /// </summary>
        public string Nome { get; set; }
        /// <summary>
        /// O endereço de e-mail do usuário.
        /// </summary>
        public string Email { get; set; }
        /// <summary>
        /// O tipo de usuário (ex: "Cliente", "Barbeiro", "Gerente").
        /// </summary>
        public string TipoUsuario { get; set; }
        /// <summary>
        /// O ID da barbearia à qual o usuário está associado (nulo para clientes sem barbearia específica).
        /// </summary>
        public int? BarbeariaId { get; set; }
        /// <summary>
        /// O nome da barbearia à qual o usuário está associado.
        /// </summary>
        public string NomeBarbearia { get; set; }
        
        /// <summary>
        /// O hash da senha do usuário. Este campo é ignorado na serialização JSON para segurança.
        /// </summary>
        [JsonIgnore]
        public string SenhaHash { get; set; }
    }

    /// <summary>
    /// DTO para respostas de login seguro. Estende BaseUserResponseDto adicionando o token JWT.
    /// Utilizado para retornar os dados do usuário e o token de autenticação após um login bem-sucedido.
    /// </summary>
    public class SecureLoginResponseDto
    {
        /// <summary>
        /// O ID único do usuário.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// O nome completo do usuário.
        /// </summary>
        public string Nome { get; set; }
        /// <summary>
        /// O endereço de e-mail do usuário.
        /// </summary>
        public string Email { get; set; }
        /// <summary>
        /// O tipo de usuário (ex: "Cliente", "Barbeiro", "Gerente").
        /// </summary>
        public string TipoUsuario { get; set; }
        /// <summary>
        /// O ID da barbearia à qual o usuário está associado (nulo para clientes sem barbearia específica).
        /// </summary>
        public int? BarbeariaId { get; set; }
        /// <summary>
        /// O nome da barbearia à qual o usuário está associado.
        /// </summary>
        public string NomeBarbearia { get; set; }
        /// <summary>
        /// O token JWT (JSON Web Token) para autenticação futura.
        /// </summary>
        public string Token { get; set; }
        
        // Dados sensíveis nunca devem ser incluídos
        // - Senha (hash ou plain text)
        // - Códigos internos de convite
        // - Informações de sessão
    }
}


