-- Data Model — Nina (Supabase / Postgres)
-- Referência: docs/ARCHITECTURE.md, seção 2.2

create table if not exists closers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text,
  agenda_ref text, -- referência externa de agenda (ex: id do Google Calendar)
  criado_em timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  cargo text,
  telefone text not null,
  email text,
  segmento text, -- usado para selecionar case de sucesso relevante
  origem text, -- canal de tráfego/campanha de origem
  status text not null default 'novo'
    check (status in ('novo', 'abandonado', 'agendado', 'confirmado', 'compareceu', 'nao_compareceu', 'cancelado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_leads_telefone on leads (telefone);
create index if not exists idx_leads_status on leads (status);

create table if not exists agendamentos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  closer_id uuid references closers (id),
  data_hora timestamptz not null,
  status_confirmacao text not null default 'pendente'
    check (status_confirmacao in ('pendente', 'confirmado', 'nao_confirmado', 'cancelado')),
  canal_confirmado text, -- whatsapp | email | sms | null
  evento_calendario_id text, -- referência ao evento criado no Google Calendar
  criado_em timestamptz not null default now()
);

create index if not exists idx_agendamentos_lead on agendamentos (lead_id);
create index if not exists idx_agendamentos_data on agendamentos (data_hora);

create table if not exists interacoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  canal text not null check (canal in ('whatsapp', 'email', 'sms', 'audio')),
  direcao text not null check (direcao in ('enviado', 'recebido')),
  conteudo_resumo text not null,
  enviado_em timestamptz not null default now()
);

create index if not exists idx_interacoes_lead on interacoes (lead_id);

create table if not exists cases_sucesso (
  id uuid primary key default gen_random_uuid(),
  segmento text not null,
  titulo text not null,
  resumo text not null,
  link_ou_texto text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_cases_segmento on cases_sucesso (segmento);

-- Row Level Security (ver .agents/rules/integrations.md)
alter table leads enable row level security;
alter table agendamentos enable row level security;
alter table interacoes enable row level security;

-- Políticas de exemplo — ajustar conforme modelo de autenticação do backend
-- (service role do backend deve ter acesso total; nenhum acesso público direto)
create policy "service_role_full_access_leads" on leads
  for all using (auth.role() = 'service_role');

create policy "service_role_full_access_agendamentos" on agendamentos
  for all using (auth.role() = 'service_role');

create policy "service_role_full_access_interacoes" on interacoes
  for all using (auth.role() = 'service_role');
