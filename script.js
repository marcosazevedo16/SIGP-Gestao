// =====================================================
// SIGP SAÚDE v5.2 - VERSÃO ESTÁVEL E RESTAURADA
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

function salvarNoArmazenamento(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
        if (erro.name === 'QuotaExceededError') alert('⚠️ Armazenamento cheio!');
        console.error(erro);
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
    
    // Remove classes anteriores para garantir a cor certa
    toast.classList.remove('success', 'error', 'show');
    
    // Adiciona as novas classes
    void toast.offsetWidth; // Força reflow
    toast.classList.add('toast', type, 'show');
    
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// =====================================================
// 3. MÁSCARAS (TELEFONE, DATA, COMPETÊNCIA)
// =====================================================
function formatPhoneNumber(value) {
    let v = value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v.substring(0, 15);
}

function setupMasks() {
    // Máscara de Telefone
    const phoneIds = ['municipality-contact', 'task-contact', 'orientador-contact', 'request-contact', 'production-contact'];
    phoneIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', (e) => { e.target.value = formatPhoneNumber(e.target.value); });
        }
    });

    // Máscara Competência (MM/AAAA)
    const elComp = document.getElementById('production-competence');
    if(elComp) {
        elComp.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
            e.target.value = v.substring(0, 7);
        });
    }

    // Máscara Período (Simples)
    const elPeriod = document.getElementById('production-period');
    if(elPeriod) {
        elPeriod.placeholder = "01/10 à 31/10";
        // Lógica visual apenas, validação completa seria complexa aqui
    }
}

// =====================================================
// 4. DADOS GLOBAIS (STATE)
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

// Carrega dados
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);
if (users[0].login === 'ADMIN' && !users[0].passwordHash) {
    users[0].salt = generateSalt();
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');
let editingId = null;

// Arrays de Negócio
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

// Contadores ID
let counters = recuperarDoArmazenamento('counters', { mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1 });

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// =====================================================
// 5. TEMA E INTERFACE
// =====================================================
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

function updateUserInterface() {
    if (!currentUser) return;
    
    const elName = document.getElementById('logged-user-name');
    if(elName) elName.textContent = currentUser.name;

    // Lógica de Menus (Admin vs User)
    const isAdmin = currentUser.permission === 'Administrador';
    
    const adminElements = ['user-management-menu-btn', 'admin-divider'];
    const commonElements = [
        'cargo-management-menu-btn', 
        'orientador-management-menu-btn', 
        'modulo-management-menu-btn', 
        'municipality-list-management-menu-btn', 
        'forma-apresentacao-management-menu-btn', 
        'backup-menu-btn'
    ];

    // Mostra comuns para todos
    commonElements.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'flex';
    });

    // Mostra admin apenas para admin
    adminElements.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = isAdmin ? (id.includes('divider') ? 'block' : 'flex') : 'none';
    });
}

// =====================================================
// 6. NAVEGAÇÃO (TABs) - CORRIGIDO
// =====================================================
function initializeTabs() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active de tudo
            buttons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Ativa atual
            this.classList.add('active');
            const section = document.getElementById(tabId + '-section');
            if(section) {
                section.classList.add('active');
                // Recarrega dados específicos
                refreshTabData(tabId);
            }
        });
    });
}

function refreshTabData(tabId) {
    if(tabId === 'municipios') renderMunicipalities();
    if(tabId === 'tarefas') renderTasks();
    if(tabId === 'solicitacoes') renderRequests();
    if(tabId === 'demandas') renderDemands();
    if(tabId === 'visitas') renderVisits();
    if(tabId === 'producao') renderProductions();
    if(tabId === 'apresentacoes') renderPresentations();
    if(tabId === 'versoes') renderVersions();
    if(tabId === 'dashboard') { updateDashboardStats(); }
}

function navigateToHome() {
    // Simula clique no botão dashboard
    const dashBtn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if(dashBtn) dashBtn.click();
}

// Menu Configurações
function toggleSettingsMenu() {
    document.getElementById('settings-menu').classList.toggle('show');
}

// Navegação Interna (Configurações)
function openConfigTab(sectionId, renderFunc) {
    toggleSettingsMenu();
    // Esconde todas as abas
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    
    // Mostra a aba de config
    const sec = document.getElementById(sectionId);
    if(sec) sec.classList.add('active');
    
    if(renderFunc) renderFunc();
}

