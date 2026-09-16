# Plano de Execução — Nina

O Antigravity deve seguir estas fases em ordem, pausando para aprovação ao final de cada uma (ver regra em `.agents/agents.md`).

## Fase 0 — Setup do Projeto
- [ ] Criar projeto Supabase e definir schema inicial (`leads`, `agendamentos`, `interacoes`, `cases_sucesso`, `closers`)
- [ ] Configurar variáveis de ambiente para as integrações (WhatsApp, e-mail, SMS, Google Calendar, ElevenLabs)
- [ ] Criar repositório de código com estrutura de pastas definida no README

## Fase 1 — Captura de Lead
- [ ] Construir formulário de qualificação (nome, empresa, cargo, faturamento, telefone, e-mail)
- [ ] Implementar gravação parcial: salvar lead assim que nome + telefone forem preenchidos (antes da conclusão do formulário)
- [ ] Implementar trigger de "abandono": se o formulário não for concluído em X minutos, marcar lead como `abandonado`

## Fase 2 — Agendamento e Confirmação
- [ ] Construir tela de agendamento integrada ao CRM (seleção de data/hora, vínculo com closer disponível)
- [ ] Ao concluir agendamento, disparar confirmação automática em WhatsApp + e-mail + SMS (até 2 minutos)
- [ ] Criar evento no Google Calendar do lead via API
- [ ] Registrar toda mensagem enviada na tabela `interacoes`

## Fase 3 — Réguas de Comunicação
- [ ] Implementar lembrete automático 1 hora antes do horário
- [ ] Implementar lembrete automático 5 minutos antes do horário
- [ ] Implementar régua de silêncio (leads sem resposta após X horas)
- [ ] Implementar reativação de leads que abandonaram o formulário

## Fase 4 — Personalização e Base de Conhecimento
- [ ] Popular tabela `cases_sucesso` com cases reais, segmentados por setor
- [ ] Implementar lógica de seleção de case por segmento do lead
- [ ] Integrar o modelo de IA para geração de texto personalizado dentro das regras fixas (nunca decidindo horário ou conteúdo comercial livremente)

## Fase 5 — Voz Sintetizada
- [ ] Integrar ElevenLabs para gerar áudio das mensagens de maior relevância (confirmação inicial e lembrete final)

## Fase 6 — Painel de Operação
- [ ] Construir dashboard com visão em tempo real das conversas e status de cada lead
- [ ] Exibir indicador de show rate (comparecimento) como métrica principal

## Fase 7 — Testes e Validação
- [ ] Rodar o fluxo completo de ponta a ponta com leads de teste
- [ ] Validar que nenhuma decisão crítica está sendo tomada livremente pelo modelo (auditoria das regras fixas)
- [ ] Medir show rate simulado antes de liberar para produção

## Fase 8 — Produção
- [ ] Liberar para tráfego real
- [ ] Acompanhar show rate semanalmente e comparar com a baseline
- [ ] Iterar base de conhecimento com novos cases conforme surgem
