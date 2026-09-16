# Regras de Estilo de Código

- Escrever integrações como módulos isolados por serviço (`integrations/whatsapp.py`, `integrations/calendar.py`, etc.) — nunca misturar lógica de negócio com chamada de API externa no mesmo arquivo
- Toda função que envia mensagem a um lead deve, obrigatoriamente, gravar o registro em `interacoes` antes de retornar sucesso
- Toda regra de timing (2 minutos, 1 hora, 5 minutos, régua de silêncio) deve ser configurável via variável, nunca hardcoded no meio da lógica
- Testes automatizados obrigatórios para: disparo de confirmação, criação de evento no calendário, seleção de case por segmento, recuperação de abandono
- Nenhuma chamada a serviço externo sem tratamento de erro e retry — falha de integração não pode travar o fluxo do lead
