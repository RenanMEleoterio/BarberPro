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

var builder = WebApplication.CreateBuilder(args);

// Configure URLs to listen on HTTP only and use the PORT environment variable
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
builder.Services.AddControllers();

// Entity Framework
builder.Services.AddDbContext<BarbeariaContext>(options =>
{
    var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("DefaultConnection");
    Console.WriteLine($"DEBUG: Connection String: {connectionString}"); // Debug log
    options.UseNpgsql(connectionString);
});

// Authentication
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();



// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins(
                "https://barberproapp.netlify.app",
                "http://localhost:3000", 
                "http://localhost:5173",
                "http://localhost:5000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowAnyOrigin(); // AllowAnyOrigin for now to debug CORS issues
        });
});

var app = builder.Build();

// Use CORS policy before UseRouting
app.UseCors("AllowSpecificOrigin");

app.UseRouting();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Removed HTTPS redirection for Render

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Serve static files
app.UseStaticFiles();

// Apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BarbeariaContext>();
    dbContext.Database.Migrate();
}

// Verificar barbearias se o argumento for passado
if (args.Length > 0 && args[0] == "check-barbearias")
{
    await CheckBarbearias.Run(app.Services);
    return;
}

app.Run();



