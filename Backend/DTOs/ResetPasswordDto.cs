namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para a requisição de redefinição de senha.
    /// Contém o token de redefinição e a nova senha.
    /// </summary>
    public class ResetPasswordDto
    {
        /// <summary>
        /// O token de redefinição de senha recebido pelo usuário.
        /// </summary>
        public string Token { get; set; }
        /// <summary>
        /// A nova senha para o usuário.
        /// </summary>
        public string NewPassword { get; set; }
    }
}


