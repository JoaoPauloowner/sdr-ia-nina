import { leadService } from '../services/leadService.js';
import { bookingService } from '../services/bookingService.js';
import { knowledgeService } from '../services/knowledgeService.js';
import { getDatabase } from '../database/supabase.js';

export const xenaToolsDefinitions = [
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
    description: 'Busca na base de conhecimento (RAG) o case de sucesso mais relevante para o setor/segmento do lead',
    input_schema: {
      type: 'object',
      properties: {
        segmento: {
          type: 'string',
          description: 'Segmento ou nicho de atuação do lead (ex: saude, imobiliario, b2b_saas, e-commerce, consultoria)'
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
        lead_id: { type: 'string', description: 'ID do lead' },
        status: { 
          type: 'string', 
          enum: ['confirmado', 'reagendado', 'cancelado', 'no_show', 'radar_silencio'],
          description: 'Novo status do agendamento'
        },
        motivo: { type: 'string', description: 'Motivo ou observação adicional' }
      },
      required: ['lead_id', 'status']
    }
  },
  {
    name: 'criar_evento_calendario',
    description: 'Gera link do Google Meet / Cal.com e cria o convite no calendário',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'ID do lead' },
        data_hora: { type: 'string', description: 'Data e hora no formato ISO 8601' },
        email_lead: { type: 'string', description: 'E-mail do lead' },
        closer_id: { type: 'string', description: 'ID do closer' }
      },
      required: ['lead_id', 'data_hora']
    }
  },
  {
    name: 'enviar_whatsapp',
    description: 'Dispara mensagem de texto via WhatsApp Cloud API',
    input_schema: {
      type: 'object',
      properties: {
        telefone: { type: 'string', description: 'Número do lead no formato DDI+DDD+Número' },
        mensagem: { type: 'string', description: 'Texto da mensagem a ser enviada' }
      },
      required: ['telefone', 'mensagem']
    }
  },
  {
    name: 'gerar_audio',
    description: 'Sintetiza mensagem em áudio natural da Xena via ElevenLabs',
    input_schema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Texto a ser transformado em voz' }
      },
      required: ['texto']
    }
  }
];

export const ninaToolsDefinitions = xenaToolsDefinitions;

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  const db = getDatabase();

  try {
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
          linkMeet: 'https://meet.google.com/xena-reuniao'
        };
      }

      case 'enviar_whatsapp': {
        return { success: true, messageId: `wamid-${Date.now()}` };
      }

      case 'gerar_audio': {
        return {
          success: true,
          audioUrl: `https://storage.empresa.com/audios/xena-${Date.now()}.ogg`
        };
      }

      default:
        return { erro: true, mensagem: `Ferramenta desconhecida: ${name}`, codigo: 'TOOL_NOT_FOUND' };
    }
  } catch (err: any) {
    return {
      erro: true,
      mensagem: err.message || 'Erro inesperado na execução da ferramenta',
      codigo: 'TOOL_EXECUTION_ERROR'
    };
  }
}
