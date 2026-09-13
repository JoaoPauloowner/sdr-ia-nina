import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { resetDatabaseForTesting, getDatabase } from '../src/database/supabase.js';
import { webhookRouter } from '../src/routes/webhookRoutes.js';
import { dashboardRouter } from '../src/routes/dashboardRoutes.js';

describe('Endpoints de Webhooks e API do Servidor', () => {
  let app: express.Express;

  beforeEach(() => {
    resetDatabaseForTesting();
    app = express();
    app.use(express.json());
    app.use('/api/webhooks', webhookRouter);
    app.use('/api/dashboard', dashboardRouter);
  });

  it('deve processar webhook de formulário concluído com agendamento', async () => {
    const payload = {
      nome: 'Mariana Ximenes',
      telefone: '11988883333',
      email: 'mariana@ximenes.com',
      empresa: 'Ximenes Produtora',
      setor: 'varejo',
      data_hora_reuniao: '2026-09-22T16:00:00.000Z'
    };

    // Simulação direta de requisição HTTP interna
    const req: any = { body: payload };
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status(c: number) { this.statusCode = c; return this; },
      json(d: any) { this.jsonData = d; return this; }
    };

    // Executa rota de formulário
    const handler = (webhookRouter as any).stack.find((s: any) => s.route?.path === '/lead-form')?.route?.stack[0]?.handle;
    expect(handler).toBeDefined();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.agendamentoId).toBeDefined();

    const db = getDatabase();
    const leads = await db.leads.listAll();
    expect(leads.some(l => l.telefone.includes('11988883333'))).toBe(true);
  });

  it('deve processar webhook de abandono de formulário', async () => {
    const payload = {
      nome: 'Lead Desistente',
      telefone: '11977772222',
      abandono: true
    };

    const req: any = { body: payload };
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status(c: number) { this.statusCode = c; return this; },
      json(d: any) { this.jsonData = d; return this; }
    };

    const handler = (webhookRouter as any).stack.find((s: any) => s.route?.path === '/lead-form')?.route?.stack[0]?.handle;
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.status).toBe('abandonou_formulario');
  });

  it('deve responder à verificação de webhook da Meta com challenge', async () => {
    const req: any = {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'nina_verify_token',
        'hub.challenge': 'challenge_code_123'
      }
    };
    const res: any = {
      statusCode: 200,
      sentData: null,
      status(c: number) { this.statusCode = c; return this; },
      send(d: any) { this.sentData = d; return this; }
    };

    const handler = (webhookRouter as any).stack.find((s: any) => s.route?.path === '/meta-whatsapp' && s.route?.methods?.get)?.route?.stack[0]?.handle;
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.sentData).toBe('challenge_code_123');
  });
});
