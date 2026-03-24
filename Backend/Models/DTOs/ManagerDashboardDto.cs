using System;
using System.Collections.Generic;

namespace BarbeariaSaaS.Models.DTOs
{
    public class ManagerStatsDto
    {
        public decimal ReceitaTotal { get; set; }
        public int TotalClientes { get; set; }
        public int TotalAgendamentos { get; set; }
        public decimal AvaliacaoMedia { get; set; }
        public List<PerformanceMesDto> PerformanceMensal { get; set; } = new();
        public List<ServicoPopularDto> ServicosPopulares { get; set; } = new();
        public List<BarbeiroTopDto> RankingBarbeiros { get; set; } = new();
        public MetaMensalDto MetaMensal { get; set; } = new();
        public EficienciaDto Eficiencia { get; set; } = new();
        public SatisfacaoDto Satisfacao { get; set; } = new();
    }

    public class PerformanceMesDto
    {
        public string Mes { get; set; } = string.Empty;
        public decimal Receita { get; set; }
        public int Agendamentos { get; set; }
    }

    public class ServicoPopularDto
    {
        public string Servico { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Porcentagem { get; set; }
        public decimal Receita { get; set; }
    }

    public class BarbeiroTopDto
    {
        public int BarbeiroId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public decimal Receita { get; set; }
        public int Clientes { get; set; }
        public decimal Avaliacao { get; set; }
    }

    public class MetaMensalDto
    {
        public decimal Meta { get; set; }
        public decimal Atual { get; set; }
        public decimal Progresso { get; set; }
    }

    public class EficienciaDto
    {
        public int TempoMedioCorte { get; set; }
        public int TempoMedioBarba { get; set; }
        public int TempoMedioCompleto { get; set; }
    }

    public class SatisfacaoDto
    {
        public decimal Excelente { get; set; }
        public decimal Bom { get; set; }
        public decimal Regular { get; set; }
    }

    public class ManagerDashboardDto
    {
        public BarbeariaDataDto? Barbearia { get; set; }
        public int TotalBarbeiros { get; set; }
        public int AgendamentosMes { get; set; }
        public int ConcluidosMes { get; set; }
        public decimal ReceitaTotal { get; set; }
        public int[] PerformanceSemanal { get; set; } = new int[7];
        public List<BarbeiroEstatisticaDto> Barbeiros { get; set; } = new();
        public FormasPagamentoDto? FormasPagamento { get; set; }
    }

    public class BarbeariaDataDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string CodigoConvite { get; set; } = string.Empty;
        public string CodigoBarbearia { get; set; } = string.Empty;
        public string Endereco { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class BarbeiroEstatisticaDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal ReceitaMensal { get; set; }
        public int ClientesUnicos { get; set; }
        public decimal AvaliacaoMedia { get; set; }
        public DateTime? UltimaAtividade { get; set; }
    }

    public class FormasPagamentoDto
    {
        public decimal Pix { get; set; }
        public decimal Cartao { get; set; }
        public decimal Dinheiro { get; set; }
    }
}
