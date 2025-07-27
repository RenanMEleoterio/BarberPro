using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.DTOs
{
    public class CriarAgendamentoDto
    {
        [Required]
        public int BarbeiroId { get; set; }

        [Required]
        public DateTime DataHora { get; set; }

        public string Observacoes { get; set; }
    }

    public class AgendamentoDto
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string NomeCliente { get; set; }
        public string EmailCliente { get; set; }
        public int BarbeiroId { get; set; }
        public string NomeBarbeiro { get; set; }
        public DateTime DataHora { get; set; }
        public string Observacoes { get; set; }
        public string Status { get; set; }
        public DateTime DataCriacao { get; set; }
    }

    public class AtualizarAgendamentoDto
    {
        public DateTime? NovaDataHora { get; set; }
        public string Observacoes { get; set; }
        public StatusAgendamento? Status { get; set; }
    }

    public class HorarioDisponivelDto
    {
        public int Id { get; set; }
        public DateTime DataHora { get; set; }
        public int BarbeiroId { get; set; }
        public string NomeBarbeiro { get; set; }
        public bool EstaDisponivel { get; set; }
    }

    public class CriarHorarioDto
    {
        [Required]
        public DateTime DataHora { get; set; }
    }

    public class BarbeiroDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Foto { get; set; }
        public string Especialidades { get; set; }
        public string Descricao { get; set; }
        public List<HorarioDisponivelDto> HorariosDisponiveis { get; set; } = new List<HorarioDisponivelDto>();
    }
}

