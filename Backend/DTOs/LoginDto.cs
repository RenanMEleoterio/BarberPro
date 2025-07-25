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
    }

    public class LoginResponseDto
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public string? Email { get; set; }
        public string? TipoUsuario { get; set; }
        public int? BarbeariaId { get; set; }
        public string? NomeBarbearia { get; set; }
        public string? Token { get; set; }
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

    public class CadastroBarbeiroDto
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

        [Required]
        [StringLength(10)]
        public string CodigoConvite { get; set; }

        public string? Especialidades { get; set; }
        public string? Descricao { get; set; }
    }

    public class CadastroBarbeariaDto
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [Required]
        [StringLength(200)]
        public string Endereco { get; set; }

        [Required]
        [StringLength(20)]
        public string Telefone { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string? Logo { get; set; }

        // Dados do gerente
        [Required]
        [StringLength(100)]
        public string NomeGerente { get; set; }

        [Required]
        [EmailAddress]
        public string EmailGerente { get; set; }

        [Required]
        [MinLength(6)]
        public string SenhaGerente { get; set; }
    }

    public class CadastroBarbeariaResponseDto
    {
        public int BarbeariaId { get; set; }
        public string NomeBarbearia { get; set; }
        public string CodigoConvite { get; set; }
        public LoginResponseDto Gerente { get; set; }
    }
}

