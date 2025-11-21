// =====================================================
// SIGP SAÚDE v6.0 - VERSÃO ROBUSTA (SEM OTIMIZAÇÃO EXCESSIVA)
// Gestão de Setor - Local First
// =====================================================

// 1. VERIFICAÇÃO DE SEGURANÇA
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada. Verifique sua conexão ou o HTML.');
}

// =====================================================
// 2. CONFIGURAÇÕES GERAIS
// =====================================================
const SALT_LENGTH = 16;

// Funções de Criptografia
function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

function hashPassword(password, salt) {
    return CryptoJS.SHA256(salt + password).toString();
}

// Funções de Armazenamento (LocalStorage)
function salvarNoArmazenamento(chave, dados) {
    try {
        const dadosJSON = JSON.stringify(dados);
        localStorage.setItem(chave, dadosJSON);
    } catch (erro) {
        console.error(`Erro ao salvar ${chave}:`, erro);
        if (erro.name === 'QuotaExceededError') {
            alert('⚠️ Espaço de armazenamento cheio! Faça backup urgente.');
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
        console.error(`Erro ao recuperar ${chave}:`, erro);
        return valorPadrao;
    }
}

function deletarDoArmazenamento(chave) {
    localStorage.removeItem(chave);
}

// Funções de Formatação
function formatDate(dateString) {
    if (!dateString) return '-';
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    // Remove classes antigas e força reflow
    toast.className = 'toast';
    void toast.offsetWidth;
    
    // Adiciona classes novas
    toast.classList.add(type);
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// =====================================================
// 3. MÁSCARAS E REGRAS DE INPUT (CRÍTICO)
// =====================================================

// Máscara de Telefone (XX) 9XXXX-XXXX
function formatPhoneNumber(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 11); // Limita tamanho
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
}

// Máscara Competência (MM/AAAA)
function formatCompetencia(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 6); // Limita 6 digitos
    if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    }
    return v;
}

// Máscara Período (DD/MM à DD/MM)
function formatPeriodo(value) {
    // Remove tudo que não for dígito
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 8); // Limita a 8 números (01 10 31 10)
    
    // Formatação progressiva
    if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d)/, "$1/$2"); // 01/1...
    }
    if (v.length > 4) {
        v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2 à $3"); // 01/10 à 3...
    }
    if (v.length > 6) {
        v = v.replace(/ à (\d{2})(\d)/, " à $1/$2"); // 01/10 à 31/1...
    }
    return v;
}

// Aplica listeners de máscara em todos os inputs relevantes
function applyMasks() {
    // Telefones
    const phoneInputs = [
        'municipality-contact', 
        'task-contact', 
        'orientador-contact', 
        'request-contact', 
        'production-contact'
    ];
    
    phoneInputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', function(e) {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });

    // Produção - Competência
    const elComp = document.getElementById('production-competence');
    if(elComp) {
        elComp.addEventListener('input', function(e) {
            e.target.value = formatCompetencia(e.target.value);
        });
    }

    // Produção - Período
    const elPeriod = document.getElementById('production-period');
    if(elPeriod) {
        elPeriod.addEventListener('input', function(e) {
            e.target.value = formatPeriodo(e.target.value);
        });
        elPeriod.placeholder = "DD/MM à DD/MM";
    }
}

