# Refatoracao controlada do sistema

## 1. Objetivo

- Refatorar o sistema sem alterar o comportamento funcional aceito hoje.
- Executar a melhoria por prioridade, com rastreabilidade clara e checkpoints de controle.
- Encerrar cada prioridade com validacao automatica compativel e checkpoint manual antes de seguir.

## 2. Regras de seguranca da refatoracao

- Nao alterar rotas, payloads e contratos sem necessidade comprovada.
- Nao trocar stack, infraestrutura ou padroes publicos do sistema.
- Nao reescrever blocos grandes sem justificativa tecnica e sem ganho real.
- Nao mudar comportamento ja aceito pelo sistema apenas por estetica.
- Toda refatoracao deve buscar equivalencia funcional explicita.
- Toda mudanca deve ser validada por testes compativeis e por checkpoint manual ao final da prioridade.

## 3. Sistema de pontuacao

- Pontuacao base por prioridade:
  - P1 = 13 pontos por item concluido
  - P2 = 8 pontos por item concluido
  - P3 = 5 pontos por item concluido
- Bonus por qualidade de teste:
  - +2 pontos por teste unitario relevante criado/corrigido e validado
  - +3 pontos por teste de integracao relevante criado/corrigido e validado
  - +5 pontos por teste end-to-end relevante criado/corrigido e validado
  - +2 pontos por correcao de teste quebrado ja existente
  - +1 ponto por cenario critico de regressao explicitamente validado
- Pontuacao base maxima inicial por prioridade:
  - P1 = 52 pontos
  - P2 = 32 pontos
  - P3 = 10 pontos
- Pontuacao maxima esperada nesta fase:
  - P1 = 60 pontos
  - P2 = 36 pontos
  - P3 = 15 pontos
- Pontuacao obtida:
  - P1 = 60 pontos
  - P2 = 36 pontos
  - P3 = 15 pontos
- Percentual de conclusao atual:
  - P1 = 100%
  - P2 = 100%
  - P3 = 100%

## 4. Checklist geral de refatoracao

- [x] P1-01 - Proteger segredos e limpar config versionada
  - Prioridade: P1
  - Pontos base: 13
  - Risco: baixo
  - Arquivos afetados: `Backend/appsettings.json`, `Backend/Program.cs`, `.gitignore`, `Backend/appsettings.Local.example.json`
  - Objetivo tecnico: remover segredo versionado, manter override local seguro e preservar o fluxo atual de carregamento de configuracao.
  - Criterio de conclusao: segredo nao fica mais em arquivo rastreado, override local continua suportado e configuracao minima fica documentada.
  - Testes associados: build do backend e validacao manual de inicializacao, JWT e conexao de ambiente.
  - Status: concluido
  - Bonus por testes: 0
  - Pontuacao obtida: 13

- [x] P1-02 - Centralizar helpers de auth/claims/status
  - Prioridade: P1
  - Pontos base: 13
  - Risco: baixo
  - Arquivos afetados: `Backend/Extensions/ClaimsPrincipalExtensions.cs`, `Backend/Controllers/AgendamentoController.cs`, `Backend/Controllers/HorarioController.cs`, `Backend/Controllers/DashboardController.cs`, `Frontend/src/contexts/AuthContext.tsx`, `Frontend/src/contexts/auth-helpers.ts`, `Frontend/src/utils/appointmentStatus.ts`, `Frontend/src/services/api/api-appointments.ts`, `Frontend/src/pages/barber/BarberDashboard.tsx`, `Frontend/src/pages/barber/BarberSchedule.tsx`, `Frontend/src/pages/barber/components/AppointmentsList.tsx`
  - Objetivo tecnico: reduzir duplicacao de claims, mapeamento de usuario autenticado e logica repetida de status no frontend.
  - Criterio de conclusao: claims/auth/status deixam de estar duplicados nos hotspots da P1 e passam a usar helpers reutilizaveis.
  - Testes associados: `Frontend/src/contexts/auth-helpers.test.ts`, `Frontend/src/utils/appointmentStatus.test.ts` e regressao dos componentes impactados.
  - Status: concluido
  - Bonus por testes: 4
  - Pontuacao obtida: 17

