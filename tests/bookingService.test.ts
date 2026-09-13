import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';
import { bookingService } from '../src/services/bookingService.js';

describe('Serviço de Agendamento (bookingService)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve criar um agendamento e atribuir um closer ativo automaticamente', async () => {
    const lead = await leadService.registerLead({
      nome: 'Juliana Paes',
      telefone: '11999998888',
      empresa: 'Paes & Cia'
    });

    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: '2026-09-15T15:00:00.000Z'
    });

    expect(agendamento.id).toBeDefined();
    expect(agendamento.closer_id).toBeDefined();
    expect(agendamento.status_confirmacao).toBe('pendente');

    const details = await bookingService.getBookingDetails(agendamento.id);
    expect(details?.closer.nome).toBe('Lucas Santos');
    expect(details?.lead.nome).toBe('Juliana Paes');
  });

  it('deve confirmar a reunião e atualizar o status de confirmação', async () => {
    const lead = await leadService.registerLead({
      nome: 'Marcelo Rios',
      telefone: '11988881111'
    });

    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      dataHoraReuniao: '2026-09-16T10:00:00.000Z'
    });

    const confirmado = await bookingService.confirmBooking(agendamento.id);
    expect(confirmado?.status_confirmacao).toBe('confirmado_pelo_lead');
  });
});
