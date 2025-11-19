// =====================================================
// SIGP SAÚDE v4.3 - VERSÃO FINAL 100% SEGURA
// Marcos Azevedo - 18/11/2025
// =====================================================

// VERIFICAÇÃO DE SEGURANÇA: CryptoJS DEVE estar carregado
if (typeof CryptoJS === 'undefined') {
    console.error('❌ ERRO CRÍTICO: CryptoJS não foi carregado!');
    alert('ERRO: Biblioteca de criptografia não carregada.');
}

// Configurações de segurança
const SALT_LENGTH = 16;

// Gera salt aleatório para cada usuário
function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}
// Hash da senha com salt (SHA-256)
function hashPassword(password, salt) {
    return CryptoJS.SHA256(salt + password).toString();
}
// =====================================================
// TEMA CLARO/ESCURO - DECLARAÇÃO INICIAL
// =====================================================
let currentTheme = recuperarDoArmazenamento('theme', 'light');

// =====================================================
// DADOS PADRÃO v4.3

// =====================================================
// FUNÇÕES DE PERSISTÊNCIA EM LOCALSTORAGE
// =====================================================

function salvarNoArmazenamento(chave, dados) {
  try {
    const dadosJSON = JSON.stringify(dados);
    localStorage.setItem(chave, dadosJSON);
    console.log(`✓ Salvo: ${chave} (${dadosJSON.length} bytes)`);
  } catch (erro) {
    console.error(`✗ Erro ao salvar ${chave}:`, erro);
    if (erro.name === 'QuotaExceededError') {
      alert('Espaço de armazenamento cheio! Faça backup e limpe os dados antigos.');
    }
  }
}

function recuperarDoArmazenamento(chave, valorPadrao = null) {
  try {
    const dados = localStorage.getItem(chave);
    if (dados) {
      return JSON.parse(dados);
    }
    return valorPadrao;
  } catch (erro) {
    console.error(`✗ Erro ao recuperar ${chave}:`, erro);
    return valorPadrao;
  }
}

function deletarDoArmazenamento(chave) {
  try {
    localStorage.removeItem(chave);
    console.log(`✓ Deletado: ${chave}`);
  } catch (erro) {
    console.error(`✗ Erro ao deletar ${chave}:`, erro);
  }
}

function limparTodoArmazenamento() {
  try {
    localStorage.clear();
    console.log('✓ Armazenamento local completamente limpo');
  } catch (erro) {
    console.error('✗ Erro ao limpar armazenamento:', erro);
  }
}

function verificarArmazenamentoDisponivel() {
  try {
    const teste = '__teste__';
    localStorage.setItem(teste, teste);
    localStorage.removeItem(teste);
    return true;
  } catch (erro) {
    console.error('localStorage não está disponível:', erro);
    return false;
  }

// =====================================================
// Função showToast - Mensagens Flutuantes
// =====================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#10b981' : 
                   type === 'error' ? '#ef4444' : '#3b82f6';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// =====================================================
// DADOS PADRÃO v4.3 - SENHA HASHEADA
// =====================================================

const DADOS_PADRAO = {
    users: [
        {
            id: 1,
            login: 'ADMIN',

      name: 'Administrador',
      salt: 'f3a9c8e2d1b7m5n9p4q8r6t2v1x5y7z0',
      passwordHash: 'c98f6b380e7fd8d5899fb3e46a84e3de7f47dff5ff2ebbf7ef0f0a3306d9eebd', // hash de "saude2025"
      permission: 'Administrador',
      status: 'Ativo',
      mustChangePassword: true  // Força troca no primeiro login
    }
  ],
  municipalitiesList: [
    { id: 1, name: 'Belo Horizonte', uf: 'MG', createdAt: '2025-01-01' },
    { id: 2, name: 'São Paulo', uf: 'SP', createdAt: '2025-01-01' }
  ],
  cargos: [
    { id: 1, name: 'Recepcionista', description: '', createdAt: '2025-01-01' },
    { id: 2, name: 'Agente Comunitário de Saúde', description: '', createdAt: '2025-01-01' },
    { id: 3, name: 'Técnico(a)/Auxiliar de Enfermagem', description: '', createdAt: '2025-01-01' },
    { id: 4, name: 'Enfermeiro(a)', description: '', createdAt: '2025-01-01' },
    { id: 5, name: 'Médico(a)', description: '', createdAt: '2025-01-01' },
    { id: 6, name: 'Dentista', description: '', createdAt: '2025-01-01' },
    { id: 7, name: 'Técnico(a)/Auxiliar em Saúde Bucal', description: '', createdAt: '2025-01-01' },
    { id: 8, name: 'Psicólogo(a)', description: '', createdAt: '2025-01-01' },
    { id: 9, name: 'Nutricionista', description: '', createdAt: '2025-01-01' },
    { id: 10, name: 'Secretário(a)', description: '', createdAt: '2025-01-01' },
    { id: 11, name: 'Coordenador(a)', description: '', createdAt: '2025-01-01' },
    { id: 12, name: 'Almoxarifado', description: '', createdAt: '2025-01-01' },
    { id: 13, name: 'Laboratório', description: '', createdAt: '2025-01-01' },
    { id: 14, name: 'Outros', description: '', createdAt: '2025-01-01' }
  ],
  orientadores: [
    { id: 1, name: 'Alícia Lopes', contact: '', email: '', createdAt: '2025-01-01' },
    { id: 2, name: 'Bruna Gomes', contact: '', email: '', createdAt: '2025-01-01' },
    { id: 3, name: 'Filipe Gonçalves', contact: '', email: '', createdAt: '2025-01-01' },
    { id: 4, name: 'Joey Alan', contact: '', email: '', createdAt: '2025-01-01' },
    { id: 5, name: 'Marcos Azevedo', contact: '', email: '', createdAt: '2025-01-01' },
    { id: 6, name: 'Wesley Lopes', contact: '', email: '', createdAt: '2025-01-01' }
  ],
  modulos: [
    { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#FF6B6B', createdAt: '2025-01-01' },
    { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#4ECDC4', createdAt: '2025-01-01' },
    { id: 3, name: 'Prontuário eletrônico', abbreviation: 'PRO', color: '#45B7D1', createdAt: '2025-01-01' },
    { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#FFA07A', createdAt: '2025-01-01' },
    { id: 5, name: 'Almoxarifado', abbreviation: 'ALM', color: '#98D8C8', createdAt: '2025-01-01' },
    { id: 6, name: 'Laboratório', abbreviation: 'LAB', color: '#F7DC6F', createdAt: '2025-01-01' },
    { id: 7, name: 'Gestor', abbreviation: 'GES', color: '#BB8FCE', createdAt: '2025-01-01' },
    { id: 8, name: 'Painel Indicadores', abbreviation: 'PAI', color: '#85C1E2', createdAt: '2025-01-01' },
    { id: 9, name: 'Pronto Atendimento', abbreviation: 'PRA', color: '#F8B88B', createdAt: '2025-01-01' },
    { id: 10, name: 'Frotas', abbreviation: 'FRO', color: '#A9DFBF', createdAt: '2025-01-01' },
    { id: 11, name: 'Regulação', abbreviation: 'REG', color: '#F5B041', createdAt: '2025-01-01' },
    { id: 12, name: 'CAPS', abbreviation: 'CAP', color: '#D7BFCD', createdAt: '2025-01-01' }
  ],
  formasApresentacao: [
    { id: 1, name: 'Presencial', createdAt: '2025-01-01' },
    { id: 2, name: 'Via AnyDesk', createdAt: '2025-01-01' },
    { id: 3, name: 'Via TeamViewer', createdAt: '2025-01-01' },
    { id: 4, name: 'Ligação', createdAt: '2025-01-01' },
    { id: 5, name: 'Google Meet', createdAt: '2025-01-01' },
    { id: 6, name: 'Zoom', createdAt: '2025-01-01' }
  ],
  requests: [],
  presentations: [],
  demands: [],
  visits: [],
  productions: [],
  tasks: [
    {
      id: 1,
      dateRequested: '2025-10-25',
      datePerformed: '2025-10-28',
      municipality: 'Belo Horizonte - MG',
      requestedBy: 'Maria',
      performedBy: 'Marcos Azevedo',
      trainedName: 'Ana Silva',
      trainedPosition: 'Enfermeiro(a)',
      contact: '(38) 99187-2144',
      status: 'Concluído',
      observations: 'Treinamento concluído com sucesso'
    }
  ],
  municipalities: [
    {
      id: 1,
      name: 'Exemplo de Município',
      modules: ['Cadastros', 'TFD'],
      manager: 'João Silva',
      contact: '(31) 98765-4321',
      implantationDate: '2023-01-15',
      lastVisit: '2025-10-28',
      status: 'Em uso',
      stoppageDate: null
    }
  ]
};
// =====================================================
// INICIALIZAR VARIÁVEIS COM LOCALSTORAGE
// =====================================================

// Authentication and Users
let users = []; // deixa vazio por enquanto — vamos carregar só na hora certa
let currentUser = recuperarDoArmazenamento('currentUser') || null;
let isAuthenticated = !!currentUser;
let editingUserId = null;
let userIdCounter = recuperarDoArmazenamento('userIdCounter', 2);
let sortedList = [];

// Municipalities List (Master) data
let municipalitiesList = recuperarDoArmazenamento('municipalitiesList', DADOS_PADRAO.municipalitiesList);
let municipalitiesListIdCounter = recuperarDoArmazenamento('municipalitiesListIdCounter', 3);
let editingMunicipalityListId = null;

// Cargos/Funções data
let cargos = recuperarDoArmazenamento('cargos', DADOS_PADRAO.cargos);
let cargoIdCounter = recuperarDoArmazenamento('cargoIdCounter', 15);
let editingCargoId = null;

// Orientadores data
let orientadores = recuperarDoArmazenamento('orientadores', DADOS_PADRAO.orientadores);
let orientadorIdCounter = recuperarDoArmazenamento('orientadorIdCounter', 7);
let editingOrientadorId = null;

// Módulos data (typo corrigido)
let modulos = recuperarDoArmazenamento('modulos', DADOS_PADRAO.modulos);
let moduloIdCounter = recuperarDoArmazenamento('moduloIdCounter', 13);
let editingModuloId = null;  // ← CORRIGIDO: era "editoingModuloId"

// Formas de Apresentação data
let formasApresentacao = recuperarDoArmazenamento('formasApresentacao', DADOS_PADRAO.formasApresentacao);
let formaApresentacaoIdCounter = recuperarDoArmazenamento('formaApresentacaoIdCounter', 7);
let editingFormaApresentacaoId = null;
    
// =====================================================
// TEMA CLARO/ESCURO
// =====================================================
let currentTheme = recuperarDoArmazenamento('theme', 'light');

// Solicitações/Sugestões data
let requests = recuperarDoArmazenamento('requests', DADOS_PADRAO.requests);
let requestIdCounter = recuperarDoArmazenamento('requestIdCounter', 1);
let editingRequestId = null;

// Apresentações data
let presentations = recuperarDoArmazenamento('presentations', DADOS_PADRAO.presentations);
let presentationIdCounter = recuperarDoArmazenamento('presentationIdCounter', 1);
let editingPresentationId = null;

// Demandas data
let demands = recuperarDoArmazenamento('demands', DADOS_PADRAO.demands);
let demandIdCounter = recuperarDoArmazenamento('demandIdCounter', 1);
let editingDemandId = null;

// Visitas data
let visits = recuperarDoArmazenamento('visits', DADOS_PADRAO.visits);
let visitIdCounter = recuperarDoArmazenamento('visitIdCounter', 1);
let editingVisitId = null;

// Produção data
let productions = recuperarDoArmazenamento('productions', DADOS_PADRAO.productions);
let productionIdCounter = recuperarDoArmazenamento('productionIdCounter', 1);
let editingProductionId = null;

// Data storage in memory
let tasks = recuperarDoArmazenamento('tasks', DADOS_PADRAO.tasks);
let editingTaskId = null;
let taskIdCounter = recuperarDoArmazenamento('taskIdCounter', 2);

let municipalities = recuperarDoArmazenamento('municipalities', DADOS_PADRAO.municipalities);
let editingMunicipalityId = null;
let municipalityIdCounter = recuperarDoArmazenamento('municipalityIdCounter', 2);

// Module abbreviations map - dynamically built from modulos
function getModuleAbbreviations() {
  const abbrev = {};
  modulos.forEach(m => {
    abbrev[m.name] = m.abbreviation;
  });
  return abbrev;
}

function getModuleColor(moduleName) {
  const module = modulos.find(m => m.name === moduleName);
  return module ? module.color : '#0078D4';
}

// Chart instances
let statusChart = null;
let modulesChart = null;
let timelineChart = null;
let requestStatusChart = null;
let requestMunicipalityChart = null;
let requestRequesterChart = null;
let presentationStatusChart = null;
let presentationMunicipalityChart = null;
let presentationOrientadorChart = null;
let implantationsYearChart = null;
let demandStatusChart = null;
let demandPriorityChart = null;
let demandUserChart = null;
let visitStatusChart = null;
let visitMunicipalityChart = null;
let visitApplicantChart = null;
let productionStatusChart = null;
let productionFrequencyChart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();

  // Set initial state: show login screen
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('main-app').classList.remove('active');

  checkAuthentication();
});

function checkAuthentication() {
  if (!isAuthenticated) {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-app').classList.remove('active');
  } else {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    initializeApp();
  }
}

function handleLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    isAuthenticated = false;
    currentUser = null;
    deletarDoArmazenamento('currentUser');
    checkAuthentication();
    showToast('Desconectado com sucesso!', 'success');
  }
}

// TROCA DE SENHA SEGURA v4.3
function showChangePasswordModal() {
  document.getElementById('change-password-modal').classList.add('show');
  document.getElementById('change-password-form').reset();
  document.getElementById('change-password-error').textContent = '';
}

function closeChangePasswordModal() {
  document.getElementById('change-password-modal').classList.remove('show');
}

function handleChangePassword(event) {
  event.preventDefault();
  const currentPwd = document.getElementById('current-password').value;
  const newPwd = document.getElementById('new-password').value;
  const confirmPwd = document.getElementById('confirm-password').value;
  const errorDiv = document.getElementById('change-password-error');

  if (!currentUser) {
    errorDiv.textContent = 'Erro: usuário não autenticado.';
    return;
  }
  
  if (!currentPwd || !newPwd || !confirmPwd) {
    errorDiv.textContent = 'Todos os campos são obrigatórios.';
    return;
}

  // Verificação com hash atual
  const currentHash = hashPassword(currentPwd, currentUser.salt);
  if (currentHash !== currentUser.passwordHash) {
    errorDiv.textContent = 'Senha atual incorreta.';
    return;
  }

  if (newPwd.length < 6) {
    errorDiv.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
    return;
  }

  if (newPwd !== confirmPwd) {
    errorDiv.textContent = 'As senhas não coincidem.';
    return;
  }
  // Update user password
  currentUser.password = newPwd;
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex].password = newPwd;
    salvarNoArmazenamento('users', users);
  }
  
  closeChangePasswordModal();
  showToast('Senha alterada com sucesso!', 'success');
}

  // Gera novo salt e hash
  currentUser.salt = generateSalt();
  currentUser.passwordHash = hashPassword(newPwd, currentUser.salt);
  currentUser.mustChangePassword = false;

  // Atualiza array e salva
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
    salvarNoArmazenamento('users', users);
  }
  salvarNoArmazenamento('currentUser', currentUser);
  closeChangePasswordModal();
  showToast('Senha alterada com sucesso!', 'success');

// =====================================================
// CRIAÇÃO/EDIÇÃO DE USUÁRIO COM HASH v4.3
// =====================================================
function saveUser(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('user-error');

  const userData = {
    login: document.getElementById('user-login').value.trim().toUpperCase(),
    name: document.getElementById('user-name').value.trim(),
    password: document.getElementById('user-password').value,
    permission: document.getElementById('user-permission').value,
    status: document.getElementById('user-status').value
  };

  // Validate login uniqueness for new users (case-insensitive)
  if (!editingUserId) {
    const loginExists = users.some(u => u.login.toUpperCase() === userData.login);
    if (loginExists) {
      errorDiv.textContent = 'Este login já está em uso. Escolha outro.';
      return;
    }
  }

  // Gera salt e hash para nova senha
  const salt = generateSalt();
  const passwordHash = hashPassword(userData.password, salt);

  const fullUserData = {
    ...userData,
    salt,
    passwordHash,
    mustChangePassword: editingUserId ? false : true  // Novos usuários devem trocar senha
  };

  if (editingUserId) {
    const index = users.findIndex(u => u.id === editingUserId);
    users[index] = { ...users[index], ...fullUserData };

    // Update currentUser if editing themselves
    if (currentUser && currentUser.id === editingUserId) {
      currentUser = users[index];
      updateUserInterface();
    }

    showToast('Usuário atualizado com sucesso!', 'success');
  } else {
    users.push({ id: userIdCounter++, ...fullUserData });
    showToast('Usuário criado com sucesso!', 'success');
  }

  closeUserModal();
  renderUsers();
  updateUserStats();
  salvarNoArmazenamento('users', users);
  salvarNoArmazenamento('userIdCounter', userIdCounter);
}
function initializeApp() {
  updateUserInterface();
  initializeTabs();
  renderTasks();
  renderMunicipalities();
  renderUsers();
  updateTaskStats();
  updateMunicipalityStats();
  updateUserStats();
  initializeCharts();
  initializeFilters();
  updateThemeButton();
  updateCargoDropdowns();
  updateOrientadorDropdowns();
  updateModuloCheckboxes();
  updateMunicipalityListDropdowns();
  updateFormaApresentacaoCheckboxes();
  updateRequestMunicipalityDropdowns(sortedList);
  populateAllMunicipalitySelects();
  updatePresentationDropdowns();
  initializeRequestCharts();
  initializePresentationCharts();
  updateDashboardStats();
  initializeDashboardCharts();
  initializeDemandCharts();
  initializeVisitCharts();
  initializeProductionCharts();
}

function updateUserInterface() {
  // Update logged user name
  if (currentUser) {
    document.getElementById('logged-user-name').textContent = currentUser.name;
  }
  
  // Show/hide admin-only menu items based on permission
  const userManagementBtn = document.getElementById('user-management-menu-btn');
  const cargoManagementBtn = document.getElementById('cargo-management-menu-btn');
  const orientadorManagementBtn = document.getElementById('orientador-management-menu-btn');
  const moduloManagementBtn = document.getElementById('modulo-management-menu-btn');
  const municipalityListManagementBtn = document.getElementById('municipality-list-management-menu-btn');
  const backupManagementBtn = document.getElementById('backup-menu-btn');
  const adminDivider = document.getElementById('admin-divider');
  
  const isAdmin = currentUser && currentUser.permission === 'Administrador';
  const isNormalUser = currentUser && (currentUser.permission === 'Usuário Normal' || currentUser.permission === 'Administrador');
  
  if (userManagementBtn) userManagementBtn.style.display = isAdmin ? 'flex' : 'none';
  if (cargoManagementBtn) cargoManagementBtn.style.display = isNormalUser ? 'flex' : 'none';
  if (orientadorManagementBtn) orientadorManagementBtn.style.display = isNormalUser ? 'flex' : 'none';
  if (moduloManagementBtn) moduloManagementBtn.style.display = isNormalUser ? 'flex' : 'none';
  const formaApresentacaoManagementBtn = document.getElementById('forma-apresentacao-management-menu-btn');
  if (formaApresentacaoManagementBtn) formaApresentacaoManagementBtn.style.display = isNormalUser ? 'flex' : 'none';
  if (municipalityListManagementBtn) municipalityListManagementBtn.style.display = isNormalUser ? 'flex' : 'none';
  if (backupManagementBtn) backupManagementBtn.style.display = isNormalUser ? 'flex' : 'none';
  if (adminDivider) adminDivider.style.display = isAdmin ? 'block' : 'none';
}
  
  // Login successful
  currentUser = user;
  isAuthenticated = true;
  errorDiv.textContent = '';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  checkAuthentication();
}

function closeChangePasswordModal() {
  document.getElementById('change-password-modal').classList.remove('show');
}

