using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
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
}

