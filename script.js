// =====================================================
// SIGP SAÚDE v7.0 - VERSÃO ROBUSTA E DETALHADA
// Correção de Navegação, Usuários e Regras de Negócio
// =====================================================

// 1. VERIFICAÇÃO DE SEGURANÇA
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada. Verifique sua conexão ou o HTML.');
}

// =====================================================
// 2. CONFIGURAÇÕES GERAIS E VARIÁVEIS DE ESTADO
// =====================================================
const SALT_LENGTH = 16;
let editingId = null; // Controla qual item está sendo editado

// 2.1. Dados Padrão (Backup de segurança)
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

// 2.2. Carregamento de Dados (State)
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);
let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');

// Arrays de Dados de Negócio
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

// =====================================================
// 3. FUNÇÕES UTILITÁRIAS (CORE)
// =====================================================

function generateSalt() { return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString(); }
function hashPassword(password, salt) { return CryptoJS.SHA256(salt + password).toString(); }

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

function salvarNoArmazenamento(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
        console.error(erro);
        if (erro.name === 'QuotaExceededError') alert('⚠️ Espaço cheio! Faça backup.');
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
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// =====================================================
// 4. MÁSCARAS E VALIDAÇÕES (REGRAS DE CAMPO)
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
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    return v;
}

function formatPeriodo(value) {
    let v = value.replace(/\D/g, ""); // Apenas números
    v = v.substring(0, 8); // Limite 8 digitos (01 01 31 01)
    
    // Formata visualmente: 01/01 à 31/01
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    if (v.length > 4) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2 à $3");
    if (v.length > 6) v = v.replace(/ à (\d{2})(\d)/, " à $1/$2");
    
    return v;
}

function applyMasks() {
    // Telefones
    const phoneIds = ['municipality-contact', 'task-contact', 'orientador-contact', 'request-contact', 'production-contact'];
    phoneIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.oninput = (e) => e.target.value = formatPhoneNumber(e.target.value);
    });

    // Produção
    const elComp = document.getElementById('production-competence');
    if(elComp) elComp.oninput = (e) => e.target.value = formatCompetencia(e.target.value);

    const elPeriod = document.getElementById('production-period');
    if(elPeriod) {
        elPeriod.placeholder = "DD/MM à DD/MM";
        elPeriod.oninput = (e) => e.target.value = formatPeriodo(e.target.value);
    }
}

// =====================================================
// 5. NAVEGAÇÃO E ABAS (CORRIGIDO)
// =====================================================

function initializeTabs() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    
    buttons.forEach(btn => {
        // Remove listeners antigos (segurança) e adiciona novo
        btn.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            console.log('Navegando para:', tabId); // Debug

            // 1. Remove classe active de todos os botões e seções
            buttons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // 2. Ativa o botão clicado
            this.classList.add('active');

            // 3. Ativa a seção correspondente
            const sectionId = tabId + '-section';
            const section = document.getElementById(sectionId);
            
            if (section) {
                section.classList.add('active');
                // Recarrega os dados daquela aba
                loadTabData(tabId);
            } else {
                console.error('Seção não encontrada:', sectionId);
            }
        };
    });
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'dashboard': updateDashboardStats(); updateCharts(); break;
        case 'municipios': renderMunicipalities(); break;
        case 'tarefas': renderTasks(); break;
        case 'solicitacoes': renderRequests(); break;
        case 'apresentacoes': renderPresentations(); break;
        case 'demandas': renderDemands(); break;
        case 'visitas': renderVisits(); break;
        case 'producao': renderProductions(); break;
        case 'versoes': renderVersions(); break;
    }
}

function navigateToHome() {
    // Clica virtualmente no botão dashboard
    const btn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if(btn) btn.click();
}

// =====================================================
// 6. MÓDULO: GESTÃO DE USUÁRIOS (CORRIGIDO)
// =====================================================