// Tab navigation
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}-section`).classList.add('active');
      
      // Update charts if switching to municipalities tab
      if (tabName === 'municipios') {
        updateCharts();
      }
      
      // Update dashboard if switching to dashboard tab
      if (tabName === 'dashboard') {
        updateDashboardStats();
        updateDashboardCharts();
      }
    });
  });
}

// Navigate to Dashboard (Tela Inicial)
function navigateToHome() {
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  const dashboardBtn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
  if (dashboardBtn) {
    dashboardBtn.classList.add('active');
  }
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('dashboard-section').classList.add('active');
  
  updateDashboardStats();
  updateDashboardCharts();
}

// Navigate to User Management from header button
function navigateToUserManagement() {
  // Check permission
  if (!currentUser || currentUser.permission !== 'Administrador') {
    showToast('Acesso negado. Apenas administradores podem acessar esta área.', 'error');
    return;
  }
  
  // Update active tab button in sidebar
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('usuarios-section').classList.add('active');
  
  // Render users
  renderUsers();
  updateUserStats();
  renderRequests();
  updateRequestStats();
  updateRequestCharts();
  renderPresentations();
  updatePresentationStats();
  updatePresentationCharts();
  initializeRequestFilters();
  initializePresentationFilters();
  updateDashboardStats();
  
  console.log('Sistema inicializado com sucesso');
  console.log('Total de módulos:', modulos.length);
  console.log('Cores dos módulos:', modulos.map(m => `${m.name}: ${m.color}`).join(', '));
  
  // Initialize demand filters
  const demandDescriptionTextarea = document.getElementById('demand-description');
  if (demandDescriptionTextarea) {
    demandDescriptionTextarea.addEventListener('input', updateDemandCharCounter);
  }
  
  document.getElementById('filter-demand-status')?.addEventListener('change', renderDemands);
  document.getElementById('filter-demand-priority')?.addEventListener('change', renderDemands);
  document.getElementById('filter-demand-user')?.addEventListener('input', renderDemands);
  document.getElementById('filter-demand-date-type')?.addEventListener('change', renderDemands);
  document.getElementById('filter-demand-date-start')?.addEventListener('change', renderDemands);
  document.getElementById('filter-demand-date-end')?.addEventListener('change', renderDemands);
  
  // Initialize visit filters
  document.getElementById('filter-visit-municipality')?.addEventListener('change', renderVisits);
  document.getElementById('filter-visit-status')?.addEventListener('change', renderVisits);
  document.getElementById('filter-visit-applicant')?.addEventListener('input', renderVisits);
  document.getElementById('filter-visit-date-type')?.addEventListener('change', renderVisits);
  document.getElementById('filter-visit-date-start')?.addEventListener('change', renderVisits);
  document.getElementById('filter-visit-date-end')?.addEventListener('change', renderVisits);
  
  // Initialize production filters
  document.getElementById('filter-production-municipality')?.addEventListener('change', renderProductions);
  document.getElementById('filter-production-status')?.addEventListener('change', renderProductions);
  document.getElementById('filter-production-professional')?.addEventListener('input', renderProductions);
  document.getElementById('filter-production-frequency')?.addEventListener('change', renderProductions);
  document.getElementById('filter-production-release-start')?.addEventListener('change', renderProductions);
  document.getElementById('filter-production-release-end')?.addEventListener('change', renderProductions);
  document.getElementById('filter-production-send-start')?.addEventListener('change', renderProductions);
  document.getElementById('filter-production-send-end')?.addEventListener('change', renderProductions);
  
  const productionContactInput = document.getElementById('production-contact');
  if (productionContactInput) {
    productionContactInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  // Render initial data
  renderDemands();
  updateDemandStats();
  renderVisits();
  updateVisitStats();
  renderProductions();
  updateProductionStats();
  updateVisitMunicipalityDropdowns();
  updateProductionMunicipalityDropdowns();
}

// Task Management Functions

function showTaskModal(taskId = null) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const title = document.getElementById('task-modal-title');
  
  form.reset();
  editingTaskId = taskId;
  
  if (taskId) {
    title.textContent = 'Editar Treinamento';
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      document.getElementById('task-date-requested').value = task.dateRequested;
      document.getElementById('task-date-performed').value = task.datePerformed || '';
      document.getElementById('task-requested-by').value = task.requestedBy;
      document.getElementById('task-performed-by').value = task.performedBy || '';
      document.getElementById('task-trained-name').value = task.trainedName || '';
      document.getElementById('task-trained-position').value = task.trainedPosition || '';
      document.getElementById('task-contact').value = task.contact || '';
      document.getElementById('task-status').value = task.status || 'Tarefa Pendente';
      document.getElementById('task-observations').value = task.observations || '';
    }
  } else {
    title.textContent = 'Novo Treinamento';
  }
  
  modal.classList.add('show');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('show');
  editingTaskId = null;
}

function saveTask(event) {
  event.preventDefault();
  
  const taskData = {
    dateRequested: document.getElementById('task-date-requested').value,
    datePerformed: document.getElementById('task-date-performed').value,
    municipality: document.getElementById('task-municipality').value,
    requestedBy: document.getElementById('task-requested-by').value,
    performedBy: document.getElementById('task-performed-by').value,
    trainedName: document.getElementById('task-trained-name').value,
    trainedPosition: document.getElementById('task-trained-position').value,
    contact: document.getElementById('task-contact').value,
    status: document.getElementById('task-status').value,
    observations: document.getElementById('task-observations').value
  };
  
  if (editingTaskId) {
    const index = tasks.findIndex(t => t.id === editingTaskId);
    tasks[index] = { ...tasks[index], ...taskData };
    salvarNoArmazenamento('tasks', tasks);
    showToast('Treinamento atualizado com sucesso!', 'success');
  } else {
    tasks.push({ id: taskIdCounter++, ...taskData });
    salvarNoArmazenamento('tasks', tasks);
    salvarNoArmazenamento('taskIdCounter', taskIdCounter);
    showToast('Treinamento criado com sucesso!', 'success');
  }
  
  closeTaskModal();
  renderTasks();
  updateTaskStats();
  updateDashboardStats();
}

function deleteTask(taskId) {
  if (confirm('Tem certeza que deseja excluir este treinamento?')) {
    tasks = tasks.filter(t => t.id !== taskId);
    salvarNoArmazenamento('tasks', tasks);
    renderTasks();
    updateTaskStats();
    updateDashboardStats();
    showToast('Treinamento excluído com sucesso!', 'success');
  }
}

function renderTasks() {
  const container = document.getElementById('tasks-table');
  const resultsCountDiv = document.getElementById('tasks-results-count');
  const filters = getTaskFilters();
  
  let filteredTasks = tasks.filter(task => {
    if (filters.municipality && task.municipality !== filters.municipality) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.requester && !task.requestedBy.toLowerCase().includes(filters.requester.toLowerCase())) return false;
    if (filters.performer && task.performedBy && !task.performedBy.toLowerCase().includes(filters.performer.toLowerCase())) return false;
    if (filters.position && task.trainedPosition !== filters.position) return false;
    
    // Date filtering based on selected date type
    const dateToFilter = filters.dateType === 'performed' ? task.datePerformed : task.dateRequested;
    
    // If filtering by performed date and task doesn't have performed date, skip it
    if (filters.dateType === 'performed' && !dateToFilter && (filters.dateStart || filters.dateEnd)) {
      return false;
    }
    
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  // Show results count
  const filtersApplied = filters.municipality || filters.status || filters.requester || filters.performer || filters.position || filters.dateStart || filters.dateEnd;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.municipality) filterInfo.push(`Município=${filters.municipality}`);
    if (filters.requester) filterInfo.push(`Solicitante=${filters.requester}`);
    if (filters.performer) filterInfo.push(`Orientador=${filters.performer}`);
    if (filters.position) filterInfo.push(`Cargo=${filters.position}`);
    if (filters.dateStart || filters.dateEnd) {
      const dateType = filters.dateType === 'performed' ? 'Realização' : 'Solicitação';
      filterInfo.push(`Data ${dateType}=${filters.dateStart || ''} a ${filters.dateEnd || ''}`);
    }
    resultsCountDiv.innerHTML = `<strong>${filteredTasks.length}</strong> treinamento(s) encontrado(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredTasks.length}</strong> treinamento(s) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum treinamento encontrado</p></div>';
    return;
  }
  
  function getStatusClass(status) {
    if (status === 'Concluído') return 'completed';
    if (status === 'Cancelado') return 'cancelled';
    return 'pending';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Data Solicitação</th>
          <th>Data Realização</th>
          <th>Município</th>
          <th>Solicitante</th>
          <th>Orientador</th>
          <th>Profissional à treinar</th>
          <th>Cargo/Função</th>
          <th>Contato</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredTasks.map(task => `
          <tr>
            <td>${formatDate(task.dateRequested)}</td>
            <td>${task.datePerformed ? formatDate(task.datePerformed) : '-'}</td>
            <td>${task.municipality || '-'}</td>
            <td><strong>${task.requestedBy}</strong></td>
            <td>${task.performedBy || '-'}</td>
            <td>${task.trainedName || '-'}</td>
            <td>${task.trainedPosition || '-'}</td>
            <td>${task.contact || '-'}</td>
            <td>
              <span class="task-status ${getStatusClass(task.status)}">
                ${task.status}
              </span>
            </td>
            <td>
              <div class="task-actions-compact">
                <button class="task-action-btn edit" onclick="showTaskModal(${task.id})" title="Editar">
                 ✏️
                </button>
                <button class="task-action-btn delete" onclick="deleteTask(${task.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateTaskStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Concluído').length;
  const pending = tasks.filter(t => t.status === 'Pendente').length;
  const cancelled = tasks.filter(t => t.status === 'Cancelado').length;
  
  document.getElementById('total-tasks').textContent = total;
  document.getElementById('completed-tasks').textContent = completed;
  document.getElementById('pending-tasks').textContent = pending;
  document.getElementById('cancelled-tasks').textContent = cancelled;
}

function getTaskFilters() {
  return {
    municipality: document.getElementById('filter-task-municipality').value,
    status: document.getElementById('filter-task-status').value,
    requester: document.getElementById('filter-task-requester').value,
    performer: document.getElementById('filter-task-performer').value,
    position: document.getElementById('filter-task-position').value,
    dateType: document.getElementById('filter-date-type').value,
    dateStart: document.getElementById('filter-task-date-start').value,
    dateEnd: document.getElementById('filter-task-date-end').value
  };
}

function clearTaskFilters() {
  document.getElementById('filter-task-municipality').value = '';
  document.getElementById('filter-task-status').value = '';
  document.getElementById('filter-task-requester').value = '';
  document.getElementById('filter-task-performer').value = '';
  document.getElementById('filter-task-position').value = '';
  document.getElementById('filter-date-type').value = 'requested';
  document.getElementById('filter-task-date-start').value = '';
  document.getElementById('filter-task-date-end').value = '';
  renderTasks();
}

// Municipality Management Functions

function showMunicipalityModal(municipalityId = null) {
  const modal = document.getElementById('municipality-modal');
  const form = document.getElementById('municipality-form');
  const title = document.getElementById('municipality-modal-title');
  
  form.reset();
  document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = false);
  editingMunicipalityId = municipalityId;
  
  if (municipalityId) {
    title.textContent = 'Editar Município';
    const municipality = municipalities.find(m => m.id === municipalityId);
    if (municipality) {
      document.getElementById('municipality-name').value = municipality.name;
      document.getElementById('municipality-status').value = municipality.status;
      municipality.modules.forEach(module => {
        const checkbox = document.querySelector(`.module-checkbox[value="${module}"]`);
        if (checkbox) checkbox.checked = true;
      });
      document.getElementById('municipality-manager').value = municipality.manager;
      document.getElementById('municipality-contact').value = municipality.contact || '';
      document.getElementById('municipality-implantation-date').value = municipality.implantationDate || '';
      document.getElementById('municipality-last-visit').value = municipality.lastVisit || '';
      document.getElementById('municipality-stoppage-date').value = municipality.stoppageDate || '';
    }
  } else {
    title.textContent = 'Novo Município';
    // Set default status to Em uso
    document.getElementById('municipality-status').value = 'Em uso';
  }
  
  // Update field requirements based on status
  handleStatusChange();
  
  modal.classList.add('show');
}

function closeMunicipalityModal() {
  document.getElementById('municipality-modal').classList.remove('show');
  editingMunicipalityId = null;
}

function saveMunicipality(event) {
  event.preventDefault();
  
  const status = document.getElementById('municipality-status').value;
  const selectedModules = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
  const stoppageDate = document.getElementById('municipality-stoppage-date').value;
  
  // Only require modules if status is Em uso
  if (status === 'Em uso' && selectedModules.length === 0) {
    showToast('Selecione pelo menos um módulo', 'error');
    return;
  }
  
  // Require stoppage date if status is Bloqueado or Parou de usar
  if ((status === 'Bloqueado' || status === 'Parou de usar') && !stoppageDate) {
    showToast('Informe a data de bloqueio/parada', 'error');
    return;
  }
  
  const municipalityData = {
    name: document.getElementById('municipality-name').value,
    modules: selectedModules,
    manager: document.getElementById('municipality-manager').value,
    contact: document.getElementById('municipality-contact').value,
    implantationDate: document.getElementById('municipality-implantation-date').value,
    lastVisit: document.getElementById('municipality-last-visit').value,
    status: status,
    stoppageDate: (status === 'Bloqueado' || status === 'Parou de usar') ? stoppageDate : null
  };
  
  if (editingMunicipalityId) {
    const index = municipalities.findIndex(m => m.id === editingMunicipalityId);
    municipalities[index] = { ...municipalities[index], ...municipalityData };
    showToast('Município atualizado com sucesso!', 'success');
  } else {
    municipalities.push({ id: municipalityIdCounter++, ...municipalityData });
    showToast('Município criado com sucesso!', 'success');
  }
    // === CORREÇÃO: ATUALIZA TODOS OS SELECTS DE MUNICÍPIO ===
  updateSortedList();
  populateAllMunicipalitySelects();
  // ======================================================
  
  closeMunicipalityModal();
  renderMunicipalities();
  updateMunicipalityStats();
  updateCharts();
  updateDashboardStats();
  updateDashboardCharts();
}

function deleteMunicipality(municipalityId) {
  if (confirm('Tem certeza que deseja excluir este município?')) {
    municipalities = municipalities.filter(m => m.id !== municipalityId);
    renderMunicipalities();
    updateMunicipalityStats();
    updateCharts();
    updateDashboardStats();
    updateDashboardCharts();
    showToast('Município excluído com sucesso!', 'success');
  }
}

function renderMunicipalities() {
  const container = document.getElementById('municipalities-table');
  const filters = getMunicipalityFilters();
  
  let filteredMunicipalities = municipalities.filter(municipality => {
    if (filters.name && !municipality.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.status && municipality.status !== filters.status) return false;
    if (filters.module && !municipality.modules.includes(filters.module)) return false;
    if (filters.manager && !municipality.manager.toLowerCase().includes(filters.manager.toLowerCase())) return false;
    return true;
  });
  
  // Sort alphabetically by name
  filteredMunicipalities.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  // Show results count
  const resultsCountDiv = document.getElementById('municipalities-results-count');
  const filtersApplied = filters.name || filters.status || filters.module || filters.manager;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.name) filterInfo.push(`Município=${filters.name}`);
    if (filters.module) filterInfo.push(`Módulo=${filters.module}`);
    if (filters.manager) filterInfo.push(`Gestor=${filters.manager}`);
    resultsCountDiv.innerHTML = `<strong>${filteredMunicipalities.length}</strong> município(s) encontrado(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredMunicipalities.length}</strong> município(s) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredMunicipalities.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum município encontrado</p></div>';
    return;
  }
  
  function getStatusBadgeClass(status) {
    if (status === 'Em uso') return 'active';
    if (status === 'Bloqueado') return 'blocked';
    if (status === 'Parou de usar') return 'stopped';
    if (status === 'Não Implantado') return 'not-deployed';
    return 'active';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Município</th>
          <th>Módulos</th>
          <th>Gestor</th>
          <th>Contato</th>
          <th>Implantação</th>
          <th>Última visita</th>
          <th>Tempo de Uso</th>
          <th>Dias desde visita</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredMunicipalities.map(municipality => `
          <tr>
            <td><strong>${municipality.name}</strong></td>
            <td>
              <div class="module-tags">
                ${municipality.modules.map(module => {
                  const abbrev = getModuleAbbreviations();
                  const color = getModuleColor(module);
                  // CORREÇÃO 2: Each module with its unique color
                  return `<span class="module-tag" style="background-color: ${color}; color: #ffffff;" title="${module}">${abbrev[module] || module}</span>`;
                }).join('')}
              </div>
            </td>
            <td>${municipality.manager}</td>
            <td>${municipality.contact}</td>
            <td>${formatDate(municipality.implantationDate)}</td>
            <td>${formatDate(municipality.lastVisit)}</td>
            <td>${calculateTimeInUse(municipality)}</td>
            <td>${calculateDaysSinceVisit(municipality)}</td>
            <td>
              <span class="status-badge ${getStatusBadgeClass(municipality.status)}">
                ${municipality.status}
              </span>
            </td>
            <td>
              <div class="task-actions">
                <button class="btn btn--outline btn--sm" onclick="showMunicipalityModal(${municipality.id})" title="Editar">
                  ✏️
                </button>
                <button class="btn btn--outline btn--sm" onclick="deleteMunicipality(${municipality.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateMunicipalityStats() {
  const total = municipalities.length;
  const active = municipalities.filter(m => m.status === 'Em uso').length;
  const inactive = total - active;
  
  // Calculate average days only for active municipalities
  const activeMunicipalities = municipalities.filter(m => m.status === 'Em uso' && m.lastVisit);
  const avgDays = activeMunicipalities.length > 0 
    ? Math.round(activeMunicipalities.reduce((sum, m) => sum + getDaysSinceVisit(m.lastVisit), 0) / activeMunicipalities.length)
    : 0;
  
  document.getElementById('total-municipalities').textContent = total;
  document.getElementById('active-municipalities').textContent = active;
  document.getElementById('inactive-municipalities').textContent = inactive;
  document.getElementById('avg-days-last-visit').textContent = avgDays;
}

function getMunicipalityFilters() {
  return {
    name: document.getElementById('filter-municipality-name').value,
    status: document.getElementById('filter-municipality-status').value,
    module: document.getElementById('filter-municipality-module').value,
    manager: document.getElementById('filter-municipality-manager').value
  };
}

function clearMunicipalityFilters() {
  document.getElementById('filter-municipality-name').value = '';
  document.getElementById('filter-municipality-status').value = '';
  document.getElementById('filter-municipality-module').value = '';
  document.getElementById('filter-municipality-manager').value = '';
  renderMunicipalities();
}

// Chart Functions

function initializeCharts() {
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  const modulesCtx = document.getElementById('modulesChart').getContext('2d');
  const timelineCtx = document.getElementById('timelineChart').getContext('2d');
  
  statusChart = new Chart(statusCtx, {
    type: 'pie',
    data: {
      labels: ['Ativo', 'Bloqueado', 'Parou de usar', 'Não Implantado'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: currentTheme === 'dark' ? ['#40A9FF', '#FF5459', '#E68161', '#A7A9A9'] : ['#0078D4', '#B4413C', '#A84B2F', '#626C71']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  modulesChart = new Chart(modulesCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Quantidade de Municípios',
        data: [],
        backgroundColor: []
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
  
  timelineChart = new Chart(timelineCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Implantações',
        data: [],
        borderColor: currentTheme === 'dark' ? '#40A9FF' : '#0078D4',
        backgroundColor: currentTheme === 'dark' ? 'rgba(64, 169, 255, 0.1)' : 'rgba(0, 120, 212, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
  
  updateCharts();
}

function updateCharts() {
  if (!statusChart || !modulesChart || !timelineChart) return;
  
  // Update colors based on theme
  const primaryColor = currentTheme === 'dark' ? '#40A9FF' : '#0078D4';
  const errorColor = currentTheme === 'dark' ? '#FF5459' : '#B4413C';
  
  // Status Chart
  const active = municipalities.filter(m => m.status === 'Em uso').length;
  const blocked = municipalities.filter(m => m.status === 'Bloqueado').length;
  const stopped = municipalities.filter(m => m.status === 'Parou de usar').length;
  const notDeployed = municipalities.filter(m => m.status === 'Não Implantado').length;
  
  statusChart.data.labels = ['Em uso', 'Bloqueado', 'Parou de usar', 'Não Implantado'];
  statusChart.data.datasets[0].data = [active, blocked, stopped, notDeployed];
  const warningColor = currentTheme === 'dark' ? '#E68161' : '#A84B2F';
  const infoColor = currentTheme === 'dark' ? '#A7A9A9' : '#626C71';
  statusChart.data.datasets[0].backgroundColor = [primaryColor, errorColor, warningColor, infoColor];
  statusChart.update();
  
  // Modules Chart with individual colors
  const moduleCounts = {};
  municipalities.forEach(m => {
    m.modules.forEach(module => {
      moduleCounts[module] = (moduleCounts[module] || 0) + 1;
    });
  });
  const moduleLabels = Object.keys(moduleCounts);
  const moduleColors = moduleLabels.map(label => getModuleColor(label));
  // CORREÇÃO 2: Ensure each module has its unique color in chart
  modulesChart.data.labels = moduleLabels;
  modulesChart.data.datasets[0].data = Object.values(moduleCounts);
  modulesChart.data.datasets[0].backgroundColor = moduleColors;
  modulesChart.data.datasets[0].borderColor = '#ffffff';
  modulesChart.data.datasets[0].borderWidth = 1;
  modulesChart.update();
  
  // Timeline Chart
  const implantationsByMonth = {};
  municipalities.forEach(m => {
    const date = new Date(m.implantationDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    implantationsByMonth[key] = (implantationsByMonth[key] || 0) + 1;
  });
  
  const sortedDates = Object.keys(implantationsByMonth).sort();
  const cumulativeCounts = [];
  let cumulative = 0;
  sortedDates.forEach(date => {
    cumulative += implantationsByMonth[date];
    cumulativeCounts.push(cumulative);
  });
  
  timelineChart.data.labels = sortedDates.map(date => {
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  });
  timelineChart.data.datasets[0].data = cumulativeCounts;
  timelineChart.data.datasets[0].borderColor = primaryColor;
  timelineChart.data.datasets[0].backgroundColor = currentTheme === 'dark' ? 'rgba(64, 169, 255, 0.1)' : 'rgba(0, 120, 212, 0.1)';
  timelineChart.update();
}

// Export Functions

function exportTasksCSV() {
  const filters = getTaskFilters();
  const filteredTasks = tasks.filter(task => {
    if (filters.municipality && task.municipality !== filters.municipality) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.requester && !task.requestedBy.toLowerCase().includes(filters.requester.toLowerCase())) return false;
    if (filters.performer && task.performedBy && !task.performedBy.toLowerCase().includes(filters.performer.toLowerCase())) return false;
    if (filters.position && task.trainedPosition !== filters.position) return false;
    
    const dateToFilter = filters.dateType === 'performed' ? task.datePerformed : task.dateRequested;
    if (filters.dateType === 'performed' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  const headers = ['Data Solicitação', 'Data Realização', 'Município', 'Solicitante', 'Orientador', 'Profissional à treinar/treinado', 'Cargo/Função', 'Contato', 'Status', 'Observações'];
  const rows = filteredTasks.map(task => [
    task.dateRequested,
    task.datePerformed || '',
    task.municipality || '',
    task.requestedBy,
    task.performedBy || '',
    task.trainedName || '',
    task.trainedPosition || '',
    task.contact || '',
    task.status,
    task.observations || ''
  ]);
  
  downloadCSV('treinamentos.csv', headers, rows);
  showToast('CSV exportado com sucesso!', 'success');
}

function exportMunicipalitiesCSV() {
  const filters = getMunicipalityFilters();
  const filteredMunicipalities = municipalities.filter(municipality => {
    if (filters.name && !municipality.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.status && municipality.status !== filters.status) return false;
    if (filters.module && !municipality.modules.includes(filters.module)) return false;
    if (filters.manager && !municipality.manager.toLowerCase().includes(filters.manager.toLowerCase())) return false;
    return true;
  });
  
  // Sort alphabetically before export
  const sortedMunicipalities = [...filteredMunicipalities].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  const headers = ['Município', 'Módulos', 'Gestor', 'Contato', 'Implantação', 'Última visita', 'Data Bloqueio/Parada', 'Tempo de Uso', 'Dias desde visita', 'Status'];
  const rows = sortedMunicipalities.map(m => [
    m.name,
    m.modules.join('; '),
    m.manager,
    m.contact || '',
    m.implantationDate || '',
    m.lastVisit || '',
    m.stoppageDate || '',
    calculateTimeInUse(m),
    calculateDaysSinceVisit(m),
    m.status
  ]);
  
  downloadCSV('municipios.csv', headers, rows);
  showToast('CSV exportado com sucesso!', 'success');
}

function downloadCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility Functions

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

function calculateTimeInUse(municipality) {
  // Check if status is Não Implantado
  if (municipality.status === 'Não Implantado' || !municipality.implantationDate) {
    return '-';
  }
  
  const start = new Date(municipality.implantationDate + 'T00:00:00');
  let end;
  
  // Use stoppage date if status is Bloqueado or Parou de usar
  if ((municipality.status === 'Bloqueado' || municipality.status === 'Parou de usar') && municipality.stoppageDate) {
    end = new Date(municipality.stoppageDate + 'T00:00:00');
  } else {
    end = new Date();
  }
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  if (months < 0) return '-';
  if (months < 1) return 'Menos de 1 mês';
  if (months === 1) return '1 mês';
  if (months < 12) return `${months} meses`;
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) {
    return years === 1 ? '1 ano' : `${years} anos`;
  }
  
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
}

function calculateDaysSinceVisit(municipality) {
  // Return - for blocked, stopped, or not deployed municipalities
  if (municipality.status === 'Bloqueado' || municipality.status === 'Parou de usar' || municipality.status === 'Não Implantado') {
    return '-';
  }
  
  if (!municipality.lastVisit) {
    return '-';
  }
  
  const days = getDaysSinceVisit(municipality.lastVisit);
  
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  if (days < 60) return 'Cerca de 1 mês';
  
  const months = Math.floor(days / 30);
  return `Cerca de ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

function getDaysSinceVisit(lastVisitDate) {
  const lastVisit = new Date(lastVisitDate);
  const now = new Date();
  const diffTime = Math.abs(now - lastVisit);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Theme Functions

function initializeTheme() {
  const savedTheme = recuperarDoArmazenamento('theme');
  if (savedTheme) {
    currentTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    currentTheme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeToggleButton(); // agora existe
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  salvarNoArmazenamento('theme', currentTheme); // chave correta: 'theme'
  updateThemeToggleButton(); // usa a função certa
  showToast(`Tema ${currentTheme === 'light' ? 'claro' : 'escuro'} ativado`, 'success');
}

// Função que estava faltando (o erro estava aqui!)
function updateThemeToggleButton() {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = currentTheme === 'light' ? 'Escuro' : 'Claro';
  }
}
// PDF Generation Functions

async function generateTasksPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(33, 128, 141);
    pdf.text('Relatório de Controle de Treinamentos', 105, 20, { align: 'center' });
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(98, 108, 113);
    const now = new Date();
    pdf.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 105, 28, { align: 'center' });
    
    // Add KPIs
    pdf.setFontSize(12);
    pdf.setTextColor(19, 52, 59);
    let yPos = 40;
    pdf.text('Resumo:', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(10);
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Tarefa Concluída').length;
    const pending = tasks.filter(t => t.status === 'Tarefa Pendente').length;
    const cancelled = tasks.filter(t => t.status === 'Tarefa Cancelada').length;
    
    pdf.text(`Total de Treinamentos: ${total}`, 25, yPos);
    yPos += 6;
    pdf.text(`Treinamentos Concluídos: ${completed}`, 25, yPos);
    yPos += 6;
    pdf.text(`Treinamentos Pendentes: ${pending}`, 25, yPos);
    yPos += 6;
    pdf.text(`Treinamentos Cancelados: ${cancelled}`, 25, yPos);
    yPos += 12;
    
    // Add tasks table
    pdf.setFontSize(12);
    pdf.text('Lista de Treinamentos:', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(7);
    pdf.setTextColor(19, 52, 59);
    
    // Table headers
    const headers = ['Data Sol.', 'Data Real.', 'Município', 'Solicitante', 'Orientador', 'Cargo/Função', 'Status'];
    const colWidths = [18, 18, 28, 24, 24, 24, 18];
    let xPos = 20;
    
    pdf.setFillColor(33, 128, 141);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(20, yPos - 5, 170, 7, 'F');
    
    headers.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPos, { maxWidth: colWidths[i] - 4 });
      xPos += colWidths[i];
    });
    
    yPos += 8;
    pdf.setTextColor(19, 52, 59);
    
    // Table rows
    tasks.forEach((task, index) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      
      xPos = 20;
      const row = [
        formatDate(task.dateRequested),
        task.datePerformed ? formatDate(task.datePerformed) : '-',
        task.municipality || '-',
        task.requestedBy,
        task.performedBy || '-',
        task.trainedPosition || '-',
        task.status
      ];
      
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(20, yPos - 5, 170, 7, 'F');
      }
      
      row.forEach((cell, i) => {
        pdf.text(String(cell).substring(0, 25), xPos + 2, yPos, { maxWidth: colWidths[i] - 4 });
        xPos += colWidths[i];
      });
      
      yPos += 7;
    });
    
    // Save PDF
    pdf.save('treinamentos_relatorio.pdf');
    showToast('PDF gerado com sucesso!', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('Erro ao gerar PDF', 'error');
  }
}

