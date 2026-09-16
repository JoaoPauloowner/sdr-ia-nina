# API Contracts — Tools do Agente Nina

Contrato formal das ferramentas (tools) que o agente Nina pode chamar, referenciadas em `.agents/agents.md`. Todo tool deve ser implementado como função isolada, conforme `.agents/rules/coding-style.md`.

---

## buscar_lead_crm

**Descrição:** Retorna os dados do lead a partir de telefone ou e-mail.

**Input:**
```json
{
  "telefone": "string (opcional)",
  "email": "string (opcional)"
}
```

**Output:**
```json
{
  "id": "uuid",
  "nome": "string",
  "empresa": "string | null",
  "cargo": "string | null",
  "segmento": "string | null",
  "status": "novo | abandonado | agendado | confirmado | compareceu | nao_compareceu | cancelado"
}
```

---

## buscar_closer_responsavel

**Descrição:** Retorna o closer vinculado a um agendamento.

**Input:**
```json
{ "id_agendamento": "uuid" }
```

**Output:**
```json
{ "id": "uuid", "nome": "string", "cargo": "string | null" }
```

---

## buscar_case_por_segmento

**Descrição:** Retorna um case de sucesso relevante para o segmento informado. Se não houver case específico, retorna `null` — o agente **não deve inventar um case genérico**.

**Input:**
```json
{ "segmento": "string" }
```

**Output:**
```json
{ "titulo": "string", "resumo": "string", "link_ou_texto": "string | null" } | null
```

---

## criar_evento_calendario

**Descrição:** Cria um evento no Google Calendar do lead (ou gera link `.ics` se OAuth não estiver disponível).

**Input:**
```json
{
  "lead_id": "uuid",
  "horario": "ISO 8601 datetime",
  "closer_nome": "string"
}
```

**Output:**
```json
{ "evento_id": "string", "link_convite": "string | null" }
```

---

## atualizar_status_crm

**Descrição:** Atualiza o status de um lead ou agendamento.

**Input:**
```json
{
  "lead_id": "uuid",
  "status": "novo | abandonado | agendado | confirmado | compareceu | nao_compareceu | cancelado"
}
```

**Output:**
```json
{ "sucesso": "boolean" }
```

---

## enviar_whatsapp / enviar_email / enviar_sms

**Descrição:** Envia mensagem ao lead pelo canal especificado. Toda chamada bem-sucedida deve gravar automaticamente um registro em `interacoes` (ver `.agents/rules/coding-style.md`).

**Input:**
```json
{
  "lead_id": "uuid",
  "destinatario": "string (telefone ou email)",
  "mensagem": "string"
}
```

**Output:**
```json
{ "sucesso": "boolean", "interacao_id": "uuid" }
```

---

## gerar_audio

**Descrição:** Converte texto em áudio via ElevenLabs. Uso restrito a mensagens de alta relevância (ver `.agents/rules/integrations.md`).

**Input:**
```json
{ "texto": "string" }
```

**Output:**
```json
{ "audio_url": "string" }
```

---

## Regra de Erro Padrão

Toda tool deve retornar erros no formato:
```json
{ "erro": true, "mensagem": "string", "codigo": "string" }
```
Nenhuma falha de tool pode travar o fluxo do lead — ver regra de retry em `.agents/rules/coding-style.md`.
