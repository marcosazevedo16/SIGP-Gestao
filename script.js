// ESTADO GLOBAL
const state = {
  currentUser: null,
  currentTheme: 'light',
  currentTab: 'dashboard',
  presentations: [],
  demands: [],
  visits: [],
  productions: [],
  municipalities: ['Belo Horizonte', 'Sete Lagoas', 'Itabira', 'Ouro Preto', 'Montes Claros', 'Uberlândia', 'Patos de Minas', 'Conselheiro Lafaiete', 'Diamantina', 'Tiradentes'],
  orientadores: ['Marcos Azevedo', 'Alicia Lopes', 'Bruna Gomes'],
  users: [
    {username: 'ADMIN', password: 'saude2025', name: 'Administrador', role: 'admin'},
    {username: 'USER', password: 'user2025', name: 'Usuário', role: 'user'}
  ]
};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
  setupTabNavigation();
  setupTheme();
  setupHomeButton();
  setupLogout();
  populateModalsSelects();
  setupButtons();
  loadDataFromStorage();
  
  const loginBtn = document.getElementById('login-btn');
  loginBtn.addEventListener('click', handleLogin);
});

// LOGIN
function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const user = state.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    state.currentUser = user;
    document.getElementById('logged-user').textContent = user.name;
    
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    
    showTab('dashboard');
    renderDashboard();
  } else {
    document.getElementById('login-error').textContent = 'Usuário ou senha inválidos!';
  }
}

// NAVEGAÇÃO DE ABAS
function setupTabNavigation() {
  const tabItems = document.querySelectorAll('.tab-item');
  tabItems.forEach(item => {
    item.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      showTab(tabName);
    });
  });
}

function showTab(tabName) {
  const contents = document.querySelectorAll('.tab-content');
  const items = document.querySelectorAll('.tab-item');
  contents.forEach(c => c.classList.remove('active'));
  items.forEach(i => i.classList.remove('active'));
  
  const content = document.getElementById(tabName);
  const item = document.querySelector(`[data-tab="${tabName}"]`);
  if (content) content.classList.add('active');
  if (item) item.classList.add('active');
  
  state.currentTab = tabName;
  
  if (tabName === 'dashboard') renderDashboard();
  if (tabName === 'apresentacoes') renderPresentations();
  if (tabName === 'demandas') renderDemands();
  if (tabName === 'visitas') renderVisits();
  if (tabName === 'producao') renderProduction();
}

// DASHBOARD
function renderDashboard() {
  document.getElementById('card-municipalities').textContent = state.municipalities.length;
  document.getElementById('card-trainings').textContent = '1';
  document.getElementById('card-requests').textContent = '1';
  document.getElementById('card-presentations').textContent = state.presentations.length;
  
  renderEvolutionChart();
}

function renderEvolutionChart() {
  const ctx = document.getElementById('evolutionChart');
  if (!ctx) return;
  
  const colors = ['#17A2B8', '#FFA500', '#DC3545', '#BEIGE', '#708090', '#FF6B6B', '#FFD700', '#8B4513', '#9932CC'];
  const years = ['2016', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  const data = [1, 9, 6, 0, 8, 5, 3, 1, 3];
  
  if (window.evolutionChartInstance) {
    window.evolutionChartInstance.destroy();
  }
  
  window.evolutionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Municípios Implantados',
        data: data,
        backgroundColor: colors,
        borderColor: '#333',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 10
        }
      }
    }
  });
}

// APRESENTAÇÕES
function renderPresentations() {
  renderPresentationsFilters();
  renderPresentationsTable();
}

function renderPresentationsFilters() {
  const html = `
    <label>Status <select id="pres-filter-status" onchange="renderPresentations()">
      <option value="">Todos</option>
      <option value="Pendente">Pendente</option>
      <option value="Realizada">Realizada</option>
      <option value="Cancelada">Cancelada</option>
    </select></label>
    <button onclick="clearPresentationFilters()" class="btn-secondary">Limpar Filtros</button>
  `;
  document.getElementById('presentations-filters').innerHTML = html;
}

