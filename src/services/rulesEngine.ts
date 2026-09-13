import { getDatabase } from '../database/supabase.js';
import { config } from '../config/index.js';
import { FilaAgendamento, TipoRegra } from '../types/index.js';
import { bookingService } from './bookingService.js';
import { queueService } from './queueService.js';

export class RulesEngine {
  /**
   * Alavancas 1, 2 e 3: Agenda confirmação imediata (< 2min), lembrete 1h e cerco 5min.
   */
  async scheduleMeetingRules(agendamentoId: string): Promise<FilaAgendamento[]> {
    const details = await bookingService.getBookingDetails(agendamentoId);
    if (!details) throw new Error(`Agendamento ${agendamentoId} não encontrado.`);

    const { agendamento, lead } = details;
    const meetingTime = new Date(agendamento.data_hora_reuniao);
    const now = new Date();
    const createdRules: FilaAgendamento[] = [];

    // Alavanca 1: Confirmação Imediata (< 2 min do agendamento)
    const execImediata = now;
    const rule1 = await queueService.enqueueRule(
      lead.id,
      agendamento.id,
      'confirmacao_imediata',
      execImediata
    );
    createdRules.push(rule1);

    // Alavanca 2: Lembrete 1h antes
    const exec1h = new Date(meetingTime.getTime() - 60 * 60 * 1000);
    if (exec1h > now) {
      const rule2 = await queueService.enqueueRule(
        lead.id,
        agendamento.id,
        'lembrete_1h',
        exec1h
      );
      createdRules.push(rule2);
    }

    // Alavanca 3: Cerco de Última Hora (5 minutos antes)
    const exec5m = new Date(meetingTime.getTime() - 5 * 60 * 1000);
    if (exec5m > now) {
      const rule3 = await queueService.enqueueRule(
        lead.id,
        agendamento.id,
        'cerco_5m',
        exec5m
      );
      createdRules.push(rule3);
    }

    return createdRules;
  }

  /**
   * Abandono de formulário: programa recuperação em X minutos
   */
  async scheduleAbandonmentRecovery(leadId: string): Promise<FilaAgendamento> {
    const minutes = config.rules.formAbandonmentMinutes;
    const execEm = new Date(Date.now() + minutes * 60 * 1000);
    return queueService.enqueueRule(
      leadId,
      'form-abandonment',
      'recuperacao_abandono',
      execEm
    );
  }

  /**
   * Alavanca 5: Radar do Silêncio
   * Monitora leads que não responderam a nenhuma mensagem após X horas
   */
  async checkSilenceRadar(): Promise<FilaAgendamento[]> {
    const db = getDatabase();
    const leads = await db.leads.listAll();
    const cutoffTime = new Date(Date.now() - config.rules.silenceRadarHours * 60 * 60 * 1000);
    const triggered: FilaAgendamento[] = [];

    for (const lead of leads) {
      if (
        (lead.status === 'agendado' || lead.status === 'confirmado') &&
        !lead.respondeu_ultima_mensagem &&
        lead.ultimo_contato &&
        new Date(lead.ultimo_contato) <= cutoffTime
      ) {
        // Atualiza status do lead para radar_silencio
        await db.leads.update(lead.id, { status: 'radar_silencio' });

        // Agenda tarefa de reengajamento específico
        const agendamentos = await db.agendamentos.getByLeadId(lead.id);
        const agId = agendamentos[0]?.id || 'silence-ag';
        const task = await queueService.enqueueRule(
          lead.id,
          agId,
          'radar_silencio',
          new Date()
        );
        triggered.push(task);
      }
    }

    return triggered;
  }

  /**
   * Processador da fila de tarefas prontas para execução
   */
  async processPendingQueue(
    currentTime: Date = new Date(),
    handler?: (task: FilaAgendamento) => Promise<void>
  ): Promise<FilaAgendamento[]> {
    const pendingTasks = await queueService.getPendingTasks(currentTime);
    const executed: FilaAgendamento[] = [];

    for (const task of pendingTasks) {
      await queueService.updateTaskStatus(task.id, 'processando');
      try {
        if (handler) {
          await handler(task);
        } else {
          // Ação padrão: registrar interação de envio
          const db = getDatabase();
          await db.interacoes.insert({
            lead_id: task.lead_id,
            agendamento_id: task.agendamento_id,
            direcao: 'saida',
            canal: task.tipo_regra === 'cerco_5m' ? 'whatsapp' : 'whatsapp',
            conteudo: `[Execução automática de ${task.tipo_regra}]`
          });
        }
        await queueService.updateTaskStatus(task.id, 'executado');
        executed.push({ ...task, status: 'executado' });
      } catch (err: any) {
        await queueService.updateTaskStatus(task.id, 'falha', err.message);
      }
    }

    return executed;
  }
}

export const rulesEngine = new RulesEngine();
