// ==========================================================================
// XENA SDR IA — CLIENT LOGIC & PRODUCT CONTROLLER
// Wise Design System Application Engine
// ==========================================================================

let activeLeadId = null;
let allLeads = [];
let allConversations = [];

// ==========================================================================
// 1. TOAST & MODAL HELPERS
// ==========================================================================

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 4000);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// ==========================================================================
// 2. TAB NAVIGATION
// ==========================================================================

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const viewSections = document.querySelectorAll('.view-section');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      tabButtons.forEach(b => b.classList.remove('active'));
      viewSections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');

      // Refresh specific tab data on open
      if (targetId === 'tab-overview') loadMetrics();
      if (targetId === 'tab-crm') loadLeads();
      if (targetId === 'tab-inbox') loadInbox();
      if (targetId === 'tab-closers') loadClosers();
      if (targetId === 'tab-cases') loadCases();
      if (targetId === 'tab-config') loadConfig();
    });
  });

  // Botão de simulação rápida no topo
  const quickSimBtn = document.getElementById('btn-quick-sim');
  if (quickSimBtn) {
    quickSimBtn.addEventListener('click', () => {
      const simTab = document.querySelector('[data-tab="tab-simulator"]');
      if (simTab) simTab.click();
    });
  }

  // Botão "Ver no Inbox" na visão geral
  const viewInboxAllBtn = document.getElementById('btn-view-inbox-all');
  if (viewInboxAllBtn) {
    viewInboxAllBtn.addEventListener('click', () => {
      const inboxTab = document.querySelector('[data-tab="tab-inbox"]');
      if (inboxTab) inboxTab.click();
    });
  }
}

// ==========================================================================
// 3. VISÃO GERAL / MÉTRICAS
// ==========================================================================

async function loadMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('kpi-showrate').textContent = data.showRate || '45%';
    document.getElementById('kpi-confirmados').textContent = data.confirmados || 0;
    document.getElementById('kpi-silencio').textContent = data.leadsEmRadarSilencio || 0;
    document.getElementById('kpi-abandonos').textContent = data.abandonosDetectados || 0;
    document.getElementById('kpi-fila').textContent = data.tarefasFilaPendentes || 0;

    // Atualiza badges do header
    const totalLeadsBadge = document.getElementById('badge-total-leads');
    if (totalLeadsBadge) totalLeadsBadge.textContent = data.totalLeads || 0;

    loadRecentFeed();
  } catch (err) {
    console.error('Erro ao carregar métricas:', err);
  }
}

