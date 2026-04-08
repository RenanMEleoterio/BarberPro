using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using BarbeariaSaaS.Services;

internal static class Program
{
    private static int Main()
    {
        try
        {
            ValidateEnabledWorkDays();
            ValidateDisabledDays();
            ValidateOpenCloseAndInterval();
            ValidateBrazilTimezoneConversion();
            ValidatePastSlotsAreSkipped();
            ValidateDashboardConfigConsistency();

            Console.WriteLine("Todos os cenarios de validacao de horarios passaram.");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }
    }

    private static void ValidateEnabledWorkDays()
    {
        var slots = HorarioGenerationPlanner.BuildIdealUtcSlots(
            ParseBrDate("07/04/2026"),
            ParseBrDate("09/04/2026"),
            "wednesday",
            "08:00",
            "09:00",
            60,
            CreateUtc("06/04/2026 12:00"));

        AssertEqual(2, slots.Count, "Deve gerar dois horarios em 08/04/2026 para o unico dia habilitado.");
        AssertTrue(slots.All(slot => FormatBrDate(AppDateTime.GetBusinessDate(slot)) == "08/04/2026"),
            "Todos os horarios gerados precisam cair em 08/04/2026 no calendario Brasil.");
    }

    private static void ValidateDisabledDays()
    {
        var slots = HorarioGenerationPlanner.BuildIdealUtcSlots(
            ParseBrDate("06/04/2026"),
            ParseBrDate("07/04/2026"),
            "monday",
            "08:00",
            "08:00",
            30,
            CreateUtc("05/04/2026 12:00"));

        AssertEqual(1, slots.Count, "Nao deve gerar horarios no dia desabilitado.");
        AssertEqual("06/04/2026", FormatBrDate(AppDateTime.GetBusinessDate(slots.Single())),
            "O horario remanescente precisa cair apenas na segunda-feira habilitada.");
    }

    private static void ValidateOpenCloseAndInterval()
    {
        var slots = HorarioGenerationPlanner.BuildIdealUtcSlots(
            ParseBrDate("08/04/2026"),
            ParseBrDate("08/04/2026"),
            "wednesday",
            "08:00",
            "09:00",
            30,
            CreateUtc("07/04/2026 12:00"))
            .OrderBy(slot => slot)
            .ToList();

        var expected = new[]
        {
            CreateUtc("08/04/2026 11:00"),
            CreateUtc("08/04/2026 11:30"),
            CreateUtc("08/04/2026 12:00")
        };

        AssertSequenceEqual(expected, slots, "A geracao deve respeitar abertura, fechamento e intervalo de 30 minutos.");
    }

    private static void ValidateBrazilTimezoneConversion()
    {
        var slotUtc = AppDateTime.CreateBusinessSlotUtc(ParseBrDate("08/04/2026"), TimeSpan.Parse("08:00"));
        AssertEqual(CreateUtc("08/04/2026 11:00"), slotUtc,
            "08:00 no horario da barbearia precisa virar 11:00 UTC.");
    }

    private static void ValidatePastSlotsAreSkipped()
    {
        var slots = HorarioGenerationPlanner.BuildIdealUtcSlots(
            ParseBrDate("08/04/2026"),
            ParseBrDate("08/04/2026"),
            "wednesday",
            "08:00",
            "10:00",
            30,
            CreateUtc("08/04/2026 12:15"))
            .OrderBy(slot => slot)
            .ToList();

        var expected = new[]
        {
            CreateUtc("08/04/2026 12:30"),
            CreateUtc("08/04/2026 13:00")
        };

        AssertSequenceEqual(expected, slots, "Nao deve gerar horarios que ja ficaram no passado.");
    }

    private static void ValidateDashboardConfigConsistency()
    {
        var slots = HorarioGenerationPlanner.BuildIdealUtcSlots(
            ParseBrDate("06/04/2026"),
            ParseBrDate("08/04/2026"),
            "monday,wednesday",
            "09:00",
            "10:00",
            60,
            CreateUtc("05/04/2026 12:00"))
            .OrderBy(slot => slot)
            .ToList();

        var expectedLocalDates = new[] { "06/04/2026", "06/04/2026", "08/04/2026", "08/04/2026" };
        var actualLocalDates = slots.Select(slot => FormatBrDate(AppDateTime.GetBusinessDate(slot))).ToArray();

        AssertSequenceEqual(expectedLocalDates, actualLocalDates,
            "A string workDays salva no dashboard precisa ser aplicada exatamente no backend.");
    }

    private static DateTime ParseBrDate(string value)
    {
        return DateTime.SpecifyKind(
            DateTime.ParseExact(value, "dd/MM/yyyy", CultureInfo.InvariantCulture),
            DateTimeKind.Unspecified);
    }

    private static DateTime CreateUtc(string value)
    {
        return DateTime.SpecifyKind(
            DateTime.ParseExact(value, "dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture),
            DateTimeKind.Utc);
    }

    private static string FormatBrDate(DateTime value)
    {
        return value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
    }

    private static void AssertTrue(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }

    private static void AssertEqual<T>(T expected, T actual, string message)
    {
        if (!EqualityComparer<T>.Default.Equals(expected, actual))
        {
            throw new InvalidOperationException($"{message} Esperado: {expected}. Atual: {actual}.");
        }
    }

    private static void AssertSequenceEqual<T>(IEnumerable<T> expected, IEnumerable<T> actual, string message)
    {
        var expectedList = expected.ToList();
        var actualList = actual.ToList();

        if (!expectedList.SequenceEqual(actualList))
        {
            throw new InvalidOperationException(
                $"{message} Esperado: [{string.Join(", ", expectedList)}]. Atual: [{string.Join(", ", actualList)}].");
        }
    }
}
