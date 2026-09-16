---
description: Sync Main — sincroniza o branch atual com main de forma segura
---

Quando o usuário digitar `/sync_main`, execute nesta ordem:

1. Verificar se há mudanças não commitadas — se houver, parar e perguntar como proceder
2. Buscar as últimas mudanças de `main` (fetch)
3. Fazer merge ou rebase de `main` no branch atual (perguntar preferência se não houver instrução prévia)
4. Rodar `/lint_and_test` (ver `.agents/workflows/lint_and_test.md`) após a sincronização
5. Reportar quaisquer conflitos encontrados sem resolvê-los automaticamente em arquivos de regra de negócio (`docs/PRD.md`, `docs/ARCHITECTURE.md`, `agents.md`) — esses exigem decisão humana
6. Branches já mergeados e sem commits pendentes podem ser removidos localmente após confirmação
