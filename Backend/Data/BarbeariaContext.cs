using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Data
{
    public class BarbeariaContext : DbContext
    {
        public BarbeariaContext(DbContextOptions<BarbeariaContext> options) : base(options)
        {
        }

        public DbSet<Barbearia> Barbearias { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<HorarioDisponivel> HorariosDisponiveis { get; set; }
        public DbSet<Agendamento> Agendamentos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurações da entidade Barbearia
            modelBuilder.Entity<Barbearia>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CodigoConvite).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configurações da entidade Usuario
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();

                // Relacionamento com Barbearia (opcional para clientes)
                entity.HasOne(e => e.Barbearia)
                      .WithMany(b => b.Usuarios)
                      .HasForeignKey(e => e.BarbeariaId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configurações da entidade HorarioDisponivel
            modelBuilder.Entity<HorarioDisponivel>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Relacionamento com Barbeiro
                entity.HasOne(e => e.Barbeiro)
                      .WithMany(u => u.HorariosDisponiveis)
                      .HasForeignKey(e => e.BarbeiroId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Índice composto para evitar horários duplicados
                entity.HasIndex(e => new { e.BarbeiroId, e.DataHora }).IsUnique();
            });

            // Configurações da entidade Agendamento
            modelBuilder.Entity<Agendamento>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Relacionamento com Cliente
                entity.HasOne(e => e.Cliente)
                      .WithMany(u => u.AgendamentosComoCliente)
                      .HasForeignKey(e => e.ClienteId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relacionamento com Barbeiro
                entity.HasOne(e => e.Barbeiro)
                      .WithMany(u => u.AgendamentosComoBarbeiro)
                      .HasForeignKey(e => e.BarbeiroId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relacionamento com Barbearia
                entity.HasOne(e => e.Barbearia)
                      .WithMany(b => b.Agendamentos)
                      .HasForeignKey(e => e.BarbeariaId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Índice para consultas por data e barbeiro
                entity.HasIndex(e => new { e.BarbeiroId, e.DataHora });
                entity.HasIndex(e => new { e.BarbeariaId, e.DataHora });
            });

            // Configurações de enum
            modelBuilder.Entity<Usuario>()
                .Property(e => e.TipoUsuario)
                .HasConversion<int>();

            modelBuilder.Entity<Agendamento>()
                .Property(e => e.Status)
                .HasConversion<int>();
        }
    }
}

