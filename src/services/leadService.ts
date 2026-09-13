import { getDatabase } from '../database/supabase.js';
import { Lead, StatusLead } from '../types/index.js';

export interface RegisterLeadDTO {
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  cargo?: string;
  setor?: string;
  origem?: string;
  utm_source?: string;
  utm_campaign?: string;
}

export class LeadService {
  private extractDdd(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      // Se tiver DDI 55
      if (cleaned.startsWith('55') && cleaned.length >= 12) {
        return cleaned.substring(2, 4);
      }
      return cleaned.substring(0, 2);
    }
    return '11';
  }

  async registerLead(data: RegisterLeadDTO): Promise<Lead> {
    const db = getDatabase();
    const ddd = this.extractDdd(data.telefone);

    // Verificar se já existe pelo telefone
    const existing = await db.leads.getByPhone(data.telefone);
    if (existing) {
      const updated = await db.leads.update(existing.id, {
        nome: data.nome || existing.nome,
        email: data.email || existing.email,
        empresa: data.empresa || existing.empresa,
        cargo: data.cargo || existing.cargo,
        setor: data.setor || existing.setor,
        status: 'agendado',
        updated_at: new Date().toISOString()
      });
      return updated || existing;
    }

    return db.leads.insert({
      ...data,
      ddd,
      status: 'agendado',
      respondeu_ultima_mensagem: false
    });
  }

  async registerAbandonment(data: { nome: string; telefone: string; email?: string }): Promise<Lead> {
    const db = getDatabase();
    const ddd = this.extractDdd(data.telefone);

    const existing = await db.leads.getByPhone(data.telefone);
    if (existing) {
      const updated = await db.leads.update(existing.id, {
        status: 'abandonou_formulario',
        updated_at: new Date().toISOString()
      });
      return updated || existing;
    }

    return db.leads.insert({
      ...data,
      ddd,
      status: 'abandonou_formulario',
      respondeu_ultima_mensagem: false
    });
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const db = getDatabase();
    return db.leads.getById(id);
  }

  async getLeadByPhone(phone: string): Promise<Lead | null> {
    const db = getDatabase();
    return db.leads.getByPhone(phone);
  }

  async updateStatus(id: string, status: StatusLead): Promise<Lead | null> {
    const db = getDatabase();
    return db.leads.update(id, { status });
  }

  async markAsConfirmed(id: string): Promise<Lead | null> {
    const db = getDatabase();
    return db.leads.update(id, {
      status: 'confirmado',
      respondeu_ultima_mensagem: true,
      ultimo_contato: new Date().toISOString()
    });
  }

  async recordResponse(id: string): Promise<Lead | null> {
    const db = getDatabase();
    return db.leads.update(id, {
      respondeu_ultima_mensagem: true,
      ultimo_contato: new Date().toISOString()
    });
  }

  async listAll(): Promise<Lead[]> {
    const db = getDatabase();
    return db.leads.listAll();
  }
}

export const leadService = new LeadService();
