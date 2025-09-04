# Documentação do Projeto BarberPro

## 1. Introdução

O projeto **BarberPro** é uma aplicação web completa desenvolvida para gerenciar barbearias, oferecendo funcionalidades para clientes agendarem serviços, barbeiros gerenciarem suas agendas e gerentes administrarem a barbearia. A aplicação é construída com uma arquitetura de microsserviços, utilizando C#/.NET para o backend, React/TypeScript para o frontend e PostgreSQL como banco de dados.

Este documento visa fornecer uma visão abrangente da arquitetura, componentes e funcionalidades do sistema, servindo como um guia para desenvolvedores, administradores e qualquer pessoa interessada em entender o funcionamento interno do BarberPro.

## 2. Estrutura do Projeto

O repositório do BarberPro é organizado em três diretórios principais, cada um representando uma parte fundamental da aplicação:

*   **`Backend/`**: Contém todo o código-fonte da API RESTful desenvolvida em C# com .NET. É responsável pela lógica de negócios, interação com o banco de dados e autenticação.
*   **`Frontend/`**: Abriga o código-fonte da interface do usuário, construída com React e TypeScript. Esta parte da aplicação é responsável por interagir com o usuário e consumir os serviços fornecidos pelo backend.
*   **`Database/`**: Inclui os scripts SQL para a criação e inicialização do banco de dados PostgreSQL, definindo o esquema das tabelas e as relações entre elas.

Essa separação clara de responsabilidades facilita o desenvolvimento, a manutenção e a escalabilidade do projeto, permitindo que cada componente seja desenvolvido e implantado de forma independente.

## 3. Backend (C#/.NET)

O backend do BarberPro é uma API RESTful desenvolvida em C# utilizando o framework .NET. Ele segue uma arquitetura modular, com a lógica de negócios bem definida e separada em diferentes camadas.

### 3.1. Visão Geral da Arquitetura

A arquitetura do backend é baseada no padrão Model-View-Controller (MVC) para APIs, embora com algumas adaptações para o contexto de uma API REST. Os principais componentes são:

*   **Controllers**: Responsáveis por receber as requisições HTTP, processá-las e retornar as respostas. Eles atuam como a camada de interface entre o cliente (frontend) e a lógica de negócios.
*   **Models**: Representam as entidades de dados do sistema (ex: `Usuario`, `Barbearia`, `Agendamento`). São classes C# que mapeiam as tabelas do banco de dados.
*   **Services**: Contêm a lógica de negócios principal da aplicação. São responsáveis por orquestrar as operações, interagir com o banco de dados (através do `DbContext`) e implementar regras de negócio complexas. A injeção de dependência é amplamente utilizada para gerenciar essas dependências.
*   **Data**: Inclui o `DbContext` (Entity Framework Core) e as classes de configuração para o acesso ao banco de dados. É a camada de persistência de dados.
*   **DTOs (Data Transfer Objects)**: Classes utilizadas para transferir dados entre as camadas da aplicação, especialmente entre os controladores e os serviços, e para definir o formato dos dados de entrada e saída das APIs.

### 3.2. Componentes Principais

#### 3.2.1. `Program.cs`

O arquivo `Program.cs` é o ponto de entrada da aplicação backend. Ele é responsável por configurar o host da aplicação, registrar os serviços no contêiner de injeção de dependência e configurar o pipeline de middlewares HTTP. As principais configurações incluem:

*   **Configuração de URLs**: A aplicação é configurada para escutar em todas as interfaces de rede (`0.0.0.0`) e utiliza a variável de ambiente `PORT` para definir a porta, com `5000` como padrão. Isso é crucial para implantações em ambientes de nuvem como o Render.com.
*   **Entity Framework Core**: O `BarbeariaContext` é configurado para usar PostgreSQL, com a string de conexão obtida da variável de ambiente `DATABASE_URL` ou do `appsettings.json`. As migrações do banco de dados são aplicadas automaticamente na inicialização da aplicação, garantindo que o esquema do banco esteja sempre atualizado.
*   **Autenticação JWT**: A autenticação baseada em JSON Web Tokens (JWT) é configurada. Isso permite que os usuários se autentiquem uma vez e recebam um token que pode ser usado para acessar recursos protegidos em requisições subsequentes. Os parâmetros de validação do token (emissor, audiência, chave de assinatura) são definidos usando configurações do aplicativo.
*   **Serviços Personalizados**: Serviços como `IAuthService` (para hash de senha, geração de token) e `IGoogleAuthService` (para autenticação via Google) são registrados para injeção de dependência. Isso promove a separação de preocupações e facilita a testabilidade.
*   **CORS (Cross-Origin Resource Sharing)**: Uma política de CORS (`AllowSpecificOrigin`) é configurada para permitir requisições de origens específicas (como o frontend hospedado no Netlify ou em ambientes de desenvolvimento local). Isso é essencial para que o frontend, que geralmente roda em um domínio diferente, possa se comunicar com o backend.
*   **Swagger/OpenAPI**: Em ambiente de desenvolvimento, o Swagger é habilitado para fornecer documentação interativa da API, facilitando o teste e o entendimento dos endpoints disponíveis.
*   **Middlewares**: O pipeline de requisições inclui middlewares para CORS, roteamento, autenticação, autorização e servir arquivos estáticos.

