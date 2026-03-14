using System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using System.Linq;
using System.Collections.Generic;

// Cria uma instância do WebApplicationBuilder, que é o ponto de entrada para configurar e construir a aplicação web.
var builder = WebApplication.CreateBuilder(args);

// Configura as URLs nas quais a aplicação irá escutar. 
// Prioriza a variável de ambiente 'PORT' para ambientes de produção (como Render.com) ou usa a porta 5000 como padrão.
// A aplicação escutará em todas as interfaces de rede (0.0.0.0).
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Adiciona serviços ao contêiner de injeção de dependência.
// Adiciona suporte para controladores MVC/API, permitindo que a aplicação responda a requisições HTTP.
builder.Services.AddControllers();

// Configura o DbContext (BarbeariaContext) para o Entity Framework Core.
// A string de conexão é obtida da variável de ambiente 'DATABASE_URL' (para produção) ou do 'DefaultConnection' no appsettings.json (para desenvolvimento).
// Usa Npgsql para conectar ao PostgreSQL.
builder.Services.AddDbContext<BarbeariaContext>(options =>
{
    var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
});

// Configura a autenticação JWT (JSON Web Token).
// Define os parâmetros de validação do token, incluindo emissor, audiência e chave de assinatura.
// A chave é obtida da configuração 'Jwt:Key' e codificada em UTF8.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not found")))
        };
    });

// Registra os serviços personalizados da aplicação no contêiner de injeção de dependência.
// IAuthService é registrado como um serviço com escopo (scoped), o que significa que uma nova instância é criada por requisição.
// IGoogleAuthService é registrado com um HttpClient, útil para fazer requisições HTTP externas (e.g., para a API do Google).
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<HorarioService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();

// Configura as políticas de CORS (Cross-Origin Resource Sharing).
// Os domínios permitidos podem ser configurados em "Cors:AllowedOrigins" no appsettings ou variáveis de ambiente.
// Caso não haja configuração, utiliza uma lista padrão adequada para desenvolvimento e produção atuais.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                    ?? new[]
                    {
                        "https://barberproapp.netlify.app",
                        "http://localhost:3000",
                        "http://localhost:5173"
                    };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        });
});

// Constrói a aplicação web a partir das configurações e serviços definidos no builder.
var app = builder.Build();

// Middleware de CORS: deve ser usado antes de UseRouting para garantir que as políticas de CORS sejam aplicadas corretamente.
app.UseCors("AllowSpecificOrigin");

// Middleware de roteamento: responsável por rotear as requisições HTTP para os endpoints corretos (controladores).
app.UseRouting();

// Configurações específicas para o ambiente de desenvolvimento.
// Habilita Swagger/OpenAPI para documentação e teste de APIs, se a aplicação estiver em modo de desenvolvimento.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Comentado para ambientes como Render, que podem lidar com HTTPS externamente.

// Middleware de autenticação: verifica as credenciais do usuário e anexa o objeto de usuário autenticado ao contexto da requisição.
app.UseAuthentication();
// Middleware de autorização: verifica se o usuário autenticado tem permissão para acessar o recurso solicitado.
app.UseAuthorization();

// Mapeia os controladores para as rotas da aplicação.
app.MapControllers();

// Serve arquivos estáticos (HTML, CSS, JavaScript, imagens) da pasta wwwroot.
app.UseStaticFiles();

// Aplica migrações do banco de dados na inicialização da aplicação.
// Garante que o esquema do banco de dados esteja atualizado com o modelo da aplicação.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BarbeariaContext>();
    try
    {
        // Verifica se o banco de dados pode ser conectado
        if (dbContext.Database.CanConnect())
        {
            // Aplica as migrações pendentes
            dbContext.Database.Migrate();
            Console.WriteLine("Migrações aplicadas com sucesso.");
        }
        else
        {
            Console.WriteLine("Não foi possível conectar ao banco de dados.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao aplicar migrações: {ex.Message}");
        // Em caso de erro, tenta criar o banco de dados do zero
        try
        {
            dbContext.Database.EnsureCreated();
            Console.WriteLine("Banco de dados criado com EnsureCreated.");
        }
        catch (Exception createEx)
        {
            Console.WriteLine($"Erro ao criar banco de dados: {createEx.Message}");
        }
    }
}

// Lógica condicional para executar a verificação de barbearias.
// Se o argumento "check-barbearias" for passado na linha de comando, executa a função CheckBarbearias.Run.
// Isso é útil para tarefas de manutenção ou inicialização específicas.
if (args.Length > 0 && args[0] == "check-barbearias")
{
    await CheckBarbearias.Run(app.Services);
    return;
}

// Inicia a aplicação web, que começa a escutar as requisições HTTP.
app.Run();



