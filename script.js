// =====================================================
// SIGP SAÚDE v12.0 - VERSÃO FINAL EXPANDIDA (SEM OTIMIZAÇÃO)
// Código explícito, módulo por módulo, com filtros e correções.
// =====================================================

// 1. VERIFICAÇÃO DE SEGURANÇA
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada. Verifique sua conexão ou o HTML.');
}

// =====================================================
// 2. CONFIGURAÇÕES E UTILITÁRIOS
// =====================================================
const SALT_LENGTH = 16;
let chartInstance = null;

// Instâncias de gráficos para controle individual
let charts = {
    dashboard: null,
    demandStatus: null,
    visitStatus: null,
    productionStatus: null,
    presentationStatus: null,
    requestStatus: null
};

// Paleta de cores para o gráfico de anos
const CHART_COLORS = [
    '#C85250', '#E7B85F', '#79C2A9', '#5E8C99', '#3B5B66', 
    '#E68161', '#F7DC6F', '#4ECDC4', '#FF6B6B', '#A9DFBF'
];

function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

function hashPassword(password, salt) {
    return CryptoJS.SHA256(salt + password).toString();
}

function salvarNoArmazenamento(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
        console.error(erro);
        if (erro.name === 'QuotaExceededError') {
            alert('⚠️ Espaço de armazenamento cheio! Faça backup e limpe dados antigos.');
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
        return valorPadrao;
    }
}

function deletarDoArmazenamento(chave) {
    localStorage.removeItem(chave);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const partes = dateString.split('-');
    // Garante que não quebre se a data estiver incompleta
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dateString;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast';
    
    // Força o navegador a reiniciar a animação
    void toast.offsetWidth;
    
    toast.classList.add(type);
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// =====================================================
// 3. MÁSCARAS E REGRAS DE FORMATAÇÃO
// =====================================================

function formatPhoneNumber(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
}

function formatCompetencia(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 6);
    if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    }
    return v;
}

function formatPeriodo(value) {
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 8);
    
    if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    }
    if (v.length > 4) {
        v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2 à $3");
    }
    if (v.length > 6) {
        v = v.replace(/ à (\d{2})(\d)/, " à $1/$2");
    }
    return v;
}

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
        if (el) {
            el.addEventListener('input', (e) => {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });

    // Competência
    const elComp = document.getElementById('production-competence');
    if (elComp) {
        elComp.addEventListener('input', (e) => {
            e.target.value = formatCompetencia(e.target.value);
        });
    }

    // Período
    const elPeriod = document.getElementById('production-period');
    if (elPeriod) {
        elPeriod.placeholder = "DD/MM à DD/MM";
        elPeriod.addEventListener('input', (e) => {
            e.target.value = formatPeriodo(e.target.value);
        });
    }
    
    // Listener automático para filtros (ao mudar select, atualiza tabela)
    const filterSelects = document.querySelectorAll('.filters-section select');
    filterSelects.forEach(select => {
        select.addEventListener('change', () => {
            // Descobre qual render chamar baseado na aba ativa
            const activeSection = document.querySelector('.tab-content.active');
            if (activeSection) {
                refreshCurrentTab(activeSection.id);
            }
        });
    });
}

// =====================================================
// 4. ESTADO GLOBAL E CARREGAMENTO
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
        { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#FF6B6B', description: 'Módulo de cadastros gerais' },
        { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#4ECDC4', description: 'Tratamento Fora de Domicílio' },
        { id: 3, name: 'Prontuário', abbreviation: 'PEC', color: '#45B7D1', description: 'Prontuário Eletrônico do Cidadão' },
        { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#FFA07A', description: 'Gestão administrativa' }
    ]
};

// Carrega Usuários
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);

// Correção automática de senha Admin no primeiro uso
if (users[0].login === 'ADMIN' && !users[0].passwordHash) {
    users[0].salt = generateSalt();
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');
let editingId = null;

// Carregamento das Listas de Dados
let municipalities = recuperarDoArmazenamento('municipalities', []);
let municipalitiesList = recuperarDoArmazenamento('municipalitiesList', []);
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

// Contadores de ID
let counters = recuperarDoArmazenamento('counters', {
    mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1
});

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// =====================================================
// 5. INTERFACE E NAVEGAÇÃO
// =====================================================
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = currentTheme === 'light' ? '🌙 Tema' : '☀️ Tema';
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    salvarNoArmazenamento('theme', currentTheme);
    initializeTheme();
}

function updateUserInterface() {
    if (!currentUser) return;
    
    const elName = document.getElementById('logged-user-name');
    if (elName) {
        elName.textContent = currentUser.name;
    }

    const isAdmin = currentUser.permission === 'Administrador';
    
    const menuItems = [
        { id: 'user-management-menu-btn', adminOnly: true },
        { id: 'cargo-management-menu-btn', adminOnly: false },
        { id: 'orientador-management-menu-btn', adminOnly: false },
        { id: 'modulo-management-menu-btn', adminOnly: false },
        { id: 'municipality-list-management-menu-btn', adminOnly: false },
        { id: 'forma-apresentacao-management-menu-btn', adminOnly: false },
        { id: 'backup-menu-btn', adminOnly: false }
    ];

    menuItems.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            if (item.adminOnly && !isAdmin) {
                el.style.display = 'none';
            } else {
                el.style.display = 'flex';
            }
        }
    });

    const divider = document.getElementById('admin-divider');
    if (divider) {
        divider.style.display = isAdmin ? 'block' : 'none';
    }
}

function initializeTabs() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    
    buttons.forEach(btn => {
        btn.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active de todos
            buttons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Ativa o atual
            this.classList.add('active');
            const sectionId = tabId + '-section';
            const section = document.getElementById(sectionId);
            
            if (section) {
                section.classList.add('active');
                refreshCurrentTab(sectionId);
            }
        };
    });
}

function refreshCurrentTab(sectionId) {
    if (sectionId === 'municipios-section') renderMunicipalities();
    if (sectionId === 'tarefas-section') renderTasks();
    if (sectionId === 'solicitacoes-section') renderRequests();
    if (sectionId === 'demandas-section') renderDemands();
    if (sectionId === 'visitas-section') renderVisits();
    if (sectionId === 'producao-section') renderProductions();
    if (sectionId === 'apresentacoes-section') renderPresentations();
    if (sectionId === 'versoes-section') renderVersions();
    if (sectionId === 'dashboard-section') {
        updateDashboardStats();
        initializeDashboardCharts();
    }
}

function navigateToHome() {
    const dashBtn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if (dashBtn) dashBtn.click();
}

function toggleSettingsMenu() {
    document.getElementById('settings-menu').classList.toggle('show');
}