- [x] P1-03 - Estabilizar e corrigir testes existentes
  - Prioridade: P1
  - Pontos base: 13
  - Risco: medio
  - Arquivos afetados: `Frontend/src/setupTests.ts`, `Frontend/src/pages/barber/BarberDashboard.test.tsx`, `Frontend/src/pages/barber/BarberSchedule.test.tsx`
  - Objetivo tecnico: alinhar a suite existente ao comportamento real atual e remover quebras introduzidas por mocks e contratos obsoletos.
  - Criterio de conclusao: testes da etapa executam com sucesso no ambiente compativel e cobrem os fluxos atuais previstos.
  - Testes associados: `npm test -- --run` no frontend e build do backend para garantir integridade da etapa.
  - Status: concluido
  - Bonus por testes: 4
  - Pontuacao obtida: 17

- [x] P1-04 - Padronizar tratamento de datas/UTC
  - Prioridade: P1
  - Pontos base: 13
  - Risco: alto
  - Arquivos afetados: `Backend/Services/AppDateTime.cs`, `Backend/Controllers/AgendamentoController.cs`, `Backend/Controllers/HorarioController.cs`, `Backend/Controllers/StatsController.cs`, `Backend/Services/HorarioService.cs`
  - Objetivo tecnico: concentrar normalizacao de datas e timezone nos pontos de maior risco sem alterar contrato externo.
  - Criterio de conclusao: os hotspots da P1 deixam de usar conversoes ad hoc mais perigosas e passam a depender de helpers explicitos e reutilizaveis.
  - Testes associados: build do backend, regressao dos testes frontend de agenda e validacao manual forte de agendamento, reagendamento e timezone.
  - Status: concluido
  - Bonus por testes: 0
  - Pontuacao obtida: 13

- [x] P2-01 - Extrair regras de controllers grandes para services
  - Prioridade: P2
  - Pontos base: 8
  - Risco: medio
  - Arquivos afetados: `Backend/Controllers/StatsController.cs`, `Backend/Services/StatsService.cs`, `Backend/Program.cs`
  - Objetivo tecnico: diminuir metodos com responsabilidade demais sem mudar rotas nem payloads.
  - Criterio de conclusao: regras criticas de stats ficam concentradas em service dedicado e o controller preserva os mesmos endpoints e payloads.
  - Testes associados: build do backend e validacao manual das telas de estatisticas.
  - Status: concluido
  - Bonus por testes: 0
  - Pontuacao obtida: 8

- [x] P2-02 - Consolidar adapters de resposta frontend
  - Prioridade: P2
  - Pontos base: 8
  - Risco: baixo
  - Arquivos afetados: `Frontend/src/services/api/adapters.ts`, `Frontend/src/services/api/adapters.test.ts`, `Frontend/src/services/api/api-dashboard.ts`, `Frontend/src/services/api/api-barbershop.ts`, `Frontend/src/pages/manager/ManagerBarbers.tsx`, `Frontend/src/pages/manager/ManagerStats.tsx`, `Frontend/src/pages/client/BookAppointment.tsx`
  - Objetivo tecnico: centralizar mapeamentos de casing e defaults para reduzir divergencia entre telas.
  - Criterio de conclusao: normalizacoes de barbearia, barbeiros e stats passam a sair da camada de API e deixam de se repetir nas paginas principais afetadas.
  - Testes associados: `Frontend/src/services/api/adapters.test.ts` e `npm test -- --run`.
  - Status: concluido
  - Bonus por testes: 2
  - Pontuacao obtida: 10

- [x] P2-03 - Remover leituras diretas de localStorage fora do contexto
  - Prioridade: P2
  - Pontos base: 8
  - Risco: baixo
  - Arquivos afetados: `Frontend/src/contexts/auth-helpers.ts`, `Frontend/src/contexts/auth-helpers.test.ts`, `Frontend/src/pages/manager/ManagerSettings.tsx`
  - Objetivo tecnico: reduzir acoplamento de sessao com storage e melhorar testabilidade.
  - Criterio de conclusao: a tela de configuracao do gerente deixa de acessar `localStorage` diretamente e usa o estado autenticado central com helper dedicado para `BarbeariaId`.
  - Testes associados: `Frontend/src/contexts/auth-helpers.test.ts` e `npm test -- --run`.
  - Status: concluido
  - Bonus por testes: 2
  - Pontuacao obtida: 10

