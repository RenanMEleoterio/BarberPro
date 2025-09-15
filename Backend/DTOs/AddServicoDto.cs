namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para adicionar um novo serviço.
    /// Utilizado para receber os dados de entrada ao criar um serviço.
    /// </summary>
    public class AddServicoDto
    {
        /// <summary>
        /// Nome do serviço, por exemplo, "Corte de Cabelo", "Barba", "Coloração".
        /// </summary>
        public string Nome { get; set; }
        /// <summary>
        /// Preço do serviço.
        /// </summary>
        public decimal Preco { get; set; }
        /// <summary>
        /// Duração estimada do serviço em minutos.
        /// </summary>
        public int DuracaoMinutos { get; set; }
        /// <summary>
        /// ID da barbearia à qual este serviço pertence.
        /// </summary>
        public int BarbeariaId { get; set; }
    }
}


