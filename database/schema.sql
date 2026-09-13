-- ==============================================================================
-- SCHEMA SUPABASE / POSTGRESQL — SDR IA NINA (PRÉ-VENDAS AUTÔNOMO)
-- Baseado no Case Real "Nina" (Viver de IA)
-- ==============================================================================

-- Habilitar extensão de UUID se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE status_lead_enum AS ENUM (
        'abandonou_formulario',
        'agendado',
        'confirmado',
        'radar_silencio',
        'no_show',
        'compareceu',
        'cancelado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_confirmacao_enum AS ENUM (
        'pendente',
        'confirmado_pelo_lead',
        'cancelado_pelo_lead',
        'reagendamento_solicitado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE canal_enum AS ENUM ('whatsapp', 'email', 'sms', 'audio');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE direcao_enum AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_regra_enum AS ENUM (
        'confirmacao_imediata',
        'lembrete_1h',
        'cerco_5m',
        'radar_silencio',
        'recuperacao_abandono'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_fila_enum AS ENUM ('pendente', 'processando', 'executado', 'cancelado', 'falha');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABELAS PRINCIPAIS

-- 2.1 Closers (Vendedores / Especialistas)
CREATE TABLE IF NOT EXISTS closers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Especialista Comercial',
    telefone VARCHAR(30),
    link_agenda TEXT,
    link_sala_reuniao TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(30) NOT NULL,
    ddd VARCHAR(5),
    empresa VARCHAR(150),
    cargo VARCHAR(100),
    setor VARCHAR(100),
    origem VARCHAR(100) DEFAULT 'organico',
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    status status_lead_enum DEFAULT 'agendado',
    ultimo_contato TIMESTAMPTZ,
    respondeu_ultima_mensagem BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads (telefone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);

-- 2.3 Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    closer_id UUID NOT NULL REFERENCES closers(id) ON DELETE RESTRICT,
    data_hora_reuniao TIMESTAMPTZ NOT NULL,
    status_confirmacao status_confirmacao_enum DEFAULT 'pendente',
    google_event_id VARCHAR(150),
    compareceu BOOLEAN DEFAULT NULL,
    motivo_cancelamento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_lead_id ON agendamentos (lead_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos (data_hora_reuniao);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos (status_confirmacao);

-- 2.4 Cases de Sucesso (Base de Conhecimento RAG / Match por Segmento)
CREATE TABLE IF NOT EXISTS cases_sucesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segmento VARCHAR(100) NOT NULL, -- Ex: 'saude', 'imobiliario', 'varejo', 'b2b_saas', 'educacao'
    nome_cliente VARCHAR(120) NOT NULL,
    metrica_chave VARCHAR(255) NOT NULL, -- Ex: "Aumento de 45% nas conversões em 30 dias"
    resumo_case TEXT NOT NULL, -- Resumo conciso para a Nina citar naturalmente na conversa
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_segmento ON cases_sucesso (segmento);

-- 2.5 Interações (Histórico de Conversas e Auditoria de Mensagens)
CREATE TABLE IF NOT EXISTS interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
    direcao direcao_enum NOT NULL,
    canal canal_enum NOT NULL DEFAULT 'whatsapp',
    conteudo TEXT NOT NULL,
    media_url TEXT,
    tool_calls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interacoes_lead_id ON interacoes (lead_id);

-- 2.6 Fila de Regras e Lembretes (Orquestrador Determinístico)
CREATE TABLE IF NOT EXISTS fila_agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
    tipo_regra tipo_regra_enum NOT NULL,
    executar_em TIMESTAMPTZ NOT NULL,
    status status_fila_enum DEFAULT 'pendente',
    tentativas INT DEFAULT 0,
    erro_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fila_executar ON fila_agendamentos (status, executar_em);

-- 3. SEEDS INICIAIS (EXEMPLOS PARA TESTES)

-- Closer de Exemplo
INSERT INTO closers (nome, email, cargo, telefone, link_sala_reuniao)
VALUES 
    ('Lucas Santos', 'lucas@empresa.com.br', 'Especialista em Soluções', '+5511999991111', 'https://meet.google.com/abc-defg-hij')
ON CONFLICT DO NOTHING;

-- Cases de Sucesso Iniciais
INSERT INTO cases_sucesso (segmento, nome_cliente, metrica_chave, resumo_case)
VALUES 
    ('saude', 'Clínica Vida Ativa', 'Redução de 70% no no-show de consultas', 'A Clínica Vida Ativa conseguiu lotar a agenda de 6 especialistas reduzindo faltas com confirmações automatizadas humanizadas.'),
    ('imobiliario', 'Imob Prime Imóveis', 'R$ 4.2M em VGV originado em 45 dias', 'Conseguiram garantir a presença de investidores qualificados em lançamentos de alto padrão conectando WhatsApp e ligação de confirmação.'),
    ('b2b_saas', 'TechFlow Soluções', 'Show rate de 22% para 53% em demos', 'Automatizou o follow-up pré-call e aumentou o fechamento de contratos de software corporativo.'),
    ('educacao', 'Instituto Aprender+', '3x mais matrículas no vestibular agendado', 'Recuperou candidatos que deixaram o formulário incompleto e manteve contato constante até o dia da prova.')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 4. SEGURANÇA & ROW LEVEL SECURITY (RLS) — PADRÃO LGPD
-- ==============================================================================

-- Habilita RLS em todas as tabelas com dados de leads e operação
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE closers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases_sucesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso total exclusivamente para o backend (service_role)
-- Nenhum acesso direto/anônimo é permitido via internet pública
DO $$ BEGIN
    CREATE POLICY "service_role_full_leads" ON leads FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "service_role_full_agendamentos" ON agendamentos FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "service_role_full_interacoes" ON interacoes FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "service_role_full_closers" ON closers FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "service_role_full_cases" ON cases_sucesso FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "service_role_full_fila" ON fila_agendamentos FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;
