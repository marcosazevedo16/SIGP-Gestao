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
// --- PAGINAÇÃO ---
const ITEMS_PER_PAGE = 10; // Quantos itens por página
let currentPage = 1;       // Página atual

// Carrega logs ou inicia vazio
let auditLogs = recuperarDoArmazenamento('auditLogs', []);
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
    // 0. Injeto do Modal de Confirmação de Restore
    
    // Remove modal anterior para evitar memory leak
    const existingModal = document.getElementById('restore-confirm-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
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
    modulos: [],
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
    formasApresentacao: [],
    integrations: [], // NOVO
    apisList: []      // NOVO
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
let integrations = recuperarDoArmazenamento('integrations', []);
let apisList = recuperarDoArmazenamento('apisList', []);

// Contadores de ID (Persistidos)
let counters = recuperarDoArmazenamento('counters', {
    mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1,
    api: 1, integration: 1
});

function getNextId(key) {
    const id = counters[key]++;
    salvarNoArmazenamento('counters', counters);
    return id;
}

// ----------------------------------------------------------------------------
// 9. INTERFACE E NAVEGAÇÃO
// ----------------------------------------------------------------------------

// Substitua a função antiga por esta nova versão
function initializeTheme() {
    // 1. Aplica o atributo no HTML para o CSS funcionar
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // 2. Atualiza o texto do botão
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = currentTheme === 'light' ? '🌙 Tema' : '☀️ Tema';
    }

    // 3. ATUALIZAÇÃO DO CHART.JS (CORREÇÃO FINA DE CORES)
    if (window.Chart) {
        if (currentTheme === 'dark') {
            // --- TEMA ESCURO ---
            // Texto branco suave
            Chart.defaults.color = '#e0e0e0';
            // Linhas de grade BEM TRANSPARENTES (apenas 10% de opacidade)
            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; 
        } else {
            // --- TEMA CLARO ---
            // Texto cinza escuro
            Chart.defaults.color = '#666666';
            // Linhas de grade cinza claro padrão
            Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
        }
        
        // Força a atualização de todos os gráficos existentes na tela para pegar a nova cor
        Object.values(Chart.instances).forEach(chart => {
            chart.options.scales.x && (chart.options.scales.x.grid.color = Chart.defaults.borderColor);
            chart.options.scales.y && (chart.options.scales.y.grid.color = Chart.defaults.borderColor);
            chart.update();
        });
    }

    // 4. Força a atualização da aba atual
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        setTimeout(() => {
            refreshCurrentTab(activeTab.id);
        }, 50);
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

    // Verifica se é Admin
    const isAdmin = currentUser.permission === 'Administrador';
    
    // --- CONTROLE DE ACESSO (ADMINISTRADOR) ---
    
    // 1. Botão de Gestão de Usuários
    const btnUser = document.getElementById('user-management-menu-btn');
    if (btnUser) {
        btnUser.style.display = isAdmin ? 'flex' : 'none';
    }

    // 2. Botão de Auditoria (NOVO - Apenas Admin)
    const btnAudit = document.getElementById('audit-menu-btn');
    if (btnAudit) {
        btnAudit.style.display = isAdmin ? 'flex' : 'none';
    }
    
    // --- ITENS ACESSÍVEIS A TODOS OS USUÁRIOS LOGADOS ---
    // (Removi o 'audit-menu-btn' desta lista geral)
    const itemsToEnable = [
        'cargo-management-menu-btn',
        'orientador-management-menu-btn',
        'modulo-management-menu-btn',
        'municipality-list-management-menu-btn',
        'forma-apresentacao-management-menu-btn',
        'api-list-management-menu-btn',
        'backup-menu-btn'
    ];
    
    itemsToEnable.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex';
        }
    });

    // Divisor do menu
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
    updateGlobalDropdowns();

    if (sectionId === 'municipios-section') renderMunicipalities();
    if (sectionId === 'tarefas-section') renderTasks();
    if (sectionId === 'solicitacoes-section') renderRequests();
    if (sectionId === 'demandas-section') renderDemands();
    if (sectionId === 'visitas-section') renderVisits();
    if (sectionId === 'producao-section') renderProductions();
    if (sectionId === 'apresentacoes-section') renderPresentations();
    if (sectionId === 'versoes-section') renderVersions();
    if (sectionId === 'usuarios-section') renderUsers(); 
    if (sectionId === 'cargos-section') renderCargos();
    if (sectionId === 'orientadores-section') renderOrientadores();
    if (sectionId === 'modulos-section') renderModulos();
    if (sectionId === 'municipalities-list-section') renderMunicipalityList();
    if (sectionId === 'formas-apresentacao-section') renderFormas();
    if (sectionId === 'apis-section') renderIntegrations();
    if (sectionId === 'apis-list-section') renderApiList();
    if (sectionId === 'info-colaboradores-section') { /* Futura lógica aqui */ }

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
function navigateToApiListManagement() { toggleSettingsMenu(); openTab('apis-list-section'); renderApiList(); }
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
    
    // 1. Verifica se está bloqueado (Rate Limit)
    try {
        checkLoginAttempts(login);
    } catch (erro) {
        alert(erro.message);
        return;
    }

    const user = users.find(function(u) {
        return u.login === login && u.status === 'Ativo';
    });

    if (user) {
        const hashedPassword = hashPassword(pass, user.salt);
        if (hashedPassword === user.passwordHash) {
            // SUCESSO
            currentUser = user;
            isAuthenticated = true;
            
            // Reseta tentativas falhas
            resetLoginAttempts(login);
            
            // Log de Auditoria
            logSystemAction('Login', 'Acesso', 'Usuário realizou login no sistema');
            
            salvarNoArmazenamento('currentUser', currentUser);
            
            checkAuthentication();
            initializeApp();
            
            // Inicia monitoramento de inatividade
            initializeInactivityTracking();
            
            showToast(`Bem-vindo, ${user.name}!`, 'success');
            return;
        }
    }
    
    // FALHA
    recordFailedAttempt(login);
    document.getElementById('login-error').textContent = 'Login ou senha incorretos.';
    
    // Mostra tentativas restantes se estiver quase bloqueando
    if (loginAttempts[login] && loginAttempts[login].count > 2) {
        const restantes = MAX_LOGIN_ATTEMPTS - loginAttempts[login].count;
        alert(`⚠️ Senha incorreta. Você tem mais ${restantes} tentativas antes do bloqueio.`);
    }
}

function checkAuthentication() {
    if (isAuthenticated && currentUser) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        updateUserInterface();
        
        // ATIVA PROTEÇÃO DE INATIVIDADE
        initializeInactivityTracking();
    } else {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-app').classList.remove('active');
    }
}

function handleLogout() {
    // Removemos a verificação 'confirm'
    // O sistema agora limpa o usuário e recarrega a página imediatamente
    localStorage.removeItem('currentUser');
    
    // Se você implementou o módulo de segurança anteriormente, 
    // pode descomentar a linha abaixo para parar o timer de inatividade:
    // if (typeof disableInactivityTracking === 'function') disableInactivityTracking();

    location.reload();
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
// 11. MUNICÍPIOS CLIENTES
// ----------------------------------------------------------------------------

// Função atualizada para o novo Layout Grid
function handleMunicipalityStatusChange() {
    const statusEl = document.getElementById('municipality-status');
    if (!statusEl) return; // Segurança
    const status = statusEl.value; 
    // 1. Captura os grupos (divs) que já estão no HTML
    const groupBlocked = document.getElementById('group-date-blocked');
    const groupStopped = document.getElementById('group-date-stopped'); 
    // 2. Captura os inputs para controlar a obrigatoriedade (required)
    const inputBlocked = document.getElementById('municipality-date-blocked');
    const inputStopped = document.getElementById('municipality-date-stopped');
    // 3. RESET: Esconde tudo e tira obrigatoriedade antes de checar
    if (groupBlocked) groupBlocked.style.display = 'none';
    if (groupStopped) groupStopped.style.display = 'none';    
    if (inputBlocked) { 
        inputBlocked.value = ''; 
        inputBlocked.required = false; 
    }
    if (inputStopped) { 
        inputStopped.value = ''; 
        inputStopped.required = false; 
    }
    // 4. LÓGICA: Mostra o campo específico baseado no status
    if (status === 'Bloqueado') {
        if (groupBlocked) groupBlocked.style.display = 'block';
        if (inputBlocked) inputBlocked.required = true; // Torna obrigatório
    } 
    else if (status === 'Parou de usar') {
        if (groupStopped) groupStopped.style.display = 'block';
        // Se quiser que a data de parada seja obrigatória, descomente abaixo:
        // if (inputStopped) inputStopped.required = true; 
    }
    
    // Se estiver editando, a função showMunicipalityModal vai repopular os valores
    // logo após chamar esta função, então o reset acima não perde dados salvos.
}
function showMunicipalityModal(id = null) {
    editingId = id;
    document.getElementById('municipality-form').reset();
    
    // 1. Popula o dropdown com a Lista Mestra atual (AGORA COM UF)
const munSelect = document.getElementById('municipality-name');

// Ordena a lista
const sortedList = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));

// Gera as opções mostrando "Nome - UF"
munSelect.innerHTML = '<option value="">Selecione o município</option>' + 
                      sortedList.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
    
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
    // Sanitiza inputs de texto
    const name = sanitizeInput(document.getElementById('municipality-name').value);
    const status = document.getElementById('municipality-status').value;
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
    
    // Validação Duplicidade
    if (!editingId && municipalities.some(m => m.name === name)) {
        alert('Erro: Este município já está cadastrado na carteira!');
        return;
    }

    // Validação "Em Uso"
    if (status === 'Em uso' && mods.length === 0) {
        alert('Erro: Para status "Em Uso", selecione pelo menos um módulo.');
        return;
    }

    // Validação "Bloqueado"
    const dateBlocked = document.getElementById('municipality-date-blocked') ? document.getElementById('municipality-date-blocked').value : '';
    if (status === 'Bloqueado' && !dateBlocked) {
        alert('Erro: Preencha a "Data em que foi Bloqueado".');
        return;
    }

    const data = {
        name: name,
        status: status,
        // SANITIZAÇÃO AQUI:
        manager: sanitizeInput(document.getElementById('municipality-manager').value),
        contact: sanitizeInput(document.getElementById('municipality-contact').value),
        implantationDate: document.getElementById('municipality-implantation-date').value,
        lastVisit: document.getElementById('municipality-last-visit').value,
        modules: mods,
        dateBlocked: dateBlocked,
        dateStopped: document.getElementById('municipality-date-stopped') ? document.getElementById('municipality-date-stopped').value : ''
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
    
    // AUDITORIA
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Municípios', `Município: ${data.name} | Status: ${data.status}`);
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
    }).sort((a,b) => a.name.localeCompare(b.name));

    const c = document.getElementById('municipalities-table');
    if(document.getElementById('municipalities-results-count')) {
        document.getElementById('municipalities-results-count').style.display = 'block';
        document.getElementById('municipalities-results-count').innerHTML = `<strong>${filtered.length}</strong> município(s) no total`;
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município encontrado.</div>';
    } else {
        const rows = filtered.map(m => {
            let dataFim = '-', corDataFim = 'inherit';
            if (m.status === 'Bloqueado' && m.dateBlocked) { dataFim = formatDate(m.dateBlocked); corDataFim = '#C85250'; }
            else if (m.status === 'Parou de usar' && m.dateStopped) { dataFim = formatDate(m.dateStopped); corDataFim = '#E68161'; }

            const badges = m.modules.map(n => {
                const mc = modulos.find(x => x.name === n);
                const abbr = mc ? mc.abbreviation : n.substring(0,3).toUpperCase();
                return `<span class="module-tag" style="background:rgba(0,85,128,0.1); color:#005580; border:1px solid rgba(0,85,128,0.3);" title="${n}">${abbr}</span>`;
            }).join('');
            
            let stCls = 'task-status';
            if (m.status === 'Em uso') stCls += ' completed'; 
            else if (m.status === 'Bloqueado') stCls += ' cancelled'; 
            else if (m.status === 'Parou de usar') stCls += ' pending';

            return `<tr>
                <td class="text-primary-cell">${m.name}</td>
                <td class="module-tags-cell">${badges}</td>
                <td style="font-size:12px;">${m.manager}</td>
                <td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td>
                
                <td style="font-size:11px;">${formatDate(m.lastVisit)}</td> 
                
                <td style="font-size:11px;">${calculateTimeInUse(m.implantationDate)}</td>
                
                <td style="font-size:11px;">${calculateTimeInUse(m.lastVisit)}</td>
                
                <td><span class="${stCls}">${m.status}</span></td>
                <td style="color:${corDataFim}; font-size:11px;">${dataFim}</td>
                <td><button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button></td>
            </tr>`;
        }).join('');
        
        // Cabeçalho da Tabela
        c.innerHTML = `<table><thead>
            <th>Município</th>
            <th>Módulos Em Uso</th>
            <th>Gestor(a) Atual</th>
            <th>Contato</th>
            <th>Data de<br>Implantação</th>
            <th>Última Visita<br>Presencial</th>
            <th>Tempo de Uso</th>
            <th>Tempo sem Visita</th> <th>Status</th>
            <th>Bloqueio/<br>Parou de Usar</th>
            <th>Ações</th>
        </thead><tbody>${rows}</tbody></table>`;
    }
    updateMunicipalityCharts(filtered);
}

