import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    serviceRoleKey: string;
    isConfigured: boolean;
  };
  anthropic: {
    apiKey: string;
    model: string;
    isConfigured: boolean;
  };
  meta: {
    whatsappToken: string;
    phoneNumberId: string;
    verifyToken: string;
    isConfigured: boolean;
  };
  elevenlabs: {
    apiKey: string;
    voiceId: string;
    isConfigured: boolean;
  };
  email: {
    resendApiKey: string;
    from: string;
    isConfigured: boolean;
  };
  sms: {
    twilioSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
    isConfigured: boolean;
  };
  rules: {
    formAbandonmentMinutes: number;
    silenceRadarHours: number;
  };
}

export function loadConfig(): AppConfig {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const whatsappToken = process.env.META_WHATSAPP_TOKEN || '';
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY || '';
  const resendKey = process.env.RESEND_API_KEY || '';
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || '';

  return {
    port: parseInt(process.env.PORT || '3333', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabase: {
      url: supabaseUrl,
      serviceRoleKey: supabaseKey,
      isConfigured: Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')),
    },
    anthropic: {
      apiKey: anthropicKey,
      model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest',
      isConfigured: Boolean(anthropicKey && !anthropicKey.includes('your-anthropic')),
    },
    meta: {
      whatsappToken: whatsappToken,
      phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
      verifyToken: process.env.META_VERIFY_TOKEN || 'xena_verify_token',
      isConfigured: Boolean(whatsappToken && !whatsappToken.includes('your-meta')),
    },
    elevenlabs: {
      apiKey: elevenlabsKey,
      voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
      isConfigured: Boolean(elevenlabsKey && !elevenlabsKey.includes('your-elevenlabs')),
    },
    email: {
      resendApiKey: resendKey,
      from: process.env.EMAIL_FROM || 'Xena <xena@empresa.com.br>',
      isConfigured: Boolean(resendKey && !resendKey.includes('your-resend')),
    },
    sms: {
      twilioSid: twilioSid,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      isConfigured: Boolean(twilioSid && !twilioSid.includes('your-twilio')),
    },
    rules: {
      formAbandonmentMinutes: parseInt(process.env.FORM_ABANDONMENT_MINUTES || '15', 10),
      silenceRadarHours: parseInt(process.env.SILENCE_RADAR_HOURS || '6', 10),
    },
  };
}

export const config = loadConfig();