// =====================================================
// 4. INICIALIZAÇÃO DE DADOS (STATE)
// =====================================================
const DADOS_PADRAO = {
    users: [{
        id: 1,
        login: 'ADMIN',
        name: 'Administrador',
        salt: null,
        passwordHash: null,
        permission: 'Administrador',
        status: 'Ativo',
        mustChangePassword: true
    }],
    modulos: [
        { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#FF6B6B' },
        { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#4ECDC4' },
        { id: 3, name: 'Prontuário', abbreviation: 'PEC', color: '#45B7D1' },
        { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#FFA07A' }
    ]
};

// Carregamento dos dados do LocalStorage
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);

// Autocorreção senha admin (primeiro uso)
if (users[0].login === 'ADMIN' && !users[0].passwordHash) {
    users[0].salt = generateSalt();
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');

// Dados de Negócio
let municipalities = recuperarDoArmazenamento('municipalities', []);
let municipalitiesList = recuperarDoArmazenamento('municipalitiesList', []); // Lista Mestra
let tasks = recuperarDoArmazenamento('tasks', []);
let requests = recuperarDoArmazenamento('requests', []);
let demands = recuperarDoArmazenamento('demands', []);
let visits = recuperarDoArmazenamento('visits', []);
let productions = recuperarDoArmazenamento('productions', []);
let presentations = recuperarDoArmazenamento('presentations', []);
let systemVersions = recuperarDoArmazenamento('systemVersions', []);
let cargos = recuperarDoArmazenamento('cargos', []);
let orientadores = recuperarDoArmazenamento('orientadores', []);
let modulos = recuperarDoArmazenamento('modulos', DADOS_PADRAO.modulos);
let formasApresentacao = recuperarDoArmazenamento('formasApresentacao', []);

// Contadores de ID (Para garantir unicidade)
let counters = recuperarDoArmazenamento('counters', {
    mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1
});

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

let editingId = null; // ID sendo editado no momento

// =====================================================
// 5. AUTENTICAÇÃO E NAVEGAÇÃO
// =====================================================

function checkAuthentication() {
    if (isAuthenticated && currentUser) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        updateUserInterface();
    } else {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-app').classList.remove('active');
    }
}

function handleLogin(event) {
    event.preventDefault();
    const loginInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    
    const login = loginInput.value.trim().toUpperCase();
    const password = passInput.value;
    
    const user = users.find(u => u.login === login && u.status === 'Ativo');

    if (user) {
        const hash = hashPassword(password, user.salt);
        if (hash === user.passwordHash) {
            currentUser = user;
            isAuthenticated = true;
            salvarNoArmazenamento('currentUser', currentUser);
            
            // Limpa campos
            loginInput.value = '';
            passInput.value = '';
            
            checkAuthentication();
            initializeApp(); // Carrega o sistema
            
            if (user.mustChangePassword) {
                showChangePasswordModal();
            } else {
                showToast(`Bem-vindo(a), ${user.name}!`, 'success');
            }
            return;
        }
    }
    
    document.getElementById('login-error').textContent = 'Usuário ou senha incorretos.';
}

function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        isAuthenticated = false;
        currentUser = null;
        deletarDoArmazenamento('currentUser');
        
        // Recarrega a página para limpar memória
        window.location.reload();
    }
}

function updateUserInterface() {
    if (!currentUser) return;
    
    // Atualiza nome no header
    const elName = document.getElementById('logged-user-name');
    if(elName) elName.textContent = currentUser.name;

    // Lógica de Permissão (Admin vs Usuário)
    const isAdmin = currentUser.permission === 'Administrador';
    
    // Lista de botões que dependem de permissão
    const menuItems = [
        { id: 'user-management-menu-btn', adminOnly: true },
        { id: 'backup-menu-btn', adminOnly: false },
        { id: 'cargo-management-menu-btn', adminOnly: false },
        { id: 'orientador-management-menu-btn', adminOnly: false },
        { id: 'modulo-management-menu-btn', adminOnly: false },
        { id: 'municipality-list-management-menu-btn', adminOnly: false },
        { id: 'forma-apresentacao-management-menu-btn', adminOnly: false }
    ];

    menuItems.forEach(item => {
        const el = document.getElementById(item.id);
        if(el) {
            if (item.adminOnly && !isAdmin) {
                el.style.display = 'none';
            } else {
                el.style.display = 'flex'; // Botões de menu são flex
            }
        }
    });
    
    const divider = document.getElementById('admin-divider');
    if(divider) divider.style.display = isAdmin ? 'block' : 'none';
}

// =====================================================
// 6. NAVEGAÇÃO ENTRE TELAS (TABS)
// =====================================================

function initializeTabs() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove classe active de todos
            buttons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Ativa o clicado
            this.classList.add('active');
            const section = document.getElementById(tabId + '-section');
            if(section) {
                section.classList.add('active');
                
                // Carrega dados da aba específica
                if(tabId === 'municipios') renderMunicipalities();
                if(tabId === 'tarefas') renderTasks();
                if(tabId === 'solicitacoes') renderRequests();
                if(tabId === 'demandas') renderDemands();
                if(tabId === 'visitas') renderVisits();
                if(tabId === 'producao') renderProductions();
                if(tabId === 'apresentacoes') renderPresentations();
                if(tabId === 'versoes') renderVersions();
                if(tabId === 'dashboard') updateDashboardStats();
            }
        });
    });
}

function navigateToHome() {
    // Simula clique no botão Dashboard
    const dashBtn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if(dashBtn) dashBtn.click();
}

function toggleSettingsMenu() {
    document.getElementById('settings-menu').classList.toggle('show');
}

