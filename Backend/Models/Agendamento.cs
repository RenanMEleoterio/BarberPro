using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    /// <summary>
    /// Enumeração para representar os possíveis status de um agendamento.
    /// </summary>
    public enum StatusAgendamento
    {
        /// <summary>
        /// Agendamento criado, aguardando confirmação.
        /// </summary>
        Pendente = 1,
        /// <summary>
        /// Agendamento confirmado.
        /// </summary>
        Confirmado = 2,
        /// <summary>
        /// Agendamento cancelado.
        /// </summary>
        Cancelado = 3,
        /// <summary>
        /// Agendamento concluído.
        /// </summary>
        Realizado = 4
    }

    /// <summary>
    /// Classe que representa o modelo de dados para um Agendamento no sistema.
    /// </summary>
    public class Agendamento
    {
        /// <summary>
        /// O ID único do agendamento. É a chave primária da tabela.
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// O ID do cliente que fez o agendamento. Campo obrigatório.
        /// </summary>
        [Required]
        public int ClienteId { get; set; }
        /// <summary>
        /// Propriedade de navegação para o objeto Cliente (usuário). Define ClienteId como chave estrangeira.
        /// </summary>
        [ForeignKey("ClienteId")]
        public virtual Usuario Cliente { get; set; }

        /// <summary>
        /// O ID do barbeiro que realizará o serviço. Campo obrigatório.
        /// </summary>
        [Required]
        public int BarbeiroId { get; set; }
        /// <summary>
        /// Propriedade de navegação para o objeto Barbeiro (usuário). Define BarbeiroId como chave estrangeira.
        /// </summary>
        [ForeignKey("BarbeiroId")]
        public virtual Usuario Barbeiro { get; set; }

        /// <summary>
        /// O ID da barbearia onde o agendamento será realizado. Campo obrigatório.
        /// </summary>
        [Required]
        public int BarbeariaId { get; set; }
        /// <summary>
        /// Propriedade de navegação para o objeto Barbearia. Define BarbeariaId como chave estrangeira.
        /// </summary>
        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }

        /// <summary>
        /// A data e hora do agendamento. Campo obrigatório. Será tratada como UTC antes de salvar.
        /// </summary>
        [Required]
        public DateTime DataHora { get; set; }

        /// <summary>
        /// Descrição do tipo de serviço agendado (ex: "Corte de Cabelo", "Barba"). Campo obrigatório com tamanho máximo de 100 caracteres.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string TipoServico { get; set; }

        /// <summary>
        /// O preço do serviço. Campo opcional.
        /// </summary>
        public decimal? PrecoServico { get; set; }

        /// <summary>
        /// Observações adicionais sobre o agendamento. Campo opcional com tamanho máximo de 500 caracteres.
        /// </summary>
        [StringLength(500)]
        public string? Observacoes { get; set; }

        /// <summary>
        /// O status atual do agendamento, utilizando a enumeração StatusAgendamento. Campo obrigatório.
        /// </summary>
        [Required]
        public StatusAgendamento Status { get; set; }

        /// <summary>
        /// O método de pagamento utilizado para o serviço. Campo opcional com tamanho máximo de 50 caracteres.
        /// </summary>
        [StringLength(50)]
        public string? MetodoPagamento { get; set; }

        /// <summary>
        /// A data e hora de criação do agendamento. Definida automaticamente como UTC no momento da criação.
        /// </summary>
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        /// <summary>
        /// A data e hora da última atualização do agendamento. Definida automaticamente como UTC no momento da atualização.
        /// </summary>
        public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// O ID do horário disponível que foi agendado. Campo opcional, usado para vincular o agendamento a um slot de horário específico.
        /// </summary>
        public int? HorarioDisponivelId { get; set; }
        /// <summary>
        /// Propriedade de navegação para o objeto HorarioDisponivel. Define HorarioDisponivelId como chave estrangeira.
        /// </summary>
        [ForeignKey("HorarioDisponivelId")]
        public virtual HorarioDisponivel HorarioDisponivel { get; set; }
    }
}


