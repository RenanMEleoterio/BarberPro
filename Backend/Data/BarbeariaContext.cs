using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Data
{
    /// <summary>
    /// Contexto do banco de dados para a aplicação BarbeariaSaaS.
    /// Gerencia a interação com o banco de dados usando Entity Framework Core.
    /// </summary>
    public class BarbeariaContext : DbContext
    {
        /// <summary>
        /// Construtor que recebe as opções de configuração do DbContext.
        /// </summary>
        /// <param name="options">As opções de configuração para este contexto.</param>
        public BarbeariaContext(DbContextOptions<BarbeariaContext> options) : base(options)
        {
        }

        /// <summary>
        /// Representa a coleção de todas as barbearias no banco de dados.
        /// </summary>
        public DbSet<Barbearia> Barbearias { get; set; }
        /// <summary>
        /// Representa a coleção de todos os usuários (clientes, barbeiros, gerentes) no banco de dados.
        /// </summary>
        public DbSet<Usuario> Usuarios { get; set; }
        /// <summary>
        /// Representa a coleção de todos os horários disponíveis para agendamento no banco de dados.
        /// </summary>
        public DbSet<HorarioDisponivel> HorariosDisponiveis { get; set; }
        /// <summary>
        /// Representa a coleção de todos os agendamentos no banco de dados.
        /// </summary>
        public DbSet<Agendamento> Agendamentos { get; set; }
        /// <summary>
        /// Representa a coleção de todos os serviços oferecidos no banco de dados.
        /// </summary>
        public DbSet<Servico> Servicos { get; set; }

        /// <summary>
        /// Configura o modelo de dados que o Entity Framework Core usará para mapear as classes para o banco de dados.
        /// </summary>
        /// <param name="modelBuilder">O construtor de modelo usado para configurar as entidades.</param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurações da entidade Barbearia
            modelBuilder.Entity<Barbearia>(entity =>
            {
                entity.HasKey(e => e.Id); // Define Id como chave primária.
                entity.HasIndex(e => e.CodigoConvite).IsUnique(); // Garante que CodigoConvite seja único.
                entity.HasIndex(e => e.Email).IsUnique(); // Garante que Email da barbearia seja único.
            });

            // Configurações da entidade Usuario
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasKey(e => e.Id); // Define Id como chave primária.
                entity.HasIndex(e => e.Email).IsUnique(); // Garante que Email do usuário seja único.

                // Relacionamento com Barbearia (opcional para clientes)
                entity.HasOne(e => e.Barbearia) // Um usuário pode ter uma Barbearia.
                      .WithMany(b => b.Usuarios) // Uma Barbearia pode ter muitos Usuários.
                      .HasForeignKey(e => e.BarbeariaId) // A chave estrangeira é BarbeariaId.
                      .OnDelete(DeleteBehavior.Restrict); // Restringe a exclusão de uma barbearia se houver usuários associados.
            });

            // Configurações da entidade HorarioDisponivel
            modelBuilder.Entity<HorarioDisponivel>(entity =>
            {
                entity.HasKey(e => e.Id); // Define Id como chave primária.

                // Relacionamento com Barbeiro (Usuario)
                entity.HasOne(e => e.Barbeiro) // Um HorarioDisponivel pertence a um Barbeiro.
                      .WithMany(u => u.HorariosDisponiveis) // Um Barbeiro pode ter muitos HorariosDisponiveis.
                      .HasForeignKey(e => e.BarbeiroId) // A chave estrangeira é BarbeiroId.
                      .OnDelete(DeleteBehavior.Cascade); // Se um barbeiro for excluído, seus horários disponíveis também são.

                // Índice composto para evitar horários duplicados para o mesmo barbeiro.
                entity.HasIndex(e => new { e.BarbeiroId, e.DataHora }).IsUnique();
            });

            // Configurações da entidade Agendamento
            modelBuilder.Entity<Agendamento>(entity =>
            {
                entity.HasKey(e => e.Id); // Define Id como chave primária.

                // Relacionamento com Cliente (Usuario)
                entity.HasOne(e => e.Cliente) // Um Agendamento tem um Cliente.
                      .WithMany(u => u.AgendamentosComoCliente) // Um Cliente pode ter muitos Agendamentos.
                      .HasForeignKey(e => e.ClienteId) // A chave estrangeira é ClienteId.
                      .OnDelete(DeleteBehavior.Restrict); // Restringe a exclusão de um cliente se houver agendamentos associados.

                // Relacionamento com Barbeiro (Usuario)
                entity.HasOne(e => e.Barbeiro) // Um Agendamento tem um Barbeiro.
                      .WithMany(u => u.AgendamentosComoBarbeiro) // Um Barbeiro pode ter muitos Agendamentos.
                      .HasForeignKey(e => e.BarbeiroId) // A chave estrangeira é BarbeiroId.
                      .OnDelete(DeleteBehavior.Restrict); // Restringe a exclusão de um barbeiro se houver agendamentos associados.

                // Relacionamento com Barbearia
                entity.HasOne(e => e.Barbearia) // Um Agendamento pertence a uma Barbearia.
                      .WithMany(b => b.Agendamentos) // Uma Barbearia pode ter muitos Agendamentos.
                      .HasForeignKey(e => e.BarbeariaId) // A chave estrangeira é BarbeariaId.
                      .OnDelete(DeleteBehavior.Restrict); // Restringe a exclusão de uma barbearia se houver agendamentos associados.

                // Índices para otimização de consultas por data e barbeiro/barbearia.
                entity.HasIndex(e => new { e.BarbeiroId, e.DataHora });
                entity.HasIndex(e => new { e.BarbeariaId, e.DataHora });
            });

            // Configurações para armazenar enums como inteiros no banco de dados.
            modelBuilder.Entity<Usuario>()
                .Property(e => e.TipoUsuario)
                .HasConversion<int>(); // Converte o enum TipoUsuario para int.

            modelBuilder.Entity<Agendamento>()
                .Property(e => e.Status)
                .HasConversion<int>(); // Converte o enum StatusAgendamento para int.
        }
    }
}


