import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/supabase.js';
import { configService } from '../services/configService.js';
import { whatsappMeta } from '../channels/whatsappMeta.js';

export const dashboardRouter = Router();

// ==========================================
// 1. MÉTRICAS E VISÃO GERAL
// ==========================================
dashboardRouter.get('/metrics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const leads = await db.leads.listAll();
    const agendamentos = await db.agendamentos.listAll();
    const fila = await db.fila.listAll();

    const totalLeads = leads.length;
    const totalAgendados = agendamentos.length;
    const confirmados = agendamentos.filter(a => a.status_confirmacao === 'confirmado_pelo_lead').length;
    const cancelados = agendamentos.filter(a => a.status_confirmacao === 'cancelado_pelo_lead').length;
    
    const compareceu = agendamentos.filter(a => a.compareceu === true).length;
    const noShow = agendamentos.filter(a => a.compareceu === false).length;
    
    const baseShowRate = compareceu + noShow > 0
      ? Math.round((compareceu / (compareceu + noShow)) * 100)
      : totalAgendados > 0 
        ? Math.round((confirmados / totalAgendados) * 100)
        : 45;

    const abandonos = leads.filter(l => l.status === 'abandonou_formulario').length;
    const radarSilencio = leads.filter(l => l.status === 'radar_silencio').length;

    res.status(200).json({
      totalLeads,
      totalAgendados,
      confirmados,
      cancelados,
      compareceu,
      noShow,
      showRate: `${baseShowRate}%`,
      metaShowRate: '50%',
      leadsEmRadarSilencio: radarSilencio,
      abandonosDetectados: abandonos,
      tarefasFilaPendentes: fila.filter(f => f.status === 'pendente').length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CONFIGURAÇÕES DA XENA (PROMPT, ALAVANCAS, CHAVES)
// ==========================================
dashboardRouter.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg = configService.getConfig();
    res.status(200).json(cfg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.put('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = configService.updateConfig(req.body);
    res.status(200).json({ message: 'Configurações atualizadas com sucesso!', config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.post('/config/reset', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reset = configService.resetDefaults();
    res.status(200).json({ message: 'Configurações restauradas para o padrão de fábrica!', config: reset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. GESTÃO DE EQUIPE / CLOSERS (CRUD)
// ==========================================
dashboardRouter.get('/closers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const closers = await db.closers.listAll();
    res.status(200).json(closers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.post('/closers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, cargo, telefone, link_sala_reuniao, link_agenda, ativo } = req.body;
    if (!nome) {
      res.status(400).json({ error: 'Nome do closer é obrigatório.' });
      return;
    }
    const db = getDatabase();
    const newCloser = await db.closers.insert({
      nome,
      email: email || '',
      cargo: cargo || 'Especialista Comercial',
      telefone: telefone || '',
      link_sala_reuniao: link_sala_reuniao || 'https://meet.google.com/xena-meet',
      link_agenda: link_agenda || '',
      ativo: ativo ?? true
    });
    res.status(201).json(newCloser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.put('/closers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const updated = await db.closers.update(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Closer não encontrado' });
      return;
    }
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.delete('/closers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const deleted = await db.closers.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Closer não encontrado' });
      return;
    }
    res.status(200).json({ message: 'Closer excluído com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. BASE DE CONHECIMENTO / CASES RAG (CRUD)
// ==========================================
dashboardRouter.get('/cases', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const cases = await db.cases.listAll();
    res.status(200).json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.post('/cases', async (req: Request, res: Response): Promise<void> => {
  try {
    const { segmento, nome_cliente, metrica_chave, resumo_case, ativo } = req.body;
    if (!segmento || !nome_cliente || !metrica_chave) {
      res.status(400).json({ error: 'Segmento, Nome do cliente e Métrica-chave são obrigatórios.' });
      return;
    }
    const db = getDatabase();
    const newCase = await db.cases.insert({
      segmento: segmento.toLowerCase(),
      nome_cliente,
      metrica_chave,
      resumo_case: resumo_case || '',
      ativo: ativo ?? true
    });
    res.status(201).json(newCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.put('/cases/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const updated = await db.cases.update(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Case não encontrado' });
      return;
    }
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.delete('/cases/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const deleted = await db.cases.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Case não encontrado' });
      return;
    }
    res.status(200).json({ message: 'Case excluído com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CRM DE LEADS & PIPELINE
// ==========================================
dashboardRouter.get('/leads', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const leads = await db.leads.listAll();
    
    // Enriquecer com último agendamento e quantidade de mensagens
    const enriched = await Promise.all(
      leads.map(async (l) => {
        const ags = await db.agendamentos.getByLeadId(l.id);
        const lastAg = ags.length > 0 ? ags[ags.length - 1] : null;
        let closerNome = '';
        if (lastAg) {
          const c = await db.closers.getById(lastAg.closer_id);
          closerNome = c?.nome || '';
        }
        const interacoes = await db.interacoes.listByLeadId(l.id);
        return {
          ...l,
          ultimoAgendamento: lastAg?.data_hora_reuniao || null,
          statusConfirmacao: lastAg?.status_confirmacao || null,
          closerNome,
          totalInteracoes: interacoes.length,
          ultimaInteracao: interacoes.length > 0 ? interacoes[interacoes.length - 1].created_at : null
        };
      })
    );

    res.status(200).json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.get('/leads/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const lead = await db.leads.getById(id);
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    const agendamentos = await db.agendamentos.getByLeadId(id);
    const interacoes = await db.interacoes.listByLeadId(id);
    res.status(200).json({ lead, agendamentos, interacoes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.patch('/leads/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status é obrigatório' });
      return;
    }
    const db = getDatabase();
    const updated = await db.leads.update(id, { status });
    if (!updated) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.delete('/leads/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const deleted = await db.leads.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    res.status(200).json({ message: 'Lead excluído com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. INBOX AO VIVO & INTERAÇÕES EM TEMPO REAL
// ==========================================
dashboardRouter.get('/conversations', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const db = getDatabase();
    const interacoes = await db.interacoes.listRecent(limit);
    
    const result = await Promise.all(
      interacoes.map(async (i) => {
        const lead = await db.leads.getById(i.lead_id);
        return {
          ...i,
          leadNome: lead?.nome || 'Desconhecido',
          leadTelefone: lead?.telefone || '',
          leadEmpresa: lead?.empresa || '',
          leadSetor: lead?.setor || ''
        };
      })
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.get('/leads/:id/conversations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const lead = await db.leads.getById(id);
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    const interacoes = await db.interacoes.listByLeadId(id);
    res.status(200).json({ lead, interacoes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Envio manual de mensagem por operador humano ou como Xena
dashboardRouter.post('/leads/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mensagem, remetente } = req.body;
    if (!mensagem) {
      res.status(400).json({ error: 'Mensagem é obrigatória' });
      return;
    }

    const db = getDatabase();
    const lead = await db.leads.getById(id);
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }

    // Dispara via WhatsApp
    await whatsappMeta.sendTextMessage({
      telefone: lead.telefone,
      mensagem: mensagem
    });

    // Registra como interação de saída (com flag se foi operador ou IA)
    const interaction = await db.interacoes.insert({
      lead_id: lead.id,
      direcao: 'saida',
      canal: 'whatsapp',
      conteudo: remetente === 'operador' ? `[Operador Humano]: ${mensagem}` : mensagem
    });

    res.status(201).json({ message: 'Mensagem enviada com sucesso!', interaction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. FILA DE REGRAS E DISPAROS
// ==========================================
dashboardRouter.get('/fila', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const fila = await db.fila.listAll();
    const enriched = await Promise.all(
      fila.map(async (f) => {
        const lead = await db.leads.getById(f.lead_id);
        return {
          ...f,
          leadNome: lead?.nome || 'Lead',
          leadTelefone: lead?.telefone || ''
        };
      })
    );
    res.status(200).json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
