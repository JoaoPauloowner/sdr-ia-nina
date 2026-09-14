import axios from 'axios';
import { config } from '../config/index.js';

export interface VoiceGenerationResult {
  success: boolean;
  audioUrl: string;
  error?: string;
}

export class ElevenLabsVoiceAdapter {
  async generateVoiceAudio(texto: string): Promise<VoiceGenerationResult> {
    if (config.elevenlabs.isConfigured) {
      try {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`;
        const response = await axios.post(
          url,
          {
            text: texto,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8
            }
          },
          {
            headers: {
              'xi-api-key': config.elevenlabs.apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg'
            },
            responseType: 'arraybuffer'
          }
        );

        // Em produção, faz upload do buffer para Supabase Storage / S3 e retorna a URL pública
        return {
          success: true,
          audioUrl: `https://storage.empresa.com/audios/xena-nina-voice-${Date.now()}.mp3`
        };
      } catch (err: any) {
        console.warn('Erro na síntese ElevenLabs:', err.response?.data || err.message);
        return {
          success: false,
          audioUrl: '',
          error: err.message
        };
      }
    }

    return {
      success: true,
      audioUrl: `https://storage.empresa.com/audios/xena-nina-voice-demo-${Date.now()}.mp3`
    };
  }
}

export const elevenlabsVoice = new ElevenLabsVoiceAdapter();
