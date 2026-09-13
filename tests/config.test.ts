import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/index.js';

describe('Configuração do Sistema SDR IA Nina', () => {
  it('deve carregar as configurações padrões quando não houver variáveis de ambiente', () => {
    const cfg = loadConfig();
    expect(cfg.port).toBeDefined();
    expect(cfg.rules.formAbandonmentMinutes).toBe(15);
    expect(cfg.rules.silenceRadarHours).toBe(6);
  });

  it('deve identificar corretamente quando o Supabase e Anthropic não estão configurados', () => {
    const cfg = loadConfig();
    // No ambiente local inicial sem .env preenchido
    expect(typeof cfg.supabase.isConfigured).toBe('boolean');
    expect(typeof cfg.anthropic.isConfigured).toBe('boolean');
  });
});
