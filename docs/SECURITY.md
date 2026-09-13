# Segurança, Privacidade e LGPD — SDR IA Nina

## 1. Tratamento de Dados Pessoais (LGPD)

O sistema lida com dados cadastrais e contextuais de leads: nome, telefone, e-mail, empresa, cargo e segmento de atuação. No ordenamento jurídico brasileiro, isso caracteriza tratamento de dados pessoais sujeito à Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

## 2. Princípios Aplicados à Nina

- **Minimização:** Coleta estrita dos campos necessários para qualificação e agendamento da reunião com o closer.
- **Finalidade:** Os dados são utilizados exclusivamente para a régua de comunicação pré-reunião (confirmação, lembretes, prevenção de no-show e recuperação de abandono).
- **Transparência e Consentimento:**
  - O formulário de captura (Typeform ou landing page) deve exibir aviso transparente: *"Ao agendar, você concorda em receber mensagens automatizadas e lembretes de reunião da Nina via WhatsApp, e-mail e SMS."*
- **Direito de Eliminação / Opt-out:**
  - Se o lead solicitar expressamente o cancelamento ou a remoção dos seus dados no WhatsApp, a Nina encerra imediatamente o contato e o sistema sinaliza a exclusão ou anonimização no CRM.
- **Retenção de Dados:**
  - Leads inativos ou com no-show persistente devem ser arquivados ou anonimizados após 90 dias de inatividade comercial.

## 3. Segurança Técnica e Infraestrutura

- **Row Level Security (RLS):**
  - Todas as tabelas no Supabase (`leads`, `agendamentos`, `interacoes`, `cases_sucesso`) possuem RLS ativado.
  - Apenas o backend autenticado com a chave `service_role` possui permissão total de leitura e escrita. Nenhuma consulta anônima ou direta da internet é permitida.
- **Gestão de Chaves de API:**
  - Credenciais da Meta Cloud API, Anthropic (Claude), ElevenLabs e Supabase nunca são commitadas em repositório público (armazenadas em `.env` e carregadas via variáveis de ambiente seguras).
- **Comunicação Criptografada:**
  - Todas as requisições para Meta, ElevenLabs, Twilio e Supabase utilizam TLS/HTTPS criptografado de ponta a ponta.
- **Auditoria de Mensagens:**
  - O histórico de conversas registrado na tabela `interacoes` preserva apenas os resumos e mensagens transacionais necessárias para o atendimento do closer, evitando logar documentos confidenciais de terceiros.

## 4. Uso de Voz Sintetizada (ElevenLabs)

- A voz sintetizada é empregada de forma dosada e ética, focada exclusivamente nas mensagens estratégicas (confirmação e cerco de 5 minutos).
- Os áudios gerados não são reutilizados fora do contexto da conversa com o respectivo lead.
