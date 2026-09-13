import axios from 'axios';
import { config } from '../config/index.js';

export interface SendEmailOptions {
  para: string;
  assunto: string;
  corpoTexto: string;
  corpoHtml?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export class EmailSenderAdapter {
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    if (config.email.isConfigured) {
      try {
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: config.email.from,
            to: [options.para],
            subject: options.assunto,
            text: options.corpoTexto,
            html: options.corpoHtml || `<p>${options.corpoTexto.replace(/\n/g, '<br>')}</p>`
          },
          {
            headers: {
              Authorization: `Bearer ${config.email.resendApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true, messageId: response.data?.id || `email-${Date.now()}` };
      } catch (err: any) {
        console.warn('Erro ao enviar e-mail via Resend:', err.response?.data || err.message);
        return { success: false, messageId: '', error: err.message };
      }
    }

    return {
      success: true,
      messageId: `mock-email-${Date.now()}`
    };
  }
}

export const emailSender = new EmailSenderAdapter();
