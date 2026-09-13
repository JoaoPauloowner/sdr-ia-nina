# API Contracts — Tools do Agente Nina

Contrato formal das ferramentas (*Tool Calling*) que o modelo Claude Haiku da Nina pode executar, mapeadas em `src/ai/tools.ts`.

---

## 1. Padrão de Retorno e Tratamento de Erros

Toda tool retorna um objeto JSON. Em caso de falha ou exceção, o retorno segue estritamente o formato:
```json
{
  "erro": true,
  "mensagem": "Descrição clara do erro para o agente",
  "codigo": "CODIGO_DO_ERRO"
}
```
> **Regra de Ouro:** Nenhuma falha de tool pode interromper abruptamente a conversa com o lead. O agente deve tratar graciosamente a resposta ou seguir com a comunicação alternativa.

---

## 2. Contratos Individuais de Tools

### `buscar_lead_crm`
**Finalidade:** Retorna dados cadastrais do lead e seus agendamentos no CRM a partir de telefone, email ou ID.  
**Entrada:**
```json
{
  "identificador": "string (telefone, email ou UUID)"
}
```
**Saída:**
```json
{
  "lead": {
    "id": "uuid",
    "nome": "string",
    "empresa": "string | null",
    "cargo": "string | null",
    "segmento": "string | null",
    "status": "agendado | confirmado | cancelado | ..."
  },
  "agendamentos": [ ... ]
}
```

---

### `buscar_closer_responsavel`
**Finalidade:** Retorna o vendedor/closer vinculado ao agendamento.  
**Entrada:**
```json
{
  "agendamento_id": "uuid"
}
```
**Saída:**
```json
{
  "id": "uuid",
  "nome": "string",
  "cargo": "string",
  "link_sala_reuniao": "string"
}
```

---

### `buscar_case_por_segmento`
**Finalidade:** Consulta a base de conhecimento RAG para extrair um case de sucesso do mesmo nicho do lead.  
**Entrada:**
```json
{
  "segmento": "string"
}
```
**Saída:**
```json
{
  "id": "uuid",
  "segmento": "string",
  "nome_cliente": "string",
  "metrica_chave": "string",
  "resumo_case": "string"
}
```

---

### `criar_evento_calendario`
**Finalidade:** Cria evento com link da reunião no Google Calendar do lead.  
**Entrada:**
```json
{
  "lead_id": "uuid",
  "horario": "ISO 8601 string"
}
```
**Saída:**
```json
{
  "success": true,
  "calendarEventId": "string",
  "linkMeet": "string"
}
```

---

### `atualizar_status_crm`
**Finalidade:** Registra confirmação, reagendamento ou cancelamento no Supabase/CRM.  
**Entrada:**
```json
{
  "lead_id": "uuid",
  "status": "confirmado | cancelado_pelo_lead | reagendamento_solicitado"
}
```
**Saída:**
```json
{
  "success": true,
  "status": "string"
}
```

---

### `enviar_whatsapp`
**Finalidade:** Dispara mensagem direta via Meta Cloud API e registra na tabela `interacoes`.  
**Entrada:**
```json
{
  "numero": "string",
  "mensagem": "string"
}
```
**Saída:**
```json
{
  "success": true,
  "messageId": "string"
}
```

---

### `gerar_audio`
**Finalidade:** Sintetiza mensagem em nota de voz realista da Nina via ElevenLabs.  
**Entrada:**
```json
{
  "texto": "string"
}
```
**Saída:**
```json
{
  "success": true,
  "audioUrl": "string"
}
```