function renderPresentationsTable() {
  const statusFilter = document.getElementById('pres-filter-status')?.value || '';
  
  let filtered = state.presentations.filter(p => {
    return !statusFilter || p.status === statusFilter;
  });
  
  document.getElementById('presentations-count').innerHTML = `<p>Total: ${filtered.length}</p>`;
  
  let html = '<table><thead><tr><th>Município</th><th>Data Sol.</th><th>Solicitante</th><th>Status</th><th>Orientadores</th><th>Ações</th></tr></thead><tbody>';
  
  filtered.forEach(pres => {
    html += `<tr>
      <td>${pres.municipality}</td>
      <td>${pres.dateRequest}</td>
      <td>${pres.applicant}</td>
      <td>${pres.status}</td>
      <td>${pres.orientadores.join(', ')}</td>
      <td>
        <button onclick="editPresentation(${pres.id})">Editar</button>
        <button onclick="deletePresentation(${pres.id})">Deletar</button>
      </td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  document.getElementById('presentations-table').innerHTML = html;
  renderPresentationsCharts(filtered);
}

function renderPresentationsCharts(filtered) {
  const pending = filtered.filter(p => p.status === 'Pendente').length;
  const realized = filtered.filter(p => p.status === 'Realizada').length;
  const canceled = filtered.filter(p => p.status === 'Cancelada').length;
  
  const html = `
    <h3>Estatísticas</h3>
    <div style="display: flex; gap: 20px;">
      <div><strong>Pendentes:</strong> ${pending}</div>
      <div><strong>Realizadas:</strong> ${realized}</div>
      <div><strong>Canceladas:</strong> ${canceled}</div>
    </div>
  `;
  document.getElementById('presentations-charts').innerHTML = html;
}

function savePresentationData() {
  const municipality = document.getElementById('pres-municipality').value;
  const dateRequest = document.getElementById('pres-date-request').value;
  const applicant = document.getElementById('pres-applicant').value;
  const status = document.getElementById('pres-status').value;
  const dateRealization = document.getElementById('pres-date-realization').value;
  const orientadores = Array.from(document.querySelectorAll('input[name="pres-orientador"]:checked')).map(cb => cb.value);
  const description = document.getElementById('pres-description').value;
  
  if (!municipality || !status) {
    alert('Preencha os campos obrigatórios!');
    return;
  }
  
  const presentation = {
    id: Date.now(),
    municipality,
    dateRequest,
    applicant,
    status,
    dateRealization,
    orientadores,
    description
  };
  
  state.presentations.push(presentation);
  saveDataToStorage();
  closeModal('modal-presentation');
  document.getElementById('form-presentation').reset();
  renderPresentations();
}

function editPresentation(id) {
  const pres = state.presentations.find(p => p.id === id);
  if (pres) {
    document.getElementById('pres-municipality').value = pres.municipality;
    document.getElementById('pres-date-request').value = pres.dateRequest;
    document.getElementById('pres-applicant').value = pres.applicant;
    document.getElementById('pres-status').value = pres.status;
    document.getElementById('pres-date-realization').value = pres.dateRealization || '';
    document.getElementById('pres-description').value = pres.description;
    
    const checkboxes = document.querySelectorAll('input[name="pres-orientador"]');
    checkboxes.forEach(cb => {
      cb.checked = pres.orientadores.includes(cb.value);
    });
    
    openModal('modal-presentation');
  }
}

function deletePresentation(id) {
  if (confirm('Deseja deletar?')) {
    state.presentations = state.presentations.filter(p => p.id !== id);
    saveDataToStorage();
    renderPresentations();
  }
}

function clearPresentationFilters() {
  document.getElementById('pres-filter-status').value = '';
  renderPresentations();
}

function togglePresStatus() {
  const status = document.getElementById('pres-status').value;
  const field = document.getElementById('pres-realization-field');
  if (status === 'Realizada') {
    field.style.display = 'block';
  } else {
    field.style.display = 'none';
  }
}

// DEMANDAS
function renderDemands() {
  renderDemandsFilters();
  renderDemandsTable();
}

function renderDemandsFilters() {
  const html = `
    <label>Status <select id="dem-filter-status" onchange="renderDemands()">
      <option value="">Todos</option>
      <option value="Pendente">Pendente</option>
      <option value="Realizada">Realizada</option>
      <option value="Inviável">Inviável</option>
    </select></label>
    <label>Prioridade <select id="dem-filter-priority" onchange="renderDemands()">
      <option value="">Todos</option>
      <option value="Alta">Alta</option>
      <option value="Média">Média</option>
      <option value="Baixa">Baixa</option>
    </select></label>
  `;
  document.getElementById('demands-filters').innerHTML = html;
}

function renderDemandsTable() {
  const statusFilter = document.getElementById('dem-filter-status')?.value || '';
  const priorityFilter = document.getElementById('dem-filter-priority')?.value || '';
  
  let filtered = state.demands.filter(d => {
    return (!statusFilter || d.status === statusFilter) && (!priorityFilter || d.priority === priorityFilter);
  });
  
  // Ordenar por prioridade
  const order = {Alta: 0, Média: 1, Baixa: 2, Inviável: 3};
  filtered.sort((a, b) => order[a.priority] - order[b.priority]);
  
  document.getElementById('demands-count').innerHTML = `<p>Total: ${filtered.length}</p>`;
  
  let html = '<table><thead><tr><th>Data</th><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr></thead><tbody>';
  
  filtered.forEach(dem => {
    html += `<tr>
      <td>${dem.date}</td>
      <td>${dem.description}</td>
      <td>${dem.priority}</td>
      <td>${dem.status}</td>
      <td>
        <button onclick="deleteDemand(${dem.id})">Deletar</button>
      </td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  document.getElementById('demands-table').innerHTML = html;
  renderDemandsCharts(filtered);
}

function renderDemandsCharts(filtered) {
  const pending = filtered.filter(d => d.status === 'Pendente').length;
  const realized = filtered.filter(d => d.status === 'Realizada').length;
  const unfeasible = filtered.filter(d => d.status === 'Inviável').length;
  
  const html = `
    <h3>Estatísticas</h3>
    <div style="display: flex; gap: 20px;">
      <div><strong>Pendentes:</strong> ${pending}</div>
      <div><strong>Realizadas:</strong> ${realized}</div>
      <div><strong>Inviáveis:</strong> ${unfeasible}</div>
    </div>
  `;
  document.getElementById('demands-charts').innerHTML = html;
}

function saveDemandData() {
  const date = document.getElementById('dem-date').value;
  const description = document.getElementById('dem-description').value;
  const priority = document.getElementById('dem-priority').value;
  const status = document.getElementById('dem-status').value;
  const dateRealization = document.getElementById('dem-date-realization').value;
  const justification = document.getElementById('dem-justification').value;
  
  if (!date || !description || !priority || !status) {
    alert('Preencha os campos obrigatórios!');
    return;
  }
  
  const demand = {
    id: Date.now(),
    date,
    description,
    priority,
    status,
    dateRealization,
    justification,
    user: state.currentUser.name
  };
  
  state.demands.push(demand);
  saveDataToStorage();
  closeModal('modal-demand');
  document.getElementById('form-demand').reset();
  renderDemands();
}

function deleteDemand(id) {
  if (confirm('Deseja deletar?')) {
    state.demands = state.demands.filter(d => d.id !== id);
    saveDataToStorage();
    renderDemands();
  }
}

function toggleDemandFields() {
  const status = document.getElementById('dem-status').value;
  const realizationField = document.getElementById('dem-realization-field');
  const justificationField = document.getElementById('dem-justification-field');
  
  realizationField.style.display = status === 'Realizada' ? 'block' : 'none';
  justificationField.style.display = status === 'Inviável' ? 'block' : 'none';
}

function updateDemCount() {
  const desc = document.getElementById('dem-description').value;
  document.getElementById('dem-count').textContent = desc.length + '/250';
}

// VISITAS
function renderVisits() {
  renderVisitsFilters();
  renderVisitsTable();
}

function renderVisitsFilters() {
  const html = `
    <label>Município <select id="vis-filter-municipality" onchange="renderVisits()">
      <option value="">Todos</option>
      ${state.municipalities.map(m => `<option value="${m}">${m}</option>`).join('')}
    </select></label>
    <label>Status <select id="vis-filter-status" onchange="renderVisits()">
      <option value="">Todos</option>
      <option value="Pendente">Pendente</option>
      <option value="Realizada">Realizada</option>
      <option value="Cancelada">Cancelada</option>
    </select></label>
  `;
  document.getElementById('visits-filters').innerHTML = html;
}

function renderVisitsTable() {
  const municipioFilter = document.getElementById('vis-filter-municipality')?.value || '';
  const statusFilter = document.getElementById('vis-filter-status')?.value || '';
  
  let filtered = state.visits.filter(v => {
    return (!municipioFilter || v.municipality === municipioFilter) && (!statusFilter || v.status === statusFilter);
  });
  
  document.getElementById('visits-count').innerHTML = `<p>Total: ${filtered.length}</p>`;
  
  let html = '<table><thead><tr><th>Município</th><th>Data Sol.</th><th>Solicitante</th><th>Status</th><th>Ações</th></tr></thead><tbody>';
  
  filtered.forEach(vis => {
    html += `<tr>
      <td>${vis.municipality}</td>
      <td>${vis.dateRequest}</td>
      <td>${vis.applicant}</td>
      <td>${vis.status}</td>
      <td>
        <button onclick="deleteVisit(${vis.id})">Deletar</button>
      </td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  document.getElementById('visits-table').innerHTML = html;
  renderVisitsCharts(filtered);
}

function renderVisitsCharts(filtered) {
  const pending = filtered.filter(v => v.status === 'Pendente').length;
  const realized = filtered.filter(v => v.status === 'Realizada').length;
  const canceled = filtered.filter(v => v.status === 'Cancelada').length;
  
  const html = `
    <h3>Estatísticas</h3>
    <div style="display: flex; gap: 20px;">
      <div><strong>Pendentes:</strong> ${pending}</div>
      <div><strong>Realizadas:</strong> ${realized}</div>
      <div><strong>Canceladas:</strong> ${canceled}</div>
    </div>
  `;
  document.getElementById('visits-charts').innerHTML = html;
}

function saveVisitData() {
  const municipality = document.getElementById('vis-municipality').value;
  const dateRequest = document.getElementById('vis-date-request').value;
  const applicant = document.getElementById('vis-applicant').value;
  const reason = document.getElementById('vis-reason').value;
  const status = document.getElementById('vis-status').value;
  const visitDate = document.getElementById('vis-visit-date').value;
  const cancelReason = document.getElementById('vis-cancel-reason').value;
  
  if (!municipality || !dateRequest || !applicant || !status) {
    alert('Preencha os campos obrigatórios!');
    return;
  }
  
  const visit = {
    id: Date.now(),
    municipality,
    dateRequest,
    applicant,
    reason,
    status,
    visitDate,
    cancelReason
  };
  
  state.visits.push(visit);
  saveDataToStorage();
  closeModal('modal-visit');
  document.getElementById('form-visit').reset();
  renderVisits();
}

function deleteVisit(id) {
  if (confirm('Deseja deletar?')) {
    state.visits = state.visits.filter(v => v.id !== id);
    saveDataToStorage();
    renderVisits();
  }
}

function toggleVisitFields() {
  const status = document.getElementById('vis-status').value;
  const visitDateField = document.getElementById('vis-visit-date-field');
  const cancelField = document.getElementById('vis-cancel-field');
  
  visitDateField.style.display = status === 'Realizada' ? 'block' : 'none';
  cancelField.style.display = status === 'Cancelada' ? 'block' : 'none';
}

// PRODUÇÃO
function renderProduction() {
  renderProductionFilters();
  renderProductionTable();
}

function renderProductionFilters() {
  const html = `
    <label>Município <select id="prod-filter-municipality" onchange="renderProduction()">
      <option value="">Todos</option>
      ${state.municipalities.map(m => `<option value="${m}">${m}</option>`).join('')}
    </select></label>
    <label>Status <select id="prod-filter-status" onchange="renderProduction()">
      <option value="">Todos</option>
      <option value="Enviada">Enviada</option>
      <option value="Pendente">Pendente</option>
      <option value="Cancelada">Cancelada</option>
    </select></label>
    <label>Frequência <select id="prod-filter-frequency" onchange="renderProduction()">
      <option value="">Todos</option>
      <option value="Diário">Diário</option>
      <option value="Semanal">Semanal</option>
      <option value="Quinzenal">Quinzenal</option>
      <option value="Mensal">Mensal</option>
    </select></label>
  `;
  document.getElementById('production-filters').innerHTML = html;
}

function renderProductionTable() {
  const municipioFilter = document.getElementById('prod-filter-municipality')?.value || '';
  const statusFilter = document.getElementById('prod-filter-status')?.value || '';
  const frequencyFilter = document.getElementById('prod-filter-frequency')?.value || '';
  
  let filtered = state.productions.filter(p => {
    return (!municipioFilter || p.municipality === municipioFilter) && 
           (!statusFilter || p.status === statusFilter) &&
           (!frequencyFilter || p.frequency === frequencyFilter);
  });
  
  document.getElementById('production-count').innerHTML = `<p>Total: ${filtered.length}</p>`;
  
  let html = '<table><thead><tr><th>Município</th><th>Profissional</th><th>Contato</th><th>Frequência</th><th>Competência</th><th>Período</th><th>Status</th><th>Ações</th></tr></thead><tbody>';
  
  filtered.forEach(prod => {
    html += `<tr>
      <td>${prod.municipality}</td>
      <td>${prod.professional}</td>
      <td>${prod.contact}</td>
      <td>${prod.frequency}</td>
      <td>${prod.competence}</td>
      <td>${prod.period}</td>
      <td>${prod.status}</td>
      <td>
        <button onclick="deleteProduction(${prod.id})">Deletar</button>
      </td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  document.getElementById('production-table').innerHTML = html;
  renderProductionCharts(filtered);
}

function renderProductionCharts(filtered) {
  const envidas = filtered.filter(p => p.status === 'Enviada').length;
  const pendentes = filtered.filter(p => p.status === 'Pendente').length;
  const canceladas = filtered.filter(p => p.status === 'Cancelada').length;
  
  const html = `
    <h3>Estatísticas</h3>
    <div style="display: flex; gap: 20px;">
      <div><strong>Enviadas:</strong> ${envidas}</div>
      <div><strong>Pendentes:</strong> ${pendentes}</div>
      <div><strong>Canceladas:</strong> ${canceladas}</div>
    </div>
  `;
  document.getElementById('production-charts').innerHTML = html;
}

function formatPhoneProduction(element) {
  let value = element.value;
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
  
  let formatted;
  if (cleaned.length <= 2) {
    formatted = cleaned;
  } else if (cleaned.length <= 7) {
    formatted = '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2);
  } else {
    formatted = '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2, 7) + '-' + cleaned.slice(7, 11);
  }
  
  element.value = formatted;
}

function formatCompetenceProduction(element) {
  let value = element.value;
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 6) cleaned = cleaned.slice(0, 6);
  
  let formatted;
  if (cleaned.length <= 2) {
    formatted = cleaned;
  } else {
    formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  }
  
  element.value = formatted;
}

function formatPeriodProduction(element) {
  let value = element.value;
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 16) cleaned = cleaned.slice(0, 16);
  
  let formatted;
  if (cleaned.length <= 8) {
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    } else {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4);
    }
  } else {
    let part1 = cleaned.slice(0, 8);
    let part2 = cleaned.slice(8);
    
    let formatted1 = part1.slice(0, 2) + '/' + part1.slice(2, 4) + '/' + part1.slice(4);
    
    if (part2.length <= 2) {
      formatted = formatted1 + ' à ' + part2;
    } else if (part2.length <= 4) {
      formatted = formatted1 + ' à ' + part2.slice(0, 2) + '/' + part2.slice(2);
    } else {
      formatted = formatted1 + ' à ' + part2.slice(0, 2) + '/' + part2.slice(2, 4) + '/' + part2.slice(4);
    }
  }
  
  element.value = formatted;
}

