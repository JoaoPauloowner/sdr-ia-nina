# Especificação Técnica de Arquitetura — SDR IA Nina

**Data:** 13/09/2026  
**Status:** Proposto / Em Validação  
**Base:** [SDR-IA-Nina-Produto-e-Prompt.md](../../SDR-IA-Nina-Produto-e-Prompt.md)  
**Autor:** Antigravity AI & Usuário

---

## 1. Visão Geral da Arquitetura

O sistema é um **Agente de Pré-Vendas Autônomo e Determinístico com IA Generativa Embutida**. O sistema segue a premissa de que **decisões de negócio e agendamentos temporais são determinísticos**, enquanto a **comunicação, contextualização e injeção de cases são generativos**.

```
  [ Formulário Tipo Typeform ]
               |
               v (Webhook HTTP)
  +-----------------------------------------------------------+
  |              API GATEWAY & ENGINE DE REGRAS               |
  |  - Ingestão de leads / detecção de abandono de formulário |
  |  - Agendador de tarefas / Timers (BullMQ / Cron / Queue)  |
  |  - Radar do Silêncio (Monitor de inatividade do lead)     |
  +-----------------------------------------------------------+
         |                                           ^
         | Salva / Consulta                          | Dispara eventos
         v                                           |
  +--------------------+                     +-------------------------+
  |  BANCO SUPABASE    |                     |  MOTOR DE IA (NINA)     |
  |  - leads           | <=================> |  - Claude Haiku 3.5/4.5 |
  |  - agendamentos    |   Tool Calling      |  - System Prompt rigoroso|
  |  - closers         |                     |  - RAG Cases de Sucesso |
  |  - cases_sucesso   |                     +-------------------------+
  |  - interacoes      |                                  |
  +--------------------+                                  |
                                                          v
                                        +----------------------------------+
                                        |    ADAPTADORES DE MENSAGERIA     |
                                        |  - WhatsApp (Meta Cloud API)     |
                                        |  - Áudio (ElevenLabs TTS API)    |
                                        |  - E-mail (Resend / SMTP)        |
                                        |  - SMS Gateway                   |
                                        |  - Google Calendar API           |
                                        +----------------------------------+
```

---

## 2. Modelagem do Banco de Dados (Supabase / PostgreSQL)

### 2.1 Entidades Principais

1. **`leads`**:
   - `id`: UUID (PK)
   - `nome`: VARCHAR(100)
   - `email`: VARCHAR(150)
   - `telefone`: VARCHAR(20) (E.164)
   - `ddd`: VARCHAR(5)
   - `empresa`: VARCHAR(150)
   - `cargo`: VARCHAR(100)
   - `setor`: VARCHAR(100) (usado para match com cases de sucesso)
   - `status`: ENUM (`abandonou_formulario`, `agendado`, `confirmado`, `radar_silencio`, `no_show`, `concluido`, `cancelado`)
   - `created_at`, `updated_at`: TIMESTAMPTZ

2. **`closers`**:
   - `id`: UUID (PK)
   - `nome`: VARCHAR(100)
   - `email`: VARCHAR(150)
   - `cargo`: VARCHAR(100) (ex: "Especialista em Soluções")
   - `link_agenda`: TEXT
   - `link_sala_reuniao`: TEXT
   - `ativo`: BOOLEAN

3. **`agendamentos`**:
   - `id`: UUID (PK)
   - `lead_id`: UUID (FK -> leads.id)
   - `closer_id`: UUID (FK -> closers.id)
   - `data_hora_reuniao`: TIMESTAMPTZ
   - `status_confirmacao`: ENUM (`pendente`, `confirmado_pelo_lead`, `cancelado_pelo_lead`, `reagendamento_solicitado`)
   - `google_event_id`: VARCHAR(100)
   - `compareceu`: BOOLEAN NULL
   - `created_at`: TIMESTAMPTZ

4. **`cases_sucesso`** (Base de Conhecimento RAG):
   - `id`: UUID (PK)
   - `segmento`: VARCHAR(100) (ex: "saude", "imobiliario", "educacao", "b2b_saas", "varejo")
   - `nome_cliente`: VARCHAR(100)
   - `metrica_chave`: TEXT (ex: "Aumento de 42% no faturamento em 60 dias")
   - `resumo_case`: TEXT (texto curto pronto para ser parafraseado pela Nina)
   - `ativo`: BOOLEAN

