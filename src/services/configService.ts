import { config } from '../config/index.js';
import { getXenaSystemPrompt } from '../ai/prompt.js';

export interface LeverSettings {
  confirmacaoImediataMinutos: number;
  lembreteD1HorasAntes: number;
  cerco5MinutosAntes: number;
  radarSilencioHoras: number;
  recuperacaoAbandonoMinutos: number;
  reengajamentoNoShowMinutos: number;
}

export interface ProductConfig {
  agentName: string;
  companyName: string;
  systemPrompt: string;
  levers: LeverSettings;
  anthropicApiKey?: string;
  anthropicModel?: string;
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string;
  metaWhatsAppToken?: string;
  metaPhoneNumberId?: string;
}

const defaultLevers: LeverSettings = {
  confirmacaoImediataMinutos: 2,
  lembreteD1HorasAntes: 24,
  cerco5MinutosAntes: 5,
  radarSilencioHoras: 6,
  recuperacaoAbandonoMinutos: 15,
  reengajamentoNoShowMinutos: 15
};

class ConfigService {
  private currentConfig: ProductConfig;

  constructor() {
    this.currentConfig = this.buildDefaultConfig();
  }

  private buildDefaultConfig(): ProductConfig {
    return {
      agentName: 'Xena',
      companyName: 'Nossa Empresa',
      systemPrompt: getXenaSystemPrompt('Xena'),
      levers: { ...defaultLevers },
      anthropicApiKey: config.anthropic.apiKey || '',
      anthropicModel: config.anthropic.model || 'claude-3-5-haiku-latest',
      elevenlabsApiKey: config.elevenlabs.apiKey || '',
      elevenlabsVoiceId: config.elevenlabs.voiceId || '21m00Tcm4TlvDq8ikWAM',
      metaWhatsAppToken: config.meta.whatsappToken || '',
      metaPhoneNumberId: config.meta.phoneNumberId || ''
    };
  }

  getConfig(): ProductConfig {
    return {
      ...this.currentConfig,
      levers: { ...this.currentConfig.levers }
    };
  }

  getSettings() {
    return this.getConfig();
  }

  updateConfig(updates: Partial<ProductConfig>): ProductConfig {
    this.currentConfig = {
      ...this.currentConfig,
      ...updates,
      levers: {
        ...this.currentConfig.levers,
        ...(updates.levers || {})
      }
    };
    return this.getConfig();
  }

  updateSettings(updates: any) {
    return this.updateConfig(updates);
  }

  resetDefaults(): ProductConfig {
    this.currentConfig = this.buildDefaultConfig();
    return this.getConfig();
  }
}

export const configService = new ConfigService();
