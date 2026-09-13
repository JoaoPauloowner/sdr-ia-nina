import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { 
  Lead, 
  Closer, 
  Agendamento, 
  CaseSucesso, 
  Interacao, 
  FilaAgendamento 
} from '../types/index.js';

export interface DatabaseAdapter {
  leads: {
    insert(lead: Partial<Lead>): Promise<Lead>;
    update(id: string, updates: Partial<Lead>): Promise<Lead | null>;
    getById(id: string): Promise<Lead | null>;
    getByPhone(phone: string): Promise<Lead | null>;
    listAll(): Promise<Lead[]>;
  };
  closers: {
    insert(closer: Partial<Closer>): Promise<Closer>;
    getById(id: string): Promise<Closer | null>;
    getActive(): Promise<Closer[]>;
  };
  agendamentos: {
    insert(agendamento: Partial<Agendamento>): Promise<Agendamento>;
    update(id: string, updates: Partial<Agendamento>): Promise<Agendamento | null>;
    getById(id: string): Promise<Agendamento | null>;
    getByLeadId(leadId: string): Promise<Agendamento[]>;
    listAll(): Promise<Agendamento[]>;
  };
  cases: {
    insert(c: Partial<CaseSucesso>): Promise<CaseSucesso>;
    getBySegment(segment: string): Promise<CaseSucesso | null>;
    listAll(): Promise<CaseSucesso[]>;
  };
  interacoes: {
    insert(interacao: Partial<Interacao>): Promise<Interacao>;
    listByLeadId(leadId: string): Promise<Interacao[]>;
    listRecent(limit?: number): Promise<Interacao[]>;
  };
  fila: {
    insert(item: Partial<FilaAgendamento>): Promise<FilaAgendamento>;
    update(id: string, updates: Partial<FilaAgendamento>): Promise<FilaAgendamento | null>;
    getPending(upToDate?: Date): Promise<FilaAgendamento[]>;
    listAll(): Promise<FilaAgendamento[]>;
  };
}

// Implementação em memória para testes e fallback
class InMemoryDatabaseAdapter implements DatabaseAdapter {
  public leadsList: Lead[] = [];
  public closersList: Closer[] = [];
  public agendamentosList: Agendamento[] = [];
  public casesList: CaseSucesso[] = [];
  public interacoesList: Interacao[] = [];
  public filaList: FilaAgendamento[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Closer padrão do case
    this.closersList.push({
      id: 'closer-lucas-01',
      nome: 'Lucas Santos',
      email: 'lucas@empresa.com.br',
      cargo: 'Especialista em Soluções Comerciais',
      telefone: '+5511999991111',
      link_agenda: 'https://cal.com/lucas-santos',
      link_sala_reuniao: 'https://meet.google.com/abc-nina-demo',
      ativo: true,
      created_at: new Date().toISOString(),
    });

    // Cases de sucesso por setor
    this.casesList.push(
      {
        id: 'case-saude',
        segmento: 'saude',
        nome_cliente: 'Clínica Vida Ativa',
        metrica_chave: 'Redução de 70% no no-show de consultas',
        resumo_case: 'A Clínica Vida Ativa reduziu faltas em 70% usando confirmações humanizadas no WhatsApp.',
        ativo: true,
      },
      {
        id: 'case-imob',
        segmento: 'imobiliario',
        nome_cliente: 'Imob Prime',
        metrica_chave: 'R$ 4.2M em VGV originado em 45 dias',
        resumo_case: 'A Imob Prime garantiu 85% de presença de compradores qualificados combinando WhatsApp e áudio.',
        ativo: true,
      },
      {
        id: 'case-saas',
        segmento: 'b2b_saas',
        nome_cliente: 'TechFlow Soluções',
        metrica_chave: 'Show rate de 22% para 54% em demonstrações',
        resumo_case: 'A TechFlow saltou de 22% para 54% no comparecimento das demos após adotar o cerco multicanal.',
        ativo: true,
      }
    );
  }