#### 3.2.2. Controllers

Os controladores são classes que herdam de `ControllerBase` e contêm métodos de ação que respondem a requisições HTTP. Eles são decorados com `[ApiController]` e `[Route]` para definir o comportamento da API. Exemplos de controladores incluem:

*   **`AuthController.cs`**: Gerencia todas as operações relacionadas à autenticação e registro de usuários. Isso inclui login, cadastro de clientes, barbeiros e gerentes, cadastro de barbearias (que também cria um gerente inicial), autenticação via Google, e funcionalidades de recuperação/redefinição de senha. Ele utiliza `IAuthService` e `IGoogleAuthService` para a lógica de autenticação e interage com o `BarbeariaContext` para persistência de dados. As validações de entrada são realizadas diretamente nos métodos do controlador, retornando `BadRequest` em caso de falha.
*   **`AgendamentoController.cs`**: Lida com a criação, leitura, atualização e exclusão de agendamentos.
*   **`BarbeiroController.cs`**: Gerencia operações relacionadas aos barbeiros, como listagem, detalhes e atualização de perfil.
*   **`BarbeariaController.cs`**: Permite a gestão de informações da barbearia, como serviços e horários.

#### 3.2.3. Models

As classes de modelo representam as entidades de domínio da aplicação e são mapeadas para as tabelas do banco de dados pelo Entity Framework Core. Elas contêm propriedades que correspondem às colunas da tabela e podem incluir anotações de dados (`[Key]`, `[Required]`, `[StringLength]`, `[ForeignKey]`) para configurar o mapeamento e as validações. Exemplos:

*   **`Usuario.cs`**: Define a estrutura de um usuário, incluindo nome, email, hash de senha, tipo de usuário (Cliente, Barbeiro, Gerente), e relacionamentos com `Barbearia`. Possui campos opcionais para `GoogleId`, `Foto`, `Especialidades` e `Descricao` para acomodar diferentes tipos de usuários.
*   **`Barbearia.cs`**: Representa uma barbearia, com propriedades como nome, endereço, telefone, email, logo, e códigos únicos (`CodigoConvite`, `CodigoBarbearia`). Inclui coleções virtuais para `Usuarios`, `Agendamentos` e `Servicos`, estabelecendo os relacionamentos um-para-muitos.
*   **`Agendamento.cs`**: Descreve um agendamento, com detalhes como cliente, barbeiro, barbearia, data/hora, tipo de serviço, preço, observações e status. Utiliza um `enum` para o `StatusAgendamento`.
*   **`HorarioDisponivel.cs`**: Representa um slot de horário que um barbeiro tem disponível, associado a um `BarbeiroId` e uma `DataHora`.
*   **`Servico.cs`**: Define um serviço oferecido por uma barbearia, incluindo nome, preço e duração, e está associado a uma `BarbeariaId`.

#### 3.2.4. Services

A camada de serviços contém a lógica de negócios e abstrai a interação direta com o `DbContext`. Isso permite que os controladores sejam mais enxutos e focados apenas no tratamento de requisições HTTP. Exemplos:

*   **`AuthService.cs`**: Implementa a lógica de autenticação, como hashing e verificação de senhas (usando BCrypt), geração de tokens JWT, e geração de códigos únicos para barbearias e convites. É a implementação da interface `IAuthService`.
*   **`GoogleAuthService.cs`**: Responsável por verificar tokens de autenticação do Google e obter informações do usuário a partir deles. Implementa a interface `IGoogleAuthService`.

