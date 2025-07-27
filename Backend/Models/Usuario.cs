using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    public enum TipoUsuario
    {
        Cliente = 1,
        Barbeiro = 2,
        Gerente = 3
    }

    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(255)]
        public string SenhaHash { get; set; }

        [Required]
        public TipoUsuario TipoUsuario { get; set; }

        // FK para Barbearia (apenas para Barbeiro e Gerente)
        public int? BarbeariaId { get; set; }

        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }

        // Propriedades específicas para Barbeiro
        [StringLength(500)]
        public string Foto { get; set; }
        [StringLength(500)]
       public string Especialidades { get; set; }

        [StringLength(1000)]
       public string Descricao { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        // Relacionamentos
        public virtual ICollection<HorarioDisponivel> HorariosDisponiveis { get; set; } = new List<HorarioDisponivel>();
        public virtual ICollection<Agendamento> AgendamentosComoBarbeiro { get; set; } = new List<Agendamento>();
        public virtual ICollection<Agendamento> AgendamentosComoCliente { get; set; } = new List<Agendamento>();
    }
}

