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
  - P2 = 32 pontos
  - P3 = 10 pontos
- Pontuacao obtida:
  - P1 = 60 pontos
  - P2 = 0 pontos
  - P3 = 0 pontos
- Percentual de conclusao atual:
  - P1 = 100%
  - P2 = 0%
  - P3 = 0%

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

- [ ] P2-01 - Extrair regras de controllers grandes para services
  - Prioridade: P2
  - Pontos base: 8
  - Risco: medio
  - Arquivos afetados: controllers grandes do backend e novos services de aplicacao
  - Objetivo tecnico: diminuir metodos com responsabilidade demais sem mudar rotas nem payloads.
  - Criterio de conclusao: regras criticas sao extraidas com equivalencia funcional e pontos de entrada permanecem estaveis.
  - Testes associados: integracao dos endpoints afetados.
  - Status: nao iniciado
  - Bonus por testes: 0
  - Pontuacao obtida: 0

- [ ] P2-02 - Consolidar adapters de resposta frontend
  - Prioridade: P2
  - Pontos base: 8
  - Risco: baixo
  - Arquivos afetados: `Frontend/src/services/api/*`, paginas com normalizacao local de payload
  - Objetivo tecnico: centralizar mapeamentos de casing e defaults para reduzir divergencia entre telas.
  - Criterio de conclusao: normalizacoes deixam de se repetir em multiplas paginas.
  - Testes associados: unitarios de adapter e regressao de dashboard e listagens.
  - Status: nao iniciado
  - Bonus por testes: 0
  - Pontuacao obtida: 0

- [ ] P2-03 - Remover leituras diretas de localStorage fora do contexto
  - Prioridade: P2
  - Pontos base: 8
  - Risco: baixo
  - Arquivos afetados: paginas e helpers que leem `localStorage` diretamente
  - Objetivo tecnico: reduzir acoplamento de sessao com storage e melhorar testabilidade.
  - Criterio de conclusao: telas passam a consumir estado autenticado por abstracao central.
  - Testes associados: unitarios do contexto e regressao de autenticacao.
  - Status: nao iniciado
  - Bonus por testes: 0
  - Pontuacao obtida: 0

- [ ] P2-04 - Reduzir queries repetidas/N+1 em listagens e stats
  - Prioridade: P2
  - Pontos base: 8
  - Risco: medio
  - Arquivos afetados: controllers e services de stats e listagens de barbearias
  - Objetivo tecnico: diminuir custo de consulta preservando o formato das respostas.
  - Criterio de conclusao: consultas redundantes relevantes sao consolidadas sem mudar o contrato externo.
  - Testes associados: integracao de stats e listagens, alem de validacoes de resultado.
  - Status: nao iniciado
  - Bonus por testes: 0
  - Pontuacao obtida: 0

- [ ] P3-01 - Modularizar paginas React grandes
  - Prioridade: P3
  - Pontos base: 5
  - Risco: medio
  - Arquivos afetados: paginas grandes do frontend
  - Objetivo tecnico: separar responsabilidade de UI, estado e side effects em blocos menores.
  - Criterio de conclusao: paginas selecionadas ficam menores sem alterar fluxo visual nem chamadas existentes.
  - Testes associados: regressao das telas moduladas.
  - Status: nao iniciado
  - Bonus por testes: 0
  - Pontuacao obtida: 0

- [ ] P3-02 - Limpar placeholders/dead code/dependencias nao usadas
  - Prioridade: P3
  - Pontos base: 5
  - Risco: baixo
  - Arquivos afetados: pontos com mocks fixos, codigo morto e dependencias potencialmente ociosas
  - Objetivo tecnico: reduzir ruido sem remover comportamento ainda necessario.
  - Criterio de conclusao: limpeza com evidencia de nao uso e sem impacto funcional.
  - Testes associados: build, testes existentes e revisao de importacoes.
  - Status: nao iniciado
  - Bonus por testes: 0
  - Pontuacao obtida: 0

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

- O que foi feito: nao iniciado
- O que nao foi feito: todos os itens
- Riscos encontrados: dependem da validacao manual da P1
- Testes rodados: nenhum nesta prioridade
- Evidencias: backlog preservado
- Pendencias para validacao manual: aguardar checkpoint da P1

### Prioridade P3

- O que foi feito: nao iniciado
- O que nao foi feito: todos os itens
- Riscos encontrados: dependem da validacao manual da P2
- Testes rodados: nenhum nesta prioridade
- Evidencias: backlog preservado
- Pendencias para validacao manual: aguardar checkpoint da P2

## 6. Testes e cobertura de protecao

### Testes unitarios

- `Frontend/src/contexts/auth-helpers.test.ts`
- `Frontend/src/utils/appointmentStatus.test.ts`

### Testes de integracao

- Nao adicionados nesta fase para evitar ampliar a superficie de mudanca antes da validacao da P1.
- Permanecem priorizados para auth, agendamento, dashboard e geracao de horarios nas proximas prioridades.

### Testes end-to-end

- Nao adicionados nesta fase.
- Permanecem recomendados para login por role, cadastro, agendamento, reagendamento, cancelamento, manager settings e agenda do barbeiro.

### Testes de regressao

- `Frontend/src/pages/barber/BarberDashboard.test.tsx`
- `Frontend/src/pages/barber/BarberSchedule.test.tsx`
- `Frontend/src/pages/client/BookAppointment.test.tsx`

### Testes criticos de deploy/config/auth/timezone/banco

- Build do backend validado apos mudancas de configuracao e datas.
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

- Resumo das mudancas: nao iniciado
- O que eu preciso testar manualmente no sistema deployed: aguardar checkpoint da P2
- Riscos especificos a observar: aguardar checkpoint da P2
- Status da pontuacao:
  - Pontuacao maxima esperada: 32
  - Pontuacao obtida: 0
  - Percentual: 0%
- Recomendacao: nao seguir antes da validacao da P1 e da execucao da P2.

### Checkpoint de validacao manual - P3

- Resumo das mudancas: nao iniciado
- O que eu preciso testar manualmente no sistema deployed: aguardar checkpoint da P3
- Riscos especificos a observar: aguardar checkpoint da P3
- Status da pontuacao:
  - Pontuacao maxima esperada: 10
  - Pontuacao obtida: 0
  - Percentual: 0%
- Recomendacao: nao seguir antes da validacao da P2 e da execucao da P3.

## 8. Placar geral

| Prioridade | Pontos maximos | Pontos obtidos | Percentual | Status |
| --- | ---: | ---: | ---: | --- |
| P1 | 60 | 60 | 100% | concluido com ressalvas |
| P2 | 32 | 0 | 0% | nao iniciado |
| P3 | 10 | 0 | 0% | nao iniciado |

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
