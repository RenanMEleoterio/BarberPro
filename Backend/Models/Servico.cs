using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    // Classe que representa o modelo de dados para um Serviço oferecido por uma barbearia.
    public class Servico
    {
        [Key] // Define 'Id' como a chave primária da tabela.
        public int Id { get; set; }

        [Required] // Campo obrigatório.
        [StringLength(100)] // Define o tamanho máximo da string.
        public string Nome { get; set; } // Nome do serviço (ex: 'Corte de Cabelo', 'Barba').

        [Required] // Campo obrigatório.
        [Column(TypeName = "decimal(18, 2)")] // Define o tipo de coluna no banco de dados para precisão decimal.
        public decimal Preco { get; set; } // Preço do serviço.

        [Required] // Campo obrigatório.
        public int DuracaoMinutos { get; set; } // Duração estimada do serviço em minutos.

        // Chave estrangeira para Barbearia:
        public int BarbeariaId { get; set; } // ID da barbearia que oferece este serviço.
        [ForeignKey("BarbeariaId")] // Define 'BarbeariaId' como chave estrangeira para a entidade Barbearia.
        public virtual Barbearia Barbearia { get; set; } // Propriedade de navegação para o objeto Barbearia.
    }
}


