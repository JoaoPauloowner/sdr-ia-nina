# Arquitetura Técnica — Nina

## 1. Visão Geral do Fluxo

```
[Anúncio/Tráfego Pago]
        |
        v
[Landing Page + Formulário (estilo Typeform)]
        |
        v
[Captura do Lead -> grava em Supabase + CRM]
        |
        +---> [Abandonou formulário?] -> Nina reativa via WhatsApp
        |
        v
[Lead agenda reunião]
        |
        v
[Nina dispara confirmação: WhatsApp + e-mail + SMS]
        |
        v
[Evento criado no Google Calendar do lead]
        |
        v
[Lembrete 1h antes] -> [Lembrete 5min antes]
        |
        v
[Lead responde ou fica em silêncio]
        |
        +---> [Silêncio] -> Régua de reengajamento
        |
        v
[Reunião ocorre com o Closer]
        |
        v
[Painel de Operação + CRM atualizados em cada etapa]
```

## 2. Componentes do Sistema

### 2.1 Camada de Captura
- Formulário de qualificação (nome, empresa, cargo, faturamento, telefone)
- Grava lead no banco assim que campos mínimos (nome + telefone) são preenchidos, mesmo antes da conclusão — é isso que permite a recuperação de abandono

### 2.2 Camada de Dados
- **Supabase (Postgres)** como banco central
- Tabelas mínimas sugeridas:
  - `leads` (id, nome, empresa, cargo, telefone, email, segmento, origem, status, criado_em)
  - `agendamentos` (id, lead_id, closer_id, data_hora, status_confirmacao, canal_confirmado)
  - `interacoes` (id, lead_id, canal, conteudo_resumo, enviado_em, direcao)
  - `cases_sucesso` (id, segmento, titulo, resumo, link_ou_texto)
  - `closers` (id, nome, cargo, agenda_ref)

### 2.3 Camada de Inteligência (o "cérebro")
- Modelo de IA classe "Haiku 4.5" — suficiente para personalização de linguagem e decisões simples guiadas por regra
- O modelo **não** decide sozinho: recebe contexto (dados do lead + regra de negócio aplicável) e gera a mensagem personalizada, ou seleciona qual case enviar dentro de um conjunto já filtrado por segmento

### 2.4 Camada de Voz
- Integração com ElevenLabs para gerar áudio a partir do texto em mensagens de maior relevância (ex: confirmação inicial, lembrete final)

### 2.5 Camada de Canais
- WhatsApp via API oficial da Meta
- E-mail transacional
- SMS

### 2.6 Camada de CRM e Painel
- CRM proprietário: guarda lead, agendamento, closer responsável, status
- Painel de operação: visualização em tempo real das conversas e status de cada lead na jornada

## 3. As 6 Alavancas (regras de negócio fixas)

Estas regras não são decididas pelo modelo de IA — são parâmetros de sistema:

1. **Confirmação correta** — disparo em até 2 minutos após agendamento, nos 3 canais
2. **Lembrete próximo ao horário** — 1 hora antes
3. **Cerco de última hora** — 5 minutos antes, multicanal
4. **Integração com calendário** — evento criado na agenda do próprio lead, não apenas mensagem de texto
5. **Radar do silêncio** — se não houver resposta em X horas, ativa régua alternativa de reengajamento
6. **Personalização com case** — segmento do lead determina qual case é buscado na base de conhecimento e enviado

## 4. Integrações Externas Necessárias

| Integração | Finalidade | Observação |
|---|---|---|
| API oficial do WhatsApp (Meta) | Envio e recebimento de mensagens | Requer conta comercial verificada |
| Provedor de e-mail transacional | Envio de confirmações/lembretes | Qualquer provedor com API (ex: SES, SendGrid) |
| Provedor de SMS | Envio de lembretes finais | Qualquer provedor com API |
| Google Calendar API | Criação de evento na agenda do lead | Requer OAuth ou link de convite |
| ElevenLabs API | Geração de voz sintetizada | Uso moderado, mensagens-chave |
| Supabase | Banco de dados e autenticação | Já cobre "memória" do agente |

Nenhuma dessas integrações passa por uma ferramenta de automação visual de terceiros — cada uma é implementada diretamente via código/API, como no case de referência.

## 5. Prompt de Sistema do Agente

Ver `.agents/agents.md` → seção "Persona: Nina (Runtime)" para o prompt de produção que a Nina utiliza ao conversar com o lead. Esse prompt é o núcleo comportamental do agente e deve ser mantido separado das regras de orquestração do Antigravity.
