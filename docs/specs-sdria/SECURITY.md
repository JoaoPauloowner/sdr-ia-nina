# Segurança e Privacidade — Nina

## Dados Pessoais Tratados

O sistema lida com dados pessoais do lead: nome, telefone, e-mail, empresa, cargo e, em alguns casos, faturamento declarado. Isso caracteriza tratamento de dados pessoais sob a LGPD (Lei Geral de Proteção de Dados).

## Princípios

- **Minimização:** coletar apenas os campos necessários para qualificação e agendamento, nada além disso
- **Finalidade:** os dados só podem ser usados para a jornada de pré-vendas descrita no `docs/PRD.md` — não reutilizar para outra finalidade sem consentimento adicional
- **Retenção:** definir prazo de retenção para leads que nunca converteram (ex: anonimizar após X meses de inatividade) — a definir com o responsável do projeto antes de produção
- **Acesso:** apenas o backend (service role) tem acesso direto às tabelas `leads`, `agendamentos` e `interacoes` — ver políticas de RLS em `docs/DATA_MODEL.sql`

## Consentimento

- O formulário de captura deve conter aviso claro sobre o uso de IA para contato via WhatsApp/e-mail/SMS
- O lead deve poder solicitar exclusão dos seus dados — implementar rota/processo para isso antes de ir para produção (não coberto no MVP das Fases 0–8 do `docs/TASKS.md`, mas obrigatório antes de tráfego real)

## Segurança Técnica

- Todas as chaves de API (`.env`) nunca devem ser commitadas — usar `.env.example` como referência
- Comunicação com todas as integrações externas via HTTPS
- Logs de `interacoes` não devem armazenar dados sensíveis além do resumo necessário para auditoria (evitar logar conteúdo completo de conversas com dados sensíveis de terceiros, como CPF, se mencionado)

## Voz Sintetizada (ElevenLabs)

- Áudios gerados não devem ser reutilizados fora do contexto da conversa original do lead
- Avaliar necessidade de aviso ao lead de que está ouvindo uma voz sintetizada, conforme regulamentação aplicável no momento da implementação
