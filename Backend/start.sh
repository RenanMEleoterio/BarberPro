#!/bin/bash

# Inicia a aplicação ASP.NET Core
dotnet BarbeariaSaaS.dll --urls "http://0.0.0.0:${PORT:-8080}"


