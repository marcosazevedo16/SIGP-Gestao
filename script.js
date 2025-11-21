// =====================================================
// SIGP SAÚDE v14.0 - VERSÃO DETALHADA E EXPANDIDA
// Ajustes Completos do PDF (1 a 21) sem otimização de linhas.
// =====================================================

// 1. VERIFICAÇÃO DE SEGURANÇA
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: Biblioteca CryptoJS não carregada. Verifique sua conexão ou o HTML.');
}

// =====================================================
// 2. CONFIGURAÇÕES GERAIS
// =====================================================
const SALT_LENGTH = 16;

// Controle individual de cada gráfico para evitar conflitos
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

// Paleta de cores para o gráfico de anos e módulos
const CHART_COLORS = [
    '#C85250', '#E7B85F', '#79C2A9', '#5E8C99', '#3B5B66', 
    '#E68161', '#F7DC6F', '#4ECDC4', '#FF6B6B', '#A9DFBF'
];

// =====================================================
// 3. FUNÇÕES UTILITÁRIAS (SEGURANÇA E DADOS)
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
            alert('⚠️ Espaço de armazenamento cheio! Por favor, faça backup e limpe dados antigos.');
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
        console.error('Erro ao recuperar dados:', erro);
        return valorPadrao;
    }
}