function showUserModal(id = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-modal-title');
    
    form.reset();
    editingId = id;
    
    // Habilita login para edição por padrão (pode travar se quiser)
    document.getElementById('user-login').disabled = false; 

    if (id) {
        title.textContent = 'Editar Usuário';
        const u = users.find(x => x.id === id);
        if (u) {
            document.getElementById('user-login').value = u.login;
            document.getElementById('user-login').disabled = true; // Trava login na edição
            document.getElementById('user-name').value = u.name;
            document.getElementById('user-permission').value = u.permission;
            document.getElementById('user-status').value = u.status;
            // Senha fica em branco. Se preencher, altera.
            document.getElementById('user-password').required = false;
            document.getElementById('user-password').placeholder = "Deixe em branco para manter";
        }
    } else {
        title.textContent = 'Novo Usuário';
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

    // Validação de Duplicidade (Apenas se for NOVO cadastro)
    if (!editingId) {
        const exists = users.some(u => u.login === login);
        if (exists) {
            alert('Erro: Já existe um usuário com este Login.');
            return;
        }
    }

    if (editingId) {
        // EDIÇÃO
        const index = users.findIndex(u => u.id === editingId);
        if (index !== -1) {
            users[index].name = name;
            users[index].permission = permission;
            users[index].status = status;
            
            // Só altera senha se o campo não estiver vazio
            if (password) {
                users[index].salt = generateSalt();
                users[index].passwordHash = hashPassword(password, users[index].salt);
                users[index].mustChangePassword = false; // Admin resetou, usuario não precisa mudar logo
            }
            showToast('Usuário atualizado com sucesso!', 'success');
        }
    } else {
        // CRIAÇÃO (NOVO)
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
        showToast('Usuário criado com sucesso!', 'success');
    }

    salvarNoArmazenamento('users', users);
    document.getElementById('user-modal').classList.remove('show');
    renderUsers();
}

function deleteUser(id) {
    const u = users.find(x => x.id === id);
    if (u.login === 'ADMIN') {
        alert('O usuário ADMIN principal não pode ser excluído.');
        return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário ${u.name}?`)) {
        users = users.filter(x => x.id !== id);
        salvarNoArmazenamento('users', users);
        renderUsers();
        showToast('Usuário excluído.', 'info');
    }
}

function renderUsers() {
    const container = document.getElementById('users-table');
    const filterName = document.getElementById('filter-user-name') ? document.getElementById('filter-user-name').value.toLowerCase() : '';

    let filtered = users.filter(u => u.name.toLowerCase().includes(filterName) || u.login.toLowerCase().includes(filterName));

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>';
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

    container.innerHTML = `<table><thead><tr><th>Login</th><th>Nome</th><th>Permissão</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
    
    // Atualiza Stats
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('active-users').textContent = users.filter(u => u.status === 'Ativo').length;
    document.getElementById('inactive-users').textContent = users.filter(u => u.status !== 'Ativo').length;
}

// =====================================================
// 7. MÓDULO: MUNICÍPIOS
// =====================================================

function showMunicipalityModal(id = null) {
    const modal = document.getElementById('municipality-modal');
    const form = document.getElementById('municipality-form');
    form.reset();
    editingId = id;
    
    // Popula select
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
        container.innerHTML = '<div class="empty-state">Nenhum registro.</div>';
        return;
    }

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
                <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    
    // Atualiza contadores da tela
    const countEl = document.getElementById('municipalities-results-count');
    if(countEl) { countEl.style.display = 'block'; countEl.innerHTML = `<strong>${filtered.length}</strong> registros.`; }
    
    // Atualiza stats cards
    document.getElementById('total-municipalities').textContent = municipalities.length;
    document.getElementById('active-municipalities').textContent = municipalities.filter(m => m.status === 'Em uso').length;
}

function deleteMunicipality(id) {
    if(confirm('Excluir?')) {
        municipalities = municipalities.filter(x => x.id !== id);
        salvarNoArmazenamento('municipalities', municipalities);
        renderMunicipalities();
        updateGlobalDropdowns();
    }
}

// =====================================================
// 8. MÓDULO: TREINAMENTOS (TASKS)
// =====================================================

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
    showToast('Salvo!');
}

