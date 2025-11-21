// =====================================================
// SIGP SAÚDE v5.1 - CORREÇÃO DE MENUS E MÁSCARAS
// =====================================================

// 1. VERIFICAÇÃO DE DEPENDÊNCIAS
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada.');
}

// =====================================================
// 2. CONFIGURAÇÕES E UTILITÁRIOS
// =====================================================
const SALT_LENGTH = 16;

function generateSalt() { return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString(); }
function hashPassword(password, salt) { return CryptoJS.SHA256(salt + password).toString(); }

// Armazenamento
function salvarNoArmazenamento(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
        if (erro.name === 'QuotaExceededError') alert('⚠️ Armazenamento cheio!');
    }
}

function recuperarDoArmazenamento(chave, valorPadrao = null) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : valorPadrao;
    } catch (erro) { return valorPadrao; }
}

function deletarDoArmazenamento(chave) { localStorage.removeItem(chave); }

function formatDate(dateString) {
    if (!dateString) return '-';
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// =====================================================
// 3. MÁSCARAS E REGRAS DE FORMATAÇÃO (CORRIGIDO)
// =====================================================

// Máscara de Telefone: (XX) 9XXXX-XXXX
function maskPhone(e) {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    e.target.value = v.substring(0, 15);
}

// Máscara Competência: 10/2025
function maskCompetencia(e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    e.target.value = v.substring(0, 7); // Limita MM/AAAA
}

// Máscara Período: 01/10 à 31/10
function maskPeriodo(e) {
    let v = e.target.value.replace(/\D/g, ""); // Remove tudo que não é dígito
    
    // Formata progressivamente
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2"); // 01/1
    if (v.length > 4) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2 à $3"); // 01/10 à 3
    if (v.length > 6) v = v.replace(/ à (\d{2})(\d)/, " à $1/$2"); // 01/10 à 31/1
    
    e.target.value = v.substring(0, 15); // Limita tamanho total
}

// Ativar todas as máscaras
function setupMasks() {
    // Telefones (Todos os IDs de telefone do sistema)
    const phoneIds = ['municipality-contact', 'task-contact', 'orientador-contact', 'request-contact', 'production-contact'];
    phoneIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', maskPhone);
    });

    // Produção - Competência
    const elComp = document.getElementById('production-competence');
    if(elComp) elComp.addEventListener('input', maskCompetencia);

    // Produção - Período
    const elPeriod = document.getElementById('production-period');
    if(elPeriod) elPeriod.addEventListener('input', maskPeriodo);
}

// =====================================================
// 4. DADOS E ESTADO GLOBAL
// =====================================================
const DADOS_PADRAO = {
    users: [{ id: 1, login: 'ADMIN', name: 'Administrador', salt: null, passwordHash: null, permission: 'Administrador', status: 'Ativo', mustChangePassword: true }],
    modulos: [
        { name: 'Cadastros', color: '#FF6B6B', abbreviation: 'CAD' }, 
        { name: 'TFD', color: '#4ECDC4', abbreviation: 'TFD' },
        { name: 'Prontuário', color: '#45B7D1', abbreviation: 'PEC' },
        { name: 'Administração', color: '#FFA07A', abbreviation: 'ADM' }
    ]
};