function deletarDoArmazenamento(chave) {
    localStorage.removeItem(chave);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    // Previne erro se a data estiver incompleta
    const partes = dateString.split('-');
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
    
    // Força o navegador a processar a remoção da classe antes de adicionar a nova
    void toast.offsetWidth;
    
    toast.classList.add(type);
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// Funções de Cálculo de Data (Item 15)
function calculateTimeInUse(dateString) {
    if (!dateString) return '-';
    const start = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    let result = "";
    if(years > 0) result += years + " ano(s) ";
    if(months > 0) result += months + " mês(es)";
    if(years === 0 && months === 0) result = "Menos de 1 mês";
    
    return result;
}

function calculateDaysSince(dateString) {
    if (!dateString) return '-';
    const last = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays + " dias";
}

// =====================================================
// 4. MÁSCARAS (APLICADAS INDIVIDUALMENTE)
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
    // Máscara Contato Município
    const munContact = document.getElementById('municipality-contact');
    if (munContact) {
        munContact.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Máscara Contato Treinamento
    const taskContact = document.getElementById('task-contact');
    if (taskContact) {
        taskContact.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Máscara Contato Orientador
    const oriContact = document.getElementById('orientador-contact');
    if (oriContact) {
        oriContact.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Máscara Contato Solicitação
    const reqContact = document.getElementById('request-contact');
    if (reqContact) {
        reqContact.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Máscara Contato Produção
    const prodContact = document.getElementById('production-contact');
    if (prodContact) {
        prodContact.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Máscara Competência Produção (Item 11a)
    const prodComp = document.getElementById('production-competence');
    if (prodComp) {
        prodComp.addEventListener('input', function(e) {
            e.target.value = formatCompetencia(e.target.value);
        });
    }

    // Máscara Período Produção (Item 11b)
    const prodPeriod = document.getElementById('production-period');
    if (prodPeriod) {
        prodPeriod.placeholder = "DD/MM à DD/MM";
        prodPeriod.addEventListener('input', function(e) {
            e.target.value = formatPeriodo(e.target.value);
        });
    }
}

// =====================================================
// 5. DADOS E ESTADO GLOBAL
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

// Carrega usuários
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);

// Garante senha padrão para ADMIN se não existir
if (users[0].login === 'ADMIN' && !users[0].passwordHash) {
    users[0].salt = generateSalt();
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    salvarNoArmazenamento('users', users);
}

let currentUser = recuperarDoArmazenamento('currentUser');
let isAuthenticated = !!currentUser;
let currentTheme = recuperarDoArmazenamento('theme', 'light');
let editingId = null;

// Carregamento dos Dados de Negócio
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
// 6. INTERFACE E NAVEGAÇÃO
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
    
    // Controle explícito de visibilidade dos botões do menu
    const btnUser = document.getElementById('user-management-menu-btn');
    if (btnUser) btnUser.style.display = isAdmin ? 'flex' : 'none';
    
    const btnCargo = document.getElementById('cargo-management-menu-btn');
    if (btnCargo) btnCargo.style.display = 'flex';
    
    const btnOrient = document.getElementById('orientador-management-menu-btn');
    if (btnOrient) btnOrient.style.display = 'flex';
    
    const btnMod = document.getElementById('modulo-management-menu-btn');
    if (btnMod) btnMod.style.display = 'flex';
    
    const btnMunList = document.getElementById('municipality-list-management-menu-btn');
    if (btnMunList) btnMunList.style.display = 'flex';
    
    const btnForma = document.getElementById('forma-apresentacao-management-menu-btn');
    if (btnForma) btnForma.style.display = 'flex';
    
    const btnBackup = document.getElementById('backup-menu-btn');
    if (btnBackup) btnBackup.style.display = 'flex';

    const divider = document.getElementById('admin-divider');
    if (divider) divider.style.display = isAdmin ? 'block' : 'none';
}

function initializeTabs() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    
    buttons.forEach(function(btn) {
        btn.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active de todos os botões
            buttons.forEach(function(b) {
                b.classList.remove('active');
            });
            
            // Remove active de todas as seções
            document.querySelectorAll('.tab-content').forEach(function(c) {
                c.classList.remove('active');
            });
            
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
    // Antes de renderizar, atualiza os dropdowns para garantir que novos cadastros apareçam
    updateGlobalDropdowns();

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
    const menu = document.getElementById('settings-menu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Funções de Atalho do Menu Configurações
function navigateToUserManagement() { toggleSettingsMenu(); openTab('usuarios-section'); renderUsers(); }
function navigateToCargoManagement() { toggleSettingsMenu(); openTab('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettingsMenu(); openTab('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettingsMenu(); openTab('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettingsMenu(); openTab('municipalities-list-section'); renderMunicipalityList(); }
function navigateToFormaApresentacaoManagement() { toggleSettingsMenu(); openTab('formas-apresentacao-section'); renderFormas(); }
function navigateToBackupManagement() { toggleSettingsMenu(); openTab('backup-section'); updateBackupInfo(); }

function openTab(sectionId) {
    // Reseta abas
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    
    // Abre a desejada
    const sec = document.getElementById(sectionId);
    if (sec) sec.classList.add('active');
}

// =====================================================
// 7. AUTENTICAÇÃO
// =====================================================
function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('login-username').value.trim().toUpperCase();
    const pass = document.getElementById('login-password').value;
    
    const user = users.find(function(u) {
        return u.login === login && u.status === 'Ativo';
    });

    if (user) {
        const hashedPassword = hashPassword(pass, user.salt);
        if (hashedPassword === user.passwordHash) {
            currentUser = user;
            isAuthenticated = true;
            salvarNoArmazenamento('currentUser', currentUser);
            
            checkAuthentication();
            initializeApp();
            showToast('Bem-vindo, ' + user.name + '!', 'success');
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
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('currentUser');
        location.reload();
    }
}

// Modal de Troca de Senha
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
    if (idx !== -1) {
        users[idx].salt = generateSalt();
        users[idx].passwordHash = hashPassword(n, users[idx].salt);
        users[idx].mustChangePassword = false;
        
        salvarNoArmazenamento('users', users);
        currentUser = users[idx];
        salvarNoArmazenamento('currentUser', currentUser);
        
        closeChangePasswordModal();
        showToast('Senha alterada com sucesso!');
    }
}

// =====================================================
// 8. MÓDULO: MUNICÍPIOS CLIENTES
// Itens 1, 2, 14, 15 do PDF
// =====================================================

function showMunicipalityModal(id = null) {
    editingId = id;
    document.getElementById('municipality-form').reset();
    
    // Popula o select com a Lista Mestra
    populateSelect(document.getElementById('municipality-name'), municipalitiesList, 'name', 'name');

    if (id) {
        const m = municipalities.find(function(x) { return x.id === id; });
        if (m) {
            document.getElementById('municipality-name').value = m.name;
            document.getElementById('municipality-status').value = m.status;
            document.getElementById('municipality-manager').value = m.manager;
            document.getElementById('municipality-contact').value = m.contact;
            document.getElementById('municipality-implantation-date').value = m.implantationDate;
            document.getElementById('municipality-last-visit').value = m.lastVisit;
            
            // Preenche checkboxes
            if (m.modules) {
                document.querySelectorAll('.module-checkbox').forEach(function(cb) {
                    cb.checked = m.modules.includes(cb.value);
                });
            }
        }
    }
    document.getElementById('municipality-modal').classList.add('show');
}

function saveMunicipality(e) {
    e.preventDefault();
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(function(cb) { return cb.value; });
    
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
        const i = municipalities.findIndex(function(x) { return x.id === editingId; });
        if (i !== -1) {
            municipalities[i] = { ...municipalities[i], ...data };
        }
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
    // 1. Capturar Filtros (Item 1)
    const fName = document.getElementById('filter-municipality-name') ? document.getElementById('filter-municipality-name').value : '';
    const fStatus = document.getElementById('filter-municipality-status') ? document.getElementById('filter-municipality-status').value : '';
    const fMod = document.getElementById('filter-municipality-module') ? document.getElementById('filter-municipality-module').value : '';
    const fGest = document.getElementById('filter-municipality-manager') ? document.getElementById('filter-municipality-manager').value.toLowerCase() : '';

    // 2. Filtrar
    let filtered = municipalities.filter(function(m) {
        if (fName && m.name !== fName) return false;
        if (fStatus && m.status !== fStatus) return false;
        if (fMod && !m.modules.includes(fMod)) return false;
        if (fGest && !m.manager.toLowerCase().includes(fGest)) return false;
        return true;
    });
    
    // 3. Ordenar Alfabeticamente (Item 15)
    filtered.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    const c = document.getElementById('municipalities-table');
    
    // 4. Contador (Item 14)
    const counter = document.getElementById('municipalities-results-count');
    if (counter) {
        counter.style.display = 'block';
        counter.innerHTML = `<strong>${filtered.length}</strong> município(s) no total`;
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município encontrado com os filtros selecionados.</div>';
    } else {
        // 5. Colunas Extras (Item 15: Tempo de Uso, Dias desde visita)
        const rows = filtered.map(function(m) {
            // Badges de Módulos
            const modulesBadges = m.modules.map(function(modName) {
                const modConfig = modulos.find(function(x) { return x.name === modName; });
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
                <td>${calculateTimeInUse(m.implantationDate)}</td>
                <td>${calculateDaysSince(m.lastVisit)}</td>
                <td><span class="status-badge ${m.status === 'Em uso' ? 'active' : 'blocked'}">${m.status}</span></td>
                <td>
                    <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Última Visita</th><th>Tempo de Uso</th><th>Dias s/ Visita</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    // Item 2: Atualizar Gráficos desta aba
    updateMunicipalityCharts(filtered);
}

function updateMunicipalityCharts(data) {
    // Gráfico Distribuição por Status
    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusMun) chartStatusMun.destroy();
        
        chartStatusMun = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Em uso', 'Bloqueado', 'Parou de usar', 'Não Implantado'],
                datasets: [{
                    data: [
                        data.filter(m => m.status === 'Em uso').length,
                        data.filter(m => m.status === 'Bloqueado').length,
                        data.filter(m => m.status === 'Parou de usar').length,
                        data.filter(m => m.status === 'Não Implantado').length
                    ],
                    backgroundColor: ['#4ECDC4', '#FF6B6B', '#FFA07A', '#95A5A6']
                }]
            }
        });
    }

    // Gráfico Municípios por Módulo
    const ctxModules = document.getElementById('modulesChart');
    if (ctxModules && window.Chart) {
        if (chartModulesMun) chartModulesMun.destroy();
        
        const modCounts = {};
        data.forEach(function(m) {
            m.modules.forEach(function(mod) {
                modCounts[mod] = (modCounts[mod] || 0) + 1;
            });
        });

        chartModulesMun = new Chart(ctxModules, {
            type: 'bar',
            data: {
                labels: Object.keys(modCounts),
                datasets: [{
                    label: 'Qtd Municípios',
                    data: Object.values(modCounts),
                    backgroundColor: '#1FB8CD'
                }]
            }
        });
    }
    
    // Gráfico Timeline (Implantações ao Longo do Tempo)
    const ctxTimeline = document.getElementById('timelineChart');
    if (ctxTimeline && window.Chart) {
        if (chartTimelineMun) chartTimelineMun.destroy();
        
        const timeData = {};
        data.forEach(function(m) {
            if (m.implantationDate) {
                const year = m.implantationDate.split('-')[0];
                timeData[year] = (timeData[year] || 0) + 1;
            }
        });

        const sortedYears = Object.keys(timeData).sort();
        
        chartTimelineMun = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: 'Implantações',
                    data: sortedYears.map(y => timeData[y]),
                    borderColor: '#FF6B6B',
                    tension: 0.3
                }]
            }
        });
    }

    // Atualizar Contadores
    if(document.getElementById('total-municipalities')) document.getElementById('total-municipalities').textContent = data.length;
    if(document.getElementById('active-municipalities')) document.getElementById('active-municipalities').textContent = data.filter(m => m.status === 'Em uso').length;
    if(document.getElementById('inactive-municipalities')) document.getElementById('inactive-municipalities').textContent = data.filter(m => m.status !== 'Em uso').length;
}

function deleteMunicipality(id) {
    if (confirm('Excluir este município?')) {
        municipalities = municipalities.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('municipalities', municipalities);
        renderMunicipalities();
        updateGlobalDropdowns();
    }
}

function closeMunicipalityModal() {
    document.getElementById('municipality-modal').classList.remove('show');
}

function clearMunicipalityFilters() {
    document.getElementById('filter-municipality-name').value = '';
    document.getElementById('filter-municipality-status').value = '';
    document.getElementById('filter-municipality-module').value = '';
    document.getElementById('filter-municipality-manager').value = '';
    renderMunicipalities();
}

// =====================================================
// 9. CONTROLE DE TREINAMENTOS
// Itens 3, 16 do PDF
// =====================================================

function showTaskModal(id = null) {
    editingId = id;
    document.getElementById('task-form').reset();
    updateGlobalDropdowns(); // Atualiza selects (Orientador, Municipio)
    
    if (id) {
        const t = tasks.find(function(x) { return x.id === id; });
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
        const i = tasks.findIndex(function(x) { return x.id === editingId; });
        tasks[i] = { ...tasks[i], ...data };
    } else {
        tasks.push({ id: getNextId('task'), ...data });
    }
    salvarNoArmazenamento('tasks', tasks);
    document.getElementById('task-modal').classList.remove('show');
    renderTasks();
    showToast('Treinamento salvo com sucesso!', 'success');
}

function renderTasks() {
    // Item 3: Filtros
    const fMun = document.getElementById('filter-task-municipality') ? document.getElementById('filter-task-municipality').value : '';
    const fStatus = document.getElementById('filter-task-status') ? document.getElementById('filter-task-status').value : '';
    const fReq = document.getElementById('filter-task-requester') ? document.getElementById('filter-task-requester').value.toLowerCase() : '';
    const fPerf = document.getElementById('filter-task-performer') ? document.getElementById('filter-task-performer').value : ''; // Orientador Select
    const fCargo = document.getElementById('filter-task-position') ? document.getElementById('filter-task-position').value : '';
    const fDateType = document.getElementById('filter-task-date-type') ? document.getElementById('filter-task-date-type').value : 'Data de Solicitação';
    const fDateStart = document.getElementById('filter-task-date-start') ? document.getElementById('filter-task-date-start').value : '';
    const fDateEnd = document.getElementById('filter-task-date-end') ? document.getElementById('filter-task-date-end').value : '';

    let filtered = tasks.filter(function(t) {
        if (fMun && t.municipality !== fMun) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if (fPerf && t.performedBy !== fPerf) return false;
        if (fCargo && t.trainedPosition !== fCargo) return false;

        // Filtro de Data Dinâmico
        const dateToCheck = (fDateType === 'Data de Realização') ? t.datePerformed : t.dateRequested;
        if (fDateStart && dateToCheck < fDateStart) return false;
        if (fDateEnd && dateToCheck > fDateEnd) return false;
        
        return true;
    });

    // Item 16: Ordenação (Pendentes e Antigos primeiro)
    filtered.sort(function(a, b) {
        // Pendente tem prioridade
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        // Data Solicitação Crescente (mais antigas)
        return new Date(a.dateRequested) - new Date(b.dateRequested);
    });

    const c = document.getElementById('tasks-table');
    
    // Contador
    const counter = document.getElementById('tasks-results-count');
    if (counter) {
        counter.style.display = 'block';
        counter.innerHTML = `<strong>${filtered.length}</strong> treinamento(s) no total`;
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum treinamento encontrado.</div>';
    } else {
        const rows = filtered.map(function(t) {
            return `<tr>
                <td>${formatDate(t.dateRequested)}</td>
                <td>${formatDate(t.datePerformed)}</td>
                <td><strong>${t.municipality}</strong></td>
                <td>${t.requestedBy}</td>
                <td>${t.performedBy}</td>
                <td>${t.trainedName}</td>
                <td>${t.trainedPosition}</td>
                <td>${t.contact}</td>
                <td><span class="task-status ${t.status === 'Concluído' ? 'completed' : 'pending'}">${t.status}</span></td>
                <td>
                    <button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Data Sol.</th><th>Data Real.</th><th>Município</th><th>Solicitante</th><th>Orientador</th><th>Profissional</th><th>Cargo</th><th>Contato</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }

    // Atualiza Stats
    if(document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent = filtered.length;
    if(document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent = filtered.filter(t=>t.status==='Concluído').length;
    if(document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent = filtered.filter(t=>t.status==='Pendente').length;
    if(document.getElementById('cancelled-tasks')) document.getElementById('cancelled-tasks').textContent = filtered.filter(t=>t.status==='Cancelado').length;
}

function deleteTask(id) {
    if (confirm('Excluir este treinamento?')) {
        tasks = tasks.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('tasks', tasks);
        renderTasks();
    }
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('show');
}

function clearTaskFilters() {
    const inputs = ['filter-task-municipality', 'filter-task-status', 'filter-task-requester', 'filter-task-performer', 'filter-task-position', 'filter-task-date-start', 'filter-task-date-end'];
    inputs.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderTasks();
}

// =====================================================
// 10. SOLICITAÇÕES/SUGESTÕES (Itens 4, 5, 17)
// =====================================================

function showRequestModal(id = null) {
    editingId = id;
    document.getElementById('request-form').reset();
    updateGlobalDropdowns();
    
    if (id) {
        const r = requests.find(function(x) { return x.id === id; });
        if (r) {
            document.getElementById('request-municipality').value = r.municipality;
            document.getElementById('request-date').value = r.date;
            document.getElementById('request-contact').value = r.contact;
            document.getElementById('request-requester').value = r.requester;
            document.getElementById('request-description').value = r.description;
            document.getElementById('request-status').value = r.status;
        }
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
        status: document.getElementById('request-status').value,
        user: currentUser.name // Salva quem criou
    };

    if (editingId) {
        const i = requests.findIndex(function(x) { return x.id === editingId; });
        requests[i] = { ...requests[i], ...data };
    } else {
        requests.push({ id: getNextId('req'), ...data });
    }
    salvarNoArmazenamento('requests', requests);
    document.getElementById('request-modal').classList.remove('show');
    renderRequests();
    showToast('Salvo com sucesso!', 'success');
}

function renderRequests() {
    // Item 4: Filtros
    const fMun = document.getElementById('filter-request-municipality') ? document.getElementById('filter-request-municipality').value : '';
    const fStatus = document.getElementById('filter-request-status') ? document.getElementById('filter-request-status').value : '';
    const fSol = document.getElementById('filter-request-solicitante') ? document.getElementById('filter-request-solicitante').value.toLowerCase() : '';
    const fUser = document.getElementById('filter-request-user') ? document.getElementById('filter-request-user').value.toLowerCase() : '';
    const fDateStart = document.getElementById('filter-request-date-start') ? document.getElementById('filter-request-date-start').value : '';
    const fDateEnd = document.getElementById('filter-request-date-end') ? document.getElementById('filter-request-date-end').value : '';

    let filtered = requests.filter(function(r) {
        if (fMun && r.municipality !== fMun) return false;
        if (fStatus && r.status !== fStatus) return false;
        if (fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        if (fUser && (!r.user || !r.user.toLowerCase().includes(fUser))) return false;
        if (fDateStart && r.date < fDateStart) return false;
        if (fDateEnd && r.date > fDateEnd) return false;
        return true;
    });

    // Item 17: Ordenação (Pendentes e Antigas Primeiro)
    filtered.sort(function(a, b) {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return new Date(a.date) - new Date(b.date);
    });

    const c = document.getElementById('requests-table');
    const counter = document.getElementById('requests-results-count');
    if(counter) { counter.style.display='block'; counter.innerHTML=`<strong>${filtered.length}</strong> solicitações`; }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma solicitação encontrada.</div>';
    } else {
        const rows = filtered.map(function(r) {
            return `<tr>
                <td>${formatDate(r.date)}</td>
                <td>${r.municipality}</td>
                <td>${r.requester}</td>
                <td>${r.contact}</td>
                <td>${r.description}</td>
                <td>${r.user || '-'}</td>
                <td>${r.status}</td>
                <td>
                    <button class="btn btn--sm" onclick="showRequestModal(${r.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteRequest(${r.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Município</th><th>Solicitante</th><th>Contato</th><th>Descrição</th><th>Usuário</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    // Item 5: Gráficos e Stats
    if(document.getElementById('total-requests')) document.getElementById('total-requests').textContent = filtered.length;
    if(document.getElementById('pending-requests')) document.getElementById('pending-requests').textContent = filtered.filter(r=>r.status==='Pendente').length;
    if(document.getElementById('completed-requests')) document.getElementById('completed-requests').textContent = filtered.filter(r=>r.status==='Realizado').length;

    updateRequestCharts(filtered);
}

function updateRequestCharts(data) {
    // Gráfico Status
    const ctxStatus = document.getElementById('requestStatusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusReq) chartStatusReq.destroy();
        chartStatusReq = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Realizado', 'Inviável'],
                datasets: [{
                    data: [
                        data.filter(r=>r.status==='Pendente').length,
                        data.filter(r=>r.status==='Realizado').length,
                        data.filter(r=>r.status==='Inviável').length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }

    // Gráfico Municípios
    const ctxMun = document.getElementById('requestMunicipalityChart');
    if (ctxMun && window.Chart) {
        if (chartMunReq) chartMunReq.destroy();
        const mCounts = {};
        data.forEach(r => mCounts[r.municipality] = (mCounts[r.municipality] || 0) + 1);
        chartMunReq = new Chart(ctxMun, {
            type: 'bar',
            data: { labels: Object.keys(mCounts), datasets: [{ label: 'Solicitações', data: Object.values(mCounts), backgroundColor: '#4ECDC4' }] }
        });
    }

    // Gráfico Solicitante
    const ctxSol = document.getElementById('requestRequesterChart');
    if (ctxSol && window.Chart) {
        if (chartSolReq) chartSolReq.destroy();
        const sCounts = {};
        data.forEach(r => sCounts[r.requester] = (sCounts[r.requester] || 0) + 1);
        chartSolReq = new Chart(ctxSol, {
            type: 'bar',
            data: { labels: Object.keys(sCounts), datasets: [{ label: 'Solicitações', data: Object.values(sCounts), backgroundColor: '#FF6B6B' }] }
        });
    }
}

function deleteRequest(id) {
    if (confirm('Excluir?')) {
        requests = requests.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('requests', requests);
        renderRequests();
    }
}

function closeRequestModal() {
    document.getElementById('request-modal').classList.remove('show');
}

function clearRequestFilters() {
    ['filter-request-municipality','filter-request-status','filter-request-solicitante','filter-request-user','filter-request-date-start','filter-request-date-end'].forEach(id => document.getElementById(id).value = '');
    renderRequests();
}

// =====================================================
// 11. APRESENTAÇÕES (Itens 6, 7, 18)
// =====================================================

function showPresentationModal(id = null) {
    editingId = id;
    document.getElementById('presentation-form').reset();
    updateGlobalDropdowns();
    
    // Checkboxes Orientador e Forma
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if (divO) {
        divO.innerHTML = orientadores.map(function(o) {
            return `<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`;
        }).join('');
    }
    const divF = document.getElementById('presentation-forms-checkboxes');
    if (divF) {
        divF.innerHTML = formasApresentacao.map(function(f) {
            return `<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`;
        }).join('');
    }

    if (id) {
        const p = presentations.find(function(x) { return x.id === id; });
        document.getElementById('presentation-municipality').value = p.municipality;
        document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
        document.getElementById('presentation-requester').value = p.requester;
        document.getElementById('presentation-status').value = p.status;
        document.getElementById('presentation-description').value = p.description;
        
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
        const i = presentations.findIndex(function(x) { return x.id === editingId; });
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
    // Item 6: Filtros
    const fMun = document.getElementById('filter-presentation-municipality') ? document.getElementById('filter-presentation-municipality').value : '';
    const fStatus = document.getElementById('filter-presentation-status') ? document.getElementById('filter-presentation-status').value : '';
    const fReq = document.getElementById('filter-presentation-requester') ? document.getElementById('filter-presentation-requester').value.toLowerCase() : '';
    const fOrient = document.getElementById('filter-presentation-orientador') ? document.getElementById('filter-presentation-orientador').value : '';
    const fDateStart = document.getElementById('filter-presentation-date-start') ? document.getElementById('filter-presentation-date-start').value : '';
    const fDateEnd = document.getElementById('filter-presentation-date-end') ? document.getElementById('filter-presentation-date-end').value : '';

    let filtered = presentations.filter(function(p) {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fReq && !p.requester.toLowerCase().includes(fReq)) return false;
        if (fOrient && (!p.orientadores || !p.orientadores.includes(fOrient))) return false;
        if (fDateStart && p.dateSolicitacao < fDateStart) return false;
        if (fDateEnd && p.dateSolicitacao > fDateEnd) return false;
        return true;
    });

    // Item 18: Ordenação
    filtered.sort(function(a, b) {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return new Date(a.dateSolicitacao) - new Date(b.dateSolicitacao);
    });

    const c = document.getElementById('presentations-table');
    const countDiv = document.getElementById('presentations-results-count');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`<strong>${filtered.length}</strong> apresentações`; }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma apresentação.</div>';
    } else {
        const rows = filtered.map(function(p) {
            return `<tr>
                <td>${p.municipality}</td>
                <td>${formatDate(p.dateSolicitacao)}</td>
                <td>${p.requester}</td>
                <td>${p.status}</td>
                <td>-</td>
                <td>${p.orientadores ? p.orientadores.join(', ') : '-'}</td>
                <td>${p.forms ? p.forms.join(', ') : '-'}</td>
                <td>${p.description}</td>
                <td>
                    <button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data</th><th>Solicitante</th><th>Status</th><th>Realização</th><th>Orientadores</th><th>Forma</th><th>Descrição</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-presentations')) document.getElementById('total-presentations').textContent = filtered.length;

    updatePresentationCharts(filtered);
}

function updatePresentationCharts(data) {
    // Item 7: Gráficos
    const ctxStatus = document.getElementById('presentationStatusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusPres) chartStatusPres.destroy();
        chartStatusPres = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Realizada', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(p=>p.status==='Pendente').length,
                        data.filter(p=>p.status==='Realizada').length,
                        data.filter(p=>p.status==='Cancelada').length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }

    const ctxMun = document.getElementById('presentationMunicipalityChart');
    if (ctxMun && window.Chart) {
        if (chartMunPres) chartMunPres.destroy();
        const mCounts = {};
        data.forEach(p => mCounts[p.municipality] = (mCounts[p.municipality]||0)+1);
        chartMunPres = new Chart(ctxMun, {
            type: 'bar',
            data: { labels: Object.keys(mCounts), datasets: [{ label: 'Qtd', data: Object.values(mCounts), backgroundColor: '#4ECDC4' }] }
        });
    }

    const ctxOri = document.getElementById('presentationOrientadorChart');
    if (ctxOri && window.Chart) {
        if (chartOrientPres) chartOrientPres.destroy();
        const oCounts = {};
        data.forEach(p => {
            if(p.orientadores) p.orientadores.forEach(o => oCounts[o] = (oCounts[o]||0)+1);
        });
        chartOrientPres = new Chart(ctxOri, {
            type: 'bar',
            data: { labels: Object.keys(oCounts), datasets: [{ label: 'Qtd', data: Object.values(oCounts), backgroundColor: '#FF6B6B' }] }
        });
    }
}

function deletePresentation(id) {
    if (confirm('Excluir?')) {
        presentations = presentations.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('presentations', presentations);
        renderPresentations();
    }
}

function closePresentationModal() { document.getElementById('presentation-modal').classList.remove('show'); }

function clearPresentationFilters() {
    ['filter-presentation-municipality','filter-presentation-status','filter-presentation-requester','filter-presentation-orientador','filter-presentation-date-start','filter-presentation-date-end'].forEach(id=>document.getElementById(id).value='');
    renderPresentations();
}

// =====================================================
// 12. DEMANDAS DO SUPORTE (Itens 8, 9, 19)
// =====================================================

function showDemandModal(id = null) {
    editingId = id;
    document.getElementById('demand-form').reset();
    if (id) {
        const d = demands.find(function(x) { return x.id === id; });
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
        status: document.getElementById('demand-status').value,
        user: currentUser.name
    };
    if (editingId) {
        const i = demands.findIndex(function(x) { return x.id === editingId; });
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
    // Item 8: Filtros
    const fStatus = document.getElementById('filter-demand-status') ? document.getElementById('filter-demand-status').value : '';
    const fPrio = document.getElementById('filter-demand-priority') ? document.getElementById('filter-demand-priority').value : '';
    const fUser = document.getElementById('filter-demand-user') ? document.getElementById('filter-demand-user').value.toLowerCase() : '';
    const fDateStart = document.getElementById('filter-demand-date-start') ? document.getElementById('filter-demand-date-start').value : '';
    const fDateEnd = document.getElementById('filter-demand-date-end') ? document.getElementById('filter-demand-date-end').value : '';

    let filtered = demands.filter(function(d) {
        if (fStatus && d.status !== fStatus) return false;
        if (fPrio && d.priority !== fPrio) return false;
        if (fUser && (!d.user || !d.user.toLowerCase().includes(fUser))) return false;
        if (fDateStart && d.date < fDateStart) return false;
        if (fDateEnd && d.date > fDateEnd) return false;
        return true;
    });

    // Item 19: Ordenação
    const prioMap = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    filtered.sort(function(a, b) {
        if (prioMap[a.priority] !== prioMap[b.priority]) return prioMap[a.priority] - prioMap[b.priority];
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        return new Date(a.date) - new Date(b.date);
    });

    const c = document.getElementById('demands-table');
    const countDiv = document.getElementById('demands-results-count');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`<strong>${filtered.length}</strong> demandas`; }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma demanda encontrada.</div>';
    } else {
        const rows = filtered.map(function(d) {
            return `<tr>
                <td>${formatDate(d.date)}</td>
                <td>${d.description}</td>
                <td>${d.priority}</td>
                <td>${d.status}</td>
                <td>-</td>
                <td>${d.user || '-'}</td>
                <td>
                    <button class="btn btn--sm" onclick="showDemandModal(${d.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteDemand(${d.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Data</th><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Realização</th><th>Usuário</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-demands')) document.getElementById('total-demands').textContent = filtered.length;
    updateDemandCharts(filtered);
}

function updateDemandCharts(data) {
    // Item 9: Gráficos
    const ctxStatus = document.getElementById('demandStatusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusDem) chartStatusDem.destroy();
        chartStatusDem = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Realizada', 'Inviável'],
                datasets: [{
                    data: [
                        data.filter(d=>d.status==='Pendente').length,
                        data.filter(d=>d.status==='Realizada').length,
                        data.filter(d=>d.status==='Inviável').length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }

    const ctxPrio = document.getElementById('demandPriorityChart');
    if (ctxPrio && window.Chart) {
        if (chartPrioDem) chartPrioDem.destroy();
        const pCounts = { 'Alta':0, 'Média':0, 'Baixa':0 };
        data.forEach(d => pCounts[d.priority] = (pCounts[d.priority]||0)+1);
        chartPrioDem = new Chart(ctxPrio, {
            type: 'bar',
            data: { labels: Object.keys(pCounts), datasets: [{ label: 'Qtd', data: Object.values(pCounts), backgroundColor: '#FFA07A' }] }
        });
    }

    const ctxUser = document.getElementById('demandUserChart');
    if (ctxUser && window.Chart) {
        if (chartUserDem) chartUserDem.destroy();
        const uCounts = {};
        data.forEach(d => uCounts[d.user] = (uCounts[d.user]||0)+1);
        chartUserDem = new Chart(ctxUser, {
            type: 'bar',
            data: { labels: Object.keys(uCounts), datasets: [{ label: 'Qtd', data: Object.values(uCounts), backgroundColor: '#4ECDC4' }] }
        });
    }
}

function deleteDemand(id) {
    if (confirm('Excluir?')) {
        demands = demands.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('demands', demands);
        renderDemands();
    }
}

function closeDemandModal() { document.getElementById('demand-modal').classList.remove('show'); }
function clearDemandFilters() {
    ['filter-demand-status','filter-demand-priority','filter-demand-user','filter-demand-date-start','filter-demand-date-end'].forEach(id=>document.getElementById(id).value='');
    renderDemands();
}

// =====================================================
// 13. VISITAS PRESENCIAIS (Itens 10, 11, 20)
// =====================================================

function showVisitModal(id = null) {
    editingId = id;
    document.getElementById('visit-form').reset();
    updateGlobalDropdowns();
    if (id) {
        const v = visits.find(function(x) { return x.id === id; });
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
        const i = visits.findIndex(function(x) { return x.id === editingId; });
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
    // Item 10: Filtros
    const fMun = document.getElementById('filter-visit-municipality') ? document.getElementById('filter-visit-municipality').value : '';
    const fStatus = document.getElementById('filter-visit-status') ? document.getElementById('filter-visit-status').value : '';
    const fApp = document.getElementById('filter-visit-applicant') ? document.getElementById('filter-visit-applicant').value.toLowerCase() : '';
    const fDateStart = document.getElementById('filter-visit-date-start') ? document.getElementById('filter-visit-date-start').value : '';
    const fDateEnd = document.getElementById('filter-visit-date-end') ? document.getElementById('filter-visit-date-end').value : '';

    let filtered = visits.filter(function(v) {
        if (fMun && v.municipality !== fMun) return false;
        if (fStatus && v.status !== fStatus) return false;
        if (fApp && !v.applicant.toLowerCase().includes(fApp)) return false;
        if (fDateStart && v.date < fDateStart) return false;
        if (fDateEnd && v.date > fDateEnd) return false;
        return true;
    });

    // Item 20: Ordenação
    filtered.sort(function(a, b) {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return new Date(a.date) - new Date(b.date);
    });

    const c = document.getElementById('visits-table');
    const countDiv = document.getElementById('visits-results-count');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`<strong>${filtered.length}</strong> visitas`; }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(function(v) {
            return `<tr>
                <td>${v.municipality}</td>
                <td>${formatDate(v.date)}</td>
                <td>${v.applicant}</td>
                <td>-</td>
                <td>${v.status}</td>
                <td>-</td>
                <td>
                    <button class="btn btn--sm" onclick="showVisitModal(${v.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteVisit(${v.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data</th><th>Solicitante</th><th>Motivo</th><th>Status</th><th>Data Visita</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-visits')) document.getElementById('total-visits').textContent = filtered.length;
    updateVisitCharts(filtered);
}

function updateVisitCharts(data) {
    // Item 11: Gráficos
    const ctxStatus = document.getElementById('visitStatusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusVis) chartStatusVis.destroy();
        chartStatusVis = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Realizada', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(v=>v.status==='Pendente').length,
                        data.filter(v=>v.status==='Realizada').length,
                        data.filter(v=>v.status==='Cancelada').length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }

    const ctxMun = document.getElementById('visitMunicipalityChart');
    if (ctxMun && window.Chart) {
        if (chartMunVis) chartMunVis.destroy();
        const mCounts = {};
        data.forEach(v => mCounts[v.municipality] = (mCounts[v.municipality]||0)+1);
        chartMunVis = new Chart(ctxMun, {
            type: 'bar',
            data: { labels: Object.keys(mCounts), datasets: [{ label: 'Visitas', data: Object.values(mCounts), backgroundColor: '#4ECDC4' }] }
        });
    }

    const ctxApp = document.getElementById('visitApplicantChart');
    if (ctxApp && window.Chart) {
        if (chartSolVis) chartSolVis.destroy();
        const aCounts = {};
        data.forEach(v => aCounts[v.applicant] = (aCounts[v.applicant]||0)+1);
        chartSolVis = new Chart(ctxApp, {
            type: 'bar',
            data: { labels: Object.keys(aCounts), datasets: [{ label: 'Visitas', data: Object.values(aCounts), backgroundColor: '#FF6B6B' }] }
        });
    }
}

function deleteVisit(id) { if (confirm('Excluir?')) { visits = visits.filter(x => x.id !== id); salvarNoArmazenamento('visits', visits); renderVisits(); } }
function closeVisitModal() { document.getElementById('visit-modal').classList.remove('show'); }
function clearVisitFilters() { ['filter-visit-municipality','filter-visit-status','filter-visit-applicant','filter-visit-date-start','filter-visit-date-end'].forEach(id=>document.getElementById(id).value=''); renderVisits(); }

// =====================================================
// 14. PRODUÇÃO (Itens 12, 13, 21)
// =====================================================

function showProductionModal(id = null) {
    editingId = id;
    document.getElementById('production-form').reset();
    updateGlobalDropdowns();
    
    if (id) {
        const p = productions.find(function(x) { return x.id === id; });
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
        const i = productions.findIndex(function(x) { return x.id === editingId; });
        productions[i] = { ...productions[i], ...data };
    } else {
        productions.push({ id: getNextId('prod'), ...data });
    }
    salvarNoArmazenamento('productions', productions);
    document.getElementById('production-modal').classList.remove('show');
    renderProductions();
    showToast('Salvo!');
}

function renderProductions() {
    // Item 12: Filtros
    const fMun = document.getElementById('filter-production-municipality') ? document.getElementById('filter-production-municipality').value : '';
    const fStatus = document.getElementById('filter-production-status') ? document.getElementById('filter-production-status').value : '';
    const fProf = document.getElementById('filter-production-professional') ? document.getElementById('filter-production-professional').value.toLowerCase() : '';
    const fRelStart = document.getElementById('filter-production-release-start') ? document.getElementById('filter-production-release-start').value : '';
    const fRelEnd = document.getElementById('filter-production-release-end') ? document.getElementById('filter-production-release-end').value : '';
    const fSendStart = document.getElementById('filter-production-send-start') ? document.getElementById('filter-production-send-start').value : '';
    const fSendEnd = document.getElementById('filter-production-send-end') ? document.getElementById('filter-production-send-end').value : '';

    let filtered = productions.filter(function(p) {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fProf && p.professional && !p.professional.toLowerCase().includes(fProf)) return false;
        if (fRelStart && p.releaseDate < fRelStart) return false;
        if (fRelEnd && p.releaseDate > fRelEnd) return false;
        if (fSendStart && p.sendDate && p.sendDate < fSendStart) return false;
        if (fSendEnd && p.sendDate && p.sendDate > fSendEnd) return false;
        return true;
    });

    // Item 21: Ordenação
    const statusOrder = { 'Pendente': 1, 'Enviada': 2, 'Cancelada': 3 };
    filtered.sort(function(a, b) {
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

    const c = document.getElementById('productions-table');
    const countDiv = document.getElementById('productions-results-count');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`<strong>${filtered.length}</strong> envios`; }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(function(p) {
            return `<tr>
                <td>${p.municipality}</td>
                <td>${p.professional || '-'}</td>
                <td>${p.contact}</td>
                <td>${p.frequency}</td>
                <td>${p.competence}</td>
                <td>${p.period}</td>
                <td>${formatDate(p.releaseDate)}</td>
                <td>${formatDate(p.sendDate)}</td>
                <td>${p.status}</td>
                <td>
                    <button class="btn btn--sm" onclick="showProductionModal(${p.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteProduction(${p.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Profissional</th><th>Contato</th><th>Frequência</th><th>Competência</th><th>Período</th><th>Liberação</th><th>Envio</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    if(document.getElementById('total-productions')) document.getElementById('total-productions').textContent = filtered.length;
    if(document.getElementById('sent-productions')) document.getElementById('sent-productions').textContent = filtered.filter(p=>p.status==='Enviada').length;
    if(document.getElementById('pending-productions')) document.getElementById('pending-productions').textContent = filtered.filter(p=>p.status==='Pendente').length;
    if(document.getElementById('cancelled-productions')) document.getElementById('cancelled-productions').textContent = filtered.filter(p=>p.status==='Cancelada').length;

    updateProductionCharts(filtered);
}

function updateProductionCharts(data) {
    const ctxStatus = document.getElementById('productionStatusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusProd) chartStatusProd.destroy();
        chartStatusProd = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Enviada', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(p=>p.status==='Pendente').length,
                        data.filter(p=>p.status==='Enviada').length,
                        data.filter(p=>p.status==='Cancelada').length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }

    const ctxFreq = document.getElementById('productionFrequencyChart');
    if (ctxFreq && window.Chart) {
        if (chartFreqProd) chartFreqProd.destroy();
        const fCounts = {};
        data.forEach(p => fCounts[p.frequency] = (fCounts[p.frequency]||0)+1);
        chartFreqProd = new Chart(ctxFreq, {
            type: 'bar',
            data: { labels: Object.keys(fCounts), datasets: [{ label: 'Envios', data: Object.values(fCounts), backgroundColor: '#1FB8CD' }] }
        });
    }
}

function deleteProduction(id) { if (confirm('Excluir?')) { productions = productions.filter(x => x.id !== id); salvarNoArmazenamento('productions', productions); renderProductions(); } }
function closeProductionModal() { document.getElementById('production-modal').classList.remove('show'); }
function clearProductionFilters() { 
    ['filter-production-municipality','filter-production-status','filter-production-professional','filter-production-frequency','filter-production-release-start','filter-production-release-end','filter-production-send-start','filter-production-send-end'].forEach(id=>document.getElementById(id).value='');
    renderProductions();
}

// =====================================================
// 15. VERSÕES E GESTÃO DE USUÁRIOS
// =====================================================
function showVersionModal(id=null){ editingId=id; document.getElementById('version-form').reset(); if(id){const v=systemVersions.find(x=>x.id===id); document.getElementById('version-date').value=v.date; document.getElementById('version-number').value=v.version; document.getElementById('version-type').value=v.type; document.getElementById('version-module').value=v.module; document.getElementById('version-description').value=v.description;} document.getElementById('version-modal').classList.add('show'); }
function saveVersion(e){ e.preventDefault(); const data={date:document.getElementById('version-date').value, version:document.getElementById('version-number').value, type:document.getElementById('version-type').value, module:document.getElementById('version-module').value, description:document.getElementById('version-description').value, author:currentUser.name}; if(editingId){const i=systemVersions.findIndex(x=>x.id===editingId); systemVersions[i]={...systemVersions[i],...data};}else{systemVersions.push({id:getNextId('ver'),...data});} salvarNoArmazenamento('systemVersions',systemVersions); document.getElementById('version-modal').classList.remove('show'); renderVersions(); showToast('Salvo!'); }
function renderVersions(){ const c=document.getElementById('versions-table'); if(!c)return; if(systemVersions.length===0){c.innerHTML='Vazio';return;} const r=systemVersions.map(v=>`<tr><td>${formatDate(v.date)}</td><td>${v.version}</td><td>${v.type}</td><td>${v.module}</td><td>${v.description}</td><td><button class="btn btn--sm" onclick="showVersionModal(${v.id})">✏️</button><button class="btn btn--sm" onclick="deleteVersion(${v.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Data</th><th>Versão</th><th>Tipo</th><th>Módulo</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteVersion(id){ if(confirm('Excluir?')){ systemVersions=systemVersions.filter(x=>x.id!==id); salvarNoArmazenamento('systemVersions',systemVersions); renderVersions(); }}
function closeVersionModal() { document.getElementById('version-modal').classList.remove('show'); }

function showUserModal(id=null){ const m=document.getElementById('user-modal'); document.getElementById('user-form').reset(); editingId=id; document.getElementById('user-login').disabled=false; if(id){const u=users.find(x=>x.id===id); document.getElementById('user-login').value=u.login; document.getElementById('user-login').disabled=true; document.getElementById('user-name').value=u.name; document.getElementById('user-permission').value=u.permission; document.getElementById('user-status').value=u.status; document.getElementById('user-password').required=false;}else{document.getElementById('user-password').required=true;} m.classList.add('show'); }
function saveUser(e){ e.preventDefault(); const login=document.getElementById('user-login').value.trim().toUpperCase(); const name=document.getElementById('user-name').value.trim(); const perm=document.getElementById('user-permission').value; const stat=document.getElementById('user-status').value; const pass=document.getElementById('user-password').value; if(!editingId){if(users.some(u=>u.login===login)){alert('Já existe!');return;} const n={id:getNextId('user'), login, name, permission:perm, status:stat, mustChangePassword:true, salt:generateSalt()}; n.passwordHash=hashPassword(pass, n.salt); users.push(n);}else{const i=users.findIndex(u=>u.id===editingId); users[i].name=name; users[i].permission=perm; users[i].status=stat; if(pass){users[i].salt=generateSalt(); users[i].passwordHash=hashPassword(pass, users[i].salt);}} salvarNoArmazenamento('users',users); document.getElementById('user-modal').classList.remove('show'); renderUsers(); showToast('Salvo!'); }
function renderUsers(){ const c=document.getElementById('users-table'); const r=users.map(u=>`<tr><td>${u.login}</td><td>${u.name}</td><td>${u.permission}</td><td>${u.status}</td><td><button class="btn btn--sm" onclick="showUserModal(${u.id})">✏️</button><button class="btn btn--sm" onclick="deleteUser(${u.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Login</th><th>Nome</th><th>Permissão</th><th>Status</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteUser(id){ const u=users.find(x=>x.id===id); if(u.login==='ADMIN'){alert('Não!');return;} if(confirm('Excluir?')){users=users.filter(x=>x.id!==id); salvarNoArmazenamento('users',users); renderUsers();}}
function closeUserModal(){document.getElementById('user-modal').classList.remove('show');}

// =====================================================
// 16. CONFIGURAÇÕES: LISTA MESTRA, CARGOS, ETC
// =====================================================
// Lista Mestra
function showMunicipalityListModal(id=null){ editingId=id; document.getElementById('municipality-list-form').reset(); if(id){const m=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=m.name; document.getElementById('municipality-list-uf').value=m.uf;} document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e){ e.preventDefault(); const data={name:document.getElementById('municipality-list-name').value, uf:document.getElementById('municipality-list-uf').value}; if(editingId){const i=municipalitiesList.findIndex(x=>x.id===editingId); municipalitiesList[i]={...municipalitiesList[i],...data};}else{municipalitiesList.push({id:getNextId('munList'),...data});} salvarNoArmazenamento('municipalitiesList',municipalitiesList); document.getElementById('municipality-list-modal').classList.remove('show'); renderMunicipalityList(); updateGlobalDropdowns(); showToast('Salvo!'); }
function renderMunicipalityList(){ const c=document.getElementById('municipalities-list-table'); const r=municipalitiesList.map(m=>`<tr><td>${m.name}</td><td>${m.uf}</td><td><button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>UF</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteMunicipalityList(id){ if(confirm('Excluir?')){ municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}
function closeMunicipalityListModal() { document.getElementById('municipality-list-modal').classList.remove('show'); }

// Cargos
function showCargoModal(id=null){ editingId=id; document.getElementById('cargo-form').reset(); if(id){const c=cargos.find(x=>x.id===id); document.getElementById('cargo-name').value=c.name; if(document.getElementById('cargo-description')) document.getElementById('cargo-description').value=c.description;} document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e){ e.preventDefault(); const name=document.getElementById('cargo-name').value; const desc=document.getElementById('cargo-description')?document.getElementById('cargo-description').value:''; if(!editingId && cargos.some(c=>c.name===name)){alert('Já existe!');return;} const data={name:name, description:desc}; if(editingId){const i=cargos.findIndex(x=>x.id===editingId); cargos[i]={...cargos[i],...data};}else{cargos.push({id:getNextId('cargo'),...data});} salvarNoArmazenamento('cargos',cargos); document.getElementById('cargo-modal').classList.remove('show'); renderCargos(); }
function renderCargos(){ const c=document.getElementById('cargos-table'); const r=cargos.map(x=>`<tr><td>${x.name}</td><td>${x.description||'-'}</td><td><button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Cargo</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteCargo(id){ if(confirm('Excluir?')){ cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}
function closeCargoModal() { document.getElementById('cargo-modal').classList.remove('show'); }

// Orientadores
function showOrientadorModal(id=null){ editingId=id; document.getElementById('orientador-form').reset(); if(id){const o=orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value=o.name; document.getElementById('orientador-contact').value=o.contact; if(document.getElementById('orientador-email')) document.getElementById('orientador-email').value=o.email;} document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e){ e.preventDefault(); const name=document.getElementById('orientador-name').value; const contact=document.getElementById('orientador-contact').value; const email=document.getElementById('orientador-email')?document.getElementById('orientador-email').value:''; if(!editingId && orientadores.some(o=>o.name===name)){alert('Já existe!');return;} const data={name:name, contact:contact, email:email}; if(editingId){const i=orientadores.findIndex(x=>x.id===editingId); orientadores[i]={...orientadores[i],...data};}else{orientadores.push({id:getNextId('orient'),...data});} salvarNoArmazenamento('orientadores',orientadores); document.getElementById('orientador-modal').classList.remove('show'); renderOrientadores(); }
function renderOrientadores(){ const c=document.getElementById('orientadores-table'); const r=orientadores.map(x=>`<tr><td>${x.name}</td><td>${x.contact}</td><td>${x.email||'-'}</td><td><button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Contato</th><th>Email</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteOrientador(id){ if(confirm('Excluir?')){ orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}
function closeOrientadorModal() { document.getElementById('orientador-modal').classList.remove('show'); }

// Módulos (Com Descrição)
function showModuloModal(id=null){ 
    editingId=id; 
    document.getElementById('modulo-form').reset(); 
    const form = document.getElementById('modulo-form');
    if(!document.getElementById('modulo-description')) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label class="form-label">Descrição do Módulo* (Máx 250)</label><textarea class="form-control" id="modulo-description" rows="3" maxlength="250" required></textarea>`;
        const btns = form.querySelector('.modal-actions');
        form.insertBefore(div, btns);
    }
    if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name; if(document.getElementById('modulo-abbreviation')) document.getElementById('modulo-abbreviation').value=m.abbreviation; if(document.getElementById('modulo-description')) document.getElementById('modulo-description').value=m.description || '';} 
    document.getElementById('modulo-modal').classList.add('show'); 
}
function saveModulo(e){ 
    e.preventDefault(); 
    const name=document.getElementById('modulo-name').value; const abbr=document.getElementById('modulo-abbreviation')?document.getElementById('modulo-abbreviation').value:name.substring(0,3).toUpperCase(); const desc=document.getElementById('modulo-description')?document.getElementById('modulo-description').value:''; if(!editingId && modulos.some(m=>m.name===name)) { alert('Já existe!'); return; } const data={name:name, abbreviation:abbr, description:desc}; 
    if(editingId){const i=modulos.findIndex(x=>x.id===editingId); data.color=modulos[i].color||'#4ECDC4'; modulos[i]={...modulos[i],...data};}else{data.color='#4ECDC4'; modulos.push({id:getNextId('mod'),...data});} 
    salvarNoArmazenamento('modulos',modulos); document.getElementById('modulo-modal').classList.remove('show'); renderModulos(); 
}
function renderModulos(){ const c=document.getElementById('modulos-table'); const r=modulos.map(x=>`<tr><td>${x.name}</td><td>${x.abbreviation||'-'}</td><td>${x.description||'-'}</td><td><button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Módulo</th><th>Abrev.</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteModulo(id){ if(confirm('Excluir?')){ modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}
function closeModuloModal() { document.getElementById('modulo-modal').classList.remove('show'); }

// Formas
function showFormaApresentacaoModal(id=null){ editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){const f=formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value=f.name;} document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e){ e.preventDefault(); const name=document.getElementById('forma-apresentacao-name').value; if(!editingId && formasApresentacao.some(f=>f.name===name)) { alert('Já existe!'); return; } const data={name:name}; if(editingId){const i=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[i]={...formasApresentacao[i],...data};}else{formasApresentacao.push({id:getNextId('forma'),...data});} salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }
function renderFormas(){ const c=document.getElementById('formas-apresentacao-table'); const r=formasApresentacao.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Forma</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteForma(id){ if(confirm('Excluir?')){ formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}
function closeFormaApresentacaoModal() { document.getElementById('forma-apresentacao-modal').classList.remove('show'); }

// =====================================================
// 17. BACKUP
// =====================================================
function updateBackupInfo() {
    if(document.getElementById('backup-info-municipalities')) document.getElementById('backup-info-municipalities').textContent = municipalities.length;
    if(document.getElementById('backup-info-trainings')) document.getElementById('backup-info-trainings').textContent = tasks.length;
}

function createBackup() {
    const backupData = { version: "v14.0", date: new Date().toISOString(), data: { users, municipalities, municipalitiesList, tasks, requests, demands, visits, productions, presentations, systemVersions, cargos, orientadores, modulos, formasApresentacao, counters } };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "backup_sigp_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    showToast('Backup realizado!');
}

function triggerRestoreBackup() { document.getElementById('backup-file-input').click(); }
function handleBackupFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if(backup.data && confirm('Isso substituirá TODOS os dados. Continuar?')) {
                Object.keys(backup.data).forEach(key => { localStorage.setItem(key, JSON.stringify(backup.data[key])); });
                alert('Restaurado!');
                location.reload();
            }
        } catch(err) { alert('Arquivo inválido.'); }
    };
    reader.readAsText(file);
}

// =====================================================
// 18. DASHBOARD E INICIALIZAÇÃO
// =====================================================
function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(m => m.status === 'Em uso').length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(t => t.status === 'Concluído').length;
    document.getElementById('dashboard-requests-completed').textContent = requests.filter(r => r.status === 'Realizado').length;
    document.getElementById('dashboard-presentations-completed').textContent = presentations.filter(p => p.status === 'Realizada').length;
}

function initializeDashboardCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if(!ctx || !window.Chart) return;
    if(chartDashboard) chartDashboard.destroy();

    const dataMap = {};
    municipalities.forEach(m => {
        if(m.implantationDate) {
            const y = m.implantationDate.split('-')[0];
            dataMap[y] = (dataMap[y] || 0) + 1;
        }
    });
    
    const years = Object.keys(dataMap).sort();
    const counts = years.map(y => dataMap[y]);
    const bgColors = years.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    chartDashboard = new Chart(ctx, {
        type: 'bar',
        data: { labels: years, datasets: [{ label: 'Implantações', data: counts, backgroundColor: bgColors, barPercentage: 0.6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function populateFilterSelects() {
    // Popula dropdowns de filtro
    const muns = municipalities.slice().sort((a,b)=>a.name.localeCompare(b.name));
    const filterIds = ['filter-municipality-name','filter-task-municipality','filter-request-municipality','filter-visit-municipality','filter-production-municipality','filter-presentation-municipality'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            let html = '<option value="">Todos</option>';
            muns.forEach(m => html += `<option value="${m.name}">${m.name}</option>`);
            el.innerHTML = html;
        }
    });

    const oriSelect = document.getElementById('filter-task-performer');
    if(oriSelect && oriSelect.tagName === 'SELECT') {
        let html = '<option value="">Todos</option>';
        orientadores.forEach(o => html += `<option value="${o.name}">${o.name}</option>`);
        oriSelect.innerHTML = html;
    }
    
    const cargoSelect = document.getElementById('filter-task-position');
    if(cargoSelect) {
        let html = '<option value="">Todos</option>';
        cargos.forEach(c => html += `<option value="${c.name}">${c.name}</option>`);
        cargoSelect.innerHTML = html;
    }
}

function updateGlobalDropdowns() {
    const activeMuns = municipalities.filter(m => m.status === 'Em uso');
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(id => {
        populateSelect(document.getElementById(id), activeMuns, 'name', 'name');
    });
    populateFilterSelects();
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

function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    applyMasks();
    updateGlobalDropdowns();
    
    // Render Inicial
    renderMunicipalities();
    renderTasks();
    
    updateDashboardStats();
    initializeDashboardCharts();
    
    if(!document.querySelector('.sidebar-btn.active')) navigateToHome();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('show'); };
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = function(){ this.closest('.modal').classList.remove('show'); });
    document.querySelectorAll('.btn--secondary').forEach(b => { if(b.textContent.includes('Cancelar')) b.onclick = function(){ this.closest('.modal').classList.remove('show'); } });
});