async function loadRecentFeed() {
  const container = document.getElementById('overview-feed-container');
  if (!container) return;

  try {
    const res = await fetch('/api/conversations?limit=6');
    if (!res.ok) return;
    const items = await res.json();

    if (!items || items.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--wise-mute);">Nenhuma interação registrada ainda. Use o simulador para testar a Xena!</div>';
      return;
    }

    container.innerHTML = items.map(item => {
      const isXena = item.direcao === 'saida';
      const isOperator = item.conteudo && item.conteudo.startsWith('[Operador');
      const time = new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      let badgeHtml = '<span class="badge" style="background: var(--wise-canvas-subtle); color: var(--wise-ink-deep); font-weight:700;">⚔️ Xena</span>';
      if (!isXena) {
        badgeHtml = `<span class="badge" style="background: var(--wise-ink-deep); color: white;">● ${item.leadNome || 'Lead'}</span>`;
      } else if (isOperator) {
        badgeHtml = '<span class="badge" style="background: var(--wise-primary); color: var(--wise-ink-deep); font-weight:700;">👤 Operador</span>';
      }

      return `
        <div style="background: var(--wise-canvas-soft); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--wise-border); display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              ${badgeHtml}
              <span style="font-size: 11px; color: var(--wise-mute);">${item.leadEmpresa ? item.leadEmpresa + ' • ' : ''}${item.canal || 'whatsapp'}</span>
            </div>
            <div style="font-size: 13px; color: var(--wise-ink); line-height: 1.4;">${item.conteudo}</div>
          </div>
          <div style="font-size: 11px; color: var(--wise-mute); white-space: nowrap;">${time}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar feed:', err);
  }
}

// ==========================================
// 4. CRM DE LEADS
// ==========================================

async function loadLeads() {
  const tbody = document.getElementById('crm-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/leads');
    if (!res.ok) throw new Error('Falha ao obter leads');
    allLeads = await res.json();
    renderLeadsTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar leads: ${err.message}</td></tr>`;
  }
}

function renderLeadsTable() {
  const tbody = document.getElementById('crm-table-body');
  if (!tbody) return;

  const query = (document.getElementById('crm-search')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('crm-filter-status')?.value || 'todos';

  const filtered = allLeads.filter(l => {
    const matchQuery = (l.nome || '').toLowerCase().includes(query) ||
                       (l.empresa || '').toLowerCase().includes(query) ||
                       (l.telefone || '').includes(query);
    const matchStatus = filterStatus === 'todos' || l.status === filterStatus;
    return matchQuery && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--wise-mute);">Nenhum lead encontrado com estes filtros.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(l => {
    const statusClass = `badge-${l.status || 'agendado'}`;
    const dateFormatted = l.ultimoAgendamento 
      ? new Date(l.ultimoAgendamento).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : 'Sem data';

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--wise-ink);">${l.nome}</div>
          <div style="font-size: 11px; color: var(--wise-mute);">${l.empresa || 'Empresa não informada'}</div>
        </td>
        <td>
          <span style="font-family: monospace; font-size: 12px;">${l.telefone || '-'}</span>
        </td>
        <td>
          <span style="text-transform: capitalize;">${l.setor || 'Geral'}</span>
        </td>
        <td>
          <span>${l.closerNome || 'Lucas Santos'}</span>
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 600;">${dateFormatted}</span>
        </td>
        <td>
          <span class="badge ${statusClass}">${l.status?.replace('_', ' ') || 'agendado'}</span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="openLeadChat('${l.id}')">💬 Conversa</button>
            <button class="btn btn-secondary btn-sm" onclick="changeLeadStatusPrompt('${l.id}', '${l.status}')">Mudar Status</button>
            <button class="btn btn-danger btn-sm" onclick="deleteLead('${l.id}')">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openLeadChat = function(leadId) {
  const inboxTab = document.querySelector('[data-tab="tab-inbox"]');
  if (inboxTab) inboxTab.click();
  setTimeout(() => selectConversation(leadId), 100);
};

window.changeLeadStatusPrompt = async function(leadId, currentStatus) {
  const novo = prompt('Selecione o novo status: agendado, confirmado, radar_silencio, abandonou_formulario, cancelado', currentStatus);
  if (!novo || novo === currentStatus) return;

  try {
    const res = await fetch(`/api/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novo })
    });
    if (!res.ok) throw new Error('Erro ao atualizar status');
    showToast('Status atualizado com sucesso!');
    loadLeads();
    loadMetrics();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteLead = async function(leadId) {
  if (!confirm('Deseja realmente excluir este lead do CRM?')) return;
  try {
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir lead');
    showToast('Lead excluído do CRM!');
    loadLeads();
    loadMetrics();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ==========================================
// 5. INBOX AO VIVO & CHAT
// ==========================================

async function loadInbox() {
  const listContainer = document.getElementById('inbox-conversations-list');
  if (!listContainer) return;

  try {
    const res = await fetch('/api/leads');
    if (!res.ok) return;
    const leads = await res.json();
    allConversations = leads;

    const inboxCountBadge = document.getElementById('badge-inbox-count');
    if (inboxCountBadge) inboxCountBadge.textContent = leads.length;

    if (leads.length === 0) {
      listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--wise-mute);">Nenhuma conversa ativa.</div>';
      return;
    }

    renderInboxSidebar();

    // Se nenhum lead estiver selecionado, seleciona o primeiro
    if (!activeLeadId && leads.length > 0) {
      selectConversation(leads[0].id);
    }
  } catch (err) {
    console.error('Erro ao carregar inbox:', err);
  }
}

function renderInboxSidebar() {
  const listContainer = document.getElementById('inbox-conversations-list');
  const query = (document.getElementById('inbox-search')?.value || '').toLowerCase();

  const filtered = allConversations.filter(l => 
    (l.nome || '').toLowerCase().includes(query) ||
    (l.empresa || '').toLowerCase().includes(query)
  );

  listContainer.innerHTML = filtered.map(lead => {
    const isActive = lead.id === activeLeadId ? 'active' : '';
    return `
      <div class="conversation-item ${isActive}" onclick="selectConversation('${lead.id}')">
        <div>
          <div class="conv-name">${lead.nome}</div>
          <div class="conv-sub">${lead.empresa || lead.setor || 'Contato WhatsApp'}</div>
        </div>
        <span class="badge badge-${lead.status}">${lead.status?.replace('_', ' ') || 'ativo'}</span>
      </div>
    `;
  }).join('');
}

window.selectConversation = async function(leadId) {
  activeLeadId = leadId;
  renderInboxSidebar();

  const headerName = document.getElementById('chat-header-name');
  const headerSub = document.getElementById('chat-header-sub');
  const chatMessages = document.getElementById('chat-messages-container');
  const replyInput = document.getElementById('chat-reply-input');
  const replySubmit = document.getElementById('chat-reply-submit');
  const headerActions = document.getElementById('chat-header-actions');

  try {
    const res = await fetch(`/api/leads/${leadId}/conversations`);
    if (!res.ok) throw new Error('Falha ao carregar histórico da conversa');
    const data = await res.json();

    const lead = data.lead;
    const interacoes = data.interacoes || [];

    headerName.textContent = lead.nome;
    headerSub.textContent = `${lead.empresa ? lead.empresa + ' • ' : ''}${lead.telefone} • Status: ${lead.status}`;
    if (headerActions) headerActions.style.display = 'flex';

    replyInput.disabled = false;
    replySubmit.disabled = false;
    replyInput.focus();

    if (interacoes.length === 0) {
      chatMessages.innerHTML = `
        <div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--wise-mute); flex-direction: column; gap: 8px;">
          <div>Nenhuma mensagem registrada nesta conversa ainda.</div>
          <div style="font-size: 12px;">Envie uma mensagem abaixo para iniciar o diálogo via WhatsApp.</div>
        </div>
      `;
      return;
    }

    chatMessages.innerHTML = interacoes.map(item => {
      const isOutbound = item.direcao === 'saida';
      const isOperator = item.conteudo && item.conteudo.startsWith('[Operador');
      const time = new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      let bubbleClass = isOutbound ? 'xena' : 'lead';
      let authorLabel = '⚔️ Xena (SDR IA)';
      let content = item.conteudo;

      if (!isOutbound) {
        authorLabel = lead.nome;
      } else if (isOperator) {
        bubbleClass = 'operator';
        authorLabel = '👤 Operador Humano';
        content = content.replace(/^\[Operador Humano\]:\s*/, '');
      }

      return `
        <div class="chat-bubble ${bubbleClass}">
          <div class="bubble-author">${authorLabel}</div>
          <div class="bubble-body">${content}</div>
          <div class="bubble-time">${time}</div>
        </div>
      `;
    }).join('');

    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    chatMessages.innerHTML = `<div style="color: red; padding: 20px;">Erro: ${err.message}</div>`;
  }
};

// Envio de mensagem pelo chat (como operador humano)
const replyForm = document.getElementById('chat-reply-form');
if (replyForm) {
  replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeLeadId) return;

    const input = document.getElementById('chat-reply-input');
    const msg = input.value.trim();
    if (!msg) return;

    try {
      const res = await fetch(`/api/leads/${activeLeadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: msg,
          remetente: 'operador'
        })
      });

      if (!res.ok) throw new Error('Erro ao enviar mensagem via WhatsApp');
      input.value = '';
      showToast('Mensagem enviada com sucesso pelo WhatsApp!');
      selectConversation(activeLeadId);
      loadRecentFeed();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// 6. GESTÃO DE EQUIPE / CLOSERS (CRUD)
// ==========================================

async function loadClosers() {
  const tbody = document.getElementById('closers-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/closers');
    if (!res.ok) throw new Error('Erro ao carregar closers');
    const closers = await res.json();

    const closersBadge = document.getElementById('badge-closers-count');
    if (closersBadge) closersBadge.textContent = closers.length;

    if (closers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--wise-mute);">Nenhum closer cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = closers.map(c => `
      <tr>
        <td style="font-weight: 700;">${c.nome}</td>
        <td>${c.cargo || 'Especialista'}</td>
        <td>${c.email || '-'}</td>
        <td>${c.telefone || '-'}</td>
        <td><a href="${c.link_sala_reuniao}" target="_blank" style="color: var(--wise-ink-deep); font-weight: 600; text-decoration: underline;">Link Sala</a></td>
        <td>${c.link_agenda ? `<a href="${c.link_agenda}" target="_blank" style="color: var(--wise-body);">Cal.com</a>` : '-'}</td>
        <td><span class="badge ${c.ativo ? 'badge-ativo' : 'badge-inativo'}">${c.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="editCloser('${c.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCloser('${c.id}')">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro: ${err.message}</td></tr>`;
  }
}

const newCloserBtn = document.getElementById('btn-new-closer');
if (newCloserBtn) {
  newCloserBtn.addEventListener('click', () => {
    document.getElementById('form-closer').reset();
    document.getElementById('closer-id').value = '';
    document.getElementById('modal-closer-title').textContent = 'Cadastrar Novo Closer';
    openModal('modal-closer');
  });
}

window.editCloser = async function(id) {
  try {
    const res = await fetch('/api/closers');
    const closers = await res.json();
    const c = closers.find(item => item.id === id);
    if (!c) return;

    document.getElementById('closer-id').value = c.id;
    document.getElementById('closer-nome').value = c.nome;
    document.getElementById('closer-cargo').value = c.cargo || '';
    document.getElementById('closer-email').value = c.email || '';
    document.getElementById('closer-telefone').value = c.telefone || '';
    document.getElementById('closer-sala').value = c.link_sala_reuniao || '';
    document.getElementById('closer-agenda').value = c.link_agenda || '';

    document.getElementById('modal-closer-title').textContent = 'Editar Closer';
    openModal('modal-closer');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteCloser = async function(id) {
  if (!confirm('Deseja excluir este closer?')) return;
  try {
    const res = await fetch(`/api/closers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir closer');
    showToast('Closer excluído com sucesso!');
    loadClosers();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const formCloser = document.getElementById('form-closer');
if (formCloser) {
  formCloser.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('closer-id').value;
    const payload = {
      nome: document.getElementById('closer-nome').value,
      cargo: document.getElementById('closer-cargo').value,
      email: document.getElementById('closer-email').value,
      telefone: document.getElementById('closer-telefone').value,
      link_sala_reuniao: document.getElementById('closer-sala').value,
      link_agenda: document.getElementById('closer-agenda').value,
      ativo: true
    };

    try {
      const url = id ? `/api/closers/${id}` : '/api/closers';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao salvar closer');
      closeModal('modal-closer');
      showToast('Closer salvo com sucesso!');
      loadClosers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// 7. BASE DE CONHECIMENTO / CASES RAG (CRUD)
// ==========================================

async function loadCases() {
  const tbody = document.getElementById('cases-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/cases');
    if (!res.ok) throw new Error('Erro ao carregar cases');
    const cases = await res.json();

    if (cases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--wise-mute);">Nenhum case cadastrado na base de conhecimento.</td></tr>';
      return;
    }

    tbody.innerHTML = cases.map(c => `
      <tr>
        <td style="font-weight: 700; text-transform: uppercase; font-size: 12px; color: var(--wise-ink-deep);">${c.segmento}</td>
        <td style="font-weight: 600;">${c.nome_cliente}</td>
        <td><span style="color: var(--wise-positive-deep); font-weight: 700;">${c.metrica_chave}</span></td>
        <td style="font-size: 12px; color: var(--wise-body); max-width: 320px;">${c.resumo_case}</td>
        <td><span class="badge badge-ativo">Ativo</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="editCase('${c.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCase('${c.id}')">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erro: ${err.message}</td></tr>`;
  }
}

const newCaseBtn = document.getElementById('btn-new-case');
if (newCaseBtn) {
  newCaseBtn.addEventListener('click', () => {
    document.getElementById('form-case').reset();
    document.getElementById('case-id').value = '';
    document.getElementById('modal-case-title').textContent = 'Adicionar Case de Sucesso';
    openModal('modal-case');
  });
}

window.editCase = async function(id) {
  try {
    const res = await fetch('/api/cases');
    const cases = await res.json();
    const c = cases.find(item => item.id === id);
    if (!c) return;

    document.getElementById('case-id').value = c.id;
    document.getElementById('case-segmento').value = c.segmento;
    document.getElementById('case-cliente').value = c.nome_cliente;
    document.getElementById('case-metrica').value = c.metrica_chave;
    document.getElementById('case-resumo').value = c.resumo_case;

    document.getElementById('modal-case-title').textContent = 'Editar Case de Sucesso';
    openModal('modal-case');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteCase = async function(id) {
  if (!confirm('Deseja excluir este case de sucesso?')) return;
  try {
    const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir case');
    showToast('Case excluído da base de conhecimento!');
    loadCases();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const formCase = document.getElementById('form-case');
if (formCase) {
  formCase.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('case-id').value;
    const payload = {
      segmento: document.getElementById('case-segmento').value,
      nome_cliente: document.getElementById('case-cliente').value,
      metrica_chave: document.getElementById('case-metrica').value,
      resumo_case: document.getElementById('case-resumo').value,
      ativo: true
    };

    try {
      const url = id ? `/api/cases/${id}` : '/api/cases';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao salvar case');
      closeModal('modal-case');
      showToast('Case indexado com sucesso na base de conhecimento!');
      loadCases();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// 8. CONFIGURAÇÕES DO PRODUTO (XENA)
// ==========================================

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const cfg = await res.json();

    document.getElementById('cfg-agent-name').value = cfg.agentName || 'Xena';
    document.getElementById('cfg-system-prompt').value = cfg.systemPrompt || '';

    // Timers das 6 alavancas
    if (cfg.levers) {
      document.getElementById('cfg-immediate-min').value = cfg.levers.confirmacaoImediataMinutos ?? 2;
      document.getElementById('cfg-d1-hours').value = cfg.levers.lembreteD1HorasAntes ?? 24;
      document.getElementById('cfg-cerco-min').value = cfg.levers.cerco5MinutosAntes ?? 5;
      document.getElementById('cfg-silence-hours').value = cfg.levers.radarSilencioHoras ?? 6;
      document.getElementById('cfg-abandonment-min').value = cfg.levers.recuperacaoAbandonoMinutos ?? 15;
      document.getElementById('cfg-noshow-min').value = cfg.levers.reengajamentoNoShowMinutos ?? 15;
    }

    // Chaves
    if (cfg.anthropicApiKey) document.getElementById('cfg-anthropic-key').value = cfg.anthropicApiKey;
    if (cfg.elevenlabsApiKey) document.getElementById('cfg-elevenlabs-key').value = cfg.elevenlabsApiKey;
    if (cfg.metaWhatsAppToken) document.getElementById('cfg-meta-token').value = cfg.metaWhatsAppToken;
  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
  }
}

const saveConfigBtn = document.getElementById('btn-save-config');
if (saveConfigBtn) {
  saveConfigBtn.addEventListener('click', async () => {
    const payload = {
      agentName: document.getElementById('cfg-agent-name').value,
      systemPrompt: document.getElementById('cfg-system-prompt').value,
      levers: {
        confirmacaoImediataMinutos: parseInt(document.getElementById('cfg-immediate-min').value, 10),
        lembreteD1HorasAntes: parseInt(document.getElementById('cfg-d1-hours').value, 10),
        cerco5MinutosAntes: parseInt(document.getElementById('cfg-cerco-min').value, 10),
        radarSilencioHoras: parseInt(document.getElementById('cfg-silence-hours').value, 10),
        recuperacaoAbandonoMinutos: parseInt(document.getElementById('cfg-abandonment-min').value, 10),
        reengajamentoNoShowMinutos: parseInt(document.getElementById('cfg-noshow-min').value, 10)
      },
      anthropicApiKey: document.getElementById('cfg-anthropic-key').value || undefined,
      elevenlabsApiKey: document.getElementById('cfg-elevenlabs-key').value || undefined,
      metaWhatsAppToken: document.getElementById('cfg-meta-token').value || undefined
    };

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erro ao salvar configurações');
      showToast('Configurações da Xena salvas com sucesso!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

const resetConfigBtn = document.getElementById('btn-reset-config');
if (resetConfigBtn) {
  resetConfigBtn.addEventListener('click', async () => {
    if (!confirm('Deseja restaurar as configurações para o padrão de fábrica da Xena?')) return;
    try {
      const res = await fetch('/api/config/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao restaurar configurações');
      showToast('Configurações restauradas com sucesso!');
      loadConfig();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// 9. SIMULADOR DE TESTES
// ==========================================

// Form 1: Agendamento
const simFormBooking = document.getElementById('sim-form-booking');
if (simFormBooking) {
  simFormBooking.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('sim-book-name').value,
      telefone: document.getElementById('sim-book-phone').value,
      empresa: document.getElementById('sim-book-empresa').value,
      setor: document.getElementById('sim-book-setor').value,
      data_hora_reuniao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const res = await fetch('/webhook/lead-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Falha ao disparar agendamento');
      showToast(`✓ Agendamento criado! A Xena disparou confirmação imediata para ${payload.nome}`);
      loadMetrics();
      loadLeads();
      loadInbox();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Form 2: Abandono
const simFormAbandon = document.getElementById('sim-form-abandon');
if (simFormAbandon) {
  simFormAbandon.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('sim-abandon-name').value,
      telefone: document.getElementById('sim-abandon-phone').value,
      abandono: true
    };

    try {
      const res = await fetch('/webhook/lead-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Falha ao simular abandono');
      showToast(`! Abandono registrado! A Xena agendou recuperação para ${payload.nome}`);
      loadMetrics();
      loadLeads();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Form 3: Inbound WhatsApp do Lead
const simFormInbound = document.getElementById('sim-form-inbound');
if (simFormInbound) {
  simFormInbound.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      telefone: document.getElementById('sim-inbound-phone').value,
      mensagem: document.getElementById('sim-inbound-msg').value
    };

    try {
      const res = await fetch('/webhook/meta-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Falha ao processar mensagem');
      const data = await res.json();
      showToast(`✓ Xena respondeu! Ação registrada: ${data.actionTaken || 'respondido'}`);
      loadMetrics();
      loadLeads();
      loadInbox();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// 10. INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadMetrics();
  loadLeads();
  loadClosers();
  loadCases();
  loadConfig();

  // Polling a cada 6 segundos para manter o dashboard e o inbox sempre sincronizados
  setInterval(() => {
    loadMetrics();
    if (activeLeadId) selectConversation(activeLeadId);
  }, 6000);

  // Botões de recarregar
  document.getElementById('btn-refresh-metrics')?.addEventListener('click', loadMetrics);
  document.getElementById('btn-reload-leads')?.addEventListener('click', loadLeads);
  document.getElementById('crm-search')?.addEventListener('input', renderLeadsTable);
  document.getElementById('crm-filter-status')?.addEventListener('change', renderLeadsTable);
  document.getElementById('inbox-search')?.addEventListener('input', renderInboxSidebar);
});
