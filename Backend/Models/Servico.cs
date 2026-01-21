using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    /// <summary>
    /// Classe que representa o modelo de dados para um Serviço oferecido por uma barbearia.
    /// </summary>
    public class Servico
    {
        /// <summary>
        /// O ID único do serviço. É a chave primária da tabela.
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Nome do serviço (ex: 'Corte de Cabelo', 'Barba'). Campo obrigatório com tamanho máximo de 100 caracteres.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        /// <summary>
        /// Preço do serviço. Campo obrigatório com precisão decimal (18 dígitos no total, 2 após a vírgula).
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Preco { get; set; }

        /// <summary>
        /// Duração estimada do serviço em minutos. Campo obrigatório.
        /// </summary>
        [Required]
        public int DuracaoMinutos { get; set; }

        /// <summary>
        /// ID da barbearia que oferece este serviço. Chave estrangeira para a entidade Barbearia.
        /// </summary>
        public int BarbeariaId { get; set; }
        /// <summary>
        /// Propriedade de navegação para o objeto Barbearia. Define BarbeariaId como chave estrangeira.
        /// </summary>
        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }

        public virtual ICollection<AgendamentoServico> AgendamentoServicos { get; set; }
    }
}