// Funções de Navegação do Menu de Configurações
function navigateToUserManagement() { toggleSettingsMenu(); openTab('usuarios-section'); renderUsers(); }
function navigateToCargoManagement() { toggleSettingsMenu(); openTab('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettingsMenu(); openTab('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettingsMenu(); openTab('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettingsMenu(); openTab('municipalities-list-section'); renderMunicipalityList(); }
function navigateToFormaApresentacaoManagement() { toggleSettingsMenu(); openTab('formas-apresentacao-section'); renderFormas(); }
function navigateToBackupManagement() { toggleSettingsMenu(); openTab('backup-section'); updateBackupInfo(); }

function openTab(sectionId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// =====================================================
// 6. AUTENTICAÇÃO
// =====================================================
function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('login-username').value.trim().toUpperCase();
    const pass = document.getElementById('login-password').value;
    const user = users.find(u => u.login === login && u.status === 'Ativo');

    if (user && hashPassword(pass, user.salt) === user.passwordHash) {
        currentUser = user;
        isAuthenticated = true;
        salvarNoArmazenamento('currentUser', currentUser);
        
        checkAuthentication();
        initializeApp();
        showToast(`Bem-vindo, ${user.name}!`, 'success');
    } else {
        document.getElementById('login-error').textContent = 'Login ou senha inválidos.';
    }
}

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

function handleLogout() {
    if (confirm('Sair do sistema?')) {
        localStorage.removeItem('currentUser');
        location.reload();
    }
}

function showChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('show');
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').classList.remove('show');
}

function handleChangePassword(e) {
    e.preventDefault();
    const n = document.getElementById('new-password').value;
    const c = document.getElementById('confirm-password').value;
    
    if (n !== c || n.length < 4) {
        alert('Senhas não conferem ou muito curtas.');
        return;
    }
    
    const idx = users.findIndex(u => u.id === currentUser.id);
    users[idx].salt = generateSalt();
    users[idx].passwordHash = hashPassword(n, users[idx].salt);
    users[idx].mustChangePassword = false;
    
    salvarNoArmazenamento('users', users);
    currentUser = users[idx];
    salvarNoArmazenamento('currentUser', currentUser);
    
    closeChangePasswordModal();
    showToast('Senha alterada com sucesso!');
}

// =====================================================
// 7. MÓDULO: GESTÃO DE USUÁRIOS
// =====================================================
function showUserModal(id = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    form.reset();
    editingId = id;
    document.getElementById('user-login').disabled = false;

    if (id) {
        document.getElementById('user-modal-title').textContent = 'Editar Usuário';
        const u = users.find(x => x.id === id);
        if (u) {
            document.getElementById('user-login').value = u.login;
            document.getElementById('user-login').disabled = true;
            document.getElementById('user-name').value = u.name;
            document.getElementById('user-permission').value = u.permission;
            document.getElementById('user-status').value = u.status;
            document.getElementById('user-password').required = false;
            document.getElementById('user-password').placeholder = "Vazio para manter senha atual";
        }
    } else {
        document.getElementById('user-modal-title').textContent = 'Novo Usuário';
        document.getElementById('user-password').required = true;
        document.getElementById('user-password').placeholder = "Senha inicial";
    }
    modal.classList.add('show');
}

function saveUser(e) {
    e.preventDefault();
    const login = document.getElementById('user-login').value.trim().toUpperCase();
    const name = document.getElementById('user-name').value.trim();
    const permission = document.getElementById('user-permission').value;
    const status = document.getElementById('user-status').value;
    const password = document.getElementById('user-password').value;

    if (!editingId) {
        if (users.some(u => u.login === login)) {
            alert('Login já existe! Escolha outro.');
            return;
        }
        const newUser = {
            id: getNextId('user'),
            login: login,
            name: name,
            permission: permission,
            status: status,
            mustChangePassword: true,
            salt: generateSalt()
        };
        newUser.passwordHash = hashPassword(password, newUser.salt);
        users.push(newUser);
    } else {
        const idx = users.findIndex(u => u.id === editingId);
        users[idx].name = name;
        users[idx].permission = permission;
        users[idx].status = status;
        if (password) {
            users[idx].salt = generateSalt();
            users[idx].passwordHash = hashPassword(password, users[idx].salt);
        }
    }
    salvarNoArmazenamento('users', users);
    document.getElementById('user-modal').classList.remove('show');
    renderUsers();
    showToast('Usuário salvo!');
}

function renderUsers() {
    const c = document.getElementById('users-table');
    const filterName = document.getElementById('filter-user-name') ? document.getElementById('filter-user-name').value.toLowerCase() : '';

    let filtered = users.filter(u => {
        if (filterName && !u.name.toLowerCase().includes(filterName) && !u.login.toLowerCase().includes(filterName)) return false;
        return true;
    });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum usuário cadastrado.</div>';
        return;
    }
    
    const rows = filtered.map(u => `
        <tr>
            <td><strong>${u.login}</strong></td>
            <td>${u.name}</td>
            <td>${u.permission}</td>
            <td><span class="status-badge ${u.status === 'Ativo' ? 'active' : 'blocked'}">${u.status}</span></td>
            <td>
                <button class="btn btn--sm" onclick="showUserModal(${u.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteUser(${u.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Login</th><th>Nome</th><th>Permissão</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    
    // Atualiza Stats
    if(document.getElementById('total-users')) document.getElementById('total-users').textContent = users.length;
    if(document.getElementById('active-users')) document.getElementById('active-users').textContent = users.filter(u=>u.status==='Ativo').length;
    if(document.getElementById('inactive-users')) document.getElementById('inactive-users').textContent = users.filter(u=>u.status!=='Ativo').length;
}

function deleteUser(id) {
    const u = users.find(x => x.id === id);
    if (u.login === 'ADMIN') {
        alert('Não é permitido excluir o usuário ADMIN principal.');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        users = users.filter(x => x.id !== id);
        salvarNoArmazenamento('users', users);
        renderUsers();
    }
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('show');
}

function clearUserFilters() {
    document.getElementById('filter-user-name').value = '';
    renderUsers();
}

// =====================================================
// 8. MUNICÍPIOS (CARTEIRA)
// =====================================================
function showMunicipalityModal(id = null) {
    const modal = document.getElementById('municipality-modal');
    document.getElementById('municipality-form').reset();
    editingId = id;
    
    populateSelect(document.getElementById('municipality-name'), municipalitiesList, 'name', 'name');

    if (id) {
        const m = municipalities.find(x => x.id === id);
        if (m) {
            document.getElementById('municipality-name').value = m.name;
            document.getElementById('municipality-status').value = m.status;
            document.getElementById('municipality-manager').value = m.manager;
            document.getElementById('municipality-contact').value = m.contact;
            document.getElementById('municipality-implantation-date').value = m.implantationDate;
            document.getElementById('municipality-last-visit').value = m.lastVisit;
            
            if (m.modules) {
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
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
    const data = {
        name: document.getElementById('municipality-name').value,
        status: document.getElementById('municipality-status').value,
        manager: document.getElementById('municipality-manager').value,
        contact: document.getElementById('municipality-contact').value,
        implantationDate: document.getElementById('municipality-implantation-date').value,
        lastVisit: document.getElementById('municipality-last-visit').value,
        modules: mods
    };

    if (editingId) {
        const i = municipalities.findIndex(x => x.id === editingId);
        municipalities[i] = { ...municipalities[i], ...data };
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
    const c = document.getElementById('municipalities-table');
    
    // Captura Filtros
    const filterName = document.getElementById('filter-municipality-name') ? document.getElementById('filter-municipality-name').value : '';
    const filterStatus = document.getElementById('filter-municipality-status') ? document.getElementById('filter-municipality-status').value : '';
    const filterModule = document.getElementById('filter-municipality-module') ? document.getElementById('filter-municipality-module').value : '';
    const filterManager = document.getElementById('filter-municipality-manager') ? document.getElementById('filter-municipality-manager').value.toLowerCase() : '';

    // Aplica Filtros
    let filtered = municipalities.filter(m => {
        if (filterName && m.name !== filterName) return false;
        if (filterStatus && m.status !== filterStatus) return false;
        if (filterModule && !m.modules.includes(filterModule)) return false;
        if (filterManager && !m.manager.toLowerCase().includes(filterManager)) return false;
        return true;
    });
    
    filtered.sort((a,b) => a.name.localeCompare(b.name));

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município encontrado.</div>';
    } else {
        const rows = filtered.map(m => {
            // AJUSTE: Módulos com Abreviação e Cor
            const modulesBadges = m.modules.map(modName => {
                const modConfig = modulos.find(x => x.name === modName);
                const abbrev = modConfig ? modConfig.abbreviation : modName.substring(0,3).toUpperCase();
                const color = modConfig ? modConfig.color : '#999';
                return `<span style="background-color:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; margin-right:3px; font-weight:bold; display:inline-block;" title="${modName}">${abbrev}</span>`;
            }).join('');

            return `
            <tr>
                <td><strong>${m.name}</strong></td>
                <td>${modulesBadges}</td>
                <td>${m.manager}</td>
                <td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td>
                <td>${formatDate(m.lastVisit)}</td>
                <td><span class="status-badge ${m.status === 'Em uso' ? 'active' : 'blocked'}">${m.status}</span></td>
                <td>
                    <div class="task-actions-compact">
                        <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                        <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Última Visita</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    // Atualiza Estatísticas
    if(document.getElementById('total-municipalities')) document.getElementById('total-municipalities').textContent = filtered.length;
    if(document.getElementById('active-municipalities')) document.getElementById('active-municipalities').textContent = filtered.filter(m => m.status === 'Em uso').length;
    if(document.getElementById('inactive-municipalities')) document.getElementById('inactive-municipalities').textContent = filtered.filter(m => m.status !== 'Em uso').length;
}

function deleteMunicipality(id) {
    if (confirm('Excluir este município?')) {
        municipalities = municipalities.filter(x => x.id !== id);
        salvarNoArmazenamento('municipalities', municipalities);
        renderMunicipalities();
        updateGlobalDropdowns();
    }
}

function closeMunicipalityModal() {
    document.getElementById('municipality-modal').classList.remove('show');
}

function clearMunicipalityFilters() {
    if(document.getElementById('filter-municipality-name')) document.getElementById('filter-municipality-name').value = '';
    if(document.getElementById('filter-municipality-status')) document.getElementById('filter-municipality-status').value = '';
    if(document.getElementById('filter-municipality-module')) document.getElementById('filter-municipality-module').value = '';
    if(document.getElementById('filter-municipality-manager')) document.getElementById('filter-municipality-manager').value = '';
    renderMunicipalities();
}

// =====================================================
// 9. TREINAMENTOS (COM FILTROS E STATS)
// =====================================================
function showTaskModal(id = null) {
    editingId = id;
    document.getElementById('task-form').reset();
    updateGlobalDropdowns();
    
    if (id) {
        const t = tasks.find(x => x.id === id);
        if (t) {
            document.getElementById('task-date-requested').value = t.dateRequested;
            document.getElementById('task-municipality').value = t.municipality;
            document.getElementById('task-requested-by').value = t.requestedBy;
            document.getElementById('task-performed-by').value = t.performedBy;
            document.getElementById('task-status').value = t.status;
            document.getElementById('task-trained-name').value = t.trainedName || '';
            document.getElementById('task-trained-position').value = t.trainedPosition || '';
            document.getElementById('task-contact').value = t.contact || '';
            document.getElementById('task-observations').value = t.observations || '';
            document.getElementById('task-date-performed').value = t.datePerformed || '';
        }
    }
    document.getElementById('task-modal').classList.add('show');
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

    if (editingId) {
        const i = tasks.findIndex(x => x.id === editingId);
        tasks[i] = { ...tasks[i], ...data };
    } else {
        tasks.push({ id: getNextId('task'), ...data });
    }
    salvarNoArmazenamento('tasks', tasks);
    document.getElementById('task-modal').classList.remove('show');
    renderTasks();
    showToast('Treinamento salvo!', 'success');
}

function renderTasks() {
    // 1. Capturar Filtros
    const fMun = document.getElementById('filter-task-municipality') ? document.getElementById('filter-task-municipality').value : '';
    const fStatus = document.getElementById('filter-task-status') ? document.getElementById('filter-task-status').value : '';
    const fReq = document.getElementById('filter-task-requester') ? document.getElementById('filter-task-requester').value.toLowerCase() : '';
    const fPerf = document.getElementById('filter-task-performer') ? document.getElementById('filter-task-performer').value.toLowerCase() : '';
    const fDateStart = document.getElementById('filter-task-date-start') ? document.getElementById('filter-task-date-start').value : '';
    const fDateEnd = document.getElementById('filter-task-date-end') ? document.getElementById('filter-task-date-end').value : '';

    // 2. Filtrar
    let filtered = tasks.filter(t => {
        if(fMun && t.municipality !== fMun) return false;
        if(fStatus && t.status !== fStatus) return false;
        if(fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if(fPerf && !t.performedBy.toLowerCase().includes(fPerf)) return false;
        if(fDateStart && t.dateRequested < fDateStart) return false;
        if(fDateEnd && t.dateRequested > fDateEnd) return false;
        return true;
    });
    
    filtered.sort((a,b) => new Date(b.dateRequested) - new Date(a.dateRequested));

    // 3. Renderizar Tabela
    const c = document.getElementById('tasks-table');
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum treinamento encontrado.</div>';
    } else {
        const rows = filtered.map(t => `
            <tr>
                <td>${formatDate(t.dateRequested)}</td>
                <td>${t.municipality}</td>
                <td>${t.requestedBy}</td>
                <td>${t.performedBy}</td>
                <td>${t.trainedName}</td>
                <td>${t.contact}</td>
                <td><span class="task-status ${t.status === 'Concluído' ? 'completed' : 'pending'}">${t.status}</span></td>
                <td>
                    <button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Instrutor</th><th>Treinado</th><th>Contato</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    // 4. Atualizar Stats
    if(document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent = filtered.length;
    if(document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent = filtered.filter(t=>t.status==='Concluído').length;
    if(document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent = filtered.filter(t=>t.status==='Pendente').length;
    if(document.getElementById('cancelled-tasks')) document.getElementById('cancelled-tasks').textContent = filtered.filter(t=>t.status==='Cancelado').length;
}

function deleteTask(id) {
    if (confirm('Excluir treinamento?')) {
        tasks = tasks.filter(x => x.id !== id);
        salvarNoArmazenamento('tasks', tasks);
        renderTasks();
    }
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('show');
}

function clearTaskFilters() {
    if(document.getElementById('filter-task-municipality')) document.getElementById('filter-task-municipality').value = '';
    if(document.getElementById('filter-task-status')) document.getElementById('filter-task-status').value = '';
    if(document.getElementById('filter-task-requester')) document.getElementById('filter-task-requester').value = '';
    if(document.getElementById('filter-task-performer')) document.getElementById('filter-task-performer').value = '';
    if(document.getElementById('filter-task-date-start')) document.getElementById('filter-task-date-start').value = '';
    if(document.getElementById('filter-task-date-end')) document.getElementById('filter-task-date-end').value = '';
    renderTasks();
}

// =====================================================
// 10. PRODUÇÃO
// =====================================================
function showProductionModal(id = null) {
    editingId = id;
    document.getElementById('production-form').reset();
    updateGlobalDropdowns();
    
    if (id) {
        const p = productions.find(x => x.id === id);
        if (p) {
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
    document.getElementById('production-modal').classList.add('show');
}

function saveProduction(e) {
    e.preventDefault();
    const data = {
        municipality: document.getElementById('production-municipality').value,
        contact: document.getElementById('production-contact').value,
        frequency: document.getElementById('production-frequency').value,
        competence: document.getElementById('production-competence').value,
        period: document.getElementById('production-period').value,
        releaseDate: document.getElementById('production-release-date').value,
        sendDate: document.getElementById('production-send-date').value,
        status: document.getElementById('production-status').value,
        professional: document.getElementById('production-professional').value,
        observations: document.getElementById('production-observations').value
    };

    if (editingId) {
        const i = productions.findIndex(x => x.id === editingId);
        productions[i] = { ...productions[i], ...data };
    } else {
        productions.push({ id: getNextId('prod'), ...data });
    }
    salvarNoArmazenamento('productions', productions);
    document.getElementById('production-modal').classList.remove('show');
    renderProductions();
    showToast('Produção salva!', 'success');
}

function renderProductions() {
    const fMun = document.getElementById('filter-production-municipality') ? document.getElementById('filter-production-municipality').value : '';
    const fStatus = document.getElementById('filter-production-status') ? document.getElementById('filter-production-status').value : '';
    const fProf = document.getElementById('filter-production-professional') ? document.getElementById('filter-production-professional').value.toLowerCase() : '';
    const fFreq = document.getElementById('filter-production-frequency') ? document.getElementById('filter-production-frequency').value : '';

    let filtered = productions.filter(p => {
        if(fMun && p.municipality !== fMun) return false;
        if(fStatus && p.status !== fStatus) return false;
        if(fProf && p.professional && !p.professional.toLowerCase().includes(fProf)) return false;
        if(fFreq && p.frequency !== fFreq) return false;
        return true;
    });

    const c = document.getElementById('productions-table');
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum envio registrado.</div>';
    } else {
        const rows = filtered.map(p => `
            <tr>
                <td>${p.municipality}</td>
                <td>${p.competence}</td>
                <td>${p.period}</td>
                <td>${p.status}</td>
                <td>
                    <button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Competência</th><th>Período</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }

    // Stats
    if(document.getElementById('total-productions')) document.getElementById('total-productions').textContent = filtered.length;
    if(document.getElementById('sent-productions')) document.getElementById('sent-productions').textContent = filtered.filter(p=>p.status==='Enviada').length;
    if(document.getElementById('pending-productions')) document.getElementById('pending-productions').textContent = filtered.filter(p=>p.status==='Pendente').length;
    if(document.getElementById('cancelled-productions')) document.getElementById('cancelled-productions').textContent = filtered.filter(p=>p.status==='Cancelada').length;

    // Gráfico
    if(document.getElementById('productionStatusChart') && window.Chart) {
        if(charts.productionStatus) charts.productionStatus.destroy();
        const ctx = document.getElementById('productionStatusChart');
        charts.productionStatus = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Enviada', 'Cancelada'],
                datasets: [{
                    data: [
                        filtered.filter(p=>p.status==='Pendente').length,
                        filtered.filter(p=>p.status==='Enviada').length,
                        filtered.filter(p=>p.status==='Cancelada').length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }
}

function deleteProduction(id) {
    if (confirm('Excluir?')) {
        productions = productions.filter(x => x.id !== id);
        salvarNoArmazenamento('productions', productions);
        renderProductions();
    }
}

function closeProductionModal() {
    document.getElementById('production-modal').classList.remove('show');
}

function clearProductionFilters() {
    if(document.getElementById('filter-production-municipality')) document.getElementById('filter-production-municipality').value = '';
    if(document.getElementById('filter-production-status')) document.getElementById('filter-production-status').value = '';
    if(document.getElementById('filter-production-professional')) document.getElementById('filter-production-professional').value = '';
    if(document.getElementById('filter-production-frequency')) document.getElementById('filter-production-frequency').value = '';
    renderProductions();
}

// =====================================================
// 11. SOLICITAÇÕES (COM FILTROS E GRÁFICOS)
// =====================================================
function showRequestModal(id = null) {
    editingId = id;
    document.getElementById('request-form').reset();
    updateGlobalDropdowns();
    if (id) {
        const r = requests.find(x => x.id === id);
        document.getElementById('request-description').value = r.description;
        document.getElementById('request-municipality').value = r.municipality;
        document.getElementById('request-date').value = r.date;
        document.getElementById('request-contact').value = r.contact;
        document.getElementById('request-requester').value = r.requester;
        document.getElementById('request-status').value = r.status;
    }
    document.getElementById('request-modal').classList.add('show');
}

function saveRequest(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('request-date').value,
        municipality: document.getElementById('request-municipality').value,
        requester: document.getElementById('request-requester').value,
        contact: document.getElementById('request-contact').value,
        description: document.getElementById('request-description').value,
        status: document.getElementById('request-status').value
    };
    if (editingId) {
        const i = requests.findIndex(x => x.id === editingId);
        requests[i] = { ...requests[i], ...data };
    } else {
        requests.push({ id: getNextId('req'), ...data });
    }
    salvarNoArmazenamento('requests', requests);
    document.getElementById('request-modal').classList.remove('show');
    renderRequests();
    showToast('Salvo!');
}

function renderRequests() {
    const fMun = document.getElementById('filter-request-municipality') ? document.getElementById('filter-request-municipality').value : '';
    const fStatus = document.getElementById('filter-request-status') ? document.getElementById('filter-request-status').value : '';
    const fSol = document.getElementById('filter-request-solicitante') ? document.getElementById('filter-request-solicitante').value.toLowerCase() : '';
    
    let filtered = requests.filter(r => {
        if(fMun && r.municipality !== fMun) return false;
        if(fStatus && r.status !== fStatus) return false;
        if(fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        return true;
    });

    const c = document.getElementById('requests-table');
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(x => `
            <tr>
                <td>${formatDate(x.date)}</td>
                <td>${x.municipality}</td>
                <td>${x.status}</td>
                <td>
                    <button class="btn btn--sm" onclick="showRequestModal(${x.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteRequest(${x.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    // Stats e Gráfico
    if(document.getElementById('total-requests')) document.getElementById('total-requests').textContent = filtered.length;
    if(document.getElementById('pending-requests')) document.getElementById('pending-requests').textContent = filtered.filter(x=>x.status==='Pendente').length;
    if(document.getElementById('completed-requests')) document.getElementById('completed-requests').textContent = filtered.filter(x=>x.status==='Realizado').length;

    if(document.getElementById('requestStatusChart') && window.Chart) {
        if(charts.requestStatus) charts.requestStatus.destroy();
        charts.requestStatus = new Chart(document.getElementById('requestStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizado', 'Inviável'], 
                datasets: [{ 
                    data: [
                        filtered.filter(x=>x.status==='Pendente').length, 
                        filtered.filter(x=>x.status==='Realizado').length, 
                        filtered.filter(x=>x.status==='Inviável').length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
}

function deleteRequest(id) {
    if (confirm('Excluir?')) {
        requests = requests.filter(x => x.id !== id);
        salvarNoArmazenamento('requests', requests);
        renderRequests();
    }
}

function closeRequestModal() {
    document.getElementById('request-modal').classList.remove('show');
}

function clearRequestFilters() {
    if(document.getElementById('filter-request-municipality')) document.getElementById('filter-request-municipality').value = '';
    if(document.getElementById('filter-request-status')) document.getElementById('filter-request-status').value = '';
    if(document.getElementById('filter-request-solicitante')) document.getElementById('filter-request-solicitante').value = '';
    renderRequests();
}

// =====================================================
// 12. VISITAS (FILTROS E GRÁFICOS)
// =====================================================
function showVisitModal(id = null) {
    editingId = id;
    document.getElementById('visit-form').reset();
    updateGlobalDropdowns();
    if (id) {
        const v = visits.find(x => x.id === id);
        document.getElementById('visit-municipality').value = v.municipality;
        document.getElementById('visit-date').value = v.date;
        document.getElementById('visit-applicant').value = v.applicant;
        document.getElementById('visit-status').value = v.status;
    }
    document.getElementById('visit-modal').classList.add('show');
}

function saveVisit(e) {
    e.preventDefault();
    const data = {
        municipality: document.getElementById('visit-municipality').value,
        date: document.getElementById('visit-date').value,
        applicant: document.getElementById('visit-applicant').value,
        status: document.getElementById('visit-status').value
    };
    if (editingId) {
        const i = visits.findIndex(x => x.id === editingId);
        visits[i] = { ...visits[i], ...data };
    } else {
        visits.push({ id: getNextId('visit'), ...data });
    }
    salvarNoArmazenamento('visits', visits);
    document.getElementById('visit-modal').classList.remove('show');
    renderVisits();
    showToast('Salvo!');
}

function renderVisits() {
    const fMun = document.getElementById('filter-visit-municipality') ? document.getElementById('filter-visit-municipality').value : '';
    const fStatus = document.getElementById('filter-visit-status') ? document.getElementById('filter-visit-status').value : '';
    const fApp = document.getElementById('filter-visit-applicant') ? document.getElementById('filter-visit-applicant').value.toLowerCase() : '';

    let filtered = visits.filter(v => {
        if(fMun && v.municipality !== fMun) return false;
        if(fStatus && v.status !== fStatus) return false;
        if(fApp && !v.applicant.toLowerCase().includes(fApp)) return false;
        return true;
    });

    const c = document.getElementById('visits-table');
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(v => `
            <tr>
                <td>${formatDate(v.date)}</td>
                <td>${v.municipality}</td>
                <td>${v.status}</td>
                <td>
                    <button class="btn btn--sm" onclick="showVisitModal(${v.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteVisit(${v.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-visits')) document.getElementById('total-visits').textContent = filtered.length;
    
    if(document.getElementById('visitStatusChart') && window.Chart) {
        if(charts.visitStatus) charts.visitStatus.destroy();
        charts.visitStatus = new Chart(document.getElementById('visitStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Cancelada'], 
                datasets: [{ 
                    data: [
                        filtered.filter(v=>v.status==='Pendente').length,
                        filtered.filter(v=>v.status==='Realizada').length,
                        filtered.filter(v=>v.status==='Cancelada').length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
}

function deleteVisit(id) {
    if (confirm('Excluir?')) {
        visits = visits.filter(x => x.id !== id);
        salvarNoArmazenamento('visits', visits);
        renderVisits();
    }
}

function closeVisitModal() {
    document.getElementById('visit-modal').classList.remove('show');
}

function clearVisitFilters() {
    if(document.getElementById('filter-visit-municipality')) document.getElementById('filter-visit-municipality').value = '';
    if(document.getElementById('filter-visit-status')) document.getElementById('filter-visit-status').value = '';
    if(document.getElementById('filter-visit-applicant')) document.getElementById('filter-visit-applicant').value = '';
    renderVisits();
}

// =====================================================
// 13. DEMANDAS
// =====================================================
function showDemandModal(id = null) {
    editingId = id;
    document.getElementById('demand-form').reset();
    if (id) {
        const d = demands.find(x => x.id === id);
        document.getElementById('demand-date').value = d.date;
        document.getElementById('demand-description').value = d.description;
        document.getElementById('demand-priority').value = d.priority;
        document.getElementById('demand-status').value = d.status;
    }
    document.getElementById('demand-modal').classList.add('show');
}

function saveDemand(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('demand-date').value,
        description: document.getElementById('demand-description').value,
        priority: document.getElementById('demand-priority').value,
        status: document.getElementById('demand-status').value
    };
    if (editingId) {
        const i = demands.findIndex(x => x.id === editingId);
        demands[i] = { ...demands[i], ...data };
    } else {
        demands.push({ id: getNextId('dem'), ...data });
    }
    salvarNoArmazenamento('demands', demands);
    document.getElementById('demand-modal').classList.remove('show');
    renderDemands();
    showToast('Salvo!');
}

function renderDemands() {
    const fStatus = document.getElementById('filter-demand-status') ? document.getElementById('filter-demand-status').value : '';
    const fPrio = document.getElementById('filter-demand-priority') ? document.getElementById('filter-demand-priority').value : '';
    
    let filtered = demands.filter(d => {
        if(fStatus && d.status !== fStatus) return false;
        if(fPrio && d.priority !== fPrio) return false;
        return true;
    });

    const c = document.getElementById('demands-table');
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(d => `
            <tr>
                <td>${formatDate(d.date)}</td>
                <td>${d.priority}</td>
                <td>${d.status}</td>
                <td>${d.description}</td>
                <td>
                    <button class="btn btn--sm" onclick="showDemandModal(${d.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteDemand(${d.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Prioridade</th><th>Status</th><th>Descrição</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-demands')) document.getElementById('total-demands').textContent = filtered.length;
    
    if(document.getElementById('demandStatusChart') && window.Chart) {
        if(charts.demandStatus) charts.demandStatus.destroy();
        charts.demandStatus = new Chart(document.getElementById('demandStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Inviável'], 
                datasets: [{ 
                    data: [
                        filtered.filter(d=>d.status==='Pendente').length,
                        filtered.filter(d=>d.status==='Realizada').length,
                        filtered.filter(d=>d.status==='Inviável').length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
}

function deleteDemand(id) {
    if (confirm('Excluir?')) {
        demands = demands.filter(x => x.id !== id);
        salvarNoArmazenamento('demands', demands);
        renderDemands();
    }
}

function closeDemandModal() {
    document.getElementById('demand-modal').classList.remove('show');
}

function clearDemandFilters() {
    if(document.getElementById('filter-demand-status')) document.getElementById('filter-demand-status').value = '';
    if(document.getElementById('filter-demand-priority')) document.getElementById('filter-demand-priority').value = '';
    renderDemands();
}

// =====================================================
// 14. APRESENTAÇÕES
// =====================================================
function showPresentationModal(id = null) {
    editingId = id;
    document.getElementById('presentation-form').reset();
    updateGlobalDropdowns();

    // Popula Checkboxes
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if (divO) {
        divO.innerHTML = orientadores.map(o => `<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
    }
    const divF = document.getElementById('presentation-forms-checkboxes');
    if (divF) {
        divF.innerHTML = formasApresentacao.map(f => `<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');
    }

    if (id) {
        const p = presentations.find(x => x.id === id);
        document.getElementById('presentation-municipality').value = p.municipality;
        document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
        document.getElementById('presentation-status').value = p.status;
        
        if (p.orientadores) document.querySelectorAll('.orientador-check').forEach(cb => cb.checked = p.orientadores.includes(cb.value));
        if (p.forms) document.querySelectorAll('.forma-check').forEach(cb => cb.checked = p.forms.includes(cb.value));
    }
    document.getElementById('presentation-modal').classList.add('show');
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

    if (editingId) {
        const i = presentations.findIndex(x => x.id === editingId);
        presentations[i] = { ...presentations[i], ...data };
    } else {
        presentations.push({ id: getNextId('pres'), ...data });
    }
    salvarNoArmazenamento('presentations', presentations);
    document.getElementById('presentation-modal').classList.remove('show');
    renderPresentations();
    showToast('Salvo!');
}

function renderPresentations() {
    const fMun = document.getElementById('filter-presentation-municipality') ? document.getElementById('filter-presentation-municipality').value : '';
    const fStatus = document.getElementById('filter-presentation-status') ? document.getElementById('filter-presentation-status').value : '';
    
    let filtered = presentations.filter(p => {
        if(fMun && p.municipality !== fMun) return false;
        if(fStatus && p.status !== fStatus) return false;
        return true;
    });

    const c = document.getElementById('presentations-table');
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(p => `
            <tr>
                <td>${p.municipality}</td>
                <td>${formatDate(p.dateSolicitacao)}</td>
                <td>${p.status}</td>
                <td>${p.orientadores}</td>
                <td>
                    <button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data</th><th>Status</th><th>Orientadores</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-presentations')) document.getElementById('total-presentations').textContent = filtered.length;
    
    if(document.getElementById('presentationStatusChart') && window.Chart) {
        if(charts.presentationStatus) charts.presentationStatus.destroy();
        charts.presentationStatus = new Chart(document.getElementById('presentationStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Cancelada'], 
                datasets: [{ 
                    data: [
                        filtered.filter(p=>p.status==='Pendente').length,
                        filtered.filter(p=>p.status==='Realizada').length,
                        filtered.filter(p=>p.status==='Cancelada').length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
}

function deletePresentation(id) {
    if (confirm('Excluir?')) {
        presentations = presentations.filter(x => x.id !== id);
        salvarNoArmazenamento('presentations', presentations);
        renderPresentations();
    }
}

function closePresentationModal() {
    document.getElementById('presentation-modal').classList.remove('show');
}

function clearPresentationFilters() {
    if(document.getElementById('filter-presentation-municipality')) document.getElementById('filter-presentation-municipality').value = '';
    if(document.getElementById('filter-presentation-status')) document.getElementById('filter-presentation-status').value = '';
    renderPresentations();
}

// =====================================================
// 15. VERSÕES (CHANGELOG)
// =====================================================
function showVersionModal(id = null) {
    editingId = id;
    document.getElementById('version-form').reset();
    
    // Popula Select de Módulos para o Changelog
    const modSelect = document.getElementById('version-module');
    if(modSelect) {
        let html = '<option value="Geral">Geral / Sistema Todo</option>';
        modulos.forEach(m => html += `<option value="${m.name}">${m.name}</option>`);
        modSelect.innerHTML = html;
    }

    if (id) {
        const v = systemVersions.find(x => x.id === id);
        document.getElementById('version-date').value = v.date;
        document.getElementById('version-number').value = v.version;
        document.getElementById('version-type').value = v.type;
        document.getElementById('version-module').value = v.module;
        document.getElementById('version-description').value = v.description;
    }
    document.getElementById('version-modal').classList.add('show');
}

function saveVersion(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('version-date').value,
        version: document.getElementById('version-number').value,
        type: document.getElementById('version-type').value,
        module: document.getElementById('version-module').value,
        description: document.getElementById('version-description').value,
        author: currentUser.name
    };

    if (editingId) {
        const i = systemVersions.findIndex(x => x.id === editingId);
        systemVersions[i] = { ...systemVersions[i], ...data };
    } else {
        systemVersions.push({ id: getNextId('ver'), ...data });
    }
    salvarNoArmazenamento('systemVersions', systemVersions);
    document.getElementById('version-modal').classList.remove('show');
    renderVersions();
    showToast('Salvo!');
}

function renderVersions() {
    const c = document.getElementById('versions-table');
    if (!c) return;
    
    // Filtros
    const fType = document.getElementById('filter-version-type') ? document.getElementById('filter-version-type').value : '';
    const fMod = document.getElementById('filter-version-module') ? document.getElementById('filter-version-module').value.toLowerCase() : '';
    const fYear = document.getElementById('filter-version-year') ? document.getElementById('filter-version-year').value : '';

    let filtered = systemVersions.filter(v => {
        if(fType && v.type !== fType) return false;
        if(fMod && !v.module.toLowerCase().includes(fMod)) return false;
        if(fYear && !v.date.startsWith(fYear)) return false;
        return true;
    });
    
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma versão registrada.</div>';
        return;
    }
    const rows = filtered.map(v => `
        <tr>
            <td>${formatDate(v.date)}</td>
            <td>${v.version}</td>
            <td>${v.type}</td>
            <td>${v.module}</td>
            <td>${v.description}</td>
            <td>
                <button class="btn btn--sm" onclick="showVersionModal(${v.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteVersion(${v.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Data</th><th>Versão</th><th>Tipo</th><th>Módulo</th><th>Descrição</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteVersion(id) {
    if (confirm('Excluir?')) {
        systemVersions = systemVersions.filter(x => x.id !== id);
        salvarNoArmazenamento('systemVersions', systemVersions);
        renderVersions();
    }
}

function closeVersionModal() {
    document.getElementById('version-modal').classList.remove('show');
}

// =====================================================
// 16. CONFIGURAÇÕES E LISTAGENS EXPANDIDAS
// =====================================================

// Lista Mestra
function showMunicipalityListModal(id = null) {
    editingId = id;
    document.getElementById('municipality-list-form').reset();
    if (id) {
        const m = municipalitiesList.find(x => x.id === id);
        document.getElementById('municipality-list-name').value = m.name;
        document.getElementById('municipality-list-uf').value = m.uf;
    }
    document.getElementById('municipality-list-modal').classList.add('show');
}

function saveMunicipalityList(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('municipality-list-name').value,
        uf: document.getElementById('municipality-list-uf').value
    };
    if (editingId) {
        const i = municipalitiesList.findIndex(x => x.id === editingId);
        municipalitiesList[i] = { ...municipalitiesList[i], ...data };
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
    const rows = municipalitiesList.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.uf}</td>
            <td>
                <button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Nome</th><th>UF</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteMunicipalityList(id) {
    if (confirm('Excluir?')) {
        municipalitiesList = municipalitiesList.filter(x => x.id !== id);
        salvarNoArmazenamento('municipalitiesList', municipalitiesList);
        renderMunicipalityList();
        updateGlobalDropdowns();
    }
}

function closeMunicipalityListModal() {
    document.getElementById('municipality-list-modal').classList.remove('show');
}

// Cargos
function showCargoModal(id = null) {
    editingId = id;
    document.getElementById('cargo-form').reset();
    if (id) {
        const c = cargos.find(x => x.id === id);
        document.getElementById('cargo-name').value = c.name;
        if (document.getElementById('cargo-description')) document.getElementById('cargo-description').value = c.description;
    }
    document.getElementById('cargo-modal').classList.add('show');
}

function saveCargo(e) {
    e.preventDefault();
    const name = document.getElementById('cargo-name').value;
    const desc = document.getElementById('cargo-description') ? document.getElementById('cargo-description').value : '';
    
    if (!editingId && cargos.some(c => c.name === name)) {
        alert('Cargo já existe!');
        return;
    }
    
    const data = { name: name, description: desc };
    
    if (editingId) {
        const i = cargos.findIndex(x => x.id === editingId);
        cargos[i] = { ...cargos[i], ...data };
    } else {
        cargos.push({ id: getNextId('cargo'), ...data });
    }
    salvarNoArmazenamento('cargos', cargos);
    document.getElementById('cargo-modal').classList.remove('show');
    renderCargos();
}

function renderCargos() {
    const c = document.getElementById('cargos-table');
    const rows = cargos.map(x => `
        <tr>
            <td>${x.name}</td>
            <td>${x.description || '-'}</td>
            <td>
                <button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Cargo</th><th>Descrição</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteCargo(id) {
    if (confirm('Excluir?')) {
        cargos = cargos.filter(x => x.id !== id);
        salvarNoArmazenamento('cargos', cargos);
        renderCargos();
    }
}

function closeCargoModal() {
    document.getElementById('cargo-modal').classList.remove('show');
}

// Orientadores
function showOrientadorModal(id = null) {
    editingId = id;
    document.getElementById('orientador-form').reset();
    if (id) {
        const o = orientadores.find(x => x.id === id);
        document.getElementById('orientador-name').value = o.name;
        document.getElementById('orientador-contact').value = o.contact;
        if (document.getElementById('orientador-email')) document.getElementById('orientador-email').value = o.email;
    }
    document.getElementById('orientador-modal').classList.add('show');
}

function saveOrientador(e) {
    e.preventDefault();
    const name = document.getElementById('orientador-name').value;
    const contact = document.getElementById('orientador-contact').value;
    const email = document.getElementById('orientador-email') ? document.getElementById('orientador-email').value : '';
    
    if (!editingId && orientadores.some(o => o.name === name)) {
        alert('Orientador já existe!');
        return;
    }
    
    const data = { name: name, contact: contact, email: email };
    
    if (editingId) {
        const i = orientadores.findIndex(x => x.id === editingId);
        orientadores[i] = { ...orientadores[i], ...data };
    } else {
        orientadores.push({ id: getNextId('orient'), ...data });
    }
    salvarNoArmazenamento('orientadores', orientadores);
    document.getElementById('orientador-modal').classList.remove('show');
    renderOrientadores();
}

function renderOrientadores() {
    const c = document.getElementById('orientadores-table');
    const rows = orientadores.map(x => `
        <tr>
            <td>${x.name}</td>
            <td>${x.contact}</td>
            <td>${x.email || '-'}</td>
            <td>
                <button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Nome</th><th>Contato</th><th>Email</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteOrientador(id) {
    if (confirm('Excluir?')) {
        orientadores = orientadores.filter(x => x.id !== id);
        salvarNoArmazenamento('orientadores', orientadores);
        renderOrientadores();
    }
}

function closeOrientadorModal() {
    document.getElementById('orientador-modal').classList.remove('show');
}

// Módulos
function showModuloModal(id = null) {
    editingId = id;
    document.getElementById('modulo-form').reset();
    
    // INJEÇÃO AUTOMÁTICA DO CAMPO DESCRIÇÃO
    const form = document.getElementById('modulo-form');
    if (!document.getElementById('modulo-description')) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label class="form-label">Descrição do Módulo* (Máx 250)</label><textarea class="form-control" id="modulo-description" rows="3" maxlength="250" required></textarea>`;
        const btns = form.querySelector('.modal-actions');
        form.insertBefore(div, btns);
    }

    if (id) {
        const m = modulos.find(x => x.id === id);
        document.getElementById('modulo-name').value = m.name;
        if (document.getElementById('modulo-abbreviation')) document.getElementById('modulo-abbreviation').value = m.abbreviation;
        if (document.getElementById('modulo-description')) document.getElementById('modulo-description').value = m.description || '';
    }
    document.getElementById('modulo-modal').classList.add('show');
}

function saveModulo(e) {
    e.preventDefault();
    const name = document.getElementById('modulo-name').value;
    const abbr = document.getElementById('modulo-abbreviation') ? document.getElementById('modulo-abbreviation').value : name.substring(0, 3).toUpperCase();
    const desc = document.getElementById('modulo-description') ? document.getElementById('modulo-description').value : '';
    
    if (!editingId && modulos.some(m => m.name === name)) {
        alert('Módulo já existe!');
        return;
    }
    
    const data = { name: name, abbreviation: abbr, description: desc };
    
    if (editingId) {
        const i = modulos.findIndex(x => x.id === editingId);
        data.color = modulos[i].color || '#4ECDC4';
        modulos[i] = { ...modulos[i], ...data };
    } else {
        data.color = '#4ECDC4';
        modulos.push({ id: getNextId('mod'), ...data });
    }
    salvarNoArmazenamento('modulos', modulos);
    document.getElementById('modulo-modal').classList.remove('show');
    renderModulos();
}

function renderModulos() {
    const c = document.getElementById('modulos-table');
    const rows = modulos.map(x => `
        <tr>
            <td>${x.name}</td>
            <td>${x.abbreviation || '-'}</td>
            <td>${x.description || '-'}</td>
            <td>
                <button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Módulo</th><th>Abrev.</th><th>Descrição</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteModulo(id) {
    if (confirm('Excluir?')) {
        modulos = modulos.filter(x => x.id !== id);
        salvarNoArmazenamento('modulos', modulos);
        renderModulos();
    }
}

function closeModuloModal() {
    document.getElementById('modulo-modal').classList.remove('show');
}

// Formas
function showFormaApresentacaoModal(id = null) {
    editingId = id;
    document.getElementById('forma-apresentacao-form').reset();
    if (id) {
        const f = formasApresentacao.find(x => x.id === id);
        document.getElementById('forma-apresentacao-name').value = f.name;
    }
    document.getElementById('forma-apresentacao-modal').classList.add('show');
}

function saveFormaApresentacao(e) {
    e.preventDefault();
    const name = document.getElementById('forma-apresentacao-name').value;
    
    if (!editingId && formasApresentacao.some(f => f.name === name)) {
        alert('Forma já existe!');
        return;
    }
    
    const data = { name: name };
    
    if (editingId) {
        const i = formasApresentacao.findIndex(x => x.id === editingId);
        formasApresentacao[i] = { ...formasApresentacao[i], ...data };
    } else {
        formasApresentacao.push({ id: getNextId('forma'), ...data });
    }
    salvarNoArmazenamento('formasApresentacao', formasApresentacao);
    document.getElementById('forma-apresentacao-modal').classList.remove('show');
    renderFormas();
}

function renderFormas() {
    const c = document.getElementById('formas-apresentacao-table');
    const rows = formasApresentacao.map(x => `
        <tr>
            <td>${x.name}</td>
            <td>
                <button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    c.innerHTML = `<table><thead><th>Forma</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteForma(id) {
    if (confirm('Excluir?')) {
        formasApresentacao = formasApresentacao.filter(x => x.id !== id);
        salvarNoArmazenamento('formasApresentacao', formasApresentacao);
        renderFormas();
    }
}

function closeFormaApresentacaoModal() {
    document.getElementById('forma-apresentacao-modal').classList.remove('show');
}

// =====================================================
// 17. BACKUP E RESTAURAÇÃO
// =====================================================
function updateBackupInfo() {
    if (document.getElementById('backup-info-municipalities')) {
        document.getElementById('backup-info-municipalities').textContent = municipalities.length;
    }
    if (document.getElementById('backup-info-trainings')) {
        document.getElementById('backup-info-trainings').textContent = tasks.length;
    }
}

function createBackup() {
    const backupData = {
        version: "v12.0",
        date: new Date().toISOString(),
        data: {
            users, municipalities, municipalitiesList, tasks, requests, demands, visits, productions, presentations, systemVersions, cargos, orientadores, modulos, formasApresentacao, counters
        }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "backup_sigp_saude_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('Backup baixado com sucesso!', 'success');
}

function triggerRestoreBackup() {
    document.getElementById('backup-file-input').click();
}

function handleBackupFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.data) {
                if (confirm('ATENÇÃO: A restauração substituirá TODOS os dados atuais do sistema. Deseja continuar?')) {
                    Object.keys(backup.data).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(backup.data[key]));
                    });
                    alert('Sistema restaurado com sucesso! A página será recarregada.');
                    location.reload();
                }
            } else {
                alert('Arquivo de backup inválido.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao ler arquivo de backup.');
        }
    };
    reader.readAsText(file);
}

// =====================================================
// 18. DASHBOARD E GRÁFICOS
// =====================================================
function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(m => m.status === 'Em uso').length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(t => t.status === 'Concluído').length;
    document.getElementById('dashboard-requests-completed').textContent = requests.filter(r => r.status === 'Realizado').length;
    document.getElementById('dashboard-presentations-completed').textContent = presentations.filter(p => p.status === 'Realizada').length;
}

function initializeDashboardCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if (!ctx || !window.Chart) return;

    if (charts.dashboard) {
        charts.dashboard.destroy();
    }

    const dataMap = {};
    municipalities.forEach(m => {
        if (m.implantationDate) {
            const year = m.implantationDate.split('-')[0];
            dataMap[year] = (dataMap[year] || 0) + 1;
        }
    });
    
    const years = Object.keys(dataMap).sort();
    const counts = years.map(y => dataMap[y]);
    
    // Gera cores diferentes para cada ano
    const bgColors = years.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    charts.dashboard = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Implantações',
                data: counts,
                backgroundColor: bgColors,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// =====================================================
// 19. INICIALIZAÇÃO E HELPERS FINAIS
// =====================================================
function populateSelect(select, data, valKey, textKey) {
    if (!select) return;
    const current = select.value;
    let html = '<option value="">Selecione...</option>';
    data.sort((a, b) => a[textKey].localeCompare(b[textKey])).forEach(i => {
        html += `<option value="${i[valKey]}">${i[textKey]}</option>`;
    });
    select.innerHTML = html;
    select.value = current;
}

function populateFilterSelects() {
    // Filtros de Município
    const filterMuns = document.getElementById('filter-municipality-name');
    if(filterMuns) {
        let html = '<option value="">Todos</option>';
        municipalities.sort((a,b)=>a.name.localeCompare(b.name)).forEach(m => {
            html += `<option value="${m.name}">${m.name}</option>`;
        });
        filterMuns.innerHTML = html;
    }
    
    // Filtros de Módulo
    const filterMods = document.getElementById('filter-municipality-module');
    if(filterMods) {
        let html = '<option value="">Todos</option>';
        modulos.forEach(m => {
            html += `<option value="${m.name}">${m.name}</option>`;
        });
        filterMods.innerHTML = html;
    }
    
    // Outros filtros de município nas abas
    ['filter-task-municipality', 'filter-request-municipality', 'filter-visit-municipality', 'filter-production-municipality', 'filter-presentation-municipality'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            let html = '<option value="">Todos</option>';
            municipalities.sort((a,b)=>a.name.localeCompare(b.name)).forEach(m => {
                html += `<option value="${m.name}">${m.name}</option>`;
            });
            el.innerHTML = html;
        }
    });
}

function updateGlobalDropdowns() {
    const activeMuns = municipalities.filter(m => m.status === 'Em uso');
    ['task-municipality', 'request-municipality', 'visit-municipality', 'production-municipality', 'presentation-municipality'].forEach(id => {
        populateSelect(document.getElementById(id), activeMuns, 'name', 'name');
    });
    populateFilterSelects();
}

function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    applyMasks();
    
    // Render Inicial
    renderMunicipalities();
    renderTasks();
    renderVersions();
    
    updateGlobalDropdowns();
    updateDashboardStats();
    initializeDashboardCharts();
    
    if (!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    
    window.onclick = (e) => { if (e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function() { this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if (b.textContent.includes('Cancelar')) b.onclick = function() { this.closest('.modal').classList.remove('show'); } });
});
