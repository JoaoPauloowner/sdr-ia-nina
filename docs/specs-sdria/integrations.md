# Regras de Integração

Estas regras existem para manter o sistema 100% fiel ao case de referência: integrações diretas via API oficial de cada serviço, sem plataforma de automação visual de terceiros.

## WhatsApp
- Usar exclusivamente a API oficial da Meta (Cloud API ou On-Premises)
- Respeitar a janela de 24 horas de conversa ativa da API — fora dela, é necessário usar template aprovado

## E-mail
- Usar provedor transacional com API própria (ex: Amazon SES, SendGrid, Postmark)
- Nunca depender de automação visual para o disparo

## SMS
- Usar provedor com API própria (ex: Twilio, Zenvia)

## Google Calendar
- Autenticação via OAuth 2.0 (por lead) ou geração de link de convite `.ics` quando OAuth não for viável
- Evento deve conter: horário, nome do closer, link da reunião (se houver)

## ElevenLabs
- Uso restrito a mensagens de alta relevância (confirmação inicial, lembrete de 5 minutos)
- Cache de áudios gerados quando o texto for reutilizável, para reduzir custo

## Supabase
- Toda escrita crítica (mudança de status de agendamento, registro de interação) deve ser transacional
- Row Level Security ativado para proteger dados de leads

## Regra Geral
Nenhuma integração deste projeto deve passar por n8n, Zapier, Make ou qualquer orquestrador visual de terceiros. Isso é uma decisão de arquitetura deliberada, fiel ao case original, e não deve ser alterada sem atualização explícita do `docs/ARCHITECTURE.md`.
