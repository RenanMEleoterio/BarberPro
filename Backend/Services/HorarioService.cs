using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

namespace BarbeariaSaaS.Services
{
    /// <summary>
    /// Serviço responsável pela gestão de horários disponíveis para barbeiros.
    /// Inclui funcionalidades para gerar, limpar e atualizar a disponibilidade de horários.
    /// </summary>
    public class HorarioService
    {
        private readonly BarbeariaContext _context;

        /// <summary>
        /// Construtor do serviço de horários. Injeta o contexto do banco de dados (BarbeariaContext).
        /// </summary>
        /// <param name="context">O contexto do banco de dados.</param>
        public HorarioService(BarbeariaContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gera horários disponíveis para um barbeiro específico dentro de um período de datas,
        /// com base nas configurações de dias de trabalho e horários de abertura/fechamento da barbearia.
        /// Evita a criação de horários duplicados.
        /// </summary>
        /// <param name="barbeiroId">ID do barbeiro para o qual os horários serão gerados.</param>
        /// <param name="dataInicio">Data de início do período para geração de horários.</param>
        /// <param name="dataFim">Data final do período para geração de horários.</param>
        /// <param name="intervaloMinutos">Intervalo de tempo entre cada horário disponível em minutos (padrão: 30).</param>
        /// <returns>Uma lista de objetos HorarioDisponivel que foram gerados e salvos no banco de dados.</returns>
        /// <exception cref="ArgumentException">Lançada se o barbeiro não for encontrado ou não estiver vinculado a uma barbearia.</exception>
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

            var workDays = !string.IsNullOrEmpty(barbearia.WorkDays) 
                ? barbearia.WorkDays.Split(",", StringSplitOptions.RemoveEmptyEntries).Select(d => d.Trim().ToLower()).ToList()
                : new List<string> { "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" };

            var openTime = !string.IsNullOrEmpty(barbearia.OpenTime) 
                ? TimeSpan.Parse(barbearia.OpenTime) 
                : new TimeSpan(8, 0, 0);

            var closeTime = !string.IsNullOrEmpty(barbearia.CloseTime) 
                ? TimeSpan.Parse(barbearia.CloseTime) 
                : new TimeSpan(18, 0, 0);

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

            var inicioUtc = dataInicio.Date;
            var fimUtc = dataFim.Date.AddDays(1);

            var horariosExistentes = await _context.HorariosDisponiveis
                .Where(h => h.BarbeiroId == barbeiroId && 
                           h.DataHora >= inicioUtc && 
                           h.DataHora < fimUtc)
                .Include(h => h.Agendamentos)
                .ToListAsync();

            var datasExistentes = horariosExistentes
                .Select(h => h.DataHora)
                .ToHashSet();

            var horariosIdeais = new HashSet<DateTime>();

            for (var data = dataInicio.Date; data <= dataFim.Date; data = data.AddDays(1))
            {
                var dayOfWeek = data.DayOfWeek;
                var dayName = dayMapping[dayOfWeek];

                if (!workDays.Contains(dayName))
                {
                    continue;
                }

                var currentTime = openTime;
                // Alterado para <= para permitir que o último horário seja exatamente o horário de fechamento
                // (ex: se fecha 17:30, permite agendar 17:30).
                while (currentTime <= closeTime)
                {
                    // Verifica se o horário de término (início + intervalo) ultrapassa o fechamento + tolerância
                    // Se quisermos ser estritos: if (currentTime + TimeSpan.FromMinutes(intervaloMinutos) > closeTime) break;
                    // Mas para atender a solicitação de exibir até o limite:
                    
                    var dataHora = data.Add(currentTime);
                    // Garantir que a data seja salva de forma consistente.
                    // Se estivermos em um ambiente que usa UTC, mas o negócio é local (ex: Brasil),
                    // é melhor salvar em UTC real ou ser consistente na comparação.
                    // Para evitar quebra de compatibilidade, vamos manter o Kind mas garantir que a comparação no controlador seja robusta.
                    var dataHoraUtc = DateTime.SpecifyKind(dataHora, DateTimeKind.Utc);

                    horariosIdeais.Add(dataHoraUtc);

                    if (!datasExistentes.Contains(dataHoraUtc))
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

            var horariosParaRemover = horariosExistentes
                .Where(h => !horariosIdeais.Contains(h.DataHora) &&
                            !h.Agendamentos.Any(a => a.Status == StatusAgendamento.Atendido))
                .ToList();

            if (horariosParaRemover.Any())
            {
                _context.HorariosDisponiveis.RemoveRange(horariosParaRemover);
            }

            if (horariosGerados.Any())
            {
                _context.HorariosDisponiveis.AddRange(horariosGerados);
            }

            if (horariosGerados.Any() || horariosParaRemover.Any())
            {
                await _context.SaveChangesAsync();
            }

            return horariosGerados;
        }

        /// <summary>
        /// Gera horários disponíveis para todos os barbeiros de uma barbearia específica dentro de um período de datas.
        /// </summary>
        /// <param name="barbeariaId">ID da barbearia cujos barbeiros terão horários gerados.</param>
        /// <param name="dataInicio">Data de início do período para geração de horários.</param>
        /// <param name="dataFim">Data final do período para geração de horários.</param>
        /// <param name="intervaloMinutos">Intervalo de tempo entre cada horário disponível em minutos (padrão: 30).</param>
        /// <returns>O número total de horários gerados para todos os barbeiros da barbearia.</returns>
        public async Task<int> GerarHorariosParaBarbearia(
            int barbeariaId, 
            DateTime dataInicio, 
            DateTime dataFim, 
            int intervaloMinutos = 30)
        {
            // Busca todos os barbeiros associados à barbearia especificada.
            var barbeiros = await _context.Usuarios
                .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
                .ToListAsync();

            var totalHorarios = 0;

            // Itera sobre cada barbeiro e gera horários para ele.
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
        /// Remove horários disponíveis antigos (que já passaram) que não foram agendados.
        /// Isso ajuda a manter o banco de dados limpo e relevante.
        /// </summary>
        /// <returns>O número de horários removidos.</returns>
        public async Task<int> LimparHorariosAntigos()
        {
            // Busca horários que já passaram e ainda estão marcados como disponíveis.
            var horariosAntigos = await _context.HorariosDisponiveis
                .Where(h => h.DataHora < DateTime.UtcNow && h.EstaDisponivel)
                .ToListAsync();

            // Se houver horários antigos, remove-os do contexto e salva as mudanças.
            if (horariosAntigos.Any())
            {
                _context.HorariosDisponiveis.RemoveRange(horariosAntigos);
                await _context.SaveChangesAsync();
            }

            return horariosAntigos.Count;
        }

        /// <summary>
        /// Verifica e atualiza a disponibilidade de horários com base nos agendamentos existentes.
        /// Marca como indisponíveis os horários que já possuem um agendamento confirmado.
        /// </summary>
        /// <returns>O número de horários cuja disponibilidade foi atualizada.</returns>
        public async Task<int> AtualizarDisponibilidadeHorarios()
        {
            // Busca horários que estão marcados como disponíveis, mas que possuem um agendamento confirmado associado.
            var horariosComAgendamento = await _context.HorariosDisponiveis
                .Where(h => h.EstaDisponivel)
                .Where(h => _context.Agendamentos.Any(a => 
                    a.BarbeiroId == h.BarbeiroId && 
                    a.DataHora == h.DataHora && 
                    a.Status == StatusAgendamento.Atendido))
                .ToListAsync();

            // Para cada horário encontrado, marca-o como indisponível.
            foreach (var horario in horariosComAgendamento)
            {
                horario.EstaDisponivel = false;
            }

            // Se houve atualizações, salva as mudanças no banco de dados.
            if (horariosComAgendamento.Any())
            {
                await _context.SaveChangesAsync();
            }

            return horariosComAgendamento.Count;
        }
    }
}