let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);
// Correção senha admin se necessário
if (users[0].login === 'ADMIN' && !users[0].passwordHash) {
    users[0].salt = generateSalt();
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');
let editingId = null;

// Arrays de Dados
let municipalities = recuperarDoArmazenamento('municipalities', []);
let municipalitiesList = recuperarDoArmazenamento('municipalitiesList', []); 
let tasks = recuperarDoArmazenamento('tasks', []);
let requests = recuperarDoArmazenamento('requests', []);
let demands = recuperarDoArmazenamento('demands', []);
let visits = recuperarDoArmazenamento('visits', []);
let productions = recuperarDoArmazenamento('productions', []);
let presentations = recuperarDoArmazenamento('presentations', []);
let versions = recuperarDoArmazenamento('systemVersions', []);
let cargos = recuperarDoArmazenamento('cargos', []);
let orientadores = recuperarDoArmazenamento('orientadores', []);
let modulos = recuperarDoArmazenamento('modulos', DADOS_PADRAO.modulos);
let formasApresentacao = recuperarDoArmazenamento('formasApresentacao', []);

// IDs
let counters = recuperarDoArmazenamento('counters', { mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1 });
function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// =====================================================
// 5. AUTENTICAÇÃO E INTERFACE (CORREÇÃO DOS MENUS)
// =====================================================
function updateUserInterface() {
    if (!currentUser) return;

    // 1. Atualiza nome
    const elName = document.getElementById('logged-user-name');
    if(elName) elName.textContent = currentUser.name;

    // 2. Lógica de Exibição dos Botões de Menu (CORREÇÃO AQUI)
    const isAdmin = currentUser.permission === 'Administrador';
    
    // Lista de IDs dos botões no menu dropdown
    const menuItems = [
        { id: 'user-management-menu-btn', adminOnly: true },
        { id: 'cargo-management-menu-btn', adminOnly: false },
        { id: 'orientador-management-menu-btn', adminOnly: false },
        { id: 'modulo-management-menu-btn', adminOnly: false },
        { id: 'municipality-list-management-menu-btn', adminOnly: false },
        { id: 'forma-apresentacao-management-menu-btn', adminOnly: false },
        { id: 'backup-menu-btn', adminOnly: false },
        { id: 'admin-divider', adminOnly: true } // A linha divisória
    ];

    menuItems.forEach(item => {
        const el = document.getElementById(item.id);
        if(el) {
            // Se for adminOnly, só mostra se for admin. Se não, mostra pra todo mundo.
            if (item.adminOnly && !isAdmin) {
                el.style.display = 'none';
            } else {
                el.style.display = 'flex'; // ou 'block' para o divider
                if (item.id === 'admin-divider') el.style.display = 'block';
            }
        }
    });
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
        document.getElementById('login-error').textContent = 'Dados incorretos.';
    }
}

function handleLogout() {
    if(confirm('Sair do sistema?')) {
        localStorage.removeItem('currentUser');
        location.reload();
    }
}

// Navegação
function navigateToHome() {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('dashboard-section').classList.add('active');
    
    const dashBtn = document.querySelector('[data-tab="dashboard"]');
    if(dashBtn) dashBtn.classList.add('active');
    
    updateDashboardStats();
    // Se tiver gráficos, chama updateCharts() aqui
}

function toggleSettingsMenu() {
    document.getElementById('settings-menu').classList.toggle('show');
}

