FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copie o arquivo de projeto e restaure as dependências
COPY *.csproj ./
COPY start.sh ./
RUN dotnet restore

# Copie o restante do código fonte e construa a aplicação
COPY . .
RUN dotnet publish -c Release -o out

# Use a imagem oficial do .NET ASP.NET Runtime para executar a aplicação
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
COPY --from=build /app/start.sh .

# Instalar dotnet-ef na imagem de runtime
RUN dotnet tool install --global dotnet-ef --version 8.0.0
ENV PATH="$PATH:/root/.dotnet/tools"

# Exponha a porta que a aplicação ASP.NET Core irá escutar
EXPOSE 5000

# Defina o ponto de entrada da aplicação
ENTRYPOINT ["bash", "start.sh"]


