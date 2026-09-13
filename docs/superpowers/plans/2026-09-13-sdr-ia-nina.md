# SDR IA Nina — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o sistema completo e determinístico do SDR IA Nina em Node.js/TypeScript, incluindo banco Supabase, motor de regras das 6 alavancas, cérebro Claude Haiku com Tool Calling, canais de mensageria (Meta Cloud API, ElevenLabs, E-mail, SMS) e painel operacional em tempo real.

**Architecture:** Backend desacoplado em serviços com TypeScript estrito, onde regras de negócio temporais são agendadas em fila/banco determinístico, enquanto interações conversacionais e injeções de cases são delegadas ao Claude Haiku com Tool Calling seguro. Webhooks processam entradas do formulário e do WhatsApp, e um dashboard acompanha métricas de show rate e conversas em tempo real.

**Tech Stack:** Node.js (v24), TypeScript, Express/Fastify, Supabase JS / PostgreSQL, Anthropic SDK (Claude Haiku), Meta WhatsApp Cloud API, ElevenLabs API, Vitest para testes automatizados.

**Spec:** [docs/superpowers/specs/2026-09-13-sdr-ia-nina-design.md](../specs/2026-09-13-sdr-ia-nina-design.md)

## Global Constraints

- TypeScript estrito (`strict: true`) sem `any` implícito.
- Decisões temporais e horários de disparo são controlados pelo motor de regras determinístico (`rulesEngine`), nunca inventados pelo LLM.
- O prompt do sistema do Claude Haiku deve seguir rigorosamente as regras inegociáveis e limites especificados na Seção 4 do case da Nina.
- Cada tarefa deve incluir testes automatizados correspondentes com cobertura de comportamento.

---

### Task 1: Setup do Projeto TypeScript, Configurações e Cliente de Banco

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `src/config/index.ts`
- Create: `src/types/index.ts`
- Create: `src/database/supabase.ts`
- Create: `tests/config.test.ts`
- Create: `tests/database.test.ts`

**Interfaces:**
- Produces: `config` exportando variáveis de ambiente validadas.
- Produces: Tipos (`Lead`, `Closer`, `Agendamento`, `CaseSucesso`, `Interacao`, `FilaRegra`).
- Produces: `getDbClient()` cliente tipado com suporte a fallback mock para testes.

- [ ] **Step 1: Criar package.json e tsconfig.json com dependências de produção e teste**
- [ ] **Step 2: Escrever teste falhando para validação de configurações de ambiente**
- [ ] **Step 3: Implementar src/config/index.ts e src/types/index.ts**
- [ ] **Step 4: Executar testes de configuração e verificar aprovação**
- [ ] **Step 5: Implementar cliente de banco e camada de repositório em src/database/supabase.ts com mock para testes**
- [ ] **Step 6: Executar testes do banco e garantir aprovação**
- [ ] **Step 7: Commit das configurações e fundação**

---

### Task 2: Repositórios e Serviços de Dados (Leads, Agendamentos e Cases de Sucesso)

**Files:**
- Create: `src/services/leadService.ts`
- Create: `src/services/bookingService.ts`
- Create: `src/services/knowledgeService.ts`
- Create: `tests/leadService.test.ts`
- Create: `tests/bookingService.test.ts`
- Create: `tests/knowledgeService.test.ts`

**Interfaces:**
- Consumes: `getDbClient()`, `Lead`, `Agendamento`, `Closer`, `CaseSucesso`
- Produces: `leadService.upsertLead(data)`, `leadService.getLeadById(id)`, `leadService.updateStatus(id, status)`
- Produces: `bookingService.createBooking(data)`, `bookingService.getBookingDetails(id)`, `bookingService.confirmBooking(id)`
- Produces: `knowledgeService.getCaseBySegment(segment)`

- [ ] **Step 1: Escrever testes falhando para leadService (criação, busca e atualização de status)**
- [ ] **Step 2: Implementar src/services/leadService.ts**
- [ ] **Step 3: Rodar testes do leadService e validar sucesso**
- [ ] **Step 4: Escrever testes falhando para bookingService e knowledgeService**
- [ ] **Step 5: Implementar src/services/bookingService.ts e src/services/knowledgeService.ts**
- [ ] **Step 6: Rodar todos os testes de serviço de dados e validar sucesso**
- [ ] **Step 7: Commit da camada de serviços de dados**

---

### Task 3: Motor de Regras Determinístico das 6 Alavancas (Rules Engine & Scheduler)

**Files:**
- Create: `src/services/rulesEngine.ts`
- Create: `src/services/queueService.ts`
- Create: `tests/rulesEngine.test.ts`

**Interfaces:**
- Consumes: `leadService`, `bookingService`, `FilaRegra`
- Produces: `rulesEngine.scheduleMeetingRules(agendamentoId, meetingTime)`
- Produces: `rulesEngine.handleFormAbandonment(leadId)`
- Produces: `rulesEngine.processPendingQueue(currentTime)`
- Produces: `rulesEngine.checkSilenceRadar()`

- [ ] **Step 1: Escrever teste falhando para o agendamento das 6 alavancas (1h antes, 5min antes, confirmação imediata)**
- [ ] **Step 2: Escrever teste falhando para detecção do radar do silêncio e recuperação de abandono**
- [ ] **Step 3: Implementar src/services/queueService.ts e src/services/rulesEngine.ts**
- [ ] **Step 4: Executar testes de rulesEngine e verificar aprovação**
- [ ] **Step 5: Commit do motor de regras**

