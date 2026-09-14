import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { getDatabase } from '../database/supabase.js';
import { TipoRegra, Canal } from '../types/index.js';
import { leadService } from '../services/leadService.js';
import { bookingService } from '../services/bookingService.js';
import { knowledgeService } from '../services/knowledgeService.js';
import { configService } from '../services/configService.js';
import { getXenaSystemPrompt } from './prompt.js';

export interface OutboundMessageRequest {
  leadId: string;
  agendamentoId: string;
  tipoRegra: TipoRegra;
}

export interface InboundMessageRequest {
  leadId: string;
  mensagem: string;
  canal?: Canal;
}

export interface InboundResponse {
  texto: string;
  actionTaken?: string;
}

export class XenaAgent {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (config.anthropic.isConfigured) {
      this.anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });
    }
  }

  private formatDate(dateStr: string): { data: string; hora: string } {
    try {
      const d = new Date(dateStr);
      const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { data, hora };
    } catch {
      return { data: 'data marcada', hora: 'horário marcado' };
    }
  }

  async generateOutboundMessage(req: OutboundMessageRequest): Promise<string> {
    const lead = await leadService.getLeadById(req.leadId);
    if (!lead) throw new Error(`Lead ${req.leadId} não encontrado`);

    const details = await bookingService.getBookingDetails(req.agendamentoId);
    const closerName = details?.closer.nome || 'nosso especialista comercial';
    const linkSala = details?.closer.link_sala_reuniao || 'https://meet.google.com/xena-reuniao';
    const { data, hora } = this.formatDate(details?.agendamento.data_hora_reuniao || new Date().toISOString());
    const caseSnippet = await knowledgeService.getFormattedCaseSnippet(lead.setor);

    // Usa o prompt dinâmico configurado no painel da Xena
    const currentConfig = configService.getConfig();
    const systemPrompt = currentConfig.systemPrompt || getXenaSystemPrompt();

    // Se a Anthropic estiver disponível (ou se uma chave customizada for colocada nas configurações)
    const activeApiKey = currentConfig.anthropicApiKey || (config.anthropic.isConfigured ? config.anthropic.apiKey : null);
    if (activeApiKey) {
      try {
        const client = new Anthropic({ apiKey: activeApiKey });
        const userPrompt = `Gere uma mensagem para o lead ${lead.nome} para a regra de disparo: ${req.tipoRegra}.
Dados do lead:
- Nome: ${lead.nome}
- Empresa: ${lead.empresa || 'Não informada'}
- Setor: ${lead.setor || 'Geral'}
- Closer responsável: ${closerName}
- Data e Hora da reunião: ${data} às ${hora}
- Link da sala: ${linkSala}
- Case de sucesso do setor: ${caseSnippet}

Instrução de tom da Xena: Curto, persuasivo, natural, sem parecer robótico, focado em garantir presença na call.`;

        const response = await client.messages.create({
          model: currentConfig.anthropicModel || config.anthropic.model,
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        });

        const textBlock = response.content.find(c => c.type === 'text');
        if (textBlock && textBlock.type === 'text') {
          return textBlock.text;
        }
      } catch (err) {
        console.warn('Fallback para geração nativa da Xena devido a erro na API:', err);
      }
    }

    // Fallback nativo determinístico e de alta conversão da Xena
    switch (req.tipoRegra) {
      case 'confirmacao_imediata':
        return `Oi ${lead.nome}! Sua reunião com ${closerName} tá confirmada para ${data} às ${hora}. ${caseSnippet ? caseSnippet + ' ' : ''}Consegue confirmar presença por aqui? 🙂`;

      case 'lembrete_1h':
        return `Oi ${lead.nome}, passando pra lembrar que nossa reunião com ${closerName} começa daqui a 1 hora (às ${hora})! Tá tudo pronto por aí? Se precisar remarcar, só me avisar.`;

      case 'cerco_5m':
        return `Oi ${lead.nome}! Faltam apenas 5 minutos para nossa reunião com ${closerName}. Estamos te aguardando na sala: ${linkSala} 🙂`;

      case 'radar_silencio':
        return `Oi ${lead.nome}, tudo bem? Como ainda não tive seu retorno sobre a reunião com ${closerName}, queria checar se você ainda tem interesse em conversarmos ou se prefere que eu libere o horário na agenda.`;

      case 'recuperacao_abandono':
        return `Oi ${lead.nome}! Vi que você começou a agendar uma demonstração mas não finalizou. Ficou alguma dúvida sobre o horário ou sobre como podemos te ajudar?`;

      default:
        return `Oi ${lead.nome}, tudo bem? Qualquer dúvida sobre a nossa reunião estou à disposição!`;
    }
  }

  async handleInboundMessage(req: InboundMessageRequest): Promise<InboundResponse> {
    const db = getDatabase();
    const lead = await leadService.getLeadById(req.leadId);
    if (!lead) throw new Error(`Lead ${req.leadId} não encontrado`);

    // Registra mensagem de entrada
    await db.interacoes.insert({
      lead_id: lead.id,
      direcao: 'entrada',
      canal: req.canal || 'whatsapp',
      conteudo: req.mensagem
    });

    await leadService.recordResponse(lead.id);

    const msgLower = req.mensagem.toLowerCase();

    // 1. Confirmação
    if (
      msgLower.includes('sim') ||
      msgLower.includes('confirma') ||
      msgLower.includes('confirmad') ||
      msgLower.includes('vou') ||
      msgLower.includes('estarei lá') ||
      msgLower.includes('com certeza') ||
      msgLower.includes('ok') ||
      msgLower.includes('beleza') ||
      msgLower.includes('positivo')
    ) {
      await leadService.markAsConfirmed(lead.id);
      const ags = await db.agendamentos.getByLeadId(lead.id);
      if (ags.length > 0) {
        await bookingService.confirmBooking(ags[0].id);
      }
      const respTexto = `Maravilha, ${lead.nome}! Presença confirmada. O link da sala já está no seu calendário e qualquer dúvida estou por aqui!`;
      await db.interacoes.insert({
        lead_id: lead.id,
        direcao: 'saida',
        canal: req.canal || 'whatsapp',
        conteudo: respTexto
      });
      return { texto: respTexto, actionTaken: 'confirmado' };
    }

    // 2. Cancelamento ou remarcação
    if (
      msgLower.includes('cancelar') ||
      msgLower.includes('cancela') ||
      msgLower.includes('não vou conseguir') ||
      msgLower.includes('imprevisto') ||
      msgLower.includes('remarcar') ||
      msgLower.includes('desmarcar')
    ) {
      await leadService.updateStatus(lead.id, 'cancelado');
      const ags = await db.agendamentos.getByLeadId(lead.id);
      if (ags.length > 0) {
        await bookingService.cancelBooking(ags[0].id, 'Cancelado pelo lead via WhatsApp');
      }
      const respTexto = `Entendido, ${lead.nome}. Cancelei seu agendamento por aqui para não ocupar seu tempo. Se quiser remarcar para outro dia mais tranquilo, é só me avisar!`;
      await db.interacoes.insert({
        lead_id: lead.id,
        direcao: 'saida',
        canal: req.canal || 'whatsapp',
        conteudo: respTexto
      });
      return { texto: respTexto, actionTaken: 'cancelado' };
    }

    // 3. Dúvida geral ou técnica
    const respTexto = `Perfeito, ${lead.nome}! Anotei sua pergunta aqui no CRM para o especialista comercial te responder em detalhes na nossa conversa. Te vejo na reunião!`;
    await db.interacoes.insert({
      lead_id: lead.id,
      direcao: 'saida',
      canal: req.canal || 'whatsapp',
      conteudo: respTexto
    });
    return { texto: respTexto, actionTaken: 'duvida_anotada' };
  }
}

export const xenaAgent = new XenaAgent();
