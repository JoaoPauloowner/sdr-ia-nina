---
description: Lint and Test — roda toda a checagem de qualidade automaticamente
---

Quando o usuário digitar `/lint_and_test`, execute nesta ordem:

1. Rodar o linter do projeto e corrigir automaticamente o que for seguro corrigir
2. Rodar a suíte de testes completa
3. Rodar especificamente os testes obrigatórios listados em `.agents/rules/coding-style.md`:
   disparo de confirmação, criação de evento no calendário, seleção de case por segmento,
   recuperação de abandono
4. Verificar que nenhum teste está chamando serviço externo real (WhatsApp, e-mail, SMS,
   ElevenLabs, Google Calendar) — todos devem usar mock, conforme `.agents/rules/testing.md`
5. Reportar um resumo claro: quantos testes passaram, falharam, e quais arquivos foram
   alterados pelo linter
6. Se algum teste falhar, não prosseguir para `/finalize_task` — corrigir primeiro
