// ============================================================================
// SIGP SAÚDE v25.0 - VERSÃO FINAL "EXTENSA" (SEM COMPACTAÇÃO)
// Todas as funcionalidades + Ajustes de Layout + Backup Completo
// ============================================================================

// ----------------------------------------------------------------------------
// 1. VERIFICAÇÃO DE SEGURANÇA
// ----------------------------------------------------------------------------
if (typeof CryptoJS === 'undefined') {
    console.error('Erro Crítico: CryptoJS não encontrado.');
    alert('ERRO CRÍTICO: A biblioteca CryptoJS não foi carregada. Verifique sua conexão ou o cabeçalho do HTML.');
    throw new Error('CryptoJS is missing');
} else {
    console.log('Segurança: CryptoJS carregado com sucesso.');
}

// ----------------------------------------------------------------------------
// 2. CONFIGURAÇÕES GERAIS E VARIÁVEIS DE ESTADO
// ----------------------------------------------------------------------------
const SALT_LENGTH = 16;
let pendingBackupData = null; // Variável temporária para o restore

// Variáveis Globais para Instâncias de Gráficos (Chart.js)
// Necessário para destruir o gráfico anterior antes de criar um novo
let chartDashboard = null;

// Gráficos de Municípios
let chartStatusMun = null;
let chartModulesMun = null;
let chartTimelineMun = null;

// Gráficos de Solicitações
let chartStatusReq = null;
let chartMunReq = null;
let chartSolReq = null;

// Gráficos de Apresentações
let chartStatusPres = null;
let chartMunPres = null;
let chartOrientPres = null;

// Gráficos de Demandas
let chartStatusDem = null;
let chartPrioDem = null;
let chartUserDem = null;

// Gráficos de Visitas
let chartStatusVis = null;
let chartMunVis = null;
let chartSolVis = null;

// Gráficos de Produção
let chartStatusProd = null;
let chartFreqProd = null;

// Paleta de Cores Padrão
const CHART_COLORS = [
    '#C85250', // Vermelho
    '#E7B85F', // Amarelo
    '#79C2A9', // Verde Água
    '#5E8C99', // Azul Petróleo
    '#3B5B66', // Azul Escuro
    '#E68161', // Laranja
    '#F7DC6F', // Amarelo Claro
    '#4ECDC4', // Turquesa
    '#FF6B6B', // Vermelho Claro
    '#A9DFBF'  // Verde Claro
];

// ----------------------------------------------------------------------------
// 3. FUNÇÕES DE MENU MOBILE (CORRIGIDO v14)
// ----------------------------------------------------------------------------
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    // Cria o overlay se não existir (segurança)
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'sidebar-overlay';
        document.body.appendChild(newOverlay);
        
        // Adiciona evento ao novo overlay
        newOverlay.onclick = toggleMobileMenu;
        
        // Pequeno delay para animação
        setTimeout(function() {
            newOverlay.classList.toggle('active');
            sidebar.classList.toggle('mobile-open');
        }, 10);
        return;
    }

    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

// ----------------------------------------------------------------------------
// 4. FUNÇÕES UTILITÁRIAS (CORE)
// ----------------------------------------------------------------------------

function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

function hashPassword(password, salt) {
    return CryptoJS.SHA256(salt + password).toString();
}

// Função de Salvamento com Tratamento de Erro de Cota
function salvarNoArmazenamento(chave, dados) {
    try {
        const dadosJSON = JSON.stringify(dados);
        localStorage.setItem(chave, dadosJSON);
        console.log(`Dados salvos em '${chave}' com sucesso.`);
    } catch (erro) {
        console.error('Erro ao salvar no localStorage:', erro);
        if (erro.name === 'QuotaExceededError') {
            alert('⚠️ Espaço de armazenamento do navegador cheio! Por favor, faça um backup e limpe dados antigos.');
        }
    }
}

function recuperarDoArmazenamento(chave, valorPadrao = null) {
    try {
        const dados = localStorage.getItem(chave);
        if (dados) {
            return JSON.parse(dados);
        } else {
            return valorPadrao;
        }
    } catch (erro) {
        console.error('Erro ao recuperar do localStorage:', erro);
        return valorPadrao;
    }
}

function deletarDoArmazenamento(chave) {
    localStorage.removeItem(chave);
}

function formatDate(dateString) {
    if (!dateString) {
        return '-';
    }
    // Converte YYYY-MM-DD para DD/MM/YYYY
    const partes = dateString.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dateString;
}

// Cálculo de Tempo de Uso (PDF Item 15)
function calculateTimeInUse(dateString) {
    if (!dateString) {
        return '-';
    }
    
    const start = new Date(dateString);
    const now = new Date();
    
    // Diferença em milissegundos
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    let result = "";
    if (years > 0) {
        result += `${years} ano(s) `;
    }
    if (months > 0) {
        result += `${months} mês(es)`;
    }
    if (years === 0 && months === 0) {
        result = "Menos de 1 mês";
    }
    
    return result;
}

// Cálculo de Dias desde a última visita (PDF Item 15)
function calculateDaysSince(dateString) {
    if (!dateString) {
        return '-';
    }
    
    const last = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return `${diffDays} dias`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        return;
    }
    
    toast.textContent = message;
    
    // Resetar classes para animação
    toast.className = 'toast';
    void toast.offsetWidth; // Força reflow
    
    toast.classList.add(type);
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ----------------------------------------------------------------------------
// 5. EXPORTAÇÃO (CSV E PDF)
// ----------------------------------------------------------------------------

function downloadCSV(filename, headers, rows) {
    // Adiciona BOM para Excel reconhecer acentos
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => {
            const cellText = (cell || '').toString();
            return `"${cellText.replace(/"/g, '""')}"`;
        }).join(';'))
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
        // Fallback se o plugin autoTable falhar
        let y = 40;
        rows.forEach(row => {
            if (y > 180) {
                doc.addPage();
                y = 20;
            }
            doc.text(row.join(' | ').substring(0, 120), 14, y);
            y += 7;
        });
    }
    
    doc.save(`${title}.pdf`);
}

// ----------------------------------------------------------------------------
// 6. MÁSCARAS E FORMATAÇÃO DE INPUTS
// ----------------------------------------------------------------------------

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
    const phoneInputs = [
        'municipality-contact',
        'task-contact',
        'orientador-contact',
        'request-contact',
        'production-contact'
    ];

    phoneInputs.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function(e) {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });

    const elComp = document.getElementById('production-competence');
    if (elComp) {
        elComp.addEventListener('input', function(e) {
            e.target.value = formatCompetencia(e.target.value);
        });
    }

    const elPeriod = document.getElementById('production-period');
    if (elPeriod) {
        elPeriod.placeholder = "DD/MM à DD/MM";
        elPeriod.addEventListener('input', function(e) {
            e.target.value = formatPeriodo(e.target.value);
        });
    }

    // Auto-refresh nos filtros (CORREÇÃO: input para digitar, change para selecionar)
    const filters = document.querySelectorAll('.filters-section select, .filters-section input');
    filters.forEach(function(el) {
        // Para digitar e filtrar na hora
        el.addEventListener('input', function() {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) refreshCurrentTab(activeTab.id);
        });
        // Para dropdowns
        el.addEventListener('change', function() {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) refreshCurrentTab(activeTab.id);
        });
    });
}

// ----------------------------------------------------------------------------
// 7. INJEÇÃO DE CAMPOS DINÂMICOS (REGRAS PDF)
// ----------------------------------------------------------------------------
function setupDynamicFormFields() {
    
    // 0. Injeção do Modal de Confirmação de Restore (Se não existir)
    if (!document.getElementById('restore-confirm-modal')) {
        const modalHTML = `
        <div id="restore-confirm-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚠️ Confirmar Restauração de Backup</h3>
                    <button class="close-btn" onclick="closeRestoreConfirmModal()">&times;</button>
                </div>
                <div style="padding: 24px;">
                    <div class="backup-warning" style="background-color: rgba(211, 47, 47, 0.1); border: 1px solid #d32f2f; color: #d32f2f; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin:0;"><strong>⚠️ ATENÇÃO: Isso irá SUBSTITUIR todos os dados atuais do sistema e fará logout automático!</strong></p>
                    </div>
                    <div class="backup-preview" style="background-color: var(--color-bg-1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin-top:0;">Preview dos dados que serão restaurados:</h4>
                        <ul id="restore-preview-list" style="list-style: none; padding: 0; margin: 10px 0 0 0;">
                        </ul>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn--secondary" onclick="closeRestoreConfirmModal()">Cancelar</button>
                        <button type="button" class="btn btn--danger" style="background-color: #d32f2f; color: white;" onclick="confirmRestore()">⚠️ Restaurar Backup</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 1. Municípios: Data Bloqueio e Data Parou
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
        const actions = formMun.querySelector('.modal-actions');
        formMun.insertBefore(div, actions);
    }

    // 2. Solicitações: Data Realização e Justificativa
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
        const actions = formReq.querySelector('.modal-actions');
        formReq.insertBefore(div, actions);
    }

    // 3. Demandas: Data Realização e Justificativa
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
        const actions = formDem.querySelector('.modal-actions');
        formDem.insertBefore(div, actions);
    }

    // 4. Visitas: Data Realização e Justificativa
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
        const actions = formVis.querySelector('.modal-actions');
        formVis.insertBefore(div, actions);
    }
    
    // 5. Módulos: Injeção automática do campo Descrição
    const formMod = document.getElementById('modulo-form');
    if (formMod && !document.getElementById('modulo-description')) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label class="form-label">Descrição do Módulo* (Máx 250)</label><textarea class="form-control" id="modulo-description" rows="3" maxlength="250" required></textarea>`;
        const actions = formMod.querySelector('.modal-actions');
        formMod.insertBefore(div, actions);
    }
}

// ----------------------------------------------------------------------------
// 8. CARREGAMENTO DE DADOS (STATE) - DADOS PADRÃO COMPLETOS
// ----------------------------------------------------------------------------
const DADOS_PADRAO = {
    users: [
        { 
            id: 1, 
            login: 'ADMIN', 
            name: 'Administrador', 
            salt: null, 
            passwordHash: null, 
            permission: 'Administrador', 
            status: 'Ativo', 
            mustChangePassword: true 
        }
    ],
    modulos: [
        { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#FF6B6B', description: 'Módulo de cadastros gerais' },
        { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#4ECDC4', description: 'Tratamento Fora de Domicílio' },
        { id: 3, name: 'Prontuário', abbreviation: 'PEC', color: '#45B7D1', description: 'Prontuário Eletrônico do Cidadão' },
        { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#FFA07A', description: 'Gestão administrativa' }
    ],
    // Arrays vazios iniciais
    municipalities: [],
    municipalitiesList: [],
    tasks: [],
    requests: [],
    demands: [],
    visits: [],
    productions: [],
    presentations: [],
    systemVersions: [],
    cargos: [],
    orientadores: [],
    formasApresentacao: []
};

// Carrega usuários
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);

// Garante senha padrão para ADMIN se não existir
if (users.length > 0 && users[0].login === 'ADMIN' && !users[0].passwordHash) {
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

// Contadores de ID (Persistidos)
let counters = recuperarDoArmazenamento('counters', {
    mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1
});

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// ----------------------------------------------------------------------------
// 9. INTERFACE E NAVEGAÇÃO
// ----------------------------------------------------------------------------

function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = currentTheme === 'light' ? '🌙 Tema' : '☀️ Tema';
    }
}

function toggleTheme() {
    if (currentTheme === 'light') {
        currentTheme = 'dark';
    } else {
        currentTheme = 'light';
    }
    salvarNoArmazenamento('theme', currentTheme);
    initializeTheme();
}

function updateUserInterface() {
    if (!currentUser) {
        return;
    }
    
    const elName = document.getElementById('logged-user-name');
    if (elName) {
        elName.textContent = currentUser.name;
    }

    const isAdmin = currentUser.permission === 'Administrador';
    
    // Controle explícito de visibilidade dos botões do menu
    const btnUser = document.getElementById('user-management-menu-btn');
    if (btnUser) {
        btnUser.style.display = isAdmin ? 'flex' : 'none';
    }
    
    const itemsToEnable = [
        'cargo-management-menu-btn',
        'orientador-management-menu-btn',
        'modulo-management-menu-btn',
        'municipality-list-management-menu-btn',
        'forma-apresentacao-management-menu-btn',
        'backup-menu-btn'
    ];
    
    itemsToEnable.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex';
        }
    });

    const divider = document.getElementById('admin-divider');
    if (divider) {
        divider.style.display = isAdmin ? 'block' : 'none';
    }
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
                setTimeout(function() {
                    refreshCurrentTab(sectionId);
                }, 10);
            }
            
            // FECHAR MENU MOBILE SE ESTIVER ABERTO
            if (window.innerWidth <= 900) {
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                if(sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    if(overlay) overlay.classList.remove('active');
                }
            }
        };
    });
}

function refreshCurrentTab(sectionId) {
    // Antes de renderizar, atualiza os dropdowns para garantir que novos cadastros apareçam
    updateGlobalDropdowns();

    if (sectionId === 'municipios-section') {
        renderMunicipalities();
    }
    if (sectionId === 'tarefas-section') {
        renderTasks();
    }
    if (sectionId === 'solicitacoes-section') {
        renderRequests();
    }
    if (sectionId === 'demandas-section') {
        renderDemands();
    }
    if (sectionId === 'visitas-section') {
        renderVisits();
    }
    if (sectionId === 'producao-section') {
        renderProductions();
    }
    if (sectionId === 'apresentacoes-section') {
        renderPresentations();
    }
    if (sectionId === 'versoes-section') {
        renderVersions();
    }
    if (sectionId === 'dashboard-section') {
        updateDashboardStats();
        initializeDashboardCharts();
    }
}

function navigateToHome() {
    const dashBtn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if (dashBtn) {
        dashBtn.click();
    }
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
    document.querySelectorAll('.tab-content').forEach(function(c) {
        c.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-btn').forEach(function(b) {
        b.classList.remove('active');
    });
    const sec = document.getElementById(sectionId);
    if (sec) {
        sec.classList.add('active');
    }
}

// ----------------------------------------------------------------------------
// 10. AUTENTICAÇÃO
// ----------------------------------------------------------------------------
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
    
    const idx = users.findIndex(function(u) { return u.id === currentUser.id; });
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