  leads = {
    insert: async (lead: Partial<Lead>): Promise<Lead> => {
      const newLead: Lead = {
        id: lead.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        nome: lead.nome || 'Lead sem nome',
        telefone: lead.telefone || '',
        email: lead.email,
        empresa: lead.empresa,
        cargo: lead.cargo,
        setor: lead.setor,
        ddd: lead.ddd || lead.telefone?.replace(/\D/g, '').substr(2, 2) || '11',
        origem: lead.origem || 'formulario',
        status: lead.status || 'agendado',
        respondeu_ultima_mensagem: lead.respondeu_ultima_mensagem || false,
        created_at: lead.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.leadsList.push(newLead);
      return newLead;
    },
    update: async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
      const idx = this.leadsList.findIndex(l => l.id === id);
      if (idx === -1) return null;
      this.leadsList[idx] = {
        ...this.leadsList[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return this.leadsList[idx];
    },
    getById: async (id: string): Promise<Lead | null> => {
      return this.leadsList.find(l => l.id === id) || null;
    },
    getByPhone: async (phone: string): Promise<Lead | null> => {
      const clean = phone.replace(/\D/g, '');
      return this.leadsList.find(l => l.telefone.replace(/\D/g, '') === clean) || null;
    },
    listAll: async (): Promise<Lead[]> => {
      return [...this.leadsList];
    }
  };

  closers = {
    insert: async (closer: Partial<Closer>): Promise<Closer> => {
      const newCloser: Closer = {
        id: closer.id || `closer-${Date.now()}`,
        nome: closer.nome || 'Closer',
        email: closer.email || '',
        cargo: closer.cargo || 'Especialista Comercial',
        link_sala_reuniao: closer.link_sala_reuniao || 'https://meet.google.com/default',
        ativo: closer.ativo ?? true,
        created_at: new Date().toISOString(),
      };
      this.closersList.push(newCloser);
      return newCloser;
    },
    getById: async (id: string): Promise<Closer | null> => {
      return this.closersList.find(c => c.id === id) || null;
    },
    getActive: async (): Promise<Closer[]> => {
      return this.closersList.filter(c => c.ativo);
    }
  };

  agendamentos = {
    insert: async (agendamento: Partial<Agendamento>): Promise<Agendamento> => {
      const newAg: Agendamento = {
        id: agendamento.id || `ag-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        lead_id: agendamento.lead_id!,
        closer_id: agendamento.closer_id!,
        data_hora_reuniao: agendamento.data_hora_reuniao || new Date().toISOString(),
        status_confirmacao: agendamento.status_confirmacao || 'pendente',
        compareceu: agendamento.compareceu ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.agendamentosList.push(newAg);
      return newAg;
    },
    update: async (id: string, updates: Partial<Agendamento>): Promise<Agendamento | null> => {
      const idx = this.agendamentosList.findIndex(a => a.id === id);
      if (idx === -1) return null;
      this.agendamentosList[idx] = {
        ...this.agendamentosList[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return this.agendamentosList[idx];
    },
    getById: async (id: string): Promise<Agendamento | null> => {
      return this.agendamentosList.find(a => a.id === id) || null;
    },
    getByLeadId: async (leadId: string): Promise<Agendamento[]> => {
      return this.agendamentosList.filter(a => a.lead_id === leadId);
    },
    listAll: async (): Promise<Agendamento[]> => {
      return [...this.agendamentosList];
    }
  };

  cases = {
    insert: async (c: Partial<CaseSucesso>): Promise<CaseSucesso> => {
      const newCase: CaseSucesso = {
        id: c.id || `case-${Date.now()}`,
        segmento: c.segmento?.toLowerCase() || 'geral',
        nome_cliente: c.nome_cliente || '',
        metrica_chave: c.metrica_chave || '',
        resumo_case: c.resumo_case || '',
        ativo: c.ativo ?? true,
        created_at: new Date().toISOString(),
      };
      this.casesList.push(newCase);
      return newCase;
    },
    getBySegment: async (segment: string): Promise<CaseSucesso | null> => {
      const target = segment.toLowerCase();
      const match = this.casesList.find(c => c.ativo && (
        c.segmento.includes(target) || target.includes(c.segmento)
      ));
      return match || this.casesList[0] || null;
    },
    listAll: async (): Promise<CaseSucesso[]> => {
      return [...this.casesList];
    }
  };

  interacoes = {
    insert: async (interacao: Partial<Interacao>): Promise<Interacao> => {
      const item: Interacao = {
        id: interacao.id || `int-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        lead_id: interacao.lead_id!,
        agendamento_id: interacao.agendamento_id,
        direcao: interacao.direcao || 'saida',
        canal: interacao.canal || 'whatsapp',
        conteudo: interacao.conteudo || '',
        media_url: interacao.media_url,
        tool_calls: interacao.tool_calls,
        created_at: new Date().toISOString(),
      };
      this.interacoesList.push(item);
      return item;
    },
    listByLeadId: async (leadId: string): Promise<Interacao[]> => {
      return this.interacoesList.filter(i => i.lead_id === leadId);
    },
    listRecent: async (limit: number = 50): Promise<Interacao[]> => {
      return [...this.interacoesList].reverse().slice(0, limit);
    }
  };

  fila = {
    insert: async (item: Partial<FilaAgendamento>): Promise<FilaAgendamento> => {
      const novaRegra: FilaAgendamento = {
        id: item.id || `fila-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        lead_id: item.lead_id!,
        agendamento_id: item.agendamento_id!,
        tipo_regra: item.tipo_regra!,
        executar_em: item.executar_em || new Date().toISOString(),
        status: item.status || 'pendente',
        tentativas: item.tentativas || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.filaList.push(novaRegra);
      return novaRegra;
    },
    update: async (id: string, updates: Partial<FilaAgendamento>): Promise<FilaAgendamento | null> => {
      const idx = this.filaList.findIndex(f => f.id === id);
      if (idx === -1) return null;
      this.filaList[idx] = {
        ...this.filaList[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return this.filaList[idx];
    },
    getPending: async (upToDate: Date = new Date()): Promise<FilaAgendamento[]> => {
      return this.filaList.filter(f => 
        f.status === 'pendente' && new Date(f.executar_em) <= upToDate
      );
    },
    listAll: async (): Promise<FilaAgendamento[]> => {
      return [...this.filaList];
    }
  };
}

// Instância singleton do banco
let dbInstance: DatabaseAdapter | null = null;
let rawSupabaseClient: SupabaseClient | null = null;

export function getDatabase(): DatabaseAdapter {
  if (dbInstance) return dbInstance;

  if (config.supabase.isConfigured) {
    try {
      rawSupabaseClient = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey
      );
      // Aqui teríamos o adapter conectado direto ao Supabase
      // Para manter a máxima confiabilidade, fallback transparente caso dê erro de conexão
    } catch (e) {
      console.warn('Supabase não respondeu, usando adapter em memória:', e);
    }
  }

  // Se não configurado ou se cair no fallback
  dbInstance = new InMemoryDatabaseAdapter();
  return dbInstance;
}

export function resetDatabaseForTesting(): InMemoryDatabaseAdapter {
  const memDb = new InMemoryDatabaseAdapter();
  dbInstance = memDb;
  return memDb;
}
