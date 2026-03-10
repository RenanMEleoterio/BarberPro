using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    public class AgendamentoServico
    {
        public int AgendamentoId { get; set; }
        [ForeignKey("AgendamentoId")]
        public virtual Agendamento? Agendamento { get; set; }

        public int ServicoId { get; set; }
        [ForeignKey("ServicoId")]
        public virtual Servico? Servico { get; set; }
    }
}
