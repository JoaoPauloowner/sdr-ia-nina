import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting, getDatabase } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';
import { bookingService } from '../src/services/bookingService.js';
import { rulesEngine } from '../src/services/rulesEngine.js';
import { ninaAgent } from '../src/ai/ninaAgent.js';
import { channelDispatcher } from '../src/channels/channelDispatcher.js';

describe('Validação Fim a Fim (E2E) — Ciclo Completo das 6 Alavancas da Nina', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve executar com perfeição o ciclo completo de um lead agendado com as 6 alavancas', async () => {
    const db = getDatabase();

    // 1. Lead agenda reunião no Typeform (Alavanca 1 e Alavanca 6)
    const lead = await leadService.registerLead({
      nome: 'Guilherme Benchimol',
      telefone: '11999995555',
      email: 'guilherme@investimentos.com',
      empresa: 'Invest Capital',
      setor: 'b2b_saas'
    });

    const dataReuniao = new Date(Date.now() + 90 * 60 * 1000).toISOString(); // 1h30 no futuro
    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: dataReuniao
    });

    // 2. Orquestrador agenda as regras determinísticas
    const regras = await rulesEngine.scheduleMeetingRules(agendamento.id);
    expect(regras.length).toBe(3);

    // 3. Alavanca 1: Confirmação Imediata (< 2 min) com Case Segmentado (Alavanca 6)
    const msgConfirmacao = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'confirmacao_imediata'
    });

    expect(msgConfirmacao).toContain('Guilherme');
    expect(msgConfirmacao).toContain('TechFlow'); // Case do segmento b2b_saas

    // Disparo multicanal
    const envioMulti = await channelDispatcher.dispatchMultiChannel({
      leadId: lead.id,
      leadNome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      mensagem: msgConfirmacao,
      agendamentoId: agendamento.id
    });
    expect(envioMulti.whatsapp.success).toBe(true);

    // 4. Lead responde no WhatsApp confirmando presença
    const respostaLead = await ninaAgent.handleInboundMessage({
      leadId: lead.id,
      mensagem: 'Opa Nina, tá confirmadíssimo! Vou estar lá.',
      canal: 'whatsapp'
    });

    expect(respostaLead.actionTaken).toBe('confirmado');
    const leadAposConfirmar = await leadService.getLeadById(lead.id);
    expect(leadAposConfirmar?.status).toBe('confirmado');

    // 5. Alavanca 2: Lembrete 1h antes disparado pelo Scheduler
    const msg1h = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'lembrete_1h'
    });
    expect(msg1h).toContain('1 hora');

    // 6. Alavanca 3: Cerco de 5 minutos antes disparado simultaneamente
    const msg5m = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'cerco_5m'
    });
    expect(msg5m).toContain('5 minutos');
    expect(msg5m).toContain('meet.google.com');

    const cercoDisparo = await channelDispatcher.dispatchMultiChannel({
      leadId: lead.id,
      leadNome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      mensagem: msg5m,
      agendamentoId: agendamento.id
    });
    expect(cercoDisparo.whatsapp.success).toBe(true);
    expect(cercoDisparo.email.success).toBe(true);
    expect(cercoDisparo.sms.success).toBe(true);

    // Auditoria final das interações no banco
    const interacoes = await db.interacoes.listByLeadId(lead.id);
    expect(interacoes.length).toBeGreaterThanOrEqual(5); // Multicanal inicial + resposta lead + resposta nina + cerco multicanal
  });

  it('deve recuperar lead que abandonou o formulário após preencher contato', async () => {
    // 1. Lead preenche nome e telefone mas abandona sem agendar
    const lead = await leadService.registerAbandonment({
      nome: 'Joana Prado',
      telefone: '11988886666'
    });

    // 2. Sistema programa regra de recuperação em 15 minutos
    const regraAbandono = await rulesEngine.scheduleAbandonmentRecovery(lead.id);
    expect(regraAbandono.tipo_regra).toBe('recuperacao_abandono');

    // 3. Nina gera mensagem acolhedora sem insistência agressiva
    const msgRecuperacao = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: 'form-abandonment',
      tipoRegra: 'recuperacao_abandono'
    });

    expect(msgRecuperacao).toContain('Joana');
    expect(msgRecuperacao).toContain('não finalizou');
  });

  it('deve ativar o Radar do Silêncio para lead inativo há mais de 6 horas', async () => {
    const lead = await leadService.registerLead({
      nome: 'Carlos Eduardo',
      telefone: '11977775555'
    });

    const ag = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    // Simular que o lead não responde há mais de 6 horas
    const db = getDatabase();
    await db.leads.update(lead.id, {
      ultimo_contato: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      respondeu_ultima_mensagem: false
    });

    const acionados = await rulesEngine.checkSilenceRadar();
    expect(acionados.length).toBe(1);

    const msgSilencio = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: ag.id,
      tipoRegra: 'radar_silencio'
    });

    expect(msgSilencio).toContain('Carlos Eduardo');
    expect(msgSilencio).toContain('libere o horário na agenda');
  });
});
