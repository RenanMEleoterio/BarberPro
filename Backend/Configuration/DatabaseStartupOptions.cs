namespace BarbeariaSaaS.Configuration;

public sealed class DatabaseStartupOptions
{
    public const string SectionName = "DatabaseStartup";

    public bool? AutoMigrate { get; set; }

    public bool? EnsureCreatedFallback { get; set; }
}