// ----------------------------------------------------------------------------
// 11. MUNICÍPIOS CLIENTES (REGRAS PDF 1)
// ----------------------------------------------------------------------------

// Função para controlar campos baseados no status
function handleMunicipalityStatusChange() {
    const status = document.getElementById('municipality-status').value;
    const groupBlocked = document.getElementById('group-date-blocked');
    const groupStopped = document.getElementById('group-date-stopped');
    
    // Reseta visualização
    if (groupBlocked) {
        groupBlocked.style.display = 'none';
    }
    if (groupStopped) {
        groupStopped.style.display = 'none';
    }
    
    // Aplica lógica PDF
    if (status === 'Bloqueado' && groupBlocked) {
        groupBlocked.style.display = 'block';
    } else if (status === 'Parou de usar' && groupStopped) {
        groupStopped.style.display = 'block';
    }
}

function showMunicipalityModal(id = null) {
    editingId = id;
    document.getElementById('municipality-form').reset();
    
    // 1. Popula o dropdown com a Lista Mestra atual
    const munSelect = document.getElementById('municipality-name');
    populateSelect(munSelect, municipalitiesList, 'name', 'name');
    
    const statusSel = document.getElementById('municipality-status');
    statusSel.onchange = handleMunicipalityStatusChange;

    // 2. Renderiza Checkboxes de Módulos Dinamicamente
    const checkboxContainer = document.querySelector('#municipality-form .checkbox-grid');
    if(checkboxContainer) {
        if(modulos.length > 0) {
            checkboxContainer.innerHTML = modulos.map(function(m) {
                return `<label><input type="checkbox" value="${m.name}" class="module-checkbox"> ${m.name}</label>`;
            }).join('');
        } else {
            checkboxContainer.innerHTML = '<p style="font-size:12px;color:gray;">Nenhum módulo cadastrado em configurações.</p>';
        }
    }
    
    // 3. Se for Edição, preenche os dados
    if (id) {
        const m = municipalities.find(function(x) { return x.id === id; });
        if (m) {
            // --- CORREÇÃO DO NOME (INÍCIO) ---
            // Verifica se o nome do município existe nas opções do dropdown.
            // Se não existir (veio de CSV ou backup antigo), cria a opção temporariamente para exibir corretamente.
            let exists = false;
            for (let i = 0; i < munSelect.options.length; i++) {
                if (munSelect.options[i].value === m.name) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.textContent = m.name;
                munSelect.appendChild(opt);
            }
            munSelect.value = m.name;
            // --- CORREÇÃO DO NOME (FIM) ---

            document.getElementById('municipality-status').value = m.status;
            document.getElementById('municipality-manager').value = m.manager;
            document.getElementById('municipality-contact').value = m.contact;
            document.getElementById('municipality-implantation-date').value = m.implantationDate;
            document.getElementById('municipality-last-visit').value = m.lastVisit;
            
            if(document.getElementById('municipality-date-blocked')) {
                document.getElementById('municipality-date-blocked').value = m.dateBlocked || '';
            }
            if(document.getElementById('municipality-date-stopped')) {
                document.getElementById('municipality-date-stopped').value = m.dateStopped || '';
            }
            
            if (m.modules) {
                document.querySelectorAll('.module-checkbox').forEach(function(cb) {
                    cb.checked = m.modules.includes(cb.value);
                });
            }
            
            // Atualiza a visibilidade dos campos de data extra (Bloqueio/Parada)
            handleMunicipalityStatusChange();
        }
    } else {
        // Se for Novo Cadastro, garante que campos extras fiquem ocultos
        handleMunicipalityStatusChange();
    }
    
    document.getElementById('municipality-modal').classList.add('show');
}