- [x] P2-04 - Reduzir queries repetidas/N+1 em listagens e stats
  - Prioridade: P2
  - Pontos base: 8
  - Risco: medio
  - Arquivos afetados: `Backend/Services/StatsService.cs`, `Backend/Controllers/StatsController.cs`, `Backend/Controllers/BarbeariaController.cs`, `Frontend/src/services/api/api-barbershop.ts`
  - Objetivo tecnico: diminuir custo de consulta preservando o formato das respostas.
  - Criterio de conclusao: consultas mensais de stats deixam de rodar em loop por mes e a listagem de barbearias passa a aceitar barbeiros embarcados sem quebrar o fallback atual.
  - Testes associados: build do backend, `Frontend/src/services/api/adapters.test.ts` e `npm test -- --run`.
  - Status: concluido
  - Bonus por testes: 0
  - Pontuacao obtida: 8

- [x] P3-01 - Modularizar paginas React grandes
  - Prioridade: P3
  - Pontos base: 5
  - Risco: medio
  - Arquivos afetados: `Frontend/src/pages/manager/ManagerStats.tsx`, `Frontend/src/pages/manager/ManagerBarbers.tsx`, `Frontend/src/pages/manager/ManagerStatsPage.tsx`, `Frontend/src/pages/manager/ManagerBarbersPage.tsx`, `Frontend/src/pages/manager/components/ManagerStatsSections.tsx`, `Frontend/src/pages/manager/components/ManagerBarbersSections.tsx`
  - Objetivo tecnico: separar responsabilidade de UI, estado e side effects em blocos menores.
  - Criterio de conclusao: as rotas ativas do manager passam a depender de paginas menores e de componentes dedicados, preservando o fluxo visual e as chamadas existentes.
  - Testes associados: `Frontend/src/pages/manager/components/ManagerSections.test.tsx`, regressao de `npm test -- --run`.
  - Status: concluido
  - Bonus por testes: 2
  - Pontuacao obtida: 7

- [x] P3-02 - Limpar placeholders/dead code/dependencias nao usadas
  - Prioridade: P3
  - Pontos base: 5
  - Risco: baixo
  - Arquivos afetados: `Frontend/src/services/api.ts`, `Frontend/src/services/api/api-barbershop-client.ts`, `Frontend/src/pages/barber/BarberDashboard.test.tsx`, `Frontend/src/pages/manager/ManagerStats.tsx`, `Frontend/src/pages/manager/ManagerBarbers.tsx`
  - Objetivo tecnico: reduzir ruido sem remover comportamento ainda necessario.
  - Criterio de conclusao: o fluxo ativo deixa de depender de modulos legados mais ruidosos, os testes quebrados relacionados ao relogio local sao estabilizados e a limpeza ocorre sem impacto funcional.
  - Testes associados: `Frontend/src/pages/barber/BarberDashboard.test.tsx`, `npm test -- --run`, `dotnet build Backend\\BarbeariaSaaS.csproj`.
  - Status: concluido
  - Bonus por testes: 3
  - Pontuacao obtida: 8

## 5. Execucao por prioridade

### Prioridade P1

- O que foi feito:
  - Configuracao sensivel saiu do arquivo rastreado e o backend passou a aceitar `appsettings.Local.json` como override local opcional.
  - Claims de usuario autenticado foram centralizadas em extensoes do backend e o mapeamento de login e status foi consolidado em helpers reutilizaveis no frontend.
  - A suite de testes frontend da etapa foi corrigida para refletir o contrato real atual do contexto e dos componentes.
  - Datas e horarios passaram a usar helpers explicitamente centralizados nos hotspots mais sensiveis da P1.
- O que nao foi feito:
  - Nao houve mudanca de contrato de API, migracao de stack, alteracao de payload ou reescrita ampla de controllers.
  - Nao foi iniciada a P2.
- Riscos encontrados:
  - Timezone continua sendo uma area sensivel e exige validacao manual no ambiente deployed.
  - O backend ainda possui warnings de nulabilidade pre-existentes.
  - O build sinaliza warning de vulnerabilidade moderada no pacote `System.IdentityModel.Tokens.Jwt` 7.0.3, sem alteracao de versao nesta fase para evitar impacto funcional.
- Testes rodados:
  - `npm test -- --run` em `Frontend`
  - `dotnet build Backend\\BarbeariaSaaS.csproj`
- Evidencias:
  - 5 arquivos de teste passaram no frontend, com 16 testes aprovados.
  - O build do backend concluiu com sucesso.
- Pendencias para validacao manual:
  - Login e redirecionamento por role.
  - Agendamento, reagendamento e cancelamento.
  - Manager settings e geracao de horarios.
  - Dashboard e agenda do barbeiro.
  - Conferencia de horario real no ambiente deployed.

