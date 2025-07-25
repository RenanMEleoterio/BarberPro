using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    public class HorarioDisponivel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime DataHora { get; set; }

        [Required]
        public int BarbeiroId { get; set; }

        [ForeignKey("BarbeiroId")]
        public virtual Usuario Barbeiro { get; set; }

        [Required]
        public bool EstaDisponivel { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        // Relacionamentos
        public virtual ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
    }
}