function saveMunicipality(e) {
    e.preventDefault();
    const name = document.getElementById('municipality-name').value;
    const status = document.getElementById('municipality-status').value;
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(function(cb) { 
        return cb.value; 
    });
    
    // Validação Duplicidade
    if (!editingId && municipalities.some(function(m) { return m.name === name; })) {
        alert('Erro: Este município já está cadastrado na carteira!');
        return;
    }

    // Validação "Em Uso" (PDF)
    if (status === 'Em uso' && mods.length === 0) {
        alert('Erro: Para status "Em Uso", selecione pelo menos um módulo.');
        return;
    }

    // Validação "Bloqueado" (PDF)
    const dateBlocked = document.getElementById('municipality-date-blocked') ? document.getElementById('municipality-date-blocked').value : '';
    if (status === 'Bloqueado' && !dateBlocked) {
        alert('Erro: Preencha a "Data em que foi Bloqueado".');
        return;
    }

    const data = {
        name: name,
        status: status,
        manager: document.getElementById('municipality-manager').value,
        contact: document.getElementById('municipality-contact').value,
        implantationDate: document.getElementById('municipality-implantation-date').value,
        lastVisit: document.getElementById('municipality-last-visit').value,
        modules: mods,
        dateBlocked: dateBlocked,
        dateStopped: document.getElementById('municipality-date-stopped') ? document.getElementById('municipality-date-stopped').value : ''
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

function getFilteredMunicipalities() {
    const fName = document.getElementById('filter-municipality-name') ? document.getElementById('filter-municipality-name').value : '';
    const fStatus = document.getElementById('filter-municipality-status') ? document.getElementById('filter-municipality-status').value : '';
    const fMod = document.getElementById('filter-municipality-module') ? document.getElementById('filter-municipality-module').value : '';
    const fGest = document.getElementById('filter-municipality-manager') ? document.getElementById('filter-municipality-manager').value.toLowerCase() : '';

    let filtered = municipalities.filter(function(m) {
        if (fName && m.name !== fName) return false;
        if (fStatus && m.status !== fStatus) return false;
        if (fMod && !m.modules.includes(fMod)) return false;
        if (fGest && !m.manager.toLowerCase().includes(fGest)) return false;
        return true;
    });
    
    return filtered.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
}

function renderMunicipalities() {
    const filtered = getFilteredMunicipalities();
    const c = document.getElementById('municipalities-table');
    
    if(document.getElementById('filter-municipality-name') && document.getElementById('filter-municipality-name').options.length <= 1) {
        populateFilterSelects();
    }

    const counter = document.getElementById('municipalities-results-count');
    if (counter) {
        counter.style.display = 'block';
        counter.innerHTML = '<strong>' + filtered.length + '</strong> município(s) no total';
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município encontrado com os filtros selecionados.</div>';
    } else {
        const rows = filtered.map(function(m) {
            let dataFim = '-';
            let corDataFim = 'inherit';
            
            if (m.status === 'Bloqueado' && m.dateBlocked) {
                dataFim = formatDate(m.dateBlocked);
                corDataFim = '#C85250';
            } else if (m.status === 'Parou de usar' && m.dateStopped) {
                dataFim = formatDate(m.dateStopped);
                corDataFim = '#E68161';
            }

            // --- AJUSTE: Módulos mais compactos (Fonte 9px, Padding menor) ---
            const modulesBadges = m.modules.map(function(modName) {
                const modConfig = modulos.find(function(x) { return x.name === modName; });
                const abbrev = modConfig ? modConfig.abbreviation : modName.substring(0,3).toUpperCase();
                
                // Mudanças: padding:0px 4px; font-size:9px;
                return `<span style="background:rgba(0, 85, 128, 0.05); color:#005580; border:1px solid rgba(0, 85, 128, 0.3); padding:0px 4px; border-radius:3px; font-size:9px; margin-right:2px; display:inline-block; margin-bottom:2px; font-weight:700; line-height:1.4;" title="${modName}">${abbrev}</span>`;
            }).join('');
            
            let statusClass = 'task-status';
            let customStyle = '';

            if (m.status === 'Em uso') statusClass += ' completed'; 
            else if (m.status === 'Bloqueado') statusClass += ' cancelled'; 
            else if (m.status === 'Parou de usar') statusClass += ' pending'; 
            else {
                customStyle = 'background:rgba(150,150,150,0.15); color:#666; border:1px solid rgba(150,150,150,0.25);';
            }

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${m.name}</td>
                <td style="max-width: 140px; white-space: normal; line-height:1.1;">${modulesBadges}</td>
                <td style="font-size:12px;">${m.manager}</td>
                <td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td>
                <td>${formatDate(m.lastVisit)}</td>
                <td style="font-size:11px;">${calculateTimeInUse(m.implantationDate)}</td>
                <td style="font-size:11px;">${calculateDaysSince(m.lastVisit)}</td>
                <td><span class="${statusClass}" style="${customStyle}">${m.status}</span></td>
                <td style="color:${corDataFim}; font-weight:500; font-size:11px;">${dataFim}</td>
                <td>
                    <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Município</th>
                <th>Módulos em Uso</th>
                <th>Gestor(a) de Saúde Atual</th>
                <th>Contato</th>
                <th>Data<br>Implantação</th>
                <th>Última Visita<br>Presencial</th>
                <th>Tempo de Uso</th>
                <th>Dias s/ Visita</th>
                <th>Status</th>
                <th>Data Bloqueio/<br>Parou de usar</th>
                <th>Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    updateMunicipalityCharts(filtered);
}

function updateMunicipalityCharts(data) {
    // 1. Gráfico de Status (Pizza) - Mantido
    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus && window.Chart) {
        if (chartStatusMun) {
            chartStatusMun.destroy();
        }
        
        chartStatusMun = new Chart(document.getElementById('statusChart'), {
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
                    backgroundColor: ['#005580', '#C85250', '#E68161', '#79C2A9'] 
                }] 
            }
        });
    }
    
    // 2. Gráfico de Módulos (Barra Colorida) - ATUALIZADO
    const ctxModules = document.getElementById('modulesChart');
    if (ctxModules && window.Chart) {
        if (chartModulesMun) {
            chartModulesMun.destroy();
        }
        
        const modCounts = {};
        data.forEach(m => {
            m.modules.forEach(mod => {
                modCounts[mod] = (modCounts[mod] || 0) + 1;
            });
        });
        
        const labels = Object.keys(modCounts);
        const values = Object.values(modCounts);
        
        // Gera cores diferentes para cada barra (módulo)
        const bgColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        
        chartModulesMun = new Chart(document.getElementById('modulesChart'), {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Qtd Municípios', 
                    data: values, 
                    backgroundColor: bgColors // Agora colorido
                }] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Opcional: Esconder labels do eixo X se tiver muitos módulos
                // scales: { x: { ticks: { display: false } } } 
            }
        });
    }

    // 3. Gráfico de Evolução (Linha Acumulada) - Mantido
    const ctxTimeline = document.getElementById('timelineChart');
    if (ctxTimeline && window.Chart) {
        if (chartTimelineMun) {
            chartTimelineMun.destroy();
        }
        
        const implantations = data
            .filter(m => m.implantationDate) 
            .map(m => m.implantationDate.substring(0, 7)) 
            .sort(); 

        const timeData = {};
        let totalAcumulado = 0;
        
        implantations.forEach(date => {
            timeData[date] = (timeData[date] || 0) + 1;
        });

        const labels = [];
        const values = [];
        
        Object.keys(timeData).sort().forEach(dateKey => {
            const [ano, mes] = dateKey.split('-');
            const labelBr = `${mes}/${ano}`; 
            totalAcumulado += timeData[dateKey]; 
            labels.push(labelBr);
            values.push(totalAcumulado);
        });
        
        chartTimelineMun = new Chart(document.getElementById('timelineChart'), {
            type: 'line',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Total de Clientes (Acumulado)', 
                    data: values, 
                    borderColor: '#005580', 
                    backgroundColor: 'rgba(0, 85, 128, 0.1)', 
                    fill: true, 
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Total Acumulado: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Contadores
    if(document.getElementById('total-municipalities')) document.getElementById('total-municipalities').textContent = data.length;
    if(document.getElementById('active-municipalities')) document.getElementById('active-municipalities').textContent = data.filter(m => m.status === 'Em uso').length;
    if(document.getElementById('inactive-municipalities')) document.getElementById('inactive-municipalities').textContent = data.filter(m => m.status !== 'Em uso').length;
    
    const daysList = data.filter(m => m.lastVisit).map(m => {
        const last = new Date(m.lastVisit);
        const now = new Date();
        const diffTime = Math.abs(now - last);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
    
    const avgDays = daysList.length > 0 ? Math.floor(daysList.reduce((a,b)=>a+b,0)/daysList.length) : 0;
    if(document.getElementById('avg-days-last-visit')) document.getElementById('avg-days-last-visit').textContent = `${avgDays} dias`;
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
    if (document.getElementById('filter-municipality-name')) document.getElementById('filter-municipality-name').value = '';
    if (document.getElementById('filter-municipality-status')) document.getElementById('filter-municipality-status').value = '';
    if (document.getElementById('filter-municipality-module')) document.getElementById('filter-municipality-module').value = '';
    if (document.getElementById('filter-municipality-manager')) document.getElementById('filter-municipality-manager').value = '';
    renderMunicipalities();
}

// ----------------------------------------------------------------------------
// 12. TREINAMENTOS (Itens 3, 16)
// ----------------------------------------------------------------------------

function showTaskModal(id = null) {
    editingId = id;
    document.getElementById('task-form').reset();
    updateGlobalDropdowns();
    
    // AJUSTE 1: Mover município para o topo
    const form = document.getElementById('task-form');
    const fieldMun = document.getElementById('task-municipality').closest('.form-group');
    if(fieldMun) {
        form.insertBefore(fieldMun, form.firstChild);
    }
    
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
        if (i !== -1) tasks[i] = { ...tasks[i], ...data };
    } else {
        tasks.push({ id: getNextId('task'), ...data });
    }
    
    salvarNoArmazenamento('tasks', tasks);
    document.getElementById('task-modal').classList.remove('show');
    
    // CORREÇÃO: Limpa os filtros para garantir que o novo item apareça na lista
    // Se preferir manter os filtros, remova a linha abaixo, mas o item pode ficar oculto se não bater com o filtro
    clearTaskFilters(); 
    
    showToast('Treinamento salvo com sucesso!', 'success');
}

// Função Auxiliar para validar datas (Tarefas e Solicitações)
function validateDateRange(type) {
    let startId, endId;

    if (type === 'req' || type === 'perf') {
        startId = `filter-task-${type}-start`; endId = `filter-task-${type}-end`;
    } else if (type.includes('request')) {
        startId = `filter-${type}-start`; endId = `filter-${type}-end`;
    } else if (type.includes('pres')) {
        startId = `filter-presentation-${type.split('-')[1]}-start`; endId = `filter-presentation-${type.split('-')[1]}-end`;
    } else if (type.includes('dem')) {
        startId = `filter-demand-${type.split('-')[1]}-start`; endId = `filter-demand-${type.split('-')[1]}-end`;
    } else if (type.includes('visit')) {
        startId = `filter-${type}-start`; endId = `filter-${type}-end`;
    } else if (type.includes('production')) { // NOVO: PRODUÇÃO
        // production-release ou production-send
        startId = `filter-${type}-start`; 
        endId = `filter-${type}-end`;
    }

    const start = document.getElementById(startId);
    const end = document.getElementById(endId);
    
    if (!start || !end) return;

    if (start.value) end.min = start.value;
    else end.removeAttribute('min');
    
    if (end.value && start.value && end.value < start.value) end.value = start.value;

    // Refresh
    if (type.includes('production')) renderProductions();
    else if (type.includes('dem')) renderDemands();
    else if (type.includes('request')) renderRequests();
    else if (type.includes('pres')) renderPresentations();
    else if (type.includes('visit')) renderVisits();
    else renderTasks();
}

function getFilteredTasks() {
    const fMun = document.getElementById('filter-task-municipality')?.value;
    const fStatus = document.getElementById('filter-task-status')?.value;
    const fReq = document.getElementById('filter-task-requester')?.value.toLowerCase();
    const fPerf = document.getElementById('filter-task-performer')?.value; 
    const fCargo = document.getElementById('filter-task-position')?.value; 
    
    // Datas Solicitação
    const fReqStart = document.getElementById('filter-task-req-start')?.value;
    const fReqEnd = document.getElementById('filter-task-req-end')?.value;
    
    // Datas Realização
    const fPerfStart = document.getElementById('filter-task-perf-start')?.value;
    const fPerfEnd = document.getElementById('filter-task-perf-end')?.value;

    let filtered = tasks.filter(function(t) {
        if (fMun && t.municipality !== fMun) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if (fPerf && t.performedBy !== fPerf) return false;
        if (fCargo && t.trainedPosition !== fCargo) return false;

        // Filtro Data Solicitação (Intervalo)
        if (fReqStart && t.dateRequested < fReqStart) return false;
        if (fReqEnd && t.dateRequested > fReqEnd) return false;

        // Filtro Data Realização (Intervalo)
        if (fPerfStart && (!t.datePerformed || t.datePerformed < fPerfStart)) return false;
        if (fPerfEnd && (!t.datePerformed || t.datePerformed > fPerfEnd)) return false;
        
        return true;
    });

    // Ordenação Padrão
    return filtered.sort(function(a, b) {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return new Date(a.dateRequested) - new Date(b.dateRequested);
    });
}

function renderTasks() {
    const filtered = getFilteredTasks();
    const c = document.getElementById('tasks-table');
    
    if(document.getElementById('tasks-results-count')) {
        document.getElementById('tasks-results-count').style.display = 'block';
        document.getElementById('tasks-results-count').innerHTML = '<strong>' + filtered.length + '</strong> treinamentos encontrados';
    }
    if(document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent = tasks.length;
    if(document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent = filtered.filter(t => t.status==='Concluído').length;
    if(document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent = filtered.filter(t => t.status==='Pendente').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum treinamento encontrado.</div>';
    } else {
        const rows = filtered.map(function(t) {
            let obs = t.observations || '-';
            if (obs.length > 30) obs = `<span title="${t.observations}">${t.observations.substring(0, 30)}...</span>`;

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${t.municipality}</td> <td style="text-align:center;">${formatDate(t.dateRequested)}</td>
                <td style="text-align:center;">${formatDate(t.datePerformed)}</td>
                <td>${t.requestedBy}</td>
                <td>${t.performedBy}</td>
                <td>${t.trainedName || '-'}</td>
                <td>${t.trainedPosition || '-'}</td>
                <td>${t.contact || '-'}</td>
                <td style="font-size:12px; color:#555;">${obs}</td>
                <td><span class="task-status ${t.status === 'Concluído' ? 'completed' : (t.status === 'Cancelado' ? 'cancelled' : 'pending')}">${t.status}</span></td>
                <td>
                    <button class="btn btn--sm" onclick="showTaskModal(${t.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteTask(${t.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Município</th>
                <th style="text-align:center;">Data<br>Solicitação</th>
                <th style="text-align:center;">Data<br>Realização</th>
                <th>Solicitante</th>
                <th>Orientador</th>
                <th>Profissional<br>à Treinar</th>
                <th>Cargo/Função</th>
                <th>Contato</th>
                <th>Observações</th>
                <th>Status</th>
                <th>Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
}

function exportTasksCSV() {
    const data = getFilteredTasks();
    const headers = ['Município', 'Data Sol.', 'Data Real.', 'Solicitante', 'Orientador', 'Profissional', 'Cargo', 'Contato', 'Status'];
    const rows = data.map(function(t) { 
        return [t.municipality, formatDate(t.dateRequested), formatDate(t.datePerformed), t.requestedBy, t.performedBy, t.trainedName, t.trainedPosition, t.contact, t.status]; 
    });
    downloadCSV('treinamentos.csv', headers, rows);
}

function generateTasksPDF() {
    const data = getFilteredTasks();
    const headers = ['Município', 'Data Sol.', 'Orientador', 'Status'];
    const rows = data.map(function(t) { 
        return [t.municipality, formatDate(t.dateRequested), t.performedBy, t.status]; 
    });
    downloadPDF('Relatório Treinamentos', headers, rows);
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
    const ids = [
        'filter-task-municipality', 'filter-task-performer', 'filter-task-position', 
        'filter-task-status', 'filter-task-requester', 
        'filter-task-req-start', 'filter-task-req-end', 
        'filter-task-perf-start', 'filter-task-perf-end'
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderTasks();
}

// ----------------------------------------------------------------------------
// 13. SOLICITAÇÕES (Itens 3, 4, 5, 17)
// ----------------------------------------------------------------------------

function handleRequestStatusChange() {
    const status = document.getElementById('request-status').value;
    const grpReal = document.getElementById('group-request-date-realization');
    const grpJust = document.getElementById('group-request-justification');
    
    if(grpReal) grpReal.style.display = (status === 'Realizado') ? 'block' : 'none';
    if(grpJust) grpJust.style.display = (status === 'Inviável') ? 'block' : 'none';
}

function showRequestModal(id = null) {
    editingId = id;
    const form = document.getElementById('request-form');
    form.reset();
    
    // Item 9: Município no topo
    const fieldMun = document.getElementById('request-municipality').closest('.form-group');
    if(fieldMun) {
        form.insertBefore(fieldMun, form.firstChild);
    }

    const statusSel = document.getElementById('request-status');
    statusSel.onchange = handleRequestStatusChange;
    updateGlobalDropdowns();

    if (id) {
        const r = requests.find(function(x) { return x.id === id; });
        document.getElementById('request-municipality').value = r.municipality;
        document.getElementById('request-date').value = r.date;
        document.getElementById('request-contact').value = r.contact;
        document.getElementById('request-requester').value = r.requester;
        document.getElementById('request-description').value = r.description;
        document.getElementById('request-status').value = r.status;
        
        if(document.getElementById('request-date-realization')) {
            document.getElementById('request-date-realization').value = r.dateRealization || '';
        }
        if(document.getElementById('request-justification')) {
            document.getElementById('request-justification').value = r.justification || '';
        }
        
        handleRequestStatusChange();
    }
    document.getElementById('request-modal').classList.add('show');
}

function saveRequest(e) {
    e.preventDefault();
    const status = document.getElementById('request-status').value;
    
    // Validação PDF
    if (status === 'Realizado' && !document.getElementById('request-date-realization').value) {
        alert('Data de Realização é obrigatória.'); return;
    }
    if (status === 'Inviável' && !document.getElementById('request-justification').value) {
        alert('Justificativa é obrigatória.'); return;
    }

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
        const i = requests.findIndex(function(x) { return x.id === editingId; });
        if (i !== -1) requests[i] = { ...requests[i], ...data };
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
    const fUser = document.getElementById('filter-request-user')?.value; // Agora é Select (nome exato)
    
    // Datas Solicitação
    const fSolStart = document.getElementById('filter-request-sol-start')?.value;
    const fSolEnd = document.getElementById('filter-request-sol-end')?.value;
    
    // Datas Realização
    const fRealStart = document.getElementById('filter-request-real-start')?.value;
    const fRealEnd = document.getElementById('filter-request-real-end')?.value;

    let filtered = requests.filter(function(r) {
        if (fMun && r.municipality !== fMun) return false;
        if (fStatus && r.status !== fStatus) return false;
        if (fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        
        // Filtro de Usuário (Select: busca exata)
        if (fUser && r.user !== fUser) return false;

        // Filtro Data Solicitação
        if (fSolStart && r.date < fSolStart) return false;
        if (fSolEnd && r.date > fSolEnd) return false;

        // Filtro Data Realização
        if (fRealStart && (!r.dateRealization || r.dateRealization < fRealStart)) return false;
        if (fRealEnd && (!r.dateRealization || r.dateRealization > fRealEnd)) return false;
        
        return true;
    });

    // Ordenação por Data Solicitação
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderRequests() {
    const filtered = getFilteredRequests();
    const c = document.getElementById('requests-table');
    
    if(document.getElementById('requests-results-count')) {
        document.getElementById('requests-results-count').innerHTML = '<strong>' + filtered.length + '</strong> solicitações encontradas';
        document.getElementById('requests-results-count').style.display = 'block';
    }
    
    if(document.getElementById('total-requests')) document.getElementById('total-requests').textContent = requests.length;
    if(document.getElementById('pending-requests')) document.getElementById('pending-requests').textContent = filtered.filter(r => r.status === 'Pendente').length;
    if(document.getElementById('completed-requests')) document.getElementById('completed-requests').textContent = filtered.filter(r => r.status === 'Realizado').length;
    if(document.getElementById('unfeasible-requests')) document.getElementById('unfeasible-requests').textContent = filtered.filter(r => r.status === 'Inviável').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma solicitação encontrada.</div>';
    } else {
        const rows = filtered.map(function(x) {
            const desc = x.description.length > 40 ? `<span title="${x.description}">${x.description.substring(0,40)}...</span>` : x.description;
            const just = x.justification ? (x.justification.length > 30 ? `<span title="${x.justification}">${x.justification.substring(0,30)}...</span>` : x.justification) : '-';
            
            let statusClass = 'task-status';
            if (x.status === 'Realizado') statusClass += ' completed';
            else if (x.status === 'Inviável') statusClass += ' cancelled';
            else statusClass += ' pending';

            const statusBadge = `<span class="${statusClass}">${x.status}</span>`;

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${x.municipality}</td> <td style="text-align:center;">${formatDate(x.date)}</td>
                <td style="text-align:center;">${formatDate(x.dateRealization)}</td>
                <td>${x.requester}</td>
                <td>${x.contact}</td>
                <td style="font-size:12px;">${desc}</td>
                <td>${x.user || '-'}</td>
                <td>${statusBadge}</td>
                <td style="font-size:12px; color:#555;">${just}</td>
                <td>
                    <button class="btn btn--sm" onclick="showRequestModal(${x.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteRequest(${x.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Município</th>
                <th style="text-align:center;">Data<br>Solicitação</th>
                <th style="text-align:center;">Data<br>Realização</th>
                <th>Solicitante</th>
                <th>Contato</th>
                <th>Descrição da<br>Solicitação</th>
                <th>Usuário</th>
                <th>Status</th>
                <th>Justificativa</th>
                <th>Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    
    updateRequestCharts(filtered);
}

function updateRequestCharts(data) {
    // 1. Gráfico de Status (Pizza)
    if (document.getElementById('requestStatusChart') && window.Chart) {
        if (chartStatusReq) chartStatusReq.destroy();
        chartStatusReq = new Chart(document.getElementById('requestStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizado', 'Inviável'], 
                datasets: [{ 
                    data: [
                        data.filter(x => x.status==='Pendente').length, 
                        data.filter(x => x.status==='Realizado').length, 
                        data.filter(x => x.status==='Inviável').length
                    ], 
                    backgroundColor: ['#E68161', '#005580', '#C85250'] // Laranja, Azul, Vermelho
                }] 
            }
        });
    }

    // 2. Gráfico de Municípios (Barra Colorida)
    if (document.getElementById('requestMunicipalityChart') && window.Chart) {
        if (chartMunReq) chartMunReq.destroy();
        
        const mCounts = {}; 
        data.forEach(r => { mCounts[r.municipality] = (mCounts[r.municipality]||0)+1; });
        
        const labels = Object.keys(mCounts);
        const values = Object.values(mCounts);
        
        // Gera cores diferentes para cada barra
        const bgColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        chartMunReq = new Chart(document.getElementById('requestMunicipalityChart'), {
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Qtd Solicitações', 
                    data: values, 
                    backgroundColor: bgColors 
                }] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { display: false } // Oculta nomes no eixo X (mostra só no mouse)
                    }
                }
            }
        });
    }
    
    // Removemos a lógica do gráfico de Solicitante que foi excluído
    if (chartSolReq) {
        chartSolReq.destroy();
        chartSolReq = null;
    }
}

function exportRequestsCSV() {
    const data = getFilteredRequests();
    const headers = ['Município', 'Data Sol.', 'Data Real.', 'Solicitante', 'Contato', 'Descrição', 'Status', 'Usuário'];
    const rows = data.map(function(r) { 
        return [r.municipality, formatDate(r.date), formatDate(r.dateRealization), r.requester, r.contact, r.description, r.status, r.user]; 
    });
    downloadCSV('solicitacoes.csv', headers, rows);
}

function generateRequestsPDF() {
    const data = getFilteredRequests();
    const headers = ['Município', 'Data Sol.', 'Status', 'Descrição'];
    const rows = data.map(function(r) { 
        return [r.municipality, formatDate(r.date), r.status, r.description]; 
    });
    downloadPDF('Relatório Solicitações', headers, rows);
}

function deleteRequest(id) {
    if (confirm('Excluir solicitação?')) {
        requests = requests.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('requests', requests);
        renderRequests();
    }
}

function closeRequestModal() {
    document.getElementById('request-modal').classList.remove('show');
}

function clearRequestFilters() {
    const ids = [
        'filter-request-municipality', 'filter-request-status', 'filter-request-user', 
        'filter-request-solicitante', 
        'filter-request-sol-start', 'filter-request-sol-end',
        'filter-request-real-start', 'filter-request-real-end'
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderRequests();
}

// ----------------------------------------------------------------------------
// 14. APRESENTAÇÕES (PDF Item 3, 4)
// ----------------------------------------------------------------------------
// Função Visual: Controla asteriscos e visibilidade conforme o Status

// Função Visual: Controla asteriscos e visibilidade conforme o Status
function handlePresentationStatusChange() {
    const status = document.getElementById('presentation-status').value;
    const grpDate = document.getElementById('presentation-date-realizacao-group');
    
    // Labels para adicionar o * visualmente
    const lblDate = document.getElementById('presentation-date-realizacao-label');
    const lblOrient = document.getElementById('presentation-orientador-label');
    const lblForms = document.getElementById('presentation-forms-label');
    const lblDesc = document.getElementById('presentation-description-label');

    // 1. Reseta todos os labels (remove asteriscos anteriores)
    if(lblDate) lblDate.textContent = 'Data de Realização';
    if(lblOrient) lblOrient.textContent = 'Orientador(es)';
    if(lblForms) lblForms.textContent = 'Formas de Apresentação';
    if(lblDesc) lblDesc.textContent = 'Descrição/Detalhes';

    // 2. AJUSTE: Campo de Data fica SEMPRE visível (agora é opcional nos outros status)
    if(grpDate) grpDate.style.display = 'block';

    // 3. Aplica regras de OBRIGATORIEDADE (*) baseadas no status
    if (status === 'Realizada') {
        // Regra: Data, Orientador e Formas OBRIGATÓRIOS
        if(lblDate) lblDate.textContent += '*';
        if(lblOrient) lblOrient.textContent += '*';
        if(lblForms) lblForms.textContent += '*';
    
    } else if (status === 'Pendente') {
        // Regra: Só Orientador OBRIGATÓRIO.
        if(lblOrient) lblOrient.textContent += '*';
    
    } else if (status === 'Cancelada') {
        // Regra: Só Descrição OBRIGATÓRIA.
        if(lblDesc) lblDesc.textContent += '*';
    }
}

function showPresentationModal(id = null) {
    editingId = id;
    const form = document.getElementById('presentation-form');
    if(form) form.reset();
    
    // 1. Popula dropdown com Lista Mestra (Verificação de segurança)
    const munSelect = document.getElementById('presentation-municipality');
    if (munSelect) {
        // Garante que municipalitiesList existe, senão usa array vazio
        const listaMestra = (typeof municipalitiesList !== 'undefined') ? municipalitiesList : [];
        populateSelect(munSelect, listaMestra, 'name', 'name');
    }
    
    // 2. Checkboxes dinâmicos (Orientadores)
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if (divO) {
        const listaOrient = (typeof orientadores !== 'undefined') ? orientadores : [];
        if(listaOrient.length > 0) {
            divO.innerHTML = listaOrient.map(o => `<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
        } else {
            divO.innerHTML = '<span style="font-size:11px; color:red;">Nenhum orientador cadastrado em configurações.</span>';
        }
    }

    // 3. Checkboxes dinâmicos (Formas)
    const divF = document.getElementById('presentation-forms-checkboxes');
    if (divF) {
        const listaFormas = (typeof formasApresentacao !== 'undefined') ? formasApresentacao : [];
        if(listaFormas.length > 0) {
            divF.innerHTML = listaFormas.map(f => `<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');
        } else {
            divF.innerHTML = '<span style="font-size:11px; color:red;">Nenhuma forma cadastrada em configurações.</span>';
        }
    }

    if (id) {
        const p = presentations.find(x => x.id === id);
        if(p) {
            // Cria a opção no select se ela não existir (para edições antigas)
            if(munSelect) {
                let exists = false;
                for (let i = 0; i < munSelect.options.length; i++) {
                    if (munSelect.options[i].value === p.municipality) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = p.municipality;
                    opt.textContent = p.municipality;
                    munSelect.appendChild(opt);
                }
                munSelect.value = p.municipality;
            }

            if(document.getElementById('presentation-date-solicitacao')) document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
            if(document.getElementById('presentation-requester')) document.getElementById('presentation-requester').value = p.requester;
            if(document.getElementById('presentation-status')) document.getElementById('presentation-status').value = p.status;
            if(document.getElementById('presentation-description')) document.getElementById('presentation-description').value = p.description;
            if(document.getElementById('presentation-date-realizacao')) document.getElementById('presentation-date-realizacao').value = p.dateRealizacao || '';
            
            // Marca os checkboxes
            if (p.orientadores) {
                document.querySelectorAll('.orientador-check').forEach(cb => {
                    cb.checked = p.orientadores.includes(cb.value);
                });
            }
            if (p.forms) {
                document.querySelectorAll('.forma-check').forEach(cb => {
                    cb.checked = p.forms.includes(cb.value);
                });
            }
            
            if(typeof handlePresentationStatusChange === 'function') handlePresentationStatusChange();
        }
    } else {
        if(typeof handlePresentationStatusChange === 'function') handlePresentationStatusChange();
    }
    
    document.getElementById('presentation-modal').classList.add('show');
}

// Função Salvar: Validação Rigorosa
function savePresentation(e) {
    e.preventDefault();
    const status = document.getElementById('presentation-status').value;
    
    // Captura os valores para validar
    const orientadoresSel = Array.from(document.querySelectorAll('.orientador-check:checked')).map(c => c.value);
    const formasSel = Array.from(document.querySelectorAll('.forma-check:checked')).map(c => c.value);
    const dateReal = document.getElementById('presentation-date-realizacao').value;
    const desc = document.getElementById('presentation-description').value.trim();

    // --- REGRAS DE VALIDAÇÃO ---
    
    if (status === 'Realizada') {
        if (!dateReal) {
            alert('Para status "Realizada", a Data de Realização é obrigatória.');
            return;
        }
        if (orientadoresSel.length === 0) {
            alert('Para status "Realizada", selecione ao menos um Orientador.');
            return;
        }
        if (formasSel.length === 0) {
            alert('Para status "Realizada", selecione ao menos uma Forma de Apresentação.');
            return;
        }
    } 
    else if (status === 'Pendente') {
        if (orientadoresSel.length === 0) {
            alert('Para status "Pendente", selecione ao menos um Orientador.');
            return;
        }
    } 
    else if (status === 'Cancelada') {
        if (desc === '') {
            alert('Para status "Cancelada", a Descrição/Justificativa é obrigatória.');
            return;
        }
    }

    // Se passou nas validações, monta o objeto
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

    if (editingId) {
        const i = presentations.findIndex(function(x) { return x.id === editingId; });
        presentations[i] = { ...presentations[i], ...data };
    } else {
        presentations.push({ id: getNextId('pres'), ...data });
    }
    
    salvarNoArmazenamento('presentations', presentations);
    document.getElementById('presentation-modal').classList.remove('show');
    
    // Limpa filtros para garantir que o novo item apareça se for compatível, ou renderiza direto
    clearPresentationFilters(); 
    
    showToast('Apresentação salva com sucesso!', 'success');
}
function getFilteredPresentations() {
    const fMun = document.getElementById('filter-presentation-municipality')?.value;
    const fStatus = document.getElementById('filter-presentation-status')?.value;
    const fReq = document.getElementById('filter-presentation-requester')?.value.toLowerCase();
    const fOrient = document.getElementById('filter-presentation-orientador')?.value;
    
    // Datas
    const fSolStart = document.getElementById('filter-presentation-sol-start')?.value;
    const fSolEnd = document.getElementById('filter-presentation-sol-end')?.value;
    const fRealStart = document.getElementById('filter-presentation-real-start')?.value;
    const fRealEnd = document.getElementById('filter-presentation-real-end')?.value;

    let filtered = presentations.filter(function(p) {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fReq && !p.requester.toLowerCase().includes(fReq)) return false;
        if (fOrient && (!p.orientadores || !p.orientadores.includes(fOrient))) return false;
        
        // Data Solicitação
        if (fSolStart && p.dateSolicitacao < fSolStart) return false;
        if (fSolEnd && p.dateSolicitacao > fSolEnd) return false;

        // Data Realização
        if (fRealStart && (!p.dateRealizacao || p.dateRealizacao < fRealStart)) return false;
        if (fRealEnd && (!p.dateRealizacao || p.dateRealizacao > fRealEnd)) return false;

        return true;
    });

    return filtered.sort((a,b) => new Date(a.dateSolicitacao) - new Date(b.dateSolicitacao));
}

function renderPresentations() {
    const filtered = getFilteredPresentations();
    const c = document.getElementById('presentations-table');
    
    if(document.getElementById('presentations-results-count')) {
        document.getElementById('presentations-results-count').innerHTML = '<strong>' + filtered.length + '</strong> apresentações encontradas';
        document.getElementById('presentations-results-count').style.display = 'block';
    }

    if(document.getElementById('total-presentations')) document.getElementById('total-presentations').textContent = presentations.length;
    if(document.getElementById('pending-presentations')) document.getElementById('pending-presentations').textContent = filtered.filter(p => p.status === 'Pendente').length;
    if(document.getElementById('completed-presentations')) document.getElementById('completed-presentations').textContent = filtered.filter(p => p.status === 'Realizada').length;
    if(document.getElementById('cancelled-presentations')) document.getElementById('cancelled-presentations').textContent = filtered.filter(p => p.status === 'Cancelada').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma apresentação encontrada.</div>';
    } else {
        const rows = filtered.map(function(p) {
            const desc = p.description ? (p.description.length > 30 ? `<span title="${p.description}">${p.description.substring(0,30)}...</span>` : p.description) : '-';
            
            let statusClass = 'task-status';
            if (p.status === 'Realizada') statusClass += ' completed';
            else if (p.status === 'Cancelada') statusClass += ' cancelled';
            else statusClass += ' pending';

            const statusBadge = `<span class="${statusClass}">${p.status}</span>`;
            const orientadoresStr = (Array.isArray(p.orientadores) && p.orientadores.length > 0) ? p.orientadores.join(', ') : '-';
            const formasStr = (Array.isArray(p.forms) && p.forms.length > 0) ? p.forms.join(', ') : '-';

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${p.municipality}</td> <td style="text-align:center;">${formatDate(p.dateSolicitacao)}</td>
                <td>${p.requester}</td>
                <td>${orientadoresStr}</td>
                <td>${formasStr}</td>
                <td style="font-size:12px; color:#555;">${desc}</td>
                <td style="text-align:center;">${formatDate(p.dateRealizacao)}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td>
                    <button class="btn btn--sm" onclick="showPresentationModal(${p.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deletePresentation(${p.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Município</th>
                <th style="text-align:center;">Data<br>Solicitação</th>
                <th>Solicitante(s) da<br>Apresentação</th>
                <th>Orientador(es)</th>
                <th>Forma(s) de<br>Apresentação</th>
                <th>Descrição/<br>Detalhes</th>
                <th style="text-align:center;">Data<br>Realização</th>
                <th style="text-align:center;">Status</th>
                <th>Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    updatePresentationCharts(filtered);
}

function updatePresentationCharts(data) {
    // 1. Status
    if (document.getElementById('presentationStatusChart') && window.Chart) {
        if (chartStatusPres) chartStatusPres.destroy();
        chartStatusPres = new Chart(document.getElementById('presentationStatusChart'), {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Realizada', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(p => p.status==='Pendente').length,
                        data.filter(p => p.status==='Realizada').length,
                        data.filter(p => p.status==='Cancelada').length
                    ],
                    backgroundColor: ['#E68161', '#005580', '#C85250']
                }]
            }
        });
    }

    // 2. Municípios (Colorido)
    if (document.getElementById('presentationMunicipalityChart') && window.Chart) {
        if (chartMunPres) chartMunPres.destroy();
        const mC = {}; 
        data.forEach(p => { mC[p.municipality] = (mC[p.municipality]||0)+1; });
        const labels = Object.keys(mC);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        chartMunPres = new Chart(document.getElementById('presentationMunicipalityChart'), {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Qtd', 
                    data: Object.values(mC), 
                    backgroundColor: colors 
                }] 
            }
        });
    }

    // 3. Orientadores (Colorido)
    if (document.getElementById('presentationOrientadorChart') && window.Chart) {
        if (chartOrientPres) chartOrientPres.destroy();
        const oC = {}; 
        data.forEach(p => { 
            if(p.orientadores) {
                p.orientadores.forEach(o => { oC[o] = (oC[o]||0)+1; });
            }
        });
        const oLabels = Object.keys(oC);
        const oColors = oLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        chartOrientPres = new Chart(document.getElementById('presentationOrientadorChart'), {
            type: 'bar',
            data: { 
                labels: oLabels, 
                datasets: [{ 
                    label: 'Qtd', 
                    data: Object.values(oC), 
                    backgroundColor: oColors 
                }] 
            }
        });
    }
}

function exportPresentationsCSV() {
    const data = getFilteredPresentations();
    const headers = ['Município', 'Data', 'Solicitante', 'Status', 'Orientadores', 'Formas', 'Descrição'];
    const rows = data.map(function(p) { return [p.municipality, formatDate(p.dateSolicitacao), p.requester, p.status, p.orientadores, p.forms, p.description]; });
    downloadCSV('apresentacoes.csv', headers, rows);
}

function generatePresentationsPDF() {
    const data = getFilteredPresentations();
    const headers = ['Município', 'Data', 'Solicitante', 'Status', 'Orientadores'];
    const rows = data.map(function(p) { return [p.municipality, formatDate(p.dateSolicitacao), p.requester, p.status, p.orientadores]; });
    downloadPDF('Relatório Apresentações', headers, rows);
}

function deletePresentation(id) {
    if (confirm('Excluir?')) {
        presentations = presentations.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('presentations', presentations);
        renderPresentations();
    }
}

function closePresentationModal() {
    document.getElementById('presentation-modal').classList.remove('show');
}

function clearPresentationFilters() {
    const ids = [
        'filter-presentation-municipality', 'filter-presentation-status', 
        'filter-presentation-requester', 'filter-presentation-orientador',
        'filter-presentation-sol-start', 'filter-presentation-sol-end',
        'filter-presentation-real-start', 'filter-presentation-real-end'
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderPresentations();
}

// ----------------------------------------------------------------------------
// 15. DEMANDAS (Item 5)
// ----------------------------------------------------------------------------
// Função Visual: Controla campos e obrigatoriedade
function handleDemandStatusChange() {
    const status = document.getElementById('demand-status').value;
    const grpReal = document.getElementById('demand-realization-date-group');
    const grpJust = document.getElementById('demand-justification-group');
    const lblReal = document.getElementById('demand-realization-label');
    const lblJust = document.getElementById('demand-justification-label');

    // Reset
    grpReal.style.display = 'none';
    grpJust.style.display = 'none';
    if(lblReal) lblReal.textContent = 'Data de Realização';
    if(lblJust) lblJust.textContent = 'Justificativa Inviabilidade';

    if (status === 'Realizada') {
        grpReal.style.display = 'block';
        if(lblReal) lblReal.textContent += '*'; // Obrigatório
    } else if (status === 'Inviável') {
        grpJust.style.display = 'block';
        if(lblJust) lblJust.textContent += '*'; // Obrigatório
    }
    // Pendente não mostra nada extra
}

function showDemandModal(id = null) {
    editingId = id;
    document.getElementById('demand-form').reset();
    // Garante que o evento dispare ao abrir
    if(typeof handleDemandStatusChange === 'function') handleDemandStatusChange();

    if (id) {
        const d = demands.find(function(x) { return x.id === id; });
        if(d) {
            document.getElementById('demand-date').value = d.date;
            document.getElementById('demand-description').value = d.description;
            document.getElementById('demand-priority').value = d.priority;
            document.getElementById('demand-status').value = d.status;
            
            // Preenche e exibe campos condicionais
            if(document.getElementById('demand-realization-date')) document.getElementById('demand-realization-date').value = d.dateRealization || '';
            if(document.getElementById('demand-justification')) document.getElementById('demand-justification').value = d.justification || '';
            
            handleDemandStatusChange(); // Atualiza visibilidade
        }
    }
    document.getElementById('demand-modal').classList.add('show');
}

function saveDemand(e) {
    e.preventDefault();
    const status = document.getElementById('demand-status').value;
    const dateReal = document.getElementById('demand-realization-date').value;
    const justif = document.getElementById('demand-justification').value.trim();

    // Validação Específica
    if (status === 'Realizada' && !dateReal) {
        alert('Para status "Realizada", a Data de Realização é obrigatória.'); return;
    }
    if (status === 'Inviável' && !justif) {
        alert('Para status "Inviável", a Justificativa é obrigatória.'); return;
    }
    
    const data = {
        date: document.getElementById('demand-date').value,
        description: document.getElementById('demand-description').value,
        priority: document.getElementById('demand-priority').value,
        status: status,
        dateRealization: dateReal,
        justification: justif,
        user: currentUser.name // Usa o usuário logado
    };

    if (editingId) {
        const i = demands.findIndex(function(x) { return x.id === editingId; });
        if (i !== -1) demands[i] = { ...demands[i], ...data };
    } else {
        demands.push({ id: getNextId('dem'), ...data });
    }
    salvarNoArmazenamento('demands', demands);
    document.getElementById('demand-modal').classList.remove('show');
    clearDemandFilters();
    showToast('Demanda salva com sucesso!', 'success');
}

function getFilteredDemands() {
    const fStatus = document.getElementById('filter-demand-status')?.value;
    const fPrio = document.getElementById('filter-demand-priority')?.value;
    const fUser = document.getElementById('filter-demand-user')?.value; // Agora Select
    
    // Datas
    const fSolStart = document.getElementById('filter-demand-sol-start')?.value;
    const fSolEnd = document.getElementById('filter-demand-sol-end')?.value;
    const fRealStart = document.getElementById('filter-demand-real-start')?.value;
    const fRealEnd = document.getElementById('filter-demand-real-end')?.value;

    let filtered = demands.filter(function(d) {
        if (fStatus && d.status !== fStatus) return false;
        if (fPrio && d.priority !== fPrio) return false;
        
        // Usuário (Select)
        if (fUser && d.user !== fUser) return false;

        // Data Solicitação
        if (fSolStart && d.date < fSolStart) return false;
        if (fSolEnd && d.date > fSolEnd) return false;

        // Data Realização
        if (fRealStart && (!d.dateRealization || d.dateRealization < fRealStart)) return false;
        if (fRealEnd && (!d.dateRealization || d.dateRealization > fRealEnd)) return false;

        return true;
    });

    const prioMap = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    return filtered.sort(function(a, b) {
        if (prioMap[a.priority] !== prioMap[b.priority]) return prioMap[a.priority] - prioMap[b.priority];
        return new Date(a.date) - new Date(b.date);
    });
}

function renderDemands() {
    const filtered = getFilteredDemands();
    const c = document.getElementById('demands-table');
    
    if(document.getElementById('demands-results-count')) {
        document.getElementById('demands-results-count').innerHTML = '<strong>' + filtered.length + '</strong> demandas encontradas';
        document.getElementById('demands-results-count').style.display = 'block';
    }
    if(document.getElementById('total-demands')) document.getElementById('total-demands').textContent = demands.length;
    if(document.getElementById('pending-demands')) document.getElementById('pending-demands').textContent = filtered.filter(d => d.status === 'Pendente').length;
    if(document.getElementById('completed-demands')) document.getElementById('completed-demands').textContent = filtered.filter(d => d.status === 'Realizada').length;
    if(document.getElementById('unfeasible-demands')) document.getElementById('unfeasible-demands').textContent = filtered.filter(d => d.status === 'Inviável').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma demanda encontrada.</div>';
    } else {
        const rows = filtered.map(function(d) {
            let statusClass = 'task-status';
            if (d.status === 'Realizada') statusClass += ' completed';
            else if (d.status === 'Inviável') statusClass += ' cancelled';
            else statusClass += ' pending';

            const statusBadge = `<span class="${statusClass}">${d.status}</span>`;

            let prioColor = 'inherit';
            if (d.priority === 'Alta') prioColor = '#C85250';
            if (d.priority === 'Média') prioColor = '#E68161';
            if (d.priority === 'Baixa') prioColor = '#79C2A9';

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${d.user || '-'}</td> <td style="text-align:center;">${formatDate(d.date)}</td>
                <td>${d.description}</td>
                <td style="color:${prioColor}; font-weight:bold;">${d.priority}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td style="text-align:center;">${formatDate(d.dateRealization)}</td>
                <td>${d.justification || '-'}</td>
                <td>
                    <button class="btn btn--sm" onclick="showDemandModal(${d.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteDemand(${d.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Usuário da Demanda</th>
                <th style="text-align:center;">Data Solicitação</th>
                <th>Descrição da Demanda</th>
                <th>Prioridade</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Data Realização</th>
                <th>Justificativa de Inviabilidade</th>
                <th>Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    updateDemandCharts(filtered);
}

function updateDemandCharts(data) {
    // 1. Status (Cores Específicas)
    if (document.getElementById('demandStatusChart') && window.Chart) {
        if (chartStatusDem) chartStatusDem.destroy();
        chartStatusDem = new Chart(document.getElementById('demandStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Inviável'], 
                datasets: [{ 
                    data: [
                        data.filter(d => d.status==='Pendente').length, 
                        data.filter(d => d.status==='Realizada').length, 
                        data.filter(d => d.status==='Inviável').length
                    ], 
                    backgroundColor: ['#E68161', '#005580', '#C85250'] // Laranja, Azul, Vermelho
                }] 
            }
        });
    }

    // 2. Prioridade (Cores Específicas)
    if (document.getElementById('demandPriorityChart') && window.Chart) {
        if (chartPrioDem) chartPrioDem.destroy();
        const pCounts = { 'Alta':0, 'Média':0, 'Baixa':0 };
        data.forEach(d => { pCounts[d.priority] = (pCounts[d.priority]||0)+1; });
        
        chartPrioDem = new Chart(document.getElementById('demandPriorityChart'), {
            type: 'bar',
            data: { 
                labels: Object.keys(pCounts), 
                datasets: [{ 
                    label: 'Qtd', 
                    data: Object.values(pCounts), 
                    backgroundColor: ['#C85250', '#E68161', '#79C2A9'] // Vermelho, Laranja, Verde
                }] 
            }
        });
    }

    // 3. Usuário (Colorido Dinâmico)
    if (document.getElementById('demandUserChart') && window.Chart) {
        if (chartUserDem) chartUserDem.destroy();
        const uCounts = {};
        data.forEach(d => { uCounts[d.user] = (uCounts[d.user]||0)+1; });
        
        const labels = Object.keys(uCounts);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        chartUserDem = new Chart(document.getElementById('demandUserChart'), {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Qtd', 
                    data: Object.values(uCounts), 
                    backgroundColor: colors 
                }] 
            }
        });
    }
}

