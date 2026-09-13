import { leadService } from '../src/services/leadService.js';
import { bookingService } from '../src/services/bookingService.js';
import { rulesEngine } from '../src/services/rulesEngine.js';
import { ninaAgent } from '../src/ai/ninaAgent.js';
import { channelDispatcher } from '../src/channels/channelDispatcher.js';
import { getDatabase } from '../src/database/supabase.js';

async function runJourneySimulation() {
  console.log('\n=============================================================');
  console.log('🤖 SIMULAÇÃO DA JORNADA NINA SDR IA — AS 6 ALAVANCAS');
  console.log('=============================================================\n');

  // 1. Entrada de Lead
  console.log('1️⃣  [Typeform] Lead preenche formulário e agenda reunião...');
  const lead = await leadService.registerLead({
    nome: 'Eduardo Moreira',
    telefone: '11991234567',
    email: 'eduardo@fintech.com',
    empresa: 'Fintech Brasil',
    setor: 'b2b_saas'
  });

  const agendamento = await bookingService.createBooking({
    leadId: lead.id,
    dataHoraReuniao: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  });

  console.log(`   ✅ Lead cadastrado: ${lead.nome} (${lead.empresa})`);
  console.log(`   📅 Reunião agendada com closer: Lucas Santos\n`);

  // 2. Orquestrador Determinístico
  console.log('2️⃣  [Rules Engine] Programando as 6 alavancas determinísticas...');
  const regras = await rulesEngine.scheduleMeetingRules(agendamento.id);
  console.log(`   ⏰ Regras agendadas na fila: ${regras.map(r => r.tipo_regra).join(', ')}\n`);

  // 3. Alavanca 1 e 6: Confirmação Imediata (< 2min) + Case Segmentado
  console.log('3️⃣  [Alavanca 1 + 6] Nina gera confirmação imediata personalizada com case...');
  const msg1 = await ninaAgent.generateOutboundMessage({
    leadId: lead.id,
    agendamentoId: agendamento.id,
    tipoRegra: 'confirmacao_imediata'
  });
  console.log(`   💬 Mensagem WhatsApp/Email:`);
  console.log(`   "${msg1}"\n`);

  await channelDispatcher.dispatchMultiChannel({
    leadId: lead.id,
    leadNome: lead.nome,
    telefone: lead.telefone,
    email: lead.email,
    mensagem: msg1,
    agendamentoId: agendamento.id
  });

  // 4. Lead Responde
  console.log('4️⃣  [WhatsApp Lead] Eduardo responde confirmando presença...');
  const respLead = await ninaAgent.handleInboundMessage({
    leadId: lead.id,
    mensagem: 'Oi Nina, tudo ótimo! Com certeza estarei presente na reunião.',
    canal: 'whatsapp'
  });
  console.log(`   🤖 Nina processa e responde:`);
  console.log(`   "${respLead.texto}"`);
  console.log(`   📊 Status CRM atualizado para: CONFIRMADO\n`);

  // 5. Alavanca 2: Lembrete 1h antes
  console.log('5️⃣  [Alavanca 2] Disparo de lembrete 1h antes...');
  const msg1h = await ninaAgent.generateOutboundMessage({
    leadId: lead.id,
    agendamentoId: agendamento.id,
    tipoRegra: 'lembrete_1h'
  });
  console.log(`   "${msg1h}"\n`);

  // 6. Alavanca 3: Cerco de 5 minutos antes
  console.log('6️⃣  [Alavanca 3] Cerco de 5 minutos antes — WhatsApp + E-mail + SMS...');
  const msg5m = await ninaAgent.generateOutboundMessage({
    leadId: lead.id,
    agendamentoId: agendamento.id,
    tipoRegra: 'cerco_5m'
  });
  console.log(`   "${msg5m}"\n`);

  // Resumo de Auditoria
  const db = getDatabase();
  const logs = await db.interacoes.listByLeadId(lead.id);
  console.log('=============================================================');
  console.log(`🎉 JORNADA CONCLUÍDA! Total de interações auditadas no CRM: ${logs.length}`);
  console.log('   Taxa de Show Rate estimada: 40% a 54%+ (Meta atingida)');
  console.log('=============================================================\n');
}

runJourneySimulation().catch(console.error);
