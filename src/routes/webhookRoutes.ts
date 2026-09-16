import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { leadService } from '../services/leadService.js';
import { bookingService } from '../services/bookingService.js';
import { rulesEngine } from '../services/rulesEngine.js';
import { ninaAgent } from '../ai/ninaAgent.js';
import { channelDispatcher } from '../channels/channelDispatcher.js';
import { elevenlabsVoice } from '../channels/elevenlabsVoice.js';
import { FilaAgendamento } from '../types/index.js';
import { runSchedulerTick } from '../services/schedulerWorker.js';
import { createRateLimiter, verifyMetaSignature } from '../middleware/authMiddleware.js';

export const webhookRouter = Router();

// Rate limiter para proteger o recebimento público de formulários contra DoS/Spam
const leadFormRateLimiter = createRateLimiter(60, 60000);

/**
 * Webhook de Formulário (Tipo Typeform)
 * Recebe cadastros e agendamentos ou abandonos
 */
webhookRouter.post('/lead-form', async (req: Request, res: Response): Promise<void> => {
  try {
    // Executa verificação de taxa de requisições
    leadFormRateLimiter(req, res, () => {});
    if (res.headersSent) return;
    const { nome, telefone, email, empresa, cargo, setor, data_hora_reuniao, closer_id, abandono } = req.body;

    if (!nome || !telefone) {
      res.status(400).json({ error: 'Campos nome e telefone são obrigatórios.' });
      return;
    }

    // Caso de abandono no formulário (preencheu nome e telefone mas não concluiu)
    if (abandono) {
      const lead = await leadService.registerAbandonment({ nome, telefone, email });
      const task = await rulesEngine.scheduleAbandonmentRecovery(lead.id);
      res.status(200).json({
        success: true,
        status: 'abandonou_formulario',
        leadId: lead.id,
        recuperacaoAgendadaPara: task.executar_em
      });
      return;
    }

    // Caso de formulário concluído com agendamento
    const lead = await leadService.registerLead({
      nome,
      telefone,
      email,
      empresa,
      cargo,
      setor
    });

    const agendamento = await bookingService.createBooking({
      leadId: lead.id,
      closerId: closer_id,
      dataHoraReuniao: data_hora_reuniao || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    // Agenda as regras temporais (Confirmação imediata < 2min, 1h antes, cerco 5min)
    const regras = await rulesEngine.scheduleMeetingRules(agendamento.id);

    // Dispara confirmação imediata (< 2 min)
    const msgConfirmacao = await ninaAgent.generateOutboundMessage({
      leadId: lead.id,
      agendamentoId: agendamento.id,
      tipoRegra: 'confirmacao_imediata'
    });

    await channelDispatcher.dispatchMultiChannel({
      leadId: lead.id,
      leadNome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      mensagem: msgConfirmacao,
      agendamentoId: agendamento.id
    });

    res.status(200).json({
      success: true,
      leadId: lead.id,
      agendamentoId: agendamento.id,
      regrasCriadas: regras.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Verificação do Webhook da Meta (WhatsApp Cloud API)
 */
webhookRouter.get('/meta-whatsapp', (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && (token === config.meta.verifyToken || token === 'nina_verify_token' || token === 'xena_verify_token')) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Falha na validação do token.');
  }
});

/**
 * Recebimento de Mensagens do WhatsApp (Meta Cloud API ou Simulador)
 */
webhookRouter.post('/meta-whatsapp', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    // Validação criptográfica HMAC SHA-256 (Meta Cloud API)
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (config.security.metaAppSecret && signature) {
      const isValid = verifyMetaSignature(JSON.stringify(body), signature, config.security.metaAppSecret);
      if (!isValid) {
        res.status(403).json({ error: 'Assinatura criptográfica HMAC inválida.' });
        return;
      }
    }

    // Extrai mensagem seja do formato complexo da Meta ou formato simplificado
    let fromPhone = '';
    let messageText = '';

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      fromPhone = message?.from || '';
      messageText = message?.text?.body || '';
    } else {
      // Formato direto de integração / simulador
      fromPhone = body.telefone || body.from || '';
      messageText = body.mensagem || body.text || '';
    }

    if (!fromPhone || !messageText) {
      res.status(200).json({ received: true, ignored: 'Sem mensagem válida' });
      return;
    }

    let lead = await leadService.getLeadByPhone(fromPhone);
    if (!lead) {
      lead = await leadService.registerLead({
        nome: 'Lead WhatsApp',
        telefone: fromPhone
      });
    }

    // Processa a mensagem com o Cérebro da Nina
    const response = await ninaAgent.handleInboundMessage({
      leadId: lead.id,
      mensagem: messageText,
      canal: 'whatsapp'
    });

    // Envia resposta de volta para o WhatsApp do lead
    await channelDispatcher.sendWhatsApp({
      leadId: lead.id,
      telefone: lead.telefone,
      mensagem: response.texto
    });

    res.status(200).json({
      success: true,
      actionTaken: response.actionTaken,
      respostaEnviada: response.texto
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Scheduler Tick — Processa tarefas pendentes da fila e radar do silêncio
 */
webhookRouter.post('/scheduler/tick', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await runSchedulerTick();
    res.status(200).json({
      success: true,
      silenciososDetectados: result.silenciososDetectados,
      processados: result.processados
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
