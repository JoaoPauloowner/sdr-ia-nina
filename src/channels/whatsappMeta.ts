import axios from 'axios';
import { config } from '../config/index.js';

export interface SendWhatsAppTextOptions {
  telefone: string;
  mensagem: string;
}

export interface SendWhatsAppAudioOptions {
  telefone: string;
  audioUrl: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export class WhatsAppMetaAdapter {
  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) return cleaned;
    return `55${cleaned}`;
  }

  async sendTextMessage(options: SendWhatsAppTextOptions): Promise<WhatsAppSendResult> {
    const to = this.formatPhone(options.telefone);

    if (config.meta.isConfigured) {
      try {
        const url = `https://graph.facebook.com/v21.0/${config.meta.phoneNumberId}/messages`;
        const response = await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { preview_url: true, body: options.mensagem }
          },
          {
            headers: {
              Authorization: `Bearer ${config.meta.whatsappToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const wamid = response.data?.messages?.[0]?.id || `wamid-${Date.now()}`;
        return { success: true, messageId: wamid };
      } catch (err: any) {
        console.warn('Erro ao enviar via Meta Cloud API:', err.response?.data || err.message);
        return {
          success: false,
          messageId: '',
          error: err.response?.data?.error?.message || err.message
        };
      }
    }

    // Mock para desenvolvimento local / testes
    return {
      success: true,
      messageId: `mock-wamid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
  }

  async sendAudioMessage(options: SendWhatsAppAudioOptions): Promise<WhatsAppSendResult> {
    const to = this.formatPhone(options.telefone);

    if (config.meta.isConfigured) {
      try {
        const url = `https://graph.facebook.com/v21.0/${config.meta.phoneNumberId}/messages`;
        const response = await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'audio',
            audio: { link: options.audioUrl }
          },
          {
            headers: {
              Authorization: `Bearer ${config.meta.whatsappToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const wamid = response.data?.messages?.[0]?.id || `wamid-audio-${Date.now()}`;
        return { success: true, messageId: wamid };
      } catch (err: any) {
        console.warn('Erro ao enviar áudio via Meta API:', err.response?.data || err.message);
        return {
          success: false,
          messageId: '',
          error: err.response?.data?.error?.message || err.message
        };
      }
    }

    return {
      success: true,
      messageId: `mock-wamid-audio-${Date.now()}`
    };
  }
}

export const whatsappMeta = new WhatsAppMetaAdapter();
