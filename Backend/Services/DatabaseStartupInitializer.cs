using System;
using System.Threading;
using System.Threading.Tasks;
using BarbeariaSaaS.Configuration;
using BarbeariaSaaS.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BarbeariaSaaS.Services;

public sealed class DatabaseStartupInitializer
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHostEnvironment _environment;
    private readonly IOptions<DatabaseStartupOptions> _options;
    private readonly ILogger<DatabaseStartupInitializer> _logger;

    public DatabaseStartupInitializer(
        IServiceProvider serviceProvider,
        IHostEnvironment environment,
        IOptions<DatabaseStartupOptions> options,
        ILogger<DatabaseStartupInitializer> logger)
    {
        _serviceProvider = serviceProvider;
        _environment = environment;
        _options = options;
        _logger = logger;
    }

    public async Task<bool> InitializeAsync(
        bool forceMigration = false,
        bool failOnError = false,
        CancellationToken cancellationToken = default)
    {
        var shouldAutoMigrate = forceMigration || (_options.Value.AutoMigrate ?? _environment.IsDevelopment());

        if (!shouldAutoMigrate)
        {
            _logger.LogInformation("Inicializacao automatica do banco desativada para este ambiente.");
            return true;
        }

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BarbeariaContext>();

        try
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
            _logger.LogInformation("Migracoes aplicadas com sucesso.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao aplicar migracoes na inicializacao.");

            var shouldUseEnsureCreatedFallback =
                !forceMigration && (_options.Value.EnsureCreatedFallback ?? _environment.IsDevelopment());

            if (!shouldUseEnsureCreatedFallback)
            {
                if (failOnError)
                {
                    throw;
                }

                return false;
            }

            try
            {
                await dbContext.Database.EnsureCreatedAsync(cancellationToken);
                _logger.LogWarning("Banco criado com EnsureCreated como fallback.");
                return true;
            }
            catch (Exception createEx)
            {
                _logger.LogError(createEx, "Erro ao criar banco de dados com EnsureCreated.");

                if (failOnError)
                {
                    throw;
                }

                return false;
            }
        }
    }
}
