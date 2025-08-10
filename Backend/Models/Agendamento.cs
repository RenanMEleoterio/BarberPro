using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    public enum StatusAgendamento
    {
        Confirmado = 1,
        Cancelado = 2,
        Realizado = 3
    }

    public class Agendamento
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClienteId { get; set; }

        [ForeignKey("ClienteId")]
        public virtual Usuario Cliente { get; set; }

        [Required]
        public int BarbeiroId { get; set; }

        [ForeignKey("BarbeiroId")]
        public virtual Usuario Barbeiro { get; set; }

        [Required]
        public DateTime DataHora { get; set; }

        [StringLength(500)]
        public string Observacoes { get; set; }

        [Required]
        public StatusAgendamento Status { get; set; } = StatusAgendamento.Confirmado;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }

        // FK para Barbearia (para facilitar consultas)
        [Required]
        public int BarbeariaId { get; set; }

        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }

        // Campos adicionais para integração
        [Column(TypeName = "decimal(10,2)")]
        public decimal? PrecoServico { get; set; }

        [StringLength(50)]
        public string MetodoPagamento { get; set; } // "Dinheiro", "Cartao", "Pix"

        [StringLength(200)]
        public string TipoServico { get; set; } // "Corte", "Barba", "Corte + Barba", etc.
    }
}

