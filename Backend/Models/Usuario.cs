using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    /// <summary>
    /// Enumeração para representar os diferentes tipos de usuários no sistema.
    /// </summary>
    public enum TipoUsuario
    {
        /// <summary>
        /// Usuário que agenda serviços.
        /// </summary>
        Cliente = 1,
        /// <summary>
        /// Usuário que presta serviços.
        /// </summary>
        Barbeiro = 2,
        /// <summary>
        /// Usuário que gerencia a barbearia.
        /// </summary>
        Gerente = 3
    }

    /// <summary>
    /// Classe que representa o modelo de dados para um Usuário no sistema.
    /// </summary>
    public class Usuario
    {
        /// <summary>
        /// O ID único do usuário. É a chave primária da tabela.
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Nome completo do usuário. Campo obrigatório com tamanho máximo de 100 caracteres.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        /// <summary>
        /// Endereço de email do usuário. Campo obrigatório, deve ser único e ter formato de email válido. Tamanho máximo de 100 caracteres.
        /// </summary>
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        /// <summary>
        /// Hash da senha do usuário. Campo opcional, pois usuários autenticados via Google podem não ter uma senha local. Tamanho máximo de 255 caracteres.
        /// </summary>
        [StringLength(255)]
        public string? SenhaHash { get; set; }

        /// <summary>
        /// ID único do usuário no Google, se autenticado via Google. Campo opcional com tamanho máximo de 100 caracteres.
        /// </summary>
        [StringLength(100)]
        public string? GoogleId { get; set; }

        /// <summary>
        /// Tipo de usuário, utilizando a enumeração TipoUsuario. Campo obrigatório.
        /// </summary>
        [Required]
        public TipoUsuario TipoUsuario { get; set; }

        /// <summary>
        /// ID da barbearia à qual o usuário está associado. Campo opcional, aplicável a Barbeiros e Gerentes.
        /// </summary>
        public int? BarbeariaId { get; set; }

        /// <summary>
        /// Propriedade de navegação para o objeto Barbearia. Define BarbeariaId como chave estrangeira.
        /// </summary>
        [ForeignKey("BarbeariaId")]
        public virtual Barbearia Barbearia { get; set; }

        /// <summary>
        /// URL ou caminho para a foto de perfil do usuário. Campo opcional com tamanho máximo de 500 caracteres.
        /// </summary>
        [StringLength(500)]
        public string Foto { get; set; }
        /// <summary>
        /// Lista de especialidades do barbeiro (ex: 'Corte Masculino, Barba'). Campo opcional com tamanho máximo de 500 caracteres.
        /// </summary>
        [StringLength(500)]
        public string Especialidades { get; set; }

        /// <summary>
        /// Descrição ou biografia do usuário. Campo opcional com tamanho máximo de 1000 caracteres.
        /// </summary>
        [StringLength(1000)]
        public string Descricao { get; set; }

        /// <summary>
        /// Data de criação do usuário. Definida automaticamente como UTC no momento da criação.
        /// </summary>
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Número de telefone do usuário. Campo opcional com tamanho máximo de 20 caracteres.
        /// </summary>
        [StringLength(20)]
        public string? Telefone { get; set; }

        /// <summary>
        /// Coleção de horários disponíveis criados por este usuário (se for um barbeiro).
        /// </summary>
        public virtual ICollection<HorarioDisponivel> HorariosDisponiveis { get; set; } = new List<HorarioDisponivel>();
        /// <summary>
        /// Coleção de agendamentos onde este usuário atua como barbeiro.
        /// </summary>
        public virtual ICollection<Agendamento> AgendamentosComoBarbeiro { get; set; } = new List<Agendamento>();
        /// <summary>
        /// Coleção de agendamentos onde este usuário atua como cliente.
        /// </summary>
        public virtual ICollection<Agendamento> AgendamentosComoCliente { get; set; } = new List<Agendamento>();
        /// <summary>
        /// Token de redefinição de senha. Campo opcional com tamanho máximo de 255 caracteres.
        /// </summary>
        [StringLength(255)]
        public string? PasswordResetToken { get; set; }
        /// <summary>
        /// Data e hora de expiração do token de redefinição de senha. Campo opcional.
        /// </summary>
        public DateTime? PasswordResetTokenExpires { get; set; }
    }
}


