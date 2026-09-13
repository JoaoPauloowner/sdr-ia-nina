import axios from 'axios';
import { config } from '../config/index.js';

export interface SendSmsOptions {
  telefone: string;
  mensagem: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export class SmsSenderAdapter {
  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) return `+${cleaned}`;
    return `+55${cleaned}`;
  }

  async sendSms(options: SendSmsOptions): Promise<SmsSendResult> {
    const to = this.formatPhone(options.telefone);

    if (config.sms.isConfigured) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.sms.twilioSid}/Messages.json`;
        const auth = Buffer.from(`${config.sms.twilioSid}:${config.sms.twilioAuthToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('From', config.sms.twilioPhoneNumber);
        params.append('Body', options.mensagem);

        const response = await axios.post(url, params.toString(), {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        return { success: true, messageId: response.data?.sid || `sms-${Date.now()}` };
      } catch (err: any) {
        console.warn('Erro ao enviar SMS via Twilio:', err.response?.data || err.message);
        return { success: false, messageId: '', error: err.message };
      }
    }

    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`
    };
  }
}

export const smsSender = new SmsSenderAdapter();
