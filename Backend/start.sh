#!/bin/bash

echo "Aplicando migrações do banco de dados..."
dotnet ef database update --project BarbeariaSaaS.csproj

echo "Iniciando a aplicação..."
dotnet BarbeariaSaaS.dll


