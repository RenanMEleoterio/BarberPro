using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarbeariaSaaS.Models
{
    // Enumeração para representar os diferentes tipos de usuários no sistema.
    public enum TipoUsuario
    {
        Cliente = 1,  // Usuário que agenda serviços.
        Barbeiro = 2, // Usuário que presta serviços.
        Gerente = 3   // Usuário que gerencia a barbearia.
    }

    // Classe que representa o modelo de dados para um Usuário no sistema.
    public class Usuario
    {
        [Key] // Define 'Id' como a chave primária da tabela.
        public int Id { get; set; }

        [Required] // Campo obrigatório.
        [StringLength(100)] // Define o tamanho máximo da string.
        public string Nome { get; set; } // Nome completo do usuário.

        [Required] // Campo obrigatório.
        [EmailAddress] // Valida o formato do email.
        [StringLength(100)] // Define o tamanho máximo da string.
        public string Email { get; set; } // Endereço de email do usuário (único).

        [StringLength(255)] // Define o tamanho máximo da string.
        public string? SenhaHash { get; set; } // Hash da senha do usuário (opcional para usuários do Google).

        [StringLength(100)] // Define o tamanho máximo da string.
        public string? GoogleId { get; set; } // ID único do usuário no Google, se autenticado via Google.

        [Required] // Campo obrigatório.
        public TipoUsuario TipoUsuario { get; set; } // Tipo de usuário, usando o enum TipoUsuario.

        // FK para Barbearia (aplicável apenas para Barbeiro e Gerente).
        public int? BarbeariaId { get; set; } // ID da barbearia à qual o usuário está associado (opcional).

        [ForeignKey("BarbeariaId")] // Define 'BarbeariaId' como chave estrangeira para a entidade Barbearia.
        public virtual Barbearia Barbearia { get; set; } // Propriedade de navegação para o objeto Barbearia.

        // Propriedades específicas para Barbeiro:
        [StringLength(500)] // Define o tamanho máximo da string.
        public string Foto { get; set; } // URL ou caminho para a foto de perfil do barbeiro (opcional).
        [StringLength(500)] // Define o tamanho máximo da string.
        public string Especialidades { get; set; } // Lista de especialidades do barbeiro (ex: 'Corte Masculino, Barba').

        [StringLength(1000)] // Define o tamanho máximo da string.
        public string Descricao { get; set; } // Descrição ou biografia do barbeiro.

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow; // Data de criação do usuário, definida como UTC.

        [StringLength(20)] // Define o tamanho máximo da string.
        public string? Telefone { get; set; } // Número de telefone do usuário (opcional).

        // Relacionamentos:
        // Um barbeiro pode ter múltiplos horários disponíveis.
        public virtual ICollection<HorarioDisponivel> HorariosDisponiveis { get; set; } = new List<HorarioDisponivel>();
        // Um barbeiro pode ter múltiplos agendamentos como prestador de serviço.
        public virtual ICollection<Agendamento> AgendamentosComoBarbeiro { get; set; } = new List<Agendamento>();
        // Um cliente pode ter múltiplos agendamentos como solicitante de serviço.
        public virtual ICollection<Agendamento> AgendamentosComoCliente { get; set; } = new List<Agendamento>();
    }
}




        [StringLength(255)]
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpires { get; set; }


