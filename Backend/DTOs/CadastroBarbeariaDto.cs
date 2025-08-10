using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
    public class CadastroBarbeariaDto
    {
        [Required(ErrorMessage = "O nome da barbearia é obrigatório.")]
        [MinLength(2, ErrorMessage = "O nome da barbearia deve ter pelo menos 2 caracteres.")]
        public string Nome { get; set; }

        [Required(ErrorMessage = "O endereço é obrigatório.")]
        public string Endereco { get; set; }

        [Required(ErrorMessage = "O telefone é obrigatório.")]
        [Phone(ErrorMessage = "Formato de telefone inválido.")]
        public string Telefone { get; set; }

        [Required(ErrorMessage = "O email é obrigatório.")]
        [EmailAddress(ErrorMessage = "Formato de email inválido.")]
        public string Email { get; set; }

        public string Logo { get; set; }
    }

    public class CadastroBarbeariaResponseDto
    {
        public int BarbeariaId { get; set; }
        public string NomeBarbearia { get; set; }
        public string CodigoConvite { get; set; }
    }
}