function updateMunicipalityCharts(data) {
    // 1. Gráfico de Status (Pizza)
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
    
    // 2. Gráfico de Módulos (Barra Colorida)
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
        const bgColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        
        chartModulesMun = new Chart(document.getElementById('modulesChart'), {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Qtd Municípios', 
                    data: values, 
                    backgroundColor: bgColors
                }] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // 3. Gráfico de Evolução (Linha Acumulada)
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

    // Contadores (SEM A MÉDIA DE DIAS)
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
        // AUDITORIA
const munParaDeletar = municipalities.find(x => x.id === id);
if(munParaDeletar) logSystemAction('Exclusão', 'Municípios', `Município excluído: ${munParaDeletar.name}`);
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

    // 1. Reset do contador visual
    if(document.getElementById('task-char-counter')) {
        document.getElementById('task-char-counter').textContent = '0 / 200';
    }

    // 2. Popula dropdowns e colaboradores
    updateGlobalDropdowns();
    const selectColab = document.getElementById('task-performed-by');
    // Garante que a lista de colaboradores seja carregada
    if(selectColab && typeof orientadores !== 'undefined') {
        populateSelect(selectColab, orientadores, 'name', 'name');
    }
    
    // 3. Edição
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
            document.getElementById('task-date-performed').value = t.datePerformed || '';
            
            // Preenche observações e atualiza contador
            document.getElementById('task-observations').value = t.observations || '';
            if(document.getElementById('task-char-counter')) {
                const len = t.observations ? t.observations.length : 0;
                document.getElementById('task-char-counter').textContent = len + ' / 200';
            }
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
        observations: sanitizeInput(document.getElementById('task-observations').value)
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

    // LÓGICA DE AUDITORIA
const actionType = editingId ? 'Edição' : 'Criação';
const detailsMsg = `${actionType} de treinamento para ${data.municipality} (Solicitante: ${data.requestedBy})`;
logSystemAction(actionType, 'Treinamentos', detailsMsg);

// ...
    // AUDITORIA
logSystemAction(editingId ? 'Edição' : 'Criação', 'Treinamentos', `Para: ${data.municipality} | Solicitante: ${data.requestedBy}`);
    
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
    } else if (type.includes('production')) { 
        startId = `filter-${type}-start`; endId = `filter-${type}-end`;
    } else if (type === 'integration') { startId = 'filter-integration-start'; endId = 'filter-integration-end';
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
    if (type === 'integration') renderIntegrations();
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
    // 1. Captura dos Filtros
    const fMun = document.getElementById('filter-task-municipality')?.value;
    const fStatus = document.getElementById('filter-task-status')?.value;
    const fReq = document.getElementById('filter-task-requester')?.value.toLowerCase();
    const fPerf = document.getElementById('filter-task-performer')?.value; 
    const fCargo = document.getElementById('filter-task-position')?.value; 
    const fReqStart = document.getElementById('filter-task-req-start')?.value;
    const fReqEnd = document.getElementById('filter-task-req-end')?.value;
    const fPerfStart = document.getElementById('filter-task-perf-start')?.value;
    const fPerfEnd = document.getElementById('filter-task-perf-end')?.value;

    // 2. Filtragem
    let filtered = tasks.filter(t => {
        if (fMun && t.municipality !== fMun) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if (fPerf && t.performedBy !== fPerf) return false;
        if (fCargo && t.trainedPosition !== fCargo) return false;
        if (fReqStart && t.dateRequested < fReqStart) return false;
        if (fReqEnd && t.dateRequested > fReqEnd) return false;
        if (fPerfStart && (!t.datePerformed || t.datePerformed < fPerfStart)) return false;
        if (fPerfEnd && (!t.datePerformed || t.datePerformed > fPerfEnd)) return false;
        return true;
    });

    // 3. Elementos da DOM
    const c = document.getElementById('tasks-table');
    
    if(document.getElementById('tasks-results-count')) {
        document.getElementById('tasks-results-count').style.display = 'block';
        document.getElementById('tasks-results-count').innerHTML = '<strong>' + filtered.length + '</strong> treinamentos encontrados';
    }
    
    // Atualiza estatísticas
    if(document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent = tasks.length;
    if(document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent = filtered.filter(t => t.status==='Concluído').length;
    if(document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent = filtered.filter(t => t.status==='Pendente').length;
    if(document.getElementById('cancelled-tasks')) document.getElementById('cancelled-tasks').textContent = filtered.filter(t => t.status==='Cancelado').length;

    if (filtered.length === 0) { 
        c.innerHTML = '<div class="empty-state">Nenhum treinamento encontrado.</div>'; 
    } else {
        const rows = filtered.map(t => {
            // Lógica para observação curta
            let obs = t.observations ? (t.observations.length > 30 ? t.observations.substring(0,30)+'...' : t.observations) : '-';
            
            // Define classe de status
            const stCls = t.status === 'Concluído' ? 'completed' : (t.status === 'Cancelado' ? 'cancelled' : 'pending');

            // --- NOVO: Busca a UF na lista mestra para exibir na tabela ---
            // Procura na lista mestra um município com o mesmo nome
            const munData = municipalitiesList.find(m => m.name === t.municipality);
            // Se achar, monta "Nome - UF", senão mostra só o "Nome"
            const munDisplay = munData ? `${t.municipality} - ${munData.uf}` : t.municipality;

            // --- Montagem da Linha (Colunas Reordenadas) ---
            return `<tr>
                <td class="text-primary-cell">${munDisplay}</td>
                <td style="text-align:center;">${formatDate(t.dateRequested)}</td>
                <td>${t.requestedBy}</td>
                <td>${t.performedBy}</td>
                <td>${t.trainedName||'-'}</td>
                <td>${t.trainedPosition||'-'}</td>
                <td>${t.contact||'-'}</td>
                
                <td style="text-align:center;">${formatDate(t.datePerformed)}</td>

                <td class="text-secondary-cell">${obs}</td>
                <td><span class="task-status ${stCls}">${t.status}</span></td>
                <td><button class="btn btn--sm" onclick="showTaskModal(${t.id})">✏️</button><button class="btn btn--sm" onclick="deleteTask(${t.id})">🗑️</button></td>
            </tr>`;
        }).join('');
        
        // --- Cabeçalho Reordenado ---
        c.innerHTML = `<table>
            <thead>
                <th>Município</th>
                <th>Data Solicitação</th>
                <th>Solicitante</th>
                <th>Colaborador Responsável</th>
                <th>Profissional</th>
                <th>Cargo</th>
                <th>Contato</th>
                <th>Data Realização</th> <th>Obs</th>
                <th>Status</th>
                <th>Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
}

function exportTasksCSV() {
    const data = getFilteredTasks();
    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Orientador', 'Profissional', 'Cargo', 'Contato', 'Status'];
    const rows = data.map(function(t) { 
        return [t.municipality, formatDate(t.dateRequested), formatDate(t.datePerformed), t.requestedBy, t.performedBy, t.trainedName, t.trainedPosition, t.contact, t.status]; 
    });
    downloadCSV('treinamentos.csv', headers, rows);
}

function generateTasksPDF() {
    const data = getFilteredTasks();
    const headers = ['Município', 'Data Solicitação', 'Orientador', 'Status'];
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
        const tDel = tasks.find(x => x.id === id);
if(tDel) logSystemAction('Exclusão', 'Treinamentos', `Treinamento excluído de ${tDel.municipality} (${tDel.requestedBy})`);
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
    const statusEl = document.getElementById('request-status');
    if(!statusEl) return;
    
    const status = statusEl.value;
    
    // Grupos (Divs)
    const grpReal = document.getElementById('group-request-date-realization');
    const grpJust = document.getElementById('group-request-justification');
    
    // Inputs (para required)
    const inpReal = document.getElementById('request-date-realization');
    const inpJust = document.getElementById('request-justification');

    // Reset inicial
    if(grpReal) grpReal.style.display = 'none';
    if(grpJust) grpJust.style.display = 'none';
    if(inpReal) inpReal.required = false;
    if(inpJust) inpJust.required = false;

    // Lógica
    if (status === 'Realizado') {
        if(grpReal) grpReal.style.display = 'block';
        if(inpReal) inpReal.required = true;
    } else if (status === 'Inviável') {
        if(grpJust) grpJust.style.display = 'block';
        if(inpJust) inpJust.required = true;
    }
}
function showRequestModal(id = null) {
    editingId = id;
    const form = document.getElementById('request-form');
    form.reset();

    // 1. Configura o listener de status
    const statusSel = document.getElementById('request-status');
    if (statusSel) statusSel.onchange = handleRequestStatusChange;

    // 2. Atualiza dropdowns globais e depois SOBRESCREVE o de município para mostrar a UF
    updateGlobalDropdowns(); 
    
    const munSelect = document.getElementById('request-municipality');
    if (munSelect) {
        const sortedList = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));
        // Aqui está o segredo: Mostra "Nome - UF" no texto, mas salva só o "Nome" no value
        munSelect.innerHTML = '<option value="">Selecione o município</option>' + 
                              sortedList.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
    }

    // 3. Preenchimento em caso de Edição
    if (id) {
        const r = requests.find(function(x) { return x.id === id; });
        if (r) {
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
            
            // Atualiza a visibilidade dos campos (Data Realização / Justificativa)
            handleRequestStatusChange();
        }
    } else {
        // Se for novo, garante que os campos ocultos estejam escondidos
        handleRequestStatusChange();
    }
    
    document.getElementById('request-modal').classList.add('show');
}
function saveRequest(e) {
    e.preventDefault();
    const status = document.getElementById('request-status').value;
    
    if (status === 'Realizado' && !document.getElementById('request-date-realization').value) {
        alert('Data de Realização é obrigatória.'); return;
    }
    if (status === 'Inviável' && !document.getElementById('request-justification').value) {
        alert('Justificativa é obrigatória.'); return;
    }

    const data = {
        date: document.getElementById('request-date').value,
        municipality: document.getElementById('request-municipality').value,
        // SANITIZAÇÃO AQUI:
        requester: sanitizeInput(document.getElementById('request-requester').value),
        contact: sanitizeInput(document.getElementById('request-contact').value),
        description: sanitizeInput(document.getElementById('request-description').value),
        justification: sanitizeInput(document.getElementById('request-justification').value),
        
        status: status,
        dateRealization: document.getElementById('request-date-realization').value,
        user: currentUser.name
    };

    if (editingId) {
        const i = requests.findIndex(x => x.id === editingId);
        if (i !== -1) requests[i] = { ...requests[i], ...data };
    } else {
        requests.push({ id: getNextId('req'), ...data });
    }
    salvarNoArmazenamento('requests', requests);
    document.getElementById('request-modal').classList.remove('show');
    renderRequests();
    
    // AUDITORIA
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Solicitações', `Para: ${data.municipality} | Solicitante: ${data.requester}`);
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
    const fMun = document.getElementById('filter-request-municipality')?.value;
    // ... (capture as outras variáveis)
    const fStatus = document.getElementById('filter-request-status')?.value;
    const fSol = document.getElementById('filter-request-solicitante')?.value.toLowerCase();
    const fUser = document.getElementById('filter-request-user')?.value;
    const fSolStart = document.getElementById('filter-request-sol-start')?.value;
    const fSolEnd = document.getElementById('filter-request-sol-end')?.value;
    const fRealStart = document.getElementById('filter-request-real-start')?.value;
    const fRealEnd = document.getElementById('filter-request-real-end')?.value;

    let filtered = requests.filter(r => {
        // CORREÇÃO C: Comparação exata
        if (fMun && r.municipality !== fMun) return false;
        
        if (fStatus && r.status !== fStatus) return false;
        if (fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        if (fUser && r.user !== fUser) return false;
        if (fSolStart && r.date < fSolStart) return false;
        if (fSolEnd && r.date > fSolEnd) return false;
        if (fRealStart && (!r.dateRealization || r.dateRealization < fRealStart)) return false;
        if (fRealEnd && (!r.dateRealization || r.dateRealization > fRealEnd)) return false;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // ... (Mantenha o restante da função renderRequests que já está correta no seu código) ...
    // Apenas garantindo o cabeçalho e tabela:
    const c = document.getElementById('requests-table');
    // (Lógica de contadores...)
    
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
        const rows = filtered.map(x => {
            const desc = x.description.length > 40 ? `<span title="${x.description}">${x.description.substring(0,40)}...</span>` : x.description;
            const just = x.justification ? (x.justification.length > 30 ? `<span title="${x.justification}">${x.justification.substring(0,30)}...</span>` : x.justification) : '-';
            let stCls = x.status === 'Realizado' ? 'completed' : (x.status === 'Inviável' ? 'cancelled' : 'pending');

            return `<tr>
                <td class="text-primary-cell">${x.municipality}</td>
                <td style="text-align:center;">${formatDate(x.date)}</td>
                <td>${x.requester}</td>
                <td>${x.contact}</td>
                <td style="font-size:12px;">${desc}</td>
                <td>${x.user || '-'}</td>
                <td style="text-align:center;"><span class="task-status ${stCls}">${x.status}</span></td>
                <td style="text-align:center;">${formatDate(x.dateRealization)}</td>
                <td class="text-secondary-cell">${just}</td>
                <td><button class="btn btn--sm" onclick="showRequestModal(${x.id})">✏️</button><button class="btn btn--sm" onclick="deleteRequest(${x.id})">🗑️</button></td>
            </tr>`;
        }).join('');
        c.innerHTML = `<table><thead><th>Município</th><th>Data Solicitação</th><th>Solicitante</th><th>Contato</th><th>Descrição</th><th>Usuário que Registrou a Solicitação</th><th style="text-align:center;">Status</th><th style="text-align:center;">Data Realização</th><th>Justificativa</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
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
    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Contato', 'Descrição', 'Status', 'Usuário'];
    const rows = data.map(function(r) { 
        return [r.municipality, formatDate(r.date), formatDate(r.dateRealization), r.requester, r.contact, r.description, r.status, r.user]; 
    });
    downloadCSV('solicitacoes.csv', headers, rows);
}

function generateRequestsPDF() {
    const data = getFilteredRequests();
    const headers = ['Município', 'Data Solicitação', 'Status', 'Descrição'];
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
        const rDel = requests.find(x => x.id === id);
if(rDel) logSystemAction('Exclusão', 'Solicitações', `Solicitação excluída de ${rDel.municipality}`);
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

// Função Visual: Controla asteriscos e visibilidade conforme o Status
function handlePresentationStatusChange() {
    const status = document.getElementById('presentation-status').value;
    
    // Inputs (para controlar obrigatoriedade)
    const inpDate = document.getElementById('presentation-date-realizacao');
    
    // Labels (para adicionar asterisco visual)
    const lblDate = document.getElementById('presentation-date-realizacao-label');
    const lblOrient = document.getElementById('presentation-orientador-label');
    const lblForms = document.getElementById('presentation-forms-label');
    const lblDesc = document.getElementById('presentation-description-label');

    // 1. RESET: Remove asteriscos e obrigatoriedade inicial
    if(lblDate) lblDate.textContent = 'Data de Realização';
    if(lblOrient) lblOrient.textContent = 'Colaboradores Responsáveis';
    if(lblForms) lblForms.textContent = 'Formas de Apresentação';
    if(lblDesc) lblDesc.textContent = 'Descrição/Detalhes (máx. 200)';

    if(inpDate) inpDate.required = false;

    // 2. LÓGICA DE VALIDAÇÃO (Não mexe mais em display:none)
    if (status === 'Realizada') {
        // Torna Data Obrigatória
        if(inpDate) inpDate.required = true;
        if(lblDate) lblDate.textContent += '*';
        
        // Adiciona asterisco visual nos outros
        if(lblOrient) lblOrient.textContent += '*';
        if(lblForms) lblForms.textContent += '*';
    } 
    else if (status === 'Pendente') {
        if(lblOrient) lblOrient.textContent += '*';
    } 
    else if (status === 'Cancelada') {
        if(lblDesc) lblDesc.textContent += '*';
    }
}

function showPresentationModal(id = null) {
    editingId = id;
    const form = document.getElementById('presentation-form');
    if(form) form.reset();
    
    // Reseta o contador de caracteres visualmente
    if(document.getElementById('presentation-char-counter')) {
        document.getElementById('presentation-char-counter').textContent = '0 / 200';
    }
    
    // 1. Popula dropdown com Lista Mestra (COM UF)
    const munSelect = document.getElementById('presentation-municipality');
    if (munSelect) {
        const sortedList = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));
        munSelect.innerHTML = '<option value="">Selecione o município</option>' + 
                              sortedList.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
    }
    
    // 2. Checkboxes dinâmicos (Orientadores)
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if (divO) {
        const listaOrient = (typeof orientadores !== 'undefined') ? orientadores : [];
        if(listaOrient.length > 0) {
            divO.innerHTML = listaOrient.map(o => `<label><input type="checkbox" value="${o.name}" class="orientador-check"> ${o.name}</label>`).join('');
        } else {
            divO.innerHTML = '<span style="font-size:11px; color:red;">Nenhum colaborador cadastrado.</span>';
        }
    }

    // 3. Checkboxes dinâmicos (Formas)
    const divF = document.getElementById('presentation-forms-checkboxes');
    if (divF) {
        const listaFormas = (typeof formasApresentacao !== 'undefined') ? formasApresentacao : [];
        if(listaFormas.length > 0) {
            divF.innerHTML = listaFormas.map(f => `<label><input type="checkbox" value="${f.name}" class="forma-check"> ${f.name}</label>`).join('');
        } else {
            divF.innerHTML = '<span style="font-size:11px; color:red;">Nenhuma forma cadastrada.</span>';
        }
    }

    // 4. Preenchimento (Edição)
    if (id) {
        const p = presentations.find(x => x.id === id);
        if(p) {
            document.getElementById('presentation-municipality').value = p.municipality;
            document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
            document.getElementById('presentation-requester').value = p.requester;
            document.getElementById('presentation-status').value = p.status;
            document.getElementById('presentation-description').value = p.description;
            
            // Atualiza contador na edição
            if(document.getElementById('presentation-char-counter')) {
                document.getElementById('presentation-char-counter').textContent = (p.description ? p.description.length : 0) + ' / 200';
            }
            
            if(document.getElementById('presentation-date-realizacao')) 
               document.getElementById('presentation-date-realizacao').value = p.dateRealizacao || '';
            
            // Marca checkboxes
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
        }
    }
    
    handlePresentationStatusChange();
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
    const filtered = getFilteredPresentations(); // Usa a função de filtro real
    const c = document.getElementById('presentations-table');
    
    // --- CORREÇÃO: ESTATÍSTICAS REATIVADAS ---
    if(document.getElementById('presentations-results-count')) {
        document.getElementById('presentations-results-count').innerHTML = '<strong>' + filtered.length + '</strong> apresentações encontradas';
        document.getElementById('presentations-results-count').style.display = 'block';
    }
    if(document.getElementById('total-presentations')) document.getElementById('total-presentations').textContent = presentations.length;
    if(document.getElementById('pending-presentations')) document.getElementById('pending-presentations').textContent = filtered.filter(p => p.status === 'Pendente').length;
    if(document.getElementById('completed-presentations')) document.getElementById('completed-presentations').textContent = filtered.filter(p => p.status === 'Realizada').length;
    if(document.getElementById('cancelled-presentations')) document.getElementById('cancelled-presentations').textContent = filtered.filter(p => p.status === 'Cancelada').length;
    // ----------------------------------------

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma apresentação encontrada.</div>';
    } else {
        const rows = filtered.map(p => {
            const desc = p.description ? (p.description.length > 30 ? p.description.substring(0, 30) + '...' : p.description) : '-';
            const stCls = p.status === 'Realizada' ? 'completed' : (p.status === 'Cancelada' ? 'cancelled' : 'pending');
            const oStr = (p.orientadores || []).join(', ');

            return `<tr>
                <td class="text-primary-cell">${p.municipality}</td>
                <td style="text-align:center;">${formatDate(p.dateSolicitacao)}</td>
                <td>${p.requester}</td>
                <td>${oStr}</td>
                <td>${(p.forms || []).join(', ')}</td>
                <td class="text-secondary-cell">${desc}</td>
                <td style="text-align:center;">${formatDate(p.dateRealizacao)}</td>
                <td><span class="task-status ${stCls}">${p.status}</span></td>
                <td>
                    <button class="btn btn--sm" onclick="showPresentationModal(${p.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deletePresentation(${p.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `<table><thead><th>Município</th><th>Data Solicitação</th><th>Solicitante(s)</th><th>Colaborador(es) Responsável(is)</th><th>Formas</th><th>Descrição</th><th>Data Realização</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    // --- CORREÇÃO: GRÁFICOS REATIVADOS ---
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
    const statusEl = document.getElementById('demand-status');
    if (!statusEl) return;
    
    const status = statusEl.value;
    
    // Grupos (Divs)
    const grpReal = document.getElementById('group-demand-realization-date');
    const grpJust = document.getElementById('group-demand-justification');
    
    // Inputs (para required)
    const inpReal = document.getElementById('demand-realization-date');
    const inpJust = document.getElementById('demand-justification');

    // RESET: Esconde tudo e remove required
    if(grpReal) grpReal.style.display = 'none';
    if(grpJust) grpJust.style.display = 'none';
    if(inpReal) inpReal.required = false;
    if(inpJust) inpJust.required = false;

    // LÓGICA
    if (status === 'Realizada') {
        if(grpReal) grpReal.style.display = 'block';
        if(inpReal) inpReal.required = true;
    } else if (status === 'Inviável') {
        if(grpJust) grpJust.style.display = 'block';
        if(inpJust) inpJust.required = true;
    }
}
function showDemandModal(id = null) {
    editingId = id;
    document.getElementById('demand-form').reset();

    // 1. Reseta o contador de caracteres visualmente
    if(document.getElementById('demand-char-counter')) {
        document.getElementById('demand-char-counter').textContent = '0 / 250';
    }

    // 2. Preenchimento em caso de Edição
    if (id) {
        const d = demands.find(x => x.id === id);
        if (d) {
            document.getElementById('demand-date').value = d.date;
            document.getElementById('demand-description').value = d.description;
            document.getElementById('demand-priority').value = d.priority;
            document.getElementById('demand-status').value = d.status;

            // Atualiza o contador com o tamanho da descrição atual
            if(document.getElementById('demand-char-counter')) {
                const tamanhoAtual = d.description ? d.description.length : 0;
                document.getElementById('demand-char-counter').textContent = tamanhoAtual + ' / 250';
            }

            // Campos condicionais (Data Realização e Justificativa)
            if(document.getElementById('demand-realization-date')) {
                document.getElementById('demand-realization-date').value = d.dateRealization || '';
            }
            if(document.getElementById('demand-justification')) {
                document.getElementById('demand-justification').value = d.justification || '';
            }
        }
    }

    // 3. Ajusta a visibilidade dos campos com base no status carregado
    handleDemandStatusChange();
    
    // 4. Abre o modal
    document.getElementById('demand-modal').classList.add('show');
}

function saveDemand(e) {
    e.preventDefault();
    const status = document.getElementById('demand-status').value;
    const dateReal = document.getElementById('demand-realization-date').value;
    // Sanitiza justificativa aqui para validar se está vazia depois
    const justif = sanitizeInput(document.getElementById('demand-justification').value.trim());

    if (status === 'Realizada' && !dateReal) {
        alert('Para status "Realizada", a Data de Realização é obrigatória.'); return;
    }
    if (status === 'Inviável' && !justif) {
        alert('Para status "Inviável", a Justificativa é obrigatória.'); return;
    }
    
    const data = {
        date: document.getElementById('demand-date').value,
        // SANITIZAÇÃO AQUI:
        description: sanitizeInput(document.getElementById('demand-description').value),
        justification: justif,
        
        priority: document.getElementById('demand-priority').value,
        status: status,
        dateRealization: dateReal,
        user: currentUser.name
    };

    if (editingId) {
        const i = demands.findIndex(x => x.id === editingId);
        if (i !== -1) demands[i] = { ...demands[i], ...data };
    } else {
        demands.push({ id: getNextId('dem'), ...data });
    }
    salvarNoArmazenamento('demands', demands);
    document.getElementById('demand-modal').classList.remove('show');
    clearDemandFilters();
    
    // AUDITORIA
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Demandas', `Prioridade: ${data.priority} | Desc: ${data.description.substring(0,30)}...`);
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
                <td class="text-primary-cell">${d.user || '-'}</td> <td style="text-align:center;">${formatDate(d.date)}</td>
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
        const dDel = demands.find(x => x.id === id);
if(dDel) logSystemAction('Exclusão', 'Demandas', `Demanda excluída (ID ${id})`);
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
    const statusEl = document.getElementById('visit-status');
    if (!statusEl) return;
    
    const status = statusEl.value;
    
    // Grupos (Divs)
    const grpReal = document.getElementById('group-visit-date-realization');
    const grpJust = document.getElementById('group-visit-justification');
    
    // Inputs (para required)
    const inpReal = document.getElementById('visit-date-realization');
    const inpJust = document.getElementById('visit-justification');

    // RESET
    if(grpReal) grpReal.style.display = 'none';
    if(grpJust) grpJust.style.display = 'none';
    
    if(inpReal) inpReal.required = false;
    if(inpJust) inpJust.required = false;

    // LÓGICA
    if (status === 'Realizada') {
        if(grpReal) grpReal.style.display = 'block';
        if(inpReal) inpReal.required = true;
    } else if (status === 'Cancelada') {
        if(grpJust) grpJust.style.display = 'block';
        if(inpJust) inpJust.required = true;
    }
}
function showVisitModal(id = null) {
    editingId = id;
    document.getElementById('visit-form').reset();
    
    // 1. Reseta contadores visuais
    if(document.getElementById('visit-reason-counter')) 
        document.getElementById('visit-reason-counter').textContent = '0 / 200';
    if(document.getElementById('visit-justification-counter')) 
        document.getElementById('visit-justification-counter').textContent = '0 / 200';

    // 2. Popula dropdown com Nome - UF
    const munSelect = document.getElementById('visit-municipality');
    if (munSelect) {
        const sortedList = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));
        munSelect.innerHTML = '<option value="">Selecione o município</option>' + 
                              sortedList.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
    }

    // 3. Configura listener de status
    const statusSel = document.getElementById('visit-status');
    if(statusSel) statusSel.onchange = handleVisitStatusChange;

    // 4. Preenchimento (Edição)
    if (id) {
        const v = visits.find(x => x.id === id);
        if(v) {
            document.getElementById('visit-municipality').value = v.municipality;
            document.getElementById('visit-date').value = v.date;
            document.getElementById('visit-applicant').value = v.applicant;
            document.getElementById('visit-reason').value = v.reason || '';
            document.getElementById('visit-status').value = v.status;
            
            // Atualiza contador do Motivo
            if(document.getElementById('visit-reason-counter')) {
                const len = v.reason ? v.reason.length : 0;
                document.getElementById('visit-reason-counter').textContent = len + ' / 200';
            }
            
            // Campos Condicionais
            if(document.getElementById('visit-date-realization')) 
                document.getElementById('visit-date-realization').value = v.dateRealization || '';
            
            if(document.getElementById('visit-justification')) {
                document.getElementById('visit-justification').value = v.justification || '';
                // Atualiza contador da Justificativa
                if(document.getElementById('visit-justification-counter')) {
                    const lenJ = v.justification ? v.justification.length : 0;
                    document.getElementById('visit-justification-counter').textContent = lenJ + ' / 200';
                }
            }
            
            handleVisitStatusChange();
        }
    } else {
        handleVisitStatusChange();
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
        // SANITIZAÇÃO AQUI:
        applicant: sanitizeInput(document.getElementById('visit-applicant').value),
        reason: sanitizeInput(document.getElementById('visit-reason').value),
        justification: sanitizeInput(document.getElementById('visit-justification').value),
        
        status: status,
        dateRealization: document.getElementById('visit-date-realization').value
    };

    if (editingId) {
        const i = visits.findIndex(x => x.id === editingId);
        visits[i] = { ...visits[i], ...data };
    } else {
        visits.push({ id: getNextId('visit'), ...data });
    }
    
    salvarNoArmazenamento('visits', visits);
    document.getElementById('visit-modal').classList.remove('show');
    clearVisitFilters(); 
    
    // AUDITORIA
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Visitas', `Para: ${data.municipality} | Motivo: ${data.reason}`);
    showToast('Visita salva com sucesso!', 'success');
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
    // 1. Captura Filtros
    const fMun = document.getElementById('filter-visit-municipality')?.value;
    const fStatus = document.getElementById('filter-visit-status')?.value;
    const fApp = document.getElementById('filter-visit-applicant')?.value.toLowerCase();
    const fSolStart = document.getElementById('filter-visit-sol-start')?.value;
    const fSolEnd = document.getElementById('filter-visit-sol-end')?.value;
    const fRealStart = document.getElementById('filter-visit-real-start')?.value;
    const fRealEnd = document.getElementById('filter-visit-real-end')?.value;

    // 2. Filtragem
    let filtered = visits.filter(function(v) {
        if (fMun && v.municipality !== fMun) return false;
        if (fStatus && v.status !== fStatus) return false;
        if (fApp && !v.applicant.toLowerCase().includes(fApp)) return false;
        if (fSolStart && v.date < fSolStart) return false;
        if (fSolEnd && v.date > fSolEnd) return false;
        if (fRealStart && (!v.dateRealization || v.dateRealization < fRealStart)) return false;
        if (fRealEnd && (!v.dateRealization || v.dateRealization > fRealEnd)) return false;
        return true;
    });

    // Ordenação
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Renderização
    const c = document.getElementById('visits-table');
    
    if(document.getElementById('visits-results-count')) {
        document.getElementById('visits-results-count').innerHTML = '<strong>' + filtered.length + '</strong> visitas encontradas';
        document.getElementById('visits-results-count').style.display = 'block';
    }

    // Estatísticas
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
            
            // Tratamento de textos longos
            const motivo = v.reason ? (v.reason.length > 40 ? `<span title="${v.reason}">${v.reason.substring(0,40)}...</span>` : v.reason) : '-';
            const justif = v.justification ? (v.justification.length > 30 ? `<span title="${v.justification}">${v.justification.substring(0,30)}...</span>` : v.justification) : '-';

            // --- CORREÇÃO: Busca UF na lista mestra ---
            const munData = municipalitiesList.find(m => m.name === v.municipality);
            const munDisplay = munData ? `${v.municipality} - ${munData.uf}` : v.municipality;

            return `<tr>
                <td class="text-primary-cell">${munDisplay}</td>
                <td style="text-align:center;">${formatDate(v.date)}</td>
                <td>${v.applicant}</td>
                <td style="font-size:12px;">${motivo}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td style="text-align:center;">${formatDate(v.dateRealization)}</td>
                <td class="text-secondary-cell">${justif}</td>
                <td style="text-align:center;">
                    <button class="btn btn--sm" onclick="showVisitModal(${v.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteVisit(${v.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table>
            <thead>
                <th>Município</th>
                <th style="text-align:center;">Data Solic.</th>
                <th>Solicitante</th>
                <th>Motivo da Visita</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Data Realiz.</th>
                <th>Justificativa</th>
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
        const vDel = visits.find(x => x.id === id);
if(vDel) logSystemAction('Exclusão', 'Visitas', `Visita excluída de ${vDel.municipality}`);
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
    const sendDateVal = document.getElementById('production-send-date').value;
    
    // Validação Data Futura
    if (sendDateVal) {
        const hoje = new Date().toISOString().split('T')[0];
        if (sendDateVal > hoje) {
            alert('Erro: A Data de Envio não pode ser uma data futura.');
            return;
        }
    }

    // Se diário, período é vazio. Senão, pega o valor sanitizado.
    const period = (freq === 'Diário') ? '' : sanitizeInput(document.getElementById('production-period').value);

    const data = {
        municipality: document.getElementById('production-municipality').value,
        frequency: freq,
        status: document.getElementById('production-status').value,
        releaseDate: document.getElementById('production-release-date').value,
        sendDate: sendDateVal,
        
        // SANITIZAÇÃO AQUI:
        contact: sanitizeInput(document.getElementById('production-contact').value),
        competence: sanitizeInput(document.getElementById('production-competence').value),
        period: period,
        professional: sanitizeInput(document.getElementById('production-professional').value),
        observations: sanitizeInput(document.getElementById('production-observations').value)
    };

    if (editingId) {
        const i = productions.findIndex(x => x.id === editingId);
        if (i !== -1) productions[i] = { ...productions[i], ...data };
    } else {
        productions.push({ id: getNextId('prod'), ...data });
    }
    
    salvarNoArmazenamento('productions', productions);
    document.getElementById('production-modal').classList.remove('show');
    clearProductionFilters();
    
    // AUDITORIA
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Produção', `Para: ${data.municipality} | Frequência: ${data.frequency}`);
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
    // 1. Captura Filtros
    const fMun = document.getElementById('filter-production-municipality')?.value;
    const fStatus = document.getElementById('filter-production-status')?.value;
    const fProf = document.getElementById('filter-production-professional')?.value.toLowerCase();
    const fFreq = document.getElementById('filter-production-frequency')?.value;
    const fRelStart = document.getElementById('filter-production-release-start')?.value;
    const fRelEnd = document.getElementById('filter-production-release-end')?.value;
    const fSendStart = document.getElementById('filter-production-send-start')?.value;
    const fSendEnd = document.getElementById('filter-production-send-end')?.value;
    
    // 2. Filtragem
    let filtered = productions.filter(p => {
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

    // 3. Renderização
    const c = document.getElementById('productions-table');
    
    if(document.getElementById('productions-results-count')) {
        document.getElementById('productions-results-count').innerHTML = `<strong>${filtered.length}</strong> envios encontrados`;
        document.getElementById('productions-results-count').style.display = 'block';
    }
    
    // Atualiza Estatísticas
    if(document.getElementById('total-productions')) document.getElementById('total-productions').textContent = productions.length;
    if(document.getElementById('sent-productions')) document.getElementById('sent-productions').textContent = filtered.filter(p => p.status === 'Enviada').length;
    if(document.getElementById('pending-productions')) document.getElementById('pending-productions').textContent = filtered.filter(p => p.status === 'Pendente').length;
    if(document.getElementById('cancelled-productions')) document.getElementById('cancelled-productions').textContent = filtered.filter(p => p.status === 'Cancelada').length;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum envio encontrado.</div>';
    } else {
        const rows = filtered.map(p => {
            let statusClass = 'task-status';
            if (p.status === 'Enviada') statusClass += ' completed';
            else if (p.status === 'Cancelada') statusClass += ' cancelled';
            else statusClass += ' pending';
            
            let freqColor = '#003d5c';
            if (p.frequency === 'Diário') freqColor = '#C85250';
            else if (p.frequency === 'Semanal') freqColor = '#E68161';
            else if (p.frequency === 'Quinzenal') freqColor = '#79C2A9';
            else if (p.frequency === 'Mensal') freqColor = '#005580';
            
            const freqBadge = `<span style="color:${freqColor}; font-weight:bold;">${p.frequency}</span>`;

            // Busca UF na lista mestra
            const munData = municipalitiesList.find(m => m.name === p.municipality);
            const munDisplay = munData ? `${p.municipality} - ${munData.uf}` : p.municipality;

            return `<tr>
                <td class="text-primary-cell">${munDisplay}</td>
                <td>${p.professional || '-'}</td>
                <td>${p.contact || '-'}</td> <td>${freqBadge}</td>
                <td>${p.competence}</td>
                <td>${p.frequency === 'Diário' ? '-' : (p.period || '-')}</td>
                <td style="text-align:center;">${formatDate(p.releaseDate)}</td>
                <td style="text-align:center;"><span class="${statusClass}">${p.status}</span></td>
                <td style="text-align:center;">${formatDate(p.sendDate)}</td>
                <td class="text-secondary-cell">${p.observations || '-'}</td>
                <td style="text-align:center;">
                    <button class="btn btn--sm" onclick="showProductionModal(${p.id})" title="Editar">✏️</button>
                    <button class="btn btn--sm" onclick="deleteProduction(${p.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `
        <table>
            <thead>
                <th>Município</th>
                <th>Profissional</th>
                <th>Contato</th> <th>Frequência</th>
                <th>Competência</th>
                <th>Período</th>
                <th style="text-align:center;">Liberação</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Envio</th>
                <th>Obs</th>
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
        const pDel = productions.find(x => x.id === id);
if(pDel) logSystemAction('Exclusão', 'Produção', `Envio excluído de ${pDel.municipality}`);
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
function showUserModal(id = null) {
    const m = document.getElementById('user-modal');
    document.getElementById('user-form').reset();
    editingId = id;
    
    // Controle do campo Login (não edita se já existir)
    document.getElementById('user-login').disabled = false;

    if (id) {
        const u = users.find(x => x.id === id);
        if (u) {
            document.getElementById('user-login').value = u.login;
            document.getElementById('user-login').disabled = true;
            document.getElementById('user-name').value = u.name;
            // NOVO CAMPO:
            document.getElementById('user-email').value = u.email || ''; 
            document.getElementById('user-permission').value = u.permission;
            document.getElementById('user-status').value = u.status;
            document.getElementById('user-password').required = false; // Senha opcional na edição
        }
    } else {
        document.getElementById('user-password').required = true; // Senha obrigatória no cadastro
    }
    m.classList.add('show');
}
function saveUser(e) {
    e.preventDefault();
    // Sanitiza Login
    const login = sanitizeInput(document.getElementById('user-login').value.trim().toUpperCase());
    
    // Validação Duplicidade
    const loginJaExiste = users.some(u => u.login === login && u.id !== editingId);
    if (loginJaExiste) {
        alert('Erro: Este Login já está sendo utilizado por outro usuário.');
        return;
    }

    const data = {
        login: login,
        // SANITIZAÇÃO AQUI:
        name: sanitizeInput(document.getElementById('user-name').value),
        email: sanitizeInput(document.getElementById('user-email').value),
        permission: document.getElementById('user-permission').value,
        status: document.getElementById('user-status').value
    };
    // ... (restante da função saveUser com a senha e auditoria mantém igual) ...
    // Vou resumir para não ficar gigante, mantenha o bloco do 'if (!editingId)' igual ao que fizemos antes.
    
    if (!editingId) {
        data.id = getNextId('user');
        data.salt = generateSalt();
        data.passwordHash = hashPassword(document.getElementById('user-password').value, data.salt);
        users.push(data);
        logSystemAction('Criação', 'Usuários', `Novo usuário: ${data.login} (${data.permission})`);
    } else {
        const i = users.findIndex(u => u.id === editingId);
        if (i !== -1) {
            const oldUser = users[i];
            data.salt = oldUser.salt;
            data.passwordHash = oldUser.passwordHash;
            const newPass = document.getElementById('user-password').value;
            if (newPass) {
                data.salt = generateSalt();
                data.passwordHash = hashPassword(newPass, data.salt);
            }
            users[i] = { ...oldUser, ...data };
            logSystemAction('Edição', 'Usuários', `Editou usuário: ${data.login}`);
        }
    }
    
    salvarNoArmazenamento('users', users);
    document.getElementById('user-modal').classList.remove('show');
    renderUsers();
    showToast('Usuário salvo com sucesso!', 'success');
}

function renderUsers() { 
    // 1. Captura os valores dos 3 filtros
    const fName = document.getElementById('filter-user-name') ? document.getElementById('filter-user-name').value.toLowerCase() : '';
    const fLogin = document.getElementById('filter-user-login') ? document.getElementById('filter-user-login').value.toLowerCase() : '';
    const fStatus = document.getElementById('filter-user-status') ? document.getElementById('filter-user-status').value : '';

    // 2. Aplica a lógica de filtragem (Nome E Login E Status)
    const filteredUsers = users.filter(u => {
        // Filtro de Nome
        if (fName && !u.name.toLowerCase().includes(fName)) return false;
        // Filtro de Login
        if (fLogin && !u.login.toLowerCase().includes(fLogin)) return false;
        // Filtro de Status (Exato)
        if (fStatus && u.status !== fStatus) return false;
        
        return true;
    });

    const c = document.getElementById('users-table'); 
    
    // --- ATUALIZAÇÃO DOS CONTADORES (Baseado no TOTAL DO SISTEMA) ---
    if (document.getElementById('total-users')) document.getElementById('total-users').textContent = users.length;
    if (document.getElementById('active-users')) document.getElementById('active-users').textContent = users.filter(u => u.status === 'Ativo').length;
    if (document.getElementById('inactive-users')) document.getElementById('inactive-users').textContent = users.filter(u => u.status !== 'Ativo').length;
    
    // Exibe contador de resultados da busca
    if (document.getElementById('users-total-display')) {
        const display = document.getElementById('users-total-display');
        display.style.display = 'block';
        display.innerHTML = `<strong>${filteredUsers.length}</strong> usuário(s) encontrado(s)`;
    }

    // 3. Renderiza a tabela com os dados FILTRADOS
    if (filteredUsers.length === 0) { 
        c.innerHTML = '<div class="empty-state">Nenhum usuário encontrado com os filtros atuais.</div>'; 
        return; 
    } 
    
    // ... dentro do map em renderUsers ...
const rows = filteredUsers.map(u => 
    `<tr>
        <td class="text-primary-cell">${u.login}</td>
        <td class="text-primary-cell">${u.name}</td>
        <td>${u.email || '-'}</td> <td>${u.status}</td>
        <td>
            <button class="btn btn--sm" onclick="showUserModal(${u.id})" title="Editar">✏️</button>
            <button class="btn btn--sm" onclick="deleteUser(${u.id})" title="Excluir">🗑️</button>
        </td>
    </tr>`
).join(''); 

c.innerHTML = `<table><thead><th>Login</th><th>Nome</th><th>E-mail</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`; 
}

function clearUserFilters() {
    if(document.getElementById('filter-user-name')) document.getElementById('filter-user-name').value = '';
    if(document.getElementById('filter-user-login')) document.getElementById('filter-user-login').value = '';
    if(document.getElementById('filter-user-status')) document.getElementById('filter-user-status').value = '';
    renderUsers();
}

function deleteUser(id) { const u=users.find(x=>x.id===id); if(u.login==='ADMIN'){alert('Não pode excluir ADMIN');return;} if(confirm('Excluir?')){users=users.filter(x=>x.id!==id); salvarNoArmazenamento('users',users); renderUsers();}}
function closeUserModal(){document.getElementById('user-modal').classList.remove('show');}

// Cargos
// 1. Função para Abrir o Modal (Agora carregando a descrição ao editar)
function showCargoModal(id = null) {
    editingId = id;
    document.getElementById('cargo-form').reset();
    
    if (id) {
        const c = cargos.find(x => x.id === id);
        if (c) {
            document.getElementById('cargo-name').value = c.name;
            // Esta linha abaixo estava faltando para carregar a descrição existente:
            document.getElementById('cargo-description').value = c.description || ''; 
        }
    }
    document.getElementById('cargo-modal').classList.add('show');
}

// 2. Função para Salvar (Agora gravando a descrição)
function saveCargo(e) {
    e.preventDefault();
    const data = {
        name: sanitizeInput(document.getElementById('cargo-name').value),
        description: sanitizeInput(document.getElementById('cargo-description').value)
    };
    // ... (restante da função mantém igual, apenas com o logSystemAction adicionado se quiser)
    if (editingId) {
        const i = cargos.findIndex(x => x.id == editingId);
        if (i !== -1) cargos[i] = { ...cargos[i], ...data };
    } else {
        cargos.push({ id: getNextId('cargo'), ...data });
    }
    salvarNoArmazenamento('cargos', cargos);
    document.getElementById('cargo-modal').classList.remove('show');
    renderCargos();
    updateGlobalDropdowns(); 
    showToast('Cargo salvo com sucesso!', 'success');
}

function renderCargos() {
    const c = document.getElementById('cargos-table');
    const countDiv = document.getElementById('cargos-total');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`Total de Cargos/Funções cadastrados: <strong>${cargos.length}</strong>`; }
// --- NOVA LINHA: ORDENAÇÃO ALFABÉTICA ---
    cargos.sort((a, b) => a.name.localeCompare(b.name));
    // ----------------------------------------
    const r = cargos.map(x => 
        `<tr>
            <td class="text-primary-cell">${x.name}</td>
            <td class="text-secondary-cell">${x.description || '-'}</td> <td>
                <button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    c.innerHTML = `<table><thead><th>Cargo/Função</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteCargo(id){ if(confirm('Excluir?')){ cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}
function closeCargoModal(){document.getElementById('cargo-modal').classList.remove('show');}

// Orientadores
function showOrientadorModal(id=null){ 
    editingId=id; 
    document.getElementById('orientador-form').reset(); 
    if(id){
        const o=orientadores.find(x=>x.id===id); 
        document.getElementById('orientador-name').value=o.name; 
        document.getElementById('orientador-contact').value=o.contact;
        // NOVOS CAMPOS
        document.getElementById('orientador-email').value = o.email || '';
        document.getElementById('orientador-birthdate').value = o.birthDate || '';
    } 
    document.getElementById('orientador-modal').classList.add('show'); 
}

function renderOrientadores() {
    const c = document.getElementById('orientadores-table');
    const countDiv = document.getElementById('orientadores-total');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`Total de Colaboradores cadastrados: <strong>${orientadores.length}</strong>`; }

    const r = orientadores.map(x => 
        `<tr>
            <td class="text-primary-cell">${x.name}</td>
            <td class="text-secondary-cell">${x.email || '-'}</td> <td style="text-align:center;">${formatDate(x.birthDate)}</td> <td>${x.contact || '-'}</td>
            <td>
                <button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    c.innerHTML = `<table><thead><th>Nome do Colaborador</th><th>E-mail</th><th style="text-align:center;">Data Nasc.</th><th>Contato</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteOrientador(id){ if(confirm('Excluir?')){ orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}
function closeOrientadorModal(){document.getElementById('orientador-modal').classList.remove('show');}

// Módulos
function showModuloModal(id=null){ editingId=id; document.getElementById('modulo-form').reset(); const form=document.getElementById('modulo-form'); if(!document.getElementById('modulo-description')) { const div=document.createElement('div'); div.className='form-group'; div.innerHTML=`<label class="form-label">Descrição</label><textarea class="form-control" id="modulo-description"></textarea>`; form.insertBefore(div, form.querySelector('.modal-actions')); } if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name; if(document.getElementById('modulo-abbreviation')) document.getElementById('modulo-abbreviation').value=m.abbreviation; if(document.getElementById('modulo-description')) document.getElementById('modulo-description').value=m.description||'';} document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e){ 
    e.preventDefault(); 
    const data={
        name: sanitizeInput(document.getElementById('modulo-name').value), 
        abbreviation: sanitizeInput(document.getElementById('modulo-abbreviation').value), 
        description: sanitizeInput(document.getElementById('modulo-description').value)
    }; 
    // ... (restante igual)
    if(editingId){const i=modulos.findIndex(x=>x.id===editingId); modulos[i]={...modulos[i],...data};}else{modulos.push({id:getNextId('mod'),...data});} 
    salvarNoArmazenamento('modulos',modulos); 
    document.getElementById('modulo-modal').classList.remove('show'); 
    renderModulos(); 
    showToast('Salvo!');
}
function renderModulos() {
    const c = document.getElementById('modulos-table');
    const countDiv = document.getElementById('modulos-total');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`Total de Módulos cadastrados: <strong>${modulos.length}</strong>`; }
// --- NOVA LINHA: ORDENAÇÃO ALFABÉTICA ---
    modulos.sort((a, b) => a.name.localeCompare(b.name));
    // ----------------------------------------
    const r = modulos.map(m => 
        `<tr>
            <td class="text-primary-cell">${m.name}</td>
            <td style="text-align:center;">${m.abbreviation || '-'}</td>
            <td class="text-secondary-cell">${m.description || '-'}</td> <td>
                <button class="btn btn--sm" onclick="showModuloModal(${m.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteModulo(${m.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    c.innerHTML = `<table><thead><th>Módulo</th><th style="text-align:center;">Abrev.</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteModulo(id){ if(confirm('Excluir?')){ modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}
function closeModuloModal(){document.getElementById('modulo-modal').classList.remove('show');}

// Municípios Lista Mestra
function showMunicipalityListModal(id=null){ editingId=id; document.getElementById('municipality-list-form').reset(); if(id){const m=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=m.name; document.getElementById('municipality-list-uf').value=m.uf;} document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e){ e.preventDefault(); const data={name:document.getElementById('municipality-list-name').value, uf:document.getElementById('municipality-list-uf').value}; if(editingId){const i=municipalitiesList.findIndex(x=>x.id===editingId); municipalitiesList[i]={...municipalitiesList[i],...data};}else{municipalitiesList.push({id:getNextId('munList'),...data});} salvarNoArmazenamento('municipalitiesList',municipalitiesList); document.getElementById('municipality-list-modal').classList.remove('show'); renderMunicipalityList(); updateGlobalDropdowns(); showToast('Salvo!'); }

function renderMunicipalityList() {
    // Lógica do Novo Filtro
    const filterInput = document.getElementById('filter-municipality-list-name');
    const filterVal = filterInput ? filterInput.value.toLowerCase() : '';
    
    const filtered = municipalitiesList.filter(m => m.name.toLowerCase().includes(filterVal));
    
    // Ordena alfabeticamente
    filtered.sort((a,b) => a.name.localeCompare(b.name));

    const c = document.getElementById('municipalities-list-table');
    const countDiv = document.getElementById('municipalities-list-total');
    
    if(countDiv) { 
        countDiv.style.display = 'block'; 
        countDiv.innerHTML = `Total de Municípios cadastrados: <strong>${filtered.length}</strong>`; 
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município encontrado.</div>';
        return;
    }

    const r = filtered.map(m => 
        `<tr>
            <td class="text-primary-cell">${m.name}</td>
            <td>${m.uf}</td>
            <td>
                <button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    c.innerHTML = `<table><thead><th>Nome</th><th>UF</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteMunicipalityList(id){ if(confirm('Excluir?')){ municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}
function closeMunicipalityListModal() { document.getElementById('municipality-list-modal').classList.remove('show'); }

// Formas
function showFormaApresentacaoModal(id=null){ editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){const f=formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value=f.name;} document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e){ e.preventDefault(); const data={name:document.getElementById('forma-apresentacao-name').value}; if(editingId){const i=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[i]={...formasApresentacao[i],...data};}else{formasApresentacao.push({id:getNextId('forma'),...data});} salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }

function renderFormas() {
    const c = document.getElementById('formas-apresentacao-table');
    const countDiv = document.getElementById('formas-apresentacao-total');
    if(countDiv) { countDiv.style.display='block'; countDiv.innerHTML=`<strong>${formasApresentacao.length}</strong> Formas cadastradas`; }

    // --- NOVA LINHA: ORDENAÇÃO ALFABÉTICA ---
    formasApresentacao.sort((a, b) => a.name.localeCompare(b.name));
    // ----------------------------------------

    const r = formasApresentacao.map(f => 
        `<tr>
            <td class="text-primary-cell">${f.name}</td>
            <td>
                <button class="btn btn--sm" onclick="showFormaApresentacaoModal(${f.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteForma(${f.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    c.innerHTML = `<table><thead><th>Forma</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteForma(id){ if(confirm('Excluir?')){ formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}
function closeFormaApresentacaoModal() { document.getElementById('forma-apresentacao-modal').classList.remove('show'); }

// ----------------------------------------------------------------------------
// 19. BACKUP E RESTORE (COM PREVIEW COMPLETO)
// ----------------------------------------------------------------------------

function updateBackupInfo() {
    // 1. Treinamentos
    if(document.getElementById('backup-info-trainings')) {
        document.getElementById('backup-info-trainings').textContent = tasks.length;
    }

    // 2. Municípios
    if(document.getElementById('backup-info-municipalities')) {
        document.getElementById('backup-info-municipalities').textContent = municipalities.length;
    }

    // 3. Cargos/Funções
    if(document.getElementById('backup-info-cargos')) {
        document.getElementById('backup-info-cargos').textContent = cargos.length;
    }

    // 4. COLABORADORES (ID atualizado e variável interna mantida)
    if(document.getElementById('backup-info-colaboradores')) {
        document.getElementById('backup-info-colaboradores').textContent = orientadores.length;
    }

    // 5. Módulos
    if(document.getElementById('backup-info-modules')) {
        document.getElementById('backup-info-modules').textContent = modulos.length;
    }

    // 6. Usuários
    if(document.getElementById('backup-info-users')) {
        document.getElementById('backup-info-users').textContent = users.length;
    }
}

function createBackup(filenamePersonalizado = null) {
    // 1. Coleta todos os dados atuais
    const backupData = { 
        version: "v25.0", 
        date: new Date().toISOString(), 
        data: { 
            users: users, 
            municipalities: municipalities, 
            municipalitiesList: municipalitiesList, 
            tasks: tasks, 
            requests: requests, 
            demands: demands, 
            visits: visits, 
            productions: productions, 
            presentations: presentations, 
            systemVersions: systemVersions, 
            cargos: cargos, 
            orientadores: orientadores, 
            modulos: modulos, 
            formasApresentacao: formasApresentacao, 
            counters: counters,
            auditLogs: auditLogs,
            integrations: integrations,
            apisList: apisList,
        } 
    };
    
    // 2. Gera o Timestamp (Data + Hora) para versionamento
    const now = new Date();
    const timestamp = now.getFullYear() + '-' +
                     String(now.getMonth()+1).padStart(2,'0') + '-' +
                     String(now.getDate()).padStart(2,'0') + '_' +
                     String(now.getHours()).padStart(2,'0') + 'h' +
                     String(now.getMinutes()).padStart(2,'0');

    // 3. Define o nome do arquivo
    const filename = filenamePersonalizado 
        ? `${filenamePersonalizado}.json` 
        : `backup_sigp_${timestamp}.json`;

    // 4. Gera o Download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", filename);
    document.body.appendChild(dl); 
    dl.click(); 
    dl.remove();
    
    if(!filenamePersonalizado) {
        showToast('Backup (Versão ' + timestamp + ') baixado com sucesso!', 'success');
    }
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
            if (!backup.data) { alert('Arquivo de backup inválido.'); return; }
            
            // Salva os dados na variável temporária para usar no botão "Confirmar"
            pendingBackupData = backup;
            
            const list = document.getElementById('restore-preview-list');
            if(list) {
                list.innerHTML = ''; // Limpa a lista anterior
                const d = backup.data;

                // --- CONFIGURAÇÃO DOS NOMES E DADOS ---
                // Aqui definimos o nome que aparece na tela e onde buscar os dados
                const mapa = [
                    { label: 'Treinamentos', dados: d.tasks || d.trainings },
                    { label: 'Municípios Clientes', dados: d.municipalities },
                    { label: 'Lista Mestra de Municípios', dados: d.municipalitiesList },
                    { label: 'Solicitações/Sugestões de Clientes', dados: d.requests },
                    { label: 'Apresentações do Software', dados: d.presentations },
                    { label: 'Demandas do Suporte', dados: d.demands },
                    { label: 'Visitas Presenciais', dados: d.visits },
                    { label: 'Envios de Produção', dados: d.productions },
                    { label: 'Cargos/Funções', dados: d.cargos },
                    { label: 'Colaboradores', dados: d.orientadores },
                    { label: 'Módulos do Sistema', dados: d.modulos || d.modules },
                    { label: 'Formas de Apresentação', dados: d.formasApresentacao },
                    { label: 'Usuários do Sistema', dados: d.users },
                    { label: 'Integrações', dados: d.integrations },
                    { label: 'Lista de APIs', dados: d.apisList }
                ];

                // Gera a lista na tela
                mapa.forEach(item => {
                    const qtd = item.dados ? item.dados.length : 0;
                    const textoResultado = qtd === 1 ? 'Resultado encontrado' : 'Resultados encontrados';
                    
                    // Cria o item da lista (li)
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>- ${item.label}:</strong> ${qtd} ${textoResultado}`;
                    list.appendChild(li);
                });
            }
            
            // Abre o modal
            document.getElementById('restore-confirm-modal').classList.add('show');
            
        } catch (err) { 
            console.error(err);
            alert('Erro ao ler o arquivo. Verifique se é um backup válido.'); 
        }
    };
    reader.readAsText(file);
    
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se cancelar
    event.target.value = ''; 
}

function closeRestoreConfirmModal() {
    // 1. Fecha o modal removendo a classe que o exibe
    document.getElementById('restore-confirm-modal').classList.remove('show');
    
    // 2. Limpa os dados temporários da memória
    pendingBackupData = null;
    
    // 3. Limpa a lista visual para não duplicar na próxima vez
    const list = document.getElementById('restore-preview-list');
    if(list) list.innerHTML = '';

    // 4. Limpa o input de arquivo para permitir selecionar o mesmo arquivo novamente se quiser
    const fileInput = document.getElementById('backup-file-input');
    if(fileInput) fileInput.value = '';
}

function confirmRestore() {
    if (!pendingBackupData) return;
    
    // =================================================================
    // SEGURANÇA: BACKUP AUTOMÁTICO ANTES DE SOBRESCREVER
    // =================================================================
    // Isso garante que, se o usuário restaurar o arquivo errado,
    // ele terá uma cópia do que existia no sistema até 1 segundo atrás.
    try {
        const agora = new Date();
        const timeTag = String(agora.getHours()).padStart(2,'0') + 'h' + String(agora.getMinutes()).padStart(2,'0');
        const nomeSeguranca = `AUTO-BACKUP_antes_de_restaurar_${timeTag}`;
        
        // Chama a função de backup forçando esse nome especial
        createBackup(nomeSeguranca);
        
        alert('🛡️ SISTEMA DE SEGURANÇA:\n\nUm backup automático dos seus dados atuais foi baixado para a pasta Downloads ("' + nomeSeguranca + '").\n\nIsso garante que você possa desfazer essa ação se necessário.');
        
    } catch (err) {
        console.error("Erro ao criar backup de segurança:", err);
        if(!confirm("Erro ao gerar backup de segurança automático. Deseja continuar mesmo assim? (Dados atuais serão perdidos)")) {
            return;
        }
    }
    // =================================================================

    const d = pendingBackupData.data; // Atalho para os novos dados
    
    // 1. Limpa tudo atual
    localStorage.clear();
    
    // 2. Função auxiliar segura
    const safeSave = (key, value, defaultVal = []) => {
        localStorage.setItem(key, JSON.stringify(value || defaultVal));
    };
    
    // 3. Restaura Item por Item
    safeSave('users', d.users);
    safeSave('municipalities', d.municipalities);
    safeSave('municipalitiesList', d.municipalitiesList);
    safeSave('tasks', d.tasks || d.trainings); 
    safeSave('requests', d.requests);
    safeSave('demands', d.demands);
    safeSave('visits', d.visits);
    safeSave('productions', d.productions);
    safeSave('presentations', d.presentations);
    safeSave('systemVersions', d.systemVersions);
    safeSave('cargos', d.cargos);
    safeSave('orientadores', d.orientadores);
    safeSave('modulos', d.modules || d.modulos);
    safeSave('formasApresentacao', d.formasApresentacao);
    safeSave('integrations', d.integrations);
    safeSave('apisList', d.apisList);
    safeSave('auditLogs', d.auditLogs);
    
    if (d.counters) {
        localStorage.setItem('counters', JSON.stringify(d.counters));
    }

    // 4. Auditoria da Ação
    // (Precisamos salvar manualmente no array e no localStorage agora, pois o reload vem a seguir)
    // Mas como vamos dar reload, o log se perderia se não salvo no storage novo.
    // Vamos adicionar um log no novo banco:
    let newLogs = d.auditLogs || [];
    newLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.name : 'Admin',
        action: 'Restauração',
        target: 'Sistema Completo',
        details: 'Restaurou backup de: ' + (pendingBackupData.date || 'Data desconhecida')
    });
    localStorage.setItem('auditLogs', JSON.stringify(newLogs));

    // 5. Feedback e Reload
    alert('✅ Restauração realizada com sucesso!\nO sistema será reiniciado com os novos dados.');
    location.reload();
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

// Variáveis globais para as instâncias dos gráficos
let chartInstanceEvo = null; 
let chartInstance1 = null;   
let chartInstance2 = null;   
let chartInstance3 = null;   
let chartInstance4 = null;   
let chartInstanceUser = null; 
let chartInstanceColab = null; 

function initializeDashboardCharts() {
    if (!window.Chart) return;

    // ============================================================
    // 0. EVOLUÇÃO DE IMPLANTAÇÕES (CORES INTERCALADAS)
    // ============================================================
    const ctxEvo = document.getElementById('chartEvolution');
    if (ctxEvo) {
        if (chartInstanceEvo) chartInstanceEvo.destroy();
        
        const dataMap = {};
        municipalities.forEach(m => {
            if (m.implantationDate) {
                const y = m.implantationDate.split('-')[0];
                dataMap[y] = (dataMap[y] || 0) + 1;
            }
        });
        
        const years = Object.keys(dataMap).sort();
        
        // LÓGICA DE CORES INTERCALADAS (Azul Escuro / Azul Claro)
        const backgroundColors = years.map((_, index) => {
            return index % 2 === 0 ? '#005580' : '#4080bf'; // Par = Escuro, Ímpar = Claro
        });
        
        chartInstanceEvo = new Chart(ctxEvo, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Novas Implantações',
                    data: years.map(y => dataMap[y]),
                    backgroundColor: backgroundColors, // Usa a lista de cores criada acima
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    // ============================================================
    // 1. SAÚDE DA CARTEIRA (Rosca)
    // ============================================================
    const ctx1 = document.getElementById('chartMunicipalityStatus');
    if (ctx1) {
        if (chartInstance1) chartInstance1.destroy();
        const statusCounts = { 'Em uso': 0, 'Bloqueado': 0, 'Parou de usar': 0, 'Não Implantado': 0 };
        municipalities.forEach(m => { if (statusCounts[m.status] !== undefined) statusCounts[m.status]++; });

        chartInstance1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#005580', '#C85250', '#E68161', '#79C2A9'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
    }

    // ============================================================
    // 2. PRODUTIVIDADE (12 MESES)
    // ============================================================
    const ctx2 = document.getElementById('chartProductivity');
    if (ctx2) {
        if (chartInstance2) chartInstance2.destroy();
        const labelsMeses = [];
        const dadosTreinamentos = [];
        const dadosVisitas = [];
        
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().substring(0, 7);
            labelsMeses.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
            dadosTreinamentos.push(tasks.filter(t => t.status === 'Concluído' && t.datePerformed && t.datePerformed.startsWith(key)).length);
            dadosVisitas.push(visits.filter(v => v.status === 'Realizada' && v.dateRealization && v.dateRealization.startsWith(key)).length);
        }

        chartInstance2 = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: labelsMeses,
                datasets: [
                    { label: 'Treinamentos', data: dadosTreinamentos, borderColor: '#005580', tension: 0.4 },
                    { label: 'Visitas', data: dadosVisitas, borderColor: '#E68161', tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // ============================================================
    // 3. TOP MÓDULOS (COMPLETO)
    // ============================================================
    const ctx3 = document.getElementById('chartTopModules');
    if (ctx3) {
        if (chartInstance3) chartInstance3.destroy();
        const modMap = {};
        municipalities.forEach(m => {
            if (m.modules && Array.isArray(m.modules)) m.modules.forEach(mod => { modMap[mod] = (modMap[mod] || 0) + 1; });
        });
        const sortedMods = Object.entries(modMap).sort((a,b) => b[1] - a[1]);
        
        chartInstance3 = new Chart(ctx3, {
            type: 'bar',
            indexAxis: 'y',
            data: {
                labels: sortedMods.map(i => i[0]),
                datasets: [{ label: 'Clientes', data: sortedMods.map(i => i[1]), backgroundColor: '#005580', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // ============================================================
    // 4. GARGALOS DE SUPORTE
    // ============================================================
    const ctx4 = document.getElementById('chartSupportBacklog');
    if (ctx4) {
        if (chartInstance4) chartInstance4.destroy();
        const reqPen = requests.filter(r => r.status === 'Pendente').length;
        const demPen = demands.filter(d => d.status === 'Pendente').length;
        const reqRea = requests.filter(r => r.status === 'Realizado').length;
        const demRea = demands.filter(d => d.status === 'Realizada').length;

        chartInstance4 = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: ['Solicitações', 'Demandas'],
                datasets: [
                    { label: 'Pendente', data: [reqPen, demPen], backgroundColor: '#C85250' },
                    { label: 'Resolvido', data: [reqRea, demRea], backgroundColor: '#79C2A9' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // ============================================================
    // 5. DEMANDAS POR USUÁRIO
    // ============================================================
    const ctxUser = document.getElementById('chartDemandsByUser');
    if (ctxUser) {
        if (chartInstanceUser) chartInstanceUser.destroy();
        const userMap = {};
        demands.forEach(d => { const uName = d.user || 'N/D'; userMap[uName] = (userMap[uName] || 0) + 1; });
        const sortedUsers = Object.entries(userMap).sort((a,b) => b[1] - a[1]);

        chartInstanceUser = new Chart(ctxUser, {
            type: 'bar',
            data: {
                labels: sortedUsers.map(i => i[0]),
                datasets: [{ label: 'Demandas', data: sortedUsers.map(i => i[1]), backgroundColor: CHART_COLORS, borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // ============================================================
    // 6. TREINAMENTOS POR COLABORADOR
    // ============================================================
    const ctxColab = document.getElementById('chartTrainingByColab');
    if (ctxColab) {
        if (chartInstanceColab) chartInstanceColab.destroy();
        const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const colabMap = {};
        tasks.forEach(t => {
            if (t.status === 'Concluído' && t.datePerformed) {
                const dPerf = new Date(t.datePerformed);
                if (dPerf >= oneYearAgo) { const colab = t.performedBy || 'N/D'; colabMap[colab] = (colabMap[colab] || 0) + 1; }
            }
        });
        const sortedColabs = Object.entries(colabMap).sort((a,b) => b[1] - a[1]);

        chartInstanceColab = new Chart(ctxColab, {
            type: 'bar',
            data: {
                labels: sortedColabs.map(i => i[0]),
                datasets: [{ label: 'Treinamentos', data: sortedColabs.map(i => i[1]), backgroundColor: '#E68161', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }
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

// 1. FILTRO DE MUNICÍPIOS (Geral e Integrações)
    const munFilterIds = [
        'filter-municipality-name',
        'filter-task-municipality',
        'filter-request-municipality',
        'filter-presentation-municipality',
        'filter-visit-municipality',
        'filter-production-municipality',
        'filter-integration-municipality' // <--- Foco aqui
    ];

    if (typeof municipalitiesList !== 'undefined' && municipalitiesList.length > 0) {
        // Ordena
        const sortedMun = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));
        
        munFilterIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const currentVal = el.value;
                // Recria o HTML mantendo a opção "Todos"
                el.innerHTML = '<option value="">Todos</option>' + 
                               sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
                if (currentVal) el.value = currentVal;
                
                // Adiciona o evento de refresh se for o filtro da integração
                if (id === 'filter-integration-municipality') {
                    el.onchange = renderIntegrations;
                }
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

// 5. FILTRO DE API INTEGRADA (Específico da aba)
    const apiFilterEl = document.getElementById('filter-integration-api');
    
    // Verifica se o elemento existe E se a lista de APIs tem dados
    if (apiFilterEl && typeof apisList !== 'undefined') {
        const curApi = apiFilterEl.value;
        const sortedApis = apisList.slice().sort((a,b) => a.name.localeCompare(b.name));
        
        apiFilterEl.innerHTML = '<option value="">Todas</option>' + 
                                sortedApis.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
        
        if (curApi) apiFilterEl.value = curApi;
        
        // Garante que ao mudar, a tabela atualize
        apiFilterEl.onchange = renderIntegrations;
    }

    // 6. Listener para o Filtro de Status
    const statusFilter = document.getElementById('filter-integration-status');
    if (statusFilter) {
        statusFilter.onchange = renderIntegrations;
    }

// ============================================================================
// FUNÇÕES DE ATUALIZAÇÃO DE DROPDOWNS (FILTROS E FORMULÁRIOS)
// ============================================================================

// 1. ATUALIZA DROPDOWNS DOS MODAIS (FORMULÁRIOS DE CADASTRO)
function updateGlobalDropdowns() {
    
    // Lista de IDs dos selects de município dentro dos formulários
    const formMunSelects = [
        'task-municipality', 
        'request-municipality', 
        'visit-municipality', 
        'production-municipality', 
        'presentation-municipality', 
        'municipality-name',
        'integration-municipality' // Modal de integração
    ];

    // Prepara a lista ordenada (Nome - UF)
    // Verifica se a lista existe para evitar erros
    const listaMestra = (typeof municipalitiesList !== 'undefined') ? 
        municipalitiesList.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];

    // Preenche os selects de município nos formulários
    formMunSelects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value;
            // Modais de cadastro não tem opção "Todos", apenas "Selecione..."
            el.innerHTML = '<option value="">Selecione o município</option>' + 
                           listaMestra.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
            el.value = currentVal;
        }
    });

    // Preenche Cargos (Modal Treinamento)
    const cargoSelects = ['task-trained-position'];
    cargoSelects.forEach(id => { 
        const el = document.getElementById(id); 
        if(el) populateSelect(el, cargos, 'name', 'name'); 
    });

    // Preenche Colaboradores (Modal Treinamento)
    const colabSelects = ['task-performed-by'];
    colabSelects.forEach(id => { 
        const el = document.getElementById(id); 
        if(el) populateSelect(el, orientadores, 'name', 'name'); 
    });

    // CHAMA A FUNÇÃO QUE ATUALIZA OS FILTROS DAS TABELAS
    if (typeof populateFilterSelects === 'function') {
        populateFilterSelects();
    }
}

// 2. ATUALIZA OS FILTROS (TOPO DAS TABELAS) - TODAS AS ABAS
function populateFilterSelects() {
    
    // Ordena as listas para usar nos filtros
    const sortedMun = (typeof municipalitiesList !== 'undefined') ? municipalitiesList.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];
    const sortedApis = (typeof apisList !== 'undefined') ? apisList.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];
    const sortedOrient = (typeof orientadores !== 'undefined') ? orientadores.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];
    const sortedCargos = (typeof cargos !== 'undefined') ? cargos.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];
    const sortedUsers = (typeof users !== 'undefined') ? users.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];

    // 1. FILTROS DE MUNICÍPIO (Todas as abas)
    const munFilterIds = [
        'filter-municipality-name', 
        'filter-task-municipality', 
        'filter-request-municipality',
        'filter-visit-municipality', 
        'filter-production-municipality', 
        'filter-presentation-municipality',
        'filter-integration-municipality' // Aba Integração
    ];

    munFilterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const cur = el.value;
            // Filtros tem a opção "Todos"
            el.innerHTML = '<option value="">Todos</option>' + 
                           sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
            if(cur) el.value = cur;
            
            // Listener específico para a aba de integração atualizar ao mudar
            if(id === 'filter-integration-municipality') el.onchange = renderIntegrations;
        }
    });

    // 2. FILTRO DE API (Aba Integração)
    const apiFilter = document.getElementById('filter-integration-api');
    if (apiFilter) {
        const cur = apiFilter.value;
        apiFilter.innerHTML = '<option value="">Todas</option>' + 
                              sortedApis.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
        if(cur) apiFilter.value = cur;
        apiFilter.onchange = renderIntegrations;
    }

    // 3. OUTROS FILTROS (Treinamentos e Apresentações)
    ['filter-task-performer', 'filter-presentation-orientador'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { 
            const c=el.value; 
            el.innerHTML = '<option value="">Todos</option>' + sortedOrient.map(o => `<option value="${o.name}">${o.name}</option>`).join(''); 
            if(c) el.value=c; 
        }
    });

    const cargoEl = document.getElementById('filter-task-position');
    if(cargoEl) { 
        const c=cargoEl.value; 
        cargoEl.innerHTML = '<option value="">Todos</option>' + sortedCargos.map(o => `<option value="${o.name}">${o.name}</option>`).join(''); 
        if(c) cargoEl.value=c; 
    }

    // 4. FILTROS DE USUÁRIO (Solicitações e Demandas)
    ['filter-request-user', 'filter-demand-user'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { 
            const c=el.value; 
            el.innerHTML = '<option value="">Todos</option>' + sortedUsers.map(o => `<option value="${o.name}">${o.name}</option>`).join(''); 
            if(c) el.value=c; 
        }
    });
}

// 5. Salvar Colaborador (Com novos campos: Email e Nascimento)
function saveOrientador(e){ 
    e.preventDefault(); 
    // Sanitiza Nome
    const name = sanitizeInput(document.getElementById('orientador-name').value.trim());

    // Validação Duplicidade
    const nomeJaExiste = orientadores.some(o => o.name.toLowerCase() === name.toLowerCase() && o.id !== editingId);
    if (nomeJaExiste) {
        alert('Erro: Já existe um colaborador cadastrado com este Nome.');
        return;
    }
    
    const data = {
        name: name, 
        // SANITIZAÇÃO:
        contact: sanitizeInput(document.getElementById('orientador-contact').value),
        email: sanitizeInput(document.getElementById('orientador-email').value),
        birthDate: document.getElementById('orientador-birthdate').value
    }; 
    
    if(editingId){
        const i = orientadores.findIndex(x => x.id === editingId); 
        if (i !== -1) {
            orientadores[i] = { ...orientadores[i], ...data };
            logSystemAction('Edição', 'Colaboradores', `Atualizou: ${data.name}`);
        }
    } else {
        orientadores.push({ id: getNextId('orient'), ...data });
        logSystemAction('Criação', 'Colaboradores', `Novo: ${data.name}`);
    } 
    
    salvarNoArmazenamento('orientadores', orientadores); 
    document.getElementById('orientador-modal').classList.remove('show'); 
    renderOrientadores(); 
    updateGlobalDropdowns(); 
    showToast('Colaborador salvo com sucesso!', 'success');
}
// 6. Listar Colaboradores (Mostrando E-mail e Data de Nascimento)
function renderOrientadores() {
    const c = document.getElementById('orientadores-table');
    
    // Contador no topo
    const countDiv = document.getElementById('orientadores-total');
    if(countDiv) { 
        countDiv.style.display = 'block'; 
        countDiv.innerHTML = `Total de Colaboradores cadastrados: <strong>${orientadores.length}</strong>`; 
    }

    if (orientadores.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum colaborador cadastrado.</div>';
        return;
    }

    const r = orientadores.map(x => 
        `<tr>
            <td class="text-primary-cell">${x.name}</td>
            <td class="text-secondary-cell">${x.email || '-'}</td> <td style="text-align:center;">${formatDate(x.birthDate)}</td> <td>${x.contact || '-'}</td>
            <td>
                <button class="btn btn--sm" onclick="showOrientadorModal(${x.id})" title="Editar">✏️</button>
                <button class="btn btn--sm" onclick="deleteOrientador(${x.id})" title="Excluir">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    // Cabeçalho da tabela atualizado
    c.innerHTML = `<table>
        <thead>
            <th>Nome do Colaborador</th>
            <th>E-mail</th>
            <th style="text-align:center;">Data Nasc.</th>
            <th>Contato</th>
            <th>Ações</th>
        </thead>
        <tbody>${r}</tbody>
    </table>`;
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

// --- 21. SISTEMA DE AUDITORIA ---

// Função central para registrar ações
function logSystemAction(action, target, details) {
    const newLog = {
        id: Date.now(), // ID único baseado no tempo
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.name : 'Sistema/Desconhecido',
        action: action, // Ex: "Criação", "Edição", "Exclusão"
        target: target, // Ex: "Município", "Treinamento"
        details: details // Ex: "Cadastrou município Serro - MG"
    };

    // Adiciona no início do array (mais recente primeiro)
    auditLogs.unshift(newLog);

    // LIMITE DE SEGURANÇA (Local-First):
    // Mantém apenas os últimos 500 logs para não lotar a memória do navegador
    if (auditLogs.length > 500) {
        auditLogs = auditLogs.slice(0, 500);
    }

    salvarNoArmazenamento('auditLogs', auditLogs);
}

// Navegação para Auditoria (Com Trava de Segurança)
function navigateToAudit() {
    // Trava de Segurança: Se não for Admin, bloqueia e avisa
    if (currentUser.permission !== 'Administrador') {
        alert('⛔ Acesso Negado: Esta função é restrita a Administradores.');
        return;
    }

    toggleSettingsMenu();
    openTab('audit-section');
    renderAuditLogs();
}

// Renderização da Tabela
function renderAuditLogs() {
    const fAction = document.getElementById('filter-audit-action') ? document.getElementById('filter-audit-action').value : '';
    const fUser = document.getElementById('filter-audit-user') ? document.getElementById('filter-audit-user').value.toLowerCase() : '';
    const fTarget = document.getElementById('filter-audit-target') ? document.getElementById('filter-audit-target').value.toLowerCase() : '';

    // 1. Filtra os dados (Igual antes)
    const filtered = auditLogs.filter(log => {
        if (fAction && log.action !== fAction) return false;
        if (fUser && !log.user.toLowerCase().includes(fUser)) return false;
        if (fTarget && !log.target.toLowerCase().includes(fTarget)) return false;
        return true;
    });

    const c = document.getElementById('audit-table');
    document.getElementById('audit-count').innerHTML = `<strong>${filtered.length}</strong> registros encontrados`;

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum registro de auditoria encontrado.</div>';
        return;
    }

    // --- 2. LÓGICA DE PAGINAÇÃO (NOVO) ---
    // Calcula o índice inicial e final
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Fatia os dados (Pega só os 10 da página atual)
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    // Se a página atual ficou vazia (ex: filtrou e reduziu resultados), volta para a 1
    if (paginatedData.length === 0 && currentPage > 1) {
        currentPage = 1;
        renderAuditLogs();
        return;
    }
    // -------------------------------------

    const formatDateTime = (isoStr) => {
        const d = new Date(isoStr);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
    };

    const getActionColor = (act) => {
        if(act === 'Exclusão') return '#C85250';
        if(act === 'Criação') return '#005580';
        if(act === 'Edição') return '#E68161';
        return 'inherit';
    };

    // Gera as linhas usando APENAS os dados fatiados (paginatedData)
    const rows = paginatedData.map(log => `
        <tr>
            <td style="font-size:12px; white-space:nowrap;">${formatDateTime(log.timestamp)}</td>
            <td><strong>${log.user}</strong></td>
            <td style="color:${getActionColor(log.action)}; font-weight:bold;">${log.action}</td>
            <td>${log.target}</td>
            <td class="text-secondary-cell">${log.details}</td>
        </tr>
    `).join('');

    // --- 3. INSERE TABELA + PAGINAÇÃO ---
    const paginationHTML = getPaginationHTML(filtered.length, 'renderAuditLogs');
    
    c.innerHTML = `
        <table>
            <thead><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Módulo</th><th>Detalhes</th></thead>
            <tbody>${rows}</tbody>
        </table>
        ${paginationHTML}
    `;
}

function clearAuditLogs() {
    if(confirm('Tem certeza? Isso apagará todo o histórico de auditoria.')) {
        auditLogs = [];
        salvarNoArmazenamento('auditLogs', auditLogs);
        renderAuditLogs();
    }
}

function exportAuditCSV() {
    const headers = ['DataHora', 'Usuario', 'Acao', 'Alvo', 'Detalhes'];
    const rows = auditLogs.map(l => [l.timestamp, l.user, l.action, l.target, l.details]);
    downloadCSV('auditoria_sistema.csv', headers, rows);
}

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

// Gera o HTML dos botões de paginação
function getPaginationHTML(totalItems, renderFunctionName) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Se não tiver páginas suficientes, não mostra nada
    if (totalPages <= 1) return '';

    return `
    <div class="pagination-controls" style="display:flex; justify-content:center; align-items:center; gap:15px; margin-top:15px;">
        <button class="btn btn--sm btn--secondary" 
            onclick="changePage(-1, '${renderFunctionName}')" 
            ${currentPage === 1 ? 'disabled' : ''}>
            ⬅️ Anterior
        </button>
        
        <span style="font-size:13px; color:var(--color-text);">
            Página <strong>${currentPage}</strong> de <strong>${totalPages}</strong>
        </span>
        
        <button class="btn btn--sm btn--secondary" 
            onclick="changePage(1, '${renderFunctionName}')" 
            ${currentPage === totalPages ? 'disabled' : ''}>
            Próximo ➡️
        </button>
    </div>`;
}

// Função que troca a página
function changePage(delta, renderFunctionName) {
    currentPage += delta;
    // Chama a função de renderização passada por nome (Ex: "renderAuditLogs")
    window[renderFunctionName]();
}

// ============================================================================
// 22. SINCRONIZAÇÃO ENTRE ABAS (MULTI-TAB)
// ============================================================================

window.addEventListener('storage', function(e) {
    // Se a chave não for uma das nossas ou se o valor for nulo (limpeza), ignoramos ou recarregamos tudo
    if (!e.key || !e.newValue) return;

    console.log(`🔄 Sincronizando dados externos: ${e.key}`);

    // Atualiza a variável local correspondente com o dado novo vindo da outra aba
    try {
        const data = JSON.parse(e.newValue);

        switch (e.key) {
            case 'municipalities': municipalities = data; break;
            case 'municipalitiesList': municipalitiesList = data; break;
            case 'tasks': tasks = data; break;
            case 'requests': requests = data; break;
            case 'demands': demands = data; break;
            case 'visits': visits = data; break;
            case 'productions': productions = data; break;
            case 'presentations': presentations = data; break;
            case 'systemVersions': systemVersions = data; break;
            case 'users': users = data; break;
            case 'cargos': cargos = data; break;
            case 'orientadores': orientadores = data; break;
            case 'modulos': modulos = data; break;
            case 'formasApresentacao': formasApresentacao = data; break;
            case 'auditLogs': auditLogs = data; break;
            case 'counters': counters = data; break;
        }

        // Atualiza a tela atual para refletir a mudança imediatamente
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            refreshCurrentTab(activeTab.id);
        }
        
        // Se estivermos na auditoria, avisa que chegaram novos logs
        if (activeTab && activeTab.id === 'audit-section') {
            showToast('Novos registros de auditoria recebidos.', 'info');
        }

    } catch (err) {
        console.error("Erro ao sincronizar aba:", err);
    }
});

// ============================================================================
// 23. SISTEMA DE ATALHOS DE TECLADO (HOTKEYS)
// ============================================================================

document.addEventListener('keydown', function(e) {
    // Se o usuário estiver digitando em um input ou textarea, ignoramos a maioria dos atalhos
    // para não atrapalhar a digitação (Exceto Ctrl+Enter e ESC)
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';

    // 1. FECHAR MODAL (ESC) - Funciona sempre
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            openModal.classList.remove('show');
            return;
        }
    }

    // 2. SALVAR FORMULÁRIO (Ctrl + Enter) - Funciona dentro de inputs
    if (e.ctrlKey && e.key === 'Enter') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            // Busca o botão de salvar (submit) dentro do modal aberto e clica nele
            const btnSalvar = openModal.querySelector('button[type="submit"]');
            if (btnSalvar) {
                e.preventDefault();
                btnSalvar.click();
                return;
            }
        }
    }

    // --- Se estiver digitando, para por aqui para não navegar sem querer ---
    if (isTyping) return;

    // 3. NAVEGAÇÃO ENTRE ABAS (Alt + Tecla)
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        
        switch(e.key.toLowerCase()) {
            case 'd': // Dashboard
                document.querySelector('.sidebar-btn[data-tab="dashboard"]').click();
                break;
            case 'm': // Municípios
                document.querySelector('.sidebar-btn[data-tab="municipios"]').click();
                break;
            case 't': // Treinamentos
                document.querySelector('.sidebar-btn[data-tab="tarefas"]').click();
                break;
            case 's': // Solicitações
                document.querySelector('.sidebar-btn[data-tab="solicitacoes"]').click();
                break;
            case 'a': // Apresentações
                document.querySelector('.sidebar-btn[data-tab="apresentacoes"]').click();
                break;
            case 'v': // Visitas
                document.querySelector('.sidebar-btn[data-tab="visitas"]').click();
                break;
            case 'p': // Produção
                document.querySelector('.sidebar-btn[data-tab="producao"]').click();
                break;
            case 'h': // Help (Ajuda)
                alert('🎹 ATALHOS DO SISTEMA:\n\n' +
                      'Alt + N: Novo Item (na aba atual)\n' +
                      'Ctrl + Enter: Salvar (dentro do formulário)\n' +
                      'Esc: Fechar formulário\n\n' +
                      'NAVEGAÇÃO:\n' +
                      'Alt + D: Dashboard\n' +
                      'Alt + M: Municípios\n' +
                      'Alt + T: Treinamentos\n' +
                      'Alt + S: Solicitações\n' +
                      'Alt + A: Apresentações\n' +
                      'Alt + V: Visitas\n' +
                      'Alt + P: Produção');
                break;
        }
    }

    // 4. AÇÃO "NOVO ITEM" (Alt + N) - Contextual
    if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault(); // Evita abrir nova janela do navegador
        
        // Descobre qual aba está ativa no momento
        const activeSection = document.querySelector('.tab-content.active');
        if (!activeSection) return;

        switch(activeSection.id) {
            case 'municipios-section': showMunicipalityModal(); break;
            case 'tarefas-section': showTaskModal(); break;
            case 'solicitacoes-section': showRequestModal(); break;
            case 'demandas-section': showDemandModal(); break;
            case 'visitas-section': showVisitModal(); break;
            case 'producao-section': showProductionModal(); break;
            case 'apresentacoes-section': showPresentationModal(); break;
            case 'versoes-section': showVersionModal(); break;
            case 'usuarios-section': showUserModal(); break;
            // Configurações
            case 'cargos-section': showCargoModal(); break;
            case 'orientadores-section': showOrientadorModal(); break;
            case 'modulos-section': showModuloModal(); break;
            case 'municipalities-list-section': showMunicipalityListModal(); break;
            case 'formas-apresentacao-section': showFormaApresentacaoModal(); break;
        }
    }
});

// ============================================================================
// 24. MÓDULO DE SEGURANÇA (NOVO v4.4)
// ============================================================================

// --- A. RATE LIMITING (Proteção contra Força Bruta) ---
let loginAttempts = recuperarDoArmazenamento('loginAttempts', {});
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

function checkLoginAttempts(login) {
    const now = Date.now();
    
    if (!loginAttempts[login]) {
        loginAttempts[login] = { count: 0, timestamp: now, locked: false };
    }
    
    const record = loginAttempts[login];
    
    // Se passou o tempo de bloqueio, reseta
    if (record.locked && (now - record.timestamp > LOGIN_LOCKOUT_TIME)) {
        record.count = 0;
        record.locked = false;
        record.timestamp = now;
        salvarNoArmazenamento('loginAttempts', loginAttempts);
    }
    
    // Se está bloqueado e ainda está no tempo
    if (record.locked) {
        const tempoRestante = Math.ceil((LOGIN_LOCKOUT_TIME - (now - record.timestamp)) / 60000);
        throw new Error(`🔒 Conta bloqueada por segurança.\n\nMuitas tentativas incorretas. Tente novamente em ${tempoRestante} minutos.`);
    }
}

function recordFailedAttempt(login) {
    const now = Date.now();
    if (!loginAttempts[login]) loginAttempts[login] = { count: 0, timestamp: now, locked: false };
    
    loginAttempts[login].count++;
    loginAttempts[login].timestamp = now;
    
    if (loginAttempts[login].count >= MAX_LOGIN_ATTEMPTS) {
        loginAttempts[login].locked = true;
    }
    salvarNoArmazenamento('loginAttempts', loginAttempts);
}

function resetLoginAttempts(login) {
    if (loginAttempts[login]) {
        loginAttempts[login] = { count: 0, timestamp: Date.now(), locked: false };
        salvarNoArmazenamento('loginAttempts', loginAttempts);
    }
}

// --- B. TIMEOUT DE SESSÃO (Logout por Inatividade) ---
let inactivityTimeout;
const INACTIVITY_MINUTES = 15;

function resetInactivityTimer() {
    if (!currentUser) return; // Só roda se estiver logado

    clearTimeout(inactivityTimeout);
    
    inactivityTimeout = setTimeout(() => {
        // Salva trabalho atual se possível (Backup de emergência antes de sair)
        createBackup('AUTO-SAVE-INATIVIDADE'); 
        alert('⏱️ Sua sessão expirou por 15 minutos de inatividade.\nPor segurança, você foi desconectado.');
        
        // Logout forçado
        localStorage.removeItem('currentUser');
        location.reload();
    }, INACTIVITY_MINUTES * 60 * 1000);
}

function initializeInactivityTracking() {
    // Monitora movimento e cliques
    window.onload = resetInactivityTimer;
    document.onmousemove = resetInactivityTimer;
    document.onkeypress = resetInactivityTimer;
    document.onclick = resetInactivityTimer;
    document.onscroll = resetInactivityTimer;
}

// --- C. SANITIZAÇÃO (Limpeza de Texto) ---
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    // Remove tags HTML básicas para evitar injeção de código
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ----------------------------------------------------------------------------
// XX. CADASTRO MESTRE DE APIS (Configurações)
// ----------------------------------------------------------------------------
function showApiListModal(id = null) {
    editingId = id;
    document.getElementById('api-list-form').reset();
    
    if (id) {
        // Correção: Garante comparação correta (x.id == id)
        const a = apisList.find(x => x.id == id);
        if (a) {
            document.getElementById('api-list-name').value = a.name;
            document.getElementById('api-list-description').value = a.description;
        }
    }
    document.getElementById('api-list-modal').classList.add('show');
}

function saveApiList(e) {
    e.preventDefault();
    const data = {
        name: sanitizeInput(document.getElementById('api-list-name').value),
        description: sanitizeInput(document.getElementById('api-list-description').value)
    };

    if(editingId) {
        const i = apisList.findIndex(x => x.id === editingId);
        if(i !== -1) apisList[i] = { ...apisList[i], ...data };
    } else {
        apisList.push({ id: getNextId('api'), ...data });
    }
    salvarNoArmazenamento('apisList', apisList);
    document.getElementById('api-list-modal').classList.remove('show');
    renderApiList();
    showToast('API salva com sucesso!', 'success');
}

function renderApiList() {
    const c = document.getElementById('apis-list-table');
    const countDiv = document.getElementById('apis-list-total');
    
    // Ordena alfabeticamente
    apisList.sort((a,b) => a.name.localeCompare(b.name));

    if(countDiv) {
        countDiv.style.display = 'block';
        countDiv.innerHTML = `Total de APIs cadastradas: <strong>${apisList.length}</strong>`;
    }

    const r = apisList.map(a => 
        `<tr>
            <td class="text-primary-cell">${a.name}</td>
            <td class="text-secondary-cell">${a.description}</td>
            <td>
                <button class="btn btn--sm" onclick="showApiListModal(${a.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteApiList(${a.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    c.innerHTML = `<table><thead><th>API</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteApiList(id) {
    if(confirm('Excluir esta API?')) {
        apisList = apisList.filter(x => x.id !== id);
        salvarNoArmazenamento('apisList', apisList);
        renderApiList();
    }
}
function closeApiListModal() { document.getElementById('api-list-modal').classList.remove('show'); }
// ----------------------------------------------------------------------------
// XX. CADASTRO MESTRE DE APIS (Configurações)
// ----------------------------------------------------------------------------
function showApiListModal(id=null) {
    editingId = id;
    document.getElementById('api-list-form').reset();
    if(id) {
        const a = apisList.find(x => x.id === id);
        if(a) {
            document.getElementById('api-list-name').value = a.name;
            document.getElementById('api-list-description').value = a.description;
        }
    }
    document.getElementById('api-list-modal').classList.add('show');
}

function saveApiList(e) {
    e.preventDefault();
    const data = {
        name: sanitizeInput(document.getElementById('api-list-name').value),
        description: sanitizeInput(document.getElementById('api-list-description').value)
    };

    if(editingId) {
        const i = apisList.findIndex(x => x.id === editingId);
        if(i !== -1) apisList[i] = { ...apisList[i], ...data };
    } else {
        apisList.push({ id: getNextId('api'), ...data });
    }
    salvarNoArmazenamento('apisList', apisList);
    document.getElementById('api-list-modal').classList.remove('show');
    renderApiList();
    showToast('API salva com sucesso!', 'success');
}

function renderApiList() {
    const c = document.getElementById('apis-list-table');
    const countDiv = document.getElementById('apis-list-total');
    
    // Ordena alfabeticamente
    apisList.sort((a,b) => a.name.localeCompare(b.name));

    if(countDiv) {
        countDiv.style.display = 'block';
        countDiv.innerHTML = `Total de APIs cadastradas: <strong>${apisList.length}</strong>`;
    }

    const r = apisList.map(a => 
        `<tr>
            <td class="text-primary-cell">${a.name}</td>
            <td class="text-secondary-cell">${a.description}</td>
            <td>
                <button class="btn btn--sm" onclick="showApiListModal(${a.id})">✏️</button>
                <button class="btn btn--sm" onclick="deleteApiList(${a.id})">🗑️</button>
            </td>
        </tr>`
    ).join('');
    
    c.innerHTML = `<table><thead><th>API</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`;
}

function deleteApiList(id) {
    if (confirm('Excluir esta API?')) {
        // Correção: Garante comparação correta na filtragem
        apisList = apisList.filter(x => x.id != id);
        salvarNoArmazenamento('apisList', apisList);
        renderApiList();
        updateGlobalDropdowns(); // Atualiza filtros dependentes
    }
}

function closeApiListModal() { document.getElementById('api-list-modal').classList.remove('show'); }
// ----------------------------------------------------------------------------
// XX. GERENCIAMENTO DE INTEGRAÇÕES (Aba Principal)
// ----------------------------------------------------------------------------

// Variável para gráfico
let chartInstanceApis = null;

// Helper: Calcula diferença de dias
// CORREÇÃO: Cálculo de dias preciso (Ignora fuso horário e horas)
function getDaysDiff(dateString) {
    if (!dateString) return null;

    // Data Alvo (Vencimento)
    const parts = dateString.split('-'); // Quebra "2025-11-29"
    // Cria data localmente: Ano, Mês (0-indexado), Dia, 12h (Meio dia para evitar bug de verão)
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

    // Data Hoje (Sistema)
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Também seta para meio dia

    // Diferença em milissegundos
    const diffTime = targetDate.getTime() - today.getTime();
    
    // Converte para dias e arredonda
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    return diffDays;
}

function showIntegrationModal(id=null) {
    editingId = id;
    document.getElementById('integration-form').reset();
    if(document.getElementById('integration-char-counter')) {
        document.getElementById('integration-char-counter').textContent = '0 / 250';
    }

    // 1. Popula Municípios
    const munSelect = document.getElementById('integration-municipality');
    if(munSelect) {
        const sortedList = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));
        munSelect.innerHTML = '<option value="">Selecione o município</option>' + 
                              sortedList.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
    }

    // 2. Popula Checkboxes de APIs (da lista mestra)
    const divApi = document.getElementById('integration-api-checkboxes');
    if(divApi) {
        if(apisList.length > 0) {
            divApi.innerHTML = apisList.map(a => `<label><input type="checkbox" value="${a.name}" class="api-check"> ${a.name}</label>`).join('');
        } else {
            divApi.innerHTML = '<span style="font-size:11px; color:red;">Nenhuma API cadastrada em configurações.</span>';
        }
    }

    // 3. Edição
    if(id) {
        const int = integrations.find(x => x.id === id);
        if(int) {
            document.getElementById('integration-municipality').value = int.municipality;
            document.getElementById('integration-expiration').value = int.expirationDate;
            document.getElementById('integration-observation').value = int.observation || '';
            
            // Marca checkboxes
            if(int.apis) {
                document.querySelectorAll('.api-check').forEach(cb => {
                    cb.checked = int.apis.includes(cb.value);
                });
            }
            // Contador
            if(document.getElementById('integration-char-counter')) {
                document.getElementById('integration-char-counter').textContent = (int.observation ? int.observation.length : 0) + ' / 250';
            }
        }
    }
    document.getElementById('integration-modal').classList.add('show');
}

function saveIntegration(e) {
    e.preventDefault();
    
    // Coleta APIs selecionadas
    const apisSel = Array.from(document.querySelectorAll('.api-check:checked')).map(c => c.value);
    
    if (apisSel.length === 0) {
        alert('Selecione pelo menos uma API Integrada.');
        return;
    }

    const data = {
        municipality: document.getElementById('integration-municipality').value,
        expirationDate: document.getElementById('integration-expiration').value,
        apis: apisSel,
        observation: sanitizeInput(document.getElementById('integration-observation').value)
    };

    if(editingId) {
        const i = integrations.findIndex(x => x.id === editingId);
        if(i !== -1) integrations[i] = { ...integrations[i], ...data };
    } else {
        integrations.push({ id: getNextId('integration'), ...data });
    }

    salvarNoArmazenamento('integrations', integrations);
    document.getElementById('integration-modal').classList.remove('show');
    clearIntegrationFilters(); // Recarrega e limpa filtros
    
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Integrações', `Município: ${data.municipality}`);
    showToast('Integração salva com sucesso!', 'success');
}

// --- GERENCIAMENTO DE INTEGRAÇÕES (ABA PRINCIPAL) CORRIGIDO ---

function renderIntegrations() {
    // Filtros
    const fMun = document.getElementById('filter-integration-municipality')?.value;
    const fApi = document.getElementById('filter-integration-api')?.value;
    const fStatus = document.getElementById('filter-integration-status')?.value; // Novo filtro
    const fStart = document.getElementById('filter-integration-start')?.value;
    const fEnd = document.getElementById('filter-integration-end')?.value;

    let filtered = integrations.filter(i => {
        if (fMun && i.municipality !== fMun) return false;
        if (fApi && (!i.apis || !i.apis.includes(fApi))) return false;
        
        // Filtro de Data
        if (fStart && i.expirationDate < fStart) return false;
        if (fEnd && i.expirationDate > fEnd) return false;

        // Lógica do Filtro de Status
        if (fStatus) {
            const diff = getDaysDiff(i.expirationDate);
            if (fStatus === 'Vencido' && diff >= 0) return false;
            if (fStatus === 'Em dia' && diff < 0) return false;
        }

        return true;
    });

    // Ordenação Alfabética por Município
    filtered.sort((a, b) => a.municipality.localeCompare(b.municipality));

    const c = document.getElementById('integrations-table');
    const countDiv = document.getElementById('integrations-results-count');
    
    if(countDiv) {
        countDiv.style.display = 'block';
        countDiv.innerHTML = `<strong>${filtered.length}</strong> integrações encontradas`;
    }

    if(filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma integração encontrada.</div>';
    } else {
        const rows = filtered.map(i => {
            const diff = getDaysDiff(i.expirationDate);
            const isExpired = diff < 0;
            
            // Texto da Data e Cor
            const dateClass = isExpired ? 'date-expired' : 'date-valid';
            const dateText = formatDate(i.expirationDate);
            
            // Texto de Dias Restantes (Correção Solicitada)
            let daysText = '';
            if (isExpired) {
                daysText = `<span class="days-remaining-expired">Vencido há ${Math.abs(diff)} dias</span>`;
            } else if (diff === 0) {
                daysText = `<span class="days-remaining-expired">Vence Hoje!</span>`;
            } else {
                daysText = `<span class="days-remaining-valid">Vence em ${diff} dias</span>`;
            }

            // Busca UF na lista mestra
            const munData = municipalitiesList.find(m => m.name === i.municipality);
            const munDisplay = munData ? `${i.municipality} - ${munData.uf}` : i.municipality;

            // Renderiza APIs (Centralizado via CSS)
            const apisDisplay = (i.apis || []).map(api => 
                `<span class="module-tag" style="background:#E1F5FE; color:#0277BD; border:1px solid #81D4FA;">${api}</span>`
            ).join('');

            return `<tr>
                <td class="text-primary-cell">${munDisplay}</td>
                <td class="module-tags-cell">${apisDisplay}</td>
                <td class="${dateClass}">${dateText}</td>
                <td>${daysText}</td>
                <td class="text-secondary-cell">${i.observation || '-'}</td>
                <td>
                    <div style="display:flex; justify-content:flex-end;">
                        <button class="btn btn--sm" onclick="showIntegrationModal(${i.id})">✏️</button>
                        <button class="btn btn--sm" onclick="deleteIntegration(${i.id})">🗑️</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        c.innerHTML = `<table>
            <thead>
                <th>Município</th>
                <th>APIs Integradas</th>
                <th>Vencimento Certificado</th>
                <th>Status Vencimento</th>
                <th>Observações</th>
                <th style="text-align:right; padding-right:30px;">Ações</th>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
    
    updateIntegrationChart(filtered);
}

function updateIntegrationChart(data) {
    const ctx = document.getElementById('chartApisUsage');
    if(!ctx || !window.Chart) return;

    if(chartInstanceApis) chartInstanceApis.destroy();

    // Contagem de APIs
    const counts = {};
    data.forEach(item => {
        if(item.apis) {
            item.apis.forEach(api => {
                counts[api] = (counts[api] || 0) + 1;
            });
        }
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);
    const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    chartInstanceApis = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Qtd de Municípios',
                data: values,
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// CORREÇÃO: Edição de Integração (Populando Modal)
function showIntegrationModal(id = null) {
    editingId = id;
    document.getElementById('integration-form').reset();
    
    // Reseta contador de caracteres
    if(document.getElementById('integration-char-counter')) {
        document.getElementById('integration-char-counter').textContent = '0 / 250';
    }

    // 1. Popula Municípios (Com UF)
    const munSelect = document.getElementById('integration-municipality');
    if(munSelect) {
        const sortedList = municipalitiesList.slice().sort((a, b) => a.name.localeCompare(b.name));
        munSelect.innerHTML = '<option value="">Selecione o município</option>' + 
                              sortedList.map(m => `<option value="${m.name}">${m.name} - ${m.uf}</option>`).join('');
    }

    // 2. Popula APIs
    const divApi = document.getElementById('integration-api-checkboxes');
    if(divApi) {
        if(apisList.length > 0) {
            divApi.innerHTML = apisList.map(a => `<label><input type="checkbox" value="${a.name}" class="api-check"> ${a.name}</label>`).join('');
        } else {
            divApi.innerHTML = '<span style="font-size:11px; color:red;">Nenhuma API cadastrada em configurações.</span>';
        }
    }

    // 3. Preenche se for Edição
    if (id) {
        // Use '==' para evitar erro de string vs number
        const int = integrations.find(x => x.id == id);
        if (int) {
            // Verifica se o município ainda existe no select, senão adiciona temporariamente
            let exists = false;
            for(let i=0; i<munSelect.options.length; i++) {
                if(munSelect.options[i].value === int.municipality) exists = true;
            }
            if(!exists) {
                const opt = document.createElement('option');
                opt.value = int.municipality;
                opt.textContent = int.municipality;
                munSelect.appendChild(opt);
            }

            document.getElementById('integration-municipality').value = int.municipality;
            document.getElementById('integration-expiration').value = int.expirationDate;
            document.getElementById('integration-observation').value = int.observation || '';
            
            // Marca checkboxes
            if(int.apis) {
                document.querySelectorAll('.api-check').forEach(cb => {
                    cb.checked = int.apis.includes(cb.value);
                });
            }
            
            if(document.getElementById('integration-char-counter')) {
                document.getElementById('integration-char-counter').textContent = (int.observation ? int.observation.length : 0) + ' / 250';
            }
        }
    }
    document.getElementById('integration-modal').classList.add('show');
}

// CORREÇÃO: Exclusão de Integração
function deleteIntegration(id) {
    if(confirm('Excluir esta integração?')) {
        // Correção: Comparação loose ( != ) para pegar number/string
        integrations = integrations.filter(x => x.id != id);
        salvarNoArmazenamento('integrations', integrations);
        renderIntegrations();
        logSystemAction('Exclusão', 'Integrações', `Integração ID: ${id}`);
    }
}

function closeIntegrationModal() {
    document.getElementById('integration-modal').classList.remove('show');
}

// Limpeza de Filtros (Atualizada)
function clearIntegrationFilters() {
    if(document.getElementById('filter-integration-municipality')) document.getElementById('filter-integration-municipality').value = '';
    if(document.getElementById('filter-integration-api')) document.getElementById('filter-integration-api').value = '';
    if(document.getElementById('filter-integration-status')) document.getElementById('filter-integration-status').value = '';
    if(document.getElementById('filter-integration-start')) document.getElementById('filter-integration-start').value = '';
    if(document.getElementById('filter-integration-end')) document.getElementById('filter-integration-end').value = '';
    renderIntegrations();
}
