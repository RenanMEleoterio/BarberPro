using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;
using BarbeariaSaaS.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

internal static class Program
{
    private static int Main(string[] args)
    {
        try
        {
            if (args.Length > 0 && string.Equals(args[0], "inspect-barbershop", StringComparison.OrdinalIgnoreCase))
            {
                var barbeariaId = args.Length > 1 && int.TryParse(args[1], out var parsedId) ? parsedId : 1;
                InspectBarbershop(barbeariaId);
                return 0;
            }

            if (args.Length > 0 && string.Equals(args[0], "generate-barbershop", StringComparison.OrdinalIgnoreCase))
            {
                var barbeariaId = args.Length > 1 && int.TryParse(args[1], out var parsedId) ? parsedId : 1;
                GenerateBarbershop(barbeariaId);
                return 0;
            }

            if (args.Length > 0 && string.Equals(args[0], "inspect-manager-stats", StringComparison.OrdinalIgnoreCase))
            {
                var managerId = args.Length > 1 && int.TryParse(args[1], out var parsedId) ? parsedId : 1;
                var periodo = args.Length > 2 ? args[2] : "trimestre";
                InspectManagerStats(managerId, periodo);
                return 0;
            }

            if (args.Length > 0 && string.Equals(args[0], "inspect-managers", StringComparison.OrdinalIgnoreCase))
            {
                InspectManagers();
                return 0;
            }

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

    private static void InspectBarbershop(int barbeariaId)
    {
        using var context = CreateContext();

        var barbearia = context.Barbearias
            .AsNoTracking()
            .FirstOrDefault(b => b.Id == barbeariaId);

        if (barbearia == null)
        {
            throw new InvalidOperationException($"Barbearia {barbeariaId} nao encontrada.");
        }

        Console.WriteLine($"Barbearia {barbearia.Id}: {barbearia.Nome}");
        Console.WriteLine($"WorkDays bruto: {barbearia.WorkDays}");
        Console.WriteLine($"OpenTime bruto: {barbearia.OpenTime}");
        Console.WriteLine($"CloseTime bruto: {barbearia.CloseTime}");

        var barbeiros = context.Usuarios
            .AsNoTracking()
            .Where(u => u.BarbeariaId == barbeariaId && u.TipoUsuario == TipoUsuario.Barbeiro)
            .OrderBy(u => u.Id)
            .Select(u => new { u.Id, u.Nome })
            .ToList();

        Console.WriteLine($"Barbeiros vinculados: {barbeiros.Count}");

        var agoraUtc = AppDateTime.UtcNow();
        var limiteUtc = agoraUtc.AddDays(14);

        foreach (var barbeiro in barbeiros)
        {
            Console.WriteLine($"Barbeiro {barbeiro.Id}: {barbeiro.Nome}");

            var horarios = context.HorariosDisponiveis
                .AsNoTracking()
                .Where(h => h.BarbeiroId == barbeiro.Id && h.DataHora >= agoraUtc && h.DataHora < limiteUtc)
                .OrderBy(h => h.DataHora)
                .Select(h => new
                {
                    h.Id,
                    h.DataHora,
                    h.EstaDisponivel
                })
                .ToList();

            Console.WriteLine($"  Slots futuros (14 dias): {horarios.Count}");

            var porDia = horarios
                .GroupBy(h => FormatBrDate(AppDateTime.GetBusinessDate(h.DataHora)))
                .OrderBy(group => DateTime.ParseExact(group.Key, "dd/MM/yyyy", CultureInfo.InvariantCulture))
                .Select(group => $"{group.Key}={group.Count()}")
                .ToList();

            Console.WriteLine($"  Slots por dia Brasil: {(porDia.Count == 0 ? "nenhum" : string.Join(", ", porDia))}");

            foreach (var horario in horarios.Take(10))
            {
                var dataLocal = AppDateTime.GetBusinessDate(horario.DataHora);
                Console.WriteLine(
                    $"  Slot {horario.Id}: utc={horario.DataHora:yyyy-MM-ddTHH:mm:ssZ} local={FormatBrDate(dataLocal)} {horario.DataHora.AddHours(-3):HH:mm} disponivel={horario.EstaDisponivel}");
            }
        }
    }

    private static void GenerateBarbershop(int barbeariaId)
    {
        using var context = CreateContext();
        var service = new HorarioService(context);
        var inicio = AppDateTime.TodayInBusinessTimeZone();
        var fim = inicio.AddDays(30);

        var total = service.GerarHorariosParaBarbearia(barbeariaId, inicio, fim).GetAwaiter().GetResult();

        Console.WriteLine($"Horarios gerados: {total}");
        InspectBarbershop(barbeariaId);
    }

    private static void InspectManagers()
    {
        using var context = CreateContext();

        var managers = context.Usuarios
            .AsNoTracking()
            .Where(u => u.TipoUsuario == TipoUsuario.Gerente)
            .OrderBy(u => u.Id)
            .Select(u => new
            {
                u.Id,
                u.Nome,
                u.Email,
                u.BarbeariaId
            })
            .ToList();

        Console.WriteLine($"Gerentes encontrados: {managers.Count}");
        foreach (var manager in managers)
        {
            Console.WriteLine(
                $"Manager {manager.Id}: nome={manager.Nome}, email={manager.Email}, barbeariaId={manager.BarbeariaId}");
        }
    }

    private static void InspectManagerStats(int managerId, string periodo)
    {
        using var context = CreateContext();

        var manager = context.Usuarios
            .AsNoTracking()
            .FirstOrDefault(u => u.Id == managerId && u.TipoUsuario == TipoUsuario.Gerente);

        if (manager?.BarbeariaId == null)
        {
            throw new InvalidOperationException($"Gerente {managerId} nao encontrado ou sem barbearia vinculada.");
        }

        var barbearia = context.Barbearias
            .AsNoTracking()
            .FirstOrDefault(b => b.Id == manager.BarbeariaId.Value);

        if (barbearia == null)
        {
            throw new InvalidOperationException($"Barbearia {manager.BarbeariaId.Value} nao encontrada.");
        }

        var service = new StatsService(context, NullLogger<StatsService>.Instance);
        var result = service.GetManagerStatsAsync(barbearia.Id, barbearia.Nome, periodo).GetAwaiter().GetResult();

        Console.WriteLine($"Manager {manager.Id}: {manager.Nome}");
        Console.WriteLine($"Barbearia {barbearia.Id}: {barbearia.Nome}");
        Console.WriteLine($"Periodo: {periodo}");
        Console.WriteLine($"ReceitaTotal={result.ReceitaTotal}");
        Console.WriteLine($"TotalClientes={result.TotalClientes}");
        Console.WriteLine($"TotalAgendamentos={result.TotalAgendamentos}");
        Console.WriteLine($"AvaliacaoMedia={result.AvaliacaoMedia}");
        Console.WriteLine($"PerformanceMensal={result.PerformanceMensal.Count}");
        Console.WriteLine($"ServicosPopulares={result.ServicosPopulares.Count}");
        Console.WriteLine($"RankingBarbeiros={result.RankingBarbeiros.Count}");
        Console.WriteLine("JSON serializado com padrao ASP.NET:");
        Console.WriteLine(JsonSerializer.Serialize(result, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
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

    private static IConfiguration BuildConfiguration()
    {
        var basePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Backend"));

        return new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Local.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    private static BarbeariaContext CreateContext()
    {
        var configuration = BuildConfiguration();
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string nao encontrada.");

        var options = new DbContextOptionsBuilder<BarbeariaContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new BarbeariaContext(options);
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
