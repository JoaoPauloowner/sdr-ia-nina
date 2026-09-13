import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting, getDatabase } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';
import { bookingService } from '../src/services/bookingService.js';
import { rulesEngine } from '../src/services/rulesEngine.js';

describe('Motor de Regras Determinístico — As 6 Alavancas (rulesEngine)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve agendar automaticamente as regras temporais (confirmação imediata, 1h antes e cerco 5min)', async () => {
    const lead = await leadService.registerLead({
      nome: 'Fabio Santos',
      telefone: '11988882222',
      setor: 'imobiliario'
    });

    const dataReuniao = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 horas no futuro
    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: dataReuniao
    });

    const regrasCriadas = await rulesEngine.scheduleMeetingRules(agendamento.id);

    expect(regrasCriadas.length).toBe(3);
    const tipos = regrasCriadas.map(r => r.tipo_regra);
    expect(tipos).toContain('confirmacao_imediata');
    expect(tipos).toContain('lembrete_1h');
    expect(tipos).toContain('cerco_5m');
  });

  it('deve agendar regra de recuperação para abandono de formulário', async () => {
    const lead = await leadService.registerAbandonment({
      nome: 'Renata Lima',
      telefone: '11977773333'
    });

    const regraAbandono = await rulesEngine.scheduleAbandonmentRecovery(lead.id);

    expect(regraAbandono.tipo_regra).toBe('recuperacao_abandono');
    expect(regraAbandono.status).toBe('pendente');
  });

  it('deve identificar leads inativos através do Radar do Silêncio e disparar régua específica', async () => {
    const lead = await leadService.registerLead({
      nome: 'Silencioso Silva',
      telefone: '11966664444'
    });

    // Simular que o lead teve último contato há 8 horas e não respondeu
    const db = getDatabase();
    await db.leads.update(lead.id, {
      ultimo_contato: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      respondeu_ultima_mensagem: false
    });

    const acionados = await rulesEngine.checkSilenceRadar();
    expect(acionados.length).toBeGreaterThan(0);
    expect(acionados.some(a => a.lead_id === lead.id)).toBe(true);

    const leadAtualizado = await leadService.getLeadById(lead.id);
    expect(leadAtualizado?.status).toBe('radar_silencio');
  });

  it('deve processar fila de tarefas pendentes até o horário atual', async () => {
    const lead = await leadService.registerLead({
      nome: 'Paula Fernandes',
      telefone: '11955556666'
    });

    const dataReuniao = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: dataReuniao
    });

    await rulesEngine.scheduleMeetingRules(agendamento.id);

    // Processa fila no momento atual
    const processados = await rulesEngine.processPendingQueue(new Date());
    expect(processados.length).toBeGreaterThanOrEqual(1); // confirmação imediata deve ter sido processada
  });
});