### Prioridade P2

- O que foi feito:
  - `StatsController` passou a delegar o calculo de estatisticas para `IStatsService`/`StatsService`, preservando os endpoints existentes.
  - A camada de API do frontend ganhou adapters centralizados para normalizar barbearias, barbeiros do manager e stats do manager.
  - `ManagerSettings` deixou de ler `localStorage` diretamente e passou a usar `useAuth` com helper de `BarbeariaId`.
  - `GetBarbearias` passou a embarcar barbeiros na resposta e `getBarbershopsWithDetails` reaproveita esse payload para evitar chamadas extras quando o backend atualizado estiver em uso.
  - O calculo de performance mensal do manager foi consolidado em consulta unica por janela, com `AsNoTracking` nos hotspots principais.
- O que nao foi feito:
  - Nao houve mudanca de rotas, contratos de API ou reescrita ampla das paginas grandes do frontend.
  - A limpeza cosmetica completa de blocos legados ficou fora do escopo desta prioridade e permanece para P3.
- Riscos encontrados:
  - A extracao do fluxo de stats preservou um bloco legado comentado no controller como referencia temporaria de rollback; o comportamento em runtime ja depende do service novo.
  - O backend continua com warning conhecido `NU1902` do pacote `System.IdentityModel.Tokens.Jwt` 7.0.3, sem troca de versao nesta fase para evitar alterar comportamento.
  - Os testes de dashboard com Recharts continuam emitindo warning visual de largura/altura zero no ambiente de teste, sem falha funcional.
- Testes rodados:
  - `npm test -- --run` em `Frontend`
  - `dotnet build Backend\\BarbeariaSaaS.csproj`
- Evidencias:
  - 7 arquivos de teste passaram no frontend, com 25 testes aprovados.
  - O build do backend concluiu com sucesso apos a extracao de stats e os ajustes de listagem.
  - A busca por `localStorage` em `Frontend/src` confirmou que a leitura direta do usuario ficou restrita aos pontos centrais (`AuthContext`, `httpClient` e `ThemeContext`).
- Pendencias para validacao manual:
  - Dashboard de estatisticas do gerente por periodo.
  - Lista de barbeiros do gerente e seus cards.
  - Manager settings salvando configuracao usando o usuario do contexto.
  - Listagem de barbearias e fluxo de booking continuando compativeis com payload antigo e com barbeiros embarcados.

### Prioridade P3

- O que foi feito:
  - As rotas ativas `manager/stats` e `manager/barbers` passaram a usar paginas novas e menores, focadas apenas em estado/efeitos e compostas por componentes dedicados de UI.
  - Os blocos visuais grandes foram extraidos para `ManagerStatsSections` e `ManagerBarbersSections`, mantendo a mesma estrutura visual e os mesmos dados exibidos.
  - O fluxo ativo da API de barbearias foi apontado para `api-barbershop-client.ts`, removendo do caminho principal um modulo com blocos legados comentados.
  - Foi adicionada cobertura unitario/regressiva para os componentes novos do manager e o teste de `BarberDashboard` foi corrigido para usar a mesma referencia de data local da tela.
- O que nao foi feito:
  - Os arquivos legados antigos (`ManagerStats.tsx`, `ManagerBarbers.tsx` e `api-barbershop.ts`) foram preservados no repositorio como referencia segura de rollback e nao foram removidos fisicamente nesta etapa.
  - Nao houve alteracao de payload, endpoint, query ou regra de negocio do backend nesta prioridade.
- Riscos encontrados:
  - Os arquivos legados ainda existem fora do fluxo ativo, entao uma limpeza fisica final deles deve acontecer so depois da validacao manual da P3.
  - O backend continua com warnings conhecidos de nulabilidade e do pacote `System.IdentityModel.Tokens.Jwt`, fora do escopo desta etapa.
- Testes rodados:
  - `npm test -- --run` em `Frontend`
  - `npm run build` em `Frontend`
  - `dotnet build Backend\\BarbeariaSaaS.csproj`
- Evidencias:
  - 8 arquivos de teste passaram no frontend, com 28 testes aprovados.
  - O build de producao do frontend concluiu com sucesso apos a troca para as paginas novas e wrappers de compatibilidade.
  - A cobertura nova de `ManagerSections.test.tsx` validou os blocos extraidos do manager.
  - O teste `BarberDashboard.test.tsx` voltou a ficar verde com a mesma regra de data local usada pela tela.
  - Os entrypoints `ManagerStats.tsx` e `ManagerBarbers.tsx` agora reexportam as paginas novas, e o fluxo ativo da API usa `api-barbershop-client`.
