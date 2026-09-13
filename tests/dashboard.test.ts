import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { resetDatabaseForTesting } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';
import { bookingService } from '../src/services/bookingService.js';
import { dashboardRouter } from '../src/routes/dashboardRoutes.js';

describe('Painel Operacional (Dashboard API)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve retornar métricas consolidadas com cálculo de show rate', async () => {
    const lead1 = await leadService.registerLead({ nome: 'Lead 1', telefone: '11999990001' });
    const lead2 = await leadService.registerLead({ nome: 'Lead 2', telefone: '11999990002' });

    const ag1 = await bookingService.createBooking({ leadId: lead1.id, dataHoraReuniao: new Date().toISOString() });
    await bookingService.createBooking({ leadId: lead2.id, dataHoraReuniao: new Date().toISOString() });

    await bookingService.confirmBooking(ag1.id);

    const req: any = {};
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status(c: number) { this.statusCode = c; return this; },
      json(d: any) { this.jsonData = d; return this; }
    };

    const handler = (dashboardRouter as any).stack.find((s: any) => s.route?.path === '/metrics')?.route?.stack[0]?.handle;
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.totalLeads).toBe(2);
    expect(res.jsonData.totalAgendados).toBe(2);
    expect(res.jsonData.confirmados).toBe(1);
    expect(res.jsonData.showRate).toBeDefined();
  });

  it('deve listar histórico recente de conversas com dados do lead', async () => {
    const lead = await leadService.registerLead({ nome: 'Bruna Marquezine', telefone: '11988884444' });
    const ag = await bookingService.createBooking({ leadId: lead.id, dataHoraReuniao: new Date().toISOString() });

    const req: any = { query: { limit: '10' } };
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status(c: number) { this.statusCode = c; return this; },
      json(d: any) { this.jsonData = d; return this; }
    };

    const handler = (dashboardRouter as any).stack.find((s: any) => s.route?.path === '/conversations')?.route?.stack[0]?.handle;
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.jsonData)).toBe(true);
  });
});
