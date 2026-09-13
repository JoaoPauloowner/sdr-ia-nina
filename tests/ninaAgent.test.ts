import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';
import { bookingService } from '../src/services/bookingService.js';
import { ninaAgent } from '../src/ai/ninaAgent.js';
import { getNinaSystemPrompt } from '../src/ai/prompt.js';

describe('Cérebro de IA da Nina (ninaAgent)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve gerar o system prompt com as variáveis de empresa e agente interpoladas', () => {
    const prompt = getNinaSystemPrompt({
      nomeAgente: 'Nina',
      nomeEmpresa: 'Viver de IA',
      tempoAbandonoMinutos: 15,
      tempoSilencioHoras: 6
    });

    expect(prompt).toContain('Você é Nina, responsável por pré-vendas de Viver de IA');
    expect(prompt).toContain('15 minutos');
    expect(prompt).toContain('6 horas');
    expect(prompt).toContain('Maximizar a taxa de comparecimento (show rate)');
  });

  it('deve gerar mensagem de confirmação imediata personalizada com closer e data', async () => {
    const lead = await leadService.registerLead({
      nome: 'Camila Pitanga',
      telefone: '11988889999',
      empresa: 'Arte & Vida',
      setor: 'saude'
    });

    const dataHora = '2026-09-18T14:30:00.000Z';
    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: dataHora
    });

    const mensagem = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'confirmacao_imediata'
    });

    expect(mensagem).toContain('Camila');
    expect(mensagem).toContain('Lucas Santos');
    expect(mensagem).toContain('confirmada');
  });

  it('deve gerar mensagem de cerco 5min antes com tom de prontidão e link de acesso', async () => {
    const lead = await leadService.registerLead({
      nome: 'Rodrigo Faro',
      telefone: '11977778888'
    });

    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: new Date().toISOString()
    });

    const mensagem = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'cerco_5m'
    });

    expect(mensagem).toContain('Rodrigo');
    expect(mensagem).toContain('minutos');
    expect(mensagem).toContain('meet.google.com');
  });

  it('deve gerar mensagem de radar do silêncio de forma direta e sem insistência agressiva', async () => {
    const lead = await leadService.registerLead({
      nome: 'Julio Cesar',
      telefone: '11966665555'
    });

    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: new Date().toISOString()
    });

    const mensagem = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'radar_silencio'
    });

    expect(mensagem).toContain('Julio');
    expect(mensagem.length).toBeGreaterThan(15);
  });

  it('deve processar resposta do lead e confirmar agendamento se lead confirmar', async () => {
    const lead = await leadService.registerLead({
      nome: 'Beatriz Ramos',
      telefone: '11955554444'
    });

    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: '2026-09-20T10:00:00.000Z'
    });

    const resposta = await ninaAgent.handleInboundMessage({
      leadId: lead.id,
      mensagem: 'Oi Nina, sim! Tá confirmado, estarei lá com certeza.',
      canal: 'whatsapp'
    });

    expect(resposta.texto).toBeDefined();
    const leadAtualizado = await leadService.getLeadById(lead.id);
    expect(leadAtualizado?.status).toBe('confirmado');
  });
});
