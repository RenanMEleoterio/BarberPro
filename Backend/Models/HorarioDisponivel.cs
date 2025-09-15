using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    /// <summary>
    /// Classe que representa o modelo de dados para um Horário Disponível de um barbeiro.
    /// </summary>
    public class HorarioDisponivel
    {
        /// <summary>
        /// O ID único do horário disponível. É a chave primária da tabela.
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// A data e hora específicas do horário disponível. Campo obrigatório.
        /// </summary>
        [Required]
        public DateTime DataHora { get; set; }

        /// <summary>
        /// O ID do barbeiro ao qual este horário pertence. Campo obrigatório.
        /// </summary>
        [Required]
        public int BarbeiroId { get; set; }

        /// <summary>
        /// Propriedade de navegação para o objeto Barbeiro (usuário). Define BarbeiroId como chave estrangeira.
        /// </summary>
        [ForeignKey("BarbeiroId")]
        public virtual Usuario Barbeiro { get; set; }

        /// <summary>
        /// Indica se o horário está atualmente disponível para agendamento. Padrão é 'true'. Campo obrigatório.
        /// </summary>
        [Required]
        public bool EstaDisponivel { get; set; } = true;

        /// <summary>
        /// A data e hora de criação do registro do horário disponível. Definida automaticamente como UTC.
        /// </summary>
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Coleção de agendamentos associados a este horário disponível. Um horário pode estar associado a múltiplos agendamentos (embora geralmente seja um para um).
        /// </summary>
        public virtual ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
    }
}


