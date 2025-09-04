using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    // Classe que representa o modelo de dados para um Horário Disponível de um barbeiro.
    public class HorarioDisponivel
    {
        [Key] // Define 'Id' como a chave primária da tabela.
        public int Id { get; set; }

        [Required] // Campo obrigatório.
        public DateTime DataHora { get; set; } // Data e hora do horário disponível.

        [Required] // Campo obrigatório.
        public int BarbeiroId { get; set; } // ID do barbeiro ao qual este horário pertence.

        [ForeignKey("BarbeiroId")] // Define 'BarbeiroId' como chave estrangeira para a entidade Usuario (Barbeiro).
        public virtual Usuario Barbeiro { get; set; } // Propriedade de navegação para o objeto Barbeiro.

        [Required] // Campo obrigatório.
        public bool EstaDisponivel { get; set; } = true; // Indica se o horário está disponível para agendamento (padrão: true).

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow; // Data de criação do registro, definida como UTC.

        // Relacionamentos:
        // Um horário disponível pode estar associado a múltiplos agendamentos (embora geralmente seja um para um).
        public virtual ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
    }
}


