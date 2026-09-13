# SDR IA — Produto e Prompt de Sistema
### Baseado no case "Nina" (Viver de IA) — redução de R$ 2M em tráfego pago + aumento de show rate de 21% para 40%+

---

## 1. O Produto: "Agente de Pré-Vendas Autônomo"

**Nome sugerido:** Nina (ou renomeie para sua marca — ex: "Léa", "Sofia", "Max")

**Proposta de valor em uma frase:**
Um agente de IA que substitui o time de pré-vendas humano na etapa entre "lead agendou reunião" e "lead compareceu à reunião", eliminando no-show através de comunicação multicanal automática, personalizada e com timing perfeito.

**Problema que resolve:**
Empresas gastam tráfego pago para gerar leads, os leads agendam reunião, mas 60-80% não comparecem (no-show). Isso queima orçamento de marketing sem gerar receita proporcional. Contratar um time de pré-vendas humano para resolver isso é caro, tem turnover, não escala e não executa a jornada de forma impecável.

**O que o agente faz, na prática:**
1. Confirma a reunião automaticamente assim que o lead agenda (WhatsApp + e-mail + SMS)
2. Envia lembretes em pontos estratégicos (ex: 1h antes, 5 min antes)
3. Personaliza a mensagem com dados do lead (nome, empresa, cargo, origem, DDD/região)
4. Informa quem é o responsável (closer/vendedor) que vai atender, puxando isso do CRM
5. Envia um case de sucesso relevante para o segmento do lead, puxado de uma base de conhecimento
6. Recupera leads que abandonaram o formulário no meio do preenchimento
7. Responde dúvidas do lead antes da reunião, usando a base de conhecimento
8. Registra tudo no CRM (status de confirmação, histórico da conversa, etc.)
9. Opera com voz sintetizada (áudio) além de texto, quando fizer sentido

**Resultado reportado no case:**
- Show rate: 21% → 40%+ (meta declarada: ~50%)
- Investimento em tráfego pago: R$ 3M → R$ 1M/mês (mesma ou maior receita)
- Sem contratação de pessoas para a função

---

## 2. As 6 Alavancas (o "processo do melhor time de pré-vendas do mundo")

Este é o núcleo replicável do case — a lógica que qualquer agente de pré-vendas por IA deveria seguir:

| # | Alavanca | O que significa |
|---|----------|------------------|
| 1 | Confirmação correta | Confirmar a reunião assim que ela é marcada, no canal certo, com o tom certo |
| 2 | Lembrete próximo ao horário | Reforçar o compromisso perto da hora do call (não só no agendamento) |
| 3 | Cerco de última hora | Multicanal simultâneo (WhatsApp + e-mail + SMS) nos minutos finais |
| 4 | Integração com calendário | Criar evento no Google Calendar do próprio lead, não só confirmar por mensagem |
| 5 | Radar do silêncio | Se o lead não responde, ativar uma régua de cobrança específica (não a mesma régua de quem respondeu) |
| 6 | Personalização com case | Puxar um case de sucesso do segmento/setor do lead para aumentar o engajamento, não mandar mensagem genérica |

---

## 3. Stack Exatamente Como Citado no Vídeo

Este é o stack que o próprio criador do case descreve — sem acréscimos:

- **Modelo de IA ("o cérebro"):** modelo da classe "Haiku 4.5" — ele é explícito que não precisa de um modelo caro/complexo para essa função
- **Memória / banco de dados:** Supabase (chamado no vídeo de "PBS", mas confirmado como Supabase)
- **Voz sintetizada:** integração com ElevenLabs, para o agente responder em áudio como se fosse uma pessoa
- **Canais de disparo:** WhatsApp (API oficial da Meta), e-mail, SMS
- **Captura de lead:** funil com formulário estilo Typeform ("type")
- **CRM:** proprietário, construído internamente pela empresa (o vídeo não especifica ferramenta terceira de CRM — foi feito com IA, do zero)
- **Painel de operação:** um dashboard próprio (também construído com IA) para acompanhar a IA atendendo os leads em tempo real
- **Orquestração/automação:** o vídeo não menciona nenhuma ferramenta de automação de terceiros (como n8n, Zapier, Make). Todo o sistema — funil, CRM, painel, integrações — foi construído sob medida pelo próprio criador usando IA como copiloto de desenvolvimento, não uma plataforma de workflow pronta.

Importante: o agente **não decide tudo sozinho**. O criador é enfático nisso — ele não deixa o modelo generativo decidir por conta própria; existem regras de negócio fixas (quando mandar, o quê mandar, quais dados puxar) e o LLM entra para personalização de linguagem e para puxar o case certo da base de conhecimento, não para decisões críticas como horário de disparo.

---

## 4. Prompt de Sistema — Pronto para Usar

Copie o bloco abaixo e adapte os campos entre `{{ }}` para o seu negócio. Este prompt foi desenhado para um agente que opera via WhatsApp/e-mail, integrado a CRM e calendário através de tools/function calling (ex: em n8n, Claude API, ou qualquer orquestrador de agentes).

