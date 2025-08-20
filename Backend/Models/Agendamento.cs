using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    public enum StatusAgendamento
    {
        Pendente = 1,
        Confirmado = 2,
        Cancelado = 3,
        Realizado = 4
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
        public int BarbeariaId { get; set; }
        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }

        [Required]
        public DateTime DataHora { get; set; } // Será tratada como UTC antes de salvar

        [Required]
        [StringLength(100)]
        public string TipoServico { get; set; }

        public decimal? PrecoServico { get; set; }

        [StringLength(500)]
        public string? Observacoes { get; set; }

        [Required]
        public StatusAgendamento Status { get; set; }

        [StringLength(50)]
        public string? MetodoPagamento { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow; // Garantir que seja UTC
        public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow; // Garantir que seja UTC

        // FK para HorarioDisponivel (se o agendamento foi feito a partir de um horário específico)
        public int? HorarioDisponivelId { get; set; }
        [ForeignKey("HorarioDisponivelId")]
        public virtual HorarioDisponivel HorarioDisponivel { get; set; }
    }
}


