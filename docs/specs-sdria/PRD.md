# PRD — Nina, Agente de Pré-Vendas Autônomo

## 1. Contexto e Problema

Empresas que investem em tráfego pago para gerar leads enfrentam uma perda estrutural entre "lead agendou reunião" e "lead compareceu à reunião" (no-show). No case de referência, essa perda era de 79%: a cada 5 pessoas que agendavam, 4 não apareciam. Isso significa que grande parte do investimento em mídia paga é queimado antes mesmo de o time comercial ter a chance de vender.

A solução tradicional — montar um time de pré-vendas humano para fazer follow-up — tem custo alto (contratação, treinamento, turnover, gestão) e não escala de forma consistente: humanos erram timing, esquecem toques, não personalizam cada contato com a mesma qualidade.

## 2. Objetivo do Produto

Construir um agente de IA que execute, de forma autônoma e sem erro, o processo do "melhor time de pré-vendas do mundo": confirmar, lembrar, personalizar e recuperar leads ao longo da jornada entre agendamento e reunião.

## 3. Metas Mensuráveis (baseadas no case de referência)

| Métrica | Baseline | Meta |
|---|---|---|
| Show rate (comparecimento) | ~21% | 40%+ (meta declarada no case: ~50%) |
| Investimento em tráfego pago para o mesmo volume de vendas | — | Redução proporcional ao ganho de eficiência |
| Tempo de resposta ao lead após agendamento | — | < 2 minutos |
| Recuperação de formulários abandonados | 0% (não existia) | Ativa para todo lead que preencheu nome + telefone |

## 4. Escopo Funcional

### 4.1 Dentro do escopo (MVP, conforme descrito no case)

- **Confirmação automática** de reunião assim que o lead agenda, disparada em WhatsApp, e-mail e SMS
- **Lembrete 1 hora antes** do horário marcado
- **Lembrete 5 minutos antes** do horário marcado
- **Integração com CRM** para puxar o nome do responsável comercial (closer) que vai atender o lead
- **Integração com calendário** (Google Calendar) para criar evento na agenda do próprio lead
- **Base de conhecimento com cases por segmento** — o agente identifica o setor do lead e envia um case de sucesso relevante
- **Recuperação de formulário abandonado** — se o lead preencheu nome/telefone mas não concluiu o agendamento, o agente reativa a conversa via WhatsApp
- **Régua de silêncio** — leads que não respondem a nenhuma mensagem entram em uma sequência de reengajamento diferente da régua padrão
- **Resposta em áudio** (voz sintetizada) para mensagens de maior relevância
- **Painel de operação** — dashboard onde é possível acompanhar as conversas da IA em tempo real
- **Registro de toda interação no CRM** (canal, horário, conteúdo, status de confirmação)

### 4.2 Fora do escopo (explicitamente, conforme o case)

- O agente **não conduz negociação comercial** (preço, contrato, desconto)
- O agente **não decide sozinho horários de disparo** — isso é regra de negócio fixa, não decisão do modelo generativo
- O agente **não substitui o closer** na reunião de demonstração — sua função termina no comparecimento
- Nenhuma ferramenta de automação de terceiros (n8n, Zapier, Make) faz parte do escopo — a integração é construída diretamente

## 5. Personas

- **Lead** — pessoa que preencheu o formulário e/ou agendou reunião de demonstração
- **Closer/Vendedor** — responsável comercial que conduz a reunião, precisa saber que o lead está confirmado e com que contexto chega
- **Gestor de marketing/vendas** — acompanha o painel de operação e o show rate como KPI central

## 6. Requisitos Não Funcionais

- Tempo de resposta do agente a uma mensagem recebida: até poucos segundos, para não parecer um bot lento
- Toda decisão crítica (quando disparar, o que dizer sobre preço/produto) deve ser guiada por regras explícitas, não pela decisão livre do modelo generativo
- Toda comunicação deve ser rastreável: cada mensagem enviada precisa estar registrada no CRM com timestamp e canal
- O sistema deve suportar múltiplos canais simultâneos (WhatsApp, e-mail, SMS) sem duplicar contato desnecessário

## 7. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Agente alucina informação sobre produto/preço | Restringir respostas à base de conhecimento; nunca permitir invenção de condição comercial |
| Excesso de mensagens gera irritação no lead | Réguas com limite de toques e canal único por etapa quando possível |
| Falha de integração com CRM gera dado desatualizado | Validação de escrita no CRM a cada atualização de status |
| Voz sintetizada soa artificial e quebra confiança | Uso moderado, só em mensagens de maior importância, conforme o case |

## 8. Critério de Aceite do MVP

O MVP está pronto quando o fluxo completo — do preenchimento do formulário até a reunião confirmada, incluindo recuperação de abandono e envio de case por segmento — roda de ponta a ponta sem intervenção manual, com todos os eventos registrados no CRM e visíveis no painel de operação.
