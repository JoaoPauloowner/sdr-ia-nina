import { getDatabase } from '../database/supabase.js';
import { FilaAgendamento, StatusFila, TipoRegra } from '../types/index.js';

export class QueueService {
  async enqueueRule(
    leadId: string,
    agendamentoId: string,
    tipoRegra: TipoRegra,
    executarEm: Date
  ): Promise<FilaAgendamento> {
    const db = getDatabase();
    return db.fila.insert({
      lead_id: leadId,
      agendamento_id: agendamentoId,
      tipo_regra: tipoRegra,
      executar_em: executarEm.toISOString(),
      status: 'pendente',
      tentativas: 0
    });
  }

  async getPendingTasks(currentTime: Date = new Date()): Promise<FilaAgendamento[]> {
    const db = getDatabase();
    return db.fila.getPending(currentTime);
  }

  async updateTaskStatus(
    id: string, 
    status: StatusFila, 
    erroLog?: string
  ): Promise<FilaAgendamento | null> {
    const db = getDatabase();
    return db.fila.update(id, {
      status,
      erro_log: erroLog,
      updated_at: new Date().toISOString()
    });
  }

  async cancelTasksForBooking(agendamentoId: string): Promise<void> {
    const db = getDatabase();
    const all = await db.fila.listAll();
    const tasks = all.filter(t => t.agendamento_id === agendamentoId && t.status === 'pendente');
    for (const task of tasks) {
      await db.fila.update(task.id, { status: 'cancelado' });
    }
  }

  async cancelTasksForLead(leadId: string): Promise<void> {
    const db = getDatabase();
    const all = await db.fila.listAll();
    const tasks = all.filter(t => t.lead_id === leadId && t.status === 'pendente');
    for (const task of tasks) {
      await db.fila.update(task.id, { status: 'cancelado' });
    }
  }
}

export const queueService = new QueueService();