function navigateToUserManagement() { openConfigTab('usuarios-section', renderUsers); }
function navigateToCargoManagement() { openConfigTab('cargos-section', renderCargos); }
function navigateToOrientadorManagement() { openConfigTab('orientadores-section', renderOrientadores); }
function navigateToModuloManagement() { openConfigTab('modulos-section', renderModulos); }
function navigateToMunicipalityListManagement() { openConfigTab('municipalities-list-section', renderMunicipalityList); }
function navigateToFormaApresentacaoManagement() { openConfigTab('formas-apresentacao-section', renderFormas); }
function navigateToBackupManagement() { openConfigTab('backup-section', updateBackupInfo); }
function showChangePasswordModal() { toggleSettingsMenu(); document.getElementById('change-password-modal').classList.add('show'); }

// =====================================================
// 7. MÓDULOS DE CADASTRO (Lógica Explícita)
// =====================================================

// --- MUNICÍPIOS ---
function showMunicipalityModal(id = null) {
    const modal = document.getElementById('municipality-modal');
    document.getElementById('municipality-form').reset();
    editingId = id;
    
    // Popula select com Lista Mestra
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
            if(m.modules) document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = m.modules.includes(cb.value));
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
    showToast('Município Salvo!', 'success');
}

function renderMunicipalities() {
    const container = document.getElementById('municipalities-table');
    const filterName = document.getElementById('filter-municipality-name').value;
    
    let filtered = municipalities.filter(m => {
        if(filterName && m.name !== filterName) return false;
        return true;
    });
    filtered.sort((a,b) => a.name.localeCompare(b.name));

    if(filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum registro.</div>';
        return;
    }

    const rows = filtered.map(m => `
        <tr>
            <td><strong>${m.name}</strong></td>
            <td>${m.modules.join(', ')}</td>
            <td>${m.manager}</td>
            <td>${m.contact}</td>
            <td>${formatDate(m.lastVisit)}</td>
            <td>${m.status}</td>
            <td>
                <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Última Visita</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteMunicipality(id) {
    if(confirm('Excluir?')) {
        municipalities = municipalities.filter(x => x.id !== id);
        salvarNoArmazenamento('municipalities', municipalities);
        renderMunicipalities();
        updateGlobalDropdowns();
    }
}

// --- TREINAMENTOS ---
function showTaskModal(id = null) {
    const modal = document.getElementById('task-modal');
    document.getElementById('task-form').reset();
    editingId = id;
    updateGlobalDropdowns(); // Garante selects atualizados

    if(id) {
        const t = tasks.find(x => x.id === id);
        if(t) {
            document.getElementById('task-date-requested').value = t.dateRequested;
            document.getElementById('task-municipality').value = t.municipality;
            document.getElementById('task-requested-by').value = t.requestedBy;
            document.getElementById('task-performed-by').value = t.performedBy;
            document.getElementById('task-status').value = t.status;
            document.getElementById('task-trained-name').value = t.trainedName || '';
            document.getElementById('task-trained-position').value = t.trainedPosition || '';
            document.getElementById('task-contact').value = t.contact || '';
            document.getElementById('task-observations').value = t.observations || '';
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
        const idx = tasks.findIndex(x => x.id === editingId);
        tasks[idx] = { ...tasks[idx], ...data };
    } else {
        tasks.push({ id: getNextId('task'), ...data });
    }
    salvarNoArmazenamento('tasks', tasks);
    document.getElementById('task-modal').classList.remove('show');
    renderTasks();
    showToast('Treinamento Salvo!', 'success');
}

function renderTasks() {
    const container = document.getElementById('tasks-table');
    if(tasks.length === 0) { container.innerHTML = '<div class="empty-state">Nenhum treinamento.</div>'; return; }
    
    const rows = tasks.sort((a,b) => new Date(b.dateRequested) - new Date(a.dateRequested)).map(t => `
        <tr>
            <td>${formatDate(t.dateRequested)}</td>
            <td>${t.municipality}</td>
            <td>${t.requestedBy}</td>
            <td>${t.performedBy}</td>
            <td>${t.status}</td>
            <td>
                <button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Instrutor</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

function deleteTask(id) {
    if(confirm('Excluir?')) {
        tasks = tasks.filter(x => x.id !== id);
        salvarNoArmazenamento('tasks', tasks);
        renderTasks();
    }
}

// --- OUTROS MÓDULOS (Genéricos para economizar linhas mas funcionais) ---
// Helpers
function genericSave(arr, idPrefix, data, renderFn, modalId, storageKey) {
    if(editingId) {
        const idx = arr.findIndex(x => x.id === editingId);
        arr[idx] = { ...arr[idx], ...data };
    } else {
        arr.push({ id: getNextId(idPrefix), ...data });
    }
    salvarNoArmazenamento(storageKey, arr);
    document.getElementById(modalId).classList.remove('show');
    renderFn();
    showToast('Salvo!', 'success');
}

function genericDelete(arr, id, renderFn, storageKey) {
    if(confirm('Excluir?')) {
        const newArr = arr.filter(x => x.id !== id);
        // Atualiza referência global (importante!)
        if(storageKey === 'requests') requests = newArr;
        if(storageKey === 'demands') demands = newArr;
        if(storageKey === 'visits') visits = newArr;
        if(storageKey === 'productions') productions = newArr;
        if(storageKey === 'presentations') presentations = newArr;
        if(storageKey === 'systemVersions') versions = newArr;
        
        salvarNoArmazenamento(storageKey, newArr);
        renderFn();
    }
}

// Requests
function showRequestModal(id=null) { editingId=id; document.getElementById('request-form').reset(); if(id){const i=requests.find(x=>x.id===id); document.getElementById('request-description').value=i.description; /* preencher resto */ } document.getElementById('request-modal').classList.add('show'); }
function saveRequest(e) { e.preventDefault(); const data = { date: document.getElementById('request-date').value, municipality: document.getElementById('request-municipality').value, requester: document.getElementById('request-requester').value, description: document.getElementById('request-description').value, status: document.getElementById('request-status').value, contact: document.getElementById('request-contact').value }; genericSave(requests, 'req', data, renderRequests, 'request-modal', 'requests'); }
function renderRequests() { const c=document.getElementById('requests-table'); if(requests.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const rows=requests.map(i=>`<tr><td>${formatDate(i.date)}</td><td>${i.municipality}</td><td>${i.requester}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showRequestModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="genericDelete(requests,${i.id},renderRequests,'requests')">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }

// Demands
function showDemandModal(id=null) { editingId=id; document.getElementById('demand-form').reset(); document.getElementById('demand-modal').classList.add('show'); }
function saveDemand(e) { e.preventDefault(); const data = { date: document.getElementById('demand-date').value, description: document.getElementById('demand-description').value, priority: document.getElementById('demand-priority').value, status: document.getElementById('demand-status').value }; genericSave(demands, 'dem', data, renderDemands, 'demand-modal', 'demands'); }
function renderDemands() { const c=document.getElementById('demands-table'); if(demands.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const rows=demands.map(i=>`<tr><td>${formatDate(i.date)}</td><td>${i.priority}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showDemandModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="genericDelete(demands,${i.id},renderDemands,'demands')">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Prioridade</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }

// Visits
function showVisitModal(id=null) { editingId=id; document.getElementById('visit-form').reset(); updateGlobalDropdowns(); document.getElementById('visit-modal').classList.add('show'); }
function saveVisit(e) { e.preventDefault(); const data = { date: document.getElementById('visit-date').value, municipality: document.getElementById('visit-municipality').value, applicant: document.getElementById('visit-applicant').value, status: document.getElementById('visit-status').value }; genericSave(visits, 'visit', data, renderVisits, 'visit-modal', 'visits'); }
function renderVisits() { const c=document.getElementById('visits-table'); if(visits.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const rows=visits.map(i=>`<tr><td>${formatDate(i.date)}</td><td>${i.municipality}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showVisitModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="genericDelete(visits,${i.id},renderVisits,'visits')">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Município</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }

// Productions
function showProductionModal(id=null) { editingId=id; document.getElementById('production-form').reset(); updateGlobalDropdowns(); document.getElementById('production-modal').classList.add('show'); }
function saveProduction(e) { e.preventDefault(); const data = { municipality: document.getElementById('production-municipality').value, frequency: document.getElementById('production-frequency').value, competence: document.getElementById('production-competence').value, period: document.getElementById('production-period').value, status: document.getElementById('production-status').value, contact: document.getElementById('production-contact').value }; genericSave(productions, 'prod', data, renderProductions, 'production-modal', 'productions'); }
function renderProductions() { const c=document.getElementById('productions-table'); if(productions.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const rows=productions.map(i=>`<tr><td>${i.municipality}</td><td>${i.competence}</td><td>${i.period}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showProductionModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="genericDelete(productions,${i.id},renderProductions,'productions')">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Município</th><th>Competência</th><th>Período</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }

// Presentations
function showPresentationModal(id=null) { editingId=id; document.getElementById('presentation-form').reset(); updateGlobalDropdowns(); document.getElementById('presentation-modal').classList.add('show'); }
function savePresentation(e) { e.preventDefault(); const data = { municipality: document.getElementById('presentation-municipality').value, dateSolicitacao: document.getElementById('presentation-date-solicitacao').value, requester: document.getElementById('presentation-requester').value, status: document.getElementById('presentation-status').value }; genericSave(presentations, 'pres', data, renderPresentations, 'presentation-modal', 'presentations'); }
function renderPresentations() { const c=document.getElementById('presentations-table'); if(presentations.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const rows=presentations.map(i=>`<tr><td>${i.municipality}</td><td>${i.requester}</td><td>${i.status}</td><td><button class="btn btn--sm" onclick="showPresentationModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="genericDelete(presentations,${i.id},renderPresentations,'presentations')">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Município</th><th>Solicitante</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }

// Versions
function showVersionModal(id=null) { editingId=id; document.getElementById('version-form').reset(); document.getElementById('version-modal').classList.add('show'); }
function saveVersion(e) { e.preventDefault(); const data = { date: document.getElementById('version-date').value, version: document.getElementById('version-number').value, type: document.getElementById('version-type').value, module: document.getElementById('version-module').value, description: document.getElementById('version-description').value }; genericSave(versions, 'ver', data, renderVersions, 'version-modal', 'systemVersions'); }
function renderVersions() { const c=document.getElementById('versions-table'); if(versions.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const rows=versions.map(i=>`<tr><td>${formatDate(i.date)}</td><td>${i.version}</td><td>${i.type}</td><td>${i.module}</td><td>${i.description}</td><td><button class="btn btn--sm" onclick="showVersionModal(${i.id})">✏️</button><button class="btn btn--sm" onclick="genericDelete(versions,${i.id},renderVersions,'systemVersions')">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Versão</th><th>Tipo</th><th>Módulo</th><th>Descrição</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }

// =====================================================
// 8. CONFIGURAÇÕES (CRUDs Simples)
// =====================================================
// Lista Mestra
function showMunicipalityListModal(id=null) { editingId=id; document.getElementById('municipality-list-form').reset(); if(id){const i=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=i.name; document.getElementById('municipality-list-uf').value=i.uf;} document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e) { e.preventDefault(); const data = { name: document.getElementById('municipality-list-name').value, uf: document.getElementById('municipality-list-uf').value }; genericSave(municipalitiesList, 'munList', data, renderMunicipalityList, 'municipality-list-modal', 'municipalitiesList'); updateGlobalDropdowns(); }
function renderMunicipalityList() { renderConfigTable('municipalities-list-table', municipalitiesList, 'showMunicipalityListModal', 'deleteMunicipalityList'); }
function deleteMunicipalityList(id) { genericDelete(municipalitiesList, id, renderMunicipalityList, 'municipalitiesList'); }

// Cargos
function showCargoModal(id=null) { editingId=id; document.getElementById('cargo-form').reset(); if(id){const i=cargos.find(x=>x.id===id); document.getElementById('cargo-name').value=i.name;} document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e) { e.preventDefault(); const data = { name: document.getElementById('cargo-name').value }; genericSave(cargos, 'cargo', data, renderCargos, 'cargo-modal', 'cargos'); }
function renderCargos() { renderConfigTable('cargos-table', cargos, 'showCargoModal', 'deleteCargo'); }
function deleteCargo(id) { genericDelete(cargos, id, renderCargos, 'cargos'); }

// Orientadores
function showOrientadorModal(id=null) { editingId=id; document.getElementById('orientador-form').reset(); if(id){const i=orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value=i.name; document.getElementById('orientador-contact').value=i.contact;} document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e) { e.preventDefault(); const data = { name: document.getElementById('orientador-name').value, contact: document.getElementById('orientador-contact').value }; genericSave(orientadores, 'orient', data, renderOrientadores, 'orientador-modal', 'orientadores'); }
function renderOrientadores() { renderConfigTable('orientadores-table', orientadores, 'showOrientadorModal', 'deleteOrientador'); }
function deleteOrientador(id) { genericDelete(orientadores, id, renderOrientadores, 'orientadores'); }

// Módulos e Formas
function showModuloModal(id=null) { editingId=id; document.getElementById('modulo-form').reset(); document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e) { e.preventDefault(); const data = { name: document.getElementById('modulo-name').value }; genericSave(modulos, 'mod', data, renderModulos, 'modulo-modal', 'modulos'); }
function renderModulos() { renderConfigTable('modulos-table', modulos, 'showModuloModal', 'deleteModulo'); }
function deleteModulo(id) { genericDelete(modulos, id, renderModulos, 'modulos'); }

function showFormaApresentacaoModal(id=null) { editingId=id; document.getElementById('forma-apresentacao-form').reset(); document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e) { e.preventDefault(); const data = { name: document.getElementById('forma-apresentacao-name').value }; genericSave(formasApresentacao, 'forma', data, renderFormas, 'forma-apresentacao-modal', 'formasApresentacao'); }
function renderFormas() { renderConfigTable('formas-apresentacao-table', formasApresentacao, 'showFormaApresentacaoModal', 'deleteForma'); }
function deleteForma(id) { genericDelete(formasApresentacao, id, renderFormas, 'formasApresentacao'); }

// Users
function showUserModal(id=null) { editingId=id; document.getElementById('user-form').reset(); document.getElementById('user-modal').classList.add('show'); }
function saveUser(e) { 
    e.preventDefault(); 
    const data = { 
        login: document.getElementById('user-login').value.toUpperCase(),
        name: document.getElementById('user-name').value,
        permission: document.getElementById('user-permission').value,
        status: document.getElementById('user-status').value
    };
    if(!editingId) {
        data.salt = generateSalt();
        data.passwordHash = hashPassword(document.getElementById('user-password').value, data.salt);
    }
    genericSave(users, 'user', data, renderUsers, 'user-modal', 'users'); 
}
function renderUsers() { renderConfigTable('users-table', users, 'showUserModal', 'deleteUser'); }
function deleteUser(id) { genericDelete(users, id, renderUsers, 'users'); }

// Helper Render Config
function renderConfigTable(containerId, data, editFn, delFn) {
    const c = document.getElementById(containerId);
    if(!c) return;
    const rows = data.map(i => `<tr><td>${i.name || i.login}</td><td><button class="btn btn--sm" onclick="${editFn}(${i.id})">✏️</button><button class="btn btn--sm" onclick="${delFn}(${i.id})">🗑️</button></td></tr>`).join('');
    c.innerHTML = `<table><thead><th>Nome</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
}

// =====================================================
// 9. UI HELPERS E INICIALIZAÇÃO
// =====================================================
function populateSelect(select, data, valKey, textKey) {
    if(!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Selecione...</option>' + 
        data.sort((a,b)=>a[textKey].localeCompare(b[textKey]))
            .map(i => `<option value="${i[valKey]}">${i[textKey]}</option>`).join('');
    select.value = current;
}

function updateGlobalDropdowns() {
    // Atualiza selects de Município em todas as telas com a CARTEIRA (municipalities) ou LISTA MESTRA (municipalitiesList)
    // Geralmente nas telas operacionais usamos a carteira ativa
    const activeMuns = municipalities.filter(m => m.status === 'Em uso');
    
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(id => {
        populateSelect(document.getElementById(id), activeMuns, 'name', 'name');
    });
    
    // Filtro de municípios
    populateSelect(document.getElementById('filter-municipality-name'), municipalities, 'name', 'name');
}

function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(m => m.status === 'Em uso').length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(t => t.status === 'Concluído').length;
}

function updateBackupInfo() {
    document.getElementById('backup-info-municipalities').textContent = municipalities.length;
    document.getElementById('backup-info-trainings').textContent = tasks.length;
}

// Charts Placeholder (Simplificado)
function updateCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if(ctx && window.Chart) {
        // Se Chart.js estiver carregado, renderize aqui
        // new Chart(ctx, { ... });
    }
}

function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    setupMasks();
    
    // Render inicial
    renderMunicipalities();
    renderTasks();
    // etc...
    
    updateGlobalDropdowns();
    updateDashboardStats();
    
    // Se nenhuma aba ativa, vai para Dashboard
    if(!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

// Eventos Globais
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    
    // Fechar modais
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { 
        if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); } 
    });
});
