using System;
using System.Collections.Generic;
using System.Linq;

namespace BarbeariaSaaS.Services
{
    public static class HorarioGenerationPlanner
    {
        private static readonly string[] DefaultWorkDays =
        {
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday"
        };

        private static readonly Dictionary<DayOfWeek, string> DayMapping = new()
        {
            { DayOfWeek.Sunday, "sunday" },
            { DayOfWeek.Monday, "monday" },
            { DayOfWeek.Tuesday, "tuesday" },
            { DayOfWeek.Wednesday, "wednesday" },
            { DayOfWeek.Thursday, "thursday" },
            { DayOfWeek.Friday, "friday" },
            { DayOfWeek.Saturday, "saturday" }
        };

        public static HashSet<DateTime> BuildIdealUtcSlots(
            DateTime dataInicio,
            DateTime dataFim,
            string? workDaysConfig,
            string? openTimeConfig,
            string? closeTimeConfig,
            int intervaloMinutos,
            DateTime utcNow)
        {
            var workDays = ParseWorkDays(workDaysConfig);
            var openTime = ParseTime(openTimeConfig, new TimeSpan(8, 0, 0));
            var closeTime = ParseTime(closeTimeConfig, new TimeSpan(18, 0, 0));
            var safeIntervalo = intervaloMinutos > 0 ? intervaloMinutos : 30;

            var inicioLocal = AppDateTime.GetBusinessDate(dataInicio);
            var fimLocal = AppDateTime.GetBusinessDate(dataFim);
            var horariosIdeais = new HashSet<DateTime>();

            for (var data = inicioLocal; data <= fimLocal; data = data.AddDays(1))
            {
                var dayName = DayMapping[data.DayOfWeek];
                if (!workDays.Contains(dayName))
                {
                    continue;
                }

                for (var currentTime = openTime; currentTime <= closeTime; currentTime = currentTime.Add(TimeSpan.FromMinutes(safeIntervalo)))
                {
                    var slotUtc = AppDateTime.CreateBusinessSlotUtc(data, currentTime);
                    if (slotUtc <= utcNow)
                    {
                        continue;
                    }

                    horariosIdeais.Add(slotUtc);
                }
            }

            return horariosIdeais;
        }

        private static HashSet<string> ParseWorkDays(string? workDaysConfig)
        {
            var workDays = string.IsNullOrWhiteSpace(workDaysConfig)
                ? DefaultWorkDays
                : workDaysConfig
                    .Split(",", StringSplitOptions.RemoveEmptyEntries)
                    .Select(day => day.Trim().ToLowerInvariant())
                    .Where(day => !string.IsNullOrWhiteSpace(day))
                    .ToArray();

            return new HashSet<string>(workDays, StringComparer.OrdinalIgnoreCase);
        }

        private static TimeSpan ParseTime(string? timeValue, TimeSpan fallback)
        {
            return TimeSpan.TryParse(timeValue, out var parsed) ? parsed : fallback;
        }
    }
}
