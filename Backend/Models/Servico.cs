using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    public class Servico
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Preco { get; set; }

        [Required]
        public int DuracaoMinutos { get; set; }

        // Chave estrangeira para Barbearia
        public int BarbeariaId { get; set; }
        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }
    }
}