function saveProductionData() {
  const municipality = document.getElementById('prod-municipality').value;
  const professional = document.getElementById('prod-professional').value;
  const contact = document.getElementById('prod-contact').value;
  const frequency = document.getElementById('prod-frequency').value;
  const competence = document.getElementById('prod-competence').value;
  const period = document.getElementById('prod-period').value;
  const releaseDate = document.getElementById('prod-release-date').value;
  const sendDate = document.getElementById('prod-send-date').value;
  const status = document.getElementById('prod-status').value;
  const observations = document.getElementById('prod-observations').value;
  
  if (!municipality || !contact || !frequency || !competence || !period || !releaseDate || !status) {
    alert('Preencha os campos obrigatórios!');
    return;
  }
  
  if (contact.replace(/\D/g, '').length !== 11) {
    alert('Contato deve ter 11 dígitos!');
    return;
  }
  
  const production = {
    id: Date.now(),
    municipality,
    professional,
    contact,
    frequency,
    competence,
    period,
    releaseDate,
    sendDate,
    status,
    observations
  };
  
  state.productions.push(production);
  saveDataToStorage();
  closeModal('modal-production');
  document.getElementById('form-production').reset();
  renderProduction();
}

function deleteProduction(id) {
  if (confirm('Deseja deletar?')) {
    state.productions = state.productions.filter(p => p.id !== id);
    saveDataToStorage();
    renderProduction();
  }
}