function exportDemandsCSV() {
    const data = getFilteredDemands();
    const headers = ['Data', 'Prioridade', 'Status', 'Descrição', 'Usuário', 'Realização'];
    const rows = data.map(function(d) { 
        return [formatDate(d.date), d.priority, d.status, d.description, d.user, formatDate(d.dateRealization)]; 
    });
    downloadCSV('demandas.csv', headers, rows);
}

function generateDemandsPDF() {
    const data = getFilteredDemands();
    const headers = ['Data', 'Prioridade', 'Status', 'Descrição'];
    const rows = data.map(function(d) { 
        return [formatDate(d.date), d.priority, d.status, d.description]; 
    });
    downloadPDF('Relatório Demandas', headers, rows);
}

function deleteDemand(id) {
    if (confirm('Excluir?')) {
        demands = demands.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('demands', demands);
        renderDemands();
    }
}

function closeDemandModal() {
    document.getElementById('demand-modal').classList.remove('show');
}

function clearDemandFilters() {
    const ids = [
        'filter-demand-status', 'filter-demand-priority', 'filter-demand-user',
        'filter-demand-sol-start', 'filter-demand-sol-end',
        'filter-demand-real-start', 'filter-demand-real-end'
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderDemands();
}

// ----------------------------------------------------------------------------
// 16. VISITAS (Item 6)
// ----------------------------------------------------------------------------
function handleVisitStatusChange() {
    const status = document.getElementById('visit-status').value;
    const grpReal = document.getElementById('group-visit-date-realization');
    const grpJust = document.getElementById('group-visit-justification');
    if (grpReal) grpReal.style.display = (status === 'Realizada') ? 'block' : 'none';
    if (grpJust) grpJust.style.display = (status === 'Cancelada') ? 'block' : 'none';
}

function showVisitModal(id = null) {
    editingId = id;
    document.getElementById('visit-form').reset();
    
    // Popula dropdown
    const munSelect = document.getElementById('visit-municipality');
    populateSelect(munSelect, municipalitiesList, 'name', 'name');

    // Ativa os listeners de status
    if(typeof handleVisitStatusChange === 'function') {
        const statusSel = document.getElementById('visit-status');
        statusSel.onchange = handleVisitStatusChange;
    }

    if (id) {
        const v = visits.find(x => x.id === id);
        if(v) {
            // --- CORREÇÃO: Cria opção se não existir ---
            let exists = false;
            for (let i = 0; i < munSelect.options.length; i++) {
                if (munSelect.options[i].value === v.municipality) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = v.municipality;
                opt.textContent = v.municipality;
                munSelect.appendChild(opt);
            }
            munSelect.value = v.municipality;
            // -------------------------------------------

            document.getElementById('visit-date').value = v.date;
            document.getElementById('visit-applicant').value = v.applicant;
            document.getElementById('visit-status').value = v.status;
            
            if(document.getElementById('visit-reason')) document.getElementById('visit-reason').value = v.reason || '';
            if(document.getElementById('visit-visit-date')) document.getElementById('visit-visit-date').value = v.dateRealization || '';
            if(document.getElementById('visit-cancel-justification')) document.getElementById('visit-cancel-justification').value = v.justification || '';
            
            if(typeof handleVisitStatusChange === 'function') handleVisitStatusChange();
        }
    } else {
        if(typeof handleVisitStatusChange === 'function') handleVisitStatusChange();
    }
    document.getElementById('visit-modal').classList.add('show');
}

function saveVisit(e) {
    e.preventDefault();
    const status = document.getElementById('visit-status').value;
    
    if (status === 'Realizada' && !document.getElementById('visit-date-realization').value) {
        alert('Data de Realização é obrigatória.'); return;
    }
    if (status === 'Cancelada' && !document.getElementById('visit-justification').value) {
        alert('Justificativa é obrigatória.'); return;
    }

    const data = {
        municipality: document.getElementById('visit-municipality').value,
        date: document.getElementById('visit-date').value,
        applicant: document.getElementById('visit-applicant').value,
        status: status,
        dateRealization: document.getElementById('visit-date-realization').value,
        justification: document.getElementById('visit-justification').value
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

function getFilteredVisits() {
    const fMun = document.getElementById('filter-visit-municipality')?.value;
    const fStatus = document.getElementById('filter-visit-status')?.value;
    const fApp = document.getElementById('filter-visit-applicant')?.value.toLowerCase();
    
    // Datas Separadas
    const fSolStart = document.getElementById('filter-visit-sol-start')?.value;
    const fSolEnd = document.getElementById('filter-visit-sol-end')?.value;
    const fRealStart = document.getElementById('filter-visit-real-start')?.value;
    const fRealEnd = document.getElementById('filter-visit-real-end')?.value;

    let filtered = visits.filter(function(v) {
        if (fMun && v.municipality !== fMun) return false;
        if (fStatus && v.status !== fStatus) return false;
        if (fApp && !v.applicant.toLowerCase().includes(fApp)) return false;
        
        // Data Solicitação
        if (fSolStart && v.date < fSolStart) return false;
        if (fSolEnd && v.date > fSolEnd) return false;

        // Data Realização (Visita)
        if (fRealStart && (!v.dateRealization || v.dateRealization < fRealStart)) return false;
        if (fRealEnd && (!v.dateRealization || v.dateRealization > fRealEnd)) return false;

        return true;
    });

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderVisits() {
    const filtered = getFilteredVisits();
    const c = document.getElementById('visits-table');
    
    if(document.getElementById('visits-results-count')) {
        document.getElementById('visits-results-count').innerHTML = '<strong>' + filtered.length + '</strong> visitas encontradas';
        document.getElementById('visits-results-count').style.display = 'block';
    }

    if(document.getElementById('total-visits')) document.getElementById('total-visits').textContent = visits.length;
    if(document.getElementById('pending-visits')) document.getElementById('pending-visits').textContent = filtered.filter(v => v.status === 'Pendente').length;
    if(document.getElementById('completed-visits')) document.getElementById('completed-visits').textContent = filtered.filter(v => v.status === 'Realizada').length;
    if(document.getElementById('cancelled-visits')) document.getElementById('cancelled-visits').textContent = filtered.filter(v => v.status === 'Cancelada').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma visita encontrada.</div>';
    } else {
        const rows = filtered.map(function(v) {
            let statusClass = 'task-status';
            if (v.status === 'Realizada') statusClass += ' completed';
            else if (v.status === 'Cancelada') statusClass += ' cancelled';
            else statusClass += ' pending';

            const statusBadge = `<span class="${statusClass}">${v.status}</span>`;
            const motivo = v.reason ? (v.reason.length > 40 ? `<span title="${v.reason}">${v.reason.substring(0,40)}...</span>` : v.reason) : '-';
            const justif = v.justification ? (v.justification.length > 30 ? `<span title="${v.justification}">${v.justification.substring(0,30)}...</span>` : v.justification) : '-';

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${v.municipality}</td> <td style="text-align:center;">${formatDate(v.date)}</td>
                <td>${v.applicant}</td>
                <td style="font-size:12px;">${motivo}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td style="text-align:center;">${formatDate(v.dateRealization)}</td>
                <td style="font-size:12px; color:#555;">${justif}</td>
                <td style="text-align:center;">
                    <button class="btn btn--sm" onclick="showVisitModal(${v.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteVisit(${v.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Município</th>
                <th style="text-align:center;">Data<br>Solicitação</th>
                <th>Solicitante da Visita</th>
                <th>Motivo da Visita</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Data<br>Realização</th>
                <th>Justificativa de<br>Cancelamento</th>
                <th style="text-align:center; width:90px;">Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    updateVisitCharts(filtered);
}

function updateVisitCharts(data) {
    // 1. Status (Cores Corretas)
    if (document.getElementById('visitStatusChart') && window.Chart) {
        if (chartStatusVis) chartStatusVis.destroy();
        chartStatusVis = new Chart(document.getElementById('visitStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Cancelada'], 
                datasets: [{ 
                    data: [
                        data.filter(v => v.status==='Pendente').length, 
                        data.filter(v => v.status==='Realizada').length, 
                        data.filter(v => v.status==='Cancelada').length
                    ], 
                    backgroundColor: ['#E68161', '#005580', '#C85250'] // Laranja, Azul, Vermelho
                }] 
            }
        });
    }

    // 2. Municípios (Expandido e Colorido)
    if (document.getElementById('visitMunicipalityChart') && window.Chart) {
        if (chartMunVis) chartMunVis.destroy();
        const mCounts = {};
        data.forEach(v => { mCounts[v.municipality] = (mCounts[v.municipality]||0)+1; });
        
        const labels = Object.keys(mCounts);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        chartMunVis = new Chart(document.getElementById('visitMunicipalityChart'), {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Qtd Visitas', 
                    data: Object.values(mCounts), 
                    backgroundColor: colors 
                }] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { display: false } } // Oculta labels no eixo X para limpeza
                }
            }
        });
    }

    // 3. Gráfico de Solicitante REMOVIDO (Limpeza)
    if (chartSolVis) {
        chartSolVis.destroy();
        chartSolVis = null;
    }
}

