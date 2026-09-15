import { rulesEngine } from './rulesEngine.js';
import { leadService } from './leadService.js';
import { xenaAgent } from '../ai/xenaAgent.js';
import { channelDispatcher } from '../channels/channelDispatcher.js';
import { elevenlabsVoice } from '../channels/elevenlabsVoice.js';
import { FilaAgendamento } from '../types/index.js';

export interface SchedulerTickResult {
  silenciososDetectados: number;
  processados: number;
}

let workerInterval: NodeJS.Timeout | null = null;
let isTicking = false;

/**
 * Executa uma passada completa de verificação do agendador:
 * 1. Monitora e ativa o Radar do Silêncio para leads inativos
 * 2. Processa e dispara todas as tarefas da fila cujo horário já chegou
 */
export async function runSchedulerTick(): Promise<SchedulerTickResult> {
  if (isTicking) {
    return { silenciososDetectados: 0, processados: 0 };
  }

  isTicking = true;
  try {
    // 1. Verifica Radar do Silêncio
    const silenciosos = await rulesEngine.checkSilenceRadar();

    // 2. Processa tarefas da Fila de Agendamento
    const processados = await rulesEngine.processPendingQueue(new Date(), async (task: FilaAgendamento) => {
      const lead = await leadService.getLeadById(task.lead_id);
      if (!lead) return;

      const mensagem = await xenaAgent.generateOutboundMessage({
        leadId: task.lead_id,
        agendamentoId: task.agendamento_id,
        tipoRegra: task.tipo_regra
      });

      // Se for cerco de 5 minutos, executa disparo simultâneo multicanal
      if (task.tipo_regra === 'cerco_5m') {
        await channelDispatcher.dispatchMultiChannel({
          leadId: lead.id,
          leadNome: lead.nome,
          telefone: lead.telefone,
          email: lead.email,
          mensagem: mensagem,
          agendamentoId: task.agendamento_id
        });
      } else {
        // Disparo via WhatsApp com nota de voz opcional
        let audioUrl: string | undefined;
        if (task.tipo_regra === 'confirmacao_imediata') {
          const voiceRes = await elevenlabsVoice.generateVoiceAudio(
            `Oi ${lead.nome}, é a Xena! Estou confirmando sua reunião aqui, até breve!`
          );
          if (voiceRes.success) audioUrl = voiceRes.audioUrl;
        }

        await channelDispatcher.sendWhatsApp({
          leadId: lead.id,
          telefone: lead.telefone,
          mensagem: mensagem,
          audioUrl,
          agendamentoId: task.agendamento_id
        });
      }
    });

    return {
      silenciososDetectados: silenciosos.length,
      processados: processados.length
    };
  } finally {
    isTicking = false;
  }
}

/**
 * Inicia o worker autônomo em background que roda o scheduler a cada intervalo
 */
export function startSchedulerWorker(intervalMs: number = 30000): void {
  if (workerInterval) return;

  console.log(`⏱️ Worker Autônomo da Xena ativo (verificando a cada ${intervalMs / 1000}s)`);

  // Executa uma primeira vez após 5 segundos
  setTimeout(() => {
    runSchedulerTick().catch(err => console.error('Erro no tick inicial do scheduler:', err));
  }, 5000);

  // Intervalo contínuo
  workerInterval = setInterval(async () => {
    try {
      const res = await runSchedulerTick();
      if (res.processados > 0 || res.silenciososDetectados > 0) {
        console.log(`⚡ [Scheduler Xena]: ${res.processados} tarefas disparadas, ${res.silenciososDetectados} leads em silêncio monitorados.`);
      }
    } catch (err) {
      console.error('Erro no ciclo do scheduler:', err);
    }
  }, intervalMs);
}

/**
 * Para o worker em background
 */
export function stopSchedulerWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('⏹️ Worker do Scheduler finalizado');
  }
}
