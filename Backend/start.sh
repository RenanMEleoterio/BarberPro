#!/bin/bash

# Inicia a aplicação ASP.NET Core
dotnet ef database update --project BarbeariaSaaS.csproj
dotnet BarbeariaSaaS.dll --urls "http://0.0.0.0:${PORT:-8080}"