function exportVisitsCSV() {
    const data = getFilteredVisits();
    const headers = ['Município', 'Data', 'Solicitante', 'Status', 'Motivo'];
    const rows = data.map(function(v) { return [v.municipality, formatDate(v.date), v.applicant, v.status, v.reason]; });
    downloadCSV('visitas.csv', headers, rows);
}

function generateVisitsPDF() {
    const data = getFilteredVisits();
    const headers = ['Município', 'Data', 'Solicitante', 'Status'];
    const rows = data.map(function(v) { return [v.municipality, formatDate(v.date), v.applicant, v.status]; });
    downloadPDF('Relatório Visitas', headers, rows);
}

function deleteVisit(id) {
    if (confirm('Excluir?')) {
        visits = visits.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('visits', visits);
        renderVisits();
    }
}

function closeVisitModal() {
    document.getElementById('visit-modal').classList.remove('show');
}

function clearVisitFilters() {
    const ids = [
        'filter-visit-municipality', 'filter-visit-status', 'filter-visit-applicant',
        'filter-visit-sol-start', 'filter-visit-sol-end',
        'filter-visit-real-start', 'filter-visit-real-end'
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderVisits();
}

// ----------------------------------------------------------------------------
// 17. PRODUÇÃO (Item 7)
// ----------------------------------------------------------------------------
function showProductionModal(id = null) {
    editingId = id;
    document.getElementById('production-form').reset();
    
    // 1. Popula dropdown com Lista Mestra
    const munSelect = document.getElementById('production-municipality');
    populateSelect(munSelect, municipalitiesList, 'name', 'name');
    
    // Garante estado inicial do campo Período
    handleProductionFrequencyChange();

    if (id) {
        const p = productions.find(x => x.id === id);
        if(p) {
            // Cria opção se não existir
            let exists = false;
            for (let i = 0; i < munSelect.options.length; i++) {
                if (munSelect.options[i].value === p.municipality) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = p.municipality;
                opt.textContent = p.municipality;
                munSelect.appendChild(opt);
            }
            munSelect.value = p.municipality;

            document.getElementById('production-frequency').value = p.frequency;
            document.getElementById('production-competence').value = p.competence;
            document.getElementById('production-period').value = p.period;
            document.getElementById('production-release-date').value = p.releaseDate;
            document.getElementById('production-status').value = p.status;
            document.getElementById('production-professional').value = p.professional || '';
            document.getElementById('production-contact').value = p.contact || '';
            document.getElementById('production-observations').value = p.observations || '';
            
            if(document.getElementById('production-send-date')) document.getElementById('production-send-date').value = p.sendDate || '';
            
            handleProductionFrequencyChange(); // Atualiza visibilidade
        }
    }
    document.getElementById('production-modal').classList.add('show');
}

function saveProduction(e) {
    e.preventDefault();
    const freq = document.getElementById('production-frequency').value;
    
    // Se diário, período é vazio. Senão, pega o valor.
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

    if (editingId) {
        const i = productions.findIndex(function(x) { return x.id === editingId; });
        if (i !== -1) productions[i] = { ...productions[i], ...data };
    } else {
        productions.push({ id: getNextId('prod'), ...data });
    }
    salvarNoArmazenamento('productions', productions);
    document.getElementById('production-modal').classList.remove('show');
    clearProductionFilters();
    showToast('Envio salvo com sucesso!', 'success');
}

function getFilteredProductions() {
    const fMun = document.getElementById('filter-production-municipality')?.value;
    const fStatus = document.getElementById('filter-production-status')?.value;
    const fProf = document.getElementById('filter-production-professional')?.value.toLowerCase();
    const fFreq = document.getElementById('filter-production-frequency')?.value;
    
    // Datas Liberação
    const fRelStart = document.getElementById('filter-production-release-start')?.value;
    const fRelEnd = document.getElementById('filter-production-release-end')?.value;
    // Datas Envio
    const fSendStart = document.getElementById('filter-production-send-start')?.value;
    const fSendEnd = document.getElementById('filter-production-send-end')?.value;
    
    let filtered = productions.filter(function(p) {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fProf && p.professional && !p.professional.toLowerCase().includes(fProf)) return false;
        if (fFreq && p.frequency !== fFreq) return false;

        // Liberação
        if (fRelStart && p.releaseDate < fRelStart) return false;
        if (fRelEnd && p.releaseDate > fRelEnd) return false;

        // Envio
        if (fSendStart && (!p.sendDate || p.sendDate < fSendStart)) return false;
        if (fSendEnd && (!p.sendDate || p.sendDate > fSendEnd)) return false;

        return true;
    });

    // Ordenar por Data Liberação
    return filtered.sort((a,b) => new Date(a.releaseDate) - new Date(b.releaseDate));
}

