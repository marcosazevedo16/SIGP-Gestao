// =====================================================
// SIGP SAÚDE v17.0 - VERSÃO MESTRA INTEGRADA
// Contém: Ajustes PDF (1-6), Exportação c/ Filtros e Regras Anteriores
// =====================================================

// 1. VERIFICAÇÃO DE SEGURANÇA
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada.');
}

// =====================================================
// 2. CONFIGURAÇÕES GERAIS
// =====================================================
const SALT_LENGTH = 16;
// Variáveis de Gráficos
let chartDashboard = null;
let chartStatusMun = null;
let chartModulesMun = null;
let chartTimelineMun = null;
let chartStatusReq = null;
let chartMunReq = null;
let chartSolReq = null;
let chartStatusPres = null;
let chartMunPres = null;
let chartOrientPres = null;
let chartStatusDem = null;
let chartPrioDem = null;
let chartUserDem = null;
let chartStatusVis = null;
let chartMunVis = null;
let chartSolVis = null;
let chartStatusProd = null;
let chartFreqProd = null;

const CHART_COLORS = ['#C85250', '#E7B85F', '#79C2A9', '#5E8C99', '#3B5B66', '#E68161', '#F7DC6F', '#4ECDC4', '#FF6B6B', '#A9DFBF'];

// =====================================================
// 3. FUNÇÕES UTILITÁRIAS (CORE)
// =====================================================

function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

function hashPassword(password, salt) {
    return CryptoJS.SHA256(salt + password).toString();
}

function salvarNoArmazenamento(chave, dados) {
    try {
        const dadosJSON = JSON.stringify(dados);
        localStorage.setItem(chave, dadosJSON);
    } catch (erro) {
        console.error(erro);
        if (erro.name === 'QuotaExceededError') {
            alert('⚠️ Espaço de armazenamento cheio! Faça backup.');
        }
    }
}

function recuperarDoArmazenamento(chave, valorPadrao = null) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : valorPadrao;
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
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dateString;
}

function calculateTimeInUse(dateString) {
    if (!dateString) return '-';
    const start = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - start) / (1000 * 60 * 60 * 24)); 
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    let result = "";
    if (years > 0) result += `${years} ano(s) `;
    if (months > 0) result += `${months} mês(es)`;
    if (years === 0 && months === 0) result = "Menos de 1 mês";
    return result;
}

function calculateDaysSince(dateString) {
    if (!dateString) return '-';
    const last = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - last) / (1000 * 60 * 60 * 24)); 
    return `${diffDays} dias`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast';
    void toast.offsetWidth;
    toast.classList.add(type, 'show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// HELPERS DE EXPORTAÇÃO (AJUSTE SOLICITADO)
function downloadCSV(filename, headers, rows) {
    // Adiciona BOM para o Excel reconhecer acentos
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${(cell||'').toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadPDF(title, headers, rows) {
    if (!window.jspdf) {
        alert('Biblioteca PDF não carregada. Verifique sua internet.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    if (doc.autoTable) {
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [0, 61, 92] }
        });
    } else {
        // Fallback simples se autoTable falhar
        let y = 40;
        rows.forEach(row => {
            if (y > 180) { doc.addPage(); y = 20; }
            doc.text(row.join(' | ').substring(0, 100), 14, y);
            y += 7;
        });
    }
    doc.save(`${title}.pdf`);
}

// =====================================================
// 4. MÁSCARAS E FORMATAÇÃO
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
    let v = value.replace(/\D/g, "");
    v = v.substring(0, 8);
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    if (v.length > 4) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2 à $3");
    if (v.length > 6) v = v.replace(/ à (\d{2})(\d)/, " à $1/$2");
    return v;
}

function applyMasks() {
    ['municipality-contact', 'task-contact', 'orientador-contact', 'request-contact', 'production-contact'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', (e) => e.target.value = formatPhoneNumber(e.target.value));
    });
    const elComp = document.getElementById('production-competence');
    if (elComp) elComp.addEventListener('input', (e) => e.target.value = formatCompetencia(e.target.value));
    const elPeriod = document.getElementById('production-period');
    if (elPeriod) {
        elPeriod.placeholder = "DD/MM à DD/MM";
        elPeriod.addEventListener('input', (e) => e.target.value = formatPeriodo(e.target.value));
    }
    // Auto-refresh nos filtros
    document.querySelectorAll('.filters-section select, .filters-section input').forEach(el => {
        el.addEventListener('change', () => {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) refreshCurrentTab(activeTab.id);
        });
    });
}

// =====================================================
// 5. INJEÇÃO DE CAMPOS DINÂMICOS (REGRAS PDF)
// =====================================================
function setupDynamicFormFields() {
    // PDF 1: Campos Data Bloqueio/Parou
    const formMun = document.getElementById('municipality-form');
    if (formMun && !document.getElementById('municipality-date-blocked')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-group" id="group-date-blocked" style="display:none;">
                <label class="form-label">Data em que foi Bloqueado*</label>
                <input type="date" class="form-control" id="municipality-date-blocked">
            </div>
            <div class="form-group" id="group-date-stopped" style="display:none;">
                <label class="form-label">Data em que Parou de Usar</label>
                <input type="date" class="form-control" id="municipality-date-stopped">
            </div>`;
        formMun.insertBefore(div, formMun.querySelector('.modal-actions'));
    }
    // PDF 2: Solicitações (Realização/Justificativa)
    const formReq = document.getElementById('request-form');
    if (formReq && !document.getElementById('request-date-realization')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-group" id="group-request-date-realization" style="display:none;">
                <label class="form-label">Data de Realização*</label>
                <input type="date" class="form-control" id="request-date-realization">
            </div>
            <div class="form-group" id="group-request-justification" style="display:none;">
                <label class="form-label">Justificativa (Máx 200)*</label>
                <textarea class="form-control" id="request-justification" maxlength="200"></textarea>
            </div>`;
        formReq.insertBefore(div, formReq.querySelector('.modal-actions'));
    }
    // PDF 4: Demandas (Realização/Justificativa)
    const formDem = document.getElementById('demand-form');
    if (formDem && !document.getElementById('demand-date-realization')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-group" id="group-demand-date-realization" style="display:none;">
                <label class="form-label">Data de Realização*</label>
                <input type="date" class="form-control" id="demand-date-realization">
            </div>
            <div class="form-group" id="group-demand-justification" style="display:none;">
                <label class="form-label">Justificativa (Máx 150)</label>
                <textarea class="form-control" id="demand-justification" maxlength="150"></textarea>
            </div>`;
        formDem.insertBefore(div, formDem.querySelector('.modal-actions'));
    }
    // PDF 5: Visitas (Realização/Justificativa)
    const formVis = document.getElementById('visit-form');
    if (formVis && !document.getElementById('visit-date-realization')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-group" id="group-visit-date-realization" style="display:none;">
                <label class="form-label">Data de Realização*</label>
                <input type="date" class="form-control" id="visit-date-realization">
            </div>
            <div class="form-group" id="group-visit-justification" style="display:none;">
                <label class="form-label">Justificativa (Obrigatória se cancelada)*</label>
                <textarea class="form-control" id="visit-justification"></textarea>
            </div>`;
        formVis.insertBefore(div, formVis.querySelector('.modal-actions'));
    }
}

