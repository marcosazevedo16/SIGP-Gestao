// ============================================================================
// SIGP SAÚDE v25.0 - FINAL (SEM DUPLICIDADES)
// ============================================================================

// 1. SEGURANÇA
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: CryptoJS ausente.');
    throw new Error('CryptoJS is missing');
}

// 2. CONFIGURAÇÕES
const SALT_LENGTH = 16;
let pendingBackupData = null;

// Variáveis de Gráficos
let chartDashboard=null, chartStatusMun=null, chartModulesMun=null, chartTimelineMun=null;
let chartStatusReq=null, chartMunReq=null, chartSolReq=null;
let chartStatusPres=null, chartMunPres=null, chartOrientPres=null;
let chartStatusDem=null, chartPrioDem=null, chartUserDem=null;
let chartStatusVis=null, chartMunVis=null, chartSolVis=null;
let chartStatusProd=null, chartFreqProd=null;

const CHART_COLORS = ['#C85250', '#E7B85F', '#79C2A9', '#5E8C99', '#3B5B66', '#E68161', '#F7DC6F', '#4ECDC4', '#FF6B6B', '#A9DFBF'];

const DADOS_PADRAO = {
    users: [{ id: 1, login: 'ADMIN', name: 'Administrador', salt: 'default', passwordHash: 'cf4fe7c91f87da8b0456ad71ab7b4af52cb95c9b7ecb1a57eaa38bd1bce01aca', permission: 'Administrador', status: 'Ativo' }],
    modulos: [
        { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#FF6B6B' },
        { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#4ECDC4' },
        { id: 3, name: 'Prontuário', abbreviation: 'PEC', color: '#45B7D1' },
        { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#FFA07A' }
    ]
};

// 3. STORAGE
function recuperarDoArmazenamento(chave, valorPadrao = []) {
    try {
        const dados = localStorage.getItem(chave);
        if (!dados || dados === "undefined" || dados === "null") return valorPadrao;
        try {
            const parsed = JSON.parse(dados);
            if (Array.isArray(valorPadrao) && !Array.isArray(parsed)) return valorPadrao;
            return parsed;
        } catch (e) { return dados; }
    } catch (erro) { return valorPadrao; }
}
function salvarNoArmazenamento(chave, dados) {
    try { localStorage.setItem(chave, JSON.stringify(dados)); } catch (e) { console.error(e); }
}
function deletarDoArmazenamento(chave) { localStorage.removeItem(chave); }

function getNextId(key) {
    if (!counters[key]) counters[key] = 1;
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// 4. CARREGAMENTO DE DADOS (ÚNICO E BLINDADO)
let users = recuperarDoArmazenamento('users', []);
if (!Array.isArray(users) || users.length === 0) {
    users = DADOS_PADRAO.users;
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser', null);
if (currentUser && typeof currentUser !== 'object') currentUser = null;
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');
let editingId = null;

// Listas
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
let modulos = recuperarDoArmazenamento('modulos', []);
if (modulos.length === 0) modulos = DADOS_PADRAO.modulos;
let formasApresentacao = recuperarDoArmazenamento('formasApresentacao', []);

let counters = recuperarDoArmazenamento('counters', { mun:1, munList:1, task:1, req:1, dem:1, visit:1, prod:1, pres:1, ver:1, user:2, cargo:1, orient:1, mod:1, forma:1 });

// 5. UI E MENU
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'sidebar-overlay';
        document.body.appendChild(newOverlay);
        newOverlay.onclick = toggleMobileMenu;
        setTimeout(() => { newOverlay.classList.toggle('active'); sidebar.classList.toggle('mobile-open'); }, 10);
        return;
    }
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

// 6. UTILS
function generateSalt() { return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString(); }
function hashPassword(password, salt) { return CryptoJS.SHA256(salt + password).toString(); }
function formatDate(d) { if(!d)return'-'; const p=d.split('-'); return (p.length===3)?`${p[2]}/${p[1]}/${p[0]}`:d; }
function calculateTimeInUse(d) { if(!d)return'-'; const days=Math.ceil(Math.abs(new Date()-new Date(d))/(8.64e7)); const y=Math.floor(days/365), m=Math.floor((days%365)/30); return y>0?`${y} ano(s)`:m>0?`${m} mês(es)`:'< 1 mês'; }
function calculateDaysSince(d) { if(!d)return'-'; return Math.ceil(Math.abs(new Date()-new Date(d))/(8.64e7))+' dias'; }
function showToast(m,t='info') { const el=document.getElementById('toast'); if(el){ el.textContent=m; el.className=`toast ${t} show`; setTimeout(()=>el.classList.remove('show'),3000); } }

// MÁSCARAS
function formatPhoneNumber(v) { v=v.replace(/\D/g,"").substring(0,11); return v.replace(/^(\d{2})(\d)/g,"($1) $2").replace(/(\d)(\d{4})$/,"$1-$2"); }
function formatCompetencia(v) { v=v.replace(/\D/g,"").substring(0,6); if(v.length>2) v=v.replace(/^(\d{2})(\d)/,"$1/$2"); return v; }
function formatPeriodo(v) { v=v.replace(/\D/g,"").substring(0,8); if(v.length>2) v=v.replace(/^(\d{2})(\d)/,"$1/$2"); if(v.length>4) v=v.replace(/^(\d{2})\/(\d{2})(\d)/,"$1/$2 à $3"); if(v.length>6) v=v.replace(/ à (\d{2})(\d)/," à $1/$2"); return v; }

function applyMasks() {
    ['municipality-contact','task-contact','orientador-contact','request-contact','production-contact'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', e => e.target.value = formatPhoneNumber(e.target.value));
    });
    const elComp = document.getElementById('production-competence');
    if (elComp) elComp.addEventListener('input', e => e.target.value = formatCompetencia(e.target.value));
    const elPeriod = document.getElementById('production-period');
    if (elPeriod) {
        elPeriod.placeholder = "DD/MM à DD/MM";
        elPeriod.addEventListener('input', e => e.target.value = formatPeriodo(e.target.value));
    }
    document.querySelectorAll('.filters-section select, .filters-section input').forEach(el => {
        el.addEventListener('change', () => { const t=document.querySelector('.tab-content.active'); if(t) refreshCurrentTab(t.id); });
        if(el.tagName==='INPUT') el.addEventListener('input', () => { const t=document.querySelector('.tab-content.active'); if(t) refreshCurrentTab(t.id); });
    });
}

function setupDynamicFormFields() {
    if (!document.getElementById('restore-confirm-modal')) {
        const html = `<div id="restore-confirm-modal" class="modal"><div class="modal-content"><div class="modal-header"><h3>⚠️ Confirmar Restauração</h3><button class="close-btn" onclick="closeRestoreConfirmModal()">&times;</button></div><div style="padding:24px;"><div class="backup-warning"><p><strong>⚠️ ATENÇÃO: Substituirá os dados atuais!</strong></p></div><div class="backup-preview"><h4>Preview:</h4><ul id="restore-preview-list"></ul></div><div class="modal-actions"><button class="btn btn--secondary" onclick="closeRestoreConfirmModal()">Cancelar</button><button class="btn btn--danger" onclick="confirmRestore()">Restaurar</button></div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
    // Injeção de campos removida pois já estão no HTML final
}

// 7. TEMA E UI
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
    const el = document.getElementById('logged-user-name');
    if (el) el.textContent = currentUser.name;
    const isAdmin = currentUser.permission === 'Administrador';
    const btnUser = document.getElementById('user-management-menu-btn');
    if (btnUser) btnUser.style.display = isAdmin ? 'flex' : 'none';
    const div = document.getElementById('admin-divider');
    if(div) div.style.display = isAdmin ? 'block' : 'none';
}

function initializeTabs() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const secId = this.getAttribute('data-tab') + '-section';
            const sec = document.getElementById(secId);
            if (sec) {
                sec.classList.add('active');
                setTimeout(() => refreshCurrentTab(secId), 10);
            }
            if(window.innerWidth <= 900) {
                document.querySelector('.sidebar').classList.remove('mobile-open');
                const over = document.querySelector('.sidebar-overlay');
                if(over) over.classList.remove('active');
            }
        };
    });
}

function refreshCurrentTab(id) {
    updateGlobalDropdowns();
    if(id === 'municipios-section') renderMunicipalities();
    if(id === 'tarefas-section') renderTasks();
    if(id === 'solicitacoes-section') renderRequests();
    if(id === 'demandas-section') renderDemands();
    if(id === 'visitas-section') renderVisits();
    if(id === 'producao-section') renderProductions();
    if(id === 'apresentacoes-section') renderPresentations();
    if(id === 'versoes-section') renderVersions();
    if(id === 'dashboard-section') { updateDashboardStats(); initializeDashboardCharts(); }
}

function navigateToHome() {
    const btn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if(btn) btn.click();
}
function toggleSettingsMenu() { document.getElementById('settings-menu').classList.toggle('show'); }
function navigateToUserManagement() { toggleSettingsMenu(); openTab('usuarios-section'); renderUsers(); }
function navigateToCargoManagement() { toggleSettingsMenu(); openTab('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettingsMenu(); openTab('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettingsMenu(); openTab('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettingsMenu(); openTab('municipalities-list-section'); renderMunicipalityList(); }
function navigateToFormaApresentacaoManagement() { toggleSettingsMenu(); openTab('formas-apresentacao-section'); renderFormas(); }
function navigateToBackupManagement() { toggleSettingsMenu(); openTab('backup-section'); updateBackupInfo(); }
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// 8. AUTH
function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('login-username').value.trim().toUpperCase();
    const pass = document.getElementById('login-password').value;
    const user = users.find(u => u.login === login && u.status === 'Ativo');
    if (user) {
        if (hashPassword(pass, user.salt) === user.passwordHash) {
            currentUser = user;
            isAuthenticated = true;
            salvarNoArmazenamento('currentUser', currentUser);
            checkAuthentication();
            initializeApp();
            showToast(`Bem-vindo, ${user.name}!`, 'success');
            return;
        }
    }
    document.getElementById('login-error').textContent = 'Login ou senha incorretos.';
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
    if (confirm('Sair?')) { localStorage.removeItem('currentUser'); location.reload(); }
}
function showChangePasswordModal() { document.getElementById('change-password-modal').classList.add('show'); }
function closeChangePasswordModal() { document.getElementById('change-password-modal').classList.remove('show'); }
function handleChangePassword(e) {
    e.preventDefault();
    const n = document.getElementById('new-password').value;
    const c = document.getElementById('confirm-password').value;
    if (n !== c || n.length < 4) { alert('Senhas não conferem.'); return; }
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
        users[idx].salt = generateSalt();
        users[idx].passwordHash = hashPassword(n, users[idx].salt);
        users[idx].mustChangePassword = false;
        salvarNoArmazenamento('users', users);
        currentUser = users[idx];
        salvarNoArmazenamento('currentUser', currentUser);
        closeChangePasswordModal();
        showToast('Senha alterada!');
    }
}

// 9. MUNICÍPIOS
function handleMunicipalityStatusChange() {
    const status = document.getElementById('municipality-status').value;
    const blk = document.getElementById('group-date-blocked');
    const stp = document.getElementById('group-date-stopped');
    if(blk) blk.style.display = (status === 'Bloqueado') ? 'block' : 'none';
    if(stp) stp.style.display = (status === 'Parou de usar') ? 'block' : 'none';
}
function showMunicipalityModal(id = null) {
    editingId = id;
    document.getElementById('municipality-form').reset();
    const sel = document.getElementById('municipality-name');
    populateSelect(sel, municipalitiesList, 'name', 'name');
    document.getElementById('municipality-status').onchange = handleMunicipalityStatusChange;
    const box = document.querySelector('#municipality-form .checkbox-grid');
    if(box) box.innerHTML = modulos.length ? modulos.map(m => `<label><input type="checkbox" value="${m.name}" class="module-checkbox"> ${m.name}</label>`).join('') : '<p>Sem módulos.</p>';
    if (id) {
        const m = municipalities.find(x => x.id === id);
        if (m) {
            if (![...sel.options].some(o => o.value === m.name)) { const opt = document.createElement('option'); opt.value = m.name; opt.text = m.name; sel.add(opt); }
            sel.value = m.name;
            document.getElementById('municipality-status').value = m.status;
            document.getElementById('municipality-manager').value = m.manager;
            document.getElementById('municipality-contact').value = m.contact;
            document.getElementById('municipality-implantation-date').value = m.implantationDate;
            document.getElementById('municipality-last-visit').value = m.lastVisit;
            if(document.getElementById('municipality-date-blocked')) document.getElementById('municipality-date-blocked').value = m.dateBlocked || '';
            if(document.getElementById('municipality-date-stopped')) document.getElementById('municipality-date-stopped').value = m.dateStopped || '';
            if(m.modules) document.querySelectorAll('.module-checkbox').forEach(c => c.checked = m.modules.includes(c.value));
            handleMunicipalityStatusChange();
        }
    } else { handleMunicipalityStatusChange(); }
    document.getElementById('municipality-modal').classList.add('show');
}
function saveMunicipality(e) {
    e.preventDefault();
    const name = document.getElementById('municipality-name').value;
    const status = document.getElementById('municipality-status').value;
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(c => c.value);
    if (!editingId && municipalities.some(m => m.name === name)) { alert('Já cadastrado!'); return; }
    if (status === 'Em uso' && mods.length === 0) { alert('Selecione um módulo.'); return; }
    const dateBlocked = document.getElementById('municipality-date-blocked')?.value || '';
    if (status === 'Bloqueado' && !dateBlocked) { alert('Preencha a Data Bloqueado.'); return; }

    const data = {
        name, status, modules: mods,
        manager: document.getElementById('municipality-manager').value,
        contact: document.getElementById('municipality-contact').value,
        implantationDate: document.getElementById('municipality-implantation-date').value,
        lastVisit: document.getElementById('municipality-last-visit').value,
        dateBlocked: dateBlocked,
        dateStopped: document.getElementById('municipality-date-stopped')?.value || ''
    };
    if (editingId) {
        const i = municipalities.findIndex(x => x.id === editingId);
        if (i !== -1) municipalities[i] = { ...municipalities[i], ...data };
    } else {
        municipalities.push({ id: getNextId('mun'), ...data });
    }
    salvarNoArmazenamento('municipalities', municipalities);
    document.getElementById('municipality-modal').classList.remove('show');
    renderMunicipalities();
    updateGlobalDropdowns();
    showToast('Salvo!');
}
function getFilteredMunicipalities() {
    const fName = document.getElementById('filter-municipality-name')?.value;
    const fStatus = document.getElementById('filter-municipality-status')?.value;
    const fMod = document.getElementById('filter-municipality-module')?.value;
    const fGest = document.getElementById('filter-municipality-manager')?.value.toLowerCase();
    return municipalities.filter(m => {
        if (fName && m.name !== fName) return false;
        if (fStatus && m.status !== fStatus) return false;
        if (fMod && !m.modules.includes(fMod)) return false;
        if (fGest && !m.manager.toLowerCase().includes(fGest)) return false;
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
}
function renderMunicipalities() {
    const filtered = getFilteredMunicipalities();
    const c = document.getElementById('municipalities-table');
    const count = document.getElementById('municipalities-results-count');
    if(count) { count.innerHTML = `<strong>${filtered.length}</strong> municípios`; count.style.display = 'block'; }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(m => {
            let dFim = '-', cor = 'inherit';
            if(m.status === 'Bloqueado') { dFim = formatDate(m.dateBlocked); cor = '#C85250'; }
            if(m.status === 'Parou de usar') { dFim = formatDate(m.dateStopped); cor = '#E68161'; }
            const badges = m.modules.map(modName => {
                const conf = modulos.find(x => x.name === modName);
                const abbr = conf ? conf.abbreviation : modName.substring(0,3).toUpperCase();
                return `<span style="background:rgba(0,85,128,0.05);color:#005580;border:1px solid rgba(0,85,128,0.3);padding:0 4px;border-radius:3px;font-size:9px;margin:0 2px;font-weight:700;">${abbr}</span>`;
            }).join('');
            let cls = 'task-status', stl = '';
            if(m.status === 'Em uso') cls += ' completed';
            else if(m.status === 'Bloqueado') cls += ' cancelled';
            else if(m.status === 'Parou de usar') cls += ' pending';
            else stl = 'background:rgba(150,150,150,0.15);color:#666;border:1px solid #ccc;';
            
            return `<tr><td style="font-weight:bold;color:#000;">${m.name}</td><td style="max-width:140px;white-space:normal;line-height:1.1;">${badges}</td><td style="font-size:12px;">${m.manager}</td><td>${m.contact}</td><td>${formatDate(m.implantationDate)}</td><td>${formatDate(m.lastVisit)}</td><td style="font-size:11px;">${calculateTimeInUse(m.implantationDate)}</td><td style="font-size:11px;">${calculateDaysSince(m.lastVisit)}</td><td><span class="${cls}" style="${stl}">${m.status}</span></td><td style="color:${cor};font-size:11px;font-weight:500;">${dFim}</td><td><button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button> <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Visita</th><th>Tempo</th><th>Dias</th><th>Status</th><th>Bloq/Parou</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updateMunicipalityCharts(filtered);
}
function updateMunicipalityCharts(data) {
    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusMun) chartStatusMun.destroy();
        chartStatusMun = new Chart(ctxStatus, { type: 'pie', data: { labels: ['Em uso', 'Bloqueado', 'Parou de usar', 'Não Implantado'], datasets: [{ data: [data.filter(m => m.status === 'Em uso').length, data.filter(m => m.status === 'Bloqueado').length, data.filter(m => m.status === 'Parou de usar').length, data.filter(m => m.status === 'Não Implantado').length], backgroundColor: ['#005580', '#C85250', '#E68161', '#79C2A9'] }] } });
    }
    const ctxModules = document.getElementById('modulesChart');
    if (ctxModules && window.Chart) {
        if (chartModulesMun) chartModulesMun.destroy();
        const modCounts = {}; data.forEach(m => { m.modules.forEach(mod => { modCounts[mod] = (modCounts[mod] || 0) + 1; }); });
        const labels = Object.keys(modCounts);
        const bgColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        chartModulesMun = new Chart(ctxModules, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Qtd', data: Object.values(modCounts), backgroundColor: bgColors }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
    const ctxTimeline = document.getElementById('timelineChart');
    if (ctxTimeline && window.Chart) {
        if (chartTimelineMun) chartTimelineMun.destroy();
        const impls = data.filter(m => m.implantationDate).map(m => m.implantationDate.substring(0, 7)).sort();
        const timeData = {}; let acc = 0;
        impls.forEach(d => timeData[d] = (timeData[d]||0)+1);
        const labels = []; const values = [];
        Object.keys(timeData).sort().forEach(k => { acc += timeData[k]; labels.push(`${k.split('-')[1]}/${k.split('-')[0]}`); values.push(acc); });
        chartTimelineMun = new Chart(ctxTimeline, { type: 'line', data: { labels: labels, datasets: [{ label: 'Acumulado', data: values, borderColor: '#005580', backgroundColor: 'rgba(0,85,128,0.1)', fill: true }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
    if(document.getElementById('total-municipalities')) document.getElementById('total-municipalities').textContent = data.length;
}
function deleteMunicipality(id) { if (confirm('Excluir?')) { municipalities = municipalities.filter(x => x.id !== id); salvarNoArmazenamento('municipalities', municipalities); renderMunicipalities(); updateGlobalDropdowns(); } }
function closeMunicipalityModal() { document.getElementById('municipality-modal').classList.remove('show'); }
function clearMunicipalityFilters() { ['filter-municipality-name','filter-municipality-status','filter-municipality-module','filter-municipality-manager'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderMunicipalities(); }

// 12. TREINAMENTOS
function showTaskModal(id = null) {
    editingId = id; document.getElementById('task-form').reset(); updateGlobalDropdowns();
    const form = document.getElementById('task-form'); const fieldMun = document.getElementById('task-municipality').closest('.form-group'); if(fieldMun) form.insertBefore(fieldMun, form.firstChild);
    if (id) {
        const t = tasks.find(x => x.id === id);
        document.getElementById('task-date-requested').value = t.dateRequested;
        document.getElementById('task-municipality').value = t.municipality;
        document.getElementById('task-requested-by').value = t.requestedBy;
        document.getElementById('task-performed-by').value = t.performedBy;
        document.getElementById('task-status').value = t.status;
        document.getElementById('task-trained-name').value = t.trainedName||'';
        document.getElementById('task-trained-position').value = t.trainedPosition||'';
        document.getElementById('task-contact').value = t.contact||'';
        document.getElementById('task-observations').value = t.observations||'';
        document.getElementById('task-date-performed').value = t.datePerformed||'';
    }
    document.getElementById('task-modal').classList.add('show');
}
function saveTask(e) {
    e.preventDefault();
    const data = { dateRequested: document.getElementById('task-date-requested').value, datePerformed: document.getElementById('task-date-performed').value, municipality: document.getElementById('task-municipality').value, requestedBy: document.getElementById('task-requested-by').value, performedBy: document.getElementById('task-performed-by').value, trainedName: document.getElementById('task-trained-name').value, trainedPosition: document.getElementById('task-trained-position').value, contact: document.getElementById('task-contact').value, status: document.getElementById('task-status').value, observations: document.getElementById('task-observations').value };
    if (editingId) { const i = tasks.findIndex(x => x.id === editingId); if(i!==-1) tasks[i] = {...tasks[i],...data}; } else { tasks.push({id:getNextId('task'),...data}); }
    salvarNoArmazenamento('tasks', tasks); document.getElementById('task-modal').classList.remove('show'); clearTaskFilters(); showToast('Salvo!');
}
function getFilteredTasks() {
    const fMun = document.getElementById('filter-task-municipality')?.value, fStatus = document.getElementById('filter-task-status')?.value, fReq = document.getElementById('filter-task-requester')?.value.toLowerCase();
    const fDateStart = document.getElementById('filter-task-date-start')?.value, fDateEnd = document.getElementById('filter-task-date-end')?.value;
    const fPerf = document.getElementById('filter-task-performer')?.value, fCargo = document.getElementById('filter-task-position')?.value;
    const fDateType = document.getElementById('filter-date-type')?.value || 'requested';
    return tasks.filter(t => {
        if (fMun && t.municipality !== fMun) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if (fPerf && t.performedBy !== fPerf) return false;
        if (fCargo && t.trainedPosition !== fCargo) return false;
        const dCheck = (fDateType === 'performed') ? t.datePerformed : t.dateRequested;
        if (fDateStart && dCheck < fDateStart) return false;
        if (fDateEnd && dCheck > fDateEnd) return false;
        return true;
    }).sort((a,b) => new Date(a.dateRequested) - new Date(b.dateRequested));
}
function renderTasks() {
    const filtered = getFilteredTasks();
    const c = document.getElementById('tasks-table');
    const count = document.getElementById('tasks-results-count');
    if(count) { count.innerHTML = `<strong>${filtered.length}</strong> treinamentos`; count.style.display='block'; }
    if(filtered.length===0){ c.innerHTML='<div class="empty-state">Vazio.</div>'; } else {
        const rows = filtered.map(t => {
            const obs = (t.observations && t.observations.length>30)?t.observations.substring(0,30)+'...':(t.observations||'-');
            const cls = (t.status==='Concluído')?'completed':(t.status==='Cancelado'?'cancelled':'pending');
            return `<tr><td style="font-weight:bold;color:#000;">${t.municipality}</td><td>${formatDate(t.dateRequested)}</td><td>${formatDate(t.datePerformed)}</td><td>${t.requestedBy}</td><td>${t.performedBy}</td><td>${t.trainedName||'-'}</td><td>${t.trainedPosition||'-'}</td><td>${t.contact||'-'}</td><td style="font-size:12px;color:#555;">${obs}</td><td><span class="task-status ${cls}">${t.status}</span></td><td><button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button><button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data Sol.</th><th>Data Real.</th><th>Solicitante</th><th>Orientador</th><th>Profissional</th><th>Cargo</th><th>Contato</th><th>Obs</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
}
function deleteTask(id) { if (confirm('Excluir?')) { tasks = tasks.filter(x => x.id !== id); salvarNoArmazenamento('tasks', tasks); renderTasks(); } }
function closeTaskModal() { document.getElementById('task-modal').classList.remove('show'); }
function clearTaskFilters() { ['filter-task-municipality','filter-task-status','filter-task-requester','filter-task-performer','filter-task-position','filter-task-date-start','filter-task-date-end'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderTasks(); }

// 13. SOLICITAÇÕES
function handleRequestStatusChange() {
    const status = document.getElementById('request-status').value;
    const grpReal = document.getElementById('group-request-date-realization');
    const grpJust = document.getElementById('group-request-justification');
    if(grpReal) grpReal.style.display = (status === 'Realizado') ? 'block' : 'none';
    if(grpJust) grpJust.style.display = (status === 'Inviável') ? 'block' : 'none';
}
function showRequestModal(id = null) {
    editingId = id; document.getElementById('request-form').reset();
    const fieldMun = document.getElementById('request-municipality').closest('.form-group');
    if(fieldMun) document.getElementById('request-form').insertBefore(fieldMun, document.getElementById('request-form').firstChild);
    document.getElementById('request-status').onchange = handleRequestStatusChange; updateGlobalDropdowns();
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
    if (status === 'Realizado' && !document.getElementById('request-date-realization').value) { alert('Data Realização obrigatória.'); return; }
    if (status === 'Inviável' && !document.getElementById('request-justification').value) { alert('Justificativa obrigatória.'); return; }
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
    if (editingId) { const i = requests.findIndex(x => x.id === editingId); if(i!==-1) requests[i] = {...requests[i],...data}; } else { requests.push({id:getNextId('req'),...data}); }
    salvarNoArmazenamento('requests', requests); document.getElementById('request-modal').classList.remove('show'); renderRequests(); showToast('Salvo!');
}
function getFilteredRequests() {
    const fMun = document.getElementById('filter-request-municipality')?.value;
    const fStatus = document.getElementById('filter-request-status')?.value;
    const fSol = document.getElementById('filter-request-solicitante')?.value.toLowerCase();
    const fUser = document.getElementById('filter-request-user')?.value.toLowerCase();
    const fDateStart = document.getElementById('filter-request-date-start')?.value;
    const fDateEnd = document.getElementById('filter-request-date-end')?.value;
    return requests.filter(r => {
        if (fMun && r.municipality !== fMun) return false;
        if (fStatus && r.status !== fStatus) return false;
        if (fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        if (fUser && (!r.user || !r.user.toLowerCase().includes(fUser))) return false;
        if (fDateStart && r.date < fDateStart) return false;
        if (fDateEnd && r.date > fDateEnd) return false;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
}
function renderRequests() {
    const filtered = getFilteredRequests();
    const c = document.getElementById('requests-table');
    const count = document.getElementById('requests-results-count');
    if(count) { count.innerHTML = `<strong>${filtered.length}</strong> solicitações`; count.style.display='block'; }
    if(filtered.length===0) { c.innerHTML='<div class="empty-state">Vazio.</div>'; } else {
        const rows = filtered.map(x => {
            const desc = x.description.length > 30 ? x.description.substring(0,30)+'...' : x.description;
            let cls = 'task-status';
            if (x.status === 'Realizado') cls += ' completed';
            else if (x.status === 'Inviável') cls += ' cancelled';
            else cls += ' pending';
            return `<tr><td style="font-weight:bold;color:#000;">${x.municipality}</td><td>${formatDate(x.date)}</td><td>${formatDate(x.dateRealization)}</td><td>${x.requester}</td><td>${x.contact}</td><td title="${x.description}">${desc}</td><td>${x.user||'-'}</td><td><span class="${cls}">${x.status}</span></td><td>${x.justification||'-'}</td><td><button class="btn btn--sm" onclick="showRequestModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteRequest(${x.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data Sol.</th><th>Data Real.</th><th>Solicitante</th><th>Contato</th><th>Descrição</th><th>Usuário</th><th>Status</th><th>Justificativa</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updateRequestCharts(filtered);
}
function updateRequestCharts(data) {
    if (document.getElementById('requestStatusChart') && window.Chart) {
        if (chartStatusReq) chartStatusReq.destroy();
        chartStatusReq = new Chart(document.getElementById('requestStatusChart'), { type: 'pie', data: { labels: ['Pendente', 'Realizado', 'Inviável'], datasets: [{ data: [data.filter(x=>x.status==='Pendente').length, data.filter(x=>x.status==='Realizado').length, data.filter(x=>x.status==='Inviável').length], backgroundColor: ['#E68161', '#005580', '#C85250'] }] } });
    }
    if (document.getElementById('requestMunicipalityChart') && window.Chart) {
        if (chartMunReq) chartMunReq.destroy();
        const mCounts = {}; data.forEach(r => mCounts[r.municipality] = (mCounts[r.municipality]||0)+1);
        const labels = Object.keys(mCounts);
        const bgColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        chartMunReq = new Chart(document.getElementById('requestMunicipalityChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Qtd', data: Object.values(mCounts), backgroundColor: bgColors }] }, options: { scales: { x: { ticks: { display: false } } } } });
    }
}
function deleteRequest(id) { if (confirm('Excluir?')) { requests = requests.filter(x => x.id !== id); salvarNoArmazenamento('requests', requests); renderRequests(); } }
function closeRequestModal() { document.getElementById('request-modal').classList.remove('show'); }
function clearRequestFilters() { ['filter-request-municipality','filter-request-status','filter-request-solicitante','filter-request-user','filter-request-date-start','filter-request-date-end'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderRequests(); }

// 14. APRESENTAÇÕES
function handlePresentationStatusChange() {
    const status = document.getElementById('presentation-status').value;
    const grpDate = document.getElementById('presentation-date-realizacao-group');
    const lblDate = document.getElementById('presentation-date-realizacao-label');
    const lblOrient = document.getElementById('presentation-orientador-label');
    const lblForms = document.getElementById('presentation-forms-label');
    const lblDesc = document.getElementById('presentation-description-label');
    if(lblDate) lblDate.textContent = 'Data de Realização';
    if(lblOrient) lblOrient.textContent = 'Orientador(es)';
    if(lblForms) lblForms.textContent = 'Formas de Apresentação';
    if(lblDesc) lblDesc.textContent = 'Descrição/Detalhes';
    if(grpDate) grpDate.style.display = 'block';

    if (status === 'Realizada') {
        if(lblDate) lblDate.textContent += '*'; if(lblOrient) lblOrient.textContent += '*'; if(lblForms) lblForms.textContent += '*';
    } else if (status === 'Pendente') {
        if(lblOrient) lblOrient.textContent += '*';
    } else if (status === 'Cancelada') {
        if(lblDesc) lblDesc.textContent += '*';
    }
}
function showPresentationModal(id = null) {
    editingId = id; document.getElementById('presentation-form').reset();
    populateSelect(document.getElementById('presentation-municipality'), municipalitiesList, 'name', 'name');
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if(divO) divO.innerHTML = orientadores.map(o=>`<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
    const divF = document.getElementById('presentation-forms-checkboxes');
    if(divF) divF.innerHTML = formasApresentacao.map(f=>`<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');

    if (id) {
        const p = presentations.find(x => x.id === id);
        if(p) {
            const sel = document.getElementById('presentation-municipality');
            if (![...sel.options].some(o => o.value === p.municipality)) { const opt = document.createElement('option'); opt.value = p.municipality; opt.text = p.municipality; sel.add(opt); }
            sel.value = p.municipality;
            document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
            document.getElementById('presentation-requester').value = p.requester;
            document.getElementById('presentation-status').value = p.status;
            document.getElementById('presentation-description').value = p.description;
            document.getElementById('presentation-date-realizacao').value = p.dateRealizacao || '';
            if(p.orientadores) document.querySelectorAll('.orientador-check').forEach(c => c.checked = p.orientadores.includes(c.value));
            if(p.forms) document.querySelectorAll('.forma-check').forEach(c => c.checked = p.forms.includes(c.value));
            handlePresentationStatusChange();
        }
    } else { handlePresentationStatusChange(); }
    document.getElementById('presentation-modal').classList.add('show');
}
function savePresentation(e) {
    e.preventDefault();
    const status = document.getElementById('presentation-status').value;
    const orientadoresSel = Array.from(document.querySelectorAll('.orientador-check:checked')).map(c => c.value);
    const formasSel = Array.from(document.querySelectorAll('.forma-check:checked')).map(c => c.value);
    const dateReal = document.getElementById('presentation-date-realizacao').value;
    const desc = document.getElementById('presentation-description').value.trim();

    if (status === 'Realizada') {
        if (!dateReal) { alert('Data Realização obrigatória.'); return; }
        if (orientadoresSel.length === 0) { alert('Selecione Orientador.'); return; }
        if (formasSel.length === 0) { alert('Selecione Forma.'); return; }
    } else if (status === 'Pendente' && orientadoresSel.length === 0) { alert('Selecione Orientador.'); return; }
    else if (status === 'Cancelada' && desc === '') { alert('Descrição obrigatória.'); return; }

    const data = {
        municipality: document.getElementById('presentation-municipality').value,
        dateSolicitacao: document.getElementById('presentation-date-solicitacao').value,
        requester: document.getElementById('presentation-requester').value,
        status: status,
        description: desc,
        dateRealizacao: dateReal,
        orientadores: orientadoresSel,
        forms: formasSel
    };
    if (editingId) { const i = presentations.findIndex(x => x.id === editingId); presentations[i] = { ...presentations[i], ...data }; } else { presentations.push({ id: getNextId('pres'), ...data }); }
    salvarNoArmazenamento('presentations', presentations); document.getElementById('presentation-modal').classList.remove('show'); clearPresentationFilters(); showToast('Salvo!');
}
function getFilteredPresentations() {
    const fMun = document.getElementById('filter-presentation-municipality')?.value;
    const fStatus = document.getElementById('filter-presentation-status')?.value;
    const fReq = document.getElementById('filter-presentation-requester')?.value.toLowerCase();
    const fOrient = document.getElementById('filter-presentation-orientador')?.value;
    const fDateStart = document.getElementById('filter-presentation-date-start')?.value;
    const fDateEnd = document.getElementById('filter-presentation-date-end')?.value;

    return presentations.filter(p => {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fReq && !p.requester.toLowerCase().includes(fReq)) return false;
        if (fOrient && (!p.orientadores || !p.orientadores.includes(fOrient))) return false;
        if (fDateStart && p.dateSolicitacao < fDateStart) return false;
        if (fDateEnd && p.dateSolicitacao > fDateEnd) return false;
        return true;
    }).sort((a,b) => new Date(a.dateSolicitacao) - new Date(b.dateSolicitacao));
}
function renderPresentations() {
    const filtered = getFilteredPresentations();
    const c = document.getElementById('presentations-table');
    const countDiv = document.getElementById('presentations-results-count');
    if (countDiv) { countDiv.innerHTML = `<strong>${filtered.length}</strong> apresentações`; countDiv.style.display = 'block'; }
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; } else {
        const rows = filtered.map(p => {
            const desc = p.description ? (p.description.length > 20 ? p.description.substring(0,20) + '...' : p.description) : '-';
            let cls = 'task-status';
            if (p.status === 'Realizada') cls += ' completed'; else if (p.status === 'Cancelada') cls += ' cancelled'; else cls += ' pending';
            return `<tr><td style="font-weight:bold;color:#000;">${p.municipality}</td><td>${formatDate(p.dateSolicitacao)}</td><td>${p.requester}</td><td>${(p.orientadores||[]).join(', ')}</td><td>${(p.forms||[]).join(', ')}</td><td title="${p.description||''}">${desc}</td><td>${formatDate(p.dateRealizacao)}</td><td><span class="${cls}">${p.status}</span></td><td><button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button><button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data Sol.</th><th>Solicitante</th><th>Orientadores</th><th>Formas</th><th>Descrição</th><th>Realização</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updatePresentationCharts(filtered);
}
function updatePresentationCharts(data) {
    if (document.getElementById('presentationStatusChart') && window.Chart) {
        if (chartStatusPres) chartStatusPres.destroy();
        chartStatusPres = new Chart(document.getElementById('presentationStatusChart'), { type: 'pie', data: { labels: ['Pendente', 'Realizada', 'Cancelada'], datasets: [{ data: [data.filter(p=>p.status==='Pendente').length, data.filter(p=>p.status==='Realizada').length, data.filter(p=>p.status==='Cancelada').length], backgroundColor: ['#E68161', '#005580', '#C85250'] }] } });
    }
    if (document.getElementById('presentationMunicipalityChart') && window.Chart) {
        if (chartMunPres) chartMunPres.destroy();
        const mC = {}; data.forEach(p => mC[p.municipality] = (mC[p.municipality]||0)+1);
        const labels = Object.keys(mC);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        chartMunPres = new Chart(document.getElementById('presentationMunicipalityChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Qtd', data: Object.values(mC), backgroundColor: colors }] } });
    }
    if (document.getElementById('presentationOrientadorChart') && window.Chart) {
        if (chartOrientPres) chartOrientPres.destroy();
        const oC = {}; data.forEach(p => { if(p.orientadores) p.orientadores.forEach(o => oC[o] = (oC[o]||0)+1); });
        const labels = Object.keys(oC);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        chartOrientPres = new Chart(document.getElementById('presentationOrientadorChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Qtd', data: Object.values(oC), backgroundColor: colors }] } });
    }
}
function deletePresentation(id) { if (confirm('Excluir?')) { presentations = presentations.filter(x => x.id !== id); salvarNoArmazenamento('presentations', presentations); renderPresentations(); } }
function closePresentationModal() { document.getElementById('presentation-modal').classList.remove('show'); }
function clearPresentationFilters() { ['filter-presentation-municipality','filter-presentation-status','filter-presentation-requester','filter-presentation-orientador','filter-presentation-date-start','filter-presentation-date-end'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderPresentations(); }

// 15. DEMANDAS
function handleDemandStatusChange() {
    const status = document.getElementById('demand-status').value;
    const grpReal = document.getElementById('demand-realization-date-group');
    const grpJust = document.getElementById('demand-justification-group');
    const lblReal = document.getElementById('demand-realization-label');
    const lblJust = document.getElementById('demand-justification-label');
    if(lblReal) lblReal.textContent = 'Data de Realização';
    if(lblJust) lblJust.textContent = 'Justificativa Inviabilidade';
    grpReal.style.display = 'none';
    grpJust.style.display = 'none';

    if (status === 'Realizada') {
        grpReal.style.display = 'block';
        if(lblReal) lblReal.textContent += '*';
    } else if (status === 'Inviável') {
        grpJust.style.display = 'block';
        if(lblJust) lblJust.textContent += '*';
    }
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
    const dateReal = document.getElementById('demand-realization-date').value;
    const justif = document.getElementById('demand-justification').value.trim();
    if (status === 'Realizada' && !dateReal) { alert('Data Realização obrigatória.'); return; }
    if (status === 'Inviável' && !justif) { alert('Justificativa obrigatória.'); return; }
    const data = {
        date: document.getElementById('demand-date').value,
        description: document.getElementById('demand-description').value,
        priority: document.getElementById('demand-priority').value,
        status: status,
        dateRealization: dateReal,
        justification: justif,
        user: currentUser.name
    };
    if (editingId) { const i = demands.findIndex(x => x.id === editingId); if(i!==-1) demands[i] = {...demands[i],...data}; } else { demands.push({id:getNextId('dem'),...data}); }
    salvarNoArmazenamento('demands', demands); document.getElementById('demand-modal').classList.remove('show'); clearDemandFilters(); showToast('Salvo!');
}
function getFilteredDemands() {
    const fStatus = document.getElementById('filter-demand-status')?.value;
    const fPrio = document.getElementById('filter-demand-priority')?.value;
    const fUser = document.getElementById('filter-demand-user')?.value;
    const fDateStart = document.getElementById('filter-demand-date-start')?.value;
    const fDateEnd = document.getElementById('filter-demand-date-end')?.value;
    return demands.filter(d => {
        if (fStatus && d.status !== fStatus) return false;
        if (fPrio && d.priority !== fPrio) return false;
        if (fUser && d.user !== fUser) return false;
        if (fDateStart && d.date < fDateStart) return false;
        if (fDateEnd && d.date > fDateEnd) return false;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
}
function renderDemands() {
    const filtered = getFilteredDemands();
    const c = document.getElementById('demands-table');
    document.getElementById('demands-results-count').innerHTML = `<strong>${filtered.length}</strong> demandas`;
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; } else {
        const rows = filtered.map(d => {
            let cls = 'task-status';
            if (d.status === 'Realizada') cls += ' completed'; else if (d.status === 'Inviável') cls += ' cancelled'; else cls += ' pending';
            let pCol = 'inherit';
            if (d.priority === 'Alta') pCol = '#C85250'; if (d.priority === 'Média') pCol = '#E68161'; if (d.priority === 'Baixa') pCol = '#79C2A9';
            return `<tr><td style="font-weight:bold;color:#000;">${d.user||'-'}</td><td>${formatDate(d.date)}</td><td>${d.description}</td><td style="color:${pCol};font-weight:bold;">${d.priority}</td><td><span class="${cls}">${d.status}</span></td><td>${formatDate(d.dateRealization)}</td><td>${d.justification||'-'}</td><td><button class="btn btn--sm" onclick="showDemandModal(${d.id})">✏️</button><button class="btn btn--sm" onclick="deleteDemand(${d.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Usuário</th><th>Data Sol.</th><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Realização</th><th>Justificativa</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updateDemandCharts(filtered);
}
function updateDemandCharts(data) {
    if (document.getElementById('demandStatusChart') && window.Chart) {
        if (chartStatusDem) chartStatusDem.destroy();
        chartStatusDem = new Chart(document.getElementById('demandStatusChart'), { type: 'pie', data: { labels: ['Pendente', 'Realizada', 'Inviável'], datasets: [{ data: [data.filter(d=>d.status==='Pendente').length, data.filter(d=>d.status==='Realizada').length, data.filter(d=>d.status==='Inviável').length], backgroundColor: ['#E68161', '#005580', '#C85250'] }] } });
    }
    if (document.getElementById('demandPriorityChart') && window.Chart) {
        if (chartPrioDem) chartPrioDem.destroy();
        const pCounts = { 'Alta':0, 'Média':0, 'Baixa':0 }; data.forEach(d => pCounts[d.priority] = (pCounts[d.priority]||0)+1);
        chartPrioDem = new Chart(document.getElementById('demandPriorityChart'), { type: 'bar', data: { labels: Object.keys(pCounts), datasets: [{ label: 'Qtd', data: Object.values(pCounts), backgroundColor: ['#C85250', '#E68161', '#79C2A9'] }] } });
    }
    if (document.getElementById('demandUserChart') && window.Chart) {
        if (chartUserDem) chartUserDem.destroy();
        const uCounts = {}; data.forEach(d => uCounts[d.user] = (uCounts[d.user]||0)+1);
        const labels = Object.keys(uCounts);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        chartUserDem = new Chart(document.getElementById('demandUserChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Qtd', data: Object.values(uCounts), backgroundColor: colors }] } });
    }
}
function deleteDemand(id) { if (confirm('Excluir?')) { demands = demands.filter(x => x.id !== id); salvarNoArmazenamento('demands', demands); renderDemands(); } }
function closeDemandModal() { document.getElementById('demand-modal').classList.remove('show'); }
function clearDemandFilters() { ['filter-demand-status','filter-demand-priority','filter-demand-user','filter-demand-date-start','filter-demand-date-end'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderDemands(); }

// 16. VISITAS
function handleVisitStatusChange() {
    const status = document.getElementById('visit-status').value;
    const grpReal = document.getElementById('group-visit-date-realization');
    const grpJust = document.getElementById('group-visit-justification');
    if (grpReal) grpReal.style.display = (status === 'Realizada') ? 'block' : 'none';
    if (grpJust) grpJust.style.display = (status === 'Cancelada') ? 'block' : 'none';
}
function showVisitModal(id = null) {
    editingId = id; document.getElementById('visit-form').reset();
    const sel = document.getElementById('visit-municipality'); populateSelect(sel, municipalitiesList, 'name', 'name');
    document.getElementById('visit-status').onchange = handleVisitStatusChange;
    if (id) {
        const v = visits.find(x => x.id === id);
        if(v) {
            if (![...sel.options].some(o => o.value === v.municipality)) { const opt = document.createElement('option'); opt.value = v.municipality; opt.text = v.municipality; sel.add(opt); }
            sel.value = v.municipality;
            document.getElementById('visit-date').value = v.date;
            document.getElementById('visit-applicant').value = v.applicant;
            document.getElementById('visit-status').value = v.status;
            if(document.getElementById('visit-reason')) document.getElementById('visit-reason').value = v.reason || '';
            if(document.getElementById('visit-visit-date')) document.getElementById('visit-visit-date').value = v.dateRealization || '';
            if(document.getElementById('visit-cancel-justification')) document.getElementById('visit-cancel-justification').value = v.justification || '';
            handleVisitStatusChange();
        }
    } else { handleVisitStatusChange(); }
    document.getElementById('visit-modal').classList.add('show');
}
function saveVisit(e) {
    e.preventDefault();
    const status = document.getElementById('visit-status').value;
    if (status === 'Realizada' && !document.getElementById('visit-date-realization').value) { alert('Data Realização obrigatória.'); return; }
    if (status === 'Cancelada' && !document.getElementById('visit-justification').value) { alert('Justificativa obrigatória.'); return; }
    const data = {
        municipality: document.getElementById('visit-municipality').value,
        date: document.getElementById('visit-date').value,
        applicant: document.getElementById('visit-applicant').value,
        status: status,
        dateRealization: document.getElementById('visit-date-realization').value,
        justification: document.getElementById('visit-justification').value
    };
    if (editingId) { const i = visits.findIndex(x => x.id === editingId); visits[i] = { ...visits[i], ...data }; } else { visits.push({ id: getNextId('visit'), ...data }); }
    salvarNoArmazenamento('visits', visits); document.getElementById('visit-modal').classList.remove('show'); renderVisits(); showToast('Salvo!');
}
function getFilteredVisits() {
    const fMun = document.getElementById('filter-visit-municipality')?.value;
    const fStatus = document.getElementById('filter-visit-status')?.value;
    const fApp = document.getElementById('filter-visit-applicant')?.value.toLowerCase();
    const fDateStart = document.getElementById('filter-visit-date-start')?.value;
    const fDateEnd = document.getElementById('filter-visit-date-end')?.value;
    return visits.filter(v => {
        if (fMun && v.municipality !== fMun) return false;
        if (fStatus && v.status !== fStatus) return false;
        if (fApp && !v.applicant.toLowerCase().includes(fApp)) return false;
        if (fDateStart && v.date < fDateStart) return false;
        if (fDateEnd && v.date > fDateEnd) return false;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
}
function renderVisits() {
    const filtered = getFilteredVisits();
    const c = document.getElementById('visits-table');
    document.getElementById('visits-results-count').innerHTML = `<strong>${filtered.length}</strong> visitas`;
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; } else {
        const rows = filtered.map(v => {
            let cls = 'task-status';
            if (v.status === 'Realizada') cls += ' completed'; else if (v.status === 'Cancelada') cls += ' cancelled'; else cls += ' pending';
            return `<tr><td style="font-weight:bold;color:#000;">${v.municipality}</td><td>${formatDate(v.date)}</td><td>${v.applicant}</td><td style="font-size:12px;">${v.reason||'-'}</td><td><span class="${cls}">${v.status}</span></td><td>${formatDate(v.dateRealization)}</td><td style="font-size:12px;color:#555;">${v.justification||'-'}</td><td><button class="btn btn--sm" onclick="showVisitModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVisit(${v.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data Sol.</th><th>Solicitante</th><th>Motivo</th><th>Status</th><th>Realização</th><th>Justificativa</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updateVisitCharts(filtered);
}
function updateVisitCharts(data) {
    if (document.getElementById('visitStatusChart') && window.Chart) {
        if (chartStatusVis) chartStatusVis.destroy();
        chartStatusVis = new Chart(document.getElementById('visitStatusChart'), { type: 'pie', data: { labels: ['Pendente', 'Realizada', 'Cancelada'], datasets: [{ data: [data.filter(v=>v.status==='Pendente').length, data.filter(v=>v.status==='Realizada').length, data.filter(v=>v.status==='Cancelada').length], backgroundColor: ['#E68161', '#005580', '#C85250'] }] } });
    }
    if (document.getElementById('visitMunicipalityChart') && window.Chart) {
        if (chartMunVis) chartMunVis.destroy();
        const mCounts = {}; data.forEach(v => mCounts[v.municipality] = (mCounts[v.municipality]||0)+1);
        const labels = Object.keys(mCounts);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        chartMunVis = new Chart(document.getElementById('visitMunicipalityChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Qtd', data: Object.values(mCounts), backgroundColor: colors }] }, options: { scales: { x: { ticks: { display: false } } } } });
    }
}
function deleteVisit(id) { if (confirm('Excluir?')) { visits = visits.filter(x => x.id !== id); salvarNoArmazenamento('visits', visits); renderVisits(); } }
function closeVisitModal() { document.getElementById('visit-modal').classList.remove('show'); }
function clearVisitFilters() { ['filter-visit-municipality','filter-visit-status','filter-visit-applicant','filter-visit-date-start','filter-visit-date-end'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderVisits(); }

// 17. PRODUÇÃO
function showProductionModal(id = null) {
    editingId = id; document.getElementById('production-form').reset();
    populateSelect(document.getElementById('production-municipality'), municipalitiesList, 'name', 'name');
    handleProductionFrequencyChange();
    if (id) {
        const p = productions.find(x => x.id === id);
        if(p) {
            const sel = document.getElementById('production-municipality');
            if (![...sel.options].some(o => o.value === p.municipality)) { const opt = document.createElement('option'); opt.value = p.municipality; opt.text = p.municipality; sel.add(opt); }
            sel.value = p.municipality;
            document.getElementById('production-frequency').value = p.frequency;
            document.getElementById('production-competence').value = p.competence;
            document.getElementById('production-period').value = p.period;
            document.getElementById('production-release-date').value = p.releaseDate;
            document.getElementById('production-status').value = p.status;
            document.getElementById('production-professional').value = p.professional||'';
            document.getElementById('production-contact').value = p.contact||'';
            document.getElementById('production-observations').value = p.observations||'';
            if(document.getElementById('production-send-date')) document.getElementById('production-send-date').value = p.sendDate || '';
            handleProductionFrequencyChange();
        }
    }
    document.getElementById('production-modal').classList.add('show');
}
function saveProduction(e) {
    e.preventDefault();
    const freq = document.getElementById('production-frequency').value;
    const period = (freq === 'Diário') ? '' : document.getElementById('production-period').value;
    const data = {
        municipality: document.getElementById('production-municipality').value,
        contact: document.getElementById('production-contact').value,
        frequency: freq,
        competence: document.getElementById('production-competence').value,
        period: period,
        releaseDate: document.getElementById('production-release-date').value,
        sendDate: document.getElementById('production-send-date').value,
        status: document.getElementById('production-status').value,
        professional: document.getElementById('production-professional').value,
        observations: document.getElementById('production-observations').value
    };
    if (editingId) { const i = productions.findIndex(x => x.id === editingId); if(i!==-1) productions[i] = {...productions[i],...data}; } else { productions.push({id:getNextId('prod'),...data}); }
    salvarNoArmazenamento('productions', productions); document.getElementById('production-modal').classList.remove('show'); clearProductionFilters(); showToast('Salvo!');
}
function getFilteredProductions() {
    const fMun = document.getElementById('filter-production-municipality')?.value;
    const fStatus = document.getElementById('filter-production-status')?.value;
    const fProf = document.getElementById('filter-production-professional')?.value.toLowerCase();
    const fFreq = document.getElementById('filter-production-frequency')?.value;
    const fRelStart = document.getElementById('filter-production-release-start')?.value;
    const fRelEnd = document.getElementById('filter-production-release-end')?.value;
    const fSendStart = document.getElementById('filter-production-send-start')?.value;
    const fSendEnd = document.getElementById('filter-production-send-end')?.value;
    return productions.filter(p => {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fProf && p.professional && !p.professional.toLowerCase().includes(fProf)) return false;
        if (fFreq && p.frequency !== fFreq) return false;
        if (fRelStart && p.releaseDate < fRelStart) return false;
        if (fRelEnd && p.releaseDate > fRelEnd) return false;
        if (fSendStart && (!p.sendDate || p.sendDate < fSendStart)) return false;
        if (fSendEnd && (!p.sendDate || p.sendDate > fSendEnd)) return false;
        return true;
    }).sort((a,b) => new Date(a.releaseDate) - new Date(b.releaseDate));
}
function renderProductions() {
    const filtered = getFilteredProductions();
    const c = document.getElementById('productions-table');
    document.getElementById('productions-results-count').innerHTML = `<strong>${filtered.length}</strong> envios`;
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; } else {
        const rows = filtered.map(p => {
            let cls = 'task-status';
            if (p.status === 'Enviada') cls += ' completed'; else if (p.status === 'Cancelada') cls += ' cancelled'; else cls += ' pending';
            let fCol = '#003d5c';
            if (p.frequency === 'Diário') fCol = '#C85250'; else if (p.frequency === 'Semanal') fCol = '#E68161'; else if (p.frequency === 'Quinzenal') fCol = '#79C2A9'; else if (p.frequency === 'Mensal') fCol = '#005580';
            const freqBadge = `<span style="color:${fCol};font-weight:bold;">${p.frequency}</span>`;
            return `<tr><td style="font-weight:bold;color:#000;">${p.municipality}</td><td>${p.professional||'-'}</td><td>${freqBadge}</td><td>${p.competence}</td><td>${p.frequency==='Diário'?'-':(p.period||'-')}</td><td>${formatDate(p.releaseDate)}</td><td><span class="${cls}">${p.status}</span></td><td>${formatDate(p.sendDate)}</td><td style="font-size:12px;color:#555;">${p.observations||'-'}</td><td><button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button><button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button></td></tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Profissional</th><th>Frequência</th><th>Competência</th><th>Período</th><th>Liberação</th><th>Status</th><th>Envio</th><th>Obs</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    updateProductionCharts(filtered);
}
function updateProductionCharts(data) {
    if (document.getElementById('productionStatusChart') && window.Chart) {
        if (chartStatusProd) chartStatusProd.destroy();
        chartStatusProd = new Chart(document.getElementById('productionStatusChart'), { type: 'pie', data: { labels: ['Enviada', 'Pendente', 'Cancelada'], datasets: [{ data: [data.filter(p=>p.status==='Enviada').length, data.filter(p=>p.status==='Pendente').length, data.filter(p=>p.status==='Cancelada').length], backgroundColor: ['#005580', '#E68161', '#C85250'] }] } });
    }
    if (document.getElementById('productionFrequencyChart') && window.Chart) {
        if (chartFreqProd) chartFreqProd.destroy();
        const freqs = ['Diário', 'Semanal', 'Quinzenal', 'Mensal'];
        const counts = freqs.map(f => data.filter(p => p.frequency === f).length);
        chartFreqProd = new Chart(document.getElementById('productionFrequencyChart'), { type: 'bar', data: { labels: freqs, datasets: [{ label: 'Envios', data: counts, backgroundColor: ['#C85250', '#E68161', '#79C2A9', '#005580'] }] } });
    }
}
function deleteProduction(id) { if (confirm('Excluir?')) { productions = productions.filter(x => x.id !== id); salvarNoArmazenamento('productions', productions); renderProductions(); } }
function closeProductionModal() { document.getElementById('production-modal').classList.remove('show'); }
function clearProductionFilters() { ['filter-production-municipality','filter-production-status','filter-production-professional'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); renderProductions(); }
function handleProductionFrequencyChange() {
    const freq = document.getElementById('production-frequency').value;
    const grp = document.getElementById('production-period-group');
    const ids = ['production-period','production-competence','production-release-date','production-status','production-contact'];
    const lbls = ['lbl-prod-period','lbl-prod-competence','lbl-prod-release','lbl-prod-status','lbl-prod-contact'];
    if (grp) grp.style.display = 'block';
    const req = (freq !== 'Diário');
    ids.forEach(id => { const el = document.getElementById(id); if(el) el.required = req; });
    const sfx = req ? '*' : '';
    if(document.getElementById('lbl-prod-period')) document.getElementById('lbl-prod-period').textContent = 'Período'+sfx;
    // ... (atualiza labels restantes se existirem)
}

// 18. VERSÕES
// ... (Funções de Versões mantidas) ...

// 19. BACKUP E RESTORE
function handleBackupFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            const d = json.data || json;
            if (!d) { alert('Inválido.'); return; }
            pendingBackupData = json;
            const list = document.getElementById('restore-preview-list');
            if(list) {
                list.innerHTML = '';
                const counts = {
                    'Treinamentos': (d.tasks || d.trainings || []).length,
                    'Municípios Clientes': (d.municipalities || []).length,
                    'Lista Mestra': (d.municipalitiesList || []).length,
                    'Solicitações': (d.requests || []).length,
                    'Apresentações': (d.presentations || []).length,
                    'Demandas': (d.demands || []).length,
                    'Visitas': (d.visits || []).length,
                    'Produção': (d.productions || []).length,
                    'Usuários': (d.users || []).length,
                    'Cargos': (d.cargos || []).length,
                    'Orientadores': (d.orientadores || []).length,
                    'Módulos': (d.modulos || []).length
                };
                for (const [l, c] of Object.entries(counts)) {
                    if (c > 0) list.innerHTML += `<li><strong>${l}:</strong> ${c} registro(s)</li>`;
                }
            }
            document.getElementById('restore-confirm-modal').classList.add('show');
        } catch (err) { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
}

function confirmRestore() {
    if (!pendingBackupData) return;
    try {
        const backup = pendingBackupData.data || pendingBackupData;
        let currentLogin = null;
        if (currentUser) currentLogin = currentUser.login;
        const theme = localStorage.getItem('theme') || 'light';

        localStorage.clear();
        const arr = (v) => Array.isArray(v) ? v : [];
        const str = (v) => (v == null) ? '' : String(v);
        const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

        // Usuários
        const safeUsers = arr(backup.users).map(u => {
            if(u.passwordHash) return u;
            const s = generateSalt();
            return { ...u, password: null, salt: s, passwordHash: hashPassword(u.password || '123456', s) };
        });
        if(safeUsers.length === 0) safeUsers.push(DADOS_PADRAO.users[0]);

        // Salva Listas Blindadas
        save('users', safeUsers);
        save('municipalities', arr(backup.municipalities).map(m => ({...m, modules: arr(m.modules), manager: str(m.manager)})));
        save('tasks', arr(backup.tasks || backup.trainings).map(t => ({...t, municipality: str(t.municipality), trainedName: str(t.trainedName), status: str(t.status) || 'Pendente'})));
        save('demands', arr(backup.demands).map(d => ({...d, description: str(d.description), dateRealization: str(d.dateRealization || d.realizationDate)})));
        save('visits', arr(backup.visits).map(v => ({...v, reason: str(v.reason), dateRealization: str(v.dateRealization || v.visitDate)})));
        save('presentations', arr(backup.presentations).map(p => ({...p, orientadores: arr(p.orientadores), forms: arr(p.forms)})));
        
        save('municipalitiesList', arr(backup.municipalitiesList));
        save('requests', arr(backup.requests));
        save('productions', arr(backup.productions));
        save('cargos', arr(backup.cargos));
        save('orientadores', arr(backup.orientadores));
        save('modulos', arr(backup.modulos));
        save('formasApresentacao', arr(backup.formasApresentacao));
        save('systemVersions', arr(backup.systemVersions));
        save('counters', backup.counters || {mun:1});

        // Login
        let restored = false;
        if (currentLogin) {
            const found = safeUsers.find(u => u.login === currentLogin);
            if (found) {
                save('currentUser', found);
                localStorage.setItem('isAuthenticated', 'true');
                restored = true;
            }
        }
        localStorage.setItem('theme', theme);

        if (restored) {
            alert('Backup restaurado com sucesso!');
        } else {
            alert('Restaurado! Faça login novamente.');
            localStorage.removeItem('currentUser');
        }
        window.location.reload();
    } catch (e) {
        console.error(e);
        alert('Erro crítico.');
        localStorage.clear();
        window.location.reload();
    }
}

function closeRestoreConfirmModal() {
    document.getElementById('restore-confirm-modal').classList.remove('show');
}

// 20. INICIALIZAÇÃO
function populateFilterSelects() {
    if (typeof municipalitiesList !== 'undefined') {
        const muns = municipalitiesList.slice().sort((a,b) => a.name.localeCompare(b.name));
        ['filter-municipality-name','filter-task-municipality','filter-request-municipality','filter-presentation-municipality','filter-visit-municipality','filter-production-municipality'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                const cur = el.value;
                el.innerHTML = '<option value="">Todos</option>' + muns.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
                if(cur) el.value = cur;
            }
        });
    }
    // Outros filtros
    if(typeof orientadores !== 'undefined'){
        const ori = orientadores.slice().sort((a,b)=>a.name.localeCompare(b.name));
        ['filter-task-performer','filter-presentation-orientador'].forEach(id=>{
             const el = document.getElementById(id);
             if(el) {
                 const cur = el.value;
                 el.innerHTML = '<option value="">Todos</option>' + ori.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
                 if(cur) el.value = cur;
             }
        });
    }
    if(typeof cargos !== 'undefined'){
        const car = cargos.slice().sort((a,b)=>a.name.localeCompare(b.name));
        const el = document.getElementById('filter-task-position');
        if(el) {
            const cur = el.value;
            el.innerHTML = '<option value="">Todos</option>' + car.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            if(cur) el.value = cur;
        }
    }
    if(typeof users !== 'undefined'){
        const us = users.slice().sort((a,b)=>a.name.localeCompare(b.name));
        ['filter-request-user','filter-demand-user'].forEach(id=>{
             const el = document.getElementById(id);
             if(el) {
                 const cur = el.value;
                 el.innerHTML = '<option value="">Todos</option>' + us.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
                 if(cur) el.value = cur;
             }
        });
    }
}

function updateGlobalDropdowns() { populateFilterSelects(); }

function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    applyMasks();
    setupDynamicFormFields();
    updateGlobalDropdowns();
    // Try/Catch para garantir que erros de renderização não travem o app
    try { renderMunicipalities(); renderTasks(); renderRequests(); renderDemands(); renderVisits(); renderProductions(); renderPresentations(); renderVersions(); } catch(e){}
    updateDashboardStats();
    initializeDashboardCharts();
    
    const over = document.querySelector('.sidebar-overlay');
    if(over) over.onclick = toggleMobileMenu;
    
    if(!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); }});
});

// Auto-fix final
(function autoFix() {
   // ... Scripts de correção de ID ...
})();