async function generateMunicipalitiesPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(33, 128, 141);
    pdf.text('Relatório de Municípios Clientes', 148, 20, { align: 'center' });
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(98, 108, 113);
    const now = new Date();
    pdf.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 148, 28, { align: 'center' });
    
    // Add KPIs
    pdf.setFontSize(12);
    pdf.setTextColor(19, 52, 59);
    let yPos = 40;
    pdf.text('Resumo:', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(10);
    const total = municipalities.length;
    const active = municipalities.filter(m => m.status === 'Em uso').length;
    const blocked = municipalities.filter(m => m.status === 'Bloqueado').length;
    const stopped = municipalities.filter(m => m.status === 'Parou de usar').length;
    const notDeployed = municipalities.filter(m => m.status === 'Não Implantado').length;
    const activeMunicipalities = municipalities.filter(m => m.status === 'Em uso' && m.lastVisit);
    const avgDays = activeMunicipalities.length > 0 
      ? Math.round(activeMunicipalities.reduce((sum, m) => sum + getDaysSinceVisit(m.lastVisit), 0) / activeMunicipalities.length)
      : 0;
    
    pdf.text(`Total de Municípios: ${total}`, 25, yPos);
    yPos += 6;
    pdf.text(`Municípios em uso: ${active}`, 25, yPos);
    yPos += 6;
    pdf.text(`Municípios Bloqueados: ${blocked}`, 25, yPos);
    yPos += 6;
    pdf.text(`Municípios que Pararam de Usar: ${stopped}`, 25, yPos);
    yPos += 6;
    pdf.text(`Municípios Não Implantados: ${notDeployed}`, 25, yPos);
    yPos += 6;
    pdf.text(`Média de dias desde última visita: ${avgDays}`, 25, yPos);
    yPos += 12;
    
    // Add municipalities table
    pdf.setFontSize(12);
    pdf.text('Lista de Municípios:', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(7);
    pdf.setTextColor(19, 52, 59);
    
    // Table headers
    const headers = ['Município', 'Módulos', 'Gestor', 'Implantação', 'Última visita', 'Status'];
    const colWidths = [40, 50, 35, 30, 30, 25];
    let xPos = 20;
    
    pdf.setFillColor(33, 128, 141);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(20, yPos - 5, 256, 7, 'F');
    
    headers.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPos, { maxWidth: colWidths[i] - 4 });
      xPos += colWidths[i];
    });
    
    yPos += 8;
    pdf.setTextColor(19, 52, 59);
    
    // Sort municipalities alphabetically for PDF
    const sortedMunicipalities = [...municipalities].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    
    // Table rows
    sortedMunicipalities.forEach((municipality, index) => {
      if (yPos > 180) {
        pdf.addPage();
        yPos = 20;
      }
      
      xPos = 20;
      const row = [
        municipality.name,
        municipality.modules.join(', '),
        municipality.manager,
        formatDate(municipality.implantationDate),
        formatDate(municipality.lastVisit),
        municipality.status
      ];
      
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(20, yPos - 5, 256, 7, 'F');
      }
      
      row.forEach((cell, i) => {
        const text = String(cell).substring(0, 40);
        pdf.text(text, xPos + 2, yPos, { maxWidth: colWidths[i] - 4 });
        xPos += colWidths[i];
      });
      
      yPos += 7;
    });
    
    // Save PDF
    pdf.save('municipios_relatorio.pdf');
    showToast('PDF gerado com sucesso!', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('Erro ao gerar PDF', 'error');
  }
}

// Handle Status Change for Municipality Form
function handleStatusChange() {
  const status = document.getElementById('municipality-status').value;
  const contactInput = document.getElementById('municipality-contact');
  const contactLabel = document.getElementById('contact-label');
  const modulesGroup = document.getElementById('modules-group');
  const modulesLabel = document.getElementById('modules-label');
  const implantationInput = document.getElementById('municipality-implantation-date');
  const implantationLabel = document.getElementById('implantation-label');
  const lastVisitInput = document.getElementById('municipality-last-visit');
  const lastVisitLabel = document.getElementById('lastvisit-label');
  const stoppageGroup = document.getElementById('stoppage-group');
  const stoppageInput = document.getElementById('municipality-stoppage-date');
  const stoppageLabel = document.getElementById('stoppage-label');
  
  const isInactive = status === 'Bloqueado' || status === 'Parou de usar' || status === 'Não Implantado';
  const needsStoppageDate = status === 'Bloqueado' || status === 'Parou de usar';
  
  // Show/hide stoppage date field
  if (needsStoppageDate) {
    stoppageGroup.style.display = 'block';
    stoppageInput.required = true;
    if (status === 'Bloqueado') {
      stoppageLabel.textContent = 'Data que foi Bloqueado*';
    } else {
      stoppageLabel.textContent = 'Data que Parou de Usar*';
    }
  } else {
    stoppageGroup.style.display = 'none';
    stoppageInput.required = false;
    stoppageInput.value = '';
  }
  
  // Update required attributes and styling
  if (isInactive) {
    // Remove required attribute and update labels
    contactInput.required = false;
    contactLabel.textContent = 'Contato do Gestor';
    modulesLabel.textContent = 'Módulos em Uso';
    implantationInput.required = false;
    implantationLabel.textContent = 'Data de Implantação';
    lastVisitInput.required = false;
    lastVisitLabel.textContent = 'Última visita';
    
    // Add visual indication that fields are optional
    modulesGroup.style.opacity = '0.6';
    document.getElementById('contact-group').style.opacity = '0.6';
    document.getElementById('implantation-group').style.opacity = '0.6';
    document.getElementById('lastvisit-group').style.opacity = '0.6';
  } else {
    // Add required attribute and update labels
    contactInput.required = true;
    contactLabel.textContent = 'Contato do Gestor*';
    modulesLabel.textContent = 'Módulos em Uso*';
    implantationInput.required = true;
    implantationLabel.textContent = 'Data de Implantação*';
    lastVisitInput.required = true;
    lastVisitLabel.textContent = 'Última visita*';
    
    // Remove visual indication
    modulesGroup.style.opacity = '1';
    document.getElementById('contact-group').style.opacity = '1';
    document.getElementById('implantation-group').style.opacity = '1';
    document.getElementById('lastvisit-group').style.opacity = '1';
  }
}

function formatPhoneNumber(value) {
  // CORREÇÃO 2: Remove tudo que não é número
  let cleaned = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
  
  // Formata: (XX) 9XXXX-XXXX
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2);
  } else {
    return '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2, 7) + '-' + cleaned.slice(7, 11);
  }
}

function initializeFilters() {
  // Login field - Auto uppercase on login screen
  const loginUsernameInput = document.getElementById('login-username');
  if (loginUsernameInput) {
    loginUsernameInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.toUpperCase();
    });
  }
  
  // Task filters
  document.getElementById('filter-task-municipality').addEventListener('change', renderTasks);
  document.getElementById('filter-task-status').addEventListener('change', renderTasks);
  document.getElementById('filter-task-requester').addEventListener('input', renderTasks);
  document.getElementById('filter-task-performer').addEventListener('input', renderTasks);
  document.getElementById('filter-task-position').addEventListener('change', renderTasks);
  document.getElementById('filter-date-type').addEventListener('change', renderTasks);
  document.getElementById('filter-task-date-start').addEventListener('change', renderTasks);
  document.getElementById('filter-task-date-end').addEventListener('change', renderTasks);
  
  // CORREÇÃO 2: Phone number formatting for all contact fields
  const taskContactInput = document.getElementById('task-contact');
  if (taskContactInput) {
    taskContactInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  const orientadorContactInput = document.getElementById('orientador-contact');
  if (orientadorContactInput) {
    orientadorContactInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  const municipalityContactInput = document.getElementById('municipality-contact');
  if (municipalityContactInput) {
    municipalityContactInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  const requestContactInput = document.getElementById('request-contact');
  if (requestContactInput) {
    requestContactInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  // Municipality filters
  document.getElementById('filter-municipality-name').addEventListener('change', renderMunicipalities);
  document.getElementById('filter-municipality-status').addEventListener('change', renderMunicipalities);
  document.getElementById('filter-municipality-module').addEventListener('change', renderMunicipalities);
  document.getElementById('filter-municipality-manager').addEventListener('input', renderMunicipalities);
  
  // User filters
  const filterUserName = document.getElementById('filter-user-name');
  if (filterUserName) {
    filterUserName.addEventListener('input', renderUsers);
  }
  
  // User login field - Auto uppercase in user modal
  const userLoginInput = document.getElementById('user-login');
  if (userLoginInput) {
    userLoginInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.toUpperCase();
    });
  }
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    const taskModal = document.getElementById('task-modal');
    const municipalityModal = document.getElementById('municipality-modal');
    const changePasswordModal = document.getElementById('change-password-modal');
    const userModal = document.getElementById('user-modal');
    
    if (event.target === taskModal) {
      closeTaskModal();
    }
    if (event.target === municipalityModal) {
      closeMunicipalityModal();
    }
    if (event.target === changePasswordModal) {
      closeChangePasswordModal();
    }
    if (event.target === userModal) {
      closeUserModal();
    }
    
    const cargoModal = document.getElementById('cargo-modal');
    const orientadorModal = document.getElementById('orientador-modal');
    const moduloModal = document.getElementById('modulo-modal');
    const municipalityListModal = document.getElementById('municipality-list-modal');
    
    if (event.target === cargoModal) {
      closeCargoModal();
    }
    if (event.target === orientadorModal) {
      closeOrientadorModal();
    }
    if (event.target === moduloModal) {
      closeModuloModal();
    }
    if (event.target === municipalityListModal) {
      closeMunicipalityListModal();
    }
    
    const requestModal = document.getElementById('request-modal');
    const presentationModal = document.getElementById('presentation-modal');
    const formaApresentacaoModal = document.getElementById('forma-apresentacao-modal');
    const demandModal = document.getElementById('demand-modal');
    const visitModal = document.getElementById('visit-modal');
    const productionModal = document.getElementById('production-modal');
    
    if (event.target === requestModal) {
      closeRequestModal();
    }
    if (event.target === presentationModal) {
      closePresentationModal();
    }
    if (event.target === formaApresentacaoModal) {
      closeFormaApresentacaoModal();
    }
    if (event.target === demandModal) {
      closeDemandModal();
    }
    if (event.target === visitModal) {
      closeVisitModal();
    }
    if (event.target === productionModal) {
      closeProductionModal();
    }
  });
}

// User Management Functions

function showUserModal(userId = null) {
  const modal = document.getElementById('user-modal');
  const form = document.getElementById('user-form');
  const title = document.getElementById('user-modal-title');
  const errorDiv = document.getElementById('user-error');
  
  form.reset();
  editingUserId = userId;
  errorDiv.textContent = '';
  
  if (userId) {
    title.textContent = 'Editar Usuário';
    const user = users.find(u => u.id === userId);
    if (user) {
      document.getElementById('user-login').value = user.login;
      document.getElementById('user-login').disabled = true; // Cannot change login
      document.getElementById('user-name').value = user.name;
      document.getElementById('user-password').value = user.password;
      document.getElementById('user-permission').value = user.permission;
      document.getElementById('user-status').value = user.status;
    }
  } else {
    title.textContent = 'Novo Usuário';
    document.getElementById('user-login').disabled = false;
    document.getElementById('user-status').value = 'Ativo';
  }
  
  modal.classList.add('show');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('show');
  editingUserId = null;
  document.getElementById('user-login').disabled = false;
}

function saveUser(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('user-error');
  
  const userData = {
    login: document.getElementById('user-login').value.trim().toUpperCase(),
    name: document.getElementById('user-name').value.trim(),
    password: document.getElementById('user-password').value,
    permission: document.getElementById('user-permission').value,
    status: document.getElementById('user-status').value
  };
  
  // Validate login uniqueness for new users (case-insensitive)
  if (!editingUserId) {
    const loginExists = users.some(u => u.login.toUpperCase() === userData.login);
    if (loginExists) {
      errorDiv.textContent = 'Este login já está em uso. Escolha outro.';
      return;
    }
  }
  
  if (editingUserId) {
    const index = users.findIndex(u => u.id === editingUserId);
    users[index] = { ...users[index], ...userData };
    
    // Update currentUser if editing themselves
    if (currentUser && currentUser.id === editingUserId) {
      currentUser = users[index];
      updateUserInterface();
    }
    
    showToast('Usuário atualizado com sucesso!', 'success');
  } else {
    users.push({ id: userIdCounter++, ...userData });
    showToast('Usuário criado com sucesso!', 'success');
  }
  
  closeUserModal();
  renderUsers();
  updateUserStats();
}

function deleteUser(userId) {
  const user = users.find(u => u.id === userId);
  
  if (!user) return;
  
  // Prevent deleting the admin user
  if (user.login.toUpperCase() === 'ADMIN') {
    showToast('O usuário administrador não pode ser excluído.', 'error');
    return;
  }
  
  if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
    users = users.filter(u => u.id !== userId);
    renderUsers();
    updateUserStats();
    showToast('Usuário excluído com sucesso!', 'success');
  }
}