// =====================================================
// 6. ESTADO GLOBAL
// =====================================================
const DADOS_PADRAO = {
    users: [{ id: 1, login: 'ADMIN', name: 'Administrador', salt: null, passwordHash: null, permission: 'Administrador', status: 'Ativo', mustChangePassword: true }],
    modulos: [
        { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#FF6B6B', description: 'Cadastros Gerais' }, 
        { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#4ECDC4', description: 'Tratamento Fora' },
        { id: 3, name: 'Prontuário', abbreviation: 'PEC', color: '#45B7D1', description: 'Prontuário Eletrônico' }, 
        { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#FFA07A', description: 'Gestão Adm' }
    ]
};

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

// Arrays
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
let counters = recuperarDoArmazenamento('counters', { mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1 });

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// =====================================================
// 7. INTERFACE E NAVEGAÇÃO
// =====================================================
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = currentTheme === 'light' ? '🌙 Tema' : '☀️ Tema';
}
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    salvarNoArmazenamento('theme', currentTheme);
    initializeTheme();
}
function updateUserInterface() {
    if (!currentUser) return;
    const elName = document.getElementById('logged-user-name');
    if (elName) elName.textContent = currentUser.name;
    const isAdmin = currentUser.permission === 'Administrador';
    
    ['user-management-menu-btn', 'admin-divider'].forEach(id => {
        const e = document.getElementById(id);
        if (e) e.style.display = isAdmin ? (id === 'admin-divider' ? 'block' : 'flex') : 'none';
    });
    ['cargo-management-menu-btn', 'orientador-management-menu-btn', 'modulo-management-menu-btn', 'municipality-list-management-menu-btn', 'forma-apresentacao-management-menu-btn', 'backup-menu-btn'].forEach(id => {
        const e = document.getElementById(id); if (e) e.style.display = 'flex';
    });
}

function initializeTabs() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const section = document.getElementById(tabId + '-section');
            if (section) {
                section.classList.add('active');
                refreshCurrentTab(tabId + '-section');
            }
        };
    });
}

function refreshCurrentTab(sectionId) {
    updateGlobalDropdowns();
    if (sectionId === 'municipios-section') renderMunicipalities();
    if (sectionId === 'tarefas-section') renderTasks();
    if (sectionId === 'solicitacoes-section') renderRequests();
    if (sectionId === 'demandas-section') renderDemands();
    if (sectionId === 'visitas-section') renderVisits();
    if (sectionId === 'producao-section') renderProductions();
    if (sectionId === 'apresentacoes-section') renderPresentations();
    if (sectionId === 'versoes-section') renderVersions();
    if (sectionId === 'dashboard-section') { updateDashboardStats(); initializeDashboardCharts(); }
}

function navigateToHome() {
    const btn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if (btn) btn.click();
}
function toggleSettingsMenu() { document.getElementById('settings-menu').classList.toggle('show'); }

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
// 8. AUTENTICAÇÃO
// =====================================================
function handleLogin(e) {
    e.preventDefault();
    const l = document.getElementById('login-username').value.trim().toUpperCase();
    const p = document.getElementById('login-password').value;
    const u = users.find(x => x.login === l && x.status === 'Ativo');
    if (u && hashPassword(p, u.salt) === u.passwordHash) {
        currentUser = u; isAuthenticated = true;
        salvarNoArmazenamento('currentUser', currentUser);
        checkAuthentication(); initializeApp(); showToast('Bem-vindo!');
    } else { document.getElementById('login-error').textContent = 'Inválido.'; }
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
function handleLogout() { if (confirm('Sair?')) { localStorage.removeItem('currentUser'); location.reload(); } }
function showChangePasswordModal() { document.getElementById('change-password-modal').classList.add('show'); }
function closeChangePasswordModal() { document.getElementById('change-password-modal').classList.remove('show'); }
function handleChangePassword(e) {
    e.preventDefault();
    const n = document.getElementById('new-password').value;
    const c = document.getElementById('confirm-password').value;
    if (n !== c || n.length < 4) { alert('Senhas não conferem'); return; }
    const idx = users.findIndex(u => u.id === currentUser.id);
    users[idx].salt = generateSalt(); users[idx].passwordHash = hashPassword(n, users[idx].salt); users[idx].mustChangePassword = false;
    salvarNoArmazenamento('users', users); currentUser = users[idx]; salvarNoArmazenamento('currentUser', currentUser);
    closeChangePasswordModal(); showToast('Senha alterada!');
}

// =====================================================
// 9. MUNICÍPIOS (PDF Item 1)
// =====================================================
function handleMunicipalityStatusChange() {
    const status = document.getElementById('municipality-status').value;
    const grpBlocked = document.getElementById('group-date-blocked');
    const grpStopped = document.getElementById('group-date-stopped');
    if (grpBlocked) grpBlocked.style.display = 'none';
    if (grpStopped) grpStopped.style.display = 'none';
    if (status === 'Bloqueado' && grpBlocked) grpBlocked.style.display = 'block';
    if (status === 'Parou de usar' && grpStopped) grpStopped.style.display = 'block';
}

function showMunicipalityModal(id = null) {
    editingId = id;
    document.getElementById('municipality-form').reset();
    populateSelect(document.getElementById('municipality-name'), municipalitiesList, 'name', 'name');
    document.getElementById('municipality-status').onchange = handleMunicipalityStatusChange;

    if (id) {
        const m = municipalities.find(x => x.id === id);
        if (m) {
            document.getElementById('municipality-name').value = m.name;
            document.getElementById('municipality-status').value = m.status;
            document.getElementById('municipality-manager').value = m.manager;
            document.getElementById('municipality-contact').value = m.contact;
            document.getElementById('municipality-implantation-date').value = m.implantationDate;
            document.getElementById('municipality-last-visit').value = m.lastVisit;
            if (document.getElementById('municipality-date-blocked')) document.getElementById('municipality-date-blocked').value = m.dateBlocked || '';
            if (document.getElementById('municipality-date-stopped')) document.getElementById('municipality-date-stopped').value = m.dateStopped || '';
            if (m.modules) document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = m.modules.includes(cb.value));
            handleMunicipalityStatusChange();
        }
    } else { handleMunicipalityStatusChange(); }
    document.getElementById('municipality-modal').classList.add('show');
}

