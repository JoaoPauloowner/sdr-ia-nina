export type StatusLead = 
  | 'abandonou_formulario'
  | 'agendado'
  | 'confirmado'
  | 'radar_silencio'
  | 'no_show'
  | 'compareceu'
  | 'cancelado';

export type StatusConfirmacao = 
  | 'pendente'
  | 'confirmado_pelo_lead'
  | 'cancelado_pelo_lead'
  | 'reagendamento_solicitado';

export type Canal = 'whatsapp' | 'email' | 'sms' | 'audio';

export type DirecaoMensagem = 'entrada' | 'saida';

export type TipoRegra = 
  | 'confirmacao_imediata'
  | 'lembrete_1h'
  | 'cerco_5m'
  | 'radar_silencio'
  | 'recuperacao_abandono';

export type StatusFila = 'pendente' | 'processando' | 'executado' | 'cancelado' | 'falha';

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  ddd?: string;
  empresa?: string;
  cargo?: string;
  setor?: string;
  origem?: string;
  utm_source?: string;
  utm_campaign?: string;
  status: StatusLead;
  ultimo_contato?: string;
  respondeu_ultima_mensagem?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Closer {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string;
  link_agenda?: string;
  link_sala_reuniao: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Agendamento {
  id: string;
  lead_id: string;
  closer_id: string;
  data_hora_reuniao: string;
  status_confirmacao: StatusConfirmacao;
  google_event_id?: string;
  compareceu?: boolean | null;
  motivo_cancelamento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CaseSucesso {
  id: string;
  segmento: string;
  nome_cliente: string;
  metrica_chave: string;
  resumo_case: string;
  ativo: boolean;
  created_at?: string;
}

export interface Interacao {
  id: string;
  lead_id: string;
  agendamento_id?: string;
  direcao: DirecaoMensagem;
  canal: Canal;
  conteudo: string;
  media_url?: string;
  tool_calls?: Record<string, unknown>;
  created_at?: string;
}

export interface FilaAgendamento {
  id: string;
  lead_id: string;
  agendamento_id: string;
  tipo_regra: TipoRegra;
  executar_em: string;
  status: StatusFila;
  tentativas?: number;
  erro_log?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookLeadInput {
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  cargo?: string;
  setor?: string;
  data_hora_reuniao?: string;
  closer_id?: string;
  abandono?: boolean;
}