- Pendencias para validacao manual:
  - Abrir `manager/stats` e alternar os periodos para conferir cards, listas e indicadores.
  - Abrir `manager/barbers`, testar busca, contadores e lista.
  - Confirmar que os fluxos do manager continuam iguais no deploy apos a troca para as paginas novas.

## 6. Testes e cobertura de protecao

### Testes unitarios

- `Frontend/src/contexts/auth-helpers.test.ts`
- `Frontend/src/services/api/adapters.test.ts`
- `Frontend/src/utils/appointmentStatus.test.ts`
- `Frontend/src/pages/manager/components/ManagerSections.test.tsx`

### Testes de integracao

- Nao ha suite dedicada de integracao no repositorio para os endpoints alterados.
- Nesta prioridade, a protecao de integridade ficou em `dotnet build Backend\\BarbeariaSaaS.csproj`, na preservacao de contratos nos controllers e na validacao manual dirigida das telas manager/listagens.

### Testes end-to-end

- Nao adicionados nesta fase.
- Permanecem recomendados para login por role, cadastro, agendamento, reagendamento, cancelamento, manager settings, estatisticas do gerente e agenda do barbeiro.

### Testes de regressao

- `Frontend/src/pages/barber/BarberDashboard.test.tsx`
- `Frontend/src/pages/barber/BarberSchedule.test.tsx`
- `Frontend/src/pages/client/BookAppointment.test.tsx`
- Componentes extraidos do manager validados em `Frontend/src/pages/manager/components/ManagerSections.test.tsx`
- Normalizacao de payloads `PascalCase` e `camelCase` em `Frontend/src/services/api/adapters.test.ts`
- Consumo de `BarbeariaId` autenticado via helper em `Frontend/src/contexts/auth-helpers.test.ts`
- Filtro de data local do dashboard do barbeiro estabilizado em `Frontend/src/pages/barber/BarberDashboard.test.tsx`

### Testes criticos de deploy/config/auth/timezone/banco

- Build do backend validado apos a extracao de stats e a reducao de consultas redundantes.
- Validacao manual pendente para:
  - `DATABASE_URL` e `Jwt:Key` no ambiente deployed
  - CORS com frontend em deploy
  - fuso horario real em agendamentos e estatisticas
  - conexao com banco Neon

## 7. Checkpoint manual por prioridade

### Checkpoint de validacao manual - P1

- Resumo das mudancas:
  - Configuracao local e segredo rastreado foram segregados.
  - Helpers de auth, claims e status foram centralizados.
  - Testes quebrados da suite frontend foram corrigidos e estabilizados.
  - Hotspots de data e UTC passaram a usar helpers centralizados.
- O que eu preciso testar manualmente no sistema deployed:
  - Login e redirecionamento correto para cliente, barbeiro e gerente.
  - Cadastro e autenticacao continuando com o mesmo comportamento atual.
  - Criacao, reagendamento e cancelamento de agendamento.
  - Bloqueio de horarios passados ou ocupados.
  - Dashboard do barbeiro e agenda com status corretos.
  - Manager settings salvando configuracao e gerando horarios.
  - Horarios mostrados no frontend batendo com o horario esperado da operacao.
- Riscos especificos a observar:
  - Divergencia de timezone entre frontend, API e banco.
  - Ambiente deployed sem variaveis corretas de `DATABASE_URL`, `Jwt:Key` ou CORS.
  - Qualquer fluxo dependente de claim de usuario ou `BarbeariaId`.
- Status da pontuacao:
  - Pontuacao maxima esperada: 60
  - Pontuacao obtida: 60
  - Percentual: 100%
- Recomendacao: validar manualmente a P1 antes de seguir para a P2.

### Checkpoint de validacao manual - P2

- Resumo das mudancas:
  - A logica principal de stats saiu do `StatsController` e foi concentrada em `StatsService`.
  - O frontend passou a normalizar payloads de manager/barbearia na camada de API, reduzindo regras espalhadas nas paginas.
  - `ManagerSettings` passou a depender do contexto de autenticacao para resolver `BarbeariaId`, sem leitura direta de `localStorage`.
  - A listagem de barbearias e a consulta de stats foram otimizadas para reduzir chamadas redundantes e custo de consulta.