---

### Task 4: Cérebro de IA da Nina (Claude Haiku + Tool Calling)

**Files:**
- Create: `src/ai/prompt.ts`
- Create: `src/ai/tools.ts`
- Create: `src/ai/ninaAgent.ts`
- Create: `tests/ninaAgent.test.ts`

**Interfaces:**
- Consumes: `rulesEngine`, `leadService`, `bookingService`, `knowledgeService`
- Produces: `ninaAgent.generateResponse({ leadId, userMessage, canal })`
- Produces: `ninaAgent.generateOutboundMessage({ leadId, tipoRegra })`

- [ ] **Step 1: Escrever teste falhando para o agente Nina validando respostas de confirmação e execução de tools**
- [ ] **Step 2: Implementar src/ai/prompt.ts com a identidade exata do case Nina**
- [ ] **Step 3: Implementar src/ai/tools.ts mapeando as funções reais do sistema para o formato Claude Anthropic Tool Calling**
- [ ] **Step 4: Implementar src/ai/ninaAgent.ts orquestrando chamadas ao Claude Haiku e execução de tools**
- [ ] **Step 5: Executar testes do ninaAgent e verificar aprovação**
- [ ] **Step 6: Commit do módulo de IA**

---

### Task 5: Adaptadores de Mensageria e Síntese de Voz (WhatsApp, ElevenLabs, E-mail, SMS)

**Files:**
- Create: `src/channels/whatsappMeta.ts`
- Create: `src/channels/elevenlabsVoice.ts`
- Create: `src/channels/emailSender.ts`
- Create: `src/channels/smsSender.ts`
- Create: `src/channels/channelDispatcher.ts`
- Create: `tests/channels.test.ts`

**Interfaces:**
- Consumes: `config`
- Produces: `channelDispatcher.dispatch({ canal, destinatario, mensagem, audioUrl, metadata })`

- [ ] **Step 1: Escrever testes falhando para o despachador multicanal**
- [ ] **Step 2: Implementar adaptadores Meta Cloud API (WhatsApp), ElevenLabs (áudio TTS), E-mail e SMS**
- [ ] **Step 3: Implementar src/channels/channelDispatcher.ts unificando os canais com fallback e registro de log**
- [ ] **Step 4: Executar testes de canais e verificar aprovação**
- [ ] **Step 5: Commit dos adaptadores de mensageria**

---

### Task 6: Servidor Web, Webhooks e Endpoints de Ingestão

**Files:**
- Create: `src/server.ts`
- Create: `src/routes/webhookRoutes.ts`
- Create: `src/routes/dashboardRoutes.ts`
- Create: `tests/webhooks.test.ts`

**Interfaces:**
- Produces: `POST /api/webhooks/typeform` (captura de lead e agendamento)
- Produces: `POST /api/webhooks/meta-whatsapp` (recebimento de mensagens e status)
- Produces: `POST /api/scheduler/tick` (gatilho de processamento da fila)
- Produces: `GET /api/dashboard/metrics` (métricas de show rate e no-show)
- Produces: `GET /api/dashboard/conversations` (histórico de conversas da Nina)

- [ ] **Step 1: Escrever testes falhando para endpoints de webhook**
- [ ] **Step 2: Implementar rotas e validações em src/routes/webhookRoutes.ts e src/routes/dashboardRoutes.ts**
- [ ] **Step 3: Implementar src/server.ts integrando middlewares e rotas**
- [ ] **Step 4: Executar testes de ponta a ponta dos webhooks e servidor**
- [ ] **Step 5: Commit do servidor web e webhooks**

---

### Task 7: Dashboard Operacional em Tempo Real e Interface Web

**Files:**
- Create: `src/public/index.html`
- Create: `src/public/styles.css`
- Create: `src/public/app.js`
- Create: `tests/dashboard.test.ts`

**Interfaces:**
- Consumes: `GET /api/dashboard/metrics`, `GET /api/dashboard/conversations`
- Produces: UI moderna e interativa com visualização de leads, métricas de show rate, histórico de mensagens da Nina e simulação de teste rápido.

- [ ] **Step 1: Criar testes para os endpoints do painel operacional**
- [ ] **Step 2: Desenvolver interface web moderna (HTML5, CSS Vanilla moderno com tema dark/glassmorphism, gráficos de show rate e chat feed)**
- [ ] **Step 3: Implementar interatividade e polling em tempo real no app.js**
- [ ] **Step 4: Validar funcionamento completo do painel**
- [ ] **Step 5: Commit do Dashboard**

---

### Task 8: Simulação Fim a Fim (E2E) e Validação das 6 Alavancas

**Files:**
- Create: `tests/e2eSimulation.test.ts`
- Create: `scripts/simulate-journey.ts`
- Update: `docs/ROADMAP_CONSTRUCAO.md`

**Interfaces:**
- Valida o ciclo de vida completo: Lead agenda no formulário -> Confirmação imediata (<2min) -> Pergunta com case de sucesso -> Lembrete 1h -> Cerco multicanal 5min -> Registro completo no Supabase.

- [ ] **Step 1: Implementar script de simulação da jornada do lead (`scripts/simulate-journey.ts`)**
- [ ] **Step 2: Escrever teste E2E automatizado para validar as 6 alavancas em conjunto**
- [ ] **Step 3: Executar simulação completa e documentar resultados**
- [ ] **Step 4: Atualizar walkthrough e checklist de entrega**