### 3.3. Autenticação

O backend do BarberPro suporta dois métodos de autenticação:

*   **Autenticação Baseada em Senha (JWT)**: Usuários podem se registrar com email e senha. As senhas são armazenadas como hashes (usando BCrypt) para segurança. Após o login bem-sucedido, um JSON Web Token (JWT) é emitido. Este token deve ser incluído no cabeçalho `Authorization` das requisições subsequentes para acessar rotas protegidas.
*   **Autenticação via Google**: Usuários podem se autenticar usando suas contas Google. O frontend envia um `id_token` do Google para o backend, que é verificado usando o `GoogleAuthService`. Se o usuário Google já existir no sistema, ele é logado; caso contrário, um novo usuário é criado com base nas informações do Google.

### 3.4. Configuração do Banco de Dados

O projeto utiliza **PostgreSQL** como sistema de gerenciamento de banco de dados relacional e **Entity Framework Core** como ORM (Object-Relational Mapper). A configuração é feita no `Program.cs`, onde o `BarbeariaContext` é configurado para usar o provedor Npgsql. A string de conexão é flexível, permitindo o uso de variáveis de ambiente para ambientes de produção.

As migrações do Entity Framework Core são aplicadas automaticamente na inicialização, garantindo que o esquema do banco de dados esteja sempre sincronizado com os modelos C#.

## 4. Frontend (React/TypeScript)

O frontend do BarberPro é uma Single Page Application (SPA) desenvolvida com React e TypeScript, utilizando Vite para o ambiente de desenvolvimento e build. A interface é projetada para ser responsiva e intuitiva, atendendo às necessidades de clientes, barbeiros e gerentes.

### 4.1. Visão Geral da Arquitetura

A arquitetura do frontend é baseada em componentes React, com uma estrutura de diretórios clara para organizar diferentes partes da aplicação:

*   **`src/`**: Contém todo o código-fonte da aplicação React.
    *   **`components/`**: Componentes React reutilizáveis (ex: `Layout`, `AuthForm`).
    *   **`pages/`**: Componentes que representam páginas completas da aplicação, organizados por tipo de usuário (`client`, `barber`, `manager`).
    *   **`contexts/`**: Contextos React para gerenciamento de estado global (ex: `AuthContext`, `ThemeContext`).
    *   **`services/`**: Funções e classes para interagir com a API do backend.
    *   **`types/`**: Definições de tipos TypeScript para as entidades de dados e DTOs.

### 4.2. Componentes Principais

#### 4.2.1. `App.tsx`

O arquivo `App.tsx` é o componente raiz da aplicação React. Ele é responsável por:

*   **Configuração de Provedores**: Envolve a aplicação com `ThemeProvider` (para gerenciamento de tema) e `AuthProvider` (para gerenciamento de autenticação). Isso torna o tema e os dados do usuário globalmente acessíveis a todos os componentes filhos.
*   **Roteamento**: Utiliza `react-router-dom` para definir as rotas da aplicação. O `HashRouter` é empregado para compatibilidade com hospedagem estática (como Netlify), onde o roteamento baseado em histórico pode exigir configurações de servidor.
*   **Rotas Protegidas (`ProtectedRoute`)**: Um componente `ProtectedRoute` é implementado para controlar o acesso às rotas com base no status de autenticação do usuário e seu tipo (`role`). Se um usuário não estiver autenticado ou não tiver a `role` permitida para uma rota específica, ele é redirecionado para a página de autenticação ou para a dashboard de sua `role`.
*   **Estrutura de Layout**: A rota principal (`/`) utiliza um componente `Layout` que serve como um invólucro para as páginas protegidas, fornecendo elementos comuns como navegação e cabeçalho/rodapé.
*   **Notificações (`Toaster`)**: O `react-hot-toast` é configurado para exibir mensagens de notificação ao usuário de forma amigável.

#### 4.2.2. Contextos

*   **`AuthContext.tsx`**: Gerencia o estado de autenticação do usuário. Ele armazena informações como o usuário logado, seu token JWT e funções para login, logout e registro. Este contexto é crucial para manter o estado de autenticação consistente em toda a aplicação e para proteger rotas.
*   **`ThemeContext.tsx`**: Provavelmente gerencia o tema da aplicação (claro/escuro), permitindo que os componentes acessem e alterem o tema globalmente.

