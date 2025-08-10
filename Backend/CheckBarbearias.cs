using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using BarbeariaSaaS.Data;
using BarbeariaSaaS.Models;

public class CheckBarbearias
{
    public static async Task Run(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BarbeariaContext>();

        var barbearias = await context.Barbearias.ToListAsync();
        
        Console.WriteLine("=== Barbearias Cadastradas ===");
        foreach (var barbearia in barbearias)
        {
            Console.WriteLine($"ID: {barbearia.Id}, Nome: {barbearia.Nome}, Código de Convite: {barbearia.CodigoConvite}");
        }
        
        if (!barbearias.Any())
        {
            Console.WriteLine("Nenhuma barbearia encontrada. Criando barbearias de exemplo...");
            
            var barbearia1 = new Barbearia
            {
                Nome = "Barbearia Exemplo 1",
                Endereco = "Rua Exemplo, 123",
                Telefone = "(11) 99999-9999",
                Email = "exemplo1@barbearia.com",
                CodigoConvite = "BARB123"
            };
            
            var barbearia2 = new Barbearia
            {
                Nome = "Barbearia Exemplo 2",
                Endereco = "Av. Teste, 456",
                Telefone = "(11) 88888-8888",
                Email = "exemplo2@barbearia.com",
                CodigoConvite = "BARB456"
            };
            
            context.Barbearias.Add(barbearia1);
            context.Barbearias.Add(barbearia2);
            await context.SaveChangesAsync();
            
            Console.WriteLine("Barbearias de exemplo criadas com sucesso!");
            Console.WriteLine($"ID: {barbearia1.Id}, Nome: {barbearia1.Nome}, Código de Convite: {barbearia1.CodigoConvite}");
            Console.WriteLine($"ID: {barbearia2.Id}, Nome: {barbearia2.Nome}, Código de Convite: {barbearia2.CodigoConvite}");
        }
    }
}