```
# IDENTIDADE
Você é {{NOME_DO_AGENTE}}, responsável por pré-vendas de {{NOME_DA_EMPRESA}}.
Sua função é garantir que leads que agendaram uma reunião de demonstração
compareçam a ela, e recuperar leads que abandonaram o cadastro no meio do caminho.
Você fala como uma pessoa real do time comercial — natural, direta, sem parecer robótica
e sem se identificar como IA a menos que perguntada diretamente.

# OBJETIVO PRINCIPAL
Maximizar a taxa de comparecimento (show rate) nas reuniões agendadas,
sem reduzir a qualidade da experiência do lead.

# REGRAS DE NEGÓCIO (NÃO NEGOCIÁVEIS — você não decide isso, apenas executa)
1. Ao lead confirmar agendamento -> envie confirmação em até 2 minutos, nos 3 canais
   disponíveis (WhatsApp, e-mail, SMS), citando: nome do lead, data/hora, nome do
   responsável comercial (puxado do CRM).
2. Envie lembrete 1 hora antes do horário marcado.
3. Envie lembrete final 5 minutos antes do horário marcado.
4. Se o lead não responder a nenhuma mensagem em até {{X}} horas, ative a régua de
   "silêncio": uma sequência de reengajamento diferente da régua padrão, menos
   frequente e mais direta.
5. Se o lead abandonar o formulário de cadastro após preencher nome e telefone (sem
   concluir agendamento), inicie sequência de recuperação via WhatsApp em até
   {{Y}} minutos.
6. Nunca invente informações sobre o produto, preço, ou disponibilidade de agenda.
   Use apenas o que está na base de conhecimento ou no CRM.
7. Nunca prometa desconto, condição especial ou qualquer compromisso comercial
   sem essa informação estar explicitamente na base de conhecimento.
8. Toda interação deve ser registrada no CRM: canal usado, horário, conteúdo
   resumido, status de confirmação.

# PERSONALIZAÇÃO
Ao se comunicar com o lead, utilize os seguintes dados quando disponíveis:
- Nome e empresa do lead
- Cargo / função
- Setor de atuação (para puxar um case de sucesso relevante da base de
  conhecimento — nunca envie case genérico se houver um específico do setor)
- Região (DDD) — pode ser usado para tom mais próximo/regional, com moderação
- Nome do responsável comercial (closer) que vai atendê-lo, puxado do CRM

# TOOLS DISPONÍVEIS (adaptar aos nomes reais do seu ambiente)
- buscar_lead_crm(telefone ou email) -> retorna dados do lead e do agendamento
- buscar_closer_responsavel(id_agendamento) -> retorna nome do vendedor
- buscar_case_por_segmento(segmento) -> retorna case de sucesso relevante
- criar_evento_calendario(lead, horario) -> cria evento no Google Calendar do lead
- atualizar_status_crm(lead_id, status) -> atualiza status de confirmação
- enviar_whatsapp(numero, mensagem) / enviar_email(...) / enviar_sms(...)
- gerar_audio(texto) -> converte texto em áudio (ElevenLabs ou similar), usar
  com moderação, principalmente em mensagens de maior importância

# TOM DE VOZ
- Direto, acolhedor, sem forçar informalidade excessiva
- Frases curtas, fáceis de ler no WhatsApp
- Nunca soar como script robótico repetido — varie a formulação mantendo a
  mesma informação central
- Se o lead fizer uma pergunta fora do escopo de pré-vendas (ex: pergunta técnica
  avançada, negociação de contrato), sinalize que o {{CARGO_DO_CLOSER}} vai
  aprofundar isso na reunião, e registre a dúvida no CRM para o closer se preparar

# LIMITES
- Não decida sozinho horários de disparo fora das regras acima
- Não conduza negociação comercial (preço, contrato, descontos)
- Se o lead demonstrar intenção de cancelar definitivamente, não insista de forma
  agressiva — confirme o cancelamento, pergunte se pode remarcar, e encerre
  educadamente se a resposta for não

# EXEMPLO DE MENSAGEM DE CONFIRMAÇÃO
"Oi {{nome}}! Sua reunião com {{nome_closer}} tá confirmada para {{data}} às
{{hora}}. Vai ser sobre {{tema_personalizado}}. Consegue confirmar presença
por aqui? 🙂"
```

---

## 5. Roadmap de Implementação Sugerido

1. **Mapear a jornada atual** — desenhe (literalmente, num quadro) onde está a maior perda entre lead capturado e reunião realizada
2. **Definir as réguas de comunicação** — quantos toques, em quais canais, em quais momentos (use as 6 alavancas como base)
3. **Montar a base de conhecimento** — cases de sucesso segmentados, FAQ do produto, políticas de agendamento
4. **Conectar os sistemas** — formulário → CRM → orquestrador (n8n) → canais de disparo
5. **Implementar o agente com o prompt acima**, testando primeiro em um canal só (ex: WhatsApp) antes de expandir para e-mail/SMS/voz
6. **Medir show rate antes/depois** — esse é o KPI central do case, e é o que justifica redução de investimento em tráfego pago
7. **Iterar a base de conhecimento** continuamente — quanto mais cases e contexto, mais o agente personaliza sem intervenção humana

---

## 6. Nota sobre Fidelidade ao Case

Este documento reflete apenas o que foi descrito no vídeo. O criador não menciona nenhuma ferramenta de automação/orquestração de terceiros (n8n, Zapier, Make, etc.) — o sistema inteiro (funil, CRM, painel de operação, integrações com WhatsApp/e-mail/SMS/voz) foi construído sob medida com apoio de IA generativa para desenvolvimento, e não montado em cima de uma plataforma de workflow pronta.

Se você quiser implementar essa mesma arquitetura, isso significa que o caminho mais fiel ao case é desenvolver as integrações diretamente (via código/API), como o autor fez — e não necessariamente montar tudo num orquestrador visual. Se preferir usar uma ferramenta de automação por praticidade, isso seria uma adaptação sua, não uma reprodução exata do que foi mostrado.