function renderUsers() {
  const container = document.getElementById('users-table');
  const totalDiv = document.getElementById('users-total-display');
  const filterName = document.getElementById('filter-user-name')?.value.toLowerCase() || '';
  
  let filteredUsers = users.filter(user => {
    if (filterName && !user.name.toLowerCase().includes(filterName) && !user.login.toLowerCase().includes(filterName)) {
      return false;
    }
    return true;
  });
  
  if (filteredUsers.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum usuário encontrado</p></div>';
    if (totalDiv) {
      totalDiv.innerHTML = `<strong>Total de Usuários:</strong> 0`;
      totalDiv.style.display = 'block';
    }
    return;
  }
  
  if (totalDiv) {
    totalDiv.innerHTML = `<strong>Total de Usuários:</strong> ${users.length}`;
    totalDiv.style.display = 'block';
  }
  
  function getStatusBadgeClass(status) {
    return status === 'Ativo' ? 'active' : 'stopped';
  }
  
  function getPermissionBadgeClass(permission) {
    return permission === 'Administrador' ? 'active' : 'not-deployed';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Login</th>
          <th>Nome do Usuário</th>
          <th>Permissão</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredUsers.map(user => `
          <tr>
            <td><strong>${user.login}</strong></td>
            <td>${user.name}</td>
            <td>
              <span class="status-badge ${getPermissionBadgeClass(user.permission)}">
                ${user.permission}
              </span>
            </td>
            <td>
              <span class="status-badge ${getStatusBadgeClass(user.status)}">
                ${user.status}
              </span>
            </td>
            <td>
              <div class="task-actions">
                <button class="btn btn--outline btn--sm" onclick="showUserModal(${user.id})" title="Editar">
                  ✏️
                </button>
                ${user.login !== 'admin' ? `
                  <button class="btn btn--outline btn--sm" onclick="deleteUser(${user.id})" title="Excluir">
                    🗑️
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateUserStats() {
  const total = users.length;
  const active = users.filter(u => u.status === 'Ativo').length;
  const inactive = total - active;
  
  const totalEl = document.getElementById('total-users');
  const activeEl = document.getElementById('active-users');
  const inactiveEl = document.getElementById('inactive-users');
  
  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (inactiveEl) inactiveEl.textContent = inactive;
}

function getUserFilters() {
  return {
    name: document.getElementById('filter-user-name')?.value || ''
  };
}

function clearUserFilters() {
  const filterName = document.getElementById('filter-user-name');
  if (filterName) filterName.value = '';
  renderUsers();
}

// Settings Menu Functions
function toggleSettingsMenu() {
  const menu = document.getElementById('settings-menu');
  menu.classList.toggle('show');
}

// Close settings menu when clicking outside
document.addEventListener('click', function(event) {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  
  if (settingsBtn && settingsMenu && !settingsBtn.contains(event.target) && !settingsMenu.contains(event.target)) {
    settingsMenu.classList.remove('show');
  }
});

// Cargo/Função Management Functions
function navigateToCargoManagement() {
  if (!currentUser) {
    showToast('Acesso negado.', 'error');
    return;
  }
  
  // Close settings menu
  document.getElementById('settings-menu').classList.remove('show');
  
  // Update active tab button in sidebar
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('cargos-section').classList.add('active');
  
  renderCargos();
}

function showCargoModal(cargoId = null) {
  const modal = document.getElementById('cargo-modal');
  const form = document.getElementById('cargo-form');
  const title = document.getElementById('cargo-modal-title');
  const errorDiv = document.getElementById('cargo-error');
  
  form.reset();
  editingCargoId = cargoId;
  errorDiv.textContent = '';
  
  if (cargoId) {
    title.textContent = 'Editar Cargo/Função';
    const cargo = cargos.find(c => c.id === cargoId);
    if (cargo) {
      document.getElementById('cargo-name').value = cargo.name;
      document.getElementById('cargo-description').value = cargo.description || '';
    }
  } else {
    title.textContent = 'Novo Cargo/Função';
  }
  
  modal.classList.add('show');
}

function closeCargoModal() {
  document.getElementById('cargo-modal').classList.remove('show');
  editingCargoId = null;
}

function saveCargo(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('cargo-error');
  
  const cargoData = {
    name: document.getElementById('cargo-name').value.trim(),
    description: document.getElementById('cargo-description').value.trim()
  };
  
  // Validate uniqueness
  if (!editingCargoId) {
    const nameExists = cargos.some(c => c.name.toLowerCase() === cargoData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Este cargo/função já existe. Escolha outro nome.';
      return;
    }
  } else {
    const nameExists = cargos.some(c => c.id !== editingCargoId && c.name.toLowerCase() === cargoData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Este cargo/função já existe. Escolha outro nome.';
      return;
    }
  }
  
  if (editingCargoId) {
    const index = cargos.findIndex(c => c.id === editingCargoId);
    cargos[index] = { ...cargos[index], ...cargoData };
    showToast('Cargo/Função atualizado com sucesso!', 'success');
  } else {
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];
    cargos.push({ id: cargoIdCounter++, ...cargoData, createdAt });
    showToast('Cargo/Função criado com sucesso!', 'success');
  }
  
  closeCargoModal();
  renderCargos();
  updateCargoDropdowns();
}

function deleteCargo(cargoId) {
  const cargo = cargos.find(c => c.id === cargoId);
  if (!cargo) return;
  
  // Check if cargo is in use
  const inUse = tasks.some(t => t.trainedPosition === cargo.name);
  if (inUse) {
    showToast('Este cargo/função está em uso e não pode ser excluído.', 'error');
    return;
  }
  
  if (confirm(`Tem certeza que deseja excluir o cargo/função "${cargo.name}"?`)) {
    cargos = cargos.filter(c => c.id !== cargoId);
    renderCargos();
    updateCargoDropdowns();
    showToast('Cargo/Função excluído com sucesso!', 'success');
  }
}

function renderCargos() {
  const container = document.getElementById('cargos-table');
  const totalDiv = document.getElementById('cargos-total');
  
  if (cargos.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum cargo/função cadastrado</p></div>';
    totalDiv.style.display = 'none';
    return;
  }
  
  totalDiv.innerHTML = `<strong>Total de Cargos/Funções:</strong> ${cargos.length}`;
  totalDiv.style.display = 'block';
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Cargo/Função</th>
          <th>Data Criação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${cargos.map(cargo => `
          <tr>
            <td><strong>${cargo.name}</strong></td>
            <td>${formatDate(cargo.createdAt)}</td>
            <td>
              <div class="task-actions">
                <button class="btn btn--outline btn--sm" onclick="showCargoModal(${cargo.id})" title="Editar">
                  ✏️
                </button>
                <button class="btn btn--outline btn--sm" onclick="deleteCargo(${cargo.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateCargoDropdowns() {
  // Update task form dropdown
  const taskSelect = document.getElementById('task-trained-position');
  if (taskSelect) {
    const currentValue = taskSelect.value;
    taskSelect.innerHTML = '<option value="">Selecione o cargo/função</option>' +
      cargos.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    if (currentValue) taskSelect.value = currentValue;
  }
  
  // Update filter dropdown
  const filterSelect = document.getElementById('filter-task-position');
  if (filterSelect) {
    const currentValue = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Todos</option>' +
      cargos.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    if (currentValue) filterSelect.value = currentValue;
  }
}

// Orientador Management Functions
function navigateToOrientadorManagement() {
  if (!currentUser) {
    showToast('Acesso negado.', 'error');
    return;
  }
  
  // Close settings menu
  document.getElementById('settings-menu').classList.remove('show');
  
  // Update active tab button in sidebar
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('orientadores-section').classList.add('active');
  
  renderOrientadores();
}

function showOrientadorModal(orientadorId = null) {
  const modal = document.getElementById('orientador-modal');
  const form = document.getElementById('orientador-form');
  const title = document.getElementById('orientador-modal-title');
  const errorDiv = document.getElementById('orientador-error');
  
  form.reset();
  editingOrientadorId = orientadorId;
  errorDiv.textContent = '';
  
  if (orientadorId) {
    title.textContent = 'Editar Orientador';
    const orientador = orientadores.find(o => o.id === orientadorId);
    if (orientador) {
      document.getElementById('orientador-name').value = orientador.name;
      document.getElementById('orientador-contact').value = orientador.contact || '';
      document.getElementById('orientador-email').value = orientador.email || '';
    }
  } else {
    title.textContent = 'Novo Orientador';
  }
  
  modal.classList.add('show');
}

function closeOrientadorModal() {
  document.getElementById('orientador-modal').classList.remove('show');
  editingOrientadorId = null;
}

function saveOrientador(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('orientador-error');
  
  const orientadorData = {
    name: document.getElementById('orientador-name').value.trim(),
    contact: document.getElementById('orientador-contact').value.trim(),
    email: document.getElementById('orientador-email').value.trim()
  };
  
  // Validate uniqueness
  if (!editingOrientadorId) {
    const nameExists = orientadores.some(o => o.name.toLowerCase() === orientadorData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Este orientador já existe. Escolha outro nome.';
      return;
    }
  } else {
    const nameExists = orientadores.some(o => o.id !== editingOrientadorId && o.name.toLowerCase() === orientadorData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Este orientador já existe. Escolha outro nome.';
      return;
    }
  }
  
  if (editingOrientadorId) {
    const index = orientadores.findIndex(o => o.id === editingOrientadorId);
    orientadores[index] = { ...orientadores[index], ...orientadorData };
    showToast('Orientador atualizado com sucesso!', 'success');
  } else {
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];
    orientadores.push({ id: orientadorIdCounter++, ...orientadorData, createdAt });
    showToast('Orientador criado com sucesso!', 'success');
  }
  
  closeOrientadorModal();
  renderOrientadores();
  updateOrientadorDropdowns();
}

function deleteOrientador(orientadorId) {
  const orientador = orientadores.find(o => o.id === orientadorId);
  if (!orientador) return;
  
  // Check if orientador is in use
  const inUse = tasks.some(t => t.performedBy === orientador.name);
  if (inUse) {
    showToast('Este orientador está em uso e não pode ser excluído.', 'error');
    return;
  }
  
  if (confirm(`Tem certeza que deseja excluir o orientador "${orientador.name}"?`)) {
    orientadores = orientadores.filter(o => o.id !== orientadorId);
    renderOrientadores();
    updateOrientadorDropdowns();
    showToast('Orientador excluído com sucesso!', 'success');
  }
}

function renderOrientadores() {
  const container = document.getElementById('orientadores-table');
  const totalDiv = document.getElementById('orientadores-total');
  
  if (orientadores.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum orientador cadastrado</p></div>';
    totalDiv.style.display = 'none';
    return;
  }
  
  totalDiv.innerHTML = `<strong>Total de Orientadores:</strong> ${orientadores.length}`;
  totalDiv.style.display = 'block';
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Contato</th>
          <th>Data Criação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${orientadores.map(orientador => `
          <tr>
            <td><strong>${orientador.name}</strong></td>
            <td>${orientador.contact || '-'}</td>
            <td>${formatDate(orientador.createdAt)}</td>
            <td>
              <div class="task-actions">
                <button class="btn btn--outline btn--sm" onclick="showOrientadorModal(${orientador.id})" title="Editar">
                  ✏️
                </button>
                <button class="btn btn--outline btn--sm" onclick="deleteOrientador(${orientador.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateOrientadorDropdowns() {
  // Update task form dropdown
  const taskSelect = document.getElementById('task-performed-by');
  if (taskSelect) {
    const currentValue = taskSelect.value;
    taskSelect.innerHTML = '<option value="">Selecione o orientador</option>' +
      orientadores.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
    if (currentValue) taskSelect.value = currentValue;
  }
}

// Módulo Management Functions
function navigateToModuloManagement() {
  if (!currentUser) {
    showToast('Acesso negado.', 'error');
    return;
  }
  
  // Close settings menu
  document.getElementById('settings-menu').classList.remove('show');
  
  // Update active tab button in sidebar
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('modulos-section').classList.add('active');
  
  renderModulos();
}

function showModuloModal(moduloId = null) {
  const modal = document.getElementById('modulo-modal');
  const form = document.getElementById('modulo-form');
  const title = document.getElementById('modulo-modal-title');
  const errorDiv = document.getElementById('modulo-error');
  
  form.reset();
  editingModuloId = moduloId;
  errorDiv.textContent = '';
  
  if (moduloId) {
    title.textContent = 'Editar Módulo';
    const modulo = modulos.find(m => m.id === moduloId);
    if (modulo) {
      document.getElementById('modulo-name').value = modulo.name;
      document.getElementById('modulo-abbreviation').value = modulo.abbreviation;
    }
  } else {
    title.textContent = 'Novo Módulo';
  }
  
  modal.classList.add('show');
}

function closeModuloModal() {
  document.getElementById('modulo-modal').classList.remove('show');
  editingModuloId = null;
}

function saveModulo(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('modulo-error');
  
  // Generate a default color if not editing
  const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF', '#F5B041', '#D7BFCD'];
  const existingColors = modulos.map(m => m.color);
  const availableColor = defaultColors.find(c => !existingColors.includes(c)) || defaultColors[0];
  
  const moduloData = {
    name: document.getElementById('modulo-name').value.trim(),
    abbreviation: document.getElementById('modulo-abbreviation').value.trim().toUpperCase(),
    color: editingModuloId ? modulos.find(m => m.id === editingModuloId).color : availableColor
  };
  
  // Validate uniqueness for name
  if (!editingModuloId) {
    const nameExists = modulos.some(m => m.name.toLowerCase() === moduloData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Este módulo já existe. Escolha outro nome.';
      return;
    }
    const abbrevExists = modulos.some(m => m.abbreviation.toUpperCase() === moduloData.abbreviation);
    if (abbrevExists) {
      errorDiv.textContent = 'Esta abreviação já existe. Escolha outra.';
      return;
    }
  } else {
    const nameExists = modulos.some(m => m.id !== editingModuloId && m.name.toLowerCase() === moduloData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Este módulo já existe. Escolha outro nome.';
      return;
    }
    const abbrevExists = modulos.some(m => m.id !== editingModuloId && m.abbreviation.toUpperCase() === moduloData.abbreviation);
    if (abbrevExists) {
      errorDiv.textContent = 'Esta abreviação já existe. Escolha outra.';
      return;
    }
  }
  
  if (editingModuloId) {
    const index = modulos.findIndex(m => m.id === editingModuloId);
    modulos[index] = { ...modulos[index], ...moduloData };
    showToast('Módulo atualizado com sucesso!', 'success');
  } else {
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];
    modulos.push({ id: moduloIdCounter++, ...moduloData, createdAt });
    showToast('Módulo criado com sucesso!', 'success');
  }
  
  closeModuloModal();
  renderModulos();
  updateModuloCheckboxes();
  updateMunicipalityFilterModules();
  updateCharts();
}

function deleteModulo(moduloId) {
  const modulo = modulos.find(m => m.id === moduloId);
  if (!modulo) return;
  
  // Check if modulo is in use
  const inUse = municipalities.some(mun => mun.modules.includes(modulo.name));
  if (inUse) {
    showToast('Este módulo está em uso e não pode ser excluído.', 'error');
    return;
  }
  
  if (confirm(`Tem certeza que deseja excluir o módulo "${modulo.name}"?`)) {
    modulos = modulos.filter(m => m.id !== moduloId);
    renderModulos();
    updateModuloCheckboxes();
    updateMunicipalityFilterModules();
    updateCharts();
    showToast('Módulo excluído com sucesso!', 'success');
  }
}

function renderModulos() {
  const container = document.getElementById('modulos-table');
  const totalDiv = document.getElementById('modulos-total');
  
  if (modulos.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum módulo cadastrado</p></div>';
    totalDiv.style.display = 'none';
    return;
  }
  
  totalDiv.innerHTML = `<strong>Total de Módulos:</strong> ${modulos.length}`;
  totalDiv.style.display = 'block';
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Abreviação</th>
          <th>Data Criação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${modulos.map(modulo => `
          <tr>
            <td><strong>${modulo.name}</strong></td>
            <td><span class="module-tag" style="background-color: ${modulo.color};">${modulo.abbreviation}</span></td>
            <td>${formatDate(modulo.createdAt)}</td>
            <td>
              <div class="task-actions">
                <button class="btn btn--outline btn--sm" onclick="showModuloModal(${modulo.id})" title="Editar">
                  ✏️
                </button>
                <button class="btn btn--outline btn--sm" onclick="deleteModulo(${modulo.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateModuloCheckboxes() {
  // Update municipality form checkboxes
  const checkboxGrid = document.querySelector('.checkbox-grid');
  if (checkboxGrid) {
    const checkedModules = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
    checkboxGrid.innerHTML = modulos.map(m => 
      `<label><input type="checkbox" value="${m.name}" class="module-checkbox" ${checkedModules.includes(m.name) ? 'checked' : ''}> ${m.name}</label>`
    ).join('');
  }
}

function updateMunicipalityFilterModules() {
  // Update municipality filter dropdown
  const filterSelect = document.getElementById('filter-municipality-module');
  if (filterSelect) {
    const currentValue = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Todos</option>' +
      modulos.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    if (currentValue) filterSelect.value = currentValue;
  }
}

// Municipality List (Master) Management Functions

function navigateToMunicipalityListManagement() {
  if (!currentUser) {
    showToast('Acesso negado.', 'error');
    return;
  }
  
  // Close settings menu
  document.getElementById('settings-menu').classList.remove('show');
  
  // Update active tab button in sidebar
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('municipalities-list-section').classList.add('active');
  
  renderMunicipalitiesList();
}

function showMunicipalityListModal(municipalityId = null) {
  const modal = document.getElementById('municipality-list-modal');
  const form = document.getElementById('municipality-list-form');
  const title = document.getElementById('municipality-list-modal-title');
  const errorDiv = document.getElementById('municipality-list-error');
  
  form.reset();
  editingMunicipalityListId = municipalityId;
  errorDiv.textContent = '';
  
  if (municipalityId) {
    title.textContent = 'Editar Município';
    const municipality = municipalitiesList.find(m => m.id === municipalityId);
    if (municipality) {
      document.getElementById('municipality-list-name').value = municipality.name;
      document.getElementById('municipality-list-uf').value = municipality.uf || '';
    }
  } else {
    title.textContent = 'Novo Município';
  }
  
  modal.classList.add('show');
}

function closeMunicipalityListModal() {
  document.getElementById('municipality-list-modal').classList.remove('show');
  editingMunicipalityListId = null;
}

function saveMunicipalityList(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('municipality-list-error');
  
  const municipalityData = {
    name: document.getElementById('municipality-list-name').value.trim(),
    uf: document.getElementById('municipality-list-uf').value.trim()
  };
  
  // Build full name with UF if provided
  const fullName = municipalityData.uf ? `${municipalityData.name} - ${municipalityData.uf}` : municipalityData.name;
  
  // Validate uniqueness
  if (!editingMunicipalityListId) {
    const nameExists = municipalitiesList.some(m => {
      const existingFullName = m.uf ? `${m.name} - ${m.uf}` : m.name;
      return existingFullName.toLowerCase() === fullName.toLowerCase();
    });
    if (nameExists) {
      errorDiv.textContent = 'Este município já existe. Escolha outro nome.';
      return;
    }
  } else {
    const nameExists = municipalitiesList.some(m => {
      if (m.id === editingMunicipalityListId) return false;
      const existingFullName = m.uf ? `${m.name} - ${m.uf}` : m.name;
      return existingFullName.toLowerCase() === fullName.toLowerCase();
    });
    if (nameExists) {
      errorDiv.textContent = 'Este município já existe. Escolha outro nome.';
      return;
    }
  }
  
  if (editingMunicipalityListId) {
    const index = municipalitiesList.findIndex(m => m.id === editingMunicipalityListId);
    municipalitiesList[index] = { ...municipalitiesList[index], ...municipalityData };
    showToast('Município atualizado com sucesso!', 'success');
  } else {
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];
    municipalitiesList.push({ id: municipalitiesListIdCounter++, ...municipalityData, createdAt });
    showToast('Município criado com sucesso!', 'success');
  }
  
  closeMunicipalityListModal();
  renderMunicipalitiesList();
  updateMunicipalityListDropdowns();
}

function deleteMunicipalityList(municipalityId) {
  const municipality = municipalitiesList.find(m => m.id === municipalityId);
  if (!municipality) return;
  
  // Build full name for checking
  const fullName = municipality.uf ? `${municipality.name} - ${municipality.uf}` : municipality.name;
  
  // Check if municipality is in use
  const inUseInMunicipalities = municipalities.some(mun => mun.name === fullName);
  const inUseInTasks = tasks.some(t => t.municipality === fullName);
  
  if (inUseInMunicipalities || inUseInTasks) {
    showToast('Este município está em uso e não pode ser excluído.', 'error');
    return;
  }
  
  if (confirm(`Tem certeza que deseja excluir o município "${fullName}"?`)) {
    municipalitiesList = municipalitiesList.filter(m => m.id !== municipalityId);
    renderMunicipalitiesList();
    updateMunicipalityListDropdowns();
    showToast('Município excluído com sucesso!', 'success');
  }
}

function renderMunicipalitiesList() {
  const container = document.getElementById('municipalities-list-table');
  const totalDiv = document.getElementById('municipalities-list-total');
  
  if (municipalitiesList.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum município cadastrado. Cadastre municípios para usá-los no sistema.</p></div>';
    totalDiv.style.display = 'none';
    return;
  }
  
  totalDiv.innerHTML = `<strong>Total de Municípios:</strong> ${municipalitiesList.length}`;
  totalDiv.style.display = 'block';
  
  // Sort alphabetically
  const sortedList = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome do Município</th>
          <th>Data Criação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${sortedList.map(municipality => {
          const displayName = municipality.uf ? `${municipality.name} - ${municipality.uf}` : municipality.name;
          return `
            <tr>
              <td><strong>${displayName}</strong></td>
              <td>${formatDate(municipality.createdAt)}</td>
              <td>
                <div class="task-actions">
                  <button class="btn btn--outline btn--sm" onclick="showMunicipalityListModal(${municipality.id})" title="Editar">
                    ✏️
                  </button>
                  <button class="btn btn--outline btn--sm" onclick="deleteMunicipalityList(${municipality.id})" title="Excluir">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function updateMunicipalityListDropdowns() {
  // Sort alphabetically for dropdowns
  const sortedList = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  // Update task form dropdown
  const taskSelect = document.getElementById('task-municipality');
  if (taskSelect) {
    const currentValue = taskSelect.value;
    if (sortedList.length === 0) {
      taskSelect.innerHTML = '<option value="">Cadastre municípios em Configurações primeiro</option>';
      taskSelect.disabled = true;
    } else {
      taskSelect.disabled = false;
      taskSelect.innerHTML = '<option value="">Selecione o município</option>' +
        sortedList.map(m => {
          const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
          return `<option value="${displayName}">${displayName}</option>`;
        }).join('');
      if (currentValue) taskSelect.value = currentValue;
    }
  }
  
  // Update presentation municipality dropdown
  updatePresentationDropdowns();
  
  // Update task filter dropdown
  const filterTaskSelect = document.getElementById('filter-task-municipality');
  if (filterTaskSelect) {
    const currentValue = filterTaskSelect.value;
    filterTaskSelect.innerHTML = '<option value="">Todos</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) filterTaskSelect.value = currentValue;
  }
  
  // Update municipality form dropdown
  const municipalitySelect = document.getElementById('municipality-name');
  if (municipalitySelect) {
    const currentValue = municipalitySelect.value;
    if (sortedList.length === 0) {
      municipalitySelect.innerHTML = '<option value="">Cadastre municípios em Configurações primeiro</option>';
      municipalitySelect.disabled = true;
    } else {
      municipalitySelect.disabled = false;
      municipalitySelect.innerHTML = '<option value="">Selecione o município</option>' +
        sortedList.map(m => {
          const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
          return `<option value="${displayName}">${displayName}</option>`;
        }).join('');
      if (currentValue) municipalitySelect.value = currentValue;
    }
  }
  
  // Update municipality filter dropdown
  const filterMunicipalitySelect = document.getElementById('filter-municipality-name');
  if (filterMunicipalitySelect) {
    const currentValue = filterMunicipalitySelect.value;
    filterMunicipalitySelect.innerHTML = '<option value="">Todos</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) filterMunicipalitySelect.value = currentValue;
  }
}

// CSV Import Functions for Municipalities

function triggerCSVImport() {
  const fileInput = document.getElementById('csv-import-input');
  if (fileInput) {
    fileInput.value = ''; // Reset input
    fileInput.click();
  }
}

function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.csv')) {
    showToast('Por favor, selecione um arquivo CSV válido.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const csvContent = e.target.result;
    parseAndImportCSV(csvContent);
  };
  reader.onerror = function() {
    showToast('Erro ao ler o arquivo CSV.', 'error');
  };
  reader.readAsText(file, 'UTF-8');
}

function parseAndImportCSV(csvContent) {
  try {
    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      showToast('O arquivo CSV está vazio ou não contém dados.', 'error');
      return;
    }
    
    // Get headers
    const headers = parseCSVLine(lines[0]);
    
    // Validate headers
    const requiredHeaders = ['Nome', 'Módulos em Uso', 'Gestor', 'Contato', 'Data Implantação', 'Última Visita', 'Status'];
    const hasValidHeaders = requiredHeaders.every(required => 
      headers.some(header => header.toLowerCase().includes(required.toLowerCase()))
    );
    
    if (!hasValidHeaders) {
      showToast('Formato de CSV inválido. Verifique as colunas: Nome, Módulos em Uso, Gestor, Contato, Data Implantação, Última Visita, Status', 'error');
      return;
    }
    
    // Parse data rows
    const dataRows = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;
      
      const rowData = {
        lineNumber: i + 1,
        name: values[0]?.trim() || '',
        modulesStr: values[1]?.trim() || '',
        manager: values[2]?.trim() || '',
        contact: values[3]?.trim() || '',
        implantationDate: values[4]?.trim() || '',
        lastVisit: values[5]?.trim() || '',
        status: values[6]?.trim() || ''
      };
      
      // Validate row
      const validation = validateCSVRow(rowData);
      if (!validation.valid) {
        errors.push(`Linha ${rowData.lineNumber}: ${validation.errors.join(', ')}`);
      } else {
        dataRows.push(rowData);
      }
    }
    
    if (errors.length > 0 && dataRows.length === 0) {
      const errorMsg = 'Erros encontrados no CSV:\n' + errors.slice(0, 5).join('\n');
      if (errors.length > 5) {
        alert(errorMsg + '\n... e mais ' + (errors.length - 5) + ' erros.');
      } else {
        alert(errorMsg);
      }
      return;
    }
    
    if (errors.length > 0) {
      const proceed = confirm(
        `Encontrados ${errors.length} erro(s) em ${errors.length} linha(s).\n` +
        `${dataRows.length} linha(s) válida(s) serão importadas.\n\n` +
        `Deseja continuar?`
      );
      if (!proceed) return;
    }
    
    // Process imports with duplicate handling
    processCSVImport(dataRows);
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    showToast('Erro ao processar o arquivo CSV. Verifique o formato.', 'error');
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result.map(v => v.trim());
}

function validateCSVRow(rowData) {
  const errors = [];
  
  // Validate required fields
  if (!rowData.name) {
    errors.push('Nome é obrigatório');
  }
  
  if (!rowData.manager) {
    errors.push('Gestor é obrigatório');
  }
  
  if (!rowData.status) {
    errors.push('Status é obrigatório');
  }
  
  // Validate status
  const validStatuses = ['Em uso', 'Bloqueado', 'Parou de usar', 'Não Implantado'];
  if (rowData.status && !validStatuses.includes(rowData.status)) {
    errors.push(`Status inválido: "${rowData.status}". Use: ${validStatuses.join(', ')}`);
  }
  
  // Parse and validate modules
  if (rowData.modulesStr) {
    const moduleNames = rowData.modulesStr
      .split(/[,;|]/)  // Split by comma, semicolon, or pipe
      .map(m => m.trim())
      .filter(m => m);
    
    const invalidModules = [];
    moduleNames.forEach(moduleName => {
      const moduleExists = modulos.some(m => 
        m.name.toLowerCase() === moduleName.toLowerCase()
      );
      if (!moduleExists) {
        invalidModules.push(moduleName);
      }
    });
    
    if (invalidModules.length > 0) {
      errors.push(`Módulos inválidos: ${invalidModules.join(', ')}`);
    }
  }
  
  // Validate dates
  if (rowData.implantationDate && !isValidDate(rowData.implantationDate)) {
    errors.push('Data de Implantação inválida (use dd/mm/yyyy ou yyyy-mm-dd)');
  }
  
  if (rowData.lastVisit && !isValidDate(rowData.lastVisit)) {
    errors.push('Data de Última Visita inválida (use dd/mm/yyyy ou yyyy-mm-dd)');
  }
  
  // For "Em uso" status, require additional fields
  if (rowData.status === 'Em uso') {
    if (!rowData.contact) {
      errors.push('Contato é obrigatório para municípios "Em uso"');
    }
    if (!rowData.modulesStr) {
      errors.push('Módulos são obrigatórios para municípios "Em uso"');
    }
    if (!rowData.implantationDate) {
      errors.push('Data de Implantação é obrigatória para municípios "Em uso"');
    }
    if (!rowData.lastVisit) {
      errors.push('Última Visita é obrigatória para municípios "Em uso"');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function isValidDate(dateStr) {
  // Try dd/mm/yyyy format
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1]);
    const month = parseInt(ddmmyyyy[2]);
    const year = parseInt(ddmmyyyy[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  
  // Try yyyy-mm-dd format
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1]);
    const month = parseInt(yyyymmdd[2]);
    const day = parseInt(yyyymmdd[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  
  return false;
}

function convertDateToISO(dateStr) {
  // Convert dd/mm/yyyy to yyyy-mm-dd
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }
  // Already in yyyy-mm-dd format
  return dateStr;
}

function processCSVImport(dataRows) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const duplicates = [];
  
  // Check for duplicates
  dataRows.forEach(rowData => {
    const existing = municipalities.find(m => 
      m.name.toLowerCase() === rowData.name.toLowerCase()
    );
    if (existing) {
      duplicates.push({ rowData, existing });
    }
  });
  
  // If there are duplicates, ask user what to do
  if (duplicates.length > 0) {
    const action = prompt(
      `Encontrados ${duplicates.length} município(s) duplicado(s):\n` +
      duplicates.slice(0, 3).map(d => `- ${d.rowData.name}`).join('\n') +
      (duplicates.length > 3 ? `\n... e mais ${duplicates.length - 3}` : '') +
      `\n\nEscolha uma ação:\n` +
      `1 - ATUALIZAR todos os existentes\n` +
      `2 - PULAR todos os duplicados\n` +
      `3 - CANCELAR importação\n\n` +
      `Digite 1, 2 ou 3:`
    );
    
    if (action === '3' || action === null) {
      showToast('Importação cancelada.', 'error');
      return;
    }
    
    const updateDuplicates = action === '1';
    const skipDuplicates = action === '2';
    
    // Process all rows
    dataRows.forEach(rowData => {
      const existing = municipalities.find(m => 
        m.name.toLowerCase() === rowData.name.toLowerCase()
      );
      
      if (existing) {
        if (updateDuplicates) {
          // Update existing
          const index = municipalities.findIndex(m => m.id === existing.id);
          municipalities[index] = {
            ...municipalities[index],
            ...rowDataToMunicipality(rowData)
          };
          updated++;
        } else if (skipDuplicates) {
          skipped++;
        }
      } else {
        // Add new
        municipalities.push({
          id: municipalityIdCounter++,
          ...rowDataToMunicipality(rowData)
        });
        imported++;
      }
    });
  } else {
    // No duplicates, import all
    dataRows.forEach(rowData => {
      municipalities.push({
        id: municipalityIdCounter++,
        ...rowDataToMunicipality(rowData)
      });
      imported++;
    });
  }
  
  // Show results
  let message = [];
  if (imported > 0) message.push(`${imported} município(s) importado(s)`);
  if (updated > 0) message.push(`${updated} município(s) atualizado(s)`);
  if (skipped > 0) message.push(`${skipped} município(s) pulado(s)`);
  
  if (message.length > 0) {
    showToast(message.join(', ') + ' com sucesso!', 'success');
    renderMunicipalities();
    updateMunicipalityStats();
    updateCharts();
    updateDashboardStats();
    updateDashboardCharts();
  } else {
    showToast('Nenhum município foi importado.', 'error');
  }
}

function rowDataToMunicipality(rowData) {
  // Parse modules
  const moduleNames = rowData.modulesStr
    .split(/[,;|]/)  // Split by comma, semicolon, or pipe
    .map(m => m.trim())
    .filter(m => m)
    .map(moduleName => {
      // Find exact match or case-insensitive match
      const module = modulos.find(m => 
        m.name.toLowerCase() === moduleName.toLowerCase()
      );
      return module ? module.name : moduleName;
    });
  
  return {
    name: rowData.name,
    modules: moduleNames,
    manager: rowData.manager,
    contact: rowData.contact || '',
    implantationDate: rowData.implantationDate ? convertDateToISO(rowData.implantationDate) : '',
    lastVisit: rowData.lastVisit ? convertDateToISO(rowData.lastVisit) : '',
    status: rowData.status,
    stoppageDate: null
  };
}

// CSV Import Functions for Training Control

function triggerTrainingCSVImport() {
  const fileInput = document.getElementById('training-csv-import-input');
  if (fileInput) {
    fileInput.value = ''; // Reset input
    fileInput.click();
  }
}

function handleTrainingCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.csv')) {
    showToast('Por favor, selecione um arquivo CSV válido.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const csvContent = e.target.result;
    parseAndImportTrainingCSV(csvContent);
  };
  reader.onerror = function() {
    showToast('Erro ao ler o arquivo CSV.', 'error');
  };
  reader.readAsText(file, 'UTF-8');
}

function parseAndImportTrainingCSV(csvContent) {
  try {
    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      showToast('O arquivo CSV está vazio ou não contém dados.', 'error');
      return;
    }
    
    // Get headers
    const headers = parseCSVLine(lines[0]);
    
    // Validate headers - more flexible matching
    const requiredHeaders = ['Data Solicitação', 'Solicitante', 'Orientador', 'Status'];
    const hasValidHeaders = requiredHeaders.every(required => 
      headers.some(header => 
        header.toLowerCase().includes(required.toLowerCase().replace('ção', 'c')) ||
        header.toLowerCase().includes(required.toLowerCase())
      )
    );
    
    if (!hasValidHeaders) {
      showToast('Formato de CSV inválido. Verifique as colunas: Data Solicitação, Data Realização, Município, Solicitante, Orientador, Profissional à treinar/treinado, Cargo/Função, Contato, Status', 'error');
      return;
    }
    
    // Parse data rows
    const dataRows = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;
      
      const rowData = {
        lineNumber: i + 1,
        dateRequested: values[0]?.trim() || '',
        datePerformed: values[1]?.trim() || '',
        municipality: values[2]?.trim() || '',
        requestedBy: values[3]?.trim() || '',
        performedBy: values[4]?.trim() || '',
        trainedName: values[5]?.trim() || '',
        trainedPosition: values[6]?.trim() || '',
        contact: values[7]?.trim() || '',
        status: values[8]?.trim() || '',
        observations: values[9]?.trim() || ''
      };
      
      // Validate row
      const validation = validateTrainingCSVRow(rowData);
      if (!validation.valid) {
        errors.push(`Linha ${rowData.lineNumber}: ${validation.errors.join(', ')}`);
      } else {
        dataRows.push(rowData);
      }
    }
    
    if (errors.length > 0 && dataRows.length === 0) {
      const errorMsg = 'Erros encontrados no CSV:\n' + errors.slice(0, 5).join('\n');
      if (errors.length > 5) {
        alert(errorMsg + '\n... e mais ' + (errors.length - 5) + ' erros.');
      } else {
        alert(errorMsg);
      }
      return;
    }
    
    if (errors.length > 0) {
      const proceed = confirm(
        `Encontrados ${errors.length} erro(s) em ${errors.length} linha(s).\n` +
        `${dataRows.length} linha(s) válida(s) serão importadas.\n\n` +
        `Deseja continuar?`
      );
      if (!proceed) return;
    }
    
    // Process imports with duplicate handling
    processTrainingCSVImport(dataRows);
    
  } catch (error) {
    console.error('Error parsing training CSV:', error);
    showToast('Erro ao processar o arquivo CSV. Verifique o formato.', 'error');
  }
}

function validateTrainingCSVRow(rowData) {
  const errors = [];
  
  // Validate required fields
  if (!rowData.dateRequested) {
    errors.push('Data de Solicitação é obrigatória');
  }
  
  if (!rowData.requestedBy) {
    errors.push('Solicitante é obrigatório');
  }
  
  if (!rowData.performedBy) {
    errors.push('Orientador é obrigatório');
  }
  
  if (!rowData.status) {
    errors.push('Status é obrigatório');
  }
  
  // Validate status
  const validStatuses = ['Concluído', 'Pendente', 'Cancelado'];
  if (rowData.status && !validStatuses.includes(rowData.status)) {
    errors.push(`Status inválido: "${rowData.status}". Use: ${validStatuses.join(', ')}`);
  }
  
  // Validate orientador exists
  if (rowData.performedBy) {
    const orientadorExists = orientadores.some(o => 
      o.name.toLowerCase() === rowData.performedBy.toLowerCase()
    );
    if (!orientadorExists) {
      errors.push(`Orientador "${rowData.performedBy}" não encontrado no cadastro`);
    }
  }
  
  // Validate cargo/função exists if provided
  if (rowData.trainedPosition) {
    const cargoExists = cargos.some(c => 
      c.name.toLowerCase() === rowData.trainedPosition.toLowerCase()
    );
    if (!cargoExists) {
      errors.push(`Cargo/Função "${rowData.trainedPosition}" não encontrado no cadastro`);
    }
  }
  
  // Validate municipality exists if provided
  if (rowData.municipality) {
    const municipalityExists = municipalitiesList.some(m => {
      const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
      return displayName.toLowerCase() === rowData.municipality.toLowerCase();
    });
    if (!municipalityExists) {
      errors.push(`Município "${rowData.municipality}" não encontrado no cadastro`);
    }
  }
  
  // Validate dates
  if (rowData.dateRequested && !isValidDate(rowData.dateRequested)) {
    errors.push('Data de Solicitação inválida (use dd/mm/yyyy ou yyyy-mm-dd)');
  }
  
  if (rowData.datePerformed && !isValidDate(rowData.datePerformed)) {
    errors.push('Data de Realização inválida (use dd/mm/yyyy ou yyyy-mm-dd)');
  }
  
  // Validate contact format if provided
  if (rowData.contact) {
    const contactRegex = /^\(\d{2}\)\s?9?\d{4,5}-?\d{4}$/;
    if (!contactRegex.test(rowData.contact)) {
      errors.push('Formato de contato inválido (use (XX) 9XXXX-XXXX)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function processTrainingCSVImport(dataRows) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const duplicates = [];
  
  // Check for duplicates (same dateRequested AND requestedBy)
  dataRows.forEach(rowData => {
    const existing = tasks.find(t => 
      t.dateRequested === convertDateToISO(rowData.dateRequested) &&
      t.requestedBy.toLowerCase() === rowData.requestedBy.toLowerCase()
    );
    if (existing) {
      duplicates.push({ rowData, existing });
    }
  });
  
  // If there are duplicates, ask user what to do
  if (duplicates.length > 0) {
    const action = prompt(
      `Encontrados ${duplicates.length} treinamento(s) duplicado(s):\n` +
      duplicates.slice(0, 3).map(d => `- ${d.rowData.requestedBy} (${d.rowData.dateRequested})`).join('\n') +
      (duplicates.length > 3 ? `\n... e mais ${duplicates.length - 3}` : '') +
      `\n\nEscolha uma ação:\n` +
      `1 - ATUALIZAR todos os existentes\n` +
      `2 - CRIAR NOVOS (duplicar)\n` +
      `3 - PULAR todos os duplicados\n` +
      `4 - CANCELAR importação\n\n` +
      `Digite 1, 2, 3 ou 4:`
    );
    
    if (action === '4' || action === null) {
      showToast('Importação cancelada.', 'error');
      return;
    }
    
    const updateDuplicates = action === '1';
    const createDuplicates = action === '2';
    const skipDuplicates = action === '3';
    
    // Process all rows
    dataRows.forEach(rowData => {
      const existing = tasks.find(t => 
        t.dateRequested === convertDateToISO(rowData.dateRequested) &&
        t.requestedBy.toLowerCase() === rowData.requestedBy.toLowerCase() &&
        (!rowData.municipality || t.municipality === rowData.municipality)
      );
      
      if (existing) {
        if (updateDuplicates) {
          // Update existing
          const index = tasks.findIndex(t => t.id === existing.id);
          tasks[index] = {
            ...tasks[index],
            ...rowDataToTask(rowData)
          };
          updated++;
        } else if (createDuplicates) {
          // Create new duplicate
          tasks.push({
            id: taskIdCounter++,
            ...rowDataToTask(rowData)
          });
          imported++;
        } else if (skipDuplicates) {
          skipped++;
        }
      } else {
        // Add new
        tasks.push({
          id: taskIdCounter++,
          ...rowDataToTask(rowData)
        });
        imported++;
      }
    });
  } else {
    // No duplicates, import all
    dataRows.forEach(rowData => {
      tasks.push({
        id: taskIdCounter++,
        ...rowDataToTask(rowData)
      });
      imported++;
    });
  }
  
  // Show results
  let message = [];
  if (imported > 0) message.push(`${imported} treinamento(s) importado(s)`);
  if (updated > 0) message.push(`${updated} treinamento(s) atualizado(s)`);
  if (skipped > 0) message.push(`${skipped} treinamento(s) pulado(s)`);
  
  if (message.length > 0) {
    showToast(message.join(', ') + ' com sucesso!', 'success');
    renderTasks();
    updateTaskStats();
    updateDashboardStats();
  } else {
    showToast('Nenhum treinamento foi importado.', 'error');
  }
}

// Backup and Restore Functions

function navigateToBackupManagement() {
  if (!currentUser) {
    showToast('Acesso negado.', 'error');
    return;
  }
  
  // Close settings menu
  document.getElementById('settings-menu').classList.remove('show');
  
  // Update active tab button in sidebar
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update active tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('backup-section').classList.add('active');
  
  // Update backup info
  updateBackupInfo();
}

function updateBackupInfo() {
  document.getElementById('backup-info-trainings').textContent = tasks.length;
  document.getElementById('backup-info-municipalities').textContent = municipalities.length;
  document.getElementById('backup-info-cargos').textContent = cargos.length;
  document.getElementById('backup-info-orientadores').textContent = orientadores.length;
  document.getElementById('backup-info-modules').textContent = modulos.length;
  document.getElementById('backup-info-users').textContent = users.length;
  
  // Add new data to backup info display
  const trainingsInfo = document.getElementById('backup-info-trainings');
  if (trainingsInfo && trainingsInfo.parentElement) {
    const parentDiv = trainingsInfo.parentElement.parentElement;
    
    // Check if we already added the new stats
    if (!document.getElementById('backup-info-requests')) {
      const requestsP = document.createElement('p');
      requestsP.innerHTML = '<strong>Total de Solicitações/Sugestões:</strong> <span id="backup-info-requests">0</span>';
      parentDiv.appendChild(requestsP);
      
      const presentationsP = document.createElement('p');
      presentationsP.innerHTML = '<strong>Total de Apresentações:</strong> <span id="backup-info-presentations">0</span>';
      parentDiv.appendChild(presentationsP);
      
      const formasP = document.createElement('p');
      formasP.innerHTML = '<strong>Total de Formas de Apresentação:</strong> <span id="backup-info-formas">0</span>';
      parentDiv.appendChild(formasP);
    }
    
    // Update values
    const requestsSpan = document.getElementById('backup-info-requests');
    const presentationsSpan = document.getElementById('backup-info-presentations');
    const formasSpan = document.getElementById('backup-info-formas');
    
    if (requestsSpan) requestsSpan.textContent = requests.length;
    if (presentationsSpan) presentationsSpan.textContent = presentations.length;
    if (formasSpan) formasSpan.textContent = formasApresentacao.length;
  }
}

function createBackup() {
  try {
    // CORREÇÃO 4: Create backup object with all system data INCLUDING module colors
    const now = new Date();
    const backup = {
      timestamp: now.toISOString(),
      version: '4.0',
      data: {
        trainings: tasks,
        municipalities: municipalities,
        municipalitiesList: municipalitiesList,
        cargos: cargos,
        orientadores: orientadores,
        modules: modulos,
        users: users,
        requests: requests,
        presentations: presentations,
        formasApresentacao: formasApresentacao,
        demands: demands,
        visits: visits,
        productions: productions
      }
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(backup, null, 2);
    
    // Create filename with timestamp
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const filename = `backup_sistema_${year}${month}${day}_${hours}${minutes}${seconds}.json`;
    
    // Create and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    const successMsg = document.getElementById('backup-success-message');
    const formattedDate = now.toLocaleString('pt-BR');
    successMsg.textContent = `✅ Backup realizado com sucesso em: ${formattedDate}`;
    successMsg.className = 'backup-message success show';
    
    showToast('Backup criado com sucesso!', 'success');
    
    // Hide message after 5 seconds
    setTimeout(() => {
      successMsg.classList.remove('show');
    }, 5000);
  } catch (error) {
    console.error('Error creating backup:', error);
    showToast('Erro ao criar backup', 'error');
  }
}

function triggerRestoreBackup() {
  const fileInput = document.getElementById('backup-file-input');
  if (fileInput) {
    fileInput.value = ''; // Reset input
    fileInput.click();
  }
}

let pendingBackupData = null;

function handleBackupFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.json')) {
    const restoreMsg = document.getElementById('restore-message');
    restoreMsg.textContent = '⚠️ Arquivo inválido. Selecione um arquivo JSON.';
    restoreMsg.className = 'backup-message error show';
    setTimeout(() => {
      restoreMsg.classList.remove('show');
    }, 3000);
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backupData = JSON.parse(e.target.result);
      
      // Validate backup structure
      if (!validateBackupStructure(backupData)) {
        const restoreMsg = document.getElementById('restore-message');
        restoreMsg.textContent = '⚠️ Arquivo inválido. Certifique-se que é um backup do sistema.';
        restoreMsg.className = 'backup-message error show';
        setTimeout(() => {
          restoreMsg.classList.remove('show');
        }, 3000);
        return;
      }
      
      // Store backup data for confirmation
      pendingBackupData = backupData;
      
      // Show confirmation modal with preview
      showRestoreConfirmModal(backupData);
      
    } catch (error) {
      console.error('Error reading backup file:', error);
      const restoreMsg = document.getElementById('restore-message');
      restoreMsg.textContent = '⚠️ Erro ao ler arquivo. Certifique-se que é um backup válido.';
      restoreMsg.className = 'backup-message error show';
      setTimeout(() => {
        restoreMsg.classList.remove('show');
      }, 3000);
    }
  };
  reader.onerror = function() {
    showToast('Erro ao ler arquivo de backup', 'error');
  };
  reader.readAsText(file);
}

function validateBackupStructure(backup) {
  // Check required fields
  if (!backup.timestamp || !backup.version || !backup.data) {
    return false;
  }
  
  // Check data structure
  const data = backup.data;
  if (!data.trainings || !data.municipalities || !data.cargos || 
      !data.orientadores || !data.modules || !data.users) {
    return false;
  }
  
  // Check if arrays
  if (!Array.isArray(data.trainings) || !Array.isArray(data.municipalities) || 
      !Array.isArray(data.cargos) || !Array.isArray(data.orientadores) || 
      !Array.isArray(data.modules) || !Array.isArray(data.users)) {
    return false;
  }
  
  // Optional fields for backward compatibility
  if (data.municipalitiesList && !Array.isArray(data.municipalitiesList)) {
    return false;
  }
  if (data.requests && !Array.isArray(data.requests)) {
    return false;
  }
  if (data.presentations && !Array.isArray(data.presentations)) {
    return false;
  }
  if (data.formasApresentacao && !Array.isArray(data.formasApresentacao)) {
    return false;
  }
  
  return true;
}

function showRestoreConfirmModal(backupData) {
  const modal = document.getElementById('restore-confirm-modal');
  const previewList = document.getElementById('restore-preview-list');
  
  const data = backupData.data;
  
  previewList.innerHTML = `
    <li><strong>Treinamentos:</strong> ${data.trainings.length} registro(s)</li>
    <li><strong>Municípios Clientes:</strong> ${data.municipalities.length} registro(s)</li>
    <li><strong>Municípios (Lista Mestra):</strong> ${data.municipalitiesList ? data.municipalitiesList.length : 0} registro(s)</li>
    <li><strong>Solicitações/Sugestões:</strong> ${data.requests ? data.requests.length : 0} registro(s)</li>
    <li><strong>Apresentações:</strong> ${data.presentations ? data.presentations.length : 0} registro(s)</li>
    <li><strong>Cargos/Funções:</strong> ${data.cargos.length} registro(s)</li>
    <li><strong>Orientadores:</strong> ${data.orientadores.length} registro(s)</li>
    <li><strong>Módulos:</strong> ${data.modules.length} registro(s)</li>
    <li><strong>Formas de Apresentação:</strong> ${data.formasApresentacao ? data.formasApresentacao.length : 0} registro(s)</li>
    <li><strong>Demandas do Suporte:</strong> ${data.demands ? data.demands.length : 0} registro(s)</li>
    <li><strong>Visitas Presenciais:</strong> ${data.visits ? data.visits.length : 0} registro(s)</li>
    <li><strong>Envios de Produção:</strong> ${data.productions ? data.productions.length : 0} registro(s)</li>
    <li><strong>Usuários:</strong> ${data.users.length} registro(s)</li>
  `;
  
  modal.classList.add('show');
}

function closeRestoreConfirmModal() {
  document.getElementById('restore-confirm-modal').classList.remove('show');
  pendingBackupData = null;
}

function confirmRestore() {
  if (!pendingBackupData) {
    showToast('Erro: dados de backup não encontrados', 'error');
    return;
  }
  
  try {
    const data = pendingBackupData.data;
    
    // CORREÇÃO 4: Restore all data INCLUDING module colors preserved
    tasks = data.trainings;
    municipalities = data.municipalities;
    municipalitiesList = data.municipalitiesList || [];
    cargos = data.cargos;
    orientadores = data.orientadores;
    // CORREÇÃO 4: Restore modules with their individual colors preserved
    modulos = data.modules.map(m => ({
      ...m,
      color: m.color || '#0078D4'
    }));
    users = data.users;
    requests = data.requests || [];
    presentations = data.presentations || [];
    formasApresentacao = data.formasApresentacao || [];
    demands = data.demands || [];
    visits = data.visits || [];
    productions = data.productions || [];
    
    // Update counters
    if (tasks.length > 0) {
      taskIdCounter = Math.max(...tasks.map(t => t.id)) + 1;
    }
    if (municipalities.length > 0) {
      municipalityIdCounter = Math.max(...municipalities.map(m => m.id)) + 1;
    }
    if (cargos.length > 0) {
      cargoIdCounter = Math.max(...cargos.map(c => c.id)) + 1;
    }
    if (orientadores.length > 0) {
      orientadorIdCounter = Math.max(...orientadores.map(o => o.id)) + 1;
    }
    if (modulos.length > 0) {
      moduloIdCounter = Math.max(...modulos.map(m => m.id)) + 1;
    }
    if (municipalitiesList.length > 0) {
      municipalitiesListIdCounter = Math.max(...municipalitiesList.map(m => m.id)) + 1;
    }
    if (users.length > 0) {
      userIdCounter = Math.max(...users.map(u => u.id)) + 1;
    }
    if (requests.length > 0) {
      requestIdCounter = Math.max(...requests.map(r => r.id)) + 1;
    }
    if (presentations.length > 0) {
      presentationIdCounter = Math.max(...presentations.map(p => p.id)) + 1;
    }
    if (formasApresentacao.length > 0) {
      formaApresentacaoIdCounter = Math.max(...formasApresentacao.map(f => f.id)) + 1;
    }
    if (demands.length > 0) {
      demandIdCounter = Math.max(...demands.map(d => d.id)) + 1;
    }
    if (visits.length > 0) {
      visitIdCounter = Math.max(...visits.map(v => v.id)) + 1;
    }
    if (productions.length > 0) {
      productionIdCounter = Math.max(...productions.map(p => p.id)) + 1;
    }
    
    // Check if current user still exists
    if (currentUser) {
      const userStillExists = users.find(u => u.id === currentUser.id);
      if (userStillExists) {
        currentUser = userStillExists;
      } else {
        // Current user was removed in backup, find admin
        currentUser = users.find(u => u.permission === 'Administrador') || users[0];
      }
    }
    
    // Close modal
    closeRestoreConfirmModal();
    
    // Update all displays
    renderTasks();
    renderMunicipalities();
    renderCargos();
    renderOrientadores();
    renderModulos();
    renderUsers();
    updateTaskStats();
    updateMunicipalityStats();
    updateUserStats();
    updateCargoDropdowns();
    updateOrientadorDropdowns();
    updateModuloCheckboxes();
    updateMunicipalityFilterModules();
    updateMunicipalityListDropdowns();
    updateCharts();
    updateBackupInfo();
    updateUserInterface();
    updateRequestMunicipalityDropdowns();
    updatePresentationDropdowns();
    updateFormaApresentacaoCheckboxes();
    updateRequestCharts();
    updatePresentationCharts();
    updateDashboardStats();
    updateDashboardCharts();
    renderDemands();
    updateDemandStats();
    updateDemandCharts();
    renderVisits();
    updateVisitStats();
    updateVisitCharts();
    renderProductions();
    updateProductionStats();
    updateProductionCharts();
    
    // Show success message
    const restoreMsg = document.getElementById('restore-message');
    restoreMsg.textContent = '✅ Backup restaurado com sucesso!';
    restoreMsg.className = 'backup-message success show';
    
    showToast('Backup restaurado com sucesso! Sistema atualizado.', 'success');
    
    // Hide message after 5 seconds
    setTimeout(() => {
      restoreMsg.classList.remove('show');
    }, 5000);
    
  } catch (error) {
    console.error('Error restoring backup:', error);
    showToast('Erro ao restaurar backup', 'error');
    closeRestoreConfirmModal();
  }
}

// Solicitações/Sugestões Functions

function showRequestModal(requestId = null) {
  const modal = document.getElementById('request-modal');
  const form = document.getElementById('request-form');
  const title = document.getElementById('request-modal-title');
  
  form.reset();
  editingRequestId = requestId;
  
  if (requestId) {
    title.textContent = 'Editar Solicitação/Sugestão';
    const request = requests.find(r => r.id === requestId);
    if (request) {
      document.getElementById('request-date').value = request.date;
      document.getElementById('request-municipality').value = request.municipality;
      document.getElementById('request-requester').value = request.requester;
      document.getElementById('request-contact').value = request.contact;
      document.getElementById('request-description').value = request.description;
      document.getElementById('request-status').value = request.status;
      document.getElementById('request-date-realizacao').value = request.dateRealizacao || '';
      document.getElementById('request-justificativa').value = request.justificativa || '';
    }
  } else {
    title.textContent = 'Nova Solicitação/Sugestão';
    document.getElementById('request-status').value = 'Pendente';
  }
  
  handleRequestStatusChange();
  updateCharCounter();
  modal.classList.add('show');
}

function closeRequestModal() {
  document.getElementById('request-modal').classList.remove('show');
  editingRequestId = null;
}

function handleRequestStatusChange() {
  const status = document.getElementById('request-status').value;
  const dateRealizacaoGroup = document.getElementById('request-date-realizacao-group');
  const justificativaGroup = document.getElementById('request-justificativa-group');
  
  if (status === 'Realizado') {
    dateRealizacaoGroup.style.display = 'block';
    justificativaGroup.style.display = 'none';
  } else if (status === 'Inviável') {
    dateRealizacaoGroup.style.display = 'none';
    justificativaGroup.style.display = 'block';
  } else {
    dateRealizacaoGroup.style.display = 'none';
    justificativaGroup.style.display = 'none';
  }
}

function updateCharCounter() {
  const textarea = document.getElementById('request-description');
  const counter = document.getElementById('request-char-counter');
  
  if (textarea && counter) {
    const length = textarea.value.length;
    counter.textContent = `${length} / 200`;
    
    if (length >= 200) {
      counter.className = 'char-counter limit-exceeded';
    } else if (length >= 180) {
      counter.className = 'char-counter limit-warning';
    } else {
      counter.className = 'char-counter';
    }
  }
}

function saveRequest(event) {
  event.preventDefault();
  
  const requestData = {
    date: document.getElementById('request-date').value,
    municipality: document.getElementById('request-municipality').value,
    requester: document.getElementById('request-requester').value,
    contact: document.getElementById('request-contact').value,
    description: document.getElementById('request-description').value,
    status: document.getElementById('request-status').value,
    dateRealizacao: document.getElementById('request-date-realizacao').value || null,
    justificativa: document.getElementById('request-justificativa').value || null,
    user: currentUser ? currentUser.name : 'Sistema'
  };
  
  if (editingRequestId) {
    const index = requests.findIndex(r => r.id === editingRequestId);
    requests[index] = { ...requests[index], ...requestData };
    showToast('Solicitação atualizada com sucesso!', 'success');
  } else {
    requests.push({ id: requestIdCounter++, ...requestData });
    showToast('Solicitação criada com sucesso!', 'success');
  }
  
  closeRequestModal();
  renderRequests();
  updateRequestStats();
  updateRequestCharts();
  updateDashboardStats();
}

function deleteRequest(requestId) {
  if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
    requests = requests.filter(r => r.id !== requestId);
    renderRequests();
    updateRequestStats();
    updateRequestCharts();
    updateDashboardStats();
    showToast('Solicitação excluída com sucesso!', 'success');
  }
}

function renderRequests() {
  const container = document.getElementById('requests-table');
  const resultsCountDiv = document.getElementById('requests-results-count');
  const filters = getRequestFilters();
  
  let filteredRequests = requests.filter(request => {
    if (filters.municipality && request.municipality !== filters.municipality) return false;
    if (filters.status && request.status !== filters.status) return false;
    if (filters.solicitante && !request.requester.toLowerCase().includes(filters.solicitante.toLowerCase())) return false;
    if (filters.user && !request.user.toLowerCase().includes(filters.user.toLowerCase())) return false;
    
    const dateToFilter = filters.dateType === 'realizacao' ? request.dateRealizacao : request.date;
    if (filters.dateType === 'realizacao' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  // Show results count
  const filtersApplied = filters.municipality || filters.status || filters.solicitante || filters.user || filters.dateStart || filters.dateEnd;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.municipality) filterInfo.push(`Município=${filters.municipality}`);
    if (filters.solicitante) filterInfo.push(`Solicitante=${filters.solicitante}`);
    if (filters.user) filterInfo.push(`Usuário=${filters.user}`);
    resultsCountDiv.innerHTML = `<strong>${filteredRequests.length}</strong> solicitação(ões) encontrada(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredRequests.length}</strong> solicitação(ões) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredRequests.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhuma solicitação encontrada</p></div>';
    return;
  }
  
  function getStatusClass(status) {
    if (status === 'Realizado') return 'completed';
    if (status === 'Inviável') return 'cancelled';
    return 'pending';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Data Solicitação</th>
          <th>Município</th>
          <th>Solicitante</th>
          <th>Contato</th>
          <th>Descrição</th>
          <th>Status</th>
          <th>Usuário</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredRequests.map(request => `
          <tr>
            <td>${formatDate(request.date)}</td>
            <td>${request.municipality}</td>
            <td><strong>${request.requester}</strong></td>
            <td>${request.contact}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${request.description}">${request.description}</td>
            <td>
              <span class="task-status ${getStatusClass(request.status)}">
                ${request.status}
              </span>
            </td>
            <td>${request.user}</td>
            <td>
              <div class="task-actions-compact">
                <button class="task-action-btn edit" onclick="showRequestModal(${request.id})" title="Editar">
                  ✏️
                </button>
                <button class="task-action-btn delete" onclick="deleteRequest(${request.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateRequestStats() {
  const total = requests.length;
  const pending = requests.filter(r => r.status === 'Pendente').length;
  const completed = requests.filter(r => r.status === 'Realizado').length;
  const unfeasible = requests.filter(r => r.status === 'Inviável').length;
  
  document.getElementById('total-requests').textContent = total;
  document.getElementById('pending-requests').textContent = pending;
  document.getElementById('completed-requests').textContent = completed;
  document.getElementById('unfeasible-requests').textContent = unfeasible;
}

function getRequestFilters() {
  return {
    municipality: document.getElementById('filter-request-municipality')?.value || '',
    status: document.getElementById('filter-request-status')?.value || '',
    solicitante: document.getElementById('filter-request-solicitante')?.value || '',
    user: document.getElementById('filter-request-user')?.value || '',
    dateType: document.getElementById('filter-request-date-type')?.value || 'solicitacao',
    dateStart: document.getElementById('filter-request-date-start')?.value || '',
    dateEnd: document.getElementById('filter-request-date-end')?.value || ''
  };
}

function clearRequestFilters() {
  document.getElementById('filter-request-municipality').value = '';
  document.getElementById('filter-request-status').value = '';
  document.getElementById('filter-request-solicitante').value = '';
  document.getElementById('filter-request-user').value = '';
  document.getElementById('filter-request-date-type').value = 'solicitacao';
  document.getElementById('filter-request-date-start').value = '';
  document.getElementById('filter-request-date-end').value = '';
  renderRequests();
}

function updateRequestMunicipalityDropdowns(sortedList) {
  if (!sortedList) {
    sortedList = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
  
  const requestSelect = document.getElementById('request-municipality');
  if (requestSelect) {
    const currentValue = requestSelect.value;
    requestSelect.innerHTML = '<option value="">Selecione o município</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) requestSelect.value = currentValue;
  }
  
  const filterRequestSelect = document.getElementById('filter-request-municipality');
  if (filterRequestSelect) {
    const currentValue = filterRequestSelect.value;
    filterRequestSelect.innerHTML = '<option value="">Todos</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) filterRequestSelect.value = currentValue;
  }
}

function initializeRequestFilters() {
  const textarea = document.getElementById('request-description');
  if (textarea) {
    textarea.addEventListener('input', updateCharCounter);
  }
  
  document.getElementById('filter-request-municipality')?.addEventListener('change', renderRequests);
  document.getElementById('filter-request-status')?.addEventListener('change', renderRequests);
  document.getElementById('filter-request-solicitante')?.addEventListener('input', renderRequests);
  document.getElementById('filter-request-user')?.addEventListener('input', renderRequests);
  document.getElementById('filter-request-date-type')?.addEventListener('change', renderRequests);
  document.getElementById('filter-request-date-start')?.addEventListener('change', renderRequests);
  document.getElementById('filter-request-date-end')?.addEventListener('change', renderRequests);
  

}

function exportRequestsCSV() {
  const filters = getRequestFilters();
  const filteredRequests = requests.filter(request => {
    if (filters.municipality && request.municipality !== filters.municipality) return false;
    if (filters.status && request.status !== filters.status) return false;
    if (filters.solicitante && !request.requester.toLowerCase().includes(filters.solicitante.toLowerCase())) return false;
    if (filters.user && !request.user.toLowerCase().includes(filters.user.toLowerCase())) return false;
    
    const dateToFilter = filters.dateType === 'realizacao' ? request.dateRealizacao : request.date;
    if (filters.dateType === 'realizacao' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  const headers = ['Data Solicitação', 'Município', 'Solicitante', 'Contato', 'Descrição', 'Status', 'Data Realização', 'Justificativa', 'Usuário'];
  const rows = filteredRequests.map(r => [
    r.date,
    r.municipality,
    r.requester,
    r.contact,
    r.description,
    r.status,
    r.dateRealizacao || '',
    r.justificativa || '',
    r.user
  ]);
  
  downloadCSV('solicitacoes.csv', headers, rows);
  showToast('CSV exportado com sucesso!', 'success');
}

function generateRequestsPDF() {
  showToast('Funcionalidade de PDF em desenvolvimento', 'error');
}

function triggerRequestCSVImport() {
  showToast('Funcionalidade de importação em desenvolvimento', 'error');
}

function handleRequestCSVImport(event) {
  showToast('Funcionalidade de importação em desenvolvimento', 'error');
}

function initializeRequestCharts() {
  const requestStatusCtx = document.getElementById('requestStatusChart')?.getContext('2d');
  const requestMunicipalityCtx = document.getElementById('requestMunicipalityChart')?.getContext('2d');
  const requestRequesterCtx = document.getElementById('requestRequesterChart')?.getContext('2d');
  
  if (!requestStatusCtx) return;
  
  requestStatusChart = new Chart(requestStatusCtx, {
    type: 'pie',
    data: {
      labels: ['Pendente', 'Realizado', 'Inviável'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  requestMunicipalityChart = new Chart(requestMunicipalityCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Solicitações',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  requestRequesterChart = new Chart(requestRequesterCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Solicitações',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  updateRequestCharts();
}

function updateRequestCharts() {
  if (!requestStatusChart) return;
  
  const pending = requests.filter(r => r.status === 'Pendente').length;
  const completed = requests.filter(r => r.status === 'Realizado').length;
  const unfeasible = requests.filter(r => r.status === 'Inviável').length;
  
  requestStatusChart.data.datasets[0].data = [pending, completed, unfeasible];
  requestStatusChart.update();
  
  const municipalityCounts = {};
  requests.forEach(r => {
    municipalityCounts[r.municipality] = (municipalityCounts[r.municipality] || 0) + 1;
  });
  requestMunicipalityChart.data.labels = Object.keys(municipalityCounts);
  requestMunicipalityChart.data.datasets[0].data = Object.values(municipalityCounts);
  requestMunicipalityChart.update();
  
  const requesterCounts = {};
  requests.forEach(r => {
    requesterCounts[r.requester] = (requesterCounts[r.requester] || 0) + 1;
  });
  requestRequesterChart.data.labels = Object.keys(requesterCounts);
  requestRequesterChart.data.datasets[0].data = Object.values(requesterCounts);
  requestRequesterChart.update();
}

// Apresentações Functions

function showPresentationModal(presentationId = null) {
  const modal = document.getElementById('presentation-modal');
  const form = document.getElementById('presentation-form');
  const title = document.getElementById('presentation-modal-title');
  
  if (!modal) {
    console.error('Modal de apresentação não encontrado!');
    showToast('Erro: Modal não encontrado', 'error');
    return;
  }
  
  // Explicitly show modal
  modal.style.display = 'flex';
  
  form.reset();
  editingPresentationId = presentationId;
  
  // Update dropdowns and checkboxes
  updatePresentationDropdowns();
  
  // Clear all checkboxes first
  document.querySelectorAll('#presentation-orientador-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#presentation-forms-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  if (presentationId) {
    title.textContent = 'Editar Apresentação';
    const presentation = presentations.find(p => p.id === presentationId);
    if (presentation) {
      document.getElementById('presentation-municipality').value = presentation.municipality;
      document.getElementById('presentation-date-solicitacao').value = presentation.dateSolicitacao || '';
      document.getElementById('presentation-requester').value = presentation.requester || '';
      document.getElementById('presentation-status').value = presentation.status;
      document.getElementById('presentation-date-realizacao').value = presentation.dateRealizacao || '';
      document.getElementById('presentation-description').value = presentation.description || '';
      
      // Check multiple orientadores
      if (presentation.orientadores && Array.isArray(presentation.orientadores)) {
        presentation.orientadores.forEach(orientador => {
          const checkbox = document.querySelector(`#presentation-orientador-checkboxes input[value="${orientador}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
      
      // Check forms
      if (presentation.forms && Array.isArray(presentation.forms)) {
        presentation.forms.forEach(form => {
          const checkbox = document.querySelector(`#presentation-forms-checkboxes input[value="${form}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
    }
  } else {
    title.textContent = 'Nova Apresentação';
    document.getElementById('presentation-status').value = 'Pendente';
  }
  
  handlePresentationStatusChange();
  modal.classList.add('show');
  modal.style.display = 'flex';
}

function closePresentationModal() {
  const modal = document.getElementById('presentation-modal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  editingPresentationId = null;
}

// CORREÇÃO: Add missing editPresentation function
function editPresentation(presentationId) {
  showPresentationModal(presentationId);
}

function handlePresentationStatusChange() {
  const status = document.getElementById('presentation-status').value;
  const dateRealizacaoGroup = document.getElementById('presentation-date-realizacao-group');
  const dateRealizacaoLabel = document.getElementById('presentation-date-realizacao-label');
  const dateRealizacaoInput = document.getElementById('presentation-date-realizacao');
  const orientadorGroup = document.getElementById('presentation-orientador-group');
  const orientadorLabel = document.getElementById('presentation-orientador-label');
  const orientadorInput = document.getElementById('presentation-orientador');
  
  if (status === 'Realizada') {
    dateRealizacaoLabel.textContent = 'Data de Realização*';
    dateRealizacaoInput.required = true;
    orientadorLabel.textContent = 'Orientador*';
    orientadorInput.required = true;
  } else {
    dateRealizacaoLabel.textContent = 'Data de Realização';
    dateRealizacaoInput.required = false;
    orientadorLabel.textContent = 'Orientador';
    orientadorInput.required = false;
  }
}

function savePresentation(event) {
  event.preventDefault();
  
  const selectedForms = Array.from(document.querySelectorAll('#presentation-forms-checkboxes input:checked')).map(cb => cb.value);
  const selectedOrientadores = Array.from(document.querySelectorAll('#presentation-orientador-checkboxes input:checked')).map(cb => cb.value);
  
  // Validate at least one orientador for Realizada status
  const status = document.getElementById('presentation-status').value;
  if (status === 'Realizada' && selectedOrientadores.length === 0) {
    showToast('Selecione pelo menos um orientador para apresentações realizadas', 'error');
    return;
  }
  
  const presentationData = {
    municipality: document.getElementById('presentation-municipality').value,
    dateSolicitacao: document.getElementById('presentation-date-solicitacao').value || null,
    requester: document.getElementById('presentation-requester').value,
    status: status,
    dateRealizacao: document.getElementById('presentation-date-realizacao').value || null,
    orientadores: selectedOrientadores,
    orientador: selectedOrientadores.length > 0 ? selectedOrientadores[0] : null,
    forms: selectedForms,
    description: document.getElementById('presentation-description').value
  };
  
  if (editingPresentationId) {
    const index = presentations.findIndex(p => p.id === editingPresentationId);
    presentations[index] = { ...presentations[index], ...presentationData };
    showToast('Apresentação atualizada com sucesso!', 'success');
  } else {
    presentations.push({ id: presentationIdCounter++, ...presentationData });
    showToast('Apresentação criada com sucesso!', 'success');
  }
  
  closePresentationModal();
  renderPresentations();
  updatePresentationStats();
  updatePresentationCharts();
  updateDashboardStats();
}

function deletePresentation(presentationId) {
  if (confirm('Tem certeza que deseja excluir esta apresentação?')) {
    presentations = presentations.filter(p => p.id !== presentationId);
    renderPresentations();
    updatePresentationStats();
    updatePresentationCharts();
    updateDashboardStats();
    showToast('Apresentação excluída com sucesso!', 'success');
  }
}

function renderPresentations() {
  const container = document.getElementById('presentations-table');
  const resultsCountDiv = document.getElementById('presentations-results-count');
  const filters = getPresentationFilters();
  
  let filteredPresentations = presentations.filter(presentation => {
    if (filters.municipality && presentation.municipality !== filters.municipality) return false;
    if (filters.status && presentation.status !== filters.status) return false;
    if (filters.requester && presentation.requester && !presentation.requester.toLowerCase().includes(filters.requester.toLowerCase())) return false;
    // AJUSTE 4: Filter by orientador in array
    if (filters.orientador) {
      const orientadores = presentation.orientadores || (presentation.orientador ? [presentation.orientador] : []);
      if (!orientadores.includes(filters.orientador)) return false;
    }
    
    const dateToFilter = filters.dateType === 'realizacao' ? presentation.dateRealizacao : presentation.dateSolicitacao;
    if (filters.dateType === 'realizacao' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  // Show results count
  const filtersApplied = filters.municipality || filters.status || filters.requester || filters.orientador || filters.dateStart || filters.dateEnd;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.municipality) filterInfo.push(`Município=${filters.municipality}`);
    if (filters.requester) filterInfo.push(`Solicitante=${filters.requester}`);
    if (filters.orientador) filterInfo.push(`Orientador=${filters.orientador}`);
    resultsCountDiv.innerHTML = `<strong>${filteredPresentations.length}</strong> apresentação(ões) encontrada(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredPresentations.length}</strong> apresentação(ões) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredPresentations.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhuma apresentação encontrada</p></div>';
    return;
  }
  
  function getStatusClass(status) {
    if (status === 'Realizada') return 'completed';
    if (status === 'Cancelada') return 'cancelled';
    return 'pending';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Município</th>
          <th>Data Solicitação</th>
          <th>Solicitante</th>
          <th>Status</th>
          <th>Data Realização</th>
          <th>Orientador</th>
          <th>Formas</th>
          <th>Descrição</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredPresentations.map(presentation => `
          <tr>
            <td><strong>${presentation.municipality}</strong></td>
            <td>${presentation.dateSolicitacao ? formatDate(presentation.dateSolicitacao) : '-'}</td>
            <td>${presentation.requester || '-'}</td>
            <td>
              <span class="task-status ${getStatusClass(presentation.status)}">
                ${presentation.status}
              </span>
            </td>
            <td>${presentation.dateRealizacao ? formatDate(presentation.dateRealizacao) : '-'}</td>
            <td>${(presentation.orientadores && presentation.orientadores.length > 0) ? presentation.orientadores.join(', ') : (presentation.orientador || '-')}</td>
            <td>${presentation.forms.length > 0 ? presentation.forms.join(', ') : '-'}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${presentation.description || ''}">${presentation.description || '-'}</td>
            <td>
              <div class="task-actions-compact">
                <button class="task-action-btn edit" onclick="showPresentationModal(${presentation.id})" title="Editar">
                  ✏️
                </button>
                <button class="task-action-btn delete" onclick="deletePresentation(${presentation.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updatePresentationStats() {
  const total = presentations.length;
  const pending = presentations.filter(p => p.status === 'Pendente').length;
  const completed = presentations.filter(p => p.status === 'Realizada').length;
  const cancelled = presentations.filter(p => p.status === 'Cancelada').length;
  
  document.getElementById('total-presentations').textContent = total;
  document.getElementById('pending-presentations').textContent = pending;
  document.getElementById('completed-presentations').textContent = completed;
  document.getElementById('cancelled-presentations').textContent = cancelled;
}

function getPresentationFilters() {
  return {
    municipality: document.getElementById('filter-presentation-municipality')?.value || '',
    status: document.getElementById('filter-presentation-status')?.value || '',
    requester: document.getElementById('filter-presentation-requester')?.value || '',
    orientador: document.getElementById('filter-presentation-orientador')?.value || '',
    dateType: document.getElementById('filter-presentation-date-type')?.value || 'solicitacao',
    dateStart: document.getElementById('filter-presentation-date-start')?.value || '',
    dateEnd: document.getElementById('filter-presentation-date-end')?.value || ''
  };
}

function clearPresentationFilters() {
  document.getElementById('filter-presentation-municipality').value = '';
  document.getElementById('filter-presentation-status').value = '';
  document.getElementById('filter-presentation-requester').value = '';
  document.getElementById('filter-presentation-orientador').value = '';
  document.getElementById('filter-presentation-date-type').value = 'solicitacao';
  document.getElementById('filter-presentation-date-start').value = '';
  document.getElementById('filter-presentation-date-end').value = '';
  renderPresentations();
}

function updatePresentationDropdowns() {
  const sortedList = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  const presentationSelect = document.getElementById('presentation-municipality');
  if (presentationSelect) {
    const currentValue = presentationSelect.value;
    if (sortedList.length === 0) {
      presentationSelect.innerHTML = '<option value="">Cadastre municípios em Configurações primeiro</option>';
      presentationSelect.disabled = true;
    } else {
      presentationSelect.disabled = false;
      presentationSelect.innerHTML = '<option value="">Selecione o município</option>' +
        sortedList.map(m => {
          const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
          return `<option value="${displayName}">${displayName}</option>`;
        }).join('');
      if (currentValue) presentationSelect.value = currentValue;
    }
  }
  
  const filterPresentationSelect = document.getElementById('filter-presentation-municipality');
  if (filterPresentationSelect) {
    const currentValue = filterPresentationSelect.value;
    filterPresentationSelect.innerHTML = '<option value="">Todos</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) filterPresentationSelect.value = currentValue;
  }
  
  // Update orientador checkboxes with proper structure
  const presentationOrientadorCheckboxes = document.getElementById('presentation-orientador-checkboxes');
  if (presentationOrientadorCheckboxes) {
    if (orientadores.length === 0) {
      presentationOrientadorCheckboxes.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">Nenhum orientador cadastrado. Cadastre orientadores em Configurações.</p>';
    } else {
      const checkedOrientadores = Array.from(document.querySelectorAll('#presentation-orientador-checkboxes input:checked')).map(cb => cb.value);
      presentationOrientadorCheckboxes.innerHTML = orientadores.map(o => 
        `<label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;"><input type="checkbox" value="${o.name}" ${checkedOrientadores.includes(o.name) ? 'checked' : ''}> ${o.name}</label>`
      ).join('');
    }
  }
  
  const filterPresentationOrientadorSelect = document.getElementById('filter-presentation-orientador');
  if (filterPresentationOrientadorSelect) {
    const currentValue = filterPresentationOrientadorSelect.value;
    filterPresentationOrientadorSelect.innerHTML = '<option value="">Todos</option>' +
      orientadores.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
    if (currentValue) filterPresentationOrientadorSelect.value = currentValue;
  }
}

function initializePresentationFilters() {
  document.getElementById('filter-presentation-municipality')?.addEventListener('change', renderPresentations);
  document.getElementById('filter-presentation-status')?.addEventListener('change', renderPresentations);
  document.getElementById('filter-presentation-requester')?.addEventListener('input', renderPresentations);
  document.getElementById('filter-presentation-orientador')?.addEventListener('change', renderPresentations);
  document.getElementById('filter-presentation-date-type')?.addEventListener('change', renderPresentations);
  document.getElementById('filter-presentation-date-start')?.addEventListener('change', renderPresentations);
  document.getElementById('filter-presentation-date-end')?.addEventListener('change', renderPresentations);
}

function exportPresentationsCSV() {
  const filters = getPresentationFilters();
  const filteredPresentations = presentations.filter(presentation => {
    if (filters.municipality && presentation.municipality !== filters.municipality) return false;
    if (filters.status && presentation.status !== filters.status) return false;
    if (filters.requester && presentation.requester && !presentation.requester.toLowerCase().includes(filters.requester.toLowerCase())) return false;
    if (filters.orientador && presentation.orientador && presentation.orientador !== filters.orientador) return false;
    
    const dateToFilter = filters.dateType === 'realizacao' ? presentation.dateRealizacao : presentation.dateSolicitacao;
    if (filters.dateType === 'realizacao' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  const headers = ['Município', 'Data Solicitação', 'Solicitante', 'Status', 'Data Realização', 'Orientador', 'Formas', 'Descrição'];
  const rows = filteredPresentations.map(p => [
    p.municipality,
    p.dateSolicitacao || '',
    p.requester || '',
    p.status,
    p.dateRealizacao || '',
    p.orientador || '',
    p.forms.join('; '),
    p.description || ''
  ]);
  
  downloadCSV('apresentacoes.csv', headers, rows);
  showToast('CSV exportado com sucesso!', 'success');
}

function generatePresentationsPDF() {
  showToast('Funcionalidade de PDF em desenvolvimento', 'error');
}

function triggerPresentationCSVImport() {
  showToast('Funcionalidade de importação em desenvolvimento', 'error');
}

function handlePresentationCSVImport(event) {
  showToast('Funcionalidade de importação em desenvolvimento', 'error');
}

function initializePresentationCharts() {
  const presentationStatusCtx = document.getElementById('presentationStatusChart')?.getContext('2d');
  const presentationMunicipalityCtx = document.getElementById('presentationMunicipalityChart')?.getContext('2d');
  const presentationOrientadorCtx = document.getElementById('presentationOrientadorChart')?.getContext('2d');
  
  if (!presentationStatusCtx) return;
  
  presentationStatusChart = new Chart(presentationStatusCtx, {
    type: 'pie',
    data: {
      labels: ['Pendente', 'Realizada', 'Cancelada'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  presentationMunicipalityChart = new Chart(presentationMunicipalityCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Apresentações',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  presentationOrientadorChart = new Chart(presentationOrientadorCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Apresentações',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  updatePresentationCharts();
}

function updatePresentationCharts() {
  if (!presentationStatusChart) return;
  
  const pending = presentations.filter(p => p.status === 'Pendente').length;
  const completed = presentations.filter(p => p.status === 'Realizada').length;
  const cancelled = presentations.filter(p => p.status === 'Cancelada').length;
  
  presentationStatusChart.data.datasets[0].data = [pending, completed, cancelled];
  presentationStatusChart.update();
  
  const municipalityCounts = {};
  presentations.forEach(p => {
    municipalityCounts[p.municipality] = (municipalityCounts[p.municipality] || 0) + 1;
  });
  presentationMunicipalityChart.data.labels = Object.keys(municipalityCounts);
  presentationMunicipalityChart.data.datasets[0].data = Object.values(municipalityCounts);
  presentationMunicipalityChart.update();
  
  // AJUSTE 4: Count orientadores from array
  const orientadorCounts = {};
  presentations.forEach(p => {
    const orientadores = p.orientadores || (p.orientador ? [p.orientador] : []);
    orientadores.forEach(orientador => {
      orientadorCounts[orientador] = (orientadorCounts[orientador] || 0) + 1;
    });
  });
  presentationOrientadorChart.data.labels = Object.keys(orientadorCounts);
  presentationOrientadorChart.data.datasets[0].data = Object.values(orientadorCounts);
  presentationOrientadorChart.update();
}

// Formas de Apresentação Functions

function navigateToFormaApresentacaoManagement() {
  if (!currentUser) {
    showToast('Acesso negado.', 'error');
    return;
  }
  
  document.getElementById('settings-menu').classList.remove('show');
  
  const tabButtons = document.querySelectorAll('.sidebar-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('formas-apresentacao-section').classList.add('active');
  
  renderFormasApresentacao();
}

function showFormaApresentacaoModal(formaId = null) {
  const modal = document.getElementById('forma-apresentacao-modal');
  const form = document.getElementById('forma-apresentacao-form');
  const title = document.getElementById('forma-apresentacao-modal-title');
  const errorDiv = document.getElementById('forma-apresentacao-error');
  
  form.reset();
  editingFormaApresentacaoId = formaId;
  errorDiv.textContent = '';
  
  if (formaId) {
    title.textContent = 'Editar Forma de Apresentação';
    const forma = formasApresentacao.find(f => f.id === formaId);
    if (forma) {
      document.getElementById('forma-apresentacao-name').value = forma.name;
    }
  } else {
    title.textContent = 'Nova Forma de Apresentação';
  }
  
  modal.classList.add('show');
}

function closeFormaApresentacaoModal() {
  document.getElementById('forma-apresentacao-modal').classList.remove('show');
  editingFormaApresentacaoId = null;
}

function saveFormaApresentacao(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('forma-apresentacao-error');
  
  const formaData = {
    name: document.getElementById('forma-apresentacao-name').value.trim()
  };
  
  if (!editingFormaApresentacaoId) {
    const nameExists = formasApresentacao.some(f => f.name.toLowerCase() === formaData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Esta forma de apresentação já existe. Escolha outro nome.';
      return;
    }
  } else {
    const nameExists = formasApresentacao.some(f => f.id !== editingFormaApresentacaoId && f.name.toLowerCase() === formaData.name.toLowerCase());
    if (nameExists) {
      errorDiv.textContent = 'Esta forma de apresentação já existe. Escolha outro nome.';
      return;
    }
  }
  
  if (editingFormaApresentacaoId) {
    const index = formasApresentacao.findIndex(f => f.id === editingFormaApresentacaoId);
    formasApresentacao[index] = { ...formasApresentacao[index], ...formaData };
    showToast('Forma de apresentação atualizada com sucesso!', 'success');
  } else {
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];
    formasApresentacao.push({ id: formaApresentacaoIdCounter++, ...formaData, createdAt });
    showToast('Forma de apresentação criada com sucesso!', 'success');
  }
  
  closeFormaApresentacaoModal();
  renderFormasApresentacao();
  updateFormaApresentacaoCheckboxes();
}

function deleteFormaApresentacao(formaId) {
  const forma = formasApresentacao.find(f => f.id === formaId);
  if (!forma) return;
  
  const inUse = presentations.some(p => p.forms.includes(forma.name));
  if (inUse) {
    showToast('Esta forma de apresentação está em uso e não pode ser excluída.', 'error');
    return;
  }
  
  if (confirm(`Tem certeza que deseja excluir a forma "${forma.name}"?`)) {
    formasApresentacao = formasApresentacao.filter(f => f.id !== formaId);
    renderFormasApresentacao();
    updateFormaApresentacaoCheckboxes();
    showToast('Forma de apresentação excluída com sucesso!', 'success');
  }
}

function renderFormasApresentacao() {
  const container = document.getElementById('formas-apresentacao-table');
  const totalDiv = document.getElementById('formas-apresentacao-total');
  
  if (formasApresentacao.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhuma forma de apresentação cadastrada</p></div>';
    totalDiv.style.display = 'none';
    return;
  }
  
  totalDiv.innerHTML = `<strong>Total de Formas de Apresentação:</strong> ${formasApresentacao.length}`;
  totalDiv.style.display = 'block';
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Data Criação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${formasApresentacao.map(forma => `
          <tr>
            <td><strong>${forma.name}</strong></td>
            <td>${formatDate(forma.createdAt)}</td>
            <td>
              <div class="task-actions">
                <button class="btn btn--outline btn--sm" onclick="showFormaApresentacaoModal(${forma.id})" title="Editar">
                  ✏️
                </button>
                <button class="btn btn--outline btn--sm" onclick="deleteFormaApresentacao(${forma.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateFormaApresentacaoCheckboxes() {
  const checkboxGrid = document.getElementById('presentation-forms-checkboxes');
  if (checkboxGrid) {
    const checkedForms = Array.from(document.querySelectorAll('#presentation-forms-checkboxes input:checked')).map(cb => cb.value);
    if (formasApresentacao.length === 0) {
      checkboxGrid.innerHTML = '<p style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">Nenhuma forma cadastrada</p>';
    } else {
      checkboxGrid.innerHTML = formasApresentacao.map(f => 
        `<label><input type="checkbox" value="${f.name}" ${checkedForms.includes(f.name) ? 'checked' : ''}> ${f.name}</label>`
      ).join('');
    }
  }
}

// Dashboard Functions

function updateDashboardStats() {
  // Card 1: Total de Municípios Em Uso
  const municipiosEmUso = municipalities.filter(m => m.status === 'Em uso').length;
  document.getElementById('dashboard-municipalities-in-use').textContent = municipiosEmUso;
  
  // Card 2: Total de Treinamentos Realizados (Concluído)
  const treinamentosConcluidos = tasks.filter(t => t.status === 'Concluído').length;
  document.getElementById('dashboard-trainings-completed').textContent = treinamentosConcluidos;
  
  // Card 3: Total de Solicitações Atendidas (Realizado)
  const solicitacoesRealizadas = requests.filter(r => r.status === 'Realizado').length;
  document.getElementById('dashboard-requests-completed').textContent = solicitacoesRealizadas;
  
  // Card 4: Total de Apresentações Realizadas
  const apresentacoesRealizadas = presentations.filter(p => p.status === 'Realizada').length;
  document.getElementById('dashboard-presentations-completed').textContent = apresentacoesRealizadas;
}

function initializeDashboardCharts() {
  const ctx = document.getElementById('implantationsYearChart');
  if (!ctx) return;
  
  implantationsYearChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Implantações',
        data: [],
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'],
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
  
  updateDashboardCharts();
}

function updateDashboardCharts() {
  if (!implantationsYearChart) return;
  
  // Filter municipalities: Em uso, Bloqueado, Parou de utilizar (exclude Não Implantado)
  const validStatuses = ['Em uso', 'Bloqueado', 'Parou de usar'];
  const validMunicipalities = municipalities.filter(m => 
    validStatuses.includes(m.status) && m.implantationDate
  );
  
  // Group by year
  const yearCounts = {};
  validMunicipalities.forEach(m => {
    const year = new Date(m.implantationDate).getFullYear();
    if (!isNaN(year)) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });
  
  // Sort years
  const sortedYears = Object.keys(yearCounts).sort();
  const counts = sortedYears.map(year => yearCounts[year]);
  
  // Generate colors
  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
  const barColors = sortedYears.map((_, index) => colors[index % colors.length]);
  
  implantationsYearChart.data.labels = sortedYears;
  implantationsYearChart.data.datasets[0].data = counts;
  implantationsYearChart.data.datasets[0].backgroundColor = barColors;
  implantationsYearChart.update();
}

// Demandas do Suporte Functions
function showDemandModal(demandId = null) {
  const modal = document.getElementById('demand-modal');
  const form = document.getElementById('demand-form');
  const title = document.getElementById('demand-modal-title');
  
  form.reset();
  editingDemandId = demandId;
  
  if (demandId) {
    title.textContent = 'Editar Demanda';
    const demand = demands.find(d => d.id === demandId);
    if (demand) {
      document.getElementById('demand-date').value = demand.date;
      document.getElementById('demand-description').value = demand.description;
      document.getElementById('demand-priority').value = demand.priority;
      document.getElementById('demand-status').value = demand.status;
      document.getElementById('demand-realization-date').value = demand.realizationDate || '';
      document.getElementById('demand-justification').value = demand.justification || '';
    }
  } else {
    title.textContent = 'Nova Demanda';
    document.getElementById('demand-status').value = 'Pendente';
  }
  
  handleDemandStatusChange();
  updateDemandCharCounter();
  modal.classList.add('show');
}

function closeDemandModal() {
  document.getElementById('demand-modal').classList.remove('show');
  editingDemandId = null;
}

function handleDemandStatusChange() {
  const status = document.getElementById('demand-status').value;
  const realizationDateGroup = document.getElementById('demand-realization-date-group');
  const justificationGroup = document.getElementById('demand-justification-group');
  const realizationDateInput = document.getElementById('demand-realization-date');
  const justificationInput = document.getElementById('demand-justification');
  
  if (status === 'Realizada') {
    realizationDateGroup.style.display = 'block';
    realizationDateInput.required = true;
    justificationGroup.style.display = 'none';
    justificationInput.required = false;
  } else if (status === 'Inviável') {
    realizationDateGroup.style.display = 'none';
    realizationDateInput.required = false;
    justificationGroup.style.display = 'block';
    justificationInput.required = false;
  } else {
    realizationDateGroup.style.display = 'none';
    realizationDateInput.required = false;
    justificationGroup.style.display = 'none';
    justificationInput.required = false;
  }
}

function updateDemandCharCounter() {
  const textarea = document.getElementById('demand-description');
  const counter = document.getElementById('demand-char-counter');
  
  if (textarea && counter) {
    const length = textarea.value.length;
    counter.textContent = `${length} / 250`;
    
    if (length >= 250) {
      counter.className = 'char-counter limit-exceeded';
    } else if (length >= 230) {
      counter.className = 'char-counter limit-warning';
    } else {
      counter.className = 'char-counter';
    }
  }
}

function saveDemand(event) {
  event.preventDefault();
  
  const demandData = {
    date: document.getElementById('demand-date').value,
    description: document.getElementById('demand-description').value,
    priority: document.getElementById('demand-priority').value,
    status: document.getElementById('demand-status').value,
    realizationDate: document.getElementById('demand-realization-date').value || null,
    justification: document.getElementById('demand-justification').value || null,
    user: currentUser ? currentUser.name : 'Sistema'
  };
  
  if (editingDemandId) {
    const index = demands.findIndex(d => d.id === editingDemandId);
    demands[index] = { ...demands[index], ...demandData };
    showToast('Demanda atualizada com sucesso!', 'success');
  } else {
    demands.push({ id: demandIdCounter++, ...demandData });
    showToast('Demanda criada com sucesso!', 'success');
  }
  
  closeDemandModal();
  renderDemands();
  updateDemandStats();
  updateDemandCharts();
}

function deleteDemand(demandId) {
  if (confirm('Tem certeza que deseja excluir esta demanda?')) {
    demands = demands.filter(d => d.id !== demandId);
    renderDemands();
    updateDemandStats();
    updateDemandCharts();
    showToast('Demanda excluída com sucesso!', 'success');
  }
}

function renderDemands() {
  const container = document.getElementById('demands-table');
  const resultsCountDiv = document.getElementById('demands-results-count');
  const filters = getDemandFilters();
  
  let filteredDemands = demands.filter(demand => {
    if (filters.status && demand.status !== filters.status) return false;
    if (filters.priority && demand.priority !== filters.priority) return false;
    if (filters.user && !demand.user.toLowerCase().includes(filters.user.toLowerCase())) return false;
    
    const dateToFilter = filters.dateType === 'realizacao' ? demand.realizationDate : demand.date;
    if (filters.dateType === 'realizacao' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  // Sort: Alta > Média > Baixa > Inviável, then by date
  filteredDemands.sort((a, b) => {
    const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    const statusOrder = { 'Pendente': 0, 'Realizada': 0, 'Inviável': 4 };
    
    const orderA = a.status === 'Inviável' ? statusOrder[a.status] : priorityOrder[a.priority];
    const orderB = b.status === 'Inviável' ? statusOrder[b.status] : priorityOrder[b.priority];
    
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.date) - new Date(b.date);
  });
  
  // Show results count
  const filtersApplied = filters.status || filters.priority || filters.user || filters.dateStart || filters.dateEnd;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.priority) filterInfo.push(`Prioridade=${filters.priority}`);
    if (filters.user) filterInfo.push(`Usuário=${filters.user}`);
    resultsCountDiv.innerHTML = `<strong>${filteredDemands.length}</strong> demanda(s) encontrada(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredDemands.length}</strong> demanda(s) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredDemands.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhuma demanda encontrada</p></div>';
    return;
  }
  
  function getStatusClass(status) {
    if (status === 'Realizada') return 'completed';
    if (status === 'Inviável') return 'cancelled';
    return 'pending';
  }
  
  function getPriorityBadge(priority) {
    const colors = { 'Alta': '#FF6B6B', 'Média': '#FFA07A', 'Baixa': '#45B7D1' };
    return `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; background-color: ${colors[priority]}; color: white; font-size: 11px; font-weight: 600;">${priority}</span>`;
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Data Solicitação</th>
          <th>Descrição</th>
          <th>Prioridade</th>
          <th>Status</th>
          <th>Data Realização</th>
          <th>Usuário</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredDemands.map(demand => `
          <tr>
            <td>${formatDate(demand.date)}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${demand.description}">${demand.description}</td>
            <td>${getPriorityBadge(demand.priority)}</td>
            <td>
              <span class="task-status ${getStatusClass(demand.status)}">
                ${demand.status}
              </span>
            </td>
            <td>${demand.realizationDate ? formatDate(demand.realizationDate) : '-'}</td>
            <td>${demand.user}</td>
            <td>
              <div class="task-actions-compact">
                <button class="task-action-btn edit" onclick="showDemandModal(${demand.id})" title="Editar">
                  ✏️
                </button>
                <button class="task-action-btn delete" onclick="deleteDemand(${demand.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateDemandStats() {
  const total = demands.length;
  const pending = demands.filter(d => d.status === 'Pendente').length;
  const completed = demands.filter(d => d.status === 'Realizada').length;
  const unfeasible = demands.filter(d => d.status === 'Inviável').length;
  
  document.getElementById('total-demands').textContent = total;
  document.getElementById('pending-demands').textContent = pending;
  document.getElementById('completed-demands').textContent = completed;
  document.getElementById('unfeasible-demands').textContent = unfeasible;
}

function getDemandFilters() {
  return {
    status: document.getElementById('filter-demand-status')?.value || '',
    priority: document.getElementById('filter-demand-priority')?.value || '',
    user: document.getElementById('filter-demand-user')?.value || '',
    dateType: document.getElementById('filter-demand-date-type')?.value || 'solicitacao',
    dateStart: document.getElementById('filter-demand-date-start')?.value || '',
    dateEnd: document.getElementById('filter-demand-date-end')?.value || ''
  };
}

function clearDemandFilters() {
  document.getElementById('filter-demand-status').value = '';
  document.getElementById('filter-demand-priority').value = '';
  document.getElementById('filter-demand-user').value = '';
  document.getElementById('filter-demand-date-type').value = 'solicitacao';
  document.getElementById('filter-demand-date-start').value = '';
  document.getElementById('filter-demand-date-end').value = '';
  renderDemands();
}

function initializeDemandCharts() {
  const demandStatusCtx = document.getElementById('demandStatusChart')?.getContext('2d');
  const demandPriorityCtx = document.getElementById('demandPriorityChart')?.getContext('2d');
  const demandUserCtx = document.getElementById('demandUserChart')?.getContext('2d');
  
  if (!demandStatusCtx) return;
  
  demandStatusChart = new Chart(demandStatusCtx, {
    type: 'pie',
    data: {
      labels: ['Pendente', 'Realizada', 'Inviável'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  demandPriorityChart = new Chart(demandPriorityCtx, {
    type: 'bar',
    data: {
      labels: ['Alta', 'Média', 'Baixa'],
      datasets: [{
        label: 'Demandas',
        data: [0, 0, 0],
        backgroundColor: ['#FF6B6B', '#FFA07A', '#45B7D1']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  demandUserChart = new Chart(demandUserCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Demandas',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  updateDemandCharts();
}

function updateDemandCharts() {
  if (!demandStatusChart) return;
  
  const pending = demands.filter(d => d.status === 'Pendente').length;
  const completed = demands.filter(d => d.status === 'Realizada').length;
  const unfeasible = demands.filter(d => d.status === 'Inviável').length;
  
  demandStatusChart.data.datasets[0].data = [pending, completed, unfeasible];
  demandStatusChart.update();
  
  const alta = demands.filter(d => d.priority === 'Alta').length;
  const media = demands.filter(d => d.priority === 'Média').length;
  const baixa = demands.filter(d => d.priority === 'Baixa').length;
  
  demandPriorityChart.data.datasets[0].data = [alta, media, baixa];
  demandPriorityChart.update();
  
  const userCounts = {};
  demands.forEach(d => {
    userCounts[d.user] = (userCounts[d.user] || 0) + 1;
  });
  demandUserChart.data.labels = Object.keys(userCounts);
  demandUserChart.data.datasets[0].data = Object.values(userCounts);
  demandUserChart.update();
}

// Visitas Presenciais Functions
function showVisitModal(visitId = null) {
  const modal = document.getElementById('visit-modal');
  const form = document.getElementById('visit-form');
  const title = document.getElementById('visit-modal-title');
  
  form.reset();// Garantia de carregamento
if (municipalitiesList.length === 0) {
  showToast('Carregando municípios...', 'info');
  setTimeout(() => populateMunicipalitySelect('visit-municipality'), 100);
} else {
  populateMunicipalitySelect('visit-municipality');
}
  updateAllMunicipalityDropdowns(); // ← ADICIONE
  populateMunicipalitySelect('visit-municipality');
  editingVisitId = visitId;
  
  if (visitId) {
    title.textContent = 'Editar Solicitação de Visita';
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      document.getElementById('visit-municipality').value = visit.municipality;
      document.getElementById('visit-date').value = visit.date;
      document.getElementById('visit-applicant').value = visit.applicant;
      document.getElementById('visit-reason').value = visit.reason || '';
      document.getElementById('visit-status').value = visit.status;
      document.getElementById('visit-visit-date').value = visit.visitDate || '';
      document.getElementById('visit-cancel-justification').value = visit.cancelJustification || '';
    }
  } else {
    title.textContent = 'Nova Solicitação de Visita';
    document.getElementById('visit-status').value = 'Pendente';
  }
  populateMunicipalitySelect('visit-municipality');
  
  handleVisitStatusChange();
  modal.classList.add('show');
}

function closeVisitModal() {
  document.getElementById('visit-modal').classList.remove('show');
  editingVisitId = null;
}

function handleVisitStatusChange() {
  const status = document.getElementById('visit-status').value;
  const visitDateGroup = document.getElementById('visit-visit-date-group');
  const cancelJustificationGroup = document.getElementById('visit-cancel-justification-group');
  const visitDateInput = document.getElementById('visit-visit-date');
  const cancelJustificationInput = document.getElementById('visit-cancel-justification');
  
  if (status === 'Realizada') {
    visitDateGroup.style.display = 'block';
    visitDateInput.required = true;
    cancelJustificationGroup.style.display = 'none';
    cancelJustificationInput.required = false;
  } else if (status === 'Cancelada') {
    visitDateGroup.style.display = 'none';
    visitDateInput.required = false;
    cancelJustificationGroup.style.display = 'block';
    cancelJustificationInput.required = true;
  } else {
    visitDateGroup.style.display = 'none';
    visitDateInput.required = false;
    cancelJustificationGroup.style.display = 'none';
    cancelJustificationInput.required = false;
  }
}

function saveVisit(event) {
  event.preventDefault();
  
  const visitData = {
    municipality: document.getElementById('visit-municipality').value,
    date: document.getElementById('visit-date').value,
    applicant: document.getElementById('visit-applicant').value,
    reason: document.getElementById('visit-reason').value || null,
    status: document.getElementById('visit-status').value,
    visitDate: document.getElementById('visit-visit-date').value || null,
    cancelJustification: document.getElementById('visit-cancel-justification').value || null
  };
  
  if (editingVisitId) {
    const index = visits.findIndex(v => v.id === editingVisitId);
    visits[index] = { ...visits[index], ...visitData };
    showToast('Visita atualizada com sucesso!', 'success');
  } else {
    visits.push({ id: visitIdCounter++, ...visitData });
    showToast('Visita criada com sucesso!', 'success');
  }
  
  closeVisitModal();
  renderVisits();
  updateVisitStats();
  updateVisitCharts();
}

function deleteVisit(visitId) {
  if (confirm('Tem certeza que deseja excluir esta visita?')) {
    visits = visits.filter(v => v.id !== visitId);
    renderVisits();
    updateVisitStats();
    updateVisitCharts();
    showToast('Visita excluída com sucesso!', 'success');
  }
}

function renderVisits() {
  const container = document.getElementById('visits-table');
  const resultsCountDiv = document.getElementById('visits-results-count');
  const filters = getVisitFilters();
  
  let filteredVisits = visits.filter(visit => {
    if (filters.municipality && visit.municipality !== filters.municipality) return false;
    if (filters.status && visit.status !== filters.status) return false;
    if (filters.applicant && !visit.applicant.toLowerCase().includes(filters.applicant.toLowerCase())) return false;
    
    const dateToFilter = filters.dateType === 'realizacao' ? visit.visitDate : visit.date;
    if (filters.dateType === 'realizacao' && !dateToFilter && (filters.dateStart || filters.dateEnd)) return false;
    if (filters.dateStart && dateToFilter && dateToFilter < filters.dateStart) return false;
    if (filters.dateEnd && dateToFilter && dateToFilter > filters.dateEnd) return false;
    
    return true;
  });
  
  // Sort by date
  filteredVisits.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Show results count
  const filtersApplied = filters.municipality || filters.status || filters.applicant || filters.dateStart || filters.dateEnd;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.municipality) filterInfo.push(`Município=${filters.municipality}`);
    if (filters.applicant) filterInfo.push(`Solicitante=${filters.applicant}`);
    resultsCountDiv.innerHTML = `<strong>${filteredVisits.length}</strong> visita(s) encontrada(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredVisits.length}</strong> visita(s) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredVisits.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhuma visita encontrada</p></div>';
    return;
  }
  
  function getStatusClass(status) {
    if (status === 'Realizada') return 'completed';
    if (status === 'Cancelada') return 'cancelled';
    return 'pending';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Município</th>
          <th>Data Solicitação</th>
          <th>Solicitante</th>
          <th>Motivo</th>
          <th>Status</th>
          <th>Data Visita</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredVisits.map(visit => `
          <tr>
            <td><strong>${visit.municipality}</strong></td>
            <td>${formatDate(visit.date)}</td>
            <td>${visit.applicant}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${visit.reason || ''}">${visit.reason || '-'}</td>
            <td>
              <span class="task-status ${getStatusClass(visit.status)}">
                ${visit.status}
              </span>
            </td>
            <td>${visit.visitDate ? formatDate(visit.visitDate) : '-'}</td>
            <td>
              <div class="task-actions-compact">
                <button class="task-action-btn edit" onclick="showVisitModal(${visit.id})" title="Editar">
                  ✏️
                </button>
                <button class="task-action-btn delete" onclick="deleteVisit(${visit.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateVisitStats() {
  const total = visits.length;
  const pending = visits.filter(v => v.status === 'Pendente').length;
  const completed = visits.filter(v => v.status === 'Realizada').length;
  const cancelled = visits.filter(v => v.status === 'Cancelada').length;
  
  document.getElementById('total-visits').textContent = total;
  document.getElementById('pending-visits').textContent = pending;
  document.getElementById('completed-visits').textContent = completed;
  document.getElementById('cancelled-visits').textContent = cancelled;
}

function getVisitFilters() {
  return {
    municipality: document.getElementById('filter-visit-municipality')?.value || '',
    status: document.getElementById('filter-visit-status')?.value || '',
    applicant: document.getElementById('filter-visit-applicant')?.value || '',
    dateType: document.getElementById('filter-visit-date-type')?.value || 'solicitacao',
    dateStart: document.getElementById('filter-visit-date-start')?.value || '',
    dateEnd: document.getElementById('filter-visit-date-end')?.value || ''
  };
}

function clearVisitFilters() {
  document.getElementById('filter-visit-municipality').value = '';
  document.getElementById('filter-visit-status').value = '';
  document.getElementById('filter-visit-applicant').value = '';
  document.getElementById('filter-visit-date-type').value = 'solicitacao';
  document.getElementById('filter-visit-date-start').value = '';
  document.getElementById('filter-visit-date-end').value = '';
  renderVisits();
}

function updateVisitMunicipalityDropdowns(sortedList) {
  if (!sortedList) {
    sortedList = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
  
  const visitSelect = document.getElementById('visit-municipality');
  if (visitSelect) {
    const currentValue = visitSelect.value;
    visitSelect.innerHTML = '<option value="">Selecione o município</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) visitSelect.value = currentValue;
  }
  
  const filterVisitSelect = document.getElementById('filter-visit-municipality');
  if (filterVisitSelect) {
    const currentValue = filterVisitSelect.value;
    filterVisitSelect.innerHTML = '<option value="">Todos</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) filterVisitSelect.value = currentValue;
  }
}

function initializeVisitCharts() {
  const visitStatusCtx = document.getElementById('visitStatusChart')?.getContext('2d');
  const visitMunicipalityCtx = document.getElementById('visitMunicipalityChart')?.getContext('2d');
  const visitApplicantCtx = document.getElementById('visitApplicantChart')?.getContext('2d');
  
  if (!visitStatusCtx) return;
  
  visitStatusChart = new Chart(visitStatusCtx, {
    type: 'pie',
    data: {
      labels: ['Pendente', 'Realizada', 'Cancelada'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  visitMunicipalityChart = new Chart(visitMunicipalityCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Visitas',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  visitApplicantChart = new Chart(visitApplicantCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Visitas',
        data: [],
        backgroundColor: '#45B7D1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  updateVisitCharts();
}

function updateVisitCharts() {
  if (!visitStatusChart) return;
  
  const pending = visits.filter(v => v.status === 'Pendente').length;
  const completed = visits.filter(v => v.status === 'Realizada').length;
  const cancelled = visits.filter(v => v.status === 'Cancelada').length;
  
  visitStatusChart.data.datasets[0].data = [pending, completed, cancelled];
  visitStatusChart.update();
  
  const municipalityCounts = {};
  visits.forEach(v => {
    municipalityCounts[v.municipality] = (municipalityCounts[v.municipality] || 0) + 1;
  });
  visitMunicipalityChart.data.labels = Object.keys(municipalityCounts);
  visitMunicipalityChart.data.datasets[0].data = Object.values(municipalityCounts);
  visitMunicipalityChart.update();
  
  const applicantCounts = {};
  visits.forEach(v => {
    applicantCounts[v.applicant] = (applicantCounts[v.applicant] || 0) + 1;
  });
  visitApplicantChart.data.labels = Object.keys(applicantCounts);
  visitApplicantChart.data.datasets[0].data = Object.values(applicantCounts);
  visitApplicantChart.update();
}

// Produção Functions
function showProductionModal(productionId = null) {
  const modal = document.getElementById('production-modal');
  const form = document.getElementById('production-form');
  const title = document.getElementById('production-modal-title');
  
  form.reset();
  if (municipalitiesList.length === 0) {
  showToast('Carregando municípios...', 'info');
  setTimeout(() => populateMunicipalitySelect('production-municipality'), 100);
} else {
  populateMunicipalitySelect('production-municipality');
}
  updateAllMunicipalityDropdowns(); // ← ADICIONE
  populateMunicipalitySelect('production-municipality');
  editingProductionId = productionId;
  
  if (productionId) {
    title.textContent = 'Editar Envio de Produção';
    const production = productions.find(p => p.id === productionId);
    if (production) {
      document.getElementById('production-municipality').value = production.municipality;
      document.getElementById('production-professional').value = production.professional || '';
      document.getElementById('production-contact').value = production.contact;
      document.getElementById('production-frequency').value = production.frequency;
      document.getElementById('production-competence').value = production.competence;
      document.getElementById('production-period').value = production.period;
      document.getElementById('production-release-date').value = production.releaseDate;
      document.getElementById('production-send-date').value = production.sendDate || '';
      document.getElementById('production-status').value = production.status;
      document.getElementById('production-observations').value = production.observations || '';
    }
  } else {
    title.textContent = 'Novo Envio de Produção';
    document.getElementById('production-status').value = 'Pendente';
  }
  
  modal.classList.add('show');
}

function closeProductionModal() {
  document.getElementById('production-modal').classList.remove('show');
  editingProductionId = null;
}

function saveProduction(event) {
  event.preventDefault();
  
  const productionData = {
    municipality: document.getElementById('production-municipality').value,
    professional: document.getElementById('production-professional').value || null,
    contact: document.getElementById('production-contact').value,
    frequency: document.getElementById('production-frequency').value,
    competence: document.getElementById('production-competence').value,
    period: document.getElementById('production-period').value,
    releaseDate: document.getElementById('production-release-date').value,
    sendDate: document.getElementById('production-send-date').value || null,
    status: document.getElementById('production-status').value,
    observations: document.getElementById('production-observations').value || null
  };
  
  if (editingProductionId) {
    const index = productions.findIndex(p => p.id === editingProductionId);
    productions[index] = { ...productions[index], ...productionData };
    showToast('Envio de produção atualizado com sucesso!', 'success');
  } else {
    productions.push({ id: productionIdCounter++, ...productionData });
    showToast('Envio de produção criado com sucesso!', 'success');
  }
  
  closeProductionModal();
  renderProductions();
  updateProductionStats();
  updateProductionCharts();
}

function deleteProduction(productionId) {
  if (confirm('Tem certeza que deseja excluir este envio de produção?')) {
    productions = productions.filter(p => p.id !== productionId);
    renderProductions();
    updateProductionStats();
    updateProductionCharts();
    showToast('Envio de produção excluído com sucesso!', 'success');
  }
}

function renderProductions() {
  const container = document.getElementById('productions-table');
  const resultsCountDiv = document.getElementById('productions-results-count');
  const filters = getProductionFilters();
  
  let filteredProductions = productions.filter(production => {
    if (filters.municipality && production.municipality !== filters.municipality) return false;
    if (filters.status && production.status !== filters.status) return false;
    if (filters.professional && production.professional && !production.professional.toLowerCase().includes(filters.professional.toLowerCase())) return false;
    if (filters.frequency && production.frequency !== filters.frequency) return false;
    if (filters.releaseStart && production.releaseDate < filters.releaseStart) return false;
    if (filters.releaseEnd && production.releaseDate > filters.releaseEnd) return false;
    if (filters.sendStart && production.sendDate && production.sendDate < filters.sendStart) return false;
    if (filters.sendEnd && production.sendDate && production.sendDate > filters.sendEnd) return false;
    
    return true;
  });
  
  // Show results count
  const filtersApplied = filters.municipality || filters.status || filters.professional || filters.frequency || filters.releaseStart || filters.releaseEnd || filters.sendStart || filters.sendEnd;
  if (filtersApplied) {
    let filterInfo = [];
    if (filters.status) filterInfo.push(`Status=${filters.status}`);
    if (filters.municipality) filterInfo.push(`Município=${filters.municipality}`);
    if (filters.frequency) filterInfo.push(`Frequência=${filters.frequency}`);
    resultsCountDiv.innerHTML = `<strong>${filteredProductions.length}</strong> envio(s) encontrado(s)<br><div class="filter-info">Filtros: ${filterInfo.join(', ')}</div>`;
    resultsCountDiv.style.display = 'block';
  } else {
    resultsCountDiv.innerHTML = `<strong>${filteredProductions.length}</strong> envio(s) no total`;
    resultsCountDiv.style.display = 'block';
  }
  
  if (filteredProductions.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum envio de produção encontrado</p></div>';
    return;
  }
  
  function getStatusClass(status) {
    if (status === 'Enviada') return 'completed';
    if (status === 'Cancelada') return 'cancelled';
    return 'pending';
  }
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Município</th>
          <th>Profissional</th>
          <th>Contato</th>
          <th>Frequência</th>
          <th>Competência</th>
          <th>Período</th>
          <th>Data Liberação</th>
          <th>Data Envio</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredProductions.map(production => `
          <tr>
            <td><strong>${production.municipality}</strong></td>
            <td>${production.professional || '-'}</td>
            <td>${production.contact}</td>
            <td>${production.frequency}</td>
            <td>${production.competence}</td>
            <td>${production.period}</td>
            <td>${formatDate(production.releaseDate)}</td>
            <td>${production.sendDate ? formatDate(production.sendDate) : '-'}</td>
            <td>
              <span class="task-status ${getStatusClass(production.status)}">
                ${production.status}
              </span>
            </td>
            <td>
              <div class="task-actions-compact">
                <button class="task-action-btn edit" onclick="showProductionModal(${production.id})" title="Editar">
                  ✏️
                </button>
                <button class="task-action-btn delete" onclick="deleteProduction(${production.id})" title="Excluir">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateProductionStats() {
  const total = productions.length;
  const sent = productions.filter(p => p.status === 'Enviada').length;
  const pending = productions.filter(p => p.status === 'Pendente').length;
  const cancelled = productions.filter(p => p.status === 'Cancelada').length;
  
  document.getElementById('total-productions').textContent = total;
  document.getElementById('sent-productions').textContent = sent;
  document.getElementById('pending-productions').textContent = pending;
  document.getElementById('cancelled-productions').textContent = cancelled;
}

function getProductionFilters() {
  return {
    municipality: document.getElementById('filter-production-municipality')?.value || '',
    status: document.getElementById('filter-production-status')?.value || '',
    professional: document.getElementById('filter-production-professional')?.value || '',
    frequency: document.getElementById('filter-production-frequency')?.value || '',
    releaseStart: document.getElementById('filter-production-release-start')?.value || '',
    releaseEnd: document.getElementById('filter-production-release-end')?.value || '',
    sendStart: document.getElementById('filter-production-send-start')?.value || '',
    sendEnd: document.getElementById('filter-production-send-end')?.value || ''
  };
}

function clearProductionFilters() {
  document.getElementById('filter-production-municipality').value = '';
  document.getElementById('filter-production-status').value = '';
  document.getElementById('filter-production-professional').value = '';
  document.getElementById('filter-production-frequency').value = '';
  document.getElementById('filter-production-release-start').value = '';
  document.getElementById('filter-production-release-end').value = '';
  document.getElementById('filter-production-send-start').value = '';
  document.getElementById('filter-production-send-end').value = '';
  renderProductions();
}

function updateProductionMunicipalityDropdowns(sortedList) {
  if (!sortedList) {
    sortedList = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
  
  const productionSelect = document.getElementById('production-municipality');
  if (productionSelect) {
    const currentValue = productionSelect.value;
    productionSelect.innerHTML = '<option value="">Selecione o município</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) productionSelect.value = currentValue;
  }
  
  const filterProductionSelect = document.getElementById('filter-production-municipality');
  if (filterProductionSelect) {
    const currentValue = filterProductionSelect.value;
    filterProductionSelect.innerHTML = '<option value="">Todos</option>' +
      sortedList.map(m => {
        const displayName = m.uf ? `${m.name} - ${m.uf}` : m.name;
        return `<option value="${displayName}">${displayName}</option>`;
      }).join('');
    if (currentValue) filterProductionSelect.value = currentValue;
  }
}

function initializeProductionCharts() {
  const productionStatusCtx = document.getElementById('productionStatusChart')?.getContext('2d');
  const productionFrequencyCtx = document.getElementById('productionFrequencyChart')?.getContext('2d');
  
  if (!productionStatusCtx) return;
  
  productionStatusChart = new Chart(productionStatusCtx, {
    type: 'pie',
    data: {
      labels: ['Enviada', 'Pendente', 'Cancelada'],
      datasets: [{
        data: [0, 1, 0],
        backgroundColor: ['#45B7D1', '#FFA07A', '#FF6B6B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  productionFrequencyChart = new Chart(productionFrequencyCtx, {
    type: 'bar',
    data: {
      labels: ['Diário', 'Semanal', 'Quinzenal', 'Mensal'],
      datasets: [{
        label: 'Municípios',
        data: [0, 0, 0, 0],
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
  
  updateProductionCharts();
}

function updateProductionCharts() {
  if (!productionStatusChart) return;
  
  const sent = productions.filter(p => p.status === 'Enviada').length;
  const pending = productions.filter(p => p.status === 'Pendente').length;
  const cancelled = productions.filter(p => p.status === 'Cancelada').length;
  
  productionStatusChart.data.datasets[0].data = [sent, pending, cancelled];
  productionStatusChart.update();
  
  const diario = productions.filter(p => p.frequency === 'Diário').length;
  const semanal = productions.filter(p => p.frequency === 'Semanal').length;
  const quinzenal = productions.filter(p => p.frequency === 'Quinzenal').length;
  const mensal = productions.filter(p => p.frequency === 'Mensal').length;
  
  productionFrequencyChart.data.datasets[0].data = [diario, semanal, quinzenal, mensal];
  productionFrequencyChart.update();
}

function rowDataToTask(rowData) {
  // Find exact match for orientador
  const orientador = orientadores.find(o => 
    o.name.toLowerCase() === rowData.performedBy.toLowerCase()
  );
  
  // Find exact match for cargo
  const cargo = cargos.find(c => 
    c.name.toLowerCase() === rowData.trainedPosition.toLowerCase()
  );
  
  return {
    dateRequested: rowData.dateRequested ? convertDateToISO(rowData.dateRequested) : '',
    datePerformed: rowData.datePerformed ? convertDateToISO(rowData.datePerformed) : '',
    municipality: rowData.municipality || '',
    requestedBy: rowData.requestedBy,
    performedBy: orientador ? orientador.name : rowData.performedBy,
    trainedName: rowData.trainedName || '',
    trainedPosition: cargo ? cargo.name : rowData.trainedPosition || '',
    contact: rowData.contact || '',
    status: rowData.status,
    observations: rowData.observations || ''
  };
}

function populateMunicipalitySelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // Limpa opções antigas
  select.innerHTML = '<option value="">Selecione um município</option>';

  // Ordena municípios por nome
  const sortedMuns = [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name));

  // Preenche com dados reais
  sortedMuns.forEach(mun => {
    const option = document.createElement('option');
    option.value = mun.name;
    option.textContent = `${mun.name} - ${mun.uf || ''}`.trim();
    select.appendChild(option);
  });
}

function updateSortedList() {
  sortedList = municipalitiesList
    ? [...municipalitiesList].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  console.log('sortedList atualizada:', sortedList);
}
function populateAllMunicipalitySelects() {
  const selectIds = [
    'visit-municipality',
    'production-municipality',
    'training-municipality',
    'demand-municipality'
    // adicione outros se tiver
  ];

  selectIds.forEach(id => {
    populateMunicipalitySelect(id);
  });

  console.log('Todos os selects de município foram atualizados!');
}

// =====================================================
// MIGRAÇÃO v4.3 — VERSÃO FINAL SEM ERROS DE REFERÊNCIA
// =====================================================
function forcarInicializacaoV43() {
  console.log('Iniciando migração v4.3...');

  // Define a constante LOCALMENTE na função (evita erro de "not defined")
  const DADOS_PADRAO_LOCAL = {
    users: [
      {
        id: 1,
        login: 'ADMIN',
        name: 'Administrador',
        salt: 'f3a9c8e2d1b7m5n9p4q8r6t2v1x5y7z0',
        passwordHash: 'c98f6b380e7fd8d5899fb3e46a84e3de7f47dff5ff2ebbf7ef0f0a3306d9eebd', // hash correto de "saude2025"
        permission: 'Administrador',
        status: 'Ativo',
        mustChangePassword: true
      }
    ],
    // Adicione aqui os outros arrays se precisar (mas para login só users basta)
    municipalitiesList: [], // placeholders vazios
    cargos: [],
    orientadores: [],
    modulos: [],
    formasApresentacao: [],
    requests: [],
    presentations: [],
    demands: [],
    visits: [],
    productions: [],
    tasks: [],
    municipalities: []
  };

  const dadosAtuais = localStorage.getItem('users');
  if (!dadosAtuais || dadosAtuais === '[]' || !JSON.parse(dadosAtuais)[0]?.passwordHash) {
    console.log('Dados vazios/antigos detectados. Salvando v4.3...');
    
    localStorage.setItem('users', JSON.stringify(DADOS_PADRAO_LOCAL.users));
    localStorage.setItem('municipalitiesList', JSON.stringify(DADOS_PADRAO_LOCAL.municipalitiesList));
    // ... repita para os outros arrays se quiser inicializar tudo
    console.log('v4.3 salva com sucesso!');
    
    alert('SIGP Saúde v4.3 ativado!\n\nLogin: ADMIN\nSenha: saude2025\n\nTroque a senha no primeiro acesso.');
  }

  // Carrega as variáveis globais
  users = JSON.parse(localStorage.getItem('users') || '[]');
  console.log('Users carregados:', users);
}

// =====================================================
// INICIALIZAÇÃO FINAL (SIMPLIFICADA E SEM ERROS)
// =====================================================
// =====================================================
// VERIFICA AUTENTICAÇÃO AO CARREGAR A PÁGINA
// =====================================================
function checkAuthentication() {
  currentUser = recuperarDoArmazenamento('currentUser');
  if (currentUser && isAuthenticated !== false) {
    isAuthenticated = true;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    document.getElementById('logged-user-name').textContent = currentUser.name || currentUser.login;
    initializeApp();
    navigateTo('dashboard');
  } else {
    isAuthenticated = false;
    currentUser = null;
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-app').classList.remove('active');
  }
}

// =====================================================

// LOGIN SEGURO v4.3 — VERSÃO FINAL CORRIGIDA E LIMPA

// =====================================================

function handleLogin(event) {
  event.preventDefault();

  // === DEBUG TEMPORÁRIO (pode apagar depois) ===

  console.log('DEBUG: Iniciando login...');
  console.log('Username:', document.getElementById('login-username').value);
  console.log('Users carregados:', users);

  // === FIM DEBUG ===

  const username = document.getElementById('login-username').value.trim().toUpperCase();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  if (!username || !password) {
    errorDiv.textContent = 'Preencha usuário e senha';
    return;
  }

  // Recarrega usuários do localStorage (segurança extra)

  users = recuperarDoArmazenamento('users') || [];
  const user = users.find(u => u.login.toUpperCase() === username && u.status === 'Ativo');
  if (!user) {
    errorDiv.textContent = 'Usuário não encontrado ou inativo';
    document.getElementById('login-password').value = '';
    return;
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    errorDiv.textContent = 'Senha incorreta';
    document.getElementById('login-password').value = '';
    return;
  }

  // LOGIN BEM-SUCEDIDO

  errorDiv.textContent = '';
  currentUser = { id: user.id, name: user.name, login: user.login, permission: user.permission || 'Usuário' };
  isAuthenticated = true;
  salvarNoArmazenamento('currentUser', currentUser);
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('main-app').classList.add('active');
  if (user.mustChangePassword) {
    setTimeout(() => {
      alert('Primeiro acesso detectado!\n\nPor segurança, altere sua senha agora.');
      showChangePasswordModal(true);
    }, 500);
  }

  initializeApp();
  navigateTo('dashboard');
  showToast('Login realizado com sucesso!', 'success');
}

// =====================================================
// MODAL DE TROCA DE SENHA OBRIGATÓRIA
// =====================================================
// =====================================================
// MODAL DE TROCA DE SENHA OBRIGATÓRIA (VERSÃO 100% FUNCIONAL)
// =====================================================
function showChangePasswordModal(force = false) {
  const modal = document.getElementById('change-password-modal');
  const form = document.getElementById('change-password-form');

  if (!modal || !form) {
    console.error('Modal ou formulário de troca de senha não encontrado!');
    return;
  }

  modal.style.display = 'block';

  // Impede fechar se for primeiro acesso
  modal.querySelector('.close').onclick = () => !force || null;
  window.onclick = (e) => { if (e.target === modal && !force) modal.style.display = 'none'; };

  // Submissão do formulário
  form.onsubmit = (e) => {
    e.preventDefault();

    const novaSenha = document.getElementById('new-password').value;
    const confirma = document.getElementById('confirm-password').value;

    if (novaSenha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirma) {
      alert('As senhas não coincidem.');
      return;
    }

    // Atualiza no array de users
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].passwordHash = hashPassword(novaSenha, users[userIndex].salt);
      users[userIndex].mustChangePassword = false;
      salvarNoArmazenamento('users', users);
    }

    // Atualiza currentUser e remove flag
    currentUser.mustChangePassword = false;
    salvarNoArmazenamento('currentUser', currentUser);

    // FORÇA O ESTADO DE AUTENTICADO NOVAMENTE
    isAuthenticated = true;
    salvarNoArmazenamento('isAuthenticated', true);  // ← linha essencial!

    alert('Senha alterada com sucesso! Bem-vindo ao SIGP Saúde v4.3');

    modal.style.display = 'none';
    form.reset();

    // NÃO chama initializeApp() aqui (ele pode limpar coisas)
    // Só esconde o login e mostra o app
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    document.getElementById('logged-user-name').textContent = currentUser.name || currentUser.login;

    // Só agora inicializa o resto
    initializeApp();
    navigateTo('dashboard');
    showToast('Login realizado com sucesso!', 'success');
  };
}

// ← DEPOIS DISSO, o DOMContentLoaded pode chamar a função tranquilamente
document.addEventListener('DOMContentLoaded', function () {
  forcarInicializacaoV43();
  initializeTheme();
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('main-app').classList.remove('active');
  checkAuthentication();   // ← agora funciona!
});
