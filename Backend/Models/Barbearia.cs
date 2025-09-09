using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    // Classe que representa o modelo de dados para uma Barbearia no sistema.
    public class Barbearia
    {
        [Key] // Define 'Id' como a chave primária da tabela.
        public int Id { get; set; }

        [Required] // Campo obrigatório.
        [StringLength(100)] // Define o tamanho máximo da string.
        public string Nome { get; set; } // Nome da barbearia.

        [Required] // Campo obrigatório.
        [StringLength(200)] // Define o tamanho máximo da string.
        public string Endereco { get; set; } // Endereço da barbearia.

        [Required] // Campo obrigatório.
        [StringLength(20)] // Define o tamanho máximo da string.
        public string Telefone { get; set; } // Telefone de contato da barbearia.

        [Required] // Campo obrigatório.
        [EmailAddress] // Valida o formato do email.
        [StringLength(100)] // Define o tamanho máximo da string.
        public string Email { get; set; } // Email da barbearia.

        [StringLength(500)] // Define o tamanho máximo da string.
        public string Logo { get; set; } // URL ou caminho para o logo da barbearia (opcional).

        [Required] // Campo obrigatório.
        [StringLength(10)] // Define o tamanho máximo da string.
        public string CodigoConvite { get; set; } // Código único para convite de novos usuários para esta barbearia.

        [Required] // Campo obrigatório.
        [StringLength(8)] // Define o tamanho máximo da string.
        public string CodigoBarbearia { get; set; } // Código único de identificação da barbearia.

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow; // Data de criação da barbearia, definida como UTC.

        // Relacionamentos:
        // Uma barbearia pode ter múltiplos usuários (clientes, barbeiros, gerentes).
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
        // Uma barbearia pode ter múltiplos agendamentos.
        public virtual ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
        // Uma barbearia pode oferecer múltiplos serviços.
        public string WorkDays { get; set; } = "monday,tuesday,wednesday,thursday,friday,saturday"; // Dias de funcionamento separados por vírgula
        public string OpenTime { get; set; } = "08:00"; // Horário de abertura
        public string CloseTime { get; set; } = "18:00"; // Horário de fechamento

        public virtual ICollection<Servico> Servicos { get; set; } = new List<Servico>();
    }
}


