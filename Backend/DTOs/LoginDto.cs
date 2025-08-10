using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Senha { get; set; }

        [Required]
        public string TipoUsuario { get; set; }
    }

    public class LoginResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Email { get; set; }
        public string TipoUsuario { get; set; }
        public int? BarbeariaId { get; set; }
        public string NomeBarbearia { get; set; }
        public string Token { get; set; }
    }

    public class CadastroClienteDto
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MinLength(6)]
        public string Senha { get; set; }

        public int? BarbeariaId { get; set; }
    }
}

