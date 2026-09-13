import { getDatabase } from '../database/supabase.js';
import { Agendamento, Closer, Lead, StatusConfirmacao } from '../types/index.js';

export interface CreateBookingDTO {
  leadId: string;
  dataHoraReuniao: string;
  closerId?: string;
}

export interface BookingDetails {
  agendamento: Agendamento;
  lead: Lead;
  closer: Closer;
}

export class BookingService {
  async createBooking(data: CreateBookingDTO): Promise<Agendamento> {
    const db = getDatabase();

    let closerId = data.closerId;
    if (!closerId) {
      const activeClosers = await db.closers.getActive();
      if (activeClosers.length > 0) {
        // Escolher o primeiro ou fazer rodízio
        closerId = activeClosers[0].id;
      } else {
        // Criar closer padrão de fallback se não houver
        const fallback = await db.closers.insert({
          nome: 'Lucas Santos',
          email: 'lucas@empresa.com.br',
          cargo: 'Especialista Comercial',
          link_sala_reuniao: 'https://meet.google.com/abc-demo'
        });
        closerId = fallback.id;
      }
    }

    const agendamento = await db.agendamentos.insert({
      lead_id: data.leadId,
      closer_id: closerId,
      data_hora_reuniao: data.dataHoraReuniao,
      status_confirmacao: 'pendente'
    });

    return agendamento;
  }

  async getBookingDetails(id: string): Promise<BookingDetails | null> {
    const db = getDatabase();
    const agendamento = await db.agendamentos.getById(id);
    if (!agendamento) return null;

    const lead = await db.leads.getById(agendamento.lead_id);
    const closer = await db.closers.getById(agendamento.closer_id);

    if (!lead || !closer) return null;

    return { agendamento, lead, closer };
  }

  async confirmBooking(id: string): Promise<Agendamento | null> {
    const db = getDatabase();
    return db.agendamentos.update(id, {
      status_confirmacao: 'confirmado_pelo_lead',
      updated_at: new Date().toISOString()
    });
  }

  async cancelBooking(id: string, motivo?: string): Promise<Agendamento | null> {
    const db = getDatabase();
    return db.agendamentos.update(id, {
      status_confirmacao: 'cancelado_pelo_lead',
      motivo_cancelamento: motivo,
      updated_at: new Date().toISOString()
    });
  }

  async listAll(): Promise<Agendamento[]> {
    const db = getDatabase();
    return db.agendamentos.listAll();
  }
}

export const bookingService = new BookingService();
