# Regras de Teste

- Nenhum teste automatizado pode chamar um serviço externo real (WhatsApp, e-mail, SMS, ElevenLabs, Google Calendar). Todos devem usar mock/stub.
- Testes obrigatórios por funcionalidade (referência: `docs/TASKS.md`):
  - **Confirmação de agendamento:** verificar que os 3 canais são acionados em até 2 minutos simulados
  - **Lembretes:** verificar disparo correto nos marcos de 1 hora e 5 minutos antes
  - **Régua de silêncio:** verificar que a régua alternativa só ativa após o tempo configurado em `REGRA_SILENCIO_HORAS`
  - **Recuperação de abandono:** verificar que só é acionada para leads com nome + telefone preenchidos e sem agendamento concluído
  - **Seleção de case por segmento:** verificar que retorna `null` (não um case genérico) quando não há case para o segmento
  - **Registro de interação:** verificar que toda mensagem enviada gera um registro em `interacoes`
- Testes de regressão para as regras de negócio fixas (seção "REGRAS DE NEGÓCIO" do prompt da Nina) devem rodar a cada `/finalize_task` — qualquer alteração de comportamento nessas regras deve falhar o teste e exigir aprovação humana explícita
- Cobertura mínima recomendada: 80% nos módulos de `integrations/` e regras de timing