function saveMunicipality(e) {
    e.preventDefault();
    const name = document.getElementById('municipality-name').value;
    const status = document.getElementById('municipality-status').value;
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);

    // PDF 1: Duplicidade
    if (!editingId && municipalities.some(m => m.name === name)) { alert('Município já cadastrado!'); return; }
    // PDF 1a: Em uso -> módulo
    if (status === 'Em uso' && mods.length === 0) { alert('Selecione ao menos um módulo.'); return; }
    // PDF 1b: Bloqueado -> data
    const dateBlocked = document.getElementById('municipality-date-blocked').value;
    if (status === 'Bloqueado' && !dateBlocked) { alert('Informe a Data de Bloqueio.'); return; }

    const data = {
        name: name, status: status, manager: document.getElementById('municipality-manager').value,
        contact: document.getElementById('municipality-contact').value,
        implantationDate: document.getElementById('municipality-implantation-date').value,
        lastVisit: document.getElementById('municipality-last-visit').value,
        modules: mods, dateBlocked: dateBlocked,
        dateStopped: document.getElementById('municipality-date-stopped').value
    };

    if (editingId) {
        const i = municipalities.findIndex(x => x.id === editingId);
        municipalities[i] = { ...municipalities[i], ...data };
    } else { municipalities.push({ id: getNextId('mun'), ...data }); }

    salvarNoArmazenamento('municipalities', municipalities);
    document.getElementById('municipality-modal').classList.remove('show');
    renderMunicipalities(); updateGlobalDropdowns(); showToast('Salvo!');
}