// MODAIS
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// PREENCHIMENTO DE SELECTS
function populateModalsSelects() {
  const municipioSelects = ['pres-municipality', 'vis-municipality', 'prod-municipality'];
  
  municipioSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      state.municipalities.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        select.appendChild(option);
      });
    }
  });
  
  const presOrientadores = document.getElementById('pres-orientadores');
  if (presOrientadores) {
    state.orientadores.forEach(o => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'pres-orientador';
      checkbox.value = o;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + o));
      label.style.display = 'block';
      label.style.margin = '5px 0';
      presOrientadores.appendChild(label);
    });
  }
}

// BOTÕES
function setupButtons() {
  const btnNewPresentation = document.getElementById('btn-new-presentation');
  const btnNewDemand = document.getElementById('btn-new-demand');
  const btnNewVisit = document.getElementById('btn-new-visit');
  const btnNewProduction = document.getElementById('btn-new-production');
  
  if (btnNewPresentation) btnNewPresentation.addEventListener('click', () => openModal('modal-presentation'));
  if (btnNewDemand) btnNewDemand.addEventListener('click', () => openModal('modal-demand'));
  if (btnNewVisit) btnNewVisit.addEventListener('click', () => openModal('modal-visit'));
  if (btnNewProduction) btnNewProduction.addEventListener('click', () => openModal('modal-production'));
}

// TEMA
function setupTheme() {
  const themeBtn = document.getElementById('theme-btn');
  themeBtn.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', state.currentTheme);
}

// HOME
function setupHomeButton() {
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => showTab('dashboard'));
  }
}

// LOGOUT
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', function() {
    state.currentUser = null;
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  });
}

// STORAGE
function saveDataToStorage() {
  localStorage.setItem('presentations', JSON.stringify(state.presentations));
  localStorage.setItem('demands', JSON.stringify(state.demands));
  localStorage.setItem('visits', JSON.stringify(state.visits));
  localStorage.setItem('productions', JSON.stringify(state.productions));
}

function loadDataFromStorage() {
  const presentations = localStorage.getItem('presentations');
  const demands = localStorage.getItem('demands');
  const visits = localStorage.getItem('visits');
  const productions = localStorage.getItem('productions');
  
  if (presentations) state.presentations = JSON.parse(presentations);
  if (demands) state.demands = JSON.parse(demands);
  if (visits) state.visits = JSON.parse(visits);
  if (productions) state.productions = JSON.parse(productions);
}