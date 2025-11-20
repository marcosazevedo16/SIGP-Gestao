// =====================================================
// SIGP SAÚDE v4.3 - VERSÃO INTEGRADA & FUNCIONAL
// Gestão de Setor - Local First
// =====================================================

// 1. VERIFICAÇÃO DE DEPENDÊNCIAS
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada. Verifique sua conexão ou o HTML.');
    throw new Error('CryptoJS missing');
}

// =====================================================
// 2. CONFIGURAÇÕES E UTILITÁRIOS DE ARMAZENAMENTO
// =====================================================
const SALT_LENGTH = 16;

function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

function hashPassword(password, salt) {
    return CryptoJS.SHA256(salt + password).toString();
}

// Armazenamento Local com Tratamento de Erro
function salvarNoArmazenamento(chave, dados) {
    try {
        const dadosJSON = JSON.stringify(dados);
        localStorage.setItem(chave, dadosJSON);
        // console.log(`✓ Salvo: ${chave}`); // Descomente para debug
    } catch (erro) {
        console.error(`Erro ao salvar ${chave}:`, erro);
        if (erro.name === 'QuotaExceededError') {
            alert('⚠️ Espaço de armazenamento cheio! Faça um backup urgente.');
        }
    }
}

function recuperarDoArmazenamento(chave, valorPadrao = null) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : valorPadrao;
    } catch (erro) {
        console.error(`Erro ao recuperar ${chave}:`, erro);
        return valorPadrao;
    }
}

function deletarDoArmazenamento(chave) {
    localStorage.removeItem(chave);
}

// =====================================================
// 3. DADOS PADRÃO (BOOTSTRAP)
// =====================================================
const DADOS_PADRAO = {
    users: [{ 
        id: 1, login: 'ADMIN', name: 'Administrador', 
        salt: null, passwordHash: null, 
        permission: 'Administrador', status: 'Ativo', mustChangePassword: true 
    }],
    // Estruturas iniciais vazias para evitar erros de 'undefined'
    municipalities: [], tasks: [], versions: [], productions: [], visits: [], demands: [], requests: [],
    modulos: [
        { name: 'Cadastros', color: '#FF6B6B' }, { name: 'TFD', color: '#4ECDC4' },
        { name: 'Prontuário', color: '#45B7D1' }, { name: 'Faturamento', color: '#FFA07A' }
    ]
};

// =====================================================
// 4. INICIALIZAÇÃO DE VARIÁVEIS GLOBAIS (STATE)
// =====================================================