function renderProductions() {
    const filtered = getFilteredProductions();
    const c = document.getElementById('productions-table');
    
    if(document.getElementById('productions-results-count')) {
        document.getElementById('productions-results-count').innerHTML = '<strong>' + filtered.length + '</strong> envios encontrados';
        document.getElementById('productions-results-count').style.display = 'block';
    }
    if(document.getElementById('total-productions')) document.getElementById('total-productions').textContent = productions.length;
    if(document.getElementById('sent-productions')) document.getElementById('sent-productions').textContent = filtered.filter(p => p.status === 'Enviada').length;
    if(document.getElementById('pending-productions')) document.getElementById('pending-productions').textContent = filtered.filter(p => p.status === 'Pendente').length;
    if(document.getElementById('cancelled-productions')) document.getElementById('cancelled-productions').textContent = filtered.filter(p => p.status === 'Cancelada').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum envio encontrado.</div>';
    } else {
        const rows = filtered.map(function(p) {
            let statusClass = 'task-status';
            if (p.status === 'Enviada') statusClass += ' completed';
            else if (p.status === 'Cancelada') statusClass += ' cancelled';
            else statusClass += ' pending';
            const statusBadge = `<span class="${statusClass}">${p.status}</span>`;

            let freqColor = '#003d5c';
            if (p.frequency === 'Diário') freqColor = '#C85250';
            else if (p.frequency === 'Semanal') freqColor = '#E68161';
            else if (p.frequency === 'Quinzenal') freqColor = '#79C2A9';
            else if (p.frequency === 'Mensal') freqColor = '#005580';
            
            const freqBadge = `<span style="color:${freqColor}; font-weight:bold;">${p.frequency}</span>`;

            return `<tr>
                <td style="font-weight:bold; color:#000000;">${p.municipality}</td> <td>${p.professional || '-'}</td>
                <td>${freqBadge}</td>
                <td>${p.competence}</td>
                <td>${p.frequency === 'Diário' ? '-' : (p.period || '-')}</td>
                <td style="text-align:center;">${formatDate(p.releaseDate)}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td style="text-align:center;">${formatDate(p.sendDate)}</td>
                <td style="font-size:12px; color:#555;">${p.observations || '-'}</td>
                <td style="text-align:center;">
                    <button class="btn btn--sm" onclick="showProductionModal(${p.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteProduction(${p.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table class="compact-table">
            <thead>
                <th>Município</th>
                <th>Profissional<br>Informado</th>
                <th>Frequência<br>de Envio</th>
                <th>Competência<br>de Envio</th>
                <th>Período<br>do Envio</th>
                <th style="text-align:center;">Data<br>Liberação</th>
                <th style="text-align:center;">Status<br>de Envio</th>
                <th style="text-align:center;">Data<br>de Envio</th>
                <th>Observações</th>
                <th style="text-align:center;">Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    updateProductionCharts(filtered);
}

function updateProductionCharts(data) {
    // 1. Status (Cores: Azul, Laranja, Vermelho)
    if (document.getElementById('productionStatusChart') && window.Chart) {
        if (chartStatusProd) chartStatusProd.destroy();
        chartStatusProd = new Chart(document.getElementById('productionStatusChart'), {
            type: 'pie',
            data: {
                labels: ['Enviada', 'Pendente', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(p => p.status==='Enviada').length, 
                        data.filter(p => p.status==='Pendente').length, 
                        data.filter(p => p.status==='Cancelada').length
                    ],
                    backgroundColor: ['#005580', '#E68161', '#C85250'] // Azul, Laranja, Vermelho
                }]
            }
        });
    }

    // 2. Frequência (Cores: Vermelho, Laranja, Verde, Azul)
    if (document.getElementById('productionFrequencyChart') && window.Chart) {
        if (chartFreqProd) chartFreqProd.destroy();
        
        // Ordem fixa para manter as cores alinhadas
        const freqs = ['Diário', 'Semanal', 'Quinzenal', 'Mensal'];
        const counts = freqs.map(f => data.filter(p => p.frequency === f).length);
        
        chartFreqProd = new Chart(document.getElementById('productionFrequencyChart'), {
            type: 'bar',
            data: { 
                labels: freqs, 
                datasets: [{ 
                    label: 'Qtd Envios', 
                    data: counts, 
                    backgroundColor: ['#C85250', '#E68161', '#79C2A9', '#005580'] 
                }] 
            }
        });
    }
}
function exportProductionsCSV() {
    const data = getFilteredProductions();
    const headers = ['Município', 'Competência', 'Período', 'Status'];
    const rows = data.map(function(p) { return [p.municipality, p.competence, p.period, p.status]; });
    downloadCSV('producao.csv', headers, rows);
}

function generateProductionsPDF() {
    const data = getFilteredProductions();
    const headers = ['Município', 'Comp.', 'Período', 'Status'];
    const rows = data.map(function(p) { return [p.municipality, p.competence, p.period, p.status]; });
    downloadPDF('Relatório Produção', headers, rows);
}

function deleteProduction(id) {
    if (confirm('Excluir?')) {
        productions = productions.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('productions', productions);
        renderProductions();
    }
}

function closeProductionModal() {
    document.getElementById('production-modal').classList.remove('show');
}

function clearProductionFilters() {
    const ids = [
        'filter-production-municipality', 'filter-production-status', 
        'filter-production-professional', 'filter-production-frequency',
        'filter-production-release-start', 'filter-production-release-end',
        'filter-production-send-start', 'filter-production-send-end'
    ];
    ids.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderProductions();
}
// Função Visual: Controla campos, obrigatoriedade e ASTERISCOS (*)
function handleProductionFrequencyChange() {
    const freq = document.getElementById('production-frequency').value;
    const grpPeriod = document.getElementById('production-period-group');
    
    // Inputs
    const inPeriod = document.getElementById('production-period');
    const inComp = document.getElementById('production-competence');
    const inRel = document.getElementById('production-release-date');
    const inStat = document.getElementById('production-status');
    const inCont = document.getElementById('production-contact');

    // Labels (Rótulos de Texto)
    const lblPeriod = document.getElementById('lbl-prod-period');
    const lblComp = document.getElementById('lbl-prod-competence');
    const lblRel = document.getElementById('lbl-prod-release');
    const lblStat = document.getElementById('lbl-prod-status');
    const lblCont = document.getElementById('lbl-prod-contact');

    // Garante que o grupo do Período esteja sempre visível
    if (grpPeriod) grpPeriod.style.display = 'block';

    if (freq === 'Diário') {
        // --- MODO DIÁRIO: Remove obrigatoriedade e asteriscos ---
        
        // Remove required
        if(inPeriod) inPeriod.required = false;
        if(inComp) inComp.required = false;
        if(inRel) inRel.required = false;
        if(inStat) inStat.required = false;
        if(inCont) inCont.required = false;

        // Remove asterisco visual (*)
        if(lblPeriod) lblPeriod.textContent = 'Período (Data Inicial à Data Final)';
        if(lblComp) lblComp.textContent = 'Competência (mês/ano)';
        if(lblRel) lblRel.textContent = 'Data de Liberação';
        if(lblStat) lblStat.textContent = 'Status de Envio';
        if(lblCont) lblCont.textContent = 'Contato';

    } else {
        // --- OUTROS MODOS: Adiciona obrigatoriedade e asteriscos ---

        // Adiciona required
        if(inPeriod) inPeriod.required = true;
        if(inComp) inComp.required = true;
        if(inRel) inRel.required = true;
        if(inStat) inStat.required = true;
        if(inCont) inCont.required = true;

        // Adiciona asterisco visual (*) se não tiver
        if(lblPeriod) lblPeriod.textContent = 'Período (Data Inicial à Data Final)*';
        if(lblComp) lblComp.textContent = 'Competência (mês/ano)*';
        if(lblRel) lblRel.textContent = 'Data de Liberação*';
        if(lblStat) lblStat.textContent = 'Status de Envio*';
        if(lblCont) lblCont.textContent = 'Contato*';
    }
}

// ----------------------------------------------------------------------------
// 18. VERSÕES E CADASTROS BÁSICOS
// ----------------------------------------------------------------------------
function showVersionModal(id = null) {
    editingId = id;
    document.getElementById('version-form').reset();
    if (id) {
        const v = systemVersions.find(function(x) { return x.id === id; });
        document.getElementById('version-date').value = v.date;
        document.getElementById('version-number').value = v.version;
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
        const i = systemVersions.findIndex(function(x) { return x.id === editingId; });
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
    
    if (systemVersions.length === 0) {
        c.innerHTML = 'Vazio.';
        return;
    }
    const rows = systemVersions.map(function(v) {
        return '<tr><td>' + formatDate(v.date) + '</td><td>' + v.version + '</td><td>' + v.type + '</td><td>' + v.module + '</td><td>' + v.description + '</td><td><button class="btn btn--sm" onclick="showVersionModal(' + v.id + ')">✏️</button> <button class="btn btn--sm" onclick="deleteVersion(' + v.id + ')">🗑️</button></td></tr>';
    }).join('');
    c.innerHTML = '<table><thead><th>Data</th><th>Versão</th><th>Tipo</th><th>Módulo</th><th>Descrição</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
}

function deleteVersion(id) {
    if (confirm('Excluir?')) {
        systemVersions = systemVersions.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('systemVersions', systemVersions);
        renderVersions();
    }
}

function closeVersionModal() {
    document.getElementById('version-modal').classList.remove('show');
}

// Users
function showUserModal(id=null){ const m=document.getElementById('user-modal'); document.getElementById('user-form').reset(); editingId=id; document.getElementById('user-login').disabled=false; if(id){const u=users.find(x=>x.id===id); document.getElementById('user-login').value=u.login; document.getElementById('user-login').disabled=true; document.getElementById('user-name').value=u.name; document.getElementById('user-permission').value=u.permission; document.getElementById('user-status').value=u.status;}else{document.getElementById('user-password').required=true;} m.classList.add('show'); }
function saveUser(e){ e.preventDefault(); const login=document.getElementById('user-login').value.trim().toUpperCase(); if(!editingId && users.some(u=>u.login===login)){alert('Já existe');return;} const data={login, name:document.getElementById('user-name').value, permission:document.getElementById('user-permission').value, status:document.getElementById('user-status').value}; if(!editingId){data.id=getNextId('user'); data.salt=generateSalt(); data.passwordHash=hashPassword(document.getElementById('user-password').value, data.salt); users.push(data);}else{const i=users.findIndex(u=>u.id===editingId); users[i]={...users[i],...data}; if(document.getElementById('user-password').value){users[i].salt=generateSalt(); users[i].passwordHash=hashPassword(document.getElementById('user-password').value, users[i].salt);}} salvarNoArmazenamento('users',users); document.getElementById('user-modal').classList.remove('show'); renderUsers(); showToast('Salvo!'); }
function renderUsers(){ const c=document.getElementById('users-table'); if(users.length===0){c.innerHTML='Vazio';return;} const rows=users.map(u=>`<tr><td>${u.login}</td><td>${u.name}</td><td>${u.status}</td><td><button class="btn btn--sm" onclick="showUserModal(${u.id})">✏️</button><button class="btn btn--sm" onclick="deleteUser(${u.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Login</th><th>Nome</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; }
function deleteUser(id) { const u=users.find(x=>x.id===id); if(u.login==='ADMIN'){alert('Não pode excluir ADMIN');return;} if(confirm('Excluir?')){users=users.filter(x=>x.id!==id); salvarNoArmazenamento('users',users); renderUsers();}}
function closeUserModal(){document.getElementById('user-modal').classList.remove('show');}

// Cargos
function showCargoModal(id=null){ editingId=id; document.getElementById('cargo-form').reset(); if(id){const c=cargos.find(x=>x.id===id); document.getElementById('cargo-name').value=c.name;} document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e){ e.preventDefault(); const data={name:document.getElementById('cargo-name').value}; if(editingId){const i=cargos.findIndex(x=>x.id===editingId); cargos[i]={...cargos[i],...data};}else{cargos.push({id:getNextId('cargo'),...data});} salvarNoArmazenamento('cargos',cargos); document.getElementById('cargo-modal').classList.remove('show'); renderCargos(); }
function renderCargos(){ const c=document.getElementById('cargos-table'); const r=cargos.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Cargo</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteCargo(id){ if(confirm('Excluir?')){ cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}
function closeCargoModal(){document.getElementById('cargo-modal').classList.remove('show');}

// Orientadores
function showOrientadorModal(id=null){ editingId=id; document.getElementById('orientador-form').reset(); if(id){const o=orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value=o.name; document.getElementById('orientador-contact').value=o.contact;} document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e){ e.preventDefault(); const data={name:document.getElementById('orientador-name').value, contact:document.getElementById('orientador-contact').value}; if(editingId){const i=orientadores.findIndex(x=>x.id===editingId); orientadores[i]={...orientadores[i],...data};}else{orientadores.push({id:getNextId('orient'),...data});} salvarNoArmazenamento('orientadores',orientadores); document.getElementById('orientador-modal').classList.remove('show'); renderOrientadores(); }
function renderOrientadores(){ const c=document.getElementById('orientadores-table'); const r=orientadores.map(x=>`<tr><td>${x.name}</td><td>${x.contact}</td><td><button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Contato</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteOrientador(id){ if(confirm('Excluir?')){ orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}
function closeOrientadorModal(){document.getElementById('orientador-modal').classList.remove('show');}

// Módulos
function showModuloModal(id=null){ editingId=id; document.getElementById('modulo-form').reset(); const form=document.getElementById('modulo-form'); if(!document.getElementById('modulo-description')) { const div=document.createElement('div'); div.className='form-group'; div.innerHTML=`<label class="form-label">Descrição</label><textarea class="form-control" id="modulo-description"></textarea>`; form.insertBefore(div, form.querySelector('.modal-actions')); } if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name; if(document.getElementById('modulo-abbreviation')) document.getElementById('modulo-abbreviation').value=m.abbreviation; if(document.getElementById('modulo-description')) document.getElementById('modulo-description').value=m.description||'';} document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e){ e.preventDefault(); const data={name:document.getElementById('modulo-name').value, abbreviation:document.getElementById('modulo-abbreviation')?document.getElementById('modulo-abbreviation').value:'', description:document.getElementById('modulo-description')?document.getElementById('modulo-description').value:''}; if(editingId){const i=modulos.findIndex(x=>x.id===editingId); modulos[i]={...modulos[i],...data};}else{modulos.push({id:getNextId('mod'),...data});} salvarNoArmazenamento('modulos',modulos); document.getElementById('modulo-modal').classList.remove('show'); renderModulos(); }
function renderModulos(){ const c=document.getElementById('modulos-table'); const r=modulos.map(x=>`<tr><td>${x.name}</td><td>${x.abbreviation||'-'}</td><td><button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Módulo</th><th>Abrev.</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteModulo(id){ if(confirm('Excluir?')){ modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}
function closeModuloModal(){document.getElementById('modulo-modal').classList.remove('show');}

// Municípios Lista Mestra
function showMunicipalityListModal(id=null){ editingId=id; document.getElementById('municipality-list-form').reset(); if(id){const m=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=m.name; document.getElementById('municipality-list-uf').value=m.uf;} document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e){ e.preventDefault(); const data={name:document.getElementById('municipality-list-name').value, uf:document.getElementById('municipality-list-uf').value}; if(editingId){const i=municipalitiesList.findIndex(x=>x.id===editingId); municipalitiesList[i]={...municipalitiesList[i],...data};}else{municipalitiesList.push({id:getNextId('munList'),...data});} salvarNoArmazenamento('municipalitiesList',municipalitiesList); document.getElementById('municipality-list-modal').classList.remove('show'); renderMunicipalityList(); updateGlobalDropdowns(); showToast('Salvo!'); }
function renderMunicipalityList(){ const c=document.getElementById('municipalities-list-table'); const r=municipalitiesList.map(m=>`<tr><td>${m.name}</td><td>${m.uf}</td><td><button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>UF</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteMunicipalityList(id){ if(confirm('Excluir?')){ municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}
function closeMunicipalityListModal() { document.getElementById('municipality-list-modal').classList.remove('show'); }

// Formas
function showFormaApresentacaoModal(id=null){ editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){const f=formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value=f.name;} document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e){ e.preventDefault(); const data={name:document.getElementById('forma-apresentacao-name').value}; if(editingId){const i=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[i]={...formasApresentacao[i],...data};}else{formasApresentacao.push({id:getNextId('forma'),...data});} salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }
function renderFormas(){ const c=document.getElementById('formas-apresentacao-table'); const r=formasApresentacao.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Forma</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; }
function deleteForma(id){ if(confirm('Excluir?')){ formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}
function closeFormaApresentacaoModal() { document.getElementById('forma-apresentacao-modal').classList.remove('show'); }

// ----------------------------------------------------------------------------
// 19. BACKUP E RESTORE (COM PREVIEW COMPLETO)
// ----------------------------------------------------------------------------
function updateBackupInfo() {
    document.getElementById('backup-info-trainings').textContent = tasks.length;
    document.getElementById('backup-info-municipalities').textContent = municipalities.length;
}

function createBackup() {
    const backupData = { 
        version: "v25.0", 
        date: new Date().toISOString(), 
        data: { 
            // Listas Principais
            users: users, 
            municipalities: municipalities, 
            municipalitiesList: municipalitiesList, 
            tasks: tasks, 
            requests: requests, 
            demands: demands, 
            visits: visits, 
            productions: productions, 
            presentations: presentations, 
            
            // Configurações Auxiliares
            systemVersions: systemVersions, 
            cargos: cargos, 
            orientadores: orientadores, 
            modulos: modulos, 
            formasApresentacao: formasApresentacao, 
            
            // Contadores de ID
            counters: counters 
        } 
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "SIGP_Backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(dl); 
    dl.click(); 
    dl.remove();
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
            const json = JSON.parse(e.target.result);
            const d = json.data || json; 
            
            if (!d) { alert('Arquivo de backup inválido.'); return; }
            
            pendingBackupData = json; 
            
            const list = document.getElementById('restore-preview-list');
            if(list) {
                list.innerHTML = '';
                
                // Lista com Descrições Melhoradas (Na ordem solicitada)
                const counts = {
                    'Treinamentos': (d.tasks || d.trainings || []).length,
                    'Municípios Clientes': (d.municipalities || []).length,
                    'Lista Mestra de Municípios': (d.municipalitiesList || []).length,
                    'Solicitações/Sugestões': (d.requests || []).length,
                    'Apresentações do Software': (d.presentations || []).length,
                    'Cargos/Funções': (d.cargos || []).length,
                    'Orientadores': (d.orientadores || []).length,
                    'Módulos': (d.modulos || d.modules || []).length,
                    'Formas de Apresentação': (d.formasApresentacao || []).length,
                    'Demandas do Suporte': (d.demands || []).length,
                    'Visitas Presenciais': (d.visits || []).length,
                    'Envios de Produção': (d.productions || []).length,
                    'Usuários': (d.users || []).length
                };

                // Gera a lista visual
                for (const [label, count] of Object.entries(counts)) {
                    // Mostra se tiver dados OU se for um item importante
                    if (count > 0) {
                        list.innerHTML += `<li><strong>${label}:</strong> ${count} registro(s)</li>`;
                    }
                }
                
                // Versões (Extra)
                const verCount = (d.systemVersions || []).length;
                if (verCount > 0) {
                    list.innerHTML += `<li><strong>Versões do Sistema:</strong> ${verCount} registro(s)</li>`;
                }
            }
            document.getElementById('restore-confirm-modal').classList.add('show');
        } catch (err) { 
            console.error(err);
            alert('Erro ao ler arquivo de backup. Verifique o formato.'); 
        }
    };
    reader.readAsText(file);
}

function confirmRestore() {
    if (!pendingBackupData) return;

    try {
        const backup = pendingBackupData.data || pendingBackupData;
        
        // 1. Preservar Sessão
        const sessionUser = localStorage.getItem('currentUser');
        const sessionAuth = localStorage.getItem('isAuthenticated');
        const sessionTheme = localStorage.getItem('theme') || 'light';

        // 2. Limpar tudo
        localStorage.clear();

        // --- TRATAMENTO E HIGIENIZAÇÃO DOS DADOS (Evita erros de "undefined") ---

        // Usuários
        const safeUsers = (backup.users || []).map(u => ({
            ...u, 
            status: u.status || 'Ativo', 
            permission: u.permission || 'Usuário Normal'
        }));
        if (safeUsers.length === 0) {
            safeUsers.push({id:1, login:'ADMIN', name:'Administrador', passwordHash: hashPassword('saude2025', generateSalt()), salt: generateSalt(), permission:'Administrador', status:'Ativo'});
        }

        // Municípios (Garante que modules seja array)
        const safeMuns = (backup.municipalities || []).map(m => ({
            ...m,
            manager: m.manager || '',
            contact: m.contact || '',
            modules: Array.isArray(m.modules) ? m.modules : [], // CRÍTICO: Evita travar renderMunicipalities
            dateBlocked: (m.status === 'Bloqueado' ? (m.dateBlocked || m.stoppageDate || '') : ''),
            dateStopped: (m.status === 'Parou de usar' ? (m.dateStopped || m.stoppageDate || '') : '')
        }));

        // Treinamentos (Converte e garante strings)
        const rawTasks = backup.tasks || backup.trainings || [];
        const safeTasks = rawTasks.map(t => ({
            id: t.id,
            municipality: t.municipality || '',
            dateRequested: t.dateRequested || '',
            datePerformed: t.datePerformed || '',
            requestedBy: t.requestedBy || '',
            performedBy: t.performedBy || '',
            trainedName: t.trainedName || '',
            trainedPosition: t.trainedPosition || '',
            contact: t.contact || '',
            status: t.status || 'Pendente',
            observations: t.observations || '' // CRÍTICO: Evita erro de .length
        }));

        // Demandas (Converte e garante description)
        const safeDemands = (backup.demands || []).map(d => ({
            ...d,
            description: d.description || '', // CRÍTICO
            dateRealization: d.dateRealization || d.realizationDate || '',
            justification: d.justification || ''
        }));

        // Visitas (Converte e garante reason)
        const safeVisits = (backup.visits || []).map(v => ({
            ...v,
            reason: v.reason || '', // CRÍTICO
            dateRealization: v.dateRealization || v.visitDate || '',
            justification: v.justification || v.cancelJustification || ''
        }));

        // Apresentações (Garante arrays de orientadores/formas)
        const safePres = (backup.presentations || []).map(p => ({
            ...p,
            description: p.description || '',
            orientadores: Array.isArray(p.orientadores) ? p.orientadores : [], // CRÍTICO: Evita travar .join()
            forms: Array.isArray(p.forms) ? p.forms : [] // CRÍTICO: Evita travar .join()
        }));

        // Produção (Garante strings)
        const safeProds = (backup.productions || []).map(p => ({
            ...p,
            observations: p.observations || ''
        }));

        // Solicitações (Garante description)
        const safeRequests = (backup.requests || []).map(r => ({
            ...r,
            description: r.description || '', // CRÍTICO
            justification: r.justification || ''
        }));

        // Outras listas simples (Garante array vazio se não existir)
        const safeListMestra = backup.municipalitiesList || [];
        const safeVers = backup.systemVersions || [];
        const safeCargos = backup.cargos || [];
        const safeOrient = backup.orientadores || [];
        const safeMods = backup.modulos || backup.modules || [];
        const safeFormas = backup.formasApresentacao || [];

        // Recriar Contadores
        const getMax = (list) => list.reduce((acc, i) => Math.max(acc, i.id || 0), 0) + 1;
        const safeCounters = {
            mun: getMax(safeMuns),
            munList: getMax(safeListMestra),
            task: getMax(safeTasks),
            req: getMax(safeRequests),
            dem: getMax(safeDemands),
            visit: getMax(safeVisits),
            prod: getMax(safeProds),
            pres: getMax(safePres),
            ver: getMax(safeVers),
            user: getMax(safeUsers),
            cargo: getMax(safeCargos),
            orient: getMax(safeOrient),
            mod: getMax(safeMods),
            forma: getMax(safeFormas)
        };

        // --- GRAVAÇÃO NO DISCO ---
        localStorage.setItem('users', JSON.stringify(safeUsers));
        localStorage.setItem('municipalities', JSON.stringify(safeMuns));
        localStorage.setItem('municipalitiesList', JSON.stringify(safeListMestra));
        localStorage.setItem('tasks', JSON.stringify(safeTasks));
        localStorage.setItem('requests', JSON.stringify(safeRequests));
        localStorage.setItem('demands', JSON.stringify(safeDemands));
        localStorage.setItem('visits', JSON.stringify(safeVisits));
        localStorage.setItem('productions', JSON.stringify(safeProds));
        localStorage.setItem('presentations', JSON.stringify(safePres));
        localStorage.setItem('systemVersions', JSON.stringify(safeVers));
        localStorage.setItem('cargos', JSON.stringify(safeCargos));
        localStorage.setItem('orientadores', JSON.stringify(safeOrient));
        localStorage.setItem('modulos', JSON.stringify(safeMods));
        localStorage.setItem('formasApresentacao', JSON.stringify(safeFormas));
        localStorage.setItem('counters', JSON.stringify(safeCounters));

        // Restaura Sessão
        if (sessionUser) localStorage.setItem('currentUser', sessionUser);
        if (sessionAuth) localStorage.setItem('isAuthenticated', sessionAuth);
        localStorage.setItem('theme', sessionTheme);

        alert('Dados restaurados e higienizados com sucesso!');
        location.reload();

    } catch (error) {
        console.error("Erro crítico na restauração:", error);
        alert('Ocorreu um erro ao processar o backup. Verifique o console (F12).');
    }
}

// ----------------------------------------------------------------------------
// 20. DASHBOARD E INICIALIZAÇÃO
// ----------------------------------------------------------------------------
function updateDashboardStats() {
    document.getElementById('dashboard-municipalities-in-use').textContent = municipalities.filter(function(m) { return m.status === 'Em uso'; }).length;
    document.getElementById('dashboard-trainings-completed').textContent = tasks.filter(function(t) { return t.status === 'Concluído'; }).length;
    document.getElementById('dashboard-requests-completed').textContent = requests.filter(function(r) { return r.status === 'Realizado'; }).length;
    document.getElementById('dashboard-presentations-completed').textContent = presentations.filter(function(p) { return p.status === 'Realizada'; }).length;
}

function initializeDashboardCharts() {
    const ctx = document.getElementById('implantationsYearChart');
    if(!ctx || !window.Chart) return;
    
    if(chartDashboard) {
        chartDashboard.destroy();
    }
    
    const dataMap = {}; 
    municipalities.forEach(function(m) { 
        if(m.implantationDate) { 
            const y = m.implantationDate.split('-')[0]; 
            dataMap[y] = (dataMap[y] || 0) + 1; 
        } 
    });
    
    const years = Object.keys(dataMap).sort();
    const counts = years.map(function(y) { return dataMap[y]; });
    
    // Cores diferentes para cada ano
    const bgColors = years.map(function(_, i) { 
        return CHART_COLORS[i % CHART_COLORS.length]; 
    });

    chartDashboard = new Chart(ctx, { 
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
            plugins: { legend: { display: false } } 
        } 
    });
}

function populateSelect(select, data, valKey, textKey) {
    if(!select) return;
    const current = select.value;
    let html = '<option value="">Selecione...</option>';
    
    data.sort(function(a,b){ 
        return a[textKey].localeCompare(b[textKey]); 
    }).forEach(function(i) { 
        html += '<option value="' + i[valKey] + '">' + i[textKey] + '</option>'; 
    });
    
    select.innerHTML = html;
    select.value = current;
}

function populateFilterSelects() {
    // ------------------------------------------------------------------------
    // 1. REGRA GERAL: MUNICÍPIOS (Todas as Abas)
    // Fonte: 'municipalitiesList' (Cadastro de Município em Configurações)
    // ------------------------------------------------------------------------
    
    const allMunFilters = [
        'filter-municipality-name',         // Aba Municípios Clientes
        'filter-task-municipality',         // Aba Treinamentos
        'filter-request-municipality',      // Aba Solicitações
        'filter-presentation-municipality', // Aba Apresentações
        'filter-visit-municipality',        // Aba Visitas
        'filter-production-municipality'    // Aba Produção
    ];

    // Verifica se a lista mestra existe
    if (typeof municipalitiesList !== 'undefined') {
        // Ordena alfabeticamente
        const sortedMaster = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));

        allMunFilters.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const currentVal = el.value; // Guarda o valor atual para não perder seleção ao atualizar
                
                // Gera o HTML com TODAS as opções da Lista Mestra
                el.innerHTML = '<option value="">Todos</option>' + 
                               sortedMaster.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
                
                // Restaura seleção
                if(currentVal) el.value = currentVal;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 2. FILTROS DE ORIENTADOR
    // ------------------------------------------------------------------------
    const orientadorFilters = ['filter-task-performer', 'filter-presentation-orientador'];
    const sortedOrientadores = orientadores.slice().sort((a,b) => a.name.localeCompare(b.name));
    
    orientadorFilters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const cur = el.value;
            el.innerHTML = '<option value="">Todos</option>' + sortedOrientadores.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
            if(cur) el.value = cur;
        }
    });

    // ------------------------------------------------------------------------
    // 3. FILTRO DE CARGO
    // ------------------------------------------------------------------------
    const cargoEl = document.getElementById('filter-task-position');
    if (cargoEl) {
        const cur = cargoEl.value;
        const sortedCargos = cargos.slice().sort((a,b) => a.name.localeCompare(b.name));
        cargoEl.innerHTML = '<option value="">Todos</option>' + sortedCargos.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        if(cur) cargoEl.value = cur;
    }

    // ------------------------------------------------------------------------
    // 4. FILTRO DE USUÁRIO (Solicitações e Demandas)
    // ------------------------------------------------------------------------
    const userFilters = ['filter-request-user', 'filter-demand-user'];
    const sortedUsers = users.slice().sort((a,b) => a.name.localeCompare(b.name));
    
    userFilters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const cur = el.value;
            el.innerHTML = '<option value="">Todos</option>' + sortedUsers.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
            if(cur) el.value = cur;
        }
    });
}

function updateGlobalDropdowns() {
    const activeMuns = municipalities.filter(function(m) { return m.status === 'Em uso'; });
    
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(function(id) { 
        populateSelect(document.getElementById(id), activeMuns, 'name', 'name'); 
    });
    
    // Filtros
    populateFilterSelects();
}

function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    applyMasks();
    setupDynamicFormFields();
    updateGlobalDropdowns();
    
    renderMunicipalities();
    renderTasks();
    renderRequests();
    renderDemands();
    renderVisits();
    renderProductions();
    renderPresentations();
    renderVersions();
    
    updateDashboardStats();
    initializeDashboardCharts();
    
    // Listener do Menu Mobile
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.onclick = toggleMobileMenu;
    }
    
    if(!document.querySelector('.sidebar-btn.active')) {
        navigateToHome();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    window.onclick = function(e) { 
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    };
    
    document.querySelectorAll('.close-btn').forEach(function(b) { 
        b.onclick = function(){ 
            this.closest('.modal').classList.remove('show'); 
        }; 
    });
    
    document.querySelectorAll('.btn--secondary').forEach(function(b) { 
        if (b.textContent.includes('Cancelar')) {
            b.onclick = function(){ 
                this.closest('.modal').classList.remove('show'); 
            }; 
        }
    });
});

// --- BLOCO DE CORREÇÃO AUTOMÁTICA DE IDs (Pode manter no arquivo) ---
(function autoFixPresentationIds() {
    // Verifica se existem apresentações
    if (typeof presentations !== 'undefined' && presentations.length > 0) {
        // Reinumera todas as apresentações sequencialmente (1, 2, 3...)
        presentations.forEach((p, index) => {
            p.id = index + 1;
        });
        
        // Atualiza o contador geral para o próximo número disponível
        if (typeof counters !== 'undefined') {
            counters.pres = presentations.length + 1;
            salvarNoArmazenamento('counters', counters);
        }
        
        // Salva a lista corrigida
        salvarNoArmazenamento('presentations', presentations);
        console.log("IDs de apresentações corrigidos e reordenados com sucesso.");
    }
})();

// --- FUNÇÕES DE IMPORTAÇÃO DE APRESENTAÇÕES (Adicionar no final) ---

function triggerPresentationCSVImport() {
    document.getElementById('presentation-csv-import-input').click();
}

function handlePresentationCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        let count = 0;

        // Pula o cabeçalho (linha 0) e começa da linha 1
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                // Formato esperado no CSV: Município;DataSol;Solicitante;Status;Descricao
                const cols = line.split(';');
                
                if (cols.length >= 1) { 
                    const novaApresentacao = {
                        id: getNextId('pres'), // GERA ID ÚNICO (Essencial para evitar o erro)
                        municipality: cols[0] ? cols[0].trim() : '',
                        dateSolicitacao: cols[1] ? cols[1].trim() : '',
                        requester: cols[2] ? cols[2].trim() : '',
                        status: cols[3] ? cols[3].trim() : 'Pendente',
                        description: cols[4] ? cols[4].trim() : '',
                        // Campos extras iniciam vazios na importação simples
                        dateRealizacao: '',
                        orientadores: [],
                        forms: []
                    };
                    presentations.push(novaApresentacao);
                    count++;
                }
            }
        }
        
        salvarNoArmazenamento('presentations', presentations);
        renderPresentations();
        alert(`${count} apresentações importadas com sucesso!`);
        event.target.value = ''; // Limpa o input
    };
    reader.readAsText(file);
}
// --- BLOCO DE CORREÇÃO AUTOMÁTICA DE IDs DE PRODUÇÃO ---
(function autoFixProductionIds() {
    // Verifica se existem envios de produção
    if (typeof productions !== 'undefined' && productions.length > 0) {
        // Reinumera todos sequencialmente
        productions.forEach((p, index) => {
            p.id = index + 1;
        });
        
        // Atualiza o contador geral para não gerar duplicados no futuro
        if (typeof counters !== 'undefined') {
            counters.prod = productions.length + 1;
            salvarNoArmazenamento('counters', counters);
        }
        
        // Salva a lista corrigida
        salvarNoArmazenamento('productions', productions);
        console.log("IDs de produção corrigidos e reordenados com sucesso.");
    }
})();
