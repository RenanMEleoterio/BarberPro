using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    // Enumeração para representar os possíveis status de um agendamento.
    public enum StatusAgendamento
    {
        Pendente = 1,   // Agendamento criado, aguardando confirmação.
        Confirmado = 2, // Agendamento confirmado.
        Cancelado = 3,  // Agendamento cancelado.
        Realizado = 4   // Agendamento concluído.
    }

    // Classe que representa o modelo de dados para um Agendamento no sistema.
    public class Agendamento
    {
        [Key] // Define 'Id' como a chave primária da tabela.
        public int Id { get; set; }

        [Required] // Campo obrigatório.
        public int ClienteId { get; set; }
        [ForeignKey("ClienteId")] // Define 'ClienteId' como chave estrangeira para a entidade Usuario (Cliente).
        public virtual Usuario Cliente { get; set; } // Propriedade de navegação para o objeto Cliente.

        [Required] // Campo obrigatório.
        public int BarbeiroId { get; set; }
        [ForeignKey("BarbeiroId")] // Define 'BarbeiroId' como chave estrangeira para a entidade Usuario (Barbeiro).
        public virtual Usuario Barbeiro { get; set; } // Propriedade de navegação para o objeto Barbeiro.

        [Required] // Campo obrigatório.
        public int BarbeariaId { get; set; }
        [ForeignKey("BarbeariaId")] // Define 'BarbeariaId' como chave estrangeira para a entidade Barbearia.
        public virtual Barbearia Barbearia { get; set; } // Propriedade de navegação para o objeto Barbearia.

        [Required] // Campo obrigatório.
        public DateTime DataHora { get; set; } // Data e hora do agendamento. Será tratada como UTC antes de salvar.

        [Required] // Campo obrigatório.
        [StringLength(100)] // Define o tamanho máximo da string.
        public string TipoServico { get; set; } // Descrição do tipo de serviço agendado.

        public decimal? PrecoServico { get; set; } // Preço do serviço (opcional).

        [StringLength(500)] // Define o tamanho máximo da string.
        public string? Observacoes { get; set; } // Observações adicionais sobre o agendamento (opcional).

        [Required] // Campo obrigatório.
        public StatusAgendamento Status { get; set; } // Status atual do agendamento, usando o enum StatusAgendamento.

        [StringLength(50)] // Define o tamanho máximo da string.
        public string? MetodoPagamento { get; set; } // Método de pagamento utilizado (opcional).

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow; // Data de criação do agendamento, definida como UTC.
        public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow; // Data da última atualização do agendamento, definida como UTC.

        // FK para HorarioDisponivel (se o agendamento foi feito a partir de um horário específico).
        public int? HorarioDisponivelId { get; set; }
        [ForeignKey("HorarioDisponivelId")] // Define 'HorarioDisponivelId' como chave estrangeira para a entidade HorarioDisponivel.
        public virtual HorarioDisponivel HorarioDisponivel { get; set; } // Propriedade de navegação para o objeto HorarioDisponivel.
    }
}


