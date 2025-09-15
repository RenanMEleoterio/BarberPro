using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    /// <summary>
    /// Classe que representa o modelo de dados para uma Barbearia no sistema.
    /// </summary>
    public class Barbearia
    {
        /// <summary>
        /// O ID único da barbearia. É a chave primária da tabela.
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Nome da barbearia. Campo obrigatório com tamanho máximo de 100 caracteres.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        /// <summary>
        /// Endereço físico da barbearia. Campo obrigatório com tamanho máximo de 200 caracteres.
        /// </summary>
        [Required]
        [StringLength(200)]
        public string Endereco { get; set; }

        /// <summary>
        /// Telefone de contato da barbearia. Campo obrigatório com tamanho máximo de 20 caracteres.
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Telefone { get; set; }

        /// <summary>
        /// Email da barbearia. Campo obrigatório com formato de email válido e tamanho máximo de 100 caracteres.
        /// </summary>
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        /// <summary>
        /// URL ou caminho para o logo da barbearia. Campo opcional com tamanho máximo de 500 caracteres.
        /// </summary>
        [StringLength(500)]
        public string Logo { get; set; }

        /// <summary>
        /// Código único para convite de novos usuários (barbeiros, gerentes) para esta barbearia. Campo obrigatório com tamanho máximo de 10 caracteres.
        /// </summary>
        [Required]
        [StringLength(10)]
        public string CodigoConvite { get; set; }

        /// <summary>
        /// Código único de identificação da barbearia. Campo obrigatório com tamanho máximo de 8 caracteres.
        /// </summary>
        [Required]
        [StringLength(8)]
        public string CodigoBarbearia { get; set; }

        /// <summary>
        /// Data de criação da barbearia. Definida automaticamente como UTC no momento da criação.
        /// </summary>
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Coleção de usuários (clientes, barbeiros, gerentes) associados a esta barbearia.
        /// </summary>
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
        /// <summary>
        /// Coleção de agendamentos realizados nesta barbearia.
        /// </summary>
        public virtual ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
        /// <summary>
        /// Dias da semana em que a barbearia funciona, representados como uma string separada por vírgulas (ex: "monday,tuesday,wednesday").
        /// </summary>
        public string WorkDays { get; set; } = "monday,tuesday,wednesday,thursday,friday,saturday";
        /// <summary>
        /// Horário de abertura da barbearia (ex: "08:00").
        /// </summary>
        public string OpenTime { get; set; } = "08:00";
        /// <summary>
        /// Horário de fechamento da barbearia (ex: "18:00").
        /// </summary>
        public string CloseTime { get; set; } = "18:00";

        /// <summary>
        /// Coleção de serviços oferecidos por esta barbearia.
        /// </summary>
        public virtual ICollection<Servico> Servicos { get; set; } = new List<Servico>();
    }
}