- O que eu preciso testar manualmente no sistema deployed:
  - Abrir estatisticas do gerente e alternar entre semana, mes, trimestre e ano.
  - Abrir a tela de barbeiros do gerente e conferir lista, contadores e dados agregados.
  - Salvar configuracoes em manager settings e confirmar que a tela continua funcionando com o mesmo usuario logado.
  - Navegar em barbearias do cliente e confirmar que a lista de barbeiros continua aparecendo corretamente antes do agendamento.
- Riscos especificos a observar:
  - Divergencia entre payload novo com barbeiros embarcados e fallback antigo em ambientes com deploy misto de frontend/backend.
  - Qualquer diferenca visual ou de totalizacao nas telas de stats do gerente.
  - Fluxos manager que dependem de `BarbeariaId` do usuario autenticado.
- Status da pontuacao:
  - Pontuacao maxima esperada: 36
  - Pontuacao obtida: 36
  - Percentual: 100%
- Recomendacao: validar manualmente a P2 antes de seguir para a P3.

### Checkpoint de validacao manual - P3

- Resumo das mudancas:
  - As telas `manager/stats` e `manager/barbers` passaram a usar paginas novas e menores, compostas por componentes de UI dedicados.
  - O fluxo ativo de barbearias no frontend passou a usar um modulo limpo (`api-barbershop-client.ts`) sem blocos legados comentados.
  - A suite ganhou cobertura para os componentes novos do manager e uma correcao no teste de dashboard do barbeiro para alinhar o filtro de hoje com a data local real.
- O que eu preciso testar manualmente no sistema deployed:
  - Abrir `manager/stats` e alternar entre semana, mes, trimestre e ano.
  - Confirmar cards, listas de top barbeiros, servicos populares, meta mensal e metricas.
  - Abrir `manager/barbers`, usar a busca e conferir se lista, chips, datas e contadores continuam corretos.
  - Confirmar que o botao de adicionar barbeiro continua com o mesmo comportamento atual do sistema.
- Riscos especificos a observar:
  - Qualquer diferenca visual entre as paginas novas e o comportamento atual aceito.
  - Possivel confusao futura caso alguem volte a importar os arquivos legados antigos em vez das paginas novas.
- Warnings ja conhecidos de Recharts em ambiente de teste nao afetam o deploy, mas continuam aparecendo na suite.
- O build do frontend ainda alerta sobre chunk principal acima de 500 kB, sem bloquear a compilacao nem alterar o comportamento atual.
- Status da pontuacao:
  - Pontuacao maxima esperada: 15
  - Pontuacao obtida: 15
  - Percentual: 100%
- Recomendacao: validar manualmente a P3 antes de remover fisicamente os arquivos legados fora do fluxo ativo.

## 8. Placar geral

| Prioridade | Pontos maximos | Pontos obtidos | Percentual | Status |
| --- | ---: | ---: | ---: | --- |
| P1 | 60 | 60 | 100% | concluido com ressalvas |
| P2 | 36 | 36 | 100% | concluido com ressalvas |
| P3 | 15 | 15 | 100% | concluido com ressalvas |

## 9. Log de execucao