// Funções de atalho do menu de configurações
function navigateToUserManagement() { 
    toggleSettingsMenu(); 
    abrirAbaManual('usuarios-section'); 
    renderUsers(); 
}
function navigateToCargoManagement() { toggleSettingsMenu(); abrirAbaManual('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettingsMenu(); abrirAbaManual('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettingsMenu(); abrirAbaManual('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettingsMenu(); abrirAbaManual('municipalities-list-section'); renderMunicipalityList(); }
function navigateToFormaApresentacaoManagement() { toggleSettingsMenu(); abrirAbaManual('formas-apresentacao-section'); renderFormas(); }
function navigateToBackupManagement() { toggleSettingsMenu(); abrirAbaManual('backup-section'); updateBackupInfo(); }

function abrirAbaManual(sectionId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// =====================================================
// 7. MÓDULOS DE CADASTRO (LÓGICA EXPLÍCITA)
// =====================================================

// --- MUNICÍPIOS ---
function showMunicipalityModal(id = null) {
    const modal = document.getElementById('municipality-modal');
    document.getElementById('municipality-form').reset();
    editingId = id;
    
    // Popula o select com a Lista Mestra
    populateSelect(document.getElementById('municipality-name'), municipalitiesList, 'name', 'name');

    if(id) {
        const m = municipalities.find(x => x.id === id);
        if(m) {
            document.getElementById('municipality-name').value = m.name;
            document.getElementById('municipality-status').value = m.status;
            document.getElementById('municipality-manager').value = m.manager;
            document.getElementById('municipality-contact').value = m.contact;
            document.getElementById('municipality-implantation-date').value = m.implantationDate;
            document.getElementById('municipality-last-visit').value = m.lastVisit;
            
            // Checkboxes
            if(m.modules) {
                document.querySelectorAll('.module-checkbox').forEach(cb => {
                    cb.checked = m.modules.includes(cb.value);
                });
            }
        }
    }
    modal.classList.add('show');
}

function saveMunicipality(e) {
    e.preventDefault();
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
        const idx = municipalities.findIndex(x => x.id === editingId);
        municipalities[idx] = { ...municipalities[idx], ...data };
    } else {
        municipalities.push({ id: getNextId('mun'), ...data });
    }
    
    salvarNoArmazenamento('municipalities', municipalities);
    document.getElementById('municipality-modal').classList.remove('show');
    renderMunicipalities();
    updateGlobalDropdowns();
    showToast('Município salvo com sucesso!', 'success');
}

function renderMunicipalities() {
    const container = document.getElementById('municipalities-table');
    const filterName = document.getElementById('filter-municipality-name').value;
    const filterStatus = document.getElementById('filter-municipality-status').value;

    let filtered = municipalities.filter(m => {
        if(filterName && m.name !== filterName) return false;
        if(filterStatus && m.status !== filterStatus) return false;
        return true;
    });
    
    filtered.sort((a,b) => a.name.localeCompare(b.name));

    if(filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum município encontrado.</p></div>';
    } else {
        const rows = filtered.map(m => `
            <tr>
                <td><strong>${m.name}</strong></td>
                <td>${m.modules.join(', ')}</td>
                <td>${m.manager}</td>
                <td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td>
                <td>${formatDate(m.lastVisit)}</td>
                <td><span class="status-badge ${m.status === 'Em uso' ? 'active' : 'blocked'}">${m.status}</span></td>
                <td>
                    <div class="task-actions">
                        <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                        <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        container.innerHTML = `<table><thead><tr><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Última Visita</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    
    // Atualiza contadores
    const countEl = document.getElementById('municipalities-results-count');
    if(countEl) {
        countEl.style.display = 'block';
        countEl.innerHTML = `<strong>${filtered.length}</strong> municípios encontrados.`;
    }
}

function deleteMunicipality(id) {
    if(confirm('Excluir este município?')) {
        municipalities = municipalities.filter(m => m.id !== id);
        salvarNoArmazenamento('municipalities', municipalities);
        renderMunicipalities();
        updateGlobalDropdowns();
        showToast('Município excluído.', 'info');
    }
}

// --- TREINAMENTOS ---
function showTaskModal(id = null) {
    const modal = document.getElementById('task-modal');
    document.getElementById('task-form').reset();
    editingId = id;
    updateGlobalDropdowns(); // Atualiza selects

    if(id) {
        const t = tasks.find(x => x.id === id);
        if(t) {
            document.getElementById('task-date-requested').value = t.dateRequested;
            document.getElementById('task-municipality').value = t.municipality;
            document.getElementById('task-requested-by').value = t.requestedBy;
            document.getElementById('task-performed-by').value = t.performedBy;
            document.getElementById('task-trained-name').value = t.trainedName;
            document.getElementById('task-trained-position').value = t.trainedPosition;
            document.getElementById('task-contact').value = t.contact;
            document.getElementById('task-status').value = t.status;
            document.getElementById('task-observations').value = t.observations;
        }
    }
    modal.classList.add('show');
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
        contact: document.getElementById('task-contact').value,
        status: document.getElementById('task-status').value,
        observations: document.getElementById('task-observations').value
    };

    if(editingId) {
        const idx = tasks.findIndex(t => t.id === editingId);
        tasks[idx] = { ...tasks[idx], ...data };
    } else {
        tasks.push({ id: getNextId('task'), ...data });
    }
    
    salvarNoArmazenamento('tasks', tasks);
    document.getElementById('task-modal').classList.remove('show');
    renderTasks();
    showToast('Treinamento salvo!', 'success');
}

function renderTasks() {
    const container = document.getElementById('tasks-table');
    if(tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum treinamento registrado.</p></div>';
        return;
    }
    
    // Filtros podem ser aplicados aqui se necessário
    const sorted = [...tasks].sort((a,b) => new Date(b.dateRequested) - new Date(a.dateRequested));
    
    const rows = sorted.map(t => `
        <tr>
            <td>${formatDate(t.dateRequested)}</td>
            <td>${t.municipality}</td>
            <td>${t.requestedBy}</td>
            <td>${t.performedBy}</td>
            <td>${t.trainedName}</td>
            <td>${t.contact}</td>
            <td><span class="task-status ${t.status === 'Concluído' ? 'completed' : 'pending'}">${t.status}</span></td>
            <td>
                <div class="task-actions-compact">
                    <button class="task-action-btn edit" onclick="showTaskModal(${t.id})">✏️</button>
                    <button class="task-action-btn delete" onclick="deleteTask(${t.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = `<table><thead><tr><th>Data</th><th>Município</th><th>Solicitante</th><th>Instrutor</th><th>Treinado</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteTask(id) {
    if(confirm('Excluir treinamento?')) {
        tasks = tasks.filter(t => t.id !== id);
        salvarNoArmazenamento('tasks', tasks);
        renderTasks();
    }
}

// --- PRODUÇÃO ---
function showProductionModal(id = null) {
    const modal = document.getElementById('production-modal');
    document.getElementById('production-form').reset();
    editingId = id;
    updateGlobalDropdowns();

    if(id) {
        const p = productions.find(x => x.id === id);
        if(p) {
            document.getElementById('production-municipality').value = p.municipality;
            document.getElementById('production-contact').value = p.contact;
            document.getElementById('production-frequency').value = p.frequency;
            document.getElementById('production-competence').value = p.competence;
            document.getElementById('production-period').value = p.period;
            document.getElementById('production-release-date').value = p.releaseDate;
            document.getElementById('production-send-date').value = p.sendDate;
            document.getElementById('production-status').value = p.status;
            document.getElementById('production-professional').value = p.professional;
            document.getElementById('production-observations').value = p.observations;
        }
    }
    modal.classList.add('show');
}

function saveProduction(e) {
    e.preventDefault();
    const data = {
        municipality: document.getElementById('production-municipality').value,
        contact: document.getElementById('production-contact').value,
        professional: document.getElementById('production-professional').value,
        frequency: document.getElementById('production-frequency').value,
        competence: document.getElementById('production-competence').value,
        period: document.getElementById('production-period').value,
        releaseDate: document.getElementById('production-release-date').value,
        sendDate: document.getElementById('production-send-date').value,
        status: document.getElementById('production-status').value,
        observations: document.getElementById('production-observations').value
    };

    if(editingId) {
        const idx = productions.findIndex(p => p.id === editingId);
        productions[idx] = { ...productions[idx], ...data };
    } else {
        productions.push({ id: getNextId('prod'), ...data });
    }
    
    salvarNoArmazenamento('productions', productions);
    document.getElementById('production-modal').classList.remove('show');
    renderProductions();
    showToast('Produção salva!', 'success');
}

function renderProductions() {
    const container = document.getElementById('productions-table');
    if(productions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum envio de produção.</p></div>';
        return;
    }
    
    const rows = productions.map(p => `
        <tr>
            <td>${p.municipality}</td>
            <td>${p.competence}</td>
            <td>${p.period}</td>
            <td>${p.frequency}</td>
            <td>${formatDate(p.releaseDate)}</td>
            <td>${p.status}</td>
            <td>
                <button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = `<table><thead><tr><th>Município</th><th>Competência</th><th>Período</th><th>Freq.</th><th>Liberação</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteProduction(id) {
    if(confirm('Excluir?')) {
        productions = productions.filter(p => p.id !== id);
        salvarNoArmazenamento('productions', productions);
        renderProductions();
    }
}

// --- SOLICITAÇÕES/SUGESTÕES ---
function showRequestModal(id = null) {
    const modal = document.getElementById('request-modal');
    document.getElementById('request-form').reset();
    editingId = id;
    updateGlobalDropdowns();

    if(id) {
        const r = requests.find(x => x.id === id);
        if(r) {
            document.getElementById('request-date').value = r.date;
            document.getElementById('request-municipality').value = r.municipality;
            document.getElementById('request-requester').value = r.requester;
            document.getElementById('request-contact').value = r.contact;
            document.getElementById('request-description').value = r.description;
            document.getElementById('request-status').value = r.status;
        }
    }
    modal.classList.add('show');
}

function saveRequest(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('request-date').value,
        municipality: document.getElementById('request-municipality').value,
        requester: document.getElementById('request-requester').value,
        contact: document.getElementById('request-contact').value,
        description: document.getElementById('request-description').value,
        status: document.getElementById('request-status').value,
        user: currentUser.name
    };

    if(editingId) {
        const idx = requests.findIndex(r => r.id === editingId);
        requests[idx] = { ...requests[idx], ...data };
    } else {
        requests.push({ id: getNextId('req'), ...data });
    }
    salvarNoArmazenamento('requests', requests);
    document.getElementById('request-modal').classList.remove('show');
    renderRequests();
    showToast('Solicitação salva!', 'success');
}

function renderRequests() {
    const container = document.getElementById('requests-table');
    if(requests.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma solicitação.</div>';
        return;
    }
    const rows = requests.map(r => `
        <tr>
            <td>${formatDate(r.date)}</td>
            <td>${r.municipality}</td>
            <td>${r.requester}</td>
            <td>${r.description}</td>
            <td>${r.status}</td>
            <td>
                <button class="btn btn--sm" onclick="showRequestModal(${r.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteRequest(${r.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><tr><th>Data</th><th>Município</th><th>Solicitante</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteRequest(id) {
    if(confirm('Excluir?')) {
        requests = requests.filter(r => r.id !== id);
        salvarNoArmazenamento('requests', requests);
        renderRequests();
    }
}

// --- APRESENTAÇÕES ---
function showPresentationModal(id = null) {
    const modal = document.getElementById('presentation-modal');
    document.getElementById('presentation-form').reset();
    editingId = id;
    updateGlobalDropdowns();
    
    // Checkboxes de Orientador
    const divOrient = document.getElementById('presentation-orientador-checkboxes');
    if(divOrient) {
        divOrient.innerHTML = orientadores.map(o => `<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
    }
    // Checkboxes de Formas
    const divFormas = document.getElementById('presentation-forms-checkboxes');
    if(divFormas) {
        divFormas.innerHTML = formasApresentacao.map(f => `<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');
    }

    if(id) {
        const p = presentations.find(x => x.id === id);
        if(p) {
            document.getElementById('presentation-municipality').value = p.municipality;
            document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
            document.getElementById('presentation-requester').value = p.requester;
            document.getElementById('presentation-status').value = p.status;
            document.getElementById('presentation-description').value = p.description;
            // Marcar checkboxes...
        }
    }
    modal.classList.add('show');
}

function savePresentation(e) {
    e.preventDefault();
    const orientadoresSel = Array.from(document.querySelectorAll('.orientador-check:checked')).map(c => c.value);
    const formasSel = Array.from(document.querySelectorAll('.forma-check:checked')).map(c => c.value);
    
    const data = {
        municipality: document.getElementById('presentation-municipality').value,
        dateSolicitacao: document.getElementById('presentation-date-solicitacao').value,
        requester: document.getElementById('presentation-requester').value,
        status: document.getElementById('presentation-status').value,
        description: document.getElementById('presentation-description').value,
        orientadores: orientadoresSel,
        forms: formasSel
    };

    if(editingId) {
        const idx = presentations.findIndex(p => p.id === editingId);
        presentations[idx] = { ...presentations[idx], ...data };
    } else {
        presentations.push({ id: getNextId('pres'), ...data });
    }
    salvarNoArmazenamento('presentations', presentations);
    document.getElementById('presentation-modal').classList.remove('show');
    renderPresentations();
    showToast('Apresentação salva!', 'success');
}

function renderPresentations() {
    const container = document.getElementById('presentations-table');
    if(presentations.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma apresentação.</div>';
        return;
    }
    const rows = presentations.map(p => `
        <tr>
            <td>${p.municipality}</td>
            <td>${formatDate(p.dateSolicitacao)}</td>
            <td>${p.requester}</td>
            <td>${p.status}</td>
            <td>${p.orientadores ? p.orientadores.join(', ') : '-'}</td>
            <td>
                <button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button>
                <button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><tr><th>Município</th><th>Data</th><th>Solicitante</th><th>Status</th><th>Orientadores</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deletePresentation(id) {
    if(confirm('Excluir?')) {
        presentations = presentations.filter(p => p.id !== id);
        salvarNoArmazenamento('presentations', presentations);
        renderPresentations();
    }
}

// --- DEMANDAS, VISITAS, VERSÕES --- 
// (Implementação similar explícita para garantir funcionamento)

function showDemandModal(id=null) {
    const modal = document.getElementById('demand-modal');
    document.getElementById('demand-form').reset();
    editingId = id;
    if(id) {
        const d = demands.find(x => x.id === id);
        document.getElementById('demand-date').value = d.date;
        document.getElementById('demand-description').value = d.description;
        document.getElementById('demand-priority').value = d.priority;
        document.getElementById('demand-status').value = d.status;
    }
    modal.classList.add('show');
}

function saveDemand(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('demand-date').value,
        description: document.getElementById('demand-description').value,
        priority: document.getElementById('demand-priority').value,
        status: document.getElementById('demand-status').value,
        user: currentUser.name
    };
    if(editingId) {
        const idx = demands.findIndex(x => x.id === editingId);
        demands[idx] = { ...demands[idx], ...data };
    } else {
        demands.push({ id: getNextId('dem'), ...data });
    }
    salvarNoArmazenamento('demands', demands);
    document.getElementById('demand-modal').classList.remove('show');
    renderDemands();
    showToast('Salvo!');
}

function renderDemands() {
    const c = document.getElementById('demands-table');
    if(demands.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; return; }
    const rows = demands.map(d => `<tr><td>${formatDate(d.date)}</td><td>${d.priority}</td><td>${d.status}</td><td>${d.description}</td><td><button class="btn btn--sm" onclick="showDemandModal(${d.id})">✏️</button><button class="btn btn--sm" onclick="deleteDemand(${d.id})">🗑️</button></td></tr>`).join('');
    c.innerHTML = `<table><thead><tr><th>Data</th><th>Prioridade</th><th>Status</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteDemand(id) {
    if(confirm('Excluir?')) {
        demands = demands.filter(x => x.id !== id);
        salvarNoArmazenamento('demands', demands);
        renderDemands();
    }
}

function showVisitModal(id=null) {
    const modal = document.getElementById('visit-modal');
    document.getElementById('visit-form').reset();
    editingId = id;
    updateGlobalDropdowns();
    if(id) {
        const v = visits.find(x => x.id === id);
        document.getElementById('visit-municipality').value = v.municipality;
        document.getElementById('visit-date').value = v.date;
        document.getElementById('visit-applicant').value = v.applicant;
        document.getElementById('visit-status').value = v.status;
    }
    modal.classList.add('show');
}

function saveVisit(e) {
    e.preventDefault();
    const data = {
        municipality: document.getElementById('visit-municipality').value,
        date: document.getElementById('visit-date').value,
        applicant: document.getElementById('visit-applicant').value,
        status: document.getElementById('visit-status').value
    };
    if(editingId) {
        const idx = visits.findIndex(x => x.id === editingId);
        visits[idx] = { ...visits[idx], ...data };
    } else {
        visits.push({ id: getNextId('visit'), ...data });
    }
    salvarNoArmazenamento('visits', visits);
    document.getElementById('visit-modal').classList.remove('show');
    renderVisits();
    showToast('Salvo!');
}

function renderVisits() {
    const c = document.getElementById('visits-table');
    if(visits.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; return; }
    const rows = visits.map(v => `<tr><td>${formatDate(v.date)}</td><td>${v.municipality}</td><td>${v.applicant}</td><td>${v.status}</td><td><button class="btn btn--sm" onclick="showVisitModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVisit(${v.id})">🗑️</button></td></tr>`).join('');
    c.innerHTML = `<table><thead><tr><th>Data</th><th>Município</th><th>Solicitante</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteVisit(id) {
    if(confirm('Excluir?')) {
        visits = visits.filter(x => x.id !== id);
        salvarNoArmazenamento('visits', visits);
        renderVisits();
    }
}

function showVersionModal(id=null) {
    const modal = document.getElementById('version-modal');
    if(!modal) return;
    document.getElementById('version-form').reset();
    editingId = id;
    if(id) {
        const v = systemVersions.find(x => x.id === id);
        document.getElementById('version-date').value = v.date;
        document.getElementById('version-number').value = v.version;
        document.getElementById('version-type').value = v.type;
        document.getElementById('version-description').value = v.description;
    }
    modal.classList.add('show');
}

function saveVersion(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('version-date').value,
        version: document.getElementById('version-number').value,
        type: document.getElementById('version-type').value,
        description: document.getElementById('version-description').value,
        author: currentUser.name
    };
    if(editingId) {
        const idx = systemVersions.findIndex(x => x.id === editingId);
        systemVersions[idx] = { ...systemVersions[idx], ...data };
    } else {
        systemVersions.push({ id: getNextId('ver'), ...data });
    }
    salvarNoArmazenamento('systemVersions', systemVersions);
    document.getElementById('version-modal').classList.remove('show');
    renderVersions();
    showToast('Versão registrada!');
}

function renderVersions() {
    const c = document.getElementById('versions-table');
    if(!c) return;
    if(systemVersions.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; return; }
    const rows = systemVersions.map(v => `<tr><td>${formatDate(v.date)}</td><td>${v.version}</td><td>${v.type}</td><td>${v.description}</td><td><button class="btn btn--sm" onclick="showVersionModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVersion(${v.id})">🗑️</button></td></tr>`).join('');
    c.innerHTML = `<table><thead><tr><th>Data</th><th>Versão</th><th>Tipo</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteVersion(id) {
    if(confirm('Excluir?')) {
        systemVersions = systemVersions.filter(x => x.id !== id);
        salvarNoArmazenamento('systemVersions', systemVersions);
        renderVersions();
    }
}

// =====================================================
// 8. CONFIGURAÇÕES (CRUDs Básicos)
// =====================================================

// LISTA MESTRA DE MUNICÍPIOS
function showMunicipalityListModal(id=null) {
    const modal = document.getElementById('municipality-list-modal');
    document.getElementById('municipality-list-form').reset();
    editingId = id;
    if(id) {
        const m = municipalitiesList.find(x => x.id === id);
        document.getElementById('municipality-list-name').value = m.name;
        document.getElementById('municipality-list-uf').value = m.uf;
    }
    modal.classList.add('show');
}

function saveMunicipalityList(e) {
    e.preventDefault();
    const data = { name: document.getElementById('municipality-list-name').value, uf: document.getElementById('municipality-list-uf').value };
    if(editingId) {
        const idx = municipalitiesList.findIndex(x => x.id === editingId);
        municipalitiesList[idx] = { ...municipalitiesList[idx], ...data };
    } else {
        municipalitiesList.push({ id: getNextId('munList'), ...data });
    }
    salvarNoArmazenamento('municipalitiesList', municipalitiesList);
    document.getElementById('municipality-list-modal').classList.remove('show');
    renderMunicipalityList();
    updateGlobalDropdowns();
    showToast('Salvo!');
}

function renderMunicipalityList() {
    const c = document.getElementById('municipalities-list-table');
    const rows = municipalitiesList.map(m => `<tr><td>${m.name} - ${m.uf}</td><td><button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button></td></tr>`).join('');
    c.innerHTML = `<table><thead><tr><th>Município</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function deleteMunicipalityList(id) {
    if(confirm('Excluir?')) {
        municipalitiesList = municipalitiesList.filter(x => x.id !== id);
        salvarNoArmazenamento('municipalitiesList', municipalitiesList);
        renderMunicipalityList();
        updateGlobalDropdowns();
    }
}

// OUTROS CONFIGS (Users, Cargos, etc)
function showUserModal(id=null) { editingId=id; document.getElementById('user-form').reset(); document.getElementById('user-modal').classList.add('show'); }
function saveUser(e) { e.preventDefault(); const data = { login: document.getElementById('user-login').value.toUpperCase(), name: document.getElementById('user-name').value, permission: document.getElementById('user-permission').value, status: document.getElementById('user-status').value }; if(!editingId) { data.salt=generateSalt(); data.passwordHash=hashPassword(document.getElementById('user-password').value, data.salt); users.push({id:getNextId('user'), ...data}); } else { const idx=users.findIndex(x=>x.id===editingId); users[idx]={...users[idx], ...data}; } salvarNoArmazenamento('users',users); document.getElementById('user-modal').classList.remove('show'); renderUsers(); }
function renderUsers() { const c = document.getElementById('users-table'); const rows = users.map(u => `<tr><td>${u.login}</td><td>${u.name}</td><td>${u.permission}</td><td><button class="btn btn--sm" onclick="showUserModal(${u.id})">✏️</button></td></tr>`).join(''); c.innerHTML = `<table><thead><tr><th>Login</th><th>Nome</th><th>Permissão</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`; }

function showCargoModal(id=null) { editingId=id; document.getElementById('cargo-form').reset(); if(id){ const c = cargos.find(x=>x.id===id); document.getElementById('cargo-name').value = c.name; } document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e) { e.preventDefault(); const data = { name: document.getElementById('cargo-name').value }; if(editingId){ const idx=cargos.findIndex(x=>x.id===editingId); cargos[idx]={...cargos[idx], ...data}; } else { cargos.push({id:getNextId('cargo'), ...data}); } salvarNoArmazenamento('cargos',cargos); document.getElementById('cargo-modal').classList.remove('show'); renderCargos(); }
function renderCargos() { const c = document.getElementById('cargos-table'); const rows = cargos.map(x => `<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML = `<table><thead><tr><th>Cargo</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`; }
function deleteCargo(id) { if(confirm('Excluir?')){ cargos = cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}

function showOrientadorModal(id=null) { editingId=id; document.getElementById('orientador-form').reset(); if(id){ const o = orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value = o.name; document.getElementById('orientador-contact').value = o.contact; } document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e) { e.preventDefault(); const data = { name: document.getElementById('orientador-name').value, contact: document.getElementById('orientador-contact').value }; if(editingId){ const idx=orientadores.findIndex(x=>x.id===editingId); orientadores[idx]={...orientadores[idx], ...data}; } else { orientadores.push({id:getNextId('orient'), ...data}); } salvarNoArmazenamento('orientadores',orientadores); document.getElementById('orientador-modal').classList.remove('show'); renderOrientadores(); }
function renderOrientadores() { const c = document.getElementById('orientadores-table'); const rows = orientadores.map(x => `<tr><td>${x.name}</td><td>${x.contact}</td><td><button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML = `<table><thead><tr><th>Nome</th><th>Contato</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`; }
function deleteOrientador(id) { if(confirm('Excluir?')){ orientadores = orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}

function showModuloModal(id=null) { editingId=id; document.getElementById('modulo-form').reset(); if(id){ const m = modulos.find(x=>x.id===id); document.getElementById('modulo-name').value = m.name; } document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e) { e.preventDefault(); const data = { name: document.getElementById('modulo-name').value }; if(editingId){ const idx=modulos.findIndex(x=>x.id===editingId); modulos[idx]={...modulos[idx], ...data}; } else { modulos.push({id:getNextId('mod'), ...data}); } salvarNoArmazenamento('modulos',modulos); document.getElementById('modulo-modal').classList.remove('show'); renderModulos(); }
function renderModulos() { const c = document.getElementById('modulos-table'); const rows = modulos.map(x => `<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML = `<table><thead><tr><th>Módulo</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`; }
function deleteModulo(id) { if(confirm('Excluir?')){ modulos = modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}

function showFormaApresentacaoModal(id=null) { editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){ const f = formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value = f.name; } document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e) { e.preventDefault(); const data = { name: document.getElementById('forma-apresentacao-name').value }; if(editingId){ const idx=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[idx]={...formasApresentacao[idx], ...data}; } else { formasApresentacao.push({id:getNextId('forma'), ...data}); } salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }
function renderFormas() { const c = document.getElementById('formas-apresentacao-table'); const rows = formasApresentacao.map(x => `<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML = `<table><thead><tr><th>Forma</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`; }
function deleteForma(id) { if(confirm('Excluir?')){ formasApresentacao = formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}

function showChangePasswordModal() { document.getElementById('change-password-modal').classList.add('show'); }
function closeChangePasswordModal() { document.getElementById('change-password-modal').classList.remove('show'); }
function handleChangePassword(e) { e.preventDefault(); const newPass = document.getElementById('new-password').value; const conf = document.getElementById('confirm-password').value; if(newPass !== conf || newPass.length < 4) { alert('Senha inválida'); return; } const idx = users.findIndex(u => u.id === currentUser.id); users[idx].salt = generateSalt(); users[idx].passwordHash = hashPassword(newPass, users[idx].salt); users[idx].mustChangePassword = false; salvarNoArmazenamento('users', users); currentUser = users[idx]; salvarNoArmazenamento('currentUser', currentUser); closeChangePasswordModal(); showToast('Senha alterada!'); initializeApp(); }

// =====================================================
// 9. DROPDOWNS E DASHBOARD
// =====================================================
function populateSelect(select, data, valKey, textKey) {
    if(!select) return;
    const current = select.value;
    let html = '<option value="">Selecione...</option>';
    data.sort((a,b)=>a[textKey].localeCompare(b[textKey])).forEach(i => {
        html += `<option value="${i[valKey]}">${i[textKey]}</option>`;
    });
    select.innerHTML = html;
    select.value = current;
}

function updateGlobalDropdowns() {
    const activeMuns = municipalities.filter(m => m.status === 'Em uso');
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(id => {
        populateSelect(document.getElementById(id), activeMuns, 'name', 'name');
    });
    
    // Filtro de municipios
    populateSelect(document.getElementById('filter-municipality-name'), municipalities, 'name', 'name');
    
    // Módulos
    populateSelect(document.getElementById('filter-municipality-module'), modulos, 'name', 'name');
}

function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(m => m.status === 'Em uso').length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(t => t.status === 'Concluído').length;
    document.getElementById('dashboard-requests-completed').textContent = requests.filter(r => r.status === 'Realizado').length;
    document.getElementById('dashboard-presentations-completed').textContent = presentations.filter(p => p.status === 'Realizada').length;
}

function updateBackupInfo() {
    document.getElementById('backup-info-municipalities').textContent = municipalities.length;
    document.getElementById('backup-info-trainings').textContent = tasks.length;
    document.getElementById('backup-info-cargos').textContent = cargos.length;
    document.getElementById('backup-info-orientadores').textContent = orientadores.length;
    document.getElementById('backup-info-modules').textContent = modulos.length;
    document.getElementById('backup-info-users').textContent = users.length;
}

// =====================================================
// 10. GRÁFICOS (Chart.js)
// =====================================================
function initializeDashboardCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if(ctx && window.Chart) {
        // Agrupar por ano
        const dataMap = {};
        municipalities.forEach(m => {
            if(m.implantationDate) {
                const year = m.implantationDate.split('-')[0];
                dataMap[year] = (dataMap[year] || 0) + 1;
            }
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(dataMap),
                datasets: [{
                    label: 'Implantações por Ano',
                    data: Object.values(dataMap),
                    backgroundColor: '#1FB8CD'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// =====================================================
// 11. INICIALIZAÇÃO
// =====================================================
function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    applyMasks();
    
    renderMunicipalities();
    renderTasks();
    renderVersions();
    
    updateGlobalDropdowns();
    updateDashboardStats();
    initializeDashboardCharts();
    
    // Se nenhuma aba estiver ativa, vai para dashboard
    if(!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    
    // Listeners de fechar modal
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); } });
});
