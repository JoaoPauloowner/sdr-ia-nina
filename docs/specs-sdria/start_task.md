---
description: Start Task — carrega contexto do projeto antes de iniciar qualquer implementação
---

Quando o usuário digitar `/start_task <nome_da_tarefa>`, execute nesta ordem:

1. Ler `docs/PRD.md` e `docs/ARCHITECTURE.md` para relembrar escopo e regras fixas
2. Ler `docs/TASKS.md` e localizar a tarefa `<nome_da_tarefa>` na fase correspondente
3. Verificar se há mudanças não commitadas no branch atual — se houver, parar e perguntar ao usuário se deve continuar ou descartar
4. Criar um branch novo a partir de `main` com o padrão de nome `fase-N/nome-da-tarefa`
5. Confirmar com o usuário o entendimento da tarefa em 2-3 frases antes de escrever qualquer código
6. Só então iniciar a implementação, seguindo `.agents/rules/coding-style.md` e `.agents/rules/integrations.md`
