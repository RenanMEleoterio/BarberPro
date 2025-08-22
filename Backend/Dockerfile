FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copie o arquivo de projeto e restaure as dependências
COPY *.csproj ./
COPY start.sh ./
RUN dotnet restore

# Copie o restante do código fonte e construa a aplicação
COPY . .
RUN dotnet publish -c Release -o out

# Use a imagem oficial do .NET SDK para executar a aplicação, pois o dotnet ef precisa do SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
COPY --from=build /app/start.sh .

# Exponha a porta que a aplicação ASP.NET Core irá escutar
EXPOSE 5000

# Defina o ponto de entrada da aplicação
ENTRYPOINT ["bash", "start.sh"]