function renderTasks() {
    const container = document.getElementById('tasks-table');
    // Filtros aqui se necessário
    const sorted = [...tasks].sort((a,b) => new Date(b.dateRequested) - new Date(a.dateRequested));
    
    if(sorted.length === 0) {
        container.innerHTML = '<div class="empty-state">Vazio.</div>'; return;
    }

    const rows = sorted.map(t => `
        <tr>
            <td>${formatDate(t.dateRequested)}</td>
            <td>${t.municipality}</td>
            <td>${t.requestedBy}</td>
            <td>${t.performedBy}</td>
            <td>${t.trainedName}</td>
            <td>${t.status}</td>
            <td>
                <button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Instrutor</th><th>Treinado</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    
    // Stats
    document.getElementById('total-tasks').textContent = tasks.length;
    document.getElementById('completed-tasks').textContent = tasks.filter(t=>t.status==='Concluído').length;
}

function deleteTask(id) {
    if(confirm('Excluir?')) {
        tasks = tasks.filter(x => x.id !== id);
        salvarNoArmazenamento('tasks', tasks);
        renderTasks();
    }
}

// =====================================================
// 9. MÓDULO: PRODUÇÃO
// =====================================================

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
        const idx = productions.findIndex(x => x.id === editingId);
        productions[idx] = { ...productions[idx], ...data };
    } else {
        productions.push({ id: getNextId('prod'), ...data });
    }
    salvarNoArmazenamento('productions', productions);
    document.getElementById('production-modal').classList.remove('show');
    renderProductions();
    showToast('Salvo!');
}

function renderProductions() {
    const container = document.getElementById('productions-table');
    if(productions.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum envio.</div>'; return;
    }
    const rows = productions.map(p => `
        <tr>
            <td>${p.municipality}</td>
            <td>${p.competence}</td>
            <td>${p.period}</td>
            <td>${p.frequency}</td>
            <td>${p.status}</td>
            <td>
                <button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
    container.innerHTML = `<table><thead><th>Município</th><th>Competência</th><th>Período</th><th>Freq.</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    
    // Stats
    document.getElementById('total-productions').textContent = productions.length;
    document.getElementById('sent-productions').textContent = productions.filter(p=>p.status==='Enviada').length;
}

function deleteProduction(id) {
    if(confirm('Excluir?')) {
        productions = productions.filter(x => x.id !== id);
        salvarNoArmazenamento('productions', productions);
        renderProductions();
    }
}

// =====================================================
// 10. OUTROS MÓDULOS (VISITAS, DEMANDAS, ETC)
// =====================================================

// Visitas
function showVisitModal(id=null){ editingId=id; document.getElementById('visit-form').reset(); updateGlobalDropdowns(); if(id){ const v=visits.find(x=>x.id===id); document.getElementById('visit-municipality').value=v.municipality; document.getElementById('visit-date').value=v.date; document.getElementById('visit-applicant').value=v.applicant; document.getElementById('visit-status').value=v.status; document.getElementById('visit-reason').value=v.reason;} document.getElementById('visit-modal').classList.add('show'); }
function saveVisit(e){ e.preventDefault(); const data={municipality:document.getElementById('visit-municipality').value, date:document.getElementById('visit-date').value, applicant:document.getElementById('visit-applicant').value, status:document.getElementById('visit-status').value, reason:document.getElementById('visit-reason').value}; if(editingId){ const i=visits.findIndex(x=>x.id===editingId); visits[i]={...visits[i],...data}; }else{ visits.push({id:getNextId('visit'),...data}); } salvarNoArmazenamento('visits',visits); document.getElementById('visit-modal').classList.remove('show'); renderVisits(); showToast('Salvo!'); }
function renderVisits(){ const c=document.getElementById('visits-table'); if(visits.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const r=visits.map(v=>`<tr><td>${formatDate(v.date)}</td><td>${v.municipality}</td><td>${v.applicant}</td><td>${v.status}</td><td><button class="btn btn--sm" onclick="showVisitModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVisit(${v.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Status</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; document.getElementById('total-visits').textContent=visits.length;}
function deleteVisit(id){ if(confirm('Excluir?')){ visits=visits.filter(x=>x.id!==id); salvarNoArmazenamento('visits',visits); renderVisits(); }}

// Demandas
function showDemandModal(id=null){ editingId=id; document.getElementById('demand-form').reset(); if(id){ const d=demands.find(x=>x.id===id); document.getElementById('demand-date').value=d.date; document.getElementById('demand-description').value=d.description; document.getElementById('demand-priority').value=d.priority; document.getElementById('demand-status').value=d.status; } document.getElementById('demand-modal').classList.add('show'); }
function saveDemand(e){ e.preventDefault(); const data={date:document.getElementById('demand-date').value, description:document.getElementById('demand-description').value, priority:document.getElementById('demand-priority').value, status:document.getElementById('demand-status').value, user:currentUser.name}; if(editingId){ const i=demands.findIndex(x=>x.id===editingId); demands[i]={...demands[i],...data}; }else{ demands.push({id:getNextId('dem'),...data}); } salvarNoArmazenamento('demands',demands); document.getElementById('demand-modal').classList.remove('show'); renderDemands(); showToast('Salvo!'); }
function renderDemands(){ const c=document.getElementById('demands-table'); if(demands.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const r=demands.map(d=>`<tr><td>${formatDate(d.date)}</td><td>${d.priority}</td><td>${d.status}</td><td>${d.description}</td><td><button class="btn btn--sm" onclick="showDemandModal(${d.id})">✏️</button><button class="btn btn--sm" onclick="deleteDemand(${d.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Prioridade</th><th>Status</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; document.getElementById('total-demands').textContent=demands.length;}
function deleteDemand(id){ if(confirm('Excluir?')){ demands=demands.filter(x=>x.id!==id); salvarNoArmazenamento('demands',demands); renderDemands(); }}

// Solicitações
function showRequestModal(id=null){ editingId=id; document.getElementById('request-form').reset(); updateGlobalDropdowns(); if(id){ const r=requests.find(x=>x.id===id); document.getElementById('request-date').value=r.date; document.getElementById('request-municipality').value=r.municipality; document.getElementById('request-requester').value=r.requester; document.getElementById('request-contact').value=r.contact; document.getElementById('request-status').value=r.status; document.getElementById('request-description').value=r.description; } document.getElementById('request-modal').classList.add('show'); }
function saveRequest(e){ e.preventDefault(); const data={date:document.getElementById('request-date').value, municipality:document.getElementById('request-municipality').value, requester:document.getElementById('request-requester').value, contact:document.getElementById('request-contact').value, description:document.getElementById('request-description').value, status:document.getElementById('request-status').value, user:currentUser.name}; if(editingId){ const i=requests.findIndex(x=>x.id===editingId); requests[i]={...requests[i],...data}; }else{ requests.push({id:getNextId('req'),...data}); } salvarNoArmazenamento('requests',requests); document.getElementById('request-modal').classList.remove('show'); renderRequests(); showToast('Salvo!'); }
function renderRequests(){ const c=document.getElementById('requests-table'); if(requests.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const r=requests.map(x=>`<tr><td>${formatDate(x.date)}</td><td>${x.municipality}</td><td>${x.requester}</td><td>${x.status}</td><td><button class="btn btn--sm" onclick="showRequestModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteRequest(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Status</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; document.getElementById('total-requests').textContent=requests.length;}
function deleteRequest(id){ if(confirm('Excluir?')){ requests=requests.filter(x=>x.id!==id); salvarNoArmazenamento('requests',requests); renderRequests(); }}

// Versões
function showVersionModal(id=null){ editingId=id; document.getElementById('version-form').reset(); if(id){ const v=systemVersions.find(x=>x.id===id); document.getElementById('version-date').value=v.date; document.getElementById('version-number').value=v.version; document.getElementById('version-type').value=v.type; document.getElementById('version-module').value=v.module; document.getElementById('version-description').value=v.description;} document.getElementById('version-modal').classList.add('show'); }
function saveVersion(e){ e.preventDefault(); const data={date:document.getElementById('version-date').value, version:document.getElementById('version-number').value, type:document.getElementById('version-type').value, module:document.getElementById('version-module').value, description:document.getElementById('version-description').value, author:currentUser.name}; if(editingId){ const i=systemVersions.findIndex(x=>x.id===editingId); systemVersions[i]={...systemVersions[i],...data}; }else{ systemVersions.push({id:getNextId('ver'),...data}); } salvarNoArmazenamento('systemVersions',systemVersions); document.getElementById('version-modal').classList.remove('show'); renderVersions(); showToast('Salvo!'); }
function renderVersions(){ const c=document.getElementById('versions-table'); if(systemVersions.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const r=systemVersions.map(v=>`<tr><td>${formatDate(v.date)}</td><td>${v.version}</td><td>${v.type}</td><td>${v.module}</td><td>${v.description}</td><td><button class="btn btn--sm" onclick="showVersionModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVersion(${v.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Versão</th><th>Tipo</th><th>Módulo</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteVersion(id){ if(confirm('Excluir?')){ systemVersions=systemVersions.filter(x=>x.id!==id); salvarNoArmazenamento('systemVersions',systemVersions); renderVersions(); }}

// Apresentações (Com checkbox logic restaurada)
function showPresentationModal(id=null){ 
    editingId=id; document.getElementById('presentation-form').reset(); updateGlobalDropdowns();
    // Checkboxes
    const divO=document.getElementById('presentation-orientador-checkboxes'); if(divO) divO.innerHTML=orientadores.map(o=>`<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
    const divF=document.getElementById('presentation-forms-checkboxes'); if(divF) divF.innerHTML=formasApresentacao.map(f=>`<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');
    
    if(id){
        const p=presentations.find(x=>x.id===id);
        document.getElementById('presentation-municipality').value=p.municipality;
        document.getElementById('presentation-date-solicitacao').value=p.dateSolicitacao;
        document.getElementById('presentation-requester').value=p.requester;
        document.getElementById('presentation-status').value=p.status;
        document.getElementById('presentation-description').value=p.description;
        // Marcar checks
        if(p.orientadores) document.querySelectorAll('.orientador-check').forEach(cb=>cb.checked=p.orientadores.includes(cb.value));
        if(p.forms) document.querySelectorAll('.forma-check').forEach(cb=>cb.checked=p.forms.includes(cb.value));
    }
    document.getElementById('presentation-modal').classList.add('show'); 
}
function savePresentation(e){ 
    e.preventDefault(); 
    const orientadoresSel=Array.from(document.querySelectorAll('.orientador-check:checked')).map(c=>c.value);
    const formasSel=Array.from(document.querySelectorAll('.forma-check:checked')).map(c=>c.value);
    const data={municipality:document.getElementById('presentation-municipality').value, dateSolicitacao:document.getElementById('presentation-date-solicitacao').value, requester:document.getElementById('presentation-requester').value, status:document.getElementById('presentation-status').value, description:document.getElementById('presentation-description').value, orientadores:orientadoresSel, forms:formasSel};
    if(editingId){ const i=presentations.findIndex(x=>x.id===editingId); presentations[i]={...presentations[i],...data}; }else{ presentations.push({id:getNextId('pres'),...data}); }
    salvarNoArmazenamento('presentations',presentations); document.getElementById('presentation-modal').classList.remove('show'); renderPresentations(); showToast('Salvo!');
}
function renderPresentations(){ const c=document.getElementById('presentations-table'); if(presentations.length===0){c.innerHTML='<div class="empty-state">Vazio</div>';return;} const r=presentations.map(p=>`<tr><td>${p.municipality}</td><td>${formatDate(p.dateSolicitacao)}</td><td>${p.requester}</td><td>${p.status}</td><td>${p.orientadores}</td><td><button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button><button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Município</th><th>Data</th><th>Solicitante</th><th>Status</th><th>Orientadores</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; document.getElementById('total-presentations').textContent=presentations.length;}
function deletePresentation(id){ if(confirm('Excluir?')){ presentations=presentations.filter(x=>x.id!==id); salvarNoArmazenamento('presentations',presentations); renderPresentations(); }}

// =====================================================
// 11. CONFIGURAÇÕES (MUNICÍPIOS LISTA, CARGOS, ETC)
// =====================================================

// Lista Mestra
function showMunicipalityListModal(id=null){ editingId=id; document.getElementById('municipality-list-form').reset(); if(id){ const m=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=m.name; document.getElementById('municipality-list-uf').value=m.uf; } document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e){ e.preventDefault(); const data={name:document.getElementById('municipality-list-name').value, uf:document.getElementById('municipality-list-uf').value}; if(editingId){ const i=municipalitiesList.findIndex(x=>x.id===editingId); municipalitiesList[i]={...municipalitiesList[i],...data}; }else{ municipalitiesList.push({id:getNextId('munList'),...data}); } salvarNoArmazenamento('municipalitiesList',municipalitiesList); document.getElementById('municipality-list-modal').classList.remove('show'); renderMunicipalityList(); updateGlobalDropdowns(); showToast('Salvo!'); }
function renderMunicipalityList(){ const c=document.getElementById('municipalities-list-table'); const r=municipalitiesList.map(m=>`<tr><td>${m.name} - ${m.uf}</td><td><button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteMunicipalityList(id){ if(confirm('Excluir?')){ municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}

// Cargos, Orientadores, Modulos (Padrão Simplificado mas explicito)
function showCargoModal(id=null){ editingId=id; document.getElementById('cargo-form').reset(); if(id){const c=cargos.find(x=>x.id===id); document.getElementById('cargo-name').value=c.name;} document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e){ e.preventDefault(); const data={name:document.getElementById('cargo-name').value}; if(editingId){ const i=cargos.findIndex(x=>x.id===editingId); cargos[i]={...cargos[i],...data}; }else{ cargos.push({id:getNextId('cargo'),...data}); } salvarNoArmazenamento('cargos',cargos); document.getElementById('cargo-modal').classList.remove('show'); renderCargos(); }
function renderCargos(){ const c=document.getElementById('cargos-table'); const r=cargos.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Cargo</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteCargo(id){ if(confirm('Excluir?')){ cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}

function showOrientadorModal(id=null){ editingId=id; document.getElementById('orientador-form').reset(); if(id){const o=orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value=o.name; document.getElementById('orientador-contact').value=o.contact;} document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e){ e.preventDefault(); const data={name:document.getElementById('orientador-name').value, contact:document.getElementById('orientador-contact').value}; if(editingId){ const i=orientadores.findIndex(x=>x.id===editingId); orientadores[i]={...orientadores[i],...data}; }else{ orientadores.push({id:getNextId('orient'),...data}); } salvarNoArmazenamento('orientadores',orientadores); document.getElementById('orientador-modal').classList.remove('show'); renderOrientadores(); }
function renderOrientadores(){ const c=document.getElementById('orientadores-table'); const r=orientadores.map(x=>`<tr><td>${x.name}</td><td>${x.contact}</td><td><button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Contato</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteOrientador(id){ if(confirm('Excluir?')){ orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}

function showModuloModal(id=null){ editingId=id; document.getElementById('modulo-form').reset(); if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name;} document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e){ e.preventDefault(); const data={name:document.getElementById('modulo-name').value}; if(editingId){ const i=modulos.findIndex(x=>x.id===editingId); modulos[i]={...modulos[i],...data}; }else{ modulos.push({id:getNextId('mod'),...data}); } salvarNoArmazenamento('modulos',modulos); document.getElementById('modulo-modal').classList.remove('show'); renderModulos(); }
function renderModulos(){ const c=document.getElementById('modulos-table'); const r=modulos.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteModulo(id){ if(confirm('Excluir?')){ modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}

function showFormaApresentacaoModal(id=null){ editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){const f=formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value=f.name;} document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e){ e.preventDefault(); const data={name:document.getElementById('forma-apresentacao-name').value}; if(editingId){ const i=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[i]={...formasApresentacao[i],...data}; }else{ formasApresentacao.push({id:getNextId('forma'),...data}); } salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }
function renderFormas(){ const c=document.getElementById('formas-apresentacao-table'); const r=formasApresentacao.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteForma(id){ if(confirm('Excluir?')){ formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}

function toggleSettingsMenu() { document.getElementById('settings-menu').classList.toggle('show'); }
function showChangePasswordModal() { toggleSettingsMenu(); document.getElementById('change-password-modal').classList.add('show'); }
function closeChangePasswordModal() { document.getElementById('change-password-modal').classList.remove('show'); }
function handleChangePassword(e) { e.preventDefault(); const n=document.getElementById('new-password').value; const c=document.getElementById('confirm-password').value; if(n!==c || n.length<4){alert('Senha inválida');return;} const i=users.findIndex(u=>u.id===currentUser.id); users[i].salt=generateSalt(); users[i].passwordHash=hashPassword(n,users[i].salt); users[i].mustChangePassword=false; salvarNoArmazenamento('users',users); currentUser=users[i]; salvarNoArmazenamento('currentUser',currentUser); closeChangePasswordModal(); showToast('Senha alterada'); }

// =====================================================
// 12. DASHBOARD E UI
// =====================================================

function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(m => m.status === 'Em uso').length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(t => t.status === 'Concluído').length;
    document.getElementById('dashboard-requests-completed').textContent = requests.filter(r => r.status === 'Realizado').length;
    document.getElementById('dashboard-presentations-completed').textContent = presentations.filter(p => p.status === 'Realizada').length;
}

function updateCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if(ctx && window.Chart) {
        const dataMap = {};
        municipalities.forEach(m => {
            if(m.implantationDate) {
                const year = m.implantationDate.split('-')[0];
                dataMap[year] = (dataMap[year] || 0) + 1;
            }
        });
        
        // Destroi anterior se houver (implementação simplificada)
        // new Chart(ctx, ...);
    }
}

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
    
    populateSelect(document.getElementById('filter-municipality-name'), municipalities, 'name', 'name');
    populateSelect(document.getElementById('filter-municipality-module'), modulos, 'name', 'name');
}

// =====================================================
// 13. INICIALIZAÇÃO
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
    updateCharts();
    
    // Abre dashboard
    if(!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Autenticação
    if (isAuthenticated && currentUser) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        updateUserInterface();
        initializeApp();
    } else {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-app').classList.remove('active');
    }
    
    // 2. Fechar Modais
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); } });
    
    // 3. Login Button
    document.getElementById('login-form').addEventListener('submit', handleLogin);
});