#### 4.2.3. Páginas

As páginas são componentes React que representam telas completas da aplicação, organizadas por tipo de usuário para clareza e manutenção. Exemplos:

*   **`client/`**: Contém páginas para clientes, como `ClientDashboard` (visão geral do cliente), `Barbershops` (listagem de barbearias), `Appointments` (agendamentos do cliente) e `BookAppointment` (tela para agendar um serviço).
*   **`barber/`**: Contém páginas para barbeiros, como `BarberDashboard` (visão geral do barbeiro), `BarberSchedule` (agenda do barbeiro), `BarberStats` (estatísticas de desempenho) e `BarberSettings` (configurações de perfil).
*   **`manager/`**: Contém páginas para gerentes, como `ManagerDashboard` (visão geral da barbearia), `ManagerBarbers` (gestão de barbeiros), `ManagerStats` (estatísticas da barbearia) e `ManagerSettings` (configurações da barbearia).

### 4.3. Interação com o Backend

O frontend se comunica com o backend através de requisições HTTP (provavelmente usando `fetch` ou uma biblioteca como `axios`). As funções para essas interações são encapsuladas no diretório `services/` para manter a lógica de comunicação separada dos componentes da UI. O token JWT, obtido no login, é incluído no cabeçalho `Authorization` das requisições para endpoints protegidos.

## 5. Database (PostgreSQL)

O diretório `Database/` contém o script `init.sql`, que é responsável por configurar o esquema do banco de dados PostgreSQL para o BarberPro. Este script define as tabelas, seus campos, tipos de dados, chaves primárias e estrangeiras, índices, e também inclui funções e triggers para automatizar certas operações.

### 5.1. Esquema do Banco de Dados

O banco de dados é composto pelas seguintes tabelas principais:

*   **`barbearias`**: Armazena informações sobre cada barbearia, como nome, endereço, telefone, email, logo, e dois códigos únicos: `codigo_convite` (usado para novos barbeiros/gerentes se associarem) e `codigo_barbearia` (identificador único da barbearia).
*   **`usuarios`**: Contém os dados de todos os usuários do sistema (clientes, barbeiros e gerentes). Inclui campos para nome, email, hash da senha, tipo de usuário (definido por um `INTEGER` com `CHECK` constraint), e uma chave estrangeira para `barbearias` (para barbeiros e gerentes). Campos adicionais como `foto`, `especialidades` e `descricao` são específicos para barbeiros.
*   **`horarios_disponiveis`**: Registra os slots de tempo que cada barbeiro tem disponível para agendamentos. Cada registro inclui a `data_hora`, o `barbeiro_id` e um status `esta_disponivel`.
*   **`agendamentos`**: Armazena os detalhes de cada agendamento realizado, incluindo `cliente_id`, `barbeiro_id`, `barbearia_id`, `data_hora`, `tipo_servico`, `preco_servico`, `observacoes` e `status` (definido por um `INTEGER` com `CHECK` constraint).
*   **`servicos`**: Lista os serviços que uma barbearia oferece, com `nome`, `preco`, `duracao_minutos` e uma chave estrangeira para `barbearia_id`.

### 5.2. Funções e Triggers

O script `init.sql` também define:

*   **`gerar_codigo_convite()`**: Uma função PL/pgSQL que gera um código alfanumérico único de 8 caracteres para o `codigo_convite` de uma nova barbearia. Ela garante a unicidade do código através de um loop que verifica a existência do código gerado antes de retorná-lo.
*   **`trigger_gerar_codigo_convite()`**: Uma função de trigger que chama `gerar_codigo_convite()` automaticamente antes de uma nova linha ser inserida na tabela `barbearias`, preenchendo o campo `codigo_convite` se ele não for fornecido.
*   **`trigger_atualizar_data_atualizacao()`**: Uma função de trigger que atualiza automaticamente a coluna `data_atualizacao` para o `CURRENT_TIMESTAMP` sempre que um registro na tabela `agendamentos` é modificado.

### 5.3. Índices

Diversos índices são criados para otimizar o desempenho das consultas, especialmente em campos frequentemente usados em cláusulas `WHERE` ou `JOIN`, como emails de usuários, IDs de barbearias e datas de agendamento/horários disponíveis.

### 5.4. Dados de Exemplo

