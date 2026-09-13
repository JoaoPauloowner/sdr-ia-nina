// Nina SDR IA — Painel Operacional Client Logic

document.addEventListener('DOMContentLoaded', () => {
  initDefaultDate();
  initTabs();
  initQuickReplies();
  initForms();
  initTickButton();

  // Carregamento inicial e loop de polling (tempo real a cada 3.5s)
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
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const content = document.getElementById(targetId);
      if (content) content.classList.add('active');
    });
  });
}

function initQuickReplies() {
  const chips = document.querySelectorAll('.quick-chip');
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

    document.getElementById('kpi-show-rate').innerText = data.showRate;
    document.getElementById('kpi-agendamentos').innerText = data.totalAgendados;
    document.getElementById('kpi-confirmados').innerText = `${data.confirmados} Confirmados`;
    document.getElementById('kpi-cancelados').innerText = `${data.cancelados} Cancelados`;
    document.getElementById('kpi-silencio').innerText = data.leadsEmRadarSilencio;
    document.getElementById('kpi-abandonos').innerText = data.abandonosDetectados;
  } catch (err) {
    console.error('Erro ao carregar métricas:', err);
  }
}

async function loadConversations() {
  try {
    const res = await fetch('/api/dashboard/conversations?limit=25');
    if (!res.ok) return;
    const items = await res.json();

    const container = document.getElementById('feed-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-feed">Nenhuma interação registrada ainda. Faça uma simulação ao lado!</div>';
      return;
    }

    container.innerHTML = items.map(item => {
      const isNina = item.direcao === 'saida';
      const authorClass = isNina ? 'nina' : 'lead';
      const authorLabel = isNina ? '🤖 Nina (SDR IA)' : `👤 ${item.leadNome || 'Lead'}`;
      const timeStr = new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="msg-item ${authorClass}">
          <div class="msg-header">
            <span class="msg-author ${authorClass}">${authorLabel}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span class="channel-tag ${item.canal}">${item.canal}</span>
              <span>${timeStr}</span>
            </div>
          </div>
          <div class="msg-body">${escapeHtml(item.conteudo)}</div>
          ${item.media_url ? `<div style="margin-top: 6px; font-size: 0.8rem; color: #a5b4fc;">🎙️ Áudio sintetizado anexado</div>` : ''}
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
        showFeedback(`✅ Reunião agendada! Nina disparou confirmação imediata (< 2min) para ${payload.nome}.`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('❌ Erro ao enviar agendamento: ' + err.message);
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
        showFeedback(`⚠️ Abandono registrado! Nina programou recuperação para daqui a 15 minutos.`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('❌ Erro ao registrar abandono: ' + err.message);
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
        showFeedback(`💬 Resposta processada pela Nina! Ação: ${data.actionTaken || 'respondido'}`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        showFeedback('❌ Erro ao enviar mensagem: ' + err.message);
      }
    });
  }
}

function initTickButton() {
  const btnTick = document.getElementById('btn-trigger-tick');
  if (btnTick) {
    btnTick.addEventListener('click', async () => {
      try {
        btnTick.innerText = 'Processando...';
        const res = await fetch('/api/webhooks/scheduler/tick', { method: 'POST' });
        const data = await res.json();
        btnTick.innerHTML = '<span class="btn-icon">⚡</span> Rodar Scheduler (Tick)';
        showFeedback(`⚡ Scheduler executado: ${data.processados} tarefas disparadas, ${data.silenciososDetectados} no radar do silêncio.`);
        loadMetrics();
        loadConversations();
      } catch (err) {
        btnTick.innerHTML = '<span class="btn-icon">⚡</span> Rodar Scheduler (Tick)';
        showFeedback('❌ Erro no scheduler: ' + err.message);
      }
    });
  }
}

function showFeedback(msg) {
  const box = document.getElementById('sim-feedback');
  if (box) {
    box.innerText = msg;
    box.className = 'feedback-box success';
    setTimeout(() => {
      box.className = 'feedback-box hidden';
    }, 6000);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