// Usuários e Auth
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);
// Correção automática para primeiro acesso (Gera senha padrão: saude2025)
if (users[0].login === 'ADMIN' && !users[0].passwordHash) {
    users[0].salt = generateSalt();
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;

// Dados de Negócio (Carrega do localStorage ou inicia vazio)
let municipalities = recuperarDoArmazenamento('municipalities', []);
let municipalityIdCounter = recuperarDoArmazenamento('municipalityIdCounter', 1);

let tasks = recuperarDoArmazenamento('tasks', []);
let taskIdCounter = recuperarDoArmazenamento('taskIdCounter', 1);

let systemVersions = recuperarDoArmazenamento('systemVersions', []);
let versionIdCounter = recuperarDoArmazenamento('versionIdCounter', 1);

let productions = recuperarDoArmazenamento('productions', []);
let productionIdCounter = recuperarDoArmazenamento('productionIdCounter', 1);

// Variáveis de Controle de Interface
let currentTheme = recuperarDoArmazenamento('theme', 'light');
let editingId = null; // ID genérico para edições

// =====================================================
// 5. FUNÇÕES DE INTERFACE E UTILITÁRIOS
// =====================================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
    toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: ${colors[type] || colors.info}; color: white; padding: 12px 24px; border-radius: 6px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: fadeIn 0.3s;`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300) }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Tema
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const btn = document.getElementById('theme-toggle');
    if(btn) btn.innerHTML = currentTheme === 'light' ? '🌙 Tema' : '☀️ Tema';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    salvarNoArmazenamento('theme', currentTheme);
    initializeTheme();
}

// Tabs / Navegação
function initializeTabs() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active de tudo
            document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Ativa o clicado
            btn.classList.add('active');
            const tabId = btn.dataset.tab + '-section';
            const section = document.getElementById(tabId);
            if(section) {
                section.classList.add('active');
                // Recarrega dados específicos da aba ao abrir
                if(btn.dataset.tab === 'municipios') renderMunicipalities();
                if(btn.dataset.tab === 'tarefas') renderTasks();
                if(btn.dataset.tab === 'versoes') renderVersions();
                if(btn.dataset.tab === 'producao') renderProductions();
                if(btn.dataset.tab === 'dashboard') updateDashboardStats();
            }
        });
    });
}

// =====================================================
// 6. AUTENTICAÇÃO
// =====================================================
function handleLogin(event) {
    event.preventDefault();
    const userField = document.getElementById('login-username');
    const passField = document.getElementById('login-password');
    
    const login = userField.value.trim().toUpperCase();
    const user = users.find(u => u.login === login && u.status === 'Ativo');

    if (user && hashPassword(passField.value, user.salt) === user.passwordHash) {
        currentUser = user;
        isAuthenticated = true;
        salvarNoArmazenamento('currentUser', currentUser);
        
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        
        if(user.mustChangePassword) {
            showChangePasswordModal();
        } else {
            initializeApp();
            showToast(`Bem-vindo, ${user.name}!`, 'success');
        }
    } else {
        document.getElementById('login-error').textContent = 'Credenciais inválidas.';
        showToast('Erro de login', 'error');
    }
}

function handleLogout() {
    if (confirm('Sair do sistema?')) {
        isAuthenticated = false;
        currentUser = null;
        deletarDoArmazenamento('currentUser');
        window.location.reload();
    }
}

function checkAuthentication() {
    if (isAuthenticated && currentUser) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        initializeApp();
    } else {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-app').classList.remove('active');
    }
}

// Troca de Senha (Modal Simplificado)
function showChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('show');
}
function closeChangePasswordModal() {
    document.getElementById('change-password-modal').classList.remove('show');
}
function handleChangePassword(e) {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    
    if(newPass !== confirmPass || newPass.length < 4) {
        alert('Senhas não conferem ou muito curtas.');
        return;
    }

    // Atualiza usuário
    const idx = users.findIndex(u => u.id === currentUser.id);
    if(idx > -1) {
        users[idx].salt = generateSalt();
        users[idx].passwordHash = hashPassword(newPass, users[idx].salt);
        users[idx].mustChangePassword = false;
        salvarNoArmazenamento('users', users);
        
        currentUser = users[idx];
        salvarNoArmazenamento('currentUser', currentUser);
        
        closeChangePasswordModal();
        showToast('Senha alterada!', 'success');
        initializeApp();
    }
}

// =====================================================
// 7. MÓDULO: MUNICÍPIOS (CRUD)
// =====================================================
function showMunicipalityModal(id = null) {
    const modal = document.getElementById('municipality-modal');
    const form = document.getElementById('municipality-form');
    const title = document.getElementById('municipality-modal-title');
    
    form.reset();
    editingId = id;
    
    // Popula select de nomes (Placeholder, idealmente viria de uma lista mestra)
    const select = document.getElementById('municipality-name');
    // Se estiver vazio, adiciona opções básicas ou mantém o input livre se for text
    
    if(id) {
        title.textContent = 'Editar Município';
        const item = municipalities.find(m => m.id === id);
        if(item) {
            // Adiciona a opção se não existir no select
            if(select.tagName === 'SELECT') {
                 select.innerHTML = `<option value="${item.name}" selected>${item.name}</option>`;
            } else {
                select.value = item.name;
            }
            document.getElementById('municipality-status').value = item.status;
            document.getElementById('municipality-manager').value = item.manager;
            document.getElementById('municipality-contact').value = item.contact;
            document.getElementById('municipality-implantation-date').value = item.implantationDate;
            document.getElementById('municipality-last-visit').value = item.lastVisit;
            
            // Checkboxes de módulos
            if(item.modules) {
                document.querySelectorAll('.module-checkbox').forEach(cb => {
                    cb.checked = item.modules.includes(cb.value);
                });
            }
        }
    } else {
        title.textContent = 'Novo Município';
        // Adiciona lista padrão se for novo
        if(select.tagName === 'SELECT') {
            select.innerHTML = `<option value="">Selecione...</option>
            <option value="Belo Horizonte">Belo Horizonte</option>
            <option value="São Paulo">São Paulo</option>
            <option value="Outro">Outro (Cadastrar)</option>`;
        }
    }
    modal.classList.add('show');
}

function closeMunicipalityModal() {
    document.getElementById('municipality-modal').classList.remove('show');
    editingId = null;
}

function saveMunicipality(e) {
    e.preventDefault();
    
    // Coleta Módulos
    const selectedModules = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
    
    const data = {
        name: document.getElementById('municipality-name').value,
        status: document.getElementById('municipality-status').value,
        manager: document.getElementById('municipality-manager').value,
        contact: document.getElementById('municipality-contact').value,
        implantationDate: document.getElementById('municipality-implantation-date').value,
        lastVisit: document.getElementById('municipality-last-visit').value,
        modules: selectedModules
    };

    if(editingId) {
        const idx = municipalities.findIndex(m => m.id === editingId);
        municipalities[idx] = { ...municipalities[idx], ...data };
    } else {
        municipalities.push({ id: municipalityIdCounter++, ...data });
        salvarNoArmazenamento('municipalityIdCounter', municipalityIdCounter);
    }

    salvarNoArmazenamento('municipalities', municipalities);
    closeMunicipalityModal();
    renderMunicipalities();
    updateAllSelects(); // Atualiza dropdowns em outras telas
    showToast('Município salvo!', 'success');
}

function deleteMunicipality(id) {
    if(confirm('Excluir este município?')) {
        municipalities = municipalities.filter(m => m.id !== id);
        salvarNoArmazenamento('municipalities', municipalities);
        renderMunicipalities();
        updateAllSelects();
        showToast('Município excluído.', 'info');
    }
}

function renderMunicipalities() {
    const container = document.getElementById('municipalities-table');
    if(!container) return;

    if(municipalities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum município cadastrado.</p></div>';
        return;
    }

    // Ordenar alfabeticamente
    const sorted = [...municipalities].sort((a,b) => a.name.localeCompare(b.name));

    const rows = sorted.map(m => `
        <tr>
            <td><strong>${m.name}</strong></td>
            <td>${m.manager}</td>
            <td>${m.contact}</td>
            <td>${formatDate(m.lastVisit)}</td>
            <td><span class="status-badge ${m.status === 'Em uso' ? 'active' : 'blocked'}">${m.status}</span></td>
            <td>
                <div class="task-actions">
                    <button class="btn btn--outline btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                    <button class="btn btn--outline btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `<table><thead><tr><th>Município</th><th>Gestor</th><th>Contato</th><th>Última Visita</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
    
    // Atualiza contador
    const counter = document.getElementById('municipalities-results-count');
    if(counter) {
        counter.style.display = 'block';
        counter.innerHTML = `<strong>${sorted.length}</strong> municípios encontrados.`;
    }
}

// =====================================================
// 8. MÓDULO: TREINAMENTOS (TASKS)
// =====================================================
function showTaskModal(id = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('task-modal-title');
    
    form.reset();
    editingId = id;
    
    // Garante que o select de municípios está atualizado
    updateAllSelects();

    if(id) {
        title.textContent = 'Editar Treinamento';
        const task = tasks.find(t => t.id === id);
        if(task) {
            document.getElementById('task-date-requested').value = task.dateRequested;
            document.getElementById('task-date-performed').value = task.datePerformed;
            document.getElementById('task-municipality').value = task.municipality;
            document.getElementById('task-requested-by').value = task.requestedBy;
            document.getElementById('task-performed-by').value = task.performedBy;
            document.getElementById('task-trained-name').value = task.trainedName;
            document.getElementById('task-trained-position').value = task.trainedPosition;
            document.getElementById('task-status').value = task.status;
            document.getElementById('task-observations').value = task.observations;
        }
    } else {
        title.textContent = 'Novo Treinamento';
    }
    modal.classList.add('show');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('show');
    editingId = null;
}

function saveTask(e) {
    e.preventDefault();
    
    const data = {
        dateRequested: document.getElementById('task-date-requested').value,
        datePerformed: document.getElementById('task-date-performed').value,
        municipality: document.getElementById('task-municipality').value,
        requestedBy: document.getElementById('task-requested-by').value,
        performedBy: document.getElementById('task-performed-by').value,
        trainedName: document.getElementById('task-trained-name').value,
        trainedPosition: document.getElementById('task-trained-position').value,
        status: document.getElementById('task-status').value,
        observations: document.getElementById('task-observations').value,
    };

    if(editingId) {
        const idx = tasks.findIndex(t => t.id === editingId);
        tasks[idx] = { ...tasks[idx], ...data };
    } else {
        tasks.push({ id: taskIdCounter++, ...data });
        salvarNoArmazenamento('taskIdCounter', taskIdCounter);
    }

    salvarNoArmazenamento('tasks', tasks);
    closeTaskModal();
    renderTasks();
    showToast('Treinamento salvo!', 'success');
}

function deleteTask(id) {
    if(confirm('Excluir este treinamento?')) {
        tasks = tasks.filter(t => t.id !== id);
        salvarNoArmazenamento('tasks', tasks);
        renderTasks();
        showToast('Excluído.', 'info');
    }
}

function renderTasks() {
    const container = document.getElementById('tasks-table');
    if(!container) return;

    if(tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum treinamento registrado.</p></div>';
        return;
    }

    // Ordenar por data de solicitação (mais recente primeiro)
    const sorted = [...tasks].sort((a,b) => new Date(b.dateRequested) - new Date(a.dateRequested));

    const rows = sorted.map(t => `
        <tr>
            <td>${formatDate(t.dateRequested)}</td>
            <td>${formatDate(t.datePerformed)}</td>
            <td><strong>${t.municipality}</strong></td>
            <td>${t.requestedBy}</td>
            <td>${t.performedBy}</td>
            <td>${t.trainedName} (${t.trainedPosition})</td>
            <td><span class="task-status ${t.status === 'Concluído' ? 'completed' : 'pending'}">${t.status}</span></td>
            <td>
                <div class="task-actions-compact">
                    <button class="task-action-btn edit" onclick="showTaskModal(${t.id})">✏️</button>
                    <button class="task-action-btn delete" onclick="deleteTask(${t.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `<table><thead><tr><th>Solicitado</th><th>Realizado</th><th>Município</th><th>Solicitante</th><th>Instrutor</th><th>Treinado</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// =====================================================
// 9. MÓDULO: VERSÕES (CHANGELOG)
// =====================================================
function showVersionModal(id = null) {
    const modal = document.getElementById('version-modal');
    const form = document.getElementById('version-form');
    
    if(!modal) { console.warn('Modal de versões não encontrado no HTML'); return; }
    
    form.reset();
    editingId = id;
    
    if(id) {
        const v = systemVersions.find(i => i.id === id);
        if(v) {
            document.getElementById('version-number').value = v.number;
            document.getElementById('version-date').value = v.date;
            document.getElementById('version-type').value = v.type;
            document.getElementById('version-module').value = v.module;
            document.getElementById('version-description').value = v.description;
        }
    } else {
        document.getElementById('version-date').valueAsDate = new Date();
    }
    modal.classList.add('show');
}

function closeVersionModal() {
    document.getElementById('version-modal').classList.remove('show');
    editingId = null;
}

function saveVersion(e) {
    e.preventDefault();
    const data = {
        number: document.getElementById('version-number').value,
        date: document.getElementById('version-date').value,
        type: document.getElementById('version-type').value,
        module: document.getElementById('version-module').value,
        description: document.getElementById('version-description').value,
        author: currentUser ? currentUser.name : 'Sistema'
    };

    if(editingId) {
        const idx = systemVersions.findIndex(v => v.id === editingId);
        systemVersions[idx] = { ...systemVersions[idx], ...data };
    } else {
        systemVersions.push({ id: versionIdCounter++, ...data });
        salvarNoArmazenamento('versionIdCounter', versionIdCounter);
    }

    salvarNoArmazenamento('systemVersions', systemVersions);
    closeVersionModal();
    renderVersions();
    showToast('Versão registrada!', 'success');
}

function deleteVersion(id) {
    if(confirm('Excluir registro de versão?')) {
        systemVersions = systemVersions.filter(v => v.id !== id);
        salvarNoArmazenamento('systemVersions', systemVersions);
        renderVersions();
        showToast('Registro excluído.', 'info');
    }
}

function renderVersions() {
    const container = document.getElementById('versions-table');
    if(!container) return;

    if(systemVersions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma alteração registrada.</p></div>';
        return;
    }

    const sorted = [...systemVersions].sort((a,b) => new Date(b.date) - new Date(a.date));

    const rows = sorted.map(v => `
        <tr>
            <td>${formatDate(v.date)}</td>
            <td>${v.number || '-'}</td>
            <td><span class="status-badge">${v.type}</span></td>
            <td>${v.module}</td>
            <td style="white-space: pre-wrap;">${v.description}</td>
            <td>${v.author}</td>
            <td>
                <button class="btn btn--sm" onclick="showVersionModal(${v.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteVersion(${v.id})">🗑️</button>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `<table><thead><tr><th>Data</th><th>Versão</th><th>Tipo</th><th>Módulo</th><th>Descrição</th><th>Autor</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// =====================================================
// 10. MÓDULO: PRODUÇÃO
// =====================================================
function showProductionModal(id = null) {
    const modal = document.getElementById('production-modal');
    const form = document.getElementById('production-form');
    
    form.reset();
    updateAllSelects();
    editingId = id;

    if(id) {
        const prod = productions.find(p => p.id === id);
        if(prod) {
            document.getElementById('production-municipality').value = prod.municipality;
            document.getElementById('production-contact').value = prod.contact;
            document.getElementById('production-status').value = prod.status;
            // ... preencher outros campos conforme necessidade
        }
    }
    modal.classList.add('show');
}

function closeProductionModal() {
    document.getElementById('production-modal').classList.remove('show');
    editingId = null;
}

function saveProduction(e) {
    e.preventDefault();
    const data = {
        municipality: document.getElementById('production-municipality').value,
        contact: document.getElementById('production-contact').value,
        status: document.getElementById('production-status').value,
        // ... pegar outros campos
    };

    if(editingId) {
        const idx = productions.findIndex(p => p.id === editingId);
        productions[idx] = { ...productions[idx], ...data };
    } else {
        productions.push({ id: productionIdCounter++, ...data });
        salvarNoArmazenamento('productionIdCounter', productionIdCounter);
    }
    
    salvarNoArmazenamento('productions', productions);
    closeProductionModal();
    renderProductions();
    showToast('Produção salva.', 'success');
}

function deleteProduction(id) {
    if(confirm('Excluir envio de produção?')) {
        productions = productions.filter(p => p.id !== id);
        salvarNoArmazenamento('productions', productions);
        renderProductions();
    }
}

function renderProductions() {
    const container = document.getElementById('productions-table');
    if(!container) return;
    
    if(productions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum registro de produção.</p></div>';
        return;
    }

    const rows = productions.map(p => `
        <tr>
            <td>${p.municipality}</td>
            <td>${p.contact}</td>
            <td>${p.status}</td>
            <td>
                 <button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button>
                 <button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = `<table><thead><tr><th>Município</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// =====================================================
// 11. FUNÇÕES HELPER DE DROPDOWNS
// =====================================================
function updateAllSelects() {
    // Atualiza todos os dropdowns de município em todas as telas
    const selects = [
        'task-municipality', 
        'visit-municipality', 
        'production-municipality', 
        'request-municipality', 
        'presentation-municipality'
    ];

    // Ordena municípios
    const options = municipalities
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(m => `<option value="${m.name}">${m.name}</option>`)
        .join('');

    selects.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            const currentVal = el.value;
            el.innerHTML = `<option value="">Selecione o município...</option>` + options;
            if(currentVal) el.value = currentVal; // Tenta manter o valor se existir
        }
    });
}

// =====================================================
// 12. DASHBOARD
// =====================================================
function updateDashboardStats() {
    const activeMuns = municipalities.filter(m => m.status === 'Em uso').length;
    const completedTasks = tasks.filter(t => t.status === 'Concluído').length;
    
    const elMuns = document.getElementById('dashboard-municipalities-in-use');
    const elTasks = document.getElementById('dashboard-trainings-completed');
    
    if(elMuns) elMuns.textContent = activeMuns;
    if(elTasks) elTasks.textContent = completedTasks;
}

// =====================================================
// 13. INICIALIZAÇÃO DO SISTEMA
// =====================================================
function initializeApp() {
    console.log('🚀 Inicializando SIGP Saúde v4.3...');
    updateUserInterface();
    initializeTabs();
    initializeTheme();
    
    // Carregar dados nas tabelas
    renderMunicipalities();
    renderTasks();
    renderVersions();
    renderProductions();
    updateDashboardStats();
    
    // Popula dropdowns pela primeira vez
    updateAllSelects();
}

function updateUserInterface() {
    if(currentUser) {
        const el = document.getElementById('logged-user-name');
        if(el) el.textContent = currentUser.name;
    }
}

// =====================================================
// 14. EVENT LISTENER PRINCIPAL
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    
    // Fecha modais ao clicar fora
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    }
});