// Helpers de Navegação do Menu
function navigateToUserManagement() { toggleSettingsMenu(); openTab('usuarios-section'); renderUsers(); }
function navigateToCargoManagement() { toggleSettingsMenu(); openTab('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettingsMenu(); openTab('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettingsMenu(); openTab('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettingsMenu(); openTab('municipalities-list-section'); renderMunicipalityList(); }
function navigateToFormaApresentacaoManagement() { toggleSettingsMenu(); openTab('formas-apresentacao-section'); renderFormas(); }
function navigateToBackupManagement() { toggleSettingsMenu(); openTab('backup-section'); updateBackupInfo(); }
function showChangePasswordModal() { toggleSettingsMenu(); document.getElementById('change-password-modal').classList.add('show'); }

function openTab(sectionId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// =====================================================
// 6. CRUDs E LÓGICA DE NEGÓCIO
// =====================================================

// --- MUNICÍPIOS (CARTEIRA) ---
function showMunicipalityModal(id = null) {
    const modal = document.getElementById('municipality-modal');
    document.getElementById('municipality-form').reset();
    editingId = id;
    
    // Popula o select com a Lista Mestra
    const select = document.getElementById('municipality-name');
    populateSelect(select, municipalitiesList, 'name', 'name');

    if(id) {
        const item = municipalities.find(m => m.id === id);
        if(item) {
            select.value = item.name;
            document.getElementById('municipality-status').value = item.status;
            document.getElementById('municipality-manager').value = item.manager;
            document.getElementById('municipality-contact').value = item.contact;
            document.getElementById('municipality-implantation-date').value = item.implantationDate;
            document.getElementById('municipality-last-visit').value = item.lastVisit;
            if(item.modules) document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = item.modules.includes(cb.value));
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
        const idx = municipalities.findIndex(m => m.id === editingId);
        municipalities[idx] = { ...municipalities[idx], ...data };
    } else {
        municipalities.push({ id: getNextId('mun'), ...data });
    }
    salvarNoArmazenamento('municipalities', municipalities);
    document.getElementById('municipality-modal').classList.remove('show');
    renderMunicipalities();
    updateGlobalDropdowns();
    showToast('Município salvo!');
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
        container.innerHTML = '<div class="empty-state">Nenhum município encontrado.</div>';
    } else {
        const rows = filtered.map(m => `
            <tr>
                <td>${m.name}</td>
                <td>${m.modules.join(', ')}</td>
                <td>${m.manager}</td>
                <td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td>
                <td>${m.status}</td>
                <td>
                    <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteItem('municipalities', ${m.id}, renderMunicipalities)">🗑️</button>
                </td>
            </tr>`).join('');
        container.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    // Atualiza contadores
    const countDiv = document.getElementById('municipalities-results-count');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML = `<strong>${filtered.length}</strong> registros.`; }
}

// --- TREINAMENTOS ---
function showTaskModal(id = null) {
    const modal = document.getElementById('task-modal');
    document.getElementById('task-form').reset();
    editingId = id;
    updateGlobalDropdowns();
    if(id) {
        const t = tasks.find(x => x.id === id);
        if(t) {
            document.getElementById('task-date-requested').value = t.dateRequested;
            document.getElementById('task-municipality').value = t.municipality;
            document.getElementById('task-requested-by').value = t.requestedBy;
            document.getElementById('task-performed-by').value = t.performedBy;
            document.getElementById('task-trained-name').value = t.trainedName;
            document.getElementById('task-trained-position').value = t.trainedPosition;
            document.getElementById('task-status').value = t.status;
            document.getElementById('task-observations').value = t.observations;
            document.getElementById('task-contact').value = t.contact;
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
        observations: document.getElementById('task-observations').value,
    };
    saveGeneric('tasks', 'task', data, renderTasks, 'task-modal');
}

function renderTasks() {
    const container = document.getElementById('tasks-table');
    renderTableGeneric(container, tasks, ['Data Sol.', 'Município', 'Solicitante', 'Instrutor', 'Treinado', 'Status', 'Ações'], (item) => `
        <td>${formatDate(item.dateRequested)}</td>
        <td>${item.municipality}</td>
        <td>${item.requestedBy}</td>
        <td>${item.performedBy}</td>
        <td>${item.trainedName}</td>
        <td>${item.status}</td>
        <td>
            <button class="btn btn--sm" onclick="showTaskModal(${item.id})">✏️</button>
            <button class="btn btn--sm" onclick="deleteItem('tasks', ${item.id}, renderTasks)">🗑️</button>
        </td>
    `);
}

// --- PRODUÇÃO ---
function showProductionModal(id = null) {
    const modal = document.getElementById('production-modal');
    document.getElementById('production-form').reset();
    editingId = id;
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
        }
    }
    modal.classList.add('show');
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
        status: document.getElementById('production-status').value
    };
    saveGeneric('productions', 'prod', data, renderProductions, 'production-modal');
}

function renderProductions() {
    const container = document.getElementById('productions-table');
    renderTableGeneric(container, productions, ['Município', 'Competência', 'Período', 'Status', 'Ações'], (item) => `
        <td>${item.municipality}</td>
        <td>${item.competence}</td>
        <td>${item.period}</td>
        <td>${item.status}</td>
        <td>
            <button class="btn btn--sm" onclick="showProductionModal(${item.id})">✏️</button>
            <button class="btn btn--sm" onclick="deleteItem('productions', ${item.id}, renderProductions)">🗑️</button>
        </td>
    `);
}

// --- OUTROS MÓDULOS (Padrão) ---
function showRequestModal(id){ showGenericFormModal('request', id, requests); }
function saveRequest(e){ e.preventDefault(); saveGeneric('requests', 'req', getFormData('request', ['date','municipality','requester','contact','description','status']), renderRequests, 'request-modal'); }
function renderRequests(){ renderTableGeneric(document.getElementById('requests-table'), requests, ['Data','Município','Solicitante','Status','Ações'], (i)=>`<td>${formatDate(i.date)}</td><td>${i.municipality}</td><td>${i.requester}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showRequestModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="deleteItem('requests', ${i.id}, renderRequests)">🗑️</button></td>`); }

function showDemandModal(id){ showGenericFormModal('demand', id, demands); }
function saveDemand(e){ e.preventDefault(); saveGeneric('demands', 'dem', getFormData('demand', ['date','description','priority','status']), renderDemands, 'demand-modal'); }
function renderDemands(){ renderTableGeneric(document.getElementById('demands-table'), demands, ['Data','Descrição','Prioridade','Status','Ações'], (i)=>`<td>${formatDate(i.date)}</td><td>${i.description}</td><td>${i.priority}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showDemandModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="deleteItem('demands', ${i.id}, renderDemands)">🗑️</button></td>`); }

function showVisitModal(id){ showGenericFormModal('visit', id, visits); }
function saveVisit(e){ e.preventDefault(); saveGeneric('visits', 'visit', getFormData('visit', ['municipality','date','applicant','status']), renderVisits, 'visit-modal'); }
function renderVisits(){ renderTableGeneric(document.getElementById('visits-table'), visits, ['Data','Município','Solicitante','Status','Ações'], (i)=>`<td>${formatDate(i.date)}</td><td>${i.municipality}</td><td>${i.applicant}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showVisitModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="deleteItem('visits', ${i.id}, renderVisits)">🗑️</button></td>`); }

function showPresentationModal(id){ showGenericFormModal('presentation', id, presentations); /* Add checkboxes logic if needed */ }
function savePresentation(e){ e.preventDefault(); saveGeneric('presentations', 'pres', getFormData('presentation', ['municipality','date-solicitacao','requester','status']), renderPresentations, 'presentation-modal'); }
function renderPresentations(){ renderTableGeneric(document.getElementById('presentations-table'), presentations, ['Município','Solicitante','Status','Ações'], (i)=>`<td>${i.municipality}</td><td>${i.requester}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showPresentationModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="deleteItem('presentations', ${i.id}, renderPresentations)">🗑️</button></td>`); }

// --- CONFIGURAÇÕES (CRUDs Básicos) ---
// Municípios Lista Mestra
function renderMunicipalityList(){ renderConfigTable('municipalities-list-table', municipalitiesList, 'showMunicipalityListModal', 'deleteItem', 'municipalitiesList'); }
function showMunicipalityListModal(id){ showGenericConfigModal('municipality-list', id, municipalitiesList, ['name','uf']); }
function saveMunicipalityList(e){ e.preventDefault(); saveGeneric('municipalitiesList', 'munList', {name: document.getElementById('municipality-list-name').value, uf: document.getElementById('municipality-list-uf').value}, renderMunicipalityList, 'municipality-list-modal'); updateGlobalDropdowns(); }

// Outros Configs
function renderCargos(){ renderConfigTable('cargos-table', cargos, 'showCargoModal', 'deleteItem', 'cargos'); }
function showCargoModal(id){ showGenericConfigModal('cargo', id, cargos, ['name']); }
function saveCargo(e){ e.preventDefault(); saveGeneric('cargos', 'cargo', {name: document.getElementById('cargo-name').value}, renderCargos, 'cargo-modal'); }

function renderOrientadores(){ renderConfigTable('orientadores-table', orientadores, 'showOrientadorModal', 'deleteItem', 'orientadores'); }
function showOrientadorModal(id){ showGenericConfigModal('orientador', id, orientadores, ['name']); }
function saveOrientador(e){ e.preventDefault(); saveGeneric('orientadores', 'orient', {name: document.getElementById('orientador-name').value}, renderOrientadores, 'orientador-modal'); }

function renderModulos(){ renderConfigTable('modulos-table', modulos, 'showModuloModal', 'deleteItem', 'modulos'); }
function showModuloModal(id){ showGenericConfigModal('modulo', id, modulos, ['name']); }
function saveModulo(e){ e.preventDefault(); saveGeneric('modulos', 'mod', {name: document.getElementById('modulo-name').value}, renderModulos, 'modulo-modal'); }

function renderFormas(){ renderConfigTable('formas-apresentacao-table', formasApresentacao, 'showFormaApresentacaoModal', 'deleteItem', 'formasApresentacao'); }
function showFormaApresentacaoModal(id){ showGenericConfigModal('forma-apresentacao', id, formasApresentacao, ['name']); }
function saveFormaApresentacao(e){ e.preventDefault(); saveGeneric('formasApresentacao', 'forma', {name: document.getElementById('forma-apresentacao-name').value}, renderFormas, 'forma-apresentacao-modal'); }

function renderUsers(){ renderConfigTable('users-table', users, 'showUserModal', 'deleteItem', 'users'); }
// Users tem modal específico, mas pode adaptar

// =====================================================
// 7. HELPERS GENÉRICOS (PARA REDUZIR CÓDIGO)
// =====================================================
function saveGeneric(arrName, idKey, data, renderFunc, modalId) {
    let arr = eval(arrName); // Acesso à variável global
    if(editingId) {
        const idx = arr.findIndex(x => x.id === editingId);
        arr[idx] = { ...arr[idx], ...data };
    } else {
        arr.push({ id: getNextId(idKey), ...data });
    }
    salvarNoArmazenamento(arrName, arr);
    document.getElementById(modalId).classList.remove('show');
    renderFunc();
    showToast('Registro salvo!', 'success');
    updateGlobalDropdowns();
    updateDashboardStats();
}

function deleteItem(arrName, id, renderFunc) {
    if(confirm('Excluir registro?')) {
        let arr = eval(arrName);
        const newArr = arr.filter(x => x.id !== id);
        
        // Hack para atualizar a variável global correta
        switch(arrName) {
            case 'municipalities': municipalities = newArr; break;
            case 'tasks': tasks = newArr; break;
            case 'requests': requests = newArr; break;
            case 'demands': demands = newArr; break;
            case 'visits': visits = newArr; break;
            case 'productions': productions = newArr; break;
            case 'presentations': presentations = newArr; break;
            case 'cargos': cargos = newArr; break;
            case 'orientadores': orientadores = newArr; break;
            case 'modulos': modulos = newArr; break;
            case 'formasApresentacao': formasApresentacao = newArr; break;
            case 'municipalitiesList': municipalitiesList = newArr; break;
        }
        salvarNoArmazenamento(arrName, newArr);
        renderFunc();
        updateGlobalDropdowns();
        updateDashboardStats();
        showToast('Excluído.', 'info');
    }
}

function renderTableGeneric(container, data, headers, rowFn) {
    if(!container) return;
    if(!data || data.length === 0) { container.innerHTML = '<div class="empty-state">Nenhum registro.</div>'; return; }
    
    const h = headers.map(t=>`<th>${t}</th>`).join('');
    const b = data.map(i => `<tr>${rowFn(i)}</tr>`).join('');
    container.innerHTML = `<table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>`;
    
    // Atualiza contador vizinho se existir
    const countDiv = container.previousElementSibling;
    if(countDiv && countDiv.classList.contains('results-count')) {
        countDiv.style.display = 'block';
        countDiv.innerHTML = `<strong>${data.length}</strong> registros.`;
    }
}

function showGenericFormModal(prefix, id, arr) {
    const modal = document.getElementById(`${prefix}-modal`);
    document.getElementById(`${prefix}-form`).reset();
    editingId = id;
    updateGlobalDropdowns();
    if(id) {
        const item = arr.find(x => x.id === id);
        if(item) {
            // Preenchimento básico: tenta achar inputs com id "prefix-key"
            Object.keys(item).forEach(key => {
                const el = document.getElementById(`${prefix}-${key}`);
                if(el) el.value = item[key];
            });
        }
    }
    modal.classList.add('show');
}

function getFormData(prefix, fields) {
    let d = {};
    fields.forEach(f => {
        const el = document.getElementById(`${prefix}-${f}`);
        if(el) d[f] = el.value;
    });
    return d;
}

function renderConfigTable(contId, data, editFnName, delFnName, arrName) {
    const c = document.getElementById(contId);
    if(!c) return;
    if(data.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; return; }
    const rows = data.map(i => `<tr><td>${i.name}</td><td><button class="btn btn--sm" onclick="${editFnName}(${i.id})">✏️</button><button class="btn btn--sm" onclick="${delFnName}('${arrName}', ${i.id}, ${editFnName.replace('show','render').replace('Modal','s')})">🗑️</button></td></tr>`).join('');
    c.innerHTML = `<table><thead><th>Nome</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function showGenericConfigModal(prefix, id, arr, fields) {
    const m = document.getElementById(`${prefix}-modal`);
    document.getElementById(`${prefix}-form`).reset();
    editingId = id;
    if(id) {
        const item = arr.find(x => x.id === id);
        fields.forEach(f => document.getElementById(`${prefix}-${f}`).value = item[f]);
    }
    m.classList.add('show');
}

// =====================================================
// 8. DROPDOWNS E AUXILIARES
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
    // Popula select de municípios nas telas operacionais
    const muns = municipalities.filter(m => m.status === 'Em uso');
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(id => {
        populateSelect(document.getElementById(id), muns, 'name', 'name');
    });
    
    // Filtros
    populateSelect(document.getElementById('filter-municipality-name'), municipalities, 'name', 'name');
    // Filtros de Módulo
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
}

// =====================================================
// 9. INICIALIZAÇÃO
// =====================================================
function initializeApp() {
    updateUserInterface();
    initializeTabs();
    setupMasks(); // Ativa máscaras
    
    renderMunicipalities();
    renderTasks();
    // Outros renders conforme aba ativa
    
    updateGlobalDropdowns();
    updateDashboardStats();
    
    // Navega para a Home ou Aba Ativa
    const active = document.querySelector('.sidebar-btn.active');
    if(!active) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    
    // Listener para fechar modais no X e fora
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); } });
    
    // Listener para Abas do Sidebar
    initializeTabs();
});
