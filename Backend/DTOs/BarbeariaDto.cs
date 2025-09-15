namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para representar informações básicas de uma barbearia.
    /// Utilizado para exibir dados da barbearia sem expor informações sensíveis ou desnecessárias.
    /// </summary>
    public class BarbeariaDto
    {
        /// <summary>
        /// O ID único da barbearia.
        /// </summary>
        public int Id { get; set; } = 0;
        /// <summary>
        /// O nome da barbearia.
        /// </summary>
        public string Nome { get; set; } = string.Empty;
        /// <summary>
        /// O endereço físico da barbearia.
        /// </summary>
        public string Endereco { get; set; } = string.Empty;
        /// <summary>
        /// O número de telefone de contato da barbearia.
        /// </summary>
        public string Telefone { get; set; } = string.Empty;
        /// <summary>
        /// O endereço de e-mail da barbearia.
        /// </summary>
        public string Email { get; set; } = string.Empty;
    }
}


