using System.ComponentModel.DataAnnotations;

namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para o cadastro de uma nova barbearia e seu gerente inicial.
    /// Contém os dados necessários para registrar uma barbearia e criar a conta do gerente associado.
    /// </summary>
    public class CadastroBarbeariaDto
    {
        /// <summary>
        /// O nome da barbearia. Campo obrigatório com mínimo de 2 caracteres.
        /// </summary>
        [Required(ErrorMessage = "O nome da barbearia é obrigatório.")]
        [MinLength(2, ErrorMessage = "O nome da barbearia deve ter pelo menos 2 caracteres.")]
        public string Nome { get; set; }

        /// <summary>
        /// O endereço físico da barbearia. Campo obrigatório.
        /// </summary>
        [Required(ErrorMessage = "O endereço é obrigatório.")]
        public string Endereco { get; set; }

        /// <summary>
        /// O número de telefone de contato da barbearia. Campo obrigatório com formato de telefone válido.
        /// </summary>
        [Required(ErrorMessage = "O telefone é obrigatório.")]
        [Phone(ErrorMessage = "Formato de telefone inválido.")]
        public string Telefone { get; set; }

        /// <summary>
        /// O endereço de e-mail da barbearia, que também será o e-mail do gerente inicial. Campo obrigatório com formato de e-mail válido.
        /// </summary>
        [Required(ErrorMessage = "O email é obrigatório.")]
        [EmailAddress(ErrorMessage = "Formato de email inválido.")]
        public string Email { get; set; }

        /// <summary>
        /// A senha para a conta do gerente inicial da barbearia. Campo obrigatório com mínimo de 6 caracteres.
        /// </summary>
        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(6, ErrorMessage = "A senha deve ter pelo menos 6 caracteres.")]
        public string Senha { get; set; }

        /// <summary>
        /// URL ou caminho para o logo da barbearia (opcional).
        /// </summary>
        public string Logo { get; set; }
    }

    /// <summary>
    /// DTO para a resposta do cadastro de uma nova barbearia.
    /// Contém informações sobre a barbearia recém-criada, incluindo seus códigos de convite e barbearia.
    /// </summary>
    public class CadastroBarbeariaResponseDto
    {
        /// <summary>
        /// O ID único da barbearia cadastrada.
        /// </summary>
        public int BarbeariaId { get; set; }
        /// <summary>
        /// O nome da barbearia cadastrada.
        /// </summary>
        public string NomeBarbearia { get; set; }
        /// <summary>
        /// O código de convite gerado para a barbearia, usado para novos barbeiros se cadastrarem.
        /// </summary>
        public string CodigoConvite { get; set; }
        /// <summary>
        /// O código único da barbearia, usado para identificação interna ou em outras operações.
        /// </summary>
        public string CodigoBarbearia { get; set; }
    }
}


