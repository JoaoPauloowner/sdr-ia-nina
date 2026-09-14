// Nina SDR IA — Painel Operacional Client Logic (Vercel Geist System)

document.addEventListener('DOMContentLoaded', () => {
  initDefaultDate();
  initTabs();
  initQuickReplies();
  initForms();
  initTickButton();

  // Carregamento inicial e loop de polling em tempo real a cada 3.5s
  loadMetrics();
  loadConversations();
  setInterval(() => {
    loadMetrics();
    loadConversations();
  }, 3500);
});

function initDefaultDate() {
  const dateInput = document.getElementById('lead-data');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    dateInput.value = tomorrow.toISOString().slice(0, 16);
  }
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-pill, .tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane, .tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const content = document.getElementById(targetId);
      if (content) content.classList.add('active');
    });
  });
}

function initQuickReplies() {
  const chips = document.querySelectorAll('.chip, .quick-chip');
  const msgInput = document.getElementById('resp-msg');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      if (msgInput && text) {
        msgInput.value = text;
      }
    });
  });
}

async function loadMetrics() {
  try {
    const res = await fetch('/api/dashboard/metrics');
    if (!res.ok) return;
    const data = await res.json();

    const showRateEl = document.getElementById('kpi-show-rate');
    const agendamentosEl = document.getElementById('kpi-agendamentos');
    const confirmadosEl = document.getElementById('kpi-confirmados');
    const canceladosEl = document.getElementById('kpi-cancelados');
    const silencioEl = document.getElementById('kpi-silencio');
    const abandonosEl = document.getElementById('kpi-abandonos');

    if (showRateEl) showRateEl.innerText = data.showRate;
    if (agendamentosEl) agendamentosEl.innerText = data.totalAgendados;
    if (confirmadosEl) confirmadosEl.innerText = `${data.confirmados} Confirmed`;
    if (canceladosEl) canceladosEl.innerText = `${data.cancelados} Cancelled`;
    if (silencioEl) silencioEl.innerText = data.leadsEmRadarSilencio;
    if (abandonosEl) abandonosEl.innerText = data.abandonosDetectados;
  } catch (err) {
    console.error('Erro ao carregar métricas:', err);
  }
}

async function loadConversations() {
  try {
    const res = await fetch('/api/dashboard/conversations?limit=30');
    if (!res.ok) return;
    const items = await res.json();

    const container = document.getElementById('feed-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-feed">Nenhuma interação registrada ainda. Use o simulador ao lado para testar a Nina!</div>';
      return;
    }

    container.innerHTML = items.map(item => {
      const isNina = item.direcao === 'saida';
      const authorClass = isNina ? 'nina' : 'lead';
      const authorLabel = isNina ? '▲ Nina (SDR IA)' : `● ${item.leadNome || 'Lead'}`;
      const timeStr = new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="msg-item ${authorClass}">
          <div class="msg-header">
            <span class="msg-author ${authorClass}">${escapeHtml(authorLabel)}</span>
            <div class="msg-meta">
              <span class="channel-tag ${item.canal}">${item.canal}</span>
              <span class="msg-time">${timeStr}</span>
            </div>
          </div>
          <div class="msg-body">${escapeHtml(item.conteudo)}</div>
          ${item.media_url ? `
            <div class="msg-audio-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>Áudio ElevenLabs gerado</span>
            </div>` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar conversas:', err);
  }
}

function initForms() {
  // Form 1: Agendamento
  const formNovoLead = document.getElementById('form-novo-lead');
  if (formNovoLead) {
    formNovoLead.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        nome: document.getElementById('lead-nome').value,
        telefone: document.getElementById('lead-tel').value,
        setor: document.getElementById('lead-setor').value,
        data_hora_reuniao: new Date(document.getElementById('lead-data').value).toISOString()
      };

      try {
        const res = await fetch('/api/webhooks/lead-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        showFeedback(`✓ Reunião agendada! Nina disparou confirmação imediata (< 2min) para ${payload.nome}.`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('✗ Erro ao enviar agendamento: ' + err.message);
      }
    });
  }

  // Form 2: Abandono
  const formAbandono = document.getElementById('form-abandono');
  if (formAbandono) {
    formAbandono.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        nome: document.getElementById('abandono-nome').value,
        telefone: document.getElementById('abandono-tel').value,
        abandono: true
      };

      try {
        const res = await fetch('/api/webhooks/lead-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        showFeedback(`! Abandono registrado! Nina programou recuperação para daqui a 15 minutos.`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('✗ Erro ao registrar abandono: ' + err.message);
      }
    });
  }

  // Form 3: Resposta Lead
  const formResp = document.getElementById('form-resposta-lead');
  if (formResp) {
    formResp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        telefone: document.getElementById('resp-tel').value,
        mensagem: document.getElementById('resp-msg').value
      };

      try {
        const res = await fetch('/api/webhooks/meta-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        showFeedback(`✓ Resposta processada pela Nina! Ação no CRM: ${data.actionTaken || 'respondido'}`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('✗ Erro ao enviar mensagem: ' + err.message);
      }
    });
  }
}

function initTickButton() {
  const btnTick = document.getElementById('btn-trigger-tick');
  if (btnTick) {
    btnTick.addEventListener('click', async () => {
      try {
        const originalContent = btnTick.innerHTML;
        btnTick.innerHTML = '<span>Running...</span>';
        const res = await fetch('/api/webhooks/scheduler/tick', { method: 'POST' });
        const data = await res.json();
        btnTick.innerHTML = originalContent;
        showFeedback(`✓ Scheduler executado: ${data.processados} tarefas disparadas, ${data.silenciososDetectados} no radar do silêncio.`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('✗ Erro no scheduler: ' + err.message);
      }
    });
  }
}

function showFeedback(msg) {
  const box = document.getElementById('sim-feedback');
  if (box) {
    box.innerText = msg;
    box.className = 'feedback-toast';
    setTimeout(() => {
      box.className = 'feedback-toast hidden';
    }, 6000);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
