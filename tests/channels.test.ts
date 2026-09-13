import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabaseForTesting, getDatabase } from '../src/database/supabase.js';
import { leadService } from '../src/services/leadService.js';
import { channelDispatcher } from '../src/channels/channelDispatcher.js';
import { whatsappMeta } from '../src/channels/whatsappMeta.js';
import { elevenlabsVoice } from '../src/channels/elevenlabsVoice.js';

describe('Adaptadores de Mensageria e Síntese de Voz (Canais)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('deve despachar mensagem de texto via WhatsApp com sucesso e gravar no banco', async () => {
    const lead = await leadService.registerLead({
      nome: 'Tatiane Melo',
      telefone: '11988880000'
    });

    const result = await channelDispatcher.sendWhatsApp({
      leadId: lead.id,
      telefone: lead.telefone,
      mensagem: 'Oi Tatiane! Sua reunião está confirmada.'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();

    const db = getDatabase();
    const interacoes = await db.interacoes.listByLeadId(lead.id);
    expect(interacoes.length).toBe(1);
    expect(interacoes[0].canal).toBe('whatsapp');
  });

  it('deve despachar cerco multicanal simultâneo (WhatsApp + E-mail + SMS)', async () => {
    const lead = await leadService.registerLead({
      nome: 'Daniel Alves',
      telefone: '11977771111',
      email: 'daniel@empresa.com'
    });

    const results = await channelDispatcher.dispatchMultiChannel({
      leadId: lead.id,
      leadNome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      mensagem: 'Faltam 5 minutos para nossa reunião! Link: https://meet.google.com/abc'
    });

    expect(results.whatsapp.success).toBe(true);
    expect(results.email.success).toBe(true);
    expect(results.sms.success).toBe(true);

    const db = getDatabase();
    const interacoes = await db.interacoes.listByLeadId(lead.id);
    expect(interacoes.length).toBe(3);
  });

  it('deve gerar nota de voz sintética da Nina via ElevenLabs', async () => {
    const audio = await elevenlabsVoice.generateVoiceAudio(
      'Oi Tatiane, aqui é a Nina! Estou passando pra confirmar nossa reunião.'
    );

    expect(audio.success).toBe(true);
    expect(audio.audioUrl).toBeDefined();
    expect(audio.audioUrl).toContain('nina-voice');
  });
});
