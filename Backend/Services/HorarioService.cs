using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Services
{
    public class HorarioService
    {
        private readonly BarbeariaContext _context;

        public HorarioService(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gera horários disponíveis para um barbeiro baseado na configuração da barbearia
        /// </summary>
        /// <param name="barbeiroId">ID do barbeiro</param>
        /// <param name="dataInicio">Data de início para gerar horários</param>
        /// <param name="dataFim">Data final para gerar horários</param>
        /// <param name="intervaloMinutos">Intervalo entre agendamentos em minutos (padrão: 30)</param>
        /// <returns>Lista de horários criados</returns>
        public async Task<List<HorarioDisponivel>> GerarHorariosParaBarbeiro(
            int barbeiroId, 
            DateTime dataInicio, 
            DateTime dataFim, 
            int intervaloMinutos = 30)
        {
            var barbeiro = await _context.Usuarios
                .Include(u => u.Barbearia)
                .FirstOrDefaultAsync(u => u.Id == barbeiroId && u.TipoUsuario == TipoUsuario.Barbeiro);

            if (barbeiro?.Barbearia == null)
            {
                throw new ArgumentException("Barbeiro não encontrado ou não está vinculado a uma barbearia");
            }

            var barbearia = barbeiro.Barbearia;
            var horariosGerados = new List<HorarioDisponivel>();

            // Configurações padrão se não estiverem definidas
            var workDays = !string.IsNullOrEmpty(barbearia.WorkDays) 
                ? barbearia.WorkDays.Split(',').Select(d => d.Trim()).ToList()
                : new List<string> { "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" };

            var openTime = !string.IsNullOrEmpty(barbearia.OpenTime) 
                ? TimeSpan.Parse(barbearia.OpenTime) 
                : new TimeSpan(8, 0, 0); // 08:00

            var closeTime = !string.IsNullOrEmpty(barbearia.CloseTime) 
                ? TimeSpan.Parse(barbearia.CloseTime) 
                : new TimeSpan(18, 0, 0); // 18:00

            // Mapear dias da semana
            var dayMapping = new Dictionary<DayOfWeek, string>
            {
                { DayOfWeek.Sunday, "sunday" },
                { DayOfWeek.Monday, "monday" },
                { DayOfWeek.Tuesday, "tuesday" },
                { DayOfWeek.Wednesday, "wednesday" },
                { DayOfWeek.Thursday, "thursday" },
                { DayOfWeek.Friday, "friday" },
                { DayOfWeek.Saturday, "saturday" }
            };

            // Buscar horários já existentes para evitar duplicatas
            var horariosExistentes = await _context.HorariosDisponiveis
                .Where(h => h.BarbeiroId == barbeiroId && 
                           h.DataHora >= dataInicio && 
                           h.DataHora <= dataFim)
                .Select(h => h.DataHora)
                .ToListAsync();

            // Gerar horários para cada dia no período
            for (var data = dataInicio.Date; data <= dataFim.Date; data = data.AddDays(1))
            {
                var dayOfWeek = data.DayOfWeek;
                var dayName = dayMapping[dayOfWeek];

                // Verificar se a barbearia funciona neste dia
                if (!workDays.Contains(dayName))
                {
                    continue;
                }

                // Gerar horários para este dia
                var currentTime = openTime;
                while (currentTime < closeTime)
                {
                    var dataHora = data.Add(currentTime);
                    
                    // Converter para UTC para armazenar no banco
                    var dataHoraUtc = DateTime.SpecifyKind(dataHora, DateTimeKind.Utc);

                    // Verificar se já existe este horário
                    if (!horariosExistentes.Contains(dataHoraUtc))
                    {
                        var horario = new HorarioDisponivel
                        {
                            BarbeiroId = barbeiroId,
                            DataHora = dataHoraUtc,
                            EstaDisponivel = true,
                            DataCriacao = DateTime.UtcNow
                        };

                        horariosGerados.Add(horario);
                    }

                    currentTime = currentTime.Add(TimeSpan.FromMinutes(intervaloMinutos));
                }
            }

            // Salvar horários gerados no banco
            if (horariosGerados.Any())
            {
                _context.HorariosDisponiveis.AddRange(horariosGerados);
                await _context.SaveChangesAsync();
            }

            return horariosGerados;
        }

        /// <summary>
        /// Gera horários para todos os barbeiros de uma barbearia
        /// </summary>
        /// <param name="barbeariaId">ID da barbearia</param>
        /// <param name="dataInicio">Data de início</param>
        /// <param name="dataFim">Data final</param>
        /// <param name="intervaloMinutos">Intervalo entre agendamentos</param>
        /// <returns>Número total de horários gerados</returns>
        public async Task<int> GerarHorariosParaBarbearia(
            int barbeariaId, 
            DateTime dataInicio, 
            DateTime dataFim, 
            int intervaloMinutos = 30)
        {
            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .ToListAsync();

            var totalHorarios = 0;

            foreach (var barbeiro in barbeiros)
            {
                var horariosGerados = await GerarHorariosParaBarbeiro(
                    barbeiro.Id, 
                    dataInicio, 
                    dataFim, 
                    intervaloMinutos);
                
                totalHorarios += horariosGerados.Count;
            }

            return totalHorarios;
        }

        /// <summary>
        /// Remove horários antigos (passados) que não foram utilizados
        /// </summary>
        /// <returns>Número de horários removidos</returns>
        public async Task<int> LimparHorariosAntigos()
        {
            var horariosAntigos = await _context.HorariosDisponiveis
                .Where(h => h.DataHora < DateTime.UtcNow && h.EstaDisponivel)
                .ToListAsync();

            if (horariosAntigos.Any())
            {
                _context.HorariosDisponiveis.RemoveRange(horariosAntigos);
                await _context.SaveChangesAsync();
            }

            return horariosAntigos.Count;
        }

        /// <summary>
        /// Verifica e atualiza disponibilidade de horários baseado em agendamentos existentes
        /// </summary>
        /// <returns>Número de horários atualizados</returns>
        public async Task<int> AtualizarDisponibilidadeHorarios()
        {
            // Buscar horários que estão marcados como disponíveis mas têm agendamentos confirmados
            var horariosComAgendamento = await _context.HorariosDisponiveis
                .Where(h => h.EstaDisponivel)
                .Where(h => _context.Agendamentos.Any(a => 
                    a.BarbeiroId == h.BarbeiroId && 
                    a.DataHora == h.DataHora && 
                    a.Status == StatusAgendamento.Confirmado))
                .ToListAsync();

            foreach (var horario in horariosComAgendamento)
            {
                horario.EstaDisponivel = false;
            }

            if (horariosComAgendamento.Any())
            {
                await _context.SaveChangesAsync();
            }

            return horariosComAgendamento.Count;
        }
    }
}

