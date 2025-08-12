using System.Text.Json.Serialization;

namespace BarbeariaSaaS.DTOs
{
    public class BaseUserResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string TipoUsuario { get; set; }
        public int? BarbeariaId { get; set; }
        public string NomeBarbearia { get; set; }
        
        // Senha nunca deve ser incluída nas respostas
        [JsonIgnore]
        public string SenhaHash { get; set; }
    }

    public class SecureLoginResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string TipoUsuario { get; set; }
        public int? BarbeariaId { get; set; }
        public string NomeBarbearia { get; set; }
        public string Token { get; set; }
        
        // Dados sensíveis nunca devem ser incluídos
        // - Senha (hash ou plain text)
        // - Códigos internos de convite
        // - Informações de sessão
    }
}

