using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.DTOs
{
    /// <summary>
    /// DTO (Data Transfer Object) para criar um novo agendamento.
    /// Contém as informações necessárias para que um cliente solicite um agendamento.
    /// </summary>
    public class CriarAgendamentoDto
    {
        /// <summary>
        /// O ID do barbeiro com quem o agendamento será feito.
        /// </summary>
        [Required]
        public int BarbeiroId { get; set; }

        /// <summary>
        /// A data e hora desejadas para o agendamento.
        /// </summary>
        [Required]
        public DateTime DataHora { get; set; }

        /// <summary>
        /// Observações adicionais sobre o agendamento, como preferências ou detalhes específicos.
        /// </summary>
        public string? Observacoes { get; set; }

        /// <summary>
        /// O tipo de serviço a ser agendado (ex: "Corte de Cabelo", "Barba").
        /// </summary>
        [Required]
        public string TipoServico { get; set; } = string.Empty;

        /// <summary>
        /// O preço total do serviço agendado.
        /// </summary>
        public decimal? PrecoServico { get; set; }

        public List<int>? ServicoIds { get; set; }
    }

    /// <summary>
    /// DTO para representar um agendamento. Utilizado para retornar informações detalhadas de um agendamento.
    /// </summary>
    public class AgendamentoDto
    {
        /// <summary>
        /// O ID único do agendamento.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// O ID do cliente que fez o agendamento.
        /// </summary>
        public int ClienteId { get; set; }
        /// <summary>
        /// O nome do cliente.
        /// </summary>
        public string NomeCliente { get; set; } = string.Empty;
        /// <summary>
        /// O email do cliente.
        /// </summary>
        public string EmailCliente { get; set; } = string.Empty;
        /// <summary>
        /// O ID do barbeiro que realizará o serviço.
        /// </summary>
        public int BarbeiroId { get; set; }
        /// <summary>
        /// O nome do barbeiro.
        /// </summary>
        public string NomeBarbeiro { get; set; } = string.Empty;
        /// <summary>
        /// O ID da barbearia.
        /// </summary>
        public int BarbeariaId { get; set; }
        /// <summary>
        /// O nome da barbearia.
        /// </summary>
        public string NomeBarbearia { get; set; } = string.Empty;
        /// <summary>
        /// A data e hora do agendamento.
        /// </summary>
        public DateTime DataHora { get; set; }
        /// <summary>
        /// Observações sobre o agendamento.
        /// </summary>
        public string Observacoes { get; set; } = string.Empty;
        /// <summary>
        /// O status atual do agendamento (ex: "Confirmado", "Cancelado", "Realizado").
        /// </summary>
        public string Status { get; set; } = string.Empty;
        /// <summary>
        /// A data de criação do agendamento.
        /// </summary>
        public DateTime DataCriacao { get; set; }

        /// <summary>
        /// O tipo de serviço agendado (descrição).
        /// </summary>
        public string TipoServico { get; set; } = string.Empty;

        /// <summary>
        /// O preço do serviço.
        /// </summary>
        public decimal? PrecoServico { get; set; }

        /// <summary>
        /// IDs dos serviços incluídos neste agendamento.
        /// </summary>
        public List<int> ServicoIds { get; set; } = new List<int>();
    }

    /// <summary>
    /// DTO para atualizar um agendamento existente.
    /// Permite a modificação de campos específicos de um agendamento.
    /// </summary>
    public class AtualizarAgendamentoDto
    {
        /// <summary>
        /// Nova data e hora para o agendamento (opcional).
        /// </summary>
        public DateTime? NovaDataHora { get; set; }
        /// <summary>
        /// Novas observações para o agendamento (opcional).
        /// </summary>
        public string? Observacoes { get; set; }
        /// <summary>
        /// Novo status para o agendamento (opcional).
        /// </summary>
        public StatusAgendamento? Status { get; set; }
        
        /// <summary>
        /// Lista de IDs dos serviços selecionados para atualização (opcional).
        /// </summary>
        public List<int>? ServicoIds { get; set; }
    }

    /// <summary>
    /// DTO para representar um horário disponível de um barbeiro.
    /// </summary>
    public class HorarioDisponivelDto
    {
        /// <summary>
        /// O ID único do horário disponível.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// A data e hora do horário disponível.
        /// </summary>
        public DateTime DataHora { get; set; }
        /// <summary>
        /// O ID do barbeiro ao qual este horário pertence.
        /// </summary>
        public int BarbeiroId { get; set; }
        /// <summary>
        /// O nome do barbeiro.
        /// </summary>
        public string NomeBarbeiro { get; set; }
        /// <summary>
        /// Indica se o horário está disponível para agendamento.
        /// </summary>
        public bool EstaDisponivel { get; set; }
    }

    /// <summary>
    /// DTO para criar um novo horário disponível.
    /// </summary>
    public class CriarHorarioDto
    {
        /// <summary>
        /// A data e hora do horário a ser criado.
        /// </summary>
        [Required]
        public DateTime DataHora { get; set; }
    }

    /// <summary>
    /// DTO para representar um barbeiro, incluindo seus horários disponíveis.
    /// </summary>
    public class BarbeiroDto
    {
        /// <summary>
        /// O ID único do barbeiro.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// O nome do barbeiro.
        /// </summary>
        public string Nome { get; set; }
        /// <summary>
        /// URL da foto de perfil do barbeiro.
        /// </summary>
        public string Foto { get; set; }
        /// <summary>
        /// As especialidades do barbeiro (ex: "Corte Masculino", "Barba Modelada").
        /// </summary>
        public string Especialidades { get; set; }
        /// <summary>
        /// Uma descrição sobre o barbeiro.
        /// </summary>
        public string Descricao { get; set; }
        /// <summary>
        /// Lista de horários disponíveis para este barbeiro.
        /// </summary>
        public List<HorarioDisponivelDto> HorariosDisponiveis { get; set; } = new List<HorarioDisponivelDto>();
    }
}


