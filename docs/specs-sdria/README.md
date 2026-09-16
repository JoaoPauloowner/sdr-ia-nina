# Nina — Agente de Pré-Vendas Autônomo

Sistema de IA que substitui o time de pré-vendas humano na etapa entre "lead agendou reunião" e "lead compareceu à reunião", eliminando no-show através de comunicação multicanal automática, personalizada e com timing definido por regras de negócio.

Baseado no case público "Viver de IA" (redução de show rate de 21% para 40%+, corte de R$ 2M/mês em tráfego pago).

## Status
🚧 Em planejamento — este repositório contém a documentação base para desenvolvimento assistido por agente (Antigravity).

## Estrutura do projeto

```
.agents/
  agents.md            # Personas e regras de orquestração para o Antigravity
  rules/
    coding-style.md     # Padrões de código
    integrations.md     # Regras de integração com serviços externos
    testing.md           # Regras de teste e mock
  workflows/
    start_task.md         # Comando /start_task
    finalize_task.md      # Comando /finalize_task
    sync_main.md           # Comando /sync_main
    lint_and_test.md        # Comando /lint_and_test
docs/
  PRD.md                # Product Requirements Document
  ARCHITECTURE.md        # Arquitetura técnica
  TASKS.md                # Plano de execução em fases
  DATA_MODEL.sql            # Schema do banco (Supabase/Postgres)
  API_CONTRACTS.md           # Contrato formal das tools do agente
  SECURITY.md                 # Privacidade e segurança (LGPD)
.env.example            # Variáveis de ambiente necessárias
CHANGELOG.md            # Histórico de mudanças
src/                     # Código-fonte (a ser gerado)
```

## Stack (conforme descrito no case original)

| Camada | Tecnologia |
|---|---|
| Modelo de IA | Classe "Haiku 4.5" (modelo custo-eficiente) |
| Banco de dados / memória | Supabase (Postgres) |
| Voz sintetizada | ElevenLabs |
| Canais de disparo | WhatsApp (API oficial Meta), e-mail, SMS |
| Captura de lead | Formulário estilo Typeform |
| CRM | Proprietário (construído do zero) |
| Painel de operação | Dashboard próprio |
| Orquestração | Desenvolvimento direto via código/API — **sem** ferramenta de automação de terceiros (n8n, Zapier, Make etc., não citadas no case) |

## Como usar este repositório com o Antigravity

1. Abra esta pasta como workspace no Antigravity.
2. O agente deve ler `.agents/agents.md` antes de qualquer ação — é o arquivo que define as personas (PM, Arquiteto, Engenheiro) e a ordem de execução.
3. Rode o fluxo começando pelo `docs/PRD.md` já validado (está pronto, não precisa reescrever) e siga o plano em `docs/TASKS.md` fase por fase.
4. Não avance de fase sem aprovação explícita do responsável do projeto — isso está definido como regra em `agents.md`.

## Métrica de sucesso do produto

Show rate (comparecimento em reunião) saindo de uma baseline atual para 40%+ — mesmo indicador usado no case de referência.
