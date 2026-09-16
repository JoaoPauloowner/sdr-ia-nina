---
description: Finalize Task — checklist de conclusão antes de considerar a tarefa pronta
---

Quando o usuário digitar `/finalize_task`, execute nesta ordem:

1. Rodar todos os testes automatizados relacionados à tarefa (ver `.agents/rules/testing.md`)
2. Rodar lint/formatação de código
3. Verificar se alguma regra de negócio fixa (seção "REGRAS DE NEGÓCIO" do prompt da Nina em `agents.md`) foi alterada sem autorização — se sim, parar e sinalizar
4. Atualizar `docs/TASKS.md` marcando o item concluído com `[x]`
5. Atualizar `CHANGELOG.md` com uma linha descrevendo a mudança
6. Se a tarefa alterou schema ou integração, atualizar `docs/DATA_MODEL.sql` ou `docs/API_CONTRACTS.md` correspondente
7. Abrir Pull Request com descrição do que foi feito, referenciando a fase do `docs/TASKS.md`
8. Parar e aguardar aprovação humana antes de fazer merge