- Backlog inicial convertido em checklist rastreavel com prioridade, risco, criterio de conclusao e testes associados.
- `Backend/appsettings.json` foi sanitizado e `Backend/appsettings.Local.example.json` foi criado para orientar override local sem segredo rastreado.
- `Backend/Program.cs` passou a carregar `appsettings.Local.json` como arquivo opcional.
- Helpers de claims foram centralizados em `Backend/Extensions/ClaimsPrincipalExtensions.cs`.
- Helpers de auth e status foram centralizados em `Frontend/src/contexts/auth-helpers.ts` e `Frontend/src/utils/appointmentStatus.ts`.
- `Frontend/src/contexts/AuthContext.tsx` deixou de repetir o mesmo mapeamento de usuario autenticado em varios fluxos.
- `Backend/Services/AppDateTime.cs` foi criado para concentrar normalizacao de datas e UTC.
- Hotspots de agendamento, horario e stats foram ajustados para usar os novos helpers sem alterar contrato externo.
- `Frontend/src/setupTests.ts` recebeu suporte de ambiente para os testes atuais.
- `Frontend/src/pages/barber/BarberDashboard.test.tsx` e `Frontend/src/pages/barber/BarberSchedule.test.tsx` foram corrigidos para refletir o comportamento real atual.
- Novos testes unitarios foram adicionados para helpers de auth e status.
- `npm test -- --run` passou com 16 testes aprovados.
- `dotnet build Backend\\BarbeariaSaaS.csproj` concluiu com sucesso e manteve warnings conhecidos fora do escopo da P1.
- Hipotese controlada desta fase: a extracao incremental de helpers e a sanitizacao de configuracao preservam o comportamento externo, mas timezone e ambiente deployed precisam de validacao manual antes de avancar.
- Hotfix aplicado na geracao de horarios para voltar a respeitar `workDays`, `openTime`, `closeTime` e o fuso da operacao em horario Brasil.
- `Backend/Services/HorarioGenerationPlanner.cs` foi adicionado para concentrar a regra pura da geracao de slots sem mudar o contrato da API.
- `Backend/Services/AppDateTime.cs`, `Backend/Services/HorarioService.cs`, `Backend/Controllers/HorarioController.cs` e `Backend/Controllers/AgendamentoController.cs` foram ajustados para tratar periodo local da barbearia e conversao correta para UTC.
- `Validation/HorarioGenerationValidation.csproj` e `Validation/Program.cs` foram adicionados para validar workDays, bloqueio de dias desabilitados, open/close, intervalo, timezone, nao geracao de horarios passados e consistencia dashboard/backend.
- `dotnet run --project Validation\\HorarioGenerationValidation.csproj` passou com todos os cenarios de validacao da geracao de horarios.
- Diagnostico adicional no banco real mostrou que a barbearia 1 estava com configuracao correta e barbeiros vinculados, mas com `0` slots futuros gravados.
- O problema real observado em producao foi a separacao entre salvar a configuracao da barbearia e disparar a geracao em uma segunda chamada, permitindo sucesso parcial sem slots novos.
- `Backend/Controllers/BarbeariaController.cs` passou a regenerar horarios no mesmo fluxo de `UpdateBarbearia` quando `workDays`, `openTime` ou `closeTime` mudam.
- `dotnet run --project Validation\\HorarioGenerationValidation.csproj -- inspect-barbershop 1` confirmou slots futuros gravados em formato Brasil para a barbearia afetada.
- `Frontend/src/utils/brazilDateTime.ts` foi adicionado para converter `dataHora` UTC para calendario e horario Brasil no frontend.
- `Frontend/src/pages/client/BookAppointment.tsx` e `Frontend/src/services/api/api-appointments.ts` deixaram de interpretar `dataHora` por `split('T')` e passaram a usar conversao explicita para `America/Sao_Paulo`.
- `npm test -- --run` voltou a passar com 18 testes aprovados, incluindo cobertura nova para conversao UTC -> Brasil.
- `Backend/Services/StatsService.cs` foi criado para concentrar regras de stats de barbeiro e gerente sem alterar rotas nem payloads publicos.
- `Backend/Controllers/StatsController.cs` passou a validar existencia e delegar o calculo ao service novo, preservando os endpoints existentes.
- `Backend/Program.cs` passou a registrar `IStatsService` na injecao de dependencia.
- `Backend/Controllers/BarbeariaController.cs` passou a expor barbeiros embarcados na listagem de barbearias para evitar chamadas extras no frontend atualizado.
- `Frontend/src/services/api/adapters.ts` foi criado para centralizar normalizacao de barbearia, barbearias com barbeiros, barbeiros do gerente e stats do gerente.
- `Frontend/src/services/api/api-dashboard.ts` e `Frontend/src/services/api/api-barbershop.ts` passaram a devolver payloads normalizados para as telas consumidoras.
- `Frontend/src/pages/manager/ManagerBarbers.tsx`, `Frontend/src/pages/manager/ManagerStats.tsx` e `Frontend/src/pages/client/BookAppointment.tsx` deixaram de repetir mapeamentos locais de casing e defaults.
- `Frontend/src/pages/manager/ManagerSettings.tsx` passou a resolver `BarbeariaId` via `useAuth` + `requireUserBarbershopId`, sem leitura direta de `localStorage`.
- `Frontend/src/services/api/adapters.test.ts` foi adicionado para validar a normalizacao dos payloads centrais da P2.
- `Frontend/src/contexts/auth-helpers.test.ts` ganhou cobertura para `getUserBarbershopId` e `requireUserBarbershopId`.
- `npm test -- --run` passou com 24 testes aprovados apos as mudancas da P2.
- Hotfix aplicado apos a P2 para a tela `manager/stats`: o adapter de estatisticas passou a aceitar o JSON `camelCase` serializado pelo ASP.NET Core, preservando compatibilidade com `PascalCase`.
- `Frontend/src/services/api/adapters.test.ts` ganhou cobertura para a resposta `camelCase` real da API de estatisticas.
- `npm test -- --run` passou com 25 testes aprovados apos a correcao do adapter de estatisticas.
- `dotnet build Backend\\BarbeariaSaaS.csproj` concluiu com sucesso apos a extracao de stats e a reducao das consultas redundantes.
- Risco residual controlado da P2: o projeto ainda nao possui suite dedicada de integracao para stats/listagens e o warning `NU1902` permanece fora do escopo desta etapa.
- `Frontend/src/pages/manager/ManagerStatsPage.tsx` e `Frontend/src/pages/manager/ManagerBarbersPage.tsx` foram criadas como paginas menores para o manager, mantendo o mesmo fluxo das rotas existentes.
- `Frontend/src/pages/manager/components/ManagerStatsSections.tsx` e `Frontend/src/pages/manager/components/ManagerBarbersSections.tsx` passaram a concentrar os blocos visuais grandes dessas telas.
- `Frontend/src/pages/manager/ManagerStats.tsx` e `Frontend/src/pages/manager/ManagerBarbers.tsx` passaram a reexportar as paginas novas, preservando compatibilidade com os imports antigos.
- `Frontend/src/services/api/api-barbershop-client.ts` passou a ser o modulo ativo da API de barbearias no frontend, reduzindo ruido do caminho principal sem mexer no contrato.
- `Frontend/src/pages/manager/components/ManagerSections.test.tsx` foi adicionado para proteger os componentes extraidos do manager.
- `Frontend/src/pages/barber/BarberDashboard.test.tsx` foi corrigido para usar o mesmo calendario local da tela no filtro de agendamentos de hoje.
- `npm test -- --run` passou com 28 testes aprovados apos a modularizacao segura da P3.
- `npm run build` do frontend passou apos a modularizacao segura da P3, com warning nao bloqueante de chunk grande.
- Follow-up pos-P3: o caminho publico de `BarbershopAPI` foi unificado novamente em `Frontend/src/services/api/api-barbershop.ts`, que agora reexporta a implementacao limpa de `api-barbershop-client.ts`.
- Follow-up pos-P3: `Frontend/src/services/api.ts` voltou a consumir o caminho tradicional `api-barbershop`, reduzindo duplicacao interna sem alterar comportamento.
- Follow-up pos-P3: `Frontend/src/App.tsx` passou a apontar diretamente para `ManagerStatsPage.tsx` e `ManagerBarbersPage.tsx`, retirando do fluxo ativo os wrappers legados do manager sem alterar as rotas.
- Follow-up pos-P3: `Frontend/src/services/api.ts` voltou a consumir diretamente `api-barbershop-client.ts`, deixando `api-barbershop.ts` apenas como ponto de compatibilidade legado fora do fluxo principal.
- Validacao do follow-up pos-P3: `npm test -- --run` permaneceu verde com 28 testes aprovados apos a retirada dos wrappers do fluxo ativo.
- Validacao do follow-up pos-P3: `npm run build` continuou concluindo com sucesso, mantendo apenas o warning conhecido de chunk grande.
- Follow-up pos-P3: `Frontend/src/pages/manager/ManagerStats.tsx`, `Frontend/src/pages/manager/ManagerBarbers.tsx` e `Frontend/src/services/api/api-barbershop.ts` foram reduzidos fisicamente a wrappers minimos de compatibilidade.
- Validacao final do follow-up pos-P3: `npm test -- --run` e `npm run build` continuaram verdes apos a limpeza fisica dos wrappers legados.
- Follow-up de performance: o bootstrap do backend deixou de fazer `CanConnect()` + `Migrate()` + `EnsureCreated()` em toda subida, reduzindo round-trips e custo de boot quando o banco esta frio.
- Follow-up de performance: `Backend/Services/DatabaseStartupInitializer.cs` e `Backend/Configuration/DatabaseStartupOptions.cs` foram adicionados para tornar a inicializacao do banco configuravel por ambiente.
- Follow-up de performance: em desenvolvimento, a aplicacao continua favorecendo auto-migracao e fallback local; fora de desenvolvimento, a subida passa a evitar migracao automatica por padrao.
- Follow-up de performance: o comando `migrate-db` foi adicionado ao backend para permitir execucao explicita de migracoes sem recolocar esse custo no startup normal da aplicacao.
