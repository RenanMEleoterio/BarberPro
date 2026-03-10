using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Senha { get; set; } = string.Empty;

        [Required]
        public string TipoUsuario { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TipoUsuario { get; set; } = string.Empty;
        public int? BarbeariaId { get; set; }
        public string NomeBarbearia { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    public class CadastroClienteDto
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Senha { get; set; } = string.Empty;

        public int? BarbeariaId { get; set; }
    }
}