5. **`interacoes`** (Histórico de Conversas e Auditoria):
   - `id`: UUID (PK)
   - `lead_id`: UUID (FK -> leads.id)
   - `direcao`: ENUM (`entrada`, `saida`)
   - `canal`: ENUM (`whatsapp`, `email`, `sms`, `audio`)
   - `conteudo`: TEXT
   - `media_url`: TEXT NULL
   - `tool_calls`: JSONB NULL
   - `created_at`: TIMESTAMPTZ

6. **`fila_agendamentos`**:
   - `id`: UUID (PK)
   - `lead_id`: UUID
   - `agendamento_id`: UUID
   - `tipo_regra`: ENUM (`confirmacao_imediata`, `lembrete_1h`, `cerco_5m`, `radar_silencio`, `recuperacao_abandono`)
   - `executar_em`: TIMESTAMPTZ
   - `status`: ENUM (`pendente`, `processando`, `executado`, `cancelado`)

---

## 3. As 6 Alavancas Operacionais

| Alavanca | Gatilho Temporal | Canais | Ação Executada |
| :--- | :--- | :--- | :--- |
| **1. Confirmação Imediata** | `t = 0` (< 2 min após agendar) | WhatsApp + E-mail + SMS | Envia mensagem calorosa, cita nome do closer, data/hora e convite no Google Calendar. |
| **2. Lembrete 1h Antes** | `t = data_hora - 60min` | WhatsApp | Reforça o compromisso, pergunta se está tudo certo para a call, reitera link. |
| **3. Cerco 5min Antes** | `t = data_hora - 5min` | WhatsApp + E-mail + SMS simultâneos | Envia link direto da sala ("Estamos te aguardando na sala agora!"). |
| **4. Google Calendar** | `t = 0` (imediatamente) | Google Calendar API | Cria o evento no calendário do lead com lembretes nativos ativados. |
| **5. Radar do Silêncio** | Se lead não responder após `X` horas | WhatsApp | Dispara mensagem com tom alternativo, mais enxuta e direta, perguntando sobre a prioridade da reunião. |
| **6. Case Segmentado** | No contato de aquecimento | WhatsApp | Nina consulta `buscar_case_por_segmento(lead.setor)` e compartilha um case real para gerar prova social. |

---

## 4. Agente de IA: Claude Haiku & Tool Calling

### 4.1 Prompt do Sistema
O prompt de sistema mantém fidelidade absoluta às regras inegociáveis:
- Tom humano, profissional, acolhedor e ágil (estilo WhatsApp).
- Proibição estrita de criar preços, descontos ou políticas fora da base.
- Chamada autônoma de tools para buscar contexto e registrar no CRM.

### 4.2 Ferramentas Registradas (Anthropic Tool Spec)
1. `buscar_lead_crm(identificador: string)`
2. `buscar_closer_responsavel(agendamento_id: string)`
3. `buscar_case_por_segmento(segmento: string)`
4. `criar_evento_calendario(lead_id: string, horario: string)`
5. `atualizar_status_crm(lead_id: string, status: string)`
6. `enviar_whatsapp(numero: string, mensagem: string)`
7. `enviar_email(destinatario: string, assunto: string, corpo: string)`
8. `enviar_sms(numero: string, mensagem: string)`
9. `gerar_audio(texto: string, voice_id: string)`

---

## 5. Tratamento de Erros e Casos Extremos

1. **Lead pede cancelamento:** Nina acolhe educadamente, cancela no CRM, pergunta se prefere remarcar e não insiste de forma invasiva.
2. **Pergunta técnica avançada:** Nina explica que o Closer responsável se aprofundará nisso na reunião e registra a nota no CRM.
3. **Falha de API de mensageria:** Fallback automático entre canais (se WhatsApp falhar, dispara SMS imediato).
4. **Lead responde fora do horário comercial:** Nina responde confirmando o recebimento e alinha expectativas.

---

## 6. Próximos Passos de Execução

1. Criar o DDL SQL completo para o Supabase (`database/schema.sql`).
2. Configurar o backend de serviços e orquestração.
3. Desenvolver o conector de IA com Claude Haiku e a suíte de ferramentas.
4. Conectar canais de disparo e testar o fluxo completo.
