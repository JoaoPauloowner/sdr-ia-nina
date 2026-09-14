import { getDatabase } from '../database/supabase.js';
import { whatsappMeta, WhatsAppSendResult } from './whatsappMeta.js';
import { emailSender, EmailSendResult } from './emailSender.js';
import { smsSender, SmsSendResult } from './smsSender.js';

export interface DispatchWhatsAppOptions {
  leadId: string;
  telefone: string;
  mensagem: string;
  audioUrl?: string;
  agendamentoId?: string;
}

export interface DispatchMultiChannelOptions {
  leadId: string;
  leadNome: string;
  telefone: string;
  email?: string;
  mensagem: string;
  agendamentoId?: string;
}

export interface MultiChannelResult {
  whatsapp: WhatsAppSendResult;
  email: EmailSendResult;
  sms: SmsSendResult;
}

export class ChannelDispatcher {
  async sendWhatsApp(options: DispatchWhatsAppOptions): Promise<WhatsAppSendResult> {
    const db = getDatabase();
    const result = await whatsappMeta.sendTextMessage({
      telefone: options.telefone,
      mensagem: options.mensagem
    });

    if (result.success) {
      await db.interacoes.insert({
        lead_id: options.leadId,
        agendamento_id: options.agendamentoId,
        direcao: 'saida',
        canal: 'whatsapp',
        conteudo: options.mensagem
      });

      if (options.audioUrl) {
        await whatsappMeta.sendAudioMessage({
          telefone: options.telefone,
          audioUrl: options.audioUrl
        });
        await db.interacoes.insert({
          lead_id: options.leadId,
          agendamento_id: options.agendamentoId,
          direcao: 'saida',
          canal: 'audio',
          conteudo: '[Nota de voz da Xena]',
          media_url: options.audioUrl
        });
      }
    }

    return result;
  }

  async sendEmail(leadId: string, email: string, assunto: string, mensagem: string, agendamentoId?: string): Promise<EmailSendResult> {
    const db = getDatabase();
    const result = await emailSender.sendEmail({
      para: email,
      assunto,
      corpoTexto: mensagem
    });

    if (result.success) {
      await db.interacoes.insert({
        lead_id: leadId,
        agendamento_id: agendamentoId,
        direcao: 'saida',
        canal: 'email',
        conteudo: mensagem
      });
    }

    return result;
  }

  async sendSms(leadId: string, telefone: string, mensagem: string, agendamentoId?: string): Promise<SmsSendResult> {
    const db = getDatabase();
    const result = await smsSender.sendSms({
      telefone,
      mensagem
    });

    if (result.success) {
      await db.interacoes.insert({
        lead_id: leadId,
        agendamento_id: agendamentoId,
        direcao: 'saida',
        canal: 'sms',
        conteudo: mensagem
      });
    }

    return result;
  }

  /**
   * Disparo Simultâneo Multicanal (Alavanca 1 e Alavanca 3)
   */
  async dispatchMultiChannel(options: DispatchMultiChannelOptions): Promise<MultiChannelResult> {
    const [waRes, emailRes, smsRes] = await Promise.all([
      this.sendWhatsApp({
        leadId: options.leadId,
        telefone: options.telefone,
        mensagem: options.mensagem,
        agendamentoId: options.agendamentoId
      }),
      options.email
        ? this.sendEmail(
            options.leadId,
            options.email,
            `Importante: Reunião Agendada - ${options.leadNome}`,
            options.mensagem,
            options.agendamentoId
          )
        : Promise.resolve({ success: true, messageId: 'skipped-no-email' }),
      this.sendSms(
        options.leadId,
        options.telefone,
        options.mensagem,
        options.agendamentoId
      )
    ]);

    return {
      whatsapp: waRes,
      email: emailRes,
      sms: smsRes
    };
  }
}

export const channelDispatcher = new ChannelDispatcher();
