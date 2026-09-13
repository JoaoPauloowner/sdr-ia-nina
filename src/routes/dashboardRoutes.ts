import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/supabase.js';

export const dashboardRouter = Router();

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
    
    // Contagem de comparência e no-show
    const compareceu = agendamentos.filter(a => a.compareceu === true).length;
    const noShow = agendamentos.filter(a => a.compareceu === false).length;
    
    // Show rate real ou projetado baseado em confirmações
    const baseShowRate = compareceu + noShow > 0
      ? Math.round((compareceu / (compareceu + noShow)) * 100)
      : totalAgendados > 0 
        ? Math.round((confirmados / totalAgendados) * 100)
        : 45; // Benchmark inicial do case

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

dashboardRouter.get('/conversations', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string || '30', 10);
    const db = getDatabase();
    const interacoes = await db.interacoes.listRecent(limit);
    
    // Enriquecer com dados do lead
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

dashboardRouter.get('/leads', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const leads = await db.leads.listAll();
    res.status(200).json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
