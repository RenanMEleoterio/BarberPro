namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para a requisição de recuperação de senha.
    /// Contém o email do usuário que solicitou a recuperação.
    /// </summary>
    public class ForgotPasswordDto
    {
        /// <summary>
        /// O endereço de email do usuário.
        /// </summary>
        public string Email { get; set; }
    }
}


