using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para o cadastro de um novo barbeiro.
    /// Contém as informações necessárias para registrar um barbeiro no sistema e associá-lo a uma barbearia existente.
    /// </summary>
    public class CadastroBarbeiroDto
    {
        /// <summary>
        /// O nome completo do barbeiro. Campo obrigatório com comprimento máximo de 100 caracteres.
        /// </summary>
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; }

        /// <summary>
        /// O endereço de e-mail do barbeiro. Campo obrigatório com formato de e-mail válido.
        /// </summary>
        [Required(ErrorMessage = "O email é obrigatório.")]
        [EmailAddress(ErrorMessage = "Formato de email inválido.")]
        public string Email { get; set; }

        /// <summary>
        /// A senha para a conta do barbeiro. Campo obrigatório com mínimo de 6 caracteres.
        /// </summary>
        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(6, ErrorMessage = "A senha deve ter pelo menos 6 caracteres.")]
        public string Senha { get; set; }

        /// <summary>
        /// O código único da barbearia à qual o barbeiro será associado. Campo obrigatório com comprimento máximo de 10 caracteres.
        /// </summary>
        [Required(ErrorMessage = "O código da barbearia é obrigatório.")]
        [StringLength(10, ErrorMessage = "O código da barbearia deve ter no máximo 10 caracteres.")]
        public string CodigoBarbearia { get; set; }

        /// <summary>
        /// As especialidades do barbeiro (opcional), por exemplo, "Corte Masculino", "Barba Clássica".
        /// </summary>
        public string? Especialidades { get; set; }
        /// <summary>
        /// Uma descrição sobre o barbeiro (opcional).
        /// </summary>
        public string? Descricao { get; set; }
    }
}