function getFilteredMunicipalities() {
    const fName = document.getElementById('filter-municipality-name') ? document.getElementById('filter-municipality-name').value : '';
    const fStatus = document.getElementById('filter-municipality-status') ? document.getElementById('filter-municipality-status').value : '';
    const fMod = document.getElementById('filter-municipality-module') ? document.getElementById('filter-municipality-module').value : '';
    const fGest = document.getElementById('filter-municipality-manager') ? document.getElementById('filter-municipality-manager').value.toLowerCase() : '';

    let filtered = municipalities.filter(m => {
        if (fName && m.name !== fName) return false;
        if (fStatus && m.status !== fStatus) return false;
        if (fMod && !m.modules.includes(fMod)) return false;
        if (fGest && !m.manager.toLowerCase().includes(fGest)) return false;
        return true;
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

function renderMunicipalities() {
    const filtered = getFilteredMunicipalities();
    const c = document.getElementById('municipalities-table');
    document.getElementById('municipalities-results-count').innerHTML = `<strong>${filtered.length}</strong> registros`;
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município.</div>';
    } else {
        const rows = filtered.map(m => {
            const badges = m.modules.map(mn => {
                const mc = modulos.find(x => x.name === mn);
                const ab = mc ? mc.abbreviation : mn.substring(0, 3);
                const cl = mc ? mc.color : '#999';
                return `<span style="background:${cl};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-right:2px;">${ab}</span>`;
            }).join('');
            return `<tr>
                <td><strong>${m.name}</strong></td><td>${badges}</td><td>${m.manager}</td><td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td><td>${formatDate(m.lastVisit)}</td>
                <td>${calculateTimeInUse(m.implantationDate)}</td><td>${calculateDaysSince(m.lastVisit)}</td>
                <td><span class="status-badge ${m.status === 'Em uso' ? 'active' : 'blocked'}">${m.status}</span></td>
                <td><button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button></td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Última Visita</th><th>Tempo Uso</th><th>Dias s/ Visita</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updateMunicipalityCharts(filtered);
}

// Funções de Exportação (USAM FILTROS)
function exportMunicipalitiesCSV() {
    const data = getFilteredMunicipalities();
    const headers = ['Município', 'Módulos', 'Gestor', 'Contato', 'Implantação', 'Última Visita', 'Tempo Uso', 'Status'];
    const rows = data.map(m => [m.name, m.modules.join(', '), m.manager, m.contact, formatDate(m.implantationDate), formatDate(m.lastVisit), calculateTimeInUse(m.implantationDate), m.status]);
    downloadCSV('municipios.csv', headers, rows);
}
function generateMunicipalitiesPDF() {
    const data = getFilteredMunicipalities();
    const headers = ['Município', 'Gestor', 'Contato', 'Implantação', 'Status'];
    const rows = data.map(m => [m.name, m.manager, m.contact, formatDate(m.implantationDate), m.status]);
    downloadPDF('Relatório Municípios', headers, rows);
}

function updateMunicipalityCharts(data) {
    if (document.getElementById('statusChart') && window.Chart) {
        if (chartStatusMun) chartStatusMun.destroy();
        chartStatusMun = new Chart(document.getElementById('statusChart'), {
            type: 'pie',
            data: {
                labels: ['Em uso', 'Bloqueado', 'Parou', 'N. Implantado'],
                datasets: [{
                    data: [data.filter(m => m.status === 'Em uso').length, data.filter(m => m.status === 'Bloqueado').length, data.filter(m => m.status === 'Parou de usar').length, data.filter(m => m.status === 'Não Implantado').length],
                    backgroundColor: ['#4ECDC4', '#FF6B6B', '#FFA07A', '#95A5A6']
                }]
            }
        });
    }
    if (document.getElementById('modulesChart') && window.Chart) {
        if (chartModulesMun) chartModulesMun.destroy();
        const mc = {}; data.forEach(m => m.modules.forEach(mo => mc[mo] = (mc[mo] || 0) + 1));
        chartModulesMun = new Chart(document.getElementById('modulesChart'), {
            type: 'bar',
            data: { labels: Object.keys(mc), datasets: [{ label: 'Qtd', data: Object.values(mc), backgroundColor: '#1FB8CD' }] }
        });
    }
}
function deleteMunicipality(id) { if (confirm('Excluir?')) { municipalities = municipalities.filter(x => x.id !== id); salvarNoArmazenamento('municipalities', municipalities); renderMunicipalities(); updateGlobalDropdowns(); } }
function closeMunicipalityModal() { document.getElementById('municipality-modal').classList.remove('show'); }
function clearMunicipalityFilters() { ['filter-municipality-name', 'filter-municipality-status', 'filter-municipality-module', 'filter-municipality-manager'].forEach(id => document.getElementById(id).value = ''); renderMunicipalities(); }


// =====================================================
// 10. TREINAMENTOS (FILTROS, EXPORT, RENDER)
// =====================================================
function showTaskModal(id = null) {
    editingId = id; document.getElementById('task-form').reset(); updateGlobalDropdowns();
    if (id) {
        const t = tasks.find(x => x.id === id);
        document.getElementById('task-date-requested').value = t.dateRequested;
        document.getElementById('task-municipality').value = t.municipality;
        document.getElementById('task-requested-by').value = t.requestedBy;
        document.getElementById('task-performed-by').value = t.performedBy;
        document.getElementById('task-status').value = t.status;
        document.getElementById('task-trained-name').value = t.trainedName;
        document.getElementById('task-trained-position').value = t.trainedPosition;
        document.getElementById('task-contact').value = t.contact;
        document.getElementById('task-observations').value = t.observations;
        document.getElementById('task-date-performed').value = t.datePerformed;
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
        status: document.getElementById('task-status').value,
        trainedName: document.getElementById('task-trained-name').value,
        trainedPosition: document.getElementById('task-trained-position').value,
        contact: document.getElementById('task-contact').value,
        observations: document.getElementById('task-observations').value
    };
    if (editingId) {
        const i = tasks.findIndex(x => x.id === editingId); tasks[i] = { ...tasks[i], ...data };
    } else { tasks.push({ id: getNextId('task'), ...data }); }
    salvarNoArmazenamento('tasks', tasks); document.getElementById('task-modal').classList.remove('show'); renderTasks(); showToast('Salvo!');
}

function getFilteredTasks() {
    const fMun = document.getElementById('filter-task-municipality')?.value;
    const fStatus = document.getElementById('filter-task-status')?.value;
    const fReq = document.getElementById('filter-task-requester')?.value.toLowerCase();
    const fPerf = document.getElementById('filter-task-performer')?.value;
    const fDateType = document.getElementById('filter-task-date-type')?.value;
    const fDateStart = document.getElementById('filter-task-date-start')?.value;
    const fDateEnd = document.getElementById('filter-task-date-end')?.value;

    let filtered = tasks.filter(t => {
        if (fMun && t.municipality !== fMun) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if (fPerf && t.performedBy !== fPerf) return false;
        const dt = (fDateType === 'Data de Realização') ? t.datePerformed : t.dateRequested;
        if (fDateStart && dt < fDateStart) return false;
        if (fDateEnd && dt > fDateEnd) return false;
        return true;
    });
    return filtered.sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested));
}

function renderTasks() {
    const filtered = getFilteredTasks();
    const c = document.getElementById('tasks-table');
    document.getElementById('tasks-results-count').innerHTML = `<strong>${filtered.length}</strong> treinamentos`;
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; }
    else {
        const rows = filtered.map(t => `<tr><td>${formatDate(t.dateRequested)}</td><td>${formatDate(t.datePerformed)}</td><td>${t.municipality}</td><td>${t.requestedBy}</td><td>${t.performedBy}</td><td>${t.trainedName}</td><td>${t.trainedPosition}</td><td>${t.contact}</td><td>${t.status}</td><td><button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button><button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button></td></tr>`).join('');
        c.innerHTML = `<table><thead><th>Data Sol.</th><th>Data Real.</th><th>Município</th><th>Solicitante</th><th>Orientador</th><th>Profissional</th><th>Cargo</th><th>Contato</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    if (document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent = filtered.length;
    if (document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent = filtered.filter(t => t.status === 'Concluído').length;
    if (document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent = filtered.filter(t => t.status === 'Pendente').length;
}

function exportTasksCSV() {
    const data = getFilteredTasks();
    const headers = ['Data Sol.', 'Data Real.', 'Município', 'Solicitante', 'Orientador', 'Status'];
    const rows = data.map(t => [formatDate(t.dateRequested), formatDate(t.datePerformed), t.municipality, t.requestedBy, t.performedBy, t.status]);
    downloadCSV('treinamentos.csv', headers, rows);
}
function generateTasksPDF() {
    const data = getFilteredTasks();
    const headers = ['Data Sol.', 'Município', 'Orientador', 'Status'];
    const rows = data.map(t => [formatDate(t.dateRequested), t.municipality, t.performedBy, t.status]);
    downloadPDF('Relatório Treinamentos', headers, rows);
}
function deleteTask(id) { if (confirm('Excluir?')) { tasks = tasks.filter(x => x.id !== id); salvarNoArmazenamento('tasks', tasks); renderTasks(); } }
function closeTaskModal() { document.getElementById('task-modal').classList.remove('show'); }
function clearTaskFilters() { ['filter-task-municipality', 'filter-task-status', 'filter-task-requester', 'filter-task-performer', 'filter-task-date-start', 'filter-task-date-end'].forEach(id => document.getElementById(id).value = ''); renderTasks(); }

// =====================================================
// 11. SOLICITAÇÕES (PDF Item 2)
// =====================================================
function handleRequestStatusChange() {
    const status = document.getElementById('request-status').value;
    const grpReal = document.getElementById('group-request-date-realization');
    const grpJust = document.getElementById('group-request-justification');
    if (grpReal) grpReal.style.display = (status === 'Realizado') ? 'block' : 'none';
    if (grpJust) grpJust.style.display = (status === 'Inviável') ? 'block' : 'none';
}

function showRequestModal(id = null) {
    editingId = id;
    const form = document.getElementById('request-form');
    form.reset();
    // PDF Item 9: Mover Municipio para topo
    const fieldMun = document.getElementById('request-municipality').closest('.form-group');
    if(fieldMun) form.insertBefore(fieldMun, form.firstChild);

    document.getElementById('request-status').onchange = handleRequestStatusChange;
    updateGlobalDropdowns();

    if (id) {
        const r = requests.find(x => x.id === id);
        document.getElementById('request-municipality').value = r.municipality;
        document.getElementById('request-date').value = r.date;
        document.getElementById('request-contact').value = r.contact;
        document.getElementById('request-requester').value = r.requester;
        document.getElementById('request-description').value = r.description;
        document.getElementById('request-status').value = r.status;
        if(document.getElementById('request-date-realization')) document.getElementById('request-date-realization').value = r.dateRealization || '';
        if(document.getElementById('request-justification')) document.getElementById('request-justification').value = r.justification || '';
        handleRequestStatusChange();
    }
    document.getElementById('request-modal').classList.add('show');
}

function saveRequest(e) {
    e.preventDefault();
    const status = document.getElementById('request-status').value;
    // PDF Item 10, 11: Validações
    if (status === 'Realizado' && !document.getElementById('request-date-realization').value) { alert('Informe Data de Realização'); return; }
    if (status === 'Inviável' && !document.getElementById('request-justification').value) { alert('Informe Justificativa'); return; }

    const data = {
        date: document.getElementById('request-date').value,
        municipality: document.getElementById('request-municipality').value,
        requester: document.getElementById('request-requester').value,
        contact: document.getElementById('request-contact').value,
        description: document.getElementById('request-description').value,
        status: status,
        dateRealization: document.getElementById('request-date-realization').value,
        justification: document.getElementById('request-justification').value,
        user: currentUser.name
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

function getFilteredRequests() {
    const fMun = document.getElementById('filter-request-municipality')?.value;
    const fStatus = document.getElementById('filter-request-status')?.value;
    const fSol = document.getElementById('filter-request-solicitante')?.value.toLowerCase();
    const fDateStart = document.getElementById('filter-request-date-start')?.value;
    const fDateEnd = document.getElementById('filter-request-date-end')?.value;

    let filtered = requests.filter(r => {
        if (fMun && r.municipality !== fMun) return false;
        if (fStatus && r.status !== fStatus) return false;
        if (fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        if (fDateStart && r.date < fDateStart) return false;
        if (fDateEnd && r.date > fDateEnd) return false;
        return true;
    });
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderRequests() {
    const filtered = getFilteredRequests();
    const c = document.getElementById('requests-table');
    document.getElementById('requests-results-count').innerHTML = `<strong>${filtered.length}</strong> solicitações`;
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(x => `<tr><td>${formatDate(x.date)}</td><td>${x.municipality}</td><td>${x.requester}</td><td>${x.status}</td><td>${x.user||'-'}</td><td><button class="btn btn--sm" onclick="showRequestModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteRequest(${x.id})">🗑️</button></td></tr>`).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Status</th><th>Usuário</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    // Charts
    if(document.getElementById('total-requests')) document.getElementById('total-requests').textContent = filtered.length;
    if(document.getElementById('requestStatusChart') && window.Chart) {
        if(chartStatusReq) chartStatusReq.destroy();
        chartStatusReq = new Chart(document.getElementById('requestStatusChart'), {
            type: 'pie',
            data: { labels: ['Pendente', 'Realizado', 'Inviável'], datasets: [{ data: [filtered.filter(x=>x.status==='Pendente').length, filtered.filter(x=>x.status==='Realizado').length, filtered.filter(x=>x.status==='Inviável').length], backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] }] }
        });
    }
}

function exportRequestsCSV() { const data=getFilteredRequests(); const h=['Data','Município','Solicitante','Status']; const r=data.map(x=>[formatDate(x.date),x.municipality,x.requester,x.status]); downloadCSV('solicitacoes.csv',h,r); }
function generateRequestsPDF() { const data=getFilteredRequests(); const h=['Data','Município','Status','Descrição']; const r=data.map(x=>[formatDate(x.date),x.municipality,x.status,x.description]); downloadPDF('Solicitações',h,r); }
function deleteRequest(id) { if(confirm('Excluir?')){ requests=requests.filter(x=>x.id!==id); salvarNoArmazenamento('requests',requests); renderRequests(); } }
function closeRequestModal() { document.getElementById('request-modal').classList.remove('show'); }
function clearRequestFilters() { ['filter-request-municipality','filter-request-status','filter-request-solicitante','filter-request-date-start'].forEach(id=>document.getElementById(id).value=''); renderRequests(); }

// =====================================================
// 12. APRESENTAÇÕES (PDF Item 3)
// =====================================================
function showPresentationModal(id = null) {
    editingId = id; document.getElementById('presentation-form').reset(); updateGlobalDropdowns();
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if (divO) divO.innerHTML = orientadores.map(o => `<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
    const divF = document.getElementById('presentation-forms-checkboxes');
    if (divF) divF.innerHTML = formasApresentacao.map(f => `<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');

    if (id) {
        const p = presentations.find(x => x.id === id);
        document.getElementById('presentation-municipality').value = p.municipality;
        document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
        document.getElementById('presentation-status').value = p.status;
        if(p.orientadores) document.querySelectorAll('.orientador-check').forEach(cb => cb.checked = p.orientadores.includes(cb.value));
        if(p.forms) document.querySelectorAll('.forma-check').forEach(cb => cb.checked = p.forms.includes(cb.value));
        if(document.getElementById('presentation-date-realizacao')) document.getElementById('presentation-date-realizacao').value = p.dateRealizacao || '';
    }
    document.getElementById('presentation-modal').classList.add('show');
}

function savePresentation(e) {
    e.preventDefault();
    const status = document.getElementById('presentation-status').value;
    const orientadoresSel = Array.from(document.querySelectorAll('.orientador-check:checked')).map(c => c.value);
    const formasSel = Array.from(document.querySelectorAll('.forma-check:checked')).map(c => c.value);

    // PDF Item 14: Validações
    if (status === 'Realizada') {
        if (formasSel.length === 0) { alert('Selecione Forma de Apresentação.'); return; }
        if (!document.getElementById('presentation-date-realizacao').value) { alert('Informe Data Realização.'); return; }
    }

    const data = {
        municipality: document.getElementById('presentation-municipality').value,
        dateSolicitacao: document.getElementById('presentation-date-solicitacao').value,
        requester: document.getElementById('presentation-requester').value,
        status: status,
        description: document.getElementById('presentation-description').value,
        dateRealizacao: document.getElementById('presentation-date-realizacao').value,
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

function getFilteredPresentations() {
    const fMun = document.getElementById('filter-presentation-municipality')?.value;
    const fStatus = document.getElementById('filter-presentation-status')?.value;
    
    let filtered = presentations.filter(p => {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        return true;
    });
    return filtered.sort((a, b) => new Date(a.dateSolicitacao) - new Date(b.dateSolicitacao));
}

function renderPresentations() {
    const filtered = getFilteredPresentations();
    const c = document.getElementById('presentations-table');
    document.getElementById('presentations-results-count').innerHTML = `<strong>${filtered.length}</strong> apresentações`;
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; }
    else {
        const rows = filtered.map(p => `<tr><td>${p.municipality}</td><td>${formatDate(p.dateSolicitacao)}</td><td>${p.status}</td><td>${p.orientadores}</td><td><button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button><button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button></td></tr>`).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data</th><th>Status</th><th>Orientadores</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    if(document.getElementById('total-presentations')) document.getElementById('total-presentations').textContent = filtered.length;
}
function exportPresentationsCSV() { const data=getFilteredPresentations(); const h=['Município','Data','Status']; const r=data.map(x=>[x.municipality,formatDate(x.dateSolicitacao),x.status]); downloadCSV('apresentacoes.csv',h,r); }
function generatePresentationsPDF() { const data=getFilteredPresentations(); const h=['Município','Data','Status']; const r=data.map(x=>[x.municipality,formatDate(x.dateSolicitacao),x.status]); downloadPDF('Apresentações',h,r); }
function deletePresentation(id){ if(confirm('Excluir?')){ presentations=presentations.filter(x=>x.id!==id); salvarNoArmazenamento('presentations',presentations); renderPresentations(); }}
function closePresentationModal() { document.getElementById('presentation-modal').classList.remove('show'); }
function clearPresentationFilters() { document.getElementById('filter-presentation-municipality').value=''; renderPresentations(); }

// =====================================================
// 13. DEMANDAS (PDF Item 4)
// =====================================================
function handleDemandStatusChange() {
    const status = document.getElementById('demand-status').value;
    const grpReal = document.getElementById('group-demand-date-realization');
    const grpJust = document.getElementById('group-demand-justification');
    if (grpReal) grpReal.style.display = (status === 'Realizada') ? 'block' : 'none';
    if (grpJust) grpJust.style.display = (status === 'Inviável') ? 'block' : 'none';
}
function showDemandModal(id = null) {
    editingId = id; document.getElementById('demand-form').reset();
    document.getElementById('demand-status').onchange = handleDemandStatusChange;
    if (id) {
        const d = demands.find(x => x.id === id);
        document.getElementById('demand-date').value = d.date;
        document.getElementById('demand-description').value = d.description;
        document.getElementById('demand-priority').value = d.priority;
        document.getElementById('demand-status').value = d.status;
        if(document.getElementById('demand-date-realization')) document.getElementById('demand-date-realization').value = d.dateRealization || '';
        if(document.getElementById('demand-justification')) document.getElementById('demand-justification').value = d.justification || '';
        handleDemandStatusChange();
    }
    document.getElementById('demand-modal').classList.add('show');
}
function saveDemand(e) {
    e.preventDefault();
    const status = document.getElementById('demand-status').value;
    // PDF Item 16: Realizada exige data
    if (status === 'Realizada' && !document.getElementById('demand-date-realization').value) { alert('Informe Data Realização'); return; }
    
    const data = {
        date: document.getElementById('demand-date').value,
        description: document.getElementById('demand-description').value,
        priority: document.getElementById('demand-priority').value,
        status: status,
        dateRealization: document.getElementById('demand-date-realization').value,
        justification: document.getElementById('demand-justification').value,
        user: currentUser.name
    };
    if(editingId){const i=demands.findIndex(x=>x.id===editingId); demands[i]={...demands[i],...data};}else{demands.push({id:getNextId('dem'),...data});}
    salvarNoArmazenamento('demands',demands); document.getElementById('demand-modal').classList.remove('show'); renderDemands(); showToast('Salvo!');
}
function getFilteredDemands() {
    const fStatus = document.getElementById('filter-demand-status')?.value;
    return demands.filter(d => !fStatus || d.status === fStatus);
}
function renderDemands() {
    const filtered = getFilteredDemands();
    const c=document.getElementById('demands-table'); 
    document.getElementById('demands-results-count').innerHTML = `<strong>${filtered.length}</strong> demandas`;
    if(filtered.length===0){c.innerHTML='<div class="empty-state">Vazio.</div>';}
    else { const r=filtered.map(d=>`<tr><td>${formatDate(d.date)}</td><td>${d.priority}</td><td>${d.status}</td><td>${d.description}</td><td><button class="btn btn--sm" onclick="showDemandModal(${d.id})">✏️</button><button class="btn btn--sm" onclick="deleteDemand(${d.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Prioridade</th><th>Status</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
    if(document.getElementById('total-demands')) document.getElementById('total-demands').textContent = filtered.length;
}
function exportDemandsCSV(){const d=getFilteredDemands(); const h=['Data','Prioridade','Status']; const r=d.map(x=>[formatDate(x.date),x.priority,x.status]); downloadCSV('demandas.csv',h,r);}
function generateDemandsPDF(){const d=getFilteredDemands(); const h=['Data','Prioridade','Status']; const r=d.map(x=>[formatDate(x.date),x.priority,x.status]); downloadPDF('Demandas',h,r);}
function deleteDemand(id){ if(confirm('Excluir?')){ demands=demands.filter(x=>x.id!==id); salvarNoArmazenamento('demands',demands); renderDemands(); }}
function closeDemandModal() { document.getElementById('demand-modal').classList.remove('show'); }
function clearDemandFilters() { document.getElementById('filter-demand-status').value=''; renderDemands(); }

// =====================================================
// 14. VISITAS (PDF Item 5)
// =====================================================
function handleVisitStatusChange() {
    const status = document.getElementById('visit-status').value;
    const grpReal = document.getElementById('group-visit-date-realization');
    const grpJust = document.getElementById('group-visit-justification');
    if (grpReal) grpReal.style.display = (status === 'Realizada') ? 'block' : 'none';
    if (grpJust) grpJust.style.display = (status === 'Cancelada') ? 'block' : 'none';
}
function showVisitModal(id = null) {
    editingId = id; document.getElementById('visit-form').reset();
    document.getElementById('visit-status').onchange = handleVisitStatusChange;
    updateGlobalDropdowns();
    if (id) {
        const v = visits.find(x => x.id === id);
        document.getElementById('visit-municipality').value = v.municipality;
        document.getElementById('visit-date').value = v.date;
        document.getElementById('visit-applicant').value = v.applicant;
        document.getElementById('visit-status').value = v.status;
        if(document.getElementById('visit-date-realization')) document.getElementById('visit-date-realization').value = v.dateRealization || '';
        if(document.getElementById('visit-justification')) document.getElementById('visit-justification').value = v.justification || '';
        handleVisitStatusChange();
    }
    document.getElementById('visit-modal').classList.add('show');
}
function saveVisit(e) {
    e.preventDefault();
    const status = document.getElementById('visit-status').value;
    // PDF Item 19, 20
    if (status === 'Realizada' && !document.getElementById('visit-date-realization').value) { alert('Data Realização obrigatória'); return; }
    if (status === 'Cancelada' && !document.getElementById('visit-justification').value) { alert('Justificativa obrigatória'); return; }

    const data = {
        municipality: document.getElementById('visit-municipality').value,
        date: document.getElementById('visit-date').value,
        applicant: document.getElementById('visit-applicant').value,
        status: status,
        dateRealization: document.getElementById('visit-date-realization').value,
        justification: document.getElementById('visit-justification').value
    };
    if(editingId){const i=visits.findIndex(x=>x.id===editingId); visits[i]={...visits[i],...data};}else{visits.push({id:getNextId('visit'),...data});}
    salvarNoArmazenamento('visits',visits); document.getElementById('visit-modal').classList.remove('show'); renderVisits(); showToast('Salvo!');
}
function getFilteredVisits() {
    const fMun = document.getElementById('filter-visit-municipality')?.value;
    return visits.filter(v => !fMun || v.municipality === fMun);
}
function renderVisits(){ const c=document.getElementById('visits-table'); const f=getFilteredVisits(); document.getElementById('visits-results-count').innerHTML=`<strong>${f.length}</strong> visitas`; if(f.length===0){c.innerHTML='Vazio.';}else{const r=f.map(v=>`<tr><td>${v.municipality}</td><td>${formatDate(v.date)}</td><td>${v.status}</td><td><button class="btn btn--sm" onclick="showVisitModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVisit(${v.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Município</th><th>Data</th><th>Status</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;} if(document.getElementById('total-visits')) document.getElementById('total-visits').textContent=f.length; }
function exportVisitsCSV(){const d=getFilteredVisits(); const h=['Município','Data','Status']; const r=d.map(v=>[v.municipality,formatDate(v.date),v.status]); downloadCSV('visitas.csv',h,r);}
function generateVisitsPDF(){const d=getFilteredVisits(); const h=['Município','Data','Status']; const r=d.map(v=>[v.municipality,formatDate(v.date),v.status]); downloadPDF('Visitas',h,r);}
function deleteVisit(id){ if(confirm('Excluir?')){ visits=visits.filter(x=>x.id!==id); salvarNoArmazenamento('visits',visits); renderVisits(); }}
function closeVisitModal(){document.getElementById('visit-modal').classList.remove('show');}
function clearVisitFilters(){document.getElementById('filter-visit-municipality').value=''; renderVisits();}

// =====================================================
// 15. PRODUÇÃO
// =====================================================
function showProductionModal(id=null) {
    editingId = id; document.getElementById('production-form').reset(); updateGlobalDropdowns();
    if(id) {
        const p=productions.find(x=>x.id===id);
        document.getElementById('production-municipality').value=p.municipality;
        document.getElementById('production-contact').value=p.contact;
        document.getElementById('production-frequency').value=p.frequency;
        document.getElementById('production-competence').value=p.competence;
        document.getElementById('production-period').value=p.period;
        document.getElementById('production-release-date').value=p.releaseDate;
        document.getElementById('production-send-date').value=p.sendDate;
        document.getElementById('production-status').value=p.status;
        document.getElementById('production-professional').value=p.professional;
        document.getElementById('production-observations').value=p.observations;
    }
    document.getElementById('production-modal').classList.add('show');
}
function saveProduction(e) {
    e.preventDefault();
    const data={municipality:document.getElementById('production-municipality').value, contact:document.getElementById('production-contact').value, frequency:document.getElementById('production-frequency').value, competence:document.getElementById('production-competence').value, period:document.getElementById('production-period').value, releaseDate:document.getElementById('production-release-date').value, sendDate:document.getElementById('production-send-date').value, status:document.getElementById('production-status').value, professional:document.getElementById('production-professional').value, observations:document.getElementById('production-observations').value};
    if(editingId){const i=productions.findIndex(x=>x.id===editingId); productions[i]={...productions[i],...data};}else{productions.push({id:getNextId('prod'),...data});}
    salvarNoArmazenamento('productions',productions); document.getElementById('production-modal').classList.remove('show'); renderProductions(); showToast('Salvo!');
}
function getFilteredProductions() {
    const fMun = document.getElementById('filter-production-municipality')?.value;
    return productions.filter(p => !fMun || p.municipality === fMun);
}
function renderProductions(){ const f=getFilteredProductions(); const c=document.getElementById('productions-table'); document.getElementById('productions-results-count').innerHTML=`<strong>${f.length}</strong> envios`; if(f.length===0){c.innerHTML='Vazio.';}else{const r=f.map(p=>`<tr><td>${p.municipality}</td><td>${p.competence}</td><td>${p.status}</td><td><button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button><button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Município</th><th>Competência</th><th>Status</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;} if(document.getElementById('total-productions')) document.getElementById('total-productions').textContent=f.length; }
function exportProductionsCSV(){const d=getFilteredProductions(); const h=['Município','Comp.','Status']; const r=d.map(p=>[p.municipality,p.competence,p.status]); downloadCSV('producao.csv',h,r);}
function generateProductionsPDF(){const d=getFilteredProductions(); const h=['Município','Comp.','Status']; const r=d.map(p=>[p.municipality,p.competence,p.status]); downloadPDF('Produção',h,r);}
function deleteProduction(id){ if(confirm('Excluir?')){ productions=productions.filter(x=>x.id!==id); salvarNoArmazenamento('productions',productions); renderProductions(); }}
function closeProductionModal(){document.getElementById('production-modal').classList.remove('show');}
function clearProductionFilters(){document.getElementById('filter-production-municipality').value=''; renderProductions();}

// =====================================================
// 16. CADASTROS BÁSICOS (VERSÕES, USERS, CARGOS...)
// =====================================================
// Versões
function showVersionModal(id=null){ editingId=id; document.getElementById('version-form').reset(); if(id){const v=systemVersions.find(x=>x.id===id); document.getElementById('version-date').value=v.date; document.getElementById('version-number').value=v.version; document.getElementById('version-description').value=v.description;} document.getElementById('version-modal').classList.add('show'); }
function saveVersion(e){ e.preventDefault(); const data={date:document.getElementById('version-date').value, version:document.getElementById('version-number').value, description:document.getElementById('version-description').value, author:currentUser.name}; if(editingId){const i=systemVersions.findIndex(x=>x.id===editingId); systemVersions[i]={...systemVersions[i],...data};}else{systemVersions.push({id:getNextId('ver'),...data});} salvarNoArmazenamento('systemVersions',systemVersions); document.getElementById('version-modal').classList.remove('show'); renderVersions(); showToast('Salvo!'); }
function renderVersions(){ const c=document.getElementById('versions-table'); if(!c)return; const r=systemVersions.map(v=>`<tr><td>${formatDate(v.date)}</td><td>${v.version}</td><td>${v.description}</td><td><button class="btn btn--sm" onclick="showVersionModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVersion(${v.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Versão</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteVersion(id){ if(confirm('Excluir?')){ systemVersions=systemVersions.filter(x=>x.id!==id); salvarNoArmazenamento('systemVersions',systemVersions); renderVersions(); }}
function closeVersionModal(){document.getElementById('version-modal').classList.remove('show');}

// Usuários
function showUserModal(id=null){ const m=document.getElementById('user-modal'); document.getElementById('user-form').reset(); editingId=id; document.getElementById('user-login').disabled=false; if(id){const u=users.find(x=>x.id===id); document.getElementById('user-login').value=u.login; document.getElementById('user-login').disabled=true; document.getElementById('user-name').value=u.name; document.getElementById('user-permission').value=u.permission; document.getElementById('user-status').value=u.status; document.getElementById('user-password').required=false;}else{document.getElementById('user-password').required=true;} m.classList.add('show'); }
function saveUser(e){ e.preventDefault(); const login=document.getElementById('user-login').value.trim().toUpperCase(); if(!editingId && users.some(u=>u.login===login)){alert('Já existe');return;} const data={login, name:document.getElementById('user-name').value, permission:document.getElementById('user-permission').value, status:document.getElementById('user-status').value}; if(!editingId){data.id=getNextId('user'); data.salt=generateSalt(); data.passwordHash=hashPassword(document.getElementById('user-password').value, data.salt); users.push(data);}else{const i=users.findIndex(x=>x.id===editingId); users[i]={...users[i],...data}; if(document.getElementById('user-password').value){users[i].salt=generateSalt(); users[i].passwordHash=hashPassword(document.getElementById('user-password').value, users[i].salt);}} salvarNoArmazenamento('users',users); document.getElementById('user-modal').classList.remove('show'); renderUsers(); showToast('Salvo!'); }
function renderUsers(){ const c=document.getElementById('users-table'); const r=users.map(u=>`<tr><td>${u.login}</td><td>${u.name}</td><td>${u.status}</td><td><button class="btn btn--sm" onclick="showUserModal(${u.id})">✏️</button><button class="btn btn--sm" onclick="deleteUser(${u.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Login</th><th>Nome</th><th>Status</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteUser(id) { const u=users.find(x=>x.id===id); if(u.login==='ADMIN'){alert('Não pode excluir ADMIN');return;} if(confirm('Excluir?')){users=users.filter(x=>x.id!==id); salvarNoArmazenamento('users',users); renderUsers();}}
function closeUserModal(){document.getElementById('user-modal').classList.remove('show');}

// Lista Mestra, Cargos, Orientadores, Módulos, Formas
function showMunicipalityListModal(id=null){ editingId=id; document.getElementById('municipality-list-form').reset(); if(id){const m=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=m.name; document.getElementById('municipality-list-uf').value=m.uf;} document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e){ e.preventDefault(); const data={name:document.getElementById('municipality-list-name').value, uf:document.getElementById('municipality-list-uf').value}; if(editingId){const i=municipalitiesList.findIndex(x=>x.id===editingId); municipalitiesList[i]={...municipalitiesList[i],...data};}else{municipalitiesList.push({id:getNextId('munList'),...data});} salvarNoArmazenamento('municipalitiesList',municipalitiesList); document.getElementById('municipality-list-modal').classList.remove('show'); renderMunicipalityList(); updateGlobalDropdowns(); showToast('Salvo!'); }
function renderMunicipalityList(){ const c=document.getElementById('municipalities-list-table'); const r=municipalitiesList.map(m=>`<tr><td>${m.name}</td><td>${m.uf}</td><td><button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>UF</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteMunicipalityList(id){ if(confirm('Excluir?')){ municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}
function closeMunicipalityListModal() { document.getElementById('municipality-list-modal').classList.remove('show'); }

function showCargoModal(id=null){ editingId=id; document.getElementById('cargo-form').reset(); if(id){const c=cargos.find(x=>x.id===id); document.getElementById('cargo-name').value=c.name;} document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e){ e.preventDefault(); const data={name:document.getElementById('cargo-name').value}; if(editingId){const i=cargos.findIndex(x=>x.id===editingId); cargos[i]={...cargos[i],...data};}else{cargos.push({id:getNextId('cargo'),...data});} salvarNoArmazenamento('cargos',cargos); document.getElementById('cargo-modal').classList.remove('show'); renderCargos(); }
function renderCargos(){ const c=document.getElementById('cargos-table'); const r=cargos.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Cargo</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteCargo(id){ if(confirm('Excluir?')){ cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}
function closeCargoModal() { document.getElementById('cargo-modal').classList.remove('show'); }

function showOrientadorModal(id=null){ editingId=id; document.getElementById('orientador-form').reset(); if(id){const o=orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value=o.name; document.getElementById('orientador-contact').value=o.contact;} document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e){ e.preventDefault(); const data={name:document.getElementById('orientador-name').value, contact:document.getElementById('orientador-contact').value}; if(editingId){const i=orientadores.findIndex(x=>x.id===editingId); orientadores[i]={...orientadores[i],...data};}else{orientadores.push({id:getNextId('orient'),...data});} salvarNoArmazenamento('orientadores',orientadores); document.getElementById('orientador-modal').classList.remove('show'); renderOrientadores(); }
function renderOrientadores(){ const c=document.getElementById('orientadores-table'); const r=orientadores.map(x=>`<tr><td>${x.name}</td><td>${x.contact}</td><td><button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Contato</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteOrientador(id){ if(confirm('Excluir?')){ orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}
function closeOrientadorModal() { document.getElementById('orientador-modal').classList.remove('show'); }

function showModuloModal(id=null){ editingId=id; document.getElementById('modulo-form').reset(); 
    const form = document.getElementById('modulo-form');
    if(!document.getElementById('modulo-description')) {
        const div = document.createElement('div'); div.className = 'form-group'; div.innerHTML = `<label class="form-label">Descrição*</label><textarea class="form-control" id="modulo-description"></textarea>`;
        form.insertBefore(div, form.querySelector('.modal-actions'));
    }
    if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name; if(document.getElementById('modulo-abbreviation')) document.getElementById('modulo-abbreviation').value=m.abbreviation; if(document.getElementById('modulo-description')) document.getElementById('modulo-description').value=m.description||'';} 
    document.getElementById('modulo-modal').classList.add('show'); 
}
function saveModulo(e){ e.preventDefault(); const data={name:document.getElementById('modulo-name').value, abbreviation:document.getElementById('modulo-abbreviation')?.value, description:document.getElementById('modulo-description')?.value}; if(editingId){const i=modulos.findIndex(x=>x.id===editingId); modulos[i]={...modulos[i],...data};}else{modulos.push({id:getNextId('mod'),...data});} salvarNoArmazenamento('modulos',modulos); document.getElementById('modulo-modal').classList.remove('show'); renderModulos(); }
function renderModulos(){ const c=document.getElementById('modulos-table'); const r=modulos.map(x=>`<tr><td>${x.name}</td><td>${x.abbreviation}</td><td><button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Módulo</th><th>Abrev.</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteModulo(id){ if(confirm('Excluir?')){ modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}
function closeModuloModal() { document.getElementById('modulo-modal').classList.remove('show'); }

function showFormaApresentacaoModal(id=null){ editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){const f=formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value=f.name;} document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e){ e.preventDefault(); const data={name:document.getElementById('forma-apresentacao-name').value}; if(editingId){const i=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[i]={...formasApresentacao[i],...data};}else{formasApresentacao.push({id:getNextId('forma'),...data});} salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }
function renderFormas(){ const c=document.getElementById('formas-apresentacao-table'); const r=formasApresentacao.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Forma</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteForma(id){ if(confirm('Excluir?')){ formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}
function closeFormaApresentacaoModal() { document.getElementById('forma-apresentacao-modal').classList.remove('show'); }

// =====================================================
// 17. BACKUP E RESTORE
// =====================================================
function updateBackupInfo() {
    if(document.getElementById('backup-info-municipalities')) document.getElementById('backup-info-municipalities').textContent = municipalities.length;
}
function createBackup() {
    const backupData = { version: "v17.0", date: new Date().toISOString(), data: { users, municipalities, municipalitiesList, tasks, requests, demands, visits, productions, presentations, systemVersions, cargos, orientadores, modulos, formasApresentacao, counters } };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "backup_sigp_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(dl); dl.click(); dl.remove();
    showToast('Backup baixado!');
}
function triggerRestoreBackup() { document.getElementById('backup-file-input').click(); }
function handleBackupFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if(backup.data && confirm('Substituir TODOS os dados?')) {
                Object.keys(backup.data).forEach(key => { localStorage.setItem(key, JSON.stringify(backup.data[key])); });
                alert('Restaurado!'); location.reload();
            }
        } catch(err) { alert('Arquivo inválido.'); }
    };
    reader.readAsText(file);
}

// =====================================================
// 18. INICIALIZAÇÃO
// =====================================================
function populateSelect(select, data, valKey, textKey) {
    if(!select) return;
    const current = select.value;
    let html = '<option value="">Selecione...</option>';
    data.sort((a,b)=>a[textKey].localeCompare(b[textKey])).forEach(i => { html += `<option value="${i[valKey]}">${i[textKey]}</option>`; });
    select.innerHTML = html;
    select.value = current;
}
function updateGlobalDropdowns() {
    const activeMuns = municipalities.filter(m => m.status === 'Em uso');
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(id => {
        populateSelect(document.getElementById(id), activeMuns, 'name', 'name');
    });
    populateSelect(document.getElementById('filter-municipality-name'), municipalities, 'name', 'name');
}
function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(m => m.status === 'Em uso').length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(t => t.status === 'Concluído').length;
}
function initializeDashboardCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if(!ctx || !window.Chart) return;
    if(chartDashboard) chartDashboard.destroy();
    const dataMap = {}; municipalities.forEach(m => { if(m.implantationDate) { const y = m.implantationDate.split('-')[0]; dataMap[y] = (dataMap[y] || 0) + 1; } });
    const years = Object.keys(dataMap).sort();
    const counts = years.map(y => dataMap[y]);
    const bgColors = years.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    chartDashboard = new Chart(ctx, { type: 'bar', data: { labels: years, datasets: [{ label: 'Implantações', data: counts, backgroundColor: bgColors, barPercentage: 0.6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

function initializeApp() {
    updateUserInterface(); initializeTheme(); initializeTabs(); applyMasks(); setupDynamicFormFields(); updateGlobalDropdowns();
    renderMunicipalities(); renderTasks();
    updateDashboardStats(); initializeDashboardCharts();
    if(!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); } });
});