O script inclui seções comentadas para inserção de dados de exemplo (`INSERT INTO ... ON CONFLICT DO NOTHING`), que podem ser descomentadas para popular o banco de dados com uma barbearia, um gerente, um barbeiro e um cliente de demonstração. Isso é útil para testes e desenvolvimento inicial.

## 6. Instalação e Configuração

Para configurar e rodar o projeto BarberPro localmente, siga os passos abaixo:

### 6.1. Pré-requisitos

Certifique-se de ter os seguintes softwares instalados em sua máquina:

*   **Git**: Para clonar o repositório.
*   **.NET SDK (versão 6.0 ou superior)**: Para compilar e rodar o backend C#.
*   **Node.js e npm (ou Yarn/pnpm)**: Para gerenciar as dependências e rodar o frontend React.
*   **PostgreSQL**: O servidor de banco de dados. Você pode instalá-lo diretamente ou usar Docker.
*   **Um editor de código** (ex: VS Code) com suporte a C#, TypeScript e React.

### 6.2. Configuração do Banco de Dados

1.  **Crie um banco de dados PostgreSQL**: Abra seu cliente PostgreSQL (pgAdmin, psql, DBeaver, etc.) e crie um novo banco de dados, por exemplo, `barbearia_saas`.
    ```sql
    CREATE DATABASE barbearia_saas;
    ```
2.  **Execute o script `init.sql`**: Conecte-se ao banco de dados recém-criado e execute todo o conteúdo do arquivo `Database/init.sql`. Este script criará as tabelas, funções e triggers necessários.
    ```bash
    psql -U seu_usuario -d barbearia_saas -f /caminho/para/BarberPro/Database/init.sql
    ```
3.  **Configure a string de conexão**: No diretório `Backend/`, localize o arquivo `appsettings.json` (ou `appsettings.Development.json` para desenvolvimento) e configure a string de conexão para o seu banco de dados PostgreSQL. Alternativamente, você pode definir a variável de ambiente `DATABASE_URL`.
    Exemplo em `appsettings.Development.json`:
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5432;Database=barbearia_saas;Username=seu_usuario;Password=sua_senha"
      },
      "Jwt": {
        "Key": "SuaChaveSecretaMuitoLongaParaJWTQueDeveTerPeloMenos32Caracteres",
        "Issuer": "BarberPro",
        "Audience": "BarberProUsers"
      },
      "GoogleAuth": {
        "ClientId": "SEU_CLIENT_ID_DO_GOOGLE"
      }
    }
    ```
    **Importante**: A `Jwt:Key` deve ser uma string longa e segura. O `GoogleAuth:ClientId` deve ser o ID do cliente da sua aplicação Google Cloud para autenticação.

### 6.3. Rodando o Backend

1.  **Navegue até o diretório do backend**: 
    ```bash
    cd /caminho/para/BarberPro/Backend
    ```
2.  **Restaure as dependências**: 
    ```bash
    dotnet restore
    ```
3.  **Rode a aplicação**: 
    ```bash
    dotnet run
    ```
    O backend será iniciado, geralmente na porta 5000 (ou na porta definida pela variável de ambiente `PORT`). Você verá mensagens no console indicando que a aplicação está rodando.

### 6.4. Rodando o Frontend

1.  **Navegue até o diretório do frontend**: 
    ```bash
    cd /caminho/para/BarberPro/Frontend
    ```
2.  **Instale as dependências**: 
    ```bash
    npm install # ou yarn install / pnpm install
    ```
3.  **Rode a aplicação em modo de desenvolvimento**: 
    ```bash
    npm run dev # ou yarn dev / pnpm dev
    ```
    O frontend será iniciado, geralmente na porta 5173. Abra seu navegador e acesse `http://localhost:5173` (ou a URL indicada no console) para ver a aplicação em funcionamento.

## 7. Considerações Finais

O projeto BarberPro oferece uma solução robusta e escalável para o gerenciamento de barbearias, com uma arquitetura bem definida e o uso de tecnologias modernas. A separação entre frontend, backend e banco de dados permite o desenvolvimento e a manutenção independentes de cada camada, facilitando a colaboração e a evolução do sistema.

Para futuras melhorias, pode-se considerar a implementação de testes unitários e de integração mais abrangentes, a adição de funcionalidades de notificação em tempo real (websockets), e a exploração de ferramentas de CI/CD para automação do deploy. A documentação será atualizada conforme o projeto evoluir.


