import { leadService } from '../services/leadService.js';
import { bookingService } from '../services/bookingService.js';
import { knowledgeService } from '../services/knowledgeService.js';
import { getDatabase } from '../database/supabase.js';

export const ninaToolsDefinitions = [
  {
    name: 'buscar_lead_crm',
    description: 'Busca os dados cadastrais do lead e seus agendamentos no CRM por ID, telefone ou email',
    input_schema: {
      type: 'object',
      properties: {
        identificador: {
          type: 'string',
          description: 'ID, telefone ou e-mail do lead'
        }
      },
      required: ['identificador']
    }
  },
  {
    name: 'buscar_closer_responsavel',
    description: 'Retorna os dados do closer/vendedor responsável por um agendamento específico',
    input_schema: {
      type: 'object',
      properties: {
        agendamento_id: {
          type: 'string',
          description: 'ID do agendamento'
        }
      },
      required: ['agendamento_id']
    }
  },
  {
    name: 'buscar_case_por_segmento',
    description: 'Busca na base de conhecimento um case de sucesso do mesmo setor/nicho do lead para personalização',
    input_schema: {
      type: 'object',
      properties: {
        segmento: {
          type: 'string',
          description: 'Nicho ou segmento do lead (ex: saúde, imobiliário, b2b_saas, varejo)'
        }
      },
      required: ['segmento']
    }
  },
  {
    name: 'atualizar_status_crm',
    description: 'Atualiza o status de confirmação do agendamento ou do lead no CRM',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'ID do lead'
        },
        status: {
          type: 'string',
          description: 'Novo status (confirmado, cancelado_pelo_lead, reagendamento_solicitado)'
        }
      },
      required: ['lead_id', 'status']
    }
  },
  {
    name: 'criar_evento_calendario',
    description: 'Cria evento de reunião com link do Meet no Google Calendar do lead',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string' },
        horario: { type: 'string' }
      },
      required: ['lead_id', 'horario']
    }
  },
  {
    name: 'enviar_whatsapp',
    description: 'Envia mensagem de texto via WhatsApp oficial da Meta',
    input_schema: {
      type: 'object',
      properties: {
        numero: { type: 'string' },
        mensagem: { type: 'string' }
      },
      required: ['numero', 'mensagem']
    }
  },
  {
    name: 'gerar_audio',
    description: 'Sintetiza mensagem em áudio natural da Nina via ElevenLabs',
    input_schema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Texto a ser transformado em voz' }
      },
      required: ['texto']
    }
  }
];

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  const db = getDatabase();

  switch (name) {
    case 'buscar_lead_crm': {
      const id = args.identificador;
      let lead = await leadService.getLeadById(id);
      if (!lead) lead = await leadService.getLeadByPhone(id);
      const ags = lead ? await db.agendamentos.getByLeadId(lead.id) : [];
      return { lead, agendamentos: ags };
    }

    case 'buscar_closer_responsavel': {
      const details = await bookingService.getBookingDetails(args.agendamento_id);
      return details ? details.closer : null;
    }

    case 'buscar_case_por_segmento': {
      const caseItem = await knowledgeService.getCaseBySegment(args.segmento);
      return caseItem || { message: 'Nenhum case específico encontrado, use apresentação padrão.' };
    }

    case 'atualizar_status_crm': {
      if (args.status === 'confirmado' || args.status === 'confirmado_pelo_lead') {
        await leadService.markAsConfirmed(args.lead_id);
        const ags = await db.agendamentos.getByLeadId(args.lead_id);
        if (ags.length > 0) {
          await bookingService.confirmBooking(ags[0].id);
        }
      } else if (args.status.includes('cancela')) {
        await leadService.updateStatus(args.lead_id, 'cancelado');
        const ags = await db.agendamentos.getByLeadId(args.lead_id);
        if (ags.length > 0) {
          await bookingService.cancelBooking(ags[0].id, 'Cancelamento solicitado pelo lead');
        }
      }
      return { success: true, status: args.status };
    }

    case 'criar_evento_calendario': {
      return {
        success: true,
        calendarEventId: `cal-${Date.now()}`,
        linkMeet: 'https://meet.google.com/abc-nina-demo'
      };
    }

    case 'enviar_whatsapp': {
      return { success: true, messageId: `wamid-${Date.now()}` };
    }

    case 'gerar_audio': {
      return {
        success: true,
        audioUrl: `https://storage.empresa.com/audios/nina-${Date.now()}.ogg`
      };
    }

    default:
      return { error: `Ferramenta desconhecida: ${name}` };
  }
}
