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
const SALT_LENGTH = 32; // Aumentado para 32 caracteres (Segurança Máxima)
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

// FUNÇÃO MOBILE: ABRE E FECHA MENU + OVERLAY
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    
    // Tenta pegar o overlay. Se não existir, busca ou cria.
    let overlay = document.querySelector('.sidebar-overlay');
    
    // Segurança: Se o overlay não existir no HTML, cria ele agora via JS
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        // Adiciona o evento de clique para fechar
        overlay.onclick = toggleMobileMenu; 
        document.body.appendChild(overlay);
    }

    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
    }
}

// ----------------------------------------------------------------------------
// 4. FUNÇÕES UTILITÁRIAS (CORE)
// ----------------------------------------------------------------------------

function generateSalt() {
    return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
}

function hashPassword(password, salt) {
    // 1. Primeira passada
    let hash = CryptoJS.SHA256(salt + password).toString();
    
    // 2. Loop de reforço (PBKDF2-like) - 1000 iterações
    for (let i = 0; i < 1000; i++) {
        hash = CryptoJS.SHA256(hash + salt).toString();
    }
    
    return hash;
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
        
        // Se não tem nada salvo, retorna o padrão sem erro
        if (dados === null) {
            return valorPadrao;
        }

        // Tenta converter o texto em dados (JSON)
        return JSON.parse(dados);

    } catch (erro) {
        // SE DER ERRO (JSON CORROMPIDO):
        console.error(`💥 Erro Crítico ao ler '${chave}':`, erro);
        
        // 1. Avisa o usuário (para ele não achar que os dados sumiram do nada)
        alert(`⚠️ ATENÇÃO: Os dados de "${chave}" estão corrompidos e impediam o sistema de abrir.\n\nEles foram resetados automaticamente para o padrão para recuperar o acesso.`);
        
        // 2. Limpa o dado estragado para não travar na próxima vez
        localStorage.removeItem(chave);
        
        // 3. Retorna o valor padrão (vazio) para o sistema continuar rodando
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

function calculateTimeInUse(dateString) {
    if (!dateString) return '-';
    
    const start = new Date(dateString);
    const now = new Date();
    
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        // Pega o último dia do mês anterior
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    // --- NOVA LÓGICA DE EXIBIÇÃO (Compacta) ---
    
    // Se tiver menos de 1 mês (0 anos e 0 meses)
    if (years === 0 && months === 0) {
        return "Menos de um mês";
    }

    let parts = [];
    if (years > 0) parts.push(`${years} ano(s)`);
    if (months > 0) parts.push(`${months} mês(es)`);
    
    // Ignoramos os dias para economizar espaço
    
    return parts.join(' e ');
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

// ============================================================================
// FASE 3 - EXPORTAÇÃO AVANÇADA PARA EXCEL (.xlsx)
// ============================================================================

// 1. Função Genérica (A Mágica do Excel)
function downloadXLSX(filename, headers, rows, sheetName = "Dados") {
    // Verifica se a biblioteca foi carregada no HTML
    if (typeof XLSX === 'undefined') {
        alert('Erro: A biblioteca Excel (SheetJS) não carregou. Verifique se adicionou a linha do CDN no index.html.');
        return;
    }

    // Prepara os dados
    const data = [headers, ...rows];

    // Cria a Planilha
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Ajuste Automático de Largura das Colunas
    const colWidths = headers.map((h, i) => {
        let maxWidth = h.length;
        rows.forEach(row => {
            const cellValue = row[i] ? String(row[i]) : "";
            if (cellValue.length > maxWidth) maxWidth = cellValue.length;
        });
        return { wch: maxWidth + 5 }; // +5 de respiro
    });
    ws['!cols'] = colWidths;

    // Cria o Arquivo e Salva
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename + ".xlsx");
}

// 2. Exportar MUNICÍPIOS (Aba Clientes)
function exportMunicipalitiesCSV() { 
    // Nota: Mantive o nome "CSV" para não precisar mudar o botão no HTML, mas gera XLSX
    const data = getFilteredMunicipalities(); // Usa os dados filtrados da tela
    const headers = ['Nome', 'UF', 'Status', 'Módulos', 'Gestor', 'Contato', 'Implantação', 'Última Visita', 'Tempo de Uso'];
    
    const rows = data.map(m => [
        m.name, 
        m.uf || '', 
        m.status, 
        m.modules.join(', '), 
        m.manager, 
        m.contact, 
        formatDate(m.implantationDate), 
        formatDate(m.lastVisit),
        calculateTimeInUse(m.implantationDate)
    ]);
    
    downloadXLSX("Relatorio_Carteira_Clientes", headers, rows, "Clientes");
}

// 3. Exportar COLABORADORES (Aba RH)
function exportColabInfoExcel() {
    // Pega dados filtrados se possível, ou todos
    // Como a função de renderização filtra na hora, vamos pegar direto do array global por enquanto
    // Se quiser exportar só o filtrado, precisaria refatorar a função de filtro para retornar array
    const data = collaboratorInfos; 
    
    const headers = ['Nome', 'Status', 'Nascimento', 'Admissão', 'Tempo de Serviço', 'Últimas Férias', 'Data Desligamento', 'Observações'];
    
    const rows = data.map(c => {
        // Busca nascimento no cadastro mestre
        const master = orientadores.find(o => o.name === c.name);
        const birth = master ? master.birthDate : '';
        
        return [
            c.name,
            c.status,
            formatDate(birth),
            formatDate(c.admissionDate),
            calcDateDiffString(c.admissionDate, c.status === 'Desligado da Empresa' ? c.terminationDate : null),
            formatDate(c.lastVacationEnd),
            formatDate(c.terminationDate),
            c.observation
        ];
    });

    downloadXLSX("Relatorio_RH_Colaboradores", headers, rows, "Equipe");
}

// 4. Exportar INTEGRAÇÕES (Aba Integrações)
function exportIntegrationsExcel() {
    const data = integrations;
    // Adicionada coluna Responsável
    const headers = ['Município', 'APIs Integradas', 'Responsável Certificado', 'Vencimento', 'Dias Restantes', 'Observação'];
    
    const rows = data.map(i => {
        const diff = getDaysDiff(i.expirationDate);
        return [
            i.municipality,
            i.apis.join(', '),
            i.responsible || '', // Valor
            formatDate(i.expirationDate),
            diff + " dias",
            i.observation
        ];
    });

    downloadXLSX("Relatorio_Integracoes_APIs", headers, rows, "Integrações");
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
    // 1. Máscaras de Telefone
    const phoneInputs = [
        'municipality-contact', 'task-contact', 'orientador-contact', 
        'request-contact', 'production-contact'
    ];

    phoneInputs.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function(e) {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });

    // 2. Máscaras de Produção
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

    // 3. OTIMIZAÇÃO DE PERFORMANCE (DEBOUNCE) NOS FILTROS
    // Função Debounce: Espera o usuário parar de digitar por 400ms
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Seleciona todos os filtros
    const filters = document.querySelectorAll('.filters-section select, .filters-section input');
    
    filters.forEach(function(el) {
        // SE FOR TEXTO: Usa Debounce (Atraso para não travar)
        if (el.type === 'text' || el.type === 'search') {
            el.addEventListener('input', debounce(function() {
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab) refreshCurrentTab(activeTab.id);
            }, 400)); // 400ms de espera
        }
        // SE FOR DATA OU SELECT: Atualiza na hora (Change)
        else {
            el.addEventListener('change', function() {
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab) refreshCurrentTab(activeTab.id);
            });
        }
    });
}

// ----------------------------------------------------------------------------
// 7. INJEÇÃO DE CAMPOS DINÂMICOS
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
            mustChangePassword: false 
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
    integrations: [],
    apisList: [],
    collaboratorInfos: []
};

// Carrega usuários
let users = recuperarDoArmazenamento('users', DADOS_PADRAO.users);

// CORREÇÃO DE LOGIN: Se o ADMIN estiver sem senha (null), define 'saude2025'
if (users.length > 0 && users[0].login === 'ADMIN' && !users[0].passwordHash) {
    // Gera segurança
    users[0].salt = generateSalt();
    // Define a senha padrão
    users[0].passwordHash = hashPassword('saude2025', users[0].salt);
    
    // Salva
    salvarNoArmazenamento('users', users);
    console.log('🔒 Senha do ADMIN configurada para: saude2025');
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
let collaboratorInfos = recuperarDoArmazenamento('collaboratorInfos', []);
let loginAttempts = recuperarDoArmazenamento('loginAttempts', {});

// Contadores de ID (Persistidos)
let counters = recuperarDoArmazenamento('counters', {
    mun: 1, munList: 1, task: 1, req: 1, dem: 1, visit: 1, prod: 1, pres: 1, ver: 1, user: 2, cargo: 1, orient: 1, mod: 1, forma: 1,
    api: 1, integration: 1, colabInfo: 1
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
    
    // 2. Atualiza APENAS O ÍCONE do botão, sem texto
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        // Mantém apenas o emoji, sem a palavra "Tema"
        btn.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
        btn.title = currentTheme === 'light' ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro';
    }

    // 3. ATUALIZAÇÃO DO CHART.JS (CORREÇÃO FINA DE CORES)
    if (window.Chart) {
        if (currentTheme === 'dark') {
            Chart.defaults.color = '#e0e0e0';
            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; 
        } else {
            Chart.defaults.color = '#666666';
            Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
        }
        Object.values(Chart.instances).forEach(chart => {
            chart.options.scales.x && (chart.options.scales.x.grid.color = Chart.defaults.borderColor);
            chart.options.scales.y && (chart.options.scales.y.grid.color = Chart.defaults.borderColor);
            chart.update();
        });
    }

    // 4. Força a atualização da aba atual
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        setTimeout(() => { refreshCurrentTab(activeTab.id); }, 50);
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
    // 1. LIMPEZA DE MEMÓRIA (CRÍTICO)
    destroyAllCharts(); 

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
    
    // Configurações
    if (sectionId === 'cargos-section') renderCargos();
    if (sectionId === 'orientadores-section') renderOrientadores();
    if (sectionId === 'modulos-section') renderModulos();
    if (sectionId === 'municipalities-list-section') renderMunicipalityList();
    if (sectionId === 'formas-apresentacao-section') renderFormas();
    if (sectionId === 'apis-list-section') renderApiList();

    // Novas Abas
    if (sectionId === 'apis-section') {
        populateFilterSelects();
        renderIntegrations();
    }
    
    if (sectionId === 'info-colaboradores-section') renderCollaboratorInfos();

    if (sectionId === 'dashboard-section') { 
        updateDashboardStats(); 
        initializeDashboardCharts(); 
    }
    
    if (sectionId === 'audit-section') {
        renderAuditLogs();
    }
}
function navigateToHome() {
    const dashBtn = document.querySelector('.sidebar-btn[data-tab="dashboard"]');
    if (dashBtn) {
        dashBtn.click();
    }
}

// Função para abrir/fechar o menu de engrenagem (Configurações)
function toggleSettings() {
    const menu = document.getElementById('settings-menu');
    if (menu) {
        // Fecha notificações se estiver aberto
        const notifMenu = document.getElementById('notification-menu');
        if (notifMenu) notifMenu.classList.remove('show');
        
        menu.classList.toggle('show');
    }
}

// Funções de Atalho do Menu Configurações (CORRIGIDAS)
function navigateToUserManagement() { toggleSettings(); openTab('usuarios-section'); renderUsers(); }
function navigateToCargoManagement() { toggleSettings(); openTab('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettings(); openTab('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettings(); openTab('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettings(); openTab('municipalities-list-section'); renderMunicipalityList(); }
function navigateToFormaApresentacaoManagement() { toggleSettings(); openTab('formas-apresentacao-section'); renderFormas(); }
function navigateToApiListManagement() { toggleSettings(); openTab('apis-list-section'); renderApiList(); }
function navigateToBackupManagement() { toggleSettings(); openTab('backup-section'); updateBackupInfo(); }

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
    // Sanitiza inputs
    const name = sanitizeInput(document.getElementById('municipality-name').value);
    const status = document.getElementById('municipality-status').value;
    const mods = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
    
    // 1. BUSCA UF NA LISTA MESTRA (Para validar chave composta)
    const munData = municipalitiesList.find(m => m.name === name);
    const uf = munData ? munData.uf : '';

    // 2. VALIDAÇÃO DE DUPLICIDADE (Nome + UF)
    // Só barra se o Nome E a UF forem iguais a um registro existente
    const isDuplicate = municipalities.some(m => 
        m.name === name && 
        (m.uf === uf || !m.uf) && // Compatibilidade com registros antigos sem UF
        m.id !== editingId
    );

    if (isDuplicate) {
        alert(`Erro: O município "${name} - ${uf}" já está cadastrado na carteira!`);
        return;
    }

    // Validação "Em Uso"
    if (status === 'Em uso' && mods.length === 0) {
        alert('Erro: Para status "Em Uso", selecione pelo menos um módulo.');
        return;
    }

    // 3. VALIDAÇÃO DE DATA DE BLOQUEIO (Não pode ser futura)
    const dateBlocked = document.getElementById('municipality-date-blocked') ? document.getElementById('municipality-date-blocked').value : '';
    
    if (status === 'Bloqueado') {
        if (!dateBlocked) {
            alert('Erro: Preencha a "Data em que foi Bloqueado".');
            return;
        }
        
        const dBlock = new Date(dateBlocked);
        const today = new Date();
        today.setHours(0,0,0,0); // Zera horas para comparar apenas dia

        if (dBlock > today) {
            alert('🚫 Erro Lógico: A data de bloqueio não pode ser uma data futura.');
            return;
        }
    }

    const data = {
        name: name,
        uf: uf, // Agora salvamos a UF junto com o cliente
        status: status,
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
        logSystemAction('Criação', 'Municípios', `Novo cliente: ${data.name} - ${data.uf}`);
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
                <td style="font-size:11px;">${calculateTimeInUse(m.implantationDate)}</td> <td style="font-size:11px;">${formatDate(m.lastVisit)}</td> <td style="font-size:11px;">${calculateTimeInUse(m.lastVisit)}</td>
                
                <td><span class="${stCls}">${m.status}</span></td>
                <td style="color:${corDataFim}; font-size:11px;">${dataFim}</td>
                <td><button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button><button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button></td>
            </tr>`;
        }).join('');
        
        // Cabeçalho da Tabela (Reordenado)
        c.innerHTML = `<table><thead>
            <th>Município</th>
            <th>Módulos Em Uso</th>
            <th>Gestor(a) Atual</th>
            <th>Contato</th>
            <th>Data de<br>Implantação</th>
            <th>Tempo de Uso</th> <th>Última Visita<br>Presencial</th> <th>Tempo sem Visita</th> 
            <th>Status</th>
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
    // Contadores (SEM A MÉDIA DE DIAS)
    if(document.getElementById('total-municipalities')) document.getElementById('total-municipalities').textContent = data.length;
    if(document.getElementById('active-municipalities')) document.getElementById('active-municipalities').textContent = data.filter(m => m.status === 'Em uso').length;
    if(document.getElementById('inactive-municipalities')) document.getElementById('inactive-municipalities').textContent = data.filter(m => m.status !== 'Em uso').length;
}

function deleteMunicipality(id) {
    if (confirm('Excluir este município?')) {
        const item = municipalities.find(x => x.id === id);
        if(item) {
            // 1. Registra o Undo
            registerUndo(item, 'municipalities', renderMunicipalities);
            
            // 2. Exclui
            municipalities = municipalities.filter(x => x.id !== id);
            salvarNoArmazenamento('municipalities', municipalities);
            renderMunicipalities();
            updateGlobalDropdowns();
            
            logSystemAction('Exclusão', 'Municípios', `Município excluído: ${item.name}`);
        }
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
// CORREÇÃO: Validação de Datas (Incluindo Aba Colaboradores)
// CORREÇÃO DEFINITIVA: Validação de Datas (Trava Imediata)
// CORREÇÃO DEFINITIVA: Validação de Datas (Trava Imediata)
// CORREÇÃO DEFINITIVA: Validação de Datas (Trava de Segurança)
// CORREÇÃO DEFINITIVA: Validação de Datas (Com Objetos de Data)
function validateDateRange(type) {
    let startId, endId;

    // Mapeamento
    if (type === 'colab') {
        startId = 'filter-colab-info-start'; endId = 'filter-colab-info-end';
    } else if (type === 'integration') {
        startId = 'filter-integration-start'; endId = 'filter-integration-end';
    } else {
        // Fallback genérico para outros filtros
        // Adicione aqui os outros 'else if' se necessário, mas o foco é o colab agora
        return; 
    }

    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endId);
    
    if (startInput && endInput) {
        // 1. Configura o atributo 'min' visualmente
        if (startInput.value) {
            endInput.min = startInput.value;
        } else {
            endInput.removeAttribute('min');
        }

        // 2. Validação Lógica (Data Real)
        if (startInput.value && endInput.value) {
            const dtStart = new Date(startInput.value);
            const dtEnd = new Date(endInput.value);

            // Se a Data Final for MENOR que a Inicial
            if (dtEnd < dtStart) {
                alert('🚫 Erro: A Data Final não pode ser anterior à Data Inicial.');
                endInput.value = ''; // Limpa o campo incorreto
            }
        }
    }

    // Refresh da tabela
    if (type === 'colab') renderCollaboratorInfos();
    else if (type === 'integration') renderIntegrations();
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

// 1. TREINAMENTOS
function deleteTask(id) {
    if (confirm('Excluir este treinamento?')) {
        const item = tasks.find(x => x.id === id);
        if(item) {
            registerUndo(item, 'tasks', renderTasks); // Registra Undo
            tasks = tasks.filter(x => x.id !== id);
            salvarNoArmazenamento('tasks', tasks);
            renderTasks();
            logSystemAction('Exclusão', 'Treinamentos', `Treinamento excluído: ${item.municipality}`);
        }
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

// 2. SOLICITAÇÕES
function deleteRequest(id) {
    if (confirm('Excluir solicitação?')) {
        const item = requests.find(x => x.id === id);
        if(item) {
            registerUndo(item, 'requests', renderRequests); // Registra Undo
            requests = requests.filter(x => x.id !== id);
            salvarNoArmazenamento('requests', requests);
            renderRequests();
            logSystemAction('Exclusão', 'Solicitações', `Solicitação excluída: ${item.municipality}`);
        }
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

// 6. APRESENTAÇÕES
function deletePresentation(id) {
    if (confirm('Excluir apresentação?')) {
        const item = presentations.find(x => x.id === id);
        if(item) {
            registerUndo(item, 'presentations', renderPresentations); // Registra Undo
            presentations = presentations.filter(x => x.id !== id);
            salvarNoArmazenamento('presentations', presentations);
            renderPresentations();
            logSystemAction('Exclusão', 'Apresentações', `Apresentação excluída: ${item.municipality}`);
        }
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

// 3. DEMANDAS
function deleteDemand(id) {
    if (confirm('Excluir demanda?')) {
        const item = demands.find(x => x.id === id);
        if(item) {
            registerUndo(item, 'demands', renderDemands); // Registra Undo
            demands = demands.filter(x => x.id !== id);
            salvarNoArmazenamento('demands', demands);
            renderDemands();
            logSystemAction('Exclusão', 'Demandas', `Demanda excluída (ID ${id})`);
        }
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

// 4. VISITAS
function deleteVisit(id) {
    if (confirm('Excluir visita?')) {
        const item = visits.find(x => x.id === id);
        if(item) {
            registerUndo(item, 'visits', renderVisits); // Registra Undo
            visits = visits.filter(x => x.id !== id);
            salvarNoArmazenamento('visits', visits);
            renderVisits();
            logSystemAction('Exclusão', 'Visitas', `Visita excluída: ${item.municipality}`);
        }
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

// 5. PRODUÇÃO
function deleteProduction(id) {
    if (confirm('Excluir envio?')) {
        const item = productions.find(x => x.id === id);
        if(item) {
            registerUndo(item, 'productions', renderProductions); // Registra Undo
            productions = productions.filter(x => x.id !== id);
            salvarNoArmazenamento('productions', productions);
            renderProductions();
            logSystemAction('Exclusão', 'Produção', `Envio excluído: ${item.municipality}`);
        }
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

// 8. USUÁRIOS (Admin)
function deleteUser(id) { 
    const u=users.find(x=>x.id===id); 
    if(u.login==='ADMIN'){alert('Não pode excluir ADMIN');return;} 
    if(confirm('Excluir usuário?')){
        registerUndo(u, 'users', renderUsers);
        users=users.filter(x=>x.id!==id); 
        salvarNoArmazenamento('users',users); 
        renderUsers();
    }
}
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

function deleteCargo(id){ if(confirm('Excluir?')){ const i=cargos.find(x=>x.id===id); if(i) registerUndo(i,'cargos',renderCargos); cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}
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

function deleteOrientador(id){ if(confirm('Excluir?')){ const i=orientadores.find(x=>x.id===id); if(i) registerUndo(i,'orientadores',renderOrientadores); orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}
function closeOrientadorModal(){document.getElementById('orientador-modal').classList.remove('show');}

// Módulos
function showModuloModal(id=null){ editingId=id; document.getElementById('modulo-form').reset(); const form=document.getElementById('modulo-form'); if(!document.getElementById('modulo-description')) { const div=document.createElement('div'); div.className='form-group'; div.innerHTML=`<label class="form-label">Descrição</label><textarea class="form-control" id="modulo-description"></textarea>`; form.insertBefore(div, form.querySelector('.modal-actions')); } if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name; if(document.getElementById('modulo-abbreviation')) document.getElementById('modulo-abbreviation').value=m.abbreviation; if(document.getElementById('modulo-description')) document.getElementById('modulo-description').value=m.description||'';} document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e) {
    e.preventDefault();
    
    const data = {
        name: sanitizeInput(document.getElementById('modulo-name').value),
        abbreviation: sanitizeInput(document.getElementById('modulo-abbreviation').value),
        description: sanitizeInput(document.getElementById('modulo-description').value)
    };

    if (editingId) {
        const i = modulos.findIndex(x => x.id === editingId);
        
        if (i !== -1) {
            // --- 1. LÓGICA DE CASCATA (ATUALIZAR VÍNCULOS) ---
            const oldName = modulos[i].name;
            const newName = data.name;

            // Se o nome mudou, vai em cada município e atualiza
            if (oldName !== newName) {
                let mudouAlgo = false;
                
                municipalities.forEach(mun => {
                    if (mun.modules && mun.modules.includes(oldName)) {
                        // Encontra o índice do módulo antigo e troca pelo novo
                        const idx = mun.modules.indexOf(oldName);
                        if (idx !== -1) {
                            mun.modules[idx] = newName;
                            mudouAlgo = true;
                        }
                    }
                });

                // Se houve mudança nos municípios, salva e atualiza a tela deles
                if (mudouAlgo) {
                    salvarNoArmazenamento('municipalities', municipalities);
                    
                    // Se a lista de municípios estiver visível, atualiza ela também
                    const activeTab = document.querySelector('.tab-content.active');
                    if (activeTab && activeTab.id === 'municipios-section') {
                        renderMunicipalities();
                    }
                }
            }
            
            // Atualiza o módulo em si
            modulos[i] = { ...modulos[i], ...data };
        }
    } else {
        modulos.push({ id: getNextId('mod'), ...data });
    }

    salvarNoArmazenamento('modulos', modulos);
    document.getElementById('modulo-modal').classList.remove('show');
    
    renderModulos();
    
    // --- 2. ATUALIZAÇÃO IMEDIATA DOS FILTROS ---
    // Esta função reconstrói todos os dropdowns, incluindo o filtro da aba municípios
    updateGlobalDropdowns();
    
    showToast('Módulo salvo com sucesso!', 'success');
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

function deleteModulo(id){ if(confirm('Excluir?')){ const i=modulos.find(x=>x.id===id); if(i) registerUndo(i,'modulos',renderModulos); modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}
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

function deleteMunicipalityList(id){ if(confirm('Excluir?')){ const i=municipalitiesList.find(x=>x.id===id); if(i) registerUndo(i,'municipalitiesList',renderMunicipalityList); municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}
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

function deleteForma(id){ if(confirm('Excluir?')){ const i=formasApresentacao.find(x=>x.id===id); if(i) registerUndo(i,'formasApresentacao',renderFormas); formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}
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
    // 1. Coleta todos os dados atuais (INCLUINDO AS NOVIDADES)
    const backupData = { 
        version: "v4.5", 
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
            
            // --- NOVOS DADOS (INTEGRAÇÕES E COLABORADORES) ---
            integrations: integrations,
            apisList: apisList,
            collaboratorInfos: collaboratorInfos, // <--- O item da dúvida F
            
            counters: counters,
            auditLogs: auditLogs
        } 
    };
    
    // 2. Gera o Timestamp
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

    // --- VALIDAÇÃO DE SEGURANÇA (NOVO) ---
    // Verifica se o arquivo tem a estrutura mínima esperada
    const d = pendingBackupData.data;
    
    if (!d || typeof d !== 'object') {
        alert('❌ Erro Crítico: O arquivo selecionado não é um backup válido ou está corrompido.');
        return;
    }

    // Verifica chaves essenciais para garantir integridade
    const chavesEssenciais = ['users', 'municipalities'];
    const chavesFaltantes = chavesEssenciais.filter(key => !Array.isArray(d[key]));

    if (chavesFaltantes.length > 0) {
        alert('❌ Erro Crítico: O backup está incompleto. Faltam os dados: ' + chavesFaltantes.join(', '));
        return;
    }
    // -------------------------------------

    // 1. Preserva o Usuário Logado Atual (Para não deslogar)
    const sessionUser = recuperarDoArmazenamento('currentUser');

    // 2. Limpa o LocalStorage
    localStorage.clear();

    // 3. Atualiza as Variáveis Globais e Salva
    
    users = d.users || []; salvarNoArmazenamento('users', users);
    municipalities = d.municipalities || []; salvarNoArmazenamento('municipalities', municipalities);
    municipalitiesList = d.municipalitiesList || []; salvarNoArmazenamento('municipalitiesList', municipalitiesList);
    tasks = d.tasks || d.trainings || []; salvarNoArmazenamento('tasks', tasks);
    requests = d.requests || []; salvarNoArmazenamento('requests', requests);
    demands = d.demands || []; salvarNoArmazenamento('demands', demands);
    visits = d.visits || []; salvarNoArmazenamento('visits', visits);
    productions = d.productions || []; salvarNoArmazenamento('productions', productions);
    presentations = d.presentations || []; salvarNoArmazenamento('presentations', presentations);
    systemVersions = d.systemVersions || []; salvarNoArmazenamento('systemVersions', systemVersions);
    cargos = d.cargos || []; salvarNoArmazenamento('cargos', cargos);
    orientadores = d.orientadores || []; salvarNoArmazenamento('orientadores', orientadores);
    modulos = d.modules || d.modulos || []; salvarNoArmazenamento('modulos', modulos);
    formasApresentacao = d.formasApresentacao || []; salvarNoArmazenamento('formasApresentacao', formasApresentacao);
    
    // Novos Dados
    integrations = d.integrations || []; salvarNoArmazenamento('integrations', integrations);
    apisList = d.apisList || []; salvarNoArmazenamento('apisList', apisList);
    collaboratorInfos = d.collaboratorInfos || []; salvarNoArmazenamento('collaboratorInfos', collaboratorInfos);

    if (d.counters) {
        counters = d.counters;
        salvarNoArmazenamento('counters', counters);
    }

    // Auditoria
    auditLogs = d.auditLogs || [];
    auditLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: sessionUser ? sessionUser.name : 'Admin',
        action: 'Restauração',
        target: 'Sistema Completo',
        details: 'Restaurou backup de: ' + (pendingBackupData.date || 'Data desconhecida')
    });
    salvarNoArmazenamento('auditLogs', auditLogs);

    // 4. Restaura a Sessão
    if (sessionUser) {
        currentUser = sessionUser;
        salvarNoArmazenamento('currentUser', currentUser);
        isAuthenticated = true;
    }

    // 5. Atualiza a Interface
    initializeApp(); 
    closeRestoreConfirmModal();
    
    alert('✅ Dados restaurados e verificados com sucesso!');
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

// CORREÇÃO CRÍTICA: Destruição Centralizada de Gráficos (Memory Leak Fix)
function destroyAllCharts() {
    // Lista com TODAS as variáveis de gráficos do sistema
    const allCharts = [
        // Dashboard
        chartInstanceEvo, chartInstance1, chartInstance2, chartInstance3, 
        chartInstance4, chartInstanceUser, chartInstanceColab,
        // Municípios
        chartStatusMun, chartModulesMun, chartTimelineMun,
        // Solicitações
        chartStatusReq, chartMunReq, chartSolReq,
        // Demandas
        chartStatusDem, chartPrioDem, chartUserDem,
        // Visitas
        chartStatusVis, chartMunVis, chartSolVis,
        // Produção
        chartStatusProd, chartFreqProd,
        // Apresentações
        chartStatusPres, chartMunPres, chartOrientPres,
        // Integrações
        chartInstanceApis,
        // Colaboradores
        chartColabTime, chartColabHires
    ];

    allCharts.forEach(chartInstance => {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            try {
                chartInstance.destroy();
            } catch (e) {
                console.warn('Erro ao destruir gráfico:', e);
            }
        }
    });
    
    // Reseta as variáveis globais para null
    chartInstanceEvo = null; chartInstance1 = null; chartInstance2 = null;
    chartInstance3 = null; chartInstance4 = null; chartInstanceUser = null;
    chartInstanceColab = null; chartStatusMun = null; chartModulesMun = null;
    chartTimelineMun = null; chartStatusReq = null; chartMunReq = null;
    chartSolReq = null; chartStatusDem = null; chartPrioDem = null;
    chartUserDem = null; chartStatusVis = null; chartMunVis = null;
    chartSolVis = null; chartStatusProd = null; chartFreqProd = null;
    chartStatusPres = null; chartMunPres = null; chartOrientPres = null;
    chartInstanceApis = null; chartColabTime = null; chartColabHires = null;
}

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
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }}
        });
    }
    // --- NOVO: IMPLANTAÇÕES AO LONGO DO TEMPO (LINHA ACUMULADA) ---
    // (Movido da aba Municípios para cá)
    const ctxTimeline = document.getElementById('timelineChart');
    if (ctxTimeline) {
        if (chartTimelineMun) chartTimelineMun.destroy();
        
        // Usa a variável global 'municipalities'
        const implantations = municipalities
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
        
        chartTimelineMun = new Chart(ctxTimeline, {
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
                            label: function(context) { return `Total Acumulado: ${context.raw}`; }
                        }
                    }
                },
                scales: { y: { beginAtZero: true } }
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

// Função utilitária para preencher selects
function populateSelect(select, data, valKey, textKey) {
    if(!select) return;
    const current = select.value;
    let html = '<option value="">Selecione...</option>';
    
    // Ordenação segura
    const sortedData = data.slice().sort(function(a,b){ 
        return a[textKey].localeCompare(b[textKey]); 
    });

    sortedData.forEach(function(i) { 
        html += '<option value="' + i[valKey] + '">' + i[textKey] + '</option>'; 
    });
    
    select.innerHTML = html;
    select.value = current;
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
        'integration-municipality'
    ];

    // Prepara a lista ordenada (Nome - UF)
    const listaMestra = (typeof municipalitiesList !== 'undefined') ? 
        municipalitiesList.slice().sort((a,b) => a.name.localeCompare(b.name)) : [];

    // Preenche os selects de município nos formulários
    formMunSelects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value;
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

    // Preenche select do Modal de Ficha de Colaborador (NOVO)
    const colabInfoSelect = document.getElementById('colab-info-name');
    if(colabInfoSelect) {
        populateSelect(colabInfoSelect, orientadores, 'name', 'name');
    }

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

    // 1. FILTROS DE MUNICÍPIO
    const munFilterIds = [
        'filter-municipality-name', 
        'filter-task-municipality', 
        'filter-request-municipality',
        'filter-visit-municipality', 
        'filter-production-municipality', 
        'filter-presentation-municipality',
        'filter-integration-municipality'
    ];

    munFilterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const cur = el.value;
            el.innerHTML = '<option value="">Todos</option>' + 
                           sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
            if(cur) el.value = cur;
            
            if(id === 'filter-integration-municipality') el.onchange = renderIntegrations;
        }
    });

    // --- FILTROS DO RELATÓRIO DE TREINAMENTOS ---
    
    // 1. Município
    const repTrainMun = document.getElementById('rep-train-mun');
    if (repTrainMun) {
        const cur = repTrainMun.value;
        repTrainMun.innerHTML = '<option value="">Todos</option>' + sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        if(cur) repTrainMun.value = cur;
    }

    // 2. Colaborador
    const repTrainColab = document.getElementById('rep-train-colab');
    if (repTrainColab) {
        const cur = repTrainColab.value;
        repTrainColab.innerHTML = '<option value="">Todos</option>' + sortedOrient.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
        if(cur) repTrainColab.value = cur;
    }

    // 3. Cargo
    const repTrainCargo = document.getElementById('rep-train-cargo');
    if (repTrainCargo) {
        const cur = repTrainCargo.value;
        // 'sortedCargos' deve estar declarado no início da função populateFilterSelects
        repTrainCargo.innerHTML = '<option value="">Todos</option>' + sortedCargos.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        if(cur) repTrainCargo.value = cur;
    }

    // --- FILTROS DO RELATÓRIO DE APRESENTAÇÕES ---
    
    // 1. Município
    const repPresMun = document.getElementById('rep-pres-mun');
    if (repPresMun) {
        const cur = repPresMun.value;
        repPresMun.innerHTML = '<option value="">Todos</option>' + sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        if(cur) repPresMun.value = cur;
    }

    // 2. Colaborador
    const repPresColab = document.getElementById('rep-pres-colab');
    if (repPresColab) {
        const cur = repPresColab.value;
        repPresColab.innerHTML = '<option value="">Todos</option>' + sortedOrient.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
        if(cur) repPresColab.value = cur;
    }

    // 3. Formas de Apresentação
    const repPresForm = document.getElementById('rep-pres-form');
    if (repPresForm && typeof formasApresentacao !== 'undefined') {
        const cur = repPresForm.value;
        // Ordena as formas antes de exibir
        const sortedFormas = formasApresentacao.slice().sort((a,b) => a.name.localeCompare(b.name));
        repPresForm.innerHTML = '<option value="">Todas</option>' + sortedFormas.map(f => `<option value="${f.name}">${f.name}</option>`).join('');
        if(cur) repPresForm.value = cur;
    }

    // --- FILTROS DO RELATÓRIO DE VISITAS ---
    const repVisMun = document.getElementById('rep-vis-mun');
    if (repVisMun) {
        const cur = repVisMun.value;
        repVisMun.innerHTML = '<option value="">Todos</option>' + sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        if(cur) repVisMun.value = cur;
    }

    // --- FILTROS DO RELATÓRIO DE PRODUÇÃO ---
    const repProdMun = document.getElementById('rep-prod-mun');
    if (repProdMun) {
        const cur = repProdMun.value;
        repProdMun.innerHTML = '<option value="">Todos</option>' + sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        if(cur) repProdMun.value = cur;
    }
    // --- FILTROS DO RELATÓRIO DE INTEGRAÇÕES ---
    const repIntMun = document.getElementById('rep-int-mun');
    if (repIntMun) {
        const cur = repIntMun.value;
        repIntMun.innerHTML = '<option value="">Todos</option>' + sortedMun.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        if(cur) repIntMun.value = cur;
    }

    const repIntApi = document.getElementById('rep-int-api');
    if (repIntApi && typeof apisList !== 'undefined') {
        const cur = repIntApi.value;
        // sortedApis deve vir da sua lista global de apis cadastradas
        repIntApi.innerHTML = '<option value="">Todas</option>' + sortedApis.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
        if(cur) repIntApi.value = cur;
    }
    // --- FILTROS DO RELATÓRIO DE COLABORADORES ---
    const repColabName = document.getElementById('rep-colab-name');
    if (repColabName) {
        const cur = repColabName.value;
        // sortedOrient vem da lista global de orientadores
        repColabName.innerHTML = '<option value="">Todos</option>' + sortedOrient.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
        if(cur) repColabName.value = cur;
    }

    // 2. FILTRO DE API
    const apiFilter = document.getElementById('filter-integration-api');
    if (apiFilter) {
        const cur = apiFilter.value;
        apiFilter.innerHTML = '<option value="">Todas</option>' + 
                              sortedApis.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
        if(cur) apiFilter.value = cur;
        apiFilter.onchange = renderIntegrations;
    }

    // 3. OUTROS FILTROS
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

    // 4. FILTROS DE USUÁRIO
    ['filter-request-user', 'filter-demand-user'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { 
            const c=el.value; 
            el.innerHTML = '<option value="">Todos</option>' + sortedUsers.map(o => `<option value="${o.name}">${o.name}</option>`).join(''); 
            if(c) el.value=c; 
        }
    });

    // 5. FILTRO DA ABA COLABORADORES INFO (NOVO)
    const filterColabInfoName = document.getElementById('filter-colab-info-name');
    if(filterColabInfoName) {
        const cur = filterColabInfoName.value;
        filterColabInfoName.innerHTML = '<option value="">Todos</option>' + sortedOrient.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
        if(cur) filterColabInfoName.value = cur;
        filterColabInfoName.onchange = renderCollaboratorInfos;
    }
    
    // Listeners para outros filtros da aba Colaboradores
    ['filter-colab-info-status', 'filter-colab-info-start', 'filter-colab-info-end'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.onchange = renderCollaboratorInfos;
    });
}
// ... (código existente da função populateFilterSelects) ...

    // --- FILTRO DE MÓDULOS (ABA MUNICÍPIOS) ---
    const filterMod = document.getElementById('filter-municipality-module');
    if (filterMod && typeof modulos !== 'undefined') {
        const cur = filterMod.value; // Guarda valor atual se houver
        
        // Ordena os módulos por nome
        const sortedMods = modulos.slice().sort((a,b) => a.name.localeCompare(b.name));
        
        // Preenche o select
        filterMod.innerHTML = '<option value="">Todos</option>' + 
                              sortedMods.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        
        // Restaura valor selecionado (se ainda existir na lista)
        if(cur) filterMod.value = cur;
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
    checkSystemNotifications();
    initOfflineDetection();
    
    // Listener do Menu Mobile
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.onclick = toggleMobileMenu;
    }
    
    if(!document.querySelector('.sidebar-btn.active')) {
        navigateToHome();
    }

    // --- BLOCO DE SEGURANÇA REMOVIDO PARA TESTES ---
    /* if (currentUser && currentUser.mustChangePassword) {
        alert('⚠️ Aviso de Segurança: ...');
        showChangePasswordModal();
    }
    */
}
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    // FECHAR MODAIS E MENUS AO CLICAR FORA
    window.onclick = function(e) { 
        // 1. Fecha Modais
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }

        // 2. Fecha Menus Suspensos (Configurações e Notificações)
        // Se o clique NÃO foi dentro de um dropdown, fecha todos
        if (!e.target.closest('.settings-dropdown')) {
            const menus = document.querySelectorAll('.settings-menu');
            menus.forEach(menu => {
                menu.classList.remove('show');
            });
        }
    };
    
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

    toggleSettings(); // <--- CORREÇÃO AQUI (Antes estava toggleSettingsMenu)
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
                case 'visitas':
            exportReportVisitasExcel();
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

// SEGURANÇA: Timeout de Sessão Sincronizado (Smart Session)
function resetInactivityTimer() {
    if (!currentUser) return;

    // 1. Marca no banco que houve atividade AGORA
    localStorage.setItem('lastActivityTime', Date.now().toString());
    
    // 2. Reinicia o contador local
    startLocalTimer();
}

function startLocalTimer() {
    clearTimeout(inactivityTimeout);
    
    inactivityTimeout = setTimeout(() => {
        // Antes de deslogar, verifica se houve atividade em OUTRA aba recentemente
        const lastActivity = parseInt(localStorage.getItem('lastActivityTime') || 0);
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;
        const timeoutMs = INACTIVITY_MINUTES * 60 * 1000;

        if (timeSinceLastActivity < timeoutMs) {
            // Se houve atividade recente em outra aba, apenas reinicia este timer
            // (Sincroniza sem deslogar)
            startLocalTimer();
        } else {
            // Realmente expirou em todas as abas
            alert('⏱️ Sua sessão expirou por tempo de inatividade.\nPor segurança, você foi desconectado.');
            localStorage.removeItem('currentUser');
            location.reload();
        }
    }, INACTIVITY_MINUTES * 60 * 1000);
}

function initializeInactivityTracking() {
    // Eventos locais (Mouse, Teclado)
    window.onload = resetInactivityTimer;
    document.onmousemove = resetInactivityTimer;
    document.onkeypress = resetInactivityTimer;
    document.onclick = resetInactivityTimer;
    document.onscroll = resetInactivityTimer;

    // Evento Remoto: Se outra aba atualizar o 'lastActivityTime', reiniciamos nosso timer
    window.addEventListener('storage', (e) => {
        if (e.key === 'lastActivityTime') {
            startLocalTimer(); // Apenas reseta o relógio, sem escrever no storage (evita loop)
        }
    });
    
    // Inicia o monitoramento de bloqueio também
    initCrossTabRateLimit();
}

// CORREÇÃO: Sanitização XSS Robusta (Fase 2)
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Usa o próprio navegador para converter HTML em texto seguro
    const textarea = document.createElement('textarea');
    textarea.textContent = input;
    let sanitized = textarea.innerHTML;

    // Remove tags perigosas específicas e event handlers
    sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '') // Remove onmouseover, onclick, etc
        .replace(/<iframe [^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
        .replace(/<embed [^>]*>/gi, '');

    return sanitized.trim();
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

function deleteApiList(id){ if(confirm('Excluir?')){ const i=apisList.find(x=>x.id===id); if(i) registerUndo(i,'apisList',renderApiList); apisList=apisList.filter(x=>x.id!==id); salvarNoArmazenamento('apisList',apisList); renderApiList(); updateGlobalDropdowns(); }}

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
    
    // 1. Coleta e Valida APIs selecionadas
    const apisSel = Array.from(document.querySelectorAll('.api-check:checked')).map(c => c.value);
    
    if (apisSel.length === 0) {
        alert('Selecione pelo menos uma API Integrada.');
        return;
    }

    // 2. Captura os valores dos campos
    const munName = document.getElementById('integration-municipality').value;
    const resp = sanitizeInput(document.getElementById('integration-responsible').value);
    
    // Validação Manual do Responsável
    if (!resp) {
        alert('O campo Responsável pelo Certificado é obrigatório.');
        return;
    }

    if (!munName) {
        alert('Selecione um município.');
        return;
    }

    // --- NOVA VALIDAÇÃO DE DUPLICIDADE ---
    // Verifica se já existe uma integração para este município na lista.
    // O '&& i.id !== editingId' garante que, se estivermos EDITANDO o próprio registro, 
    // ele não acuse duplicidade com ele mesmo.
    const isDuplicate = integrations.some(i => i.municipality === munName && i.id !== editingId);

    if (isDuplicate) {
        alert(`🚫 Erro: O município "${munName}" já possui uma integração cadastrada!\n\nPor favor, edite o registro existente na lista.`);
        return; // Para a execução aqui
    }
    // -------------------------------------

    const data = {
        municipality: munName,
        expirationDate: document.getElementById('integration-expiration').value,
        responsible: resp,
        apis: apisSel,
        observation: sanitizeInput(document.getElementById('integration-observation').value)
    };

    if(editingId) {
        // Modo Edição
        const i = integrations.findIndex(x => x.id === editingId);
        if(i !== -1) integrations[i] = { ...integrations[i], ...data };
    } else {
        // Modo Criação (Novo)
        integrations.push({ id: getNextId('integration'), ...data });
    }

    salvarNoArmazenamento('integrations', integrations);
    document.getElementById('integration-modal').classList.remove('show');
    clearIntegrationFilters();
    
    logSystemAction(editingId ? 'Edição' : 'Criação', 'Integrações', `Município: ${data.municipality} | Resp: ${data.responsible}`);
    showToast('Integração salva com sucesso!', 'success');
}

// --- GERENCIAMENTO DE INTEGRAÇÕES (ABA PRINCIPAL) CORRIGIDO ---

function renderIntegrations() {
    // ... (Filtros permanecem iguais) ...
    const fMun = document.getElementById('filter-integration-municipality')?.value;
    const fApi = document.getElementById('filter-integration-api')?.value;
    const fStatus = document.getElementById('filter-integration-status')?.value;
    const fStart = document.getElementById('filter-integration-start')?.value;
    const fEnd = document.getElementById('filter-integration-end')?.value;

    let filtered = integrations.filter(i => {
        if (fMun && i.municipality !== fMun) return false;
        if (fApi && (!i.apis || !i.apis.includes(fApi))) return false;
        if (fStart && i.expirationDate < fStart) return false;
        if (fEnd && i.expirationDate > fEnd) return false;
        if (fStatus) {
            const diff = getDaysDiff(i.expirationDate);
            if (fStatus === 'Vencido' && diff >= 0) return false;
            if (fStatus === 'Em dia' && diff < 0) return false;
        }
        return true;
    });

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
            const dateClass = isExpired ? 'date-expired' : 'date-valid';
            const dateText = formatDate(i.expirationDate);
            
            let daysText = '';
            if (isExpired) {
                daysText = `<span class="days-remaining-expired">Vencido há ${Math.abs(diff)} dias</span>`;
            } else if (diff === 0) {
                daysText = `<span class="days-remaining-expired">Vence Hoje!</span>`;
            } else {
                daysText = `<span class="days-remaining-valid">Vence em ${diff} dias</span>`;
            }

            const munData = municipalitiesList.find(m => m.name === i.municipality);
            const munDisplay = munData ? `${i.municipality} - ${munData.uf}` : i.municipality;

            const apisDisplay = (i.apis || []).map(apiName => {
                const apiObj = apisList.find(a => a.name === apiName);
                const tooltipText = apiObj ? apiObj.description : ''; 
                return `<span class="module-tag" 
                              style="background:#E1F5FE; color:#0277BD; border:1px solid #81D4FA; cursor: help;" 
                              title="${tooltipText}">${apiName}</span>`;
            }).join('');

            return `<tr>
                <td class="text-primary-cell">${munDisplay}</td>
                <td class="module-tags-cell">${apisDisplay}</td>
                <td>${i.responsible || '-'}</td> <td class="${dateClass}">${dateText}</td>
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

        // ATUALIZADO: Cabeçalho com a nova ordem
        c.innerHTML = `<table>
            <thead>
                <th>Município</th>
                <th>APIs Integradas</th>
                <th>Responsável</th> <th>Vencimento Certificado</th>
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
        const int = integrations.find(x => x.id == id);
        if (int) {
            // Verifica se o município ainda existe no select
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
            document.getElementById('integration-responsible').value = int.responsible || ''; // <--- NOVO
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
        const item = integrations.find(x => x.id == id);
        if(item) {
            // 1. Registra o Undo
            registerUndo(item, 'integrations', renderIntegrations);
            
            // 2. Exclui
            integrations = integrations.filter(x => x.id != id);
            salvarNoArmazenamento('integrations', integrations);
            renderIntegrations();
            
            logSystemAction('Exclusão', 'Integrações', `Integração ID: ${id}`);
        }
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

    // ----------------------------------------------------------------------------
// XX. INFORMAÇÕES DE COLABORADORES (ABA RH)
// ----------------------------------------------------------------------------

// Variáveis de Gráficos
let chartColabTime = null;
let chartColabHires = null;

// Função Auxiliar: Calcula diferença exata (Anos, Meses, Dias)
function calcDateDiffString(startDateStr, endDateStr = null) {
    if(!startDateStr) return '-';
    
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date(); // Se não tiver fim, usa hoje
    
    // Zera horas
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if(end < start) return "Data futura ou inválida";

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        // Dias no mês anterior
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if(years > 0) parts.push(`${years} ano(s)`);
    if(months > 0) parts.push(`${months} mês(es)`);
    if(days > 0) parts.push(`${days} dia(s)`);
    
    return parts.length > 0 ? parts.join(', ') : '0 dias';
}

function handleColabStatusChange() {
    const status = document.getElementById('colab-info-status').value;
    const groupTerm = document.getElementById('group-colab-termination');
    const inputTerm = document.getElementById('colab-info-termination');

    if(status === 'Desligado da Empresa') {
        groupTerm.style.display = 'block';
        inputTerm.required = true;
    } else {
        groupTerm.style.display = 'none';
        inputTerm.required = false;
        inputTerm.value = '';
    }
}

// Preenchimento Automático de Nascimento
function handleCollaboratorSelection() {
    const selectedName = document.getElementById('colab-info-name').value;
    const birthField = document.getElementById('colab-info-birth');
    
    if(!selectedName) {
        birthField.value = '';
        return;
    }

    // Busca no cadastro mestre de orientadores
    const colabMaster = orientadores.find(o => o.name === selectedName);
    if(colabMaster && colabMaster.birthDate) {
        birthField.value = colabMaster.birthDate;
    } else {
        birthField.value = ''; // Não tem data cadastrada lá
    }
}

function showColabInfoModal(id = null) {
    editingId = id;
    document.getElementById('colab-info-form').reset();
    
    if(document.getElementById('colab-info-counter')) {
        document.getElementById('colab-info-counter').textContent = '0 / 250';
    }
    
    // 1. GARANTE QUE OS NOMES ESTEJAM CARREGADOS
    updateGlobalDropdowns(); 

    // 2. BUSCA O REGISTRO
    if (id) {
        // Usa '==' para encontrar mesmo se um for número e outro texto
        const c = collaboratorInfos.find(x => x.id == id);
        
        if (c) {
            // Preenche os campos
            document.getElementById('colab-info-name').value = c.name;
            document.getElementById('colab-info-admission').value = c.admissionDate;
            document.getElementById('colab-info-status').value = c.status;
            document.getElementById('colab-info-vacation').value = c.lastVacationEnd || '';
            document.getElementById('colab-info-obs').value = c.observation || '';
            
            if (c.terminationDate) {
                document.getElementById('colab-info-termination').value = c.terminationDate;
            }
            
            // Preenche nascimento automaticamente
            handleCollaboratorSelection();
            
            if (c.observation && document.getElementById('colab-info-counter')) {
                document.getElementById('colab-info-counter').textContent = c.observation.length + ' / 250';
            }
        } else {
            console.warn("Colaborador não encontrado para o ID:", id);
        }
    }
    
    handleColabStatusChange();
    document.getElementById('colab-info-modal').classList.add('show');
}
function saveColabInfo(e) {
    e.preventDefault();
    const status = document.getElementById('colab-info-status').value;
    const termDate = document.getElementById('colab-info-termination').value;

    if (status === 'Desligado da Empresa' && !termDate) {
        alert('Data de Desligamento é obrigatória.'); return;
    }

    const name = document.getElementById('colab-info-name').value;
    
    // Validação de Duplicidade (Apenas se for NOVO)
    if (!editingId && collaboratorInfos.some(c => c.name === name)) {
        if (!confirm(`Já existe uma ficha para "${name}". Deseja criar outra?`)) return;
    }

    const data = {
        name: name,
        admissionDate: document.getElementById('colab-info-admission').value,
        status: status,
        terminationDate: termDate,
        lastVacationEnd: document.getElementById('colab-info-vacation').value,
        observation: sanitizeInput(document.getElementById('colab-info-obs').value)
    };

    if (editingId) {
        // CORREÇÃO: Usa '==' para encontrar o índice corretamente
        const i = collaboratorInfos.findIndex(x => x.id == editingId);
        
        if (i !== -1) {
            collaboratorInfos[i] = { ...collaboratorInfos[i], ...data };
            logSystemAction('Edição', 'Colaboradores Info', `Atualizou ficha: ${data.name}`);
        } else {
            // Se cair aqui, é porque perdeu o ID. Evita criar duplicado, avisa o erro.
            alert('Erro ao atualizar: Registro original não encontrado.');
            return; 
        }
    } else {
        collaboratorInfos.push({ id: getNextId('colabInfo'), ...data });
        logSystemAction('Criação', 'Colaboradores Info', `Nova ficha: ${data.name}`);
    }

    salvarNoArmazenamento('collaboratorInfos', collaboratorInfos);
    document.getElementById('colab-info-modal').classList.remove('show');
    renderCollaboratorInfos();
    showToast('Ficha salva com sucesso!', 'success');
}
function renderCollaboratorInfos() {
    // 1. Filtros
    const fName = document.getElementById('filter-colab-info-name')?.value;
    const fStatus = document.getElementById('filter-colab-info-status')?.value;
    const fStart = document.getElementById('filter-colab-info-start')?.value;
    const fEnd = document.getElementById('filter-colab-info-end')?.value;

    // 2. Filtragem
    let filtered = collaboratorInfos.filter(c => {
        if (fName && c.name !== fName) return false;
        if (fStatus && c.status !== fStatus) return false;
        if (fStart && c.admissionDate < fStart) return false;
        if (fEnd && c.admissionDate > fEnd) return false;
        return true;
    }).sort((a,b) => a.name.localeCompare(b.name));

    // 3. Contadores
    const countDiv = document.getElementById('colab-info-results-count');
    if(countDiv) {
        countDiv.style.display = 'block';
        countDiv.innerHTML = `<strong>${filtered.length}</strong> registros encontrados`;
    }

    // Separação
    const activeList = filtered.filter(c => c.status === 'Ativo na Empresa');
    const terminatedList = filtered.filter(c => c.status === 'Desligado da Empresa');

    const secActive = document.getElementById('section-colab-active');
    const secTerminated = document.getElementById('section-colab-terminated');
    const tableActive = document.getElementById('colab-active-table');
    const tableTerminated = document.getElementById('colab-terminated-table');

    // TABELA 1: ATIVOS
    if (activeList.length > 0) {
        secActive.style.display = 'block';
        const rowsActive = activeList.map(c => {
            const master = orientadores.find(o => o.name === c.name);
            const birthDate = master ? master.birthDate : null;
            const age = calcDateDiffString(birthDate);
            const serviceTime = calcDateDiffString(c.admissionDate, null);
            const timeSinceVacation = c.lastVacationEnd ? calcDateDiffString(c.lastVacationEnd) : '-';

            return `<tr>
                <td class="text-primary-cell"><strong>${c.name}</strong></td>
                <td>${formatDate(birthDate)}</td>
                <td>${age}</td>
                <td>${formatDate(c.admissionDate)}</td>
                <td>${serviceTime}</td>
                <td>${formatDate(c.lastVacationEnd)}</td>
                <td style="color:#C85250; font-weight:500;">${timeSinceVacation}</td>
                <td class="text-secondary-cell">${c.observation ? (c.observation.length > 20 ? c.observation.substr(0,20)+'...' : c.observation) : '-'}</td>
                <td>
                    <button class="btn btn--sm" onclick="showColabInfoModal(${c.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteColabInfo(${c.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');

        tableActive.innerHTML = `<table>
            <thead>
                <th>Colaborador</th>
                <th>Data Nasc.</th>
                <th>Idade</th>
                <th>Admissão</th>
                <th>Tempo de Serviço</th>
                <th>Últimas Férias</th>
                <th>Tempo s/ Férias</th>
                <th>Obs</th>
                <th style="width:90px;">Ações</th>
            </thead>
            <tbody>${rowsActive}</tbody>
        </table>`;
    } else {
        secActive.style.display = 'none';
    }

    // TABELA 2: DESLIGADOS (COLUNAS TROCADAS AQUI)
    if (terminatedList.length > 0) {
        secTerminated.style.display = 'block';
        const rowsTerm = terminatedList.map(c => {
            const master = orientadores.find(o => o.name === c.name);
            const birthDate = master ? master.birthDate : null;
            const age = calcDateDiffString(birthDate);
            const serviceTime = calcDateDiffString(c.admissionDate, c.terminationDate);

            // AQUI ESTÁ A TROCA: Primeiro Data Desligamento, depois Tempo de Serviço
            return `<tr>
                <td class="text-primary-cell"><strong>${c.name}</strong></td>
                <td>${formatDate(birthDate)}</td>
                <td>${age}</td>
                <td>${formatDate(c.admissionDate)}</td>
                <td style="color:#C85250; font-weight:bold;">${formatDate(c.terminationDate)}</td>
                <td style="font-weight:bold;">${serviceTime}</td>
                <td class="text-secondary-cell">${c.observation ? (c.observation.length > 20 ? c.observation.substr(0,20)+'...' : c.observation) : '-'}</td>
                <td>
                    <button class="btn btn--sm" onclick="showColabInfoModal(${c.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteColabInfo(${c.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');

        tableTerminated.innerHTML = `<table>
            <thead>
                <th>Colaborador</th>
                <th>Data Nasc.</th>
                <th>Idade</th>
                <th>Admissão</th>
                <th>Data Desligamento</th> 
                <th>Tempo de Serviço Total</th>
                <th>Obs</th>
                <th style="width:90px;">Ações</th>
            </thead>
            <tbody>${rowsTerm}</tbody>
        </table>`;
    } else {
        secTerminated.style.display = 'none';
    }

    // Atualiza Cards e Gráficos
    if(document.getElementById('total-colab-active')) 
        document.getElementById('total-colab-active').textContent = collaboratorInfos.filter(c => c.status === 'Ativo na Empresa').length;
    if(document.getElementById('total-colab-terminated')) 
        document.getElementById('total-colab-terminated').textContent = collaboratorInfos.filter(c => c.status === 'Desligado da Empresa').length;
    
    updateColabCharts(filtered);
}

function updateColabCharts(data) {
    if(!window.Chart) return;

    // 1. Gráfico: Tempo de Empresa (Agrupado por faixas)
    // < 1 ano, 1-3 anos, 3-5 anos, > 5 anos
    const ctxTime = document.getElementById('chartColabTime');
    if(ctxTime) {
        if(chartColabTime) chartColabTime.destroy();
        
        const counts = { '< 1 Ano': 0, '1-3 Anos': 0, '3-5 Anos': 0, '> 5 Anos': 0 };
        
        data.filter(c => c.status === 'Ativo na Empresa').forEach(c => {
            const start = new Date(c.admissionDate);
            const now = new Date();
            const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
            
            if(years < 1) counts['< 1 Ano']++;
            else if(years < 3) counts['1-3 Anos']++;
            else if(years < 5) counts['3-5 Anos']++;
            else counts['> 5 Anos']++;
        });

        chartColabTime = new Chart(ctxTime, {
            type: 'bar',
            data: {
                labels: Object.keys(counts),
                datasets: [{
                    label: 'Colaboradores Ativos',
                    data: Object.values(counts),
                    backgroundColor: ['#79C2A9', '#E7B85F', '#E68161', '#C85250']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 2. Gráfico: Contratações por Ano (Evolução)
    const ctxHires = document.getElementById('chartColabHires');
    if(ctxHires) {
        if(chartColabHires) chartColabHires.destroy();
        
        const hiresByYear = {};
        data.forEach(c => {
            if(c.admissionDate) {
                const year = c.admissionDate.split('-')[0];
                hiresByYear[year] = (hiresByYear[year] || 0) + 1;
            }
        });
        
        const sortedYears = Object.keys(hiresByYear).sort();
        
        chartColabHires = new Chart(ctxHires, {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: 'Contratações',
                    data: sortedYears.map(y => hiresByYear[y]),
                    borderColor: '#005580',
                    backgroundColor: 'rgba(0, 85, 128, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function deleteColabInfo(id) {
    if(confirm('Excluir esta ficha?')) {
        const item = collaboratorInfos.find(x => x.id == id); // Use == por segurança
        if(item) {
            // 1. Registra o Undo
            registerUndo(item, 'collaboratorInfos', renderCollaboratorInfos);
            
            // 2. Exclui
            collaboratorInfos = collaboratorInfos.filter(x => x.id != id);
            salvarNoArmazenamento('collaboratorInfos', collaboratorInfos);
            renderCollaboratorInfos();
        }
    }
}

function closeColabInfoModal() { document.getElementById('colab-info-modal').classList.remove('show'); }

function clearColabInfoFilters() {
    const ids = ['filter-colab-info-name', 'filter-colab-info-status', 'filter-colab-info-start', 'filter-colab-info-end'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; });
    renderCollaboratorInfos();
}
// ============================================================================
// FORÇAR VALIDAÇÃO DE DATAS (EVENT LISTENERS)
// Adicione isso no final do arquivo, ou dentro do DOMContentLoaded
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // ... seus outros códigos de inicialização ...

    // FORÇA O MONITORAMENTO DAS DATAS DE COLABORADORES
    const colabStart = document.getElementById('filter-colab-info-start');
    const colabEnd = document.getElementById('filter-colab-info-end');

    if (colabStart && colabEnd) {
        // Quando muda a data inicial
        colabStart.addEventListener('change', function() {
            validateDateRange('colab');
        });
        
        // Quando muda a data final
        colabEnd.addEventListener('change', function() {
            validateDateRange('colab');
        });
    }
});

// ============================================================================
// LÓGICA DE LAYOUT (DESKTOP)
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;

    if (sidebar) {
        // Quando o mouse entra na sidebar
        sidebar.addEventListener('mouseenter', function() {
            // Só ativa se for desktop (tela maior que 900px)
            if (window.innerWidth > 900) {
                body.classList.add('sidebar-is-expanded');
            }
        });

        // Quando o mouse sai da sidebar
        sidebar.addEventListener('mouseleave', function() {
            if (window.innerWidth > 900) {
                body.classList.remove('sidebar-is-expanded');
            }
        });
    }
});

// OTIMIZAÇÃO: Função Debounce (Espera o usuário parar de digitar)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Inicializa os filtros com Debounce automaticamente
document.addEventListener('DOMContentLoaded', function() {
    // Seleciona todos os inputs de texto dentro das áreas de filtro
    const filterInputs = document.querySelectorAll('.filters-section input[type="text"]');
    
    filterInputs.forEach(input => {
        // Remove o evento oninput original do HTML para não conflitar (opcional, mas recomendado)
        input.removeAttribute('oninput');

        // Descobre qual função de renderização chamar baseado no ID do input
        input.addEventListener('input', debounce(function(e) {
            const id = e.target.id;
            
            if (id.includes('municipality')) renderMunicipalities();
            else if (id.includes('task')) renderTasks();
            else if (id.includes('request')) renderRequests();
            else if (id.includes('demand')) renderDemands();
            else if (id.includes('visit')) renderVisits();
            else if (id.includes('production')) renderProductions();
            else if (id.includes('presentation')) renderPresentations();
            else if (id.includes('integration')) renderIntegrations();
            else if (id.includes('colab')) renderCollaboratorInfos();
            else if (id.includes('user')) renderUsers();
            else if (id.includes('audit')) renderAuditLogs();
            
        }, 400)); // Espera 400ms após a última digitação
    });
});

// SEGURANÇA: Sincronização de Bloqueio entre Abas (Cross-Tab)
function initCrossTabRateLimit() {
    window.addEventListener('storage', (event) => {
        // Se a lista de tentativas mudar em outra aba
        if (event.key === 'loginAttempts' && event.newValue) {
            const allAttempts = JSON.parse(event.newValue);
            
            // Verifica se o usuário ATUAL foi bloqueado recentemente
            if (currentUser && allAttempts[currentUser.login]) {
                const record = allAttempts[currentUser.login];
                
                if (record.locked) {
                    alert('🔒 SEGURANÇA: Sua conta foi bloqueada por excesso de tentativas em outra aba.');
                    localStorage.removeItem('currentUser');
                    location.reload();
                }
            }
        }
    });
}
// ============================================================================
// FASE 3: SISTEMA DE NOTIFICAÇÕES INTELIGENTES
// ============================================================================

let notifications = [];

function checkSystemNotifications() {
    notifications = []; // Limpa e recalcula
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. INTEGRAÇÕES: Certificados Vencendo (Regra: < 30 dias)
    if (typeof integrations !== 'undefined') {
        integrations.forEach(i => {
            if (i.expirationDate) {
                const diff = getDaysDiff(i.expirationDate);
                
                if (diff < 0) {
                    addNotification('danger', 'Certificado Vencido', 
                        `O certificado de <strong>${i.municipality}</strong> venceu há ${Math.abs(diff)} dias.`, 'apis-section');
                } else if (diff <= 15) {
                    addNotification('danger', 'Vence em Breve', 
                        `O certificado de <strong>${i.municipality}</strong> vence em ${diff} dias.`, 'apis-section');
                } else if (diff <= 30) {
                    addNotification('warning', 'Atenção Preventiva', 
                        `Renovar certificado de <strong>${i.municipality}</strong> (30 dias).`, 'apis-section');
                }
            }
        });
    }

    // 2. TREINAMENTOS: Pendentes há muito tempo (Regra: > 7 dias sem data realizada)
    if (typeof tasks !== 'undefined') {
        tasks.forEach(t => {
            if (t.status === 'Pendente' && t.dateRequested) {
                const reqDate = new Date(t.dateRequested);
                const diffTime = Math.abs(today - reqDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays > 15) {
                    addNotification('warning', 'Treinamento Atrasado', 
                        `Solicitação de <strong>${t.municipality}</strong> pendente há ${diffDays} dias.`, 'tarefas-section');
                }
            }
        });
    }

    // 3. BACKUP: Lembrar se não fez backup hoje (Opcional)
    // Pode ser implementado verificando auditLogs

    updateNotificationUI();
}

function addNotification(type, title, desc, targetTab) {
    let icon = 'ℹ️';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '🚨';

    notifications.push({ type, title, desc, targetTab, icon });
}

function updateNotificationUI() {
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notification-list');
    
    if (!badge || !list) return;

    // Atualiza o contador (Badge)
    if (notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = 'inline-block';
        // Animação visual
        badge.classList.add('pulse');
    } else {
        badge.style.display = 'none';
    }

    // Renderiza a lista
    if (notifications.length === 0) {
        list.innerHTML = '<p style="padding:15px; text-align:center; color:#999; font-size:13px;">Tudo certo! Nenhuma pendência encontrada.</p>';
    } else {
        list.innerHTML = notifications.map(n => `
            <div class="notification-item notif-${n.type}" onclick="openTab('${n.targetTab}'); toggleNotifications();">
                <div class="notif-icon">${n.icon}</div>
                <div class="notif-content">
                    <span class="notif-title">${n.title}</span>
                    <span class="notif-desc">${n.desc}</span>
                </div>
            </div>
        `).join('');
    }
}

function toggleNotifications() {
    const menu = document.getElementById('notification-menu');
    if (menu) {
        // Fecha o menu de configurações se estiver aberto para não sobrepor
        const settingsMenu = document.getElementById('settings-menu');
        if(settingsMenu) settingsMenu.classList.remove('show');
        
        menu.classList.toggle('show');
    }
}
// ============================================================================
// ATUALIZAÇÃO FINAL: MIGRAR TODAS AS EXPORTAÇÕES PARA EXCEL (.xlsx)
// ============================================================================

// 1. TREINAMENTOS (Aba Tarefas)
function exportTasksCSV() { // Mantive o nome para não quebrar o botão do HTML
    const data = getFilteredTasks();
    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Orientador', 'Profissional', 'Cargo', 'Contato', 'Status', 'Obs'];
    
    const rows = data.map(t => [
        t.municipality, 
        formatDate(t.dateRequested), 
        formatDate(t.datePerformed), 
        t.requestedBy, 
        t.performedBy, 
        t.trainedName, 
        t.trainedPosition, 
        t.contact, 
        t.status,
        t.observations
    ]);
    downloadXLSX("Relatorio_Treinamentos", headers, rows, "Treinamentos");
}

// 2. SOLICITAÇÕES (Aba Sugestões)
function exportRequestsCSV() {
    const data = getFilteredRequests();
    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Contato', 'Descrição', 'Status', 'Usuário', 'Justificativa'];
    
    const rows = data.map(r => [
        r.municipality, 
        formatDate(r.date), 
        formatDate(r.dateRealization), 
        r.requester, 
        r.contact, 
        r.description, 
        r.status, 
        r.user,
        r.justification
    ]);
    downloadXLSX("Relatorio_Solicitacoes_Clientes", headers, rows, "Solicitações");
}

// 3. DEMANDAS (Aba Suporte)
function exportDemandsCSV() {
    const data = getFilteredDemands();
    const headers = ['Data', 'Prioridade', 'Status', 'Descrição', 'Usuário', 'Realização', 'Justificativa'];
    
    const rows = data.map(d => [
        formatDate(d.date), 
        d.priority, 
        d.status, 
        d.description, 
        d.user, 
        formatDate(d.dateRealization),
        d.justification
    ]);
    downloadXLSX("Relatorio_Demandas_Suporte", headers, rows, "Demandas");
}

// 4. VISITAS (Aba Visitas)
function exportVisitsCSV() {
    const data = getFilteredVisits();
    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Status', 'Motivo', 'Justificativa'];
    
    const rows = data.map(v => [
        v.municipality, 
        formatDate(v.date), 
        formatDate(v.dateRealization),
        v.applicant, 
        v.status, 
        v.reason,
        v.justification
    ]);
    downloadXLSX("Relatorio_Visitas_Presenciais", headers, rows, "Visitas");
}

// 5. PRODUÇÃO (Aba Envio)
function exportProductionsCSV() {
    const data = getFilteredProductions();
    const headers = ['Município', 'Profissional', 'Contato', 'Frequência', 'Competência', 'Período', 'Liberação', 'Envio', 'Status', 'Obs'];
    
    const rows = data.map(p => [
        p.municipality, 
        p.professional,
        p.contact,
        p.frequency,
        p.competence, 
        p.period, 
        formatDate(p.releaseDate),
        formatDate(p.sendDate),
        p.status,
        p.observations
    ]);
    downloadXLSX("Relatorio_Envio_Producao", headers, rows, "Produção");
}

// 6. APRESENTAÇÕES (Aba Apresentações)
function exportPresentationsCSV() {
    const data = getFilteredPresentations();
    const headers = ['Município', 'Data Solicit.', 'Data Realiz.', 'Solicitante', 'Status', 'Orientadores', 'Formas', 'Descrição'];
    
    const rows = data.map(p => [
        p.municipality, 
        formatDate(p.dateSolicitacao), 
        formatDate(p.dateRealizacao),
        p.requester, 
        p.status, 
        (p.orientadores || []).join(', '), 
        (p.forms || []).join(', '), 
        p.description
    ]);
    downloadXLSX("Relatorio_Apresentacoes", headers, rows, "Apresentações");
}

// 7. AUDITORIA (Configurações)
function exportAuditCSV() {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Módulo Alvo', 'Detalhes da Ação'];
    // Formata a data ISO para ficar bonita no Excel
    const rows = auditLogs.map(l => {
        const d = new Date(l.timestamp);
        const dataFormatada = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
        return [dataFormatada, l.user, l.action, l.target, l.details];
    });
    downloadXLSX("Relatorio_Auditoria_Sistema", headers, rows, "Logs");
}
// ============================================================================
// SISTEMA DE DESFAZER (UNDO) - FASE 3
// ============================================================================

let undoState = null; // Armazena o item deletado temporariamente
let undoTimeout = null;

// 1. Função que prepara o Undo (Chamada ANTES de excluir)
function registerUndo(item, listName, renderFunction) {
    // Limpa qualquer undo pendente anterior
    if (undoTimeout) clearTimeout(undoTimeout);

    undoState = {
        item: JSON.parse(JSON.stringify(item)), // Cópia segura do objeto
        listName: listName, // Nome da variável no localStorage (ex: 'municipalities')
        renderFunction: renderFunction // Função para atualizar a tela (ex: renderMunicipalities)
    };

    // Mostra o Toast com botão de ação
    showUndoToast(`Item excluído.`, confirmUndo);
}

// 2. Exibe Toast com Botão Desfazer
function showUndoToast(message, undoCallback) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Monta o HTML interno com o botão
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="btn-undo" onclick="confirmUndo()">DESFAZER</button>
        </div>
    `;
    
    // Estilos e Animação
    toast.className = 'toast show'; // Usa cor padrão (preto/escuro)
    
    // Define tempo para o botão sumir (5 segundos)
    undoTimeout = setTimeout(() => {
        toast.classList.remove('show');
        undoState = null; // Limpa a memória (já era, não dá mais pra desfazer)
    }, 6000);
}

// 3. Ação de Restaurar (Quando clica no botão)
function confirmUndo() {
    if (!undoState) return;

    const { item, listName, renderFunction } = undoState;

    // REINSERE O ITEM NA LISTA CORRETA (Memória RAM)
    switch(listName) {
        case 'municipalities': municipalities.push(item); break;
        case 'tasks': tasks.push(item); break;
        case 'requests': requests.push(item); break;
        case 'demands': demands.push(item); break;
        case 'visits': visits.push(item); break;
        case 'productions': productions.push(item); break;
        case 'presentations': presentations.push(item); break;
        
        // Configurações e Outros
        case 'users': users.push(item); break;
        case 'cargos': cargos.push(item); break;
        case 'orientadores': orientadores.push(item); break;
        case 'modulos': modulos.push(item); break;
        case 'municipalitiesList': municipalitiesList.push(item); break;
        case 'formasApresentacao': formasApresentacao.push(item); break;
        case 'apisList': apisList.push(item); break;
        
        // Novas Abas
        case 'integrations': integrations.push(item); break;
        case 'collaboratorInfos': collaboratorInfos.push(item); break;
    }

    // SALVA NO LOCALSTORAGE (Persistência)
    if (listName === 'municipalities') salvarNoArmazenamento('municipalities', municipalities);
    else if (listName === 'tasks') salvarNoArmazenamento('tasks', tasks);
    else if (listName === 'requests') salvarNoArmazenamento('requests', requests);
    else if (listName === 'demands') salvarNoArmazenamento('demands', demands);
    else if (listName === 'visits') salvarNoArmazenamento('visits', visits);
    else if (listName === 'productions') salvarNoArmazenamento('productions', productions);
    else if (listName === 'presentations') salvarNoArmazenamento('presentations', presentations);
    
    else if (listName === 'users') salvarNoArmazenamento('users', users);
    else if (listName === 'cargos') salvarNoArmazenamento('cargos', cargos);
    else if (listName === 'orientadores') salvarNoArmazenamento('orientadores', orientadores);
    else if (listName === 'modulos') salvarNoArmazenamento('modulos', modulos);
    else if (listName === 'municipalitiesList') salvarNoArmazenamento('municipalitiesList', municipalitiesList);
    else if (listName === 'formasApresentacao') salvarNoArmazenamento('formasApresentacao', formasApresentacao);
    else if (listName === 'apisList') salvarNoArmazenamento('apisList', apisList);
    
    else if (listName === 'integrations') salvarNoArmazenamento('integrations', integrations);
    else if (listName === 'collaboratorInfos') salvarNoArmazenamento('collaboratorInfos', collaboratorInfos);

    // Atualiza a Tela
    if (typeof renderFunction === 'function') renderFunction();
    updateGlobalDropdowns();

    // Feedback visual
    const toast = document.getElementById('toast');
    toast.innerHTML = '✅ Ação desfeita com sucesso!';
    setTimeout(() => toast.classList.remove('show'), 3000);
    
    // Limpa estado
    undoState = null;
    clearTimeout(undoTimeout);
}

// ============================================================================
// FUNCIONALIDADE: ESQUECI MINHA SENHA (MODAL)
// ============================================================================

function showForgotPasswordModal(e) {
    // Previne que o link recarregue a página ou adicione # na URL
    if (e) e.preventDefault(); 
    
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error("Erro: O modal 'forgot-password-modal' não foi encontrado no HTML.");
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================================================
// DETECTOR DE CONEXÃO (ONLINE/OFFLINE)
// ============================================================================
function initOfflineDetection() {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;

    function updateStatus() {
        if (navigator.onLine) {
            banner.classList.remove('show');
        } else {
            banner.classList.add('show');
        }
    }

    // Ouve as mudanças de rede do navegador
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Checa assim que carrega
    updateStatus();
}

// ============================================================================
// LÓGICA DE FILTROS DINÂMICOS DE RELATÓRIO
// ============================================================================

// 1. Função que troca os campos na tela (Chamada no onchange do HTML)
function updateReportFiltersUI() {
    const type = document.getElementById('filter-report-type').value;
    
    // 1. Esconde TODOS os grupos primeiro
    document.querySelectorAll('.report-filter-group').forEach(el => el.style.display = 'none');

    // 2. Mostra apenas o grupo específico selecionado
    if (type === 'municipios') {
        document.getElementById('filters-municipios').style.display = 'grid'; 
    } 
    else if (type === 'treinamentos') {
        document.getElementById('filters-treinamentos').style.display = 'grid'; 
    }
    else if (type === 'apresentacoes') {
        document.getElementById('filters-apresentacoes').style.display = 'grid'; 
    }
    else if (type === 'visitas') {
        document.getElementById('filters-visitas').style.display = 'grid'; 
    }
    else if (type === 'producao') {
        document.getElementById('filters-producao').style.display = 'grid'; 
    }
    else if (type === 'integracoes') {
        document.getElementById('filters-integracoes').style.display = 'grid'; 
    }
    else if (type === 'colaboradores') {
        document.getElementById('filters-colaboradores').style.display = 'grid'; 
    }
}
// ============================================================================
// NOVAS AÇÕES DE RELATÓRIO: LIMPAR E EXCEL
// ============================================================================

// 1. Limpar Filtros (Reseta todos os inputs da tela de relatórios)
function clearReportFilters() {
    // Mantém o tipo de relatório selecionado, limpa apenas os filtros
    const type = document.getElementById('filter-report-type').value;
    
    // Seleciona todos os inputs e selects DENTRO da caixa de filtros
    const inputs = document.querySelectorAll('.report-filter-group input, .report-filter-group select');
    
    inputs.forEach(input => {
        input.value = ''; // Reseta o valor
    });

    showToast('Filtros de relatório limpos.');
}

// 2. Exportar Excel (Direto, sem abrir visualização)
function exportReportToExcel() {
    const type = document.getElementById('filter-report-type').value;
    
    if (!type) {
        alert('Por favor, selecione um tipo de relatório para exportar.');
        return;
    }

    // A lógica é similar à visualização: verifica qual tipo e chama a função de exportação correspondente
    // Nota: Como já criamos funções específicas de exportação nas outras abas (ex: exportMunicipalitiesCSV),
    // podemos reutilizá-las ou criar novas específicas para este painel se os filtros forem diferentes.
    
    // Para simplificar e usar os filtros novos que criamos aqui, o ideal é criar um switch
    // que chama a função de exportação passando os dados filtrados.
    
    switch (type) {
        case 'municipios':
            exportReportMunicipiosExcel();
            break;
        case 'treinamentos':
            exportTasksCSV(); // Reutiliza a função existente da aba Tarefas
            exportReportTreinamentosExcel();
            break;
        case 'demandas':
            exportDemandsCSV();
            break;
        case 'visitas':
            exportVisitsCSV();
            break;
        case 'producao':
            exportProductionsCSV();
            break;
        case 'apresentacoes':
            exportPresentationsCSV();
            break;
        case 'integracoes':
            exportIntegrationsExcel();
            break;
        case 'colaboradores':
            exportColabInfoExcel();
            break;
        case 'apresentacoes':
            exportReportApresentacoesExcel();
            break;
        case 'usuarios':
            // Criação rápida se não existir
            const headers = ['Login', 'Nome', 'Permissão', 'Status'];
            const rows = users.map(u => [u.login, u.name, u.permission, u.status]);
            downloadXLSX("Relatorio_Usuarios", headers, rows);
            break;
        case 'producao':
            exportReportProducaoExcel();
            break;
        case 'integracoes':
            exportReportIntegracoesExcel();
            break;
        case 'colaboradores':
            exportReportColaboradoresExcel();
            break;
        default:
            alert('Exportação Excel não configurada para este tipo ainda.');
    }
}

// Função específica para Exportar MUNICÍPIOS usando os FILTROS NOVOS da tela de relatórios
function exportReportMunicipiosExcel() {
    // 1. Captura os filtros DA TELA DE RELATÓRIOS (não da aba principal)
    const dateType = document.getElementById('rep-mun-date-type').value;
    const dateStart = document.getElementById('rep-mun-start').value;
    const dateEnd = document.getElementById('rep-mun-end').value;
    const statusFilter = document.getElementById('rep-mun-status').value;

    // 2. Filtra os dados
    let data = municipalities.filter(m => {
        if (statusFilter && m.status !== statusFilter) return false;
        
        let dateToCheck = (dateType === 'visita') ? m.lastVisit : m.implantationDate;
        
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;

        return true;
    });

    data.sort((a,b) => a.name.localeCompare(b.name));

    if (data.length === 0) {
        alert('Nenhum dado encontrado para exportar com esses filtros.');
        return;
    }

    // 3. Gera o Excel
    const headers = ['Município', 'UF', 'Status', 'Gestor', 'Contato', 'Implantação', 'Última Visita'];
    const rows = data.map(m => [
        m.name,
        m.uf || '',
        m.status,
        m.manager,
        m.contact,
        formatDate(m.implantationDate),
        formatDate(m.lastVisit)
    ]);

    downloadXLSX("Relatorio_Carteira_Clientes_Filtrado", headers, rows);
}
// ============================================================================
// 2. FUNÇÃO PRINCIPAL: Gera o Preview (LARGURA TOTAL DA FOLHA CORRIGIDA)
// ============================================================================
function generateReportPreview() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('Biblioteca jsPDF faltando.'); return; }
    
    const typeEl = document.getElementById('filter-report-type');
    if (!typeEl || !typeEl.value) { alert('Selecione um tipo de relatório.'); return; }

    const btnGerar = event.target;
    const textoOriginal = btnGerar ? btnGerar.innerHTML : 'Gerar';
    if(btnGerar) { btnGerar.innerHTML = '⏳ Gerando...'; btnGerar.disabled = true; }

    try {
        const type = typeEl.value;
        let reportHTML = '';
        let reportTitle = '';

        switch (type) {
            case 'municipios': reportHTML = genRepMunicipios(); reportTitle = 'Carteira de Clientes'; break;
            case 'treinamentos': reportHTML = genRepTreinamentos(); reportTitle = 'Controle de Treinamentos'; break;
            case 'demandas': reportHTML = genRepDemandas(); reportTitle = 'Demandas de Suporte'; break;
            case 'apresentacoes': reportHTML = genRepApresentacoes(); reportTitle = 'Apresentações do Software'; break;
            case 'visitas': reportHTML = genRepVisitas(); reportTitle = 'Visitas Presenciais'; break;
            case 'producao': reportHTML = genRepProducao(); reportTitle = 'Controle de Produção'; break;
            case 'integracoes': reportHTML = genRepIntegracoes(); reportTitle = 'Status de Integrações'; break;
            case 'colaboradores': reportHTML = genRepColaboradores(); reportTitle = 'Quadro de Colaboradores'; break;
            case 'usuarios': reportHTML = genRepUsuarios(); reportTitle = 'Gestão de Usuários'; break;
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reportHTML;
        const tableEl = tempDiv.querySelector('table');
        const totalRows = tempDiv.querySelectorAll('tbody tr').length;

        if (!tableEl) throw new Error("Nenhum dado encontrado.");

        const filters = getFilterData(type); 
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        // --- MARGENS (10mm cada lado) ---
        const marginLeft = 10;  
        const marginRight = 10; 

        // --- ESPAÇAMENTO VERTICAL ---
        const baseFiltersY = 24;
        let startY = 30; 
        if (filters.length > 0) {
            const lines = Math.ceil(filters.length / 3); 
            startY = baseFiltersY + (lines * 6) + 3;
        }

        // --- LARGURAS RECALCULADAS PARA PREENCHER 100% (Total ~277mm) ---
        let customColumnStyles = {};
        
        if (type === 'municipios') {
            customColumnStyles = {
                // Aumentei Município e Gestor para empurrar a tabela até a borda direita
                0: { cellWidth: 65 }, // Município 
                1: { cellWidth: 22 }, // Status
                2: { cellWidth: 55 }, // Gestor (Aumentado)
                3: { cellWidth: 35 }, // Contato
                4: { cellWidth: 28, halign: 'center' }, // Implantação (Compacto)
                5: { cellWidth: 45 }, // Tempo de Uso
                6: { cellWidth: 27, halign: 'center' }  // Última Visita (Compacto)
                // Soma Total: 277mm (Preenche exatamente o espaço entre as margens)
            };
        }

        doc.autoTable({
            html: tableEl,
            startY: startY, 
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            
            headStyles: { 
                fillColor: [0, 61, 92], 
                textColor: 255, 
                fontStyle: 'bold', 
                halign: 'left' 
            },
            bodyStyles: { halign: 'left' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: customColumnStyles,
            
            didDrawPage: function (data) {
                const pageWidth = doc.internal.pageSize.width;
                const pageHeight = doc.internal.pageSize.height;
                const contentWidth = pageWidth - marginLeft - marginRight;

                doc.setFontSize(16); doc.setTextColor(0, 61, 92);
                doc.text(`SIGP Saúde - ${reportTitle}`, marginLeft, 15);

                doc.setDrawColor(0, 61, 92); doc.setLineWidth(0.5);
                doc.line(marginLeft, 18, pageWidth - marginRight, 18);

                let x = marginLeft; 
                let y = baseFiltersY; 
                const itemWidth = contentWidth / 3;

                doc.setFontSize(9); doc.setTextColor(50, 50, 50);

                if (filters.length === 0) {
                    doc.setFont(undefined, 'normal');
                    doc.text("Filtros: Nenhum filtro aplicado (Todos os registros)", marginLeft, y);
                } else {
                    filters.forEach((f, index) => {
                        doc.setFont(undefined, 'bold');
                        doc.text(`${f.label}:`, x, y);
                        const labelWidth = doc.getTextWidth(`${f.label}: `);
                        doc.setFont(undefined, 'normal');
                        doc.text(f.value, x + labelWidth, y);

                        if ((index + 1) % 3 === 0) { x = marginLeft; y += 6; } 
                        else { x += itemWidth; }
                    });
                }

                const now = new Date();
                const dataHora = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
                const usuario = currentUser ? currentUser.name.toUpperCase() : 'SISTEMA';
                
                doc.setFontSize(8); doc.setTextColor(100);
                doc.text(`Impresso em ${dataHora} por ${usuario}`, marginLeft, pageHeight - 10);
                doc.text('Página ' + doc.internal.getNumberOfPages(), pageWidth - marginRight, pageHeight - 10, { align: 'right' });
            },
            margin: { top: startY, bottom: 15, left: marginLeft, right: marginRight }
        });

        const finalY = doc.lastAutoTable.finalY || 40;
        const pageWidth = doc.internal.pageSize.width;
        doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
        // O Totalizador ficará alinhado com a borda da tabela
        doc.text(`Total de registros encontrados: ${totalRows}`, pageWidth - marginRight, finalY + 10, { align: 'right' });

        const blob = doc.output('bloburl');
        const bodyEl = document.getElementById('report-preview-body');
        bodyEl.innerHTML = `<iframe id="pdf-preview-frame" src="${blob}#zoom=100" width="100%" height="100%"></iframe>`;

        const modalEl = document.getElementById('report-preview-modal');
        modalEl.classList.add('show');

    } catch (err) {
        console.error(err); alert('Erro: ' + err.message);
    } finally {
        if(btnGerar) { btnGerar.innerHTML = textoOriginal; btnGerar.disabled = false; }
    }
}
function closeReportPreview() {
    const modal = document.getElementById('report-preview-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

// 3. Imprimir (Usa o próprio navegador)
function printReport() {
    const bodyEl = document.getElementById('report-preview-body');
    if (!bodyEl) {
        alert('Nada para imprimir: o preview não foi gerado.');
        return;
    }

    const content = bodyEl.innerHTML;
    const printWindow = window.open('', '', 'width=900,height=600');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Impressão SIGP Saúde</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { background-color: #003d5c !important; color: white !important; padding: 6px; text-align: left; -webkit-print-color-adjust: exact; }
                    td { border: 1px solid #ccc; padding: 6px; }
                    tr:nth-child(even) { background-color: #f2f2f2; -webkit-print-color-adjust: exact; }
                    h2 { color: #003d5c; }
                </style>
            </head>
            <body>
                ${content}
                <script>
                    window.onload = function() { window.print(); window.close(); }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}
// ============================================================================
// GERADOR HTML: CARTEIRA DE CLIENTES (COM CONTATO E COLUNAS AJUSTADAS)
// ============================================================================
function genRepMunicipios() {
    // Captura os valores dos filtros
    const dateType = document.getElementById('rep-mun-date-type').value;
    const dateStart = document.getElementById('rep-mun-start').value;
    const dateEnd = document.getElementById('rep-mun-end').value;
    const statusFilter = document.getElementById('rep-mun-status').value;

    // Filtra os dados
    let data = municipalities.filter(m => {
        if (statusFilter && m.status !== statusFilter) return false;
        let dateToCheck = (dateType === 'visita') ? m.lastVisit : m.implantationDate;
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;
        return true;
    });

    data.sort((a,b) => a.name.localeCompare(b.name));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhum cliente encontrado.</p>';

    // Gera as linhas
    const rows = data.map(m => {
        const dtImp = m.implantationDate ? formatDate(m.implantationDate) : '-';
        const dtVis = m.lastVisit ? formatDate(m.lastVisit) : '-';
        const tempoUso = calculateTimeInUse(m.implantationDate); 
        const nomeExibicao = m.uf ? `${m.name} - ${m.uf}` : m.name;

        return `<tr>
            <td>${nomeExibicao}</td>
            <td>${m.status}</td>
            <td>${m.manager || '-'}</td>
            <td>${m.contact || '-'}</td> <td style="text-align:center;">${dtImp}</td>
            <td>${tempoUso}</td>
            <td style="text-align:center;">${dtVis}</td>
        </tr>`;
    }).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros aplicados:</strong> 
        Status: ${statusFilter || 'Todos'} | 
        Data Ref.: ${dateType === 'visita' ? 'Última Visita' : 'Implantação'} 
        (${dateStart ? formatDate(dateStart) : 'Início'} até ${dateEnd ? formatDate(dateEnd) : 'Hoje'})
    </div>
    <table class="report-table">
        <thead>
            <th>Município</th>
            <th>Status</th>
            <th>Gestor</th>
            <th>Contato</th> <th style="text-align:center;">Data Implantação</th>
            <th>Tempo de Uso</th>
            <th style="text-align:center;">Última Visita</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}

function genRepTreinamentos() {
    // 1. Captura valores dos filtros específicos
    const dateType = document.getElementById('rep-train-date-type').value; // 'solicitacao' ou 'realizacao'
    const dateStart = document.getElementById('rep-train-start').value;
    const dateEnd = document.getElementById('rep-train-end').value;
    const statusFilter = document.getElementById('rep-train-status').value;
    const munFilter = document.getElementById('rep-train-mun').value;
    const colabFilter = document.getElementById('rep-train-colab').value;
    const cargoFilter = document.getElementById('rep-train-cargo').value;
    const profFilter = document.getElementById('rep-train-prof').value.toLowerCase();

    // 2. Filtragem
    let data = tasks.filter(t => {
        // Filtros de seleção exata
        if (statusFilter && t.status !== statusFilter) return false;
        if (munFilter && t.municipality !== munFilter) return false;
        if (colabFilter && t.performedBy !== colabFilter) return false;
        if (cargoFilter && t.trainedPosition !== cargoFilter) return false;

        // Filtro de texto (Nome do Profissional)
        if (profFilter && (!t.trainedName || !t.trainedName.toLowerCase().includes(profFilter))) return false;

        // Filtro de Data (Dinâmico: Solicitação ou Realização)
        let dateToCheck = (dateType === 'realizacao') ? t.datePerformed : t.dateRequested;
        
        // Se filtro de data estiver ativo, ignora registros sem data
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;

        return true;
    });

    // Ordenação por data de solicitação
    data.sort((a,b) => new Date(a.dateRequested) - new Date(b.dateRequested));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhum treinamento encontrado com esses filtros.</p>';

    // 3. Gerar HTML da tabela
    const rows = data.map(t => `
        <tr>
            <td>${t.municipality}</td>
            <td style="text-align:center;">${formatDate(t.dateRequested)}</td>
            <td style="text-align:center;">${formatDate(t.datePerformed)}</td>
            <td>${t.performedBy}</td>
            <td>${t.trainedName || '-'}</td>
            <td>${t.trainedPosition || '-'}</td>
            <td>${t.status}</td>
        </tr>
    `).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros Aplicados:</strong> 
        Ref: ${dateType === 'realizacao' ? 'Realização' : 'Solicitação'} |
        Status: ${statusFilter || 'Todos'} | 
        Município: ${munFilter || 'Todos'} |
        Colaborador: ${colabFilter || 'Todos'}
    </div>
    <table class="report-table">
        <thead>
            <th>Município</th>
            <th style="text-align:center;">Data Solicit.</th>
            <th style="text-align:center;">Data Realiz.</th>
            <th>Colaborador</th>
            <th>Profissional</th>
            <th>Cargo</th>
            <th>Status</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}

function genRepDemandas(d1, d2) {
    let data = demands;
    if(d1) data = data.filter(d => d.date >= d1);
    if(d2) data = data.filter(d => d.date <= d2);
    const rows = data.map(d => `<tr><td>${formatDate(d.date)}</td><td>${d.priority}</td><td>${d.status}</td><td>${d.description}</td></tr>`).join('');
    return `<table class="report-table"><thead><th>Data</th><th>Prioridade</th><th>Status</th><th>Descrição</th></thead><tbody>${rows}</tbody></table>`;
}

function genRepUsuarios() {
    const rows = users.map(u => `<tr><td>${u.login}</td><td>${u.name}</td><td>${u.permission}</td><td>${u.status}</td></tr>`).join('');
    return `<table class="report-table"><thead><th>Login</th><th>Nome</th><th>Nível</th><th>Status</th></thead><tbody>${rows}</tbody></table>`;
}
// ============================================================================
// CORREÇÃO DE EMERGÊNCIA: MOVER MODAIS PARA A RAIZ
// ============================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Lista de modais que precisam funcionar fora da estrutura principal
    const modaisCriticos = ['report-preview-modal', 'forgot-password-modal'];
    
    modaisCriticos.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            document.body.appendChild(modal);
            console.log(`🔧 FIX: Modal '${id}' movido para a raiz do documento.`);
        }
    });
});

function exportReportTreinamentosExcel() {
    // 1. Recaptura os mesmos filtros
    const dateType = document.getElementById('rep-train-date-type').value;
    const dateStart = document.getElementById('rep-train-start').value;
    const dateEnd = document.getElementById('rep-train-end').value;
    const statusFilter = document.getElementById('rep-train-status').value;
    const munFilter = document.getElementById('rep-train-mun').value;
    const colabFilter = document.getElementById('rep-train-colab').value;
    const cargoFilter = document.getElementById('rep-train-cargo').value;
    const profFilter = document.getElementById('rep-train-prof').value.toLowerCase();

    // 2. Filtra os dados (Mesma lógica da visualização)
    let data = tasks.filter(t => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (munFilter && t.municipality !== munFilter) return false;
        if (colabFilter && t.performedBy !== colabFilter) return false;
        if (cargoFilter && t.trainedPosition !== cargoFilter) return false;
        if (profFilter && (!t.trainedName || !t.trainedName.toLowerCase().includes(profFilter))) return false;
        
        let dateToCheck = (dateType === 'realizacao') ? t.datePerformed : t.dateRequested;
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;
        return true;
    });

    if (data.length === 0) { alert('Nada para exportar.'); return; }

    // 3. Gera o Excel
    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Colaborador', 'Profissional Treinado', 'Cargo', 'Status', 'Obs'];
    const rows = data.map(t => [
        t.municipality,
        formatDate(t.dateRequested),
        formatDate(t.datePerformed),
        t.performedBy,
        t.trainedName,
        t.trainedPosition,
        t.status,
        t.observations
    ]);

    downloadXLSX("Relatorio_Treinamentos_Filtrado", headers, rows);
}

function genRepApresentacoes() {
    // 1. Captura Filtros
    const dateType = document.getElementById('rep-pres-date-type').value;
    const dateStart = document.getElementById('rep-pres-start').value;
    const dateEnd = document.getElementById('rep-pres-end').value;
    const statusFilter = document.getElementById('rep-pres-status').value;
    const munFilter = document.getElementById('rep-pres-mun').value;
    const colabFilter = document.getElementById('rep-pres-colab').value;
    const formFilter = document.getElementById('rep-pres-form').value;

    // 2. Filtragem
    let data = presentations.filter(p => {
        // Status e Município (Igualdade exata)
        if (statusFilter && p.status !== statusFilter) return false;
        if (munFilter && p.municipality !== munFilter) return false;

        // Colaborador (É uma lista, verificamos se INCLUI o selecionado)
        if (colabFilter && (!p.orientadores || !p.orientadores.includes(colabFilter))) return false;

        // Forma (É uma lista, verificamos se INCLUI a selecionada)
        if (formFilter && (!p.forms || !p.forms.includes(formFilter))) return false;

        // Data
        let dateToCheck = (dateType === 'realizacao') ? p.dateRealizacao : p.dateSolicitacao;
        
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;

        return true;
    });

    data.sort((a,b) => new Date(a.dateSolicitacao) - new Date(b.dateSolicitacao));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhuma apresentação encontrada.</p>';

    const rows = data.map(p => `
        <tr>
            <td>${p.municipality}</td>
            <td style="text-align:center;">${formatDate(p.dateSolicitacao)}</td>
            <td style="text-align:center;">${formatDate(p.dateRealizacao)}</td>
            <td>${(p.orientadores || []).join(', ')}</td>
            <td>${(p.forms || []).join(', ')}</td>
            <td>${p.status}</td>
        </tr>
    `).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros:</strong> 
        Ref: ${dateType === 'realizacao' ? 'Realização' : 'Solicitação'} (${dateStart ? formatDate(dateStart) : 'Início'} à ${dateEnd ? formatDate(dateEnd) : 'Fim'}) |
        Status: ${statusFilter || 'Todos'} | Colab: ${colabFilter || 'Todos'}
    </div>
    <table class="report-table">
        <thead>
            <th>Município</th>
            <th style="text-align:center;">Solicitação</th>
            <th style="text-align:center;">Realização</th>
            <th>Colaboradores</th>
            <th>Formas</th>
            <th>Status</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}

function exportReportApresentacoesExcel() {
    // 1. Filtros
    const dateType = document.getElementById('rep-pres-date-type').value;
    const dateStart = document.getElementById('rep-pres-start').value;
    const dateEnd = document.getElementById('rep-pres-end').value;
    const statusFilter = document.getElementById('rep-pres-status').value;
    const munFilter = document.getElementById('rep-pres-mun').value;
    const colabFilter = document.getElementById('rep-pres-colab').value;
    const formFilter = document.getElementById('rep-pres-form').value;

    // 2. Filtra
    let data = presentations.filter(p => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (munFilter && p.municipality !== munFilter) return false;
        if (colabFilter && (!p.orientadores || !p.orientadores.includes(colabFilter))) return false;
        if (formFilter && (!p.forms || !p.forms.includes(formFilter))) return false;
        
        let dateToCheck = (dateType === 'realizacao') ? p.dateRealizacao : p.dateSolicitacao;
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;
        return true;
    });

    if (data.length === 0) { alert('Nada para exportar.'); return; }

    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Status', 'Colaboradores', 'Formas', 'Descrição'];
    const rows = data.map(p => [
        p.municipality,
        formatDate(p.dateSolicitacao),
        formatDate(p.dateRealizacao),
        p.requester,
        p.status,
        (p.orientadores || []).join(', '),
        (p.forms || []).join(', '),
        p.description
    ]);

    downloadXLSX("Relatorio_Apresentacoes_Filtrado", headers, rows);
}
function genRepVisitas() {
    // 1. Filtros
    const dateType = document.getElementById('rep-vis-date-type').value;
    const dateStart = document.getElementById('rep-vis-start').value;
    const dateEnd = document.getElementById('rep-vis-end').value;
    const statusFilter = document.getElementById('rep-vis-status').value;
    const munFilter = document.getElementById('rep-vis-mun').value;
    const appFilter = document.getElementById('rep-vis-applicant').value.toLowerCase();

    // 2. Filtragem
    let data = visits.filter(v => {
        if (statusFilter && v.status !== statusFilter) return false;
        if (munFilter && v.municipality !== munFilter) return false;
        if (appFilter && (!v.applicant || !v.applicant.toLowerCase().includes(appFilter))) return false;

        let dateToCheck = (dateType === 'realizacao') ? v.dateRealization : v.date;
        
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;

        return true;
    });

    data.sort((a,b) => new Date(a.date) - new Date(b.date));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhuma visita encontrada.</p>';

    const rows = data.map(v => `
        <tr>
            <td>${v.municipality}</td>
            <td style="text-align:center;">${formatDate(v.date)}</td>
            <td style="text-align:center;">${formatDate(v.dateRealization)}</td>
            <td>${v.applicant}</td>
            <td>${v.status}</td>
            <td>${v.reason || '-'}</td>
        </tr>
    `).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros:</strong> 
        Ref: ${dateType === 'realizacao' ? 'Realização' : 'Solicitação'} (${dateStart ? formatDate(dateStart) : 'Início'} à ${dateEnd ? formatDate(dateEnd) : 'Fim'}) |
        Status: ${statusFilter || 'Todos'} | Solicitante: ${appFilter ? document.getElementById('rep-vis-applicant').value : 'Todos'}
    </div>
    <table class="report-table">
        <thead>
            <th>Município</th>
            <th style="text-align:center;">Solicitação</th>
            <th style="text-align:center;">Realização</th>
            <th>Solicitante</th>
            <th>Status</th>
            <th>Motivo</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}
function exportReportVisitasExcel() {
    const dateType = document.getElementById('rep-vis-date-type').value;
    const dateStart = document.getElementById('rep-vis-start').value;
    const dateEnd = document.getElementById('rep-vis-end').value;
    const statusFilter = document.getElementById('rep-vis-status').value;
    const munFilter = document.getElementById('rep-vis-mun').value;
    const appFilter = document.getElementById('rep-vis-applicant').value.toLowerCase();

    let data = visits.filter(v => {
        if (statusFilter && v.status !== statusFilter) return false;
        if (munFilter && v.municipality !== munFilter) return false;
        if (appFilter && (!v.applicant || !v.applicant.toLowerCase().includes(appFilter))) return false;
        
        let dateToCheck = (dateType === 'realizacao') ? v.dateRealization : v.date;
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;
        return true;
    });

    if (data.length === 0) { alert('Nada para exportar.'); return; }

    const headers = ['Município', 'Data Solicitação', 'Data Realização', 'Solicitante', 'Status', 'Motivo', 'Justificativa'];
    const rows = data.map(v => [
        v.municipality,
        formatDate(v.date),
        formatDate(v.dateRealization),
        v.applicant,
        v.status,
        v.reason,
        v.justification
    ]);

    downloadXLSX("Relatorio_Visitas_Filtrado", headers, rows);
}
function genRepProducao() {
    // 1. Filtros
    const dateType = document.getElementById('rep-prod-date-type').value;
    const dateStart = document.getElementById('rep-prod-start').value;
    const dateEnd = document.getElementById('rep-prod-end').value;
    const statusFilter = document.getElementById('rep-prod-status').value;
    const freqFilter = document.getElementById('rep-prod-freq').value;
    const munFilter = document.getElementById('rep-prod-mun').value;
    const profFilter = document.getElementById('rep-prod-prof').value.toLowerCase();

    // 2. Filtragem
    let data = productions.filter(p => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (freqFilter && p.frequency !== freqFilter) return false;
        if (munFilter && p.municipality !== munFilter) return false;
        if (profFilter && (!p.professional || !p.professional.toLowerCase().includes(profFilter))) return false;

        let dateToCheck = (dateType === 'envio') ? p.sendDate : p.releaseDate;
        
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;

        return true;
    });

    // Ordenação (Data Liberação)
    data.sort((a,b) => new Date(a.releaseDate) - new Date(b.releaseDate));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhum envio encontrado.</p>';

    const rows = data.map(p => `
        <tr>
            <td>${p.municipality}</td>
            <td>${p.professional || '-'}</td>
            <td>${p.frequency}</td>
            <td>${p.competence}</td>
            <td>${p.period || '-'}</td>
            <td style="text-align:center;">${formatDate(p.releaseDate)}</td>
            <td style="text-align:center;">${formatDate(p.sendDate)}</td>
            <td>${p.status}</td>
        </tr>
    `).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros:</strong> 
        Ref: ${dateType === 'envio' ? 'Data Envio' : 'Data Liberação'} (${dateStart ? formatDate(dateStart) : 'Início'} à ${dateEnd ? formatDate(dateEnd) : 'Fim'}) |
        Status: ${statusFilter || 'Todos'} | Freq: ${freqFilter || 'Todas'}
    </div>
    <table class="report-table">
        <thead>
            <th>Município</th>
            <th>Profissional</th>
            <th>Frequência</th>
            <th>Competência</th>
            <th>Período</th>
            <th style="text-align:center;">Liberação</th>
            <th style="text-align:center;">Envio</th>
            <th>Status</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}
function exportReportProducaoExcel() {
    const dateType = document.getElementById('rep-prod-date-type').value;
    const dateStart = document.getElementById('rep-prod-start').value;
    const dateEnd = document.getElementById('rep-prod-end').value;
    const statusFilter = document.getElementById('rep-prod-status').value;
    const freqFilter = document.getElementById('rep-prod-freq').value;
    const munFilter = document.getElementById('rep-prod-mun').value;
    const profFilter = document.getElementById('rep-prod-prof').value.toLowerCase();

    let data = productions.filter(p => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (freqFilter && p.frequency !== freqFilter) return false;
        if (munFilter && p.municipality !== munFilter) return false;
        if (profFilter && (!p.professional || !p.professional.toLowerCase().includes(profFilter))) return false;
        
        let dateToCheck = (dateType === 'envio') ? p.sendDate : p.releaseDate;
        if ((dateStart || dateEnd) && !dateToCheck) return false;
        if (dateStart && dateToCheck < dateStart) return false;
        if (dateEnd && dateToCheck > dateEnd) return false;
        return true;
    });

    if (data.length === 0) { alert('Nada para exportar.'); return; }

    const headers = ['Município', 'Profissional', 'Contato', 'Frequência', 'Competência', 'Período', 'Data Liberação', 'Data Envio', 'Status', 'Obs'];
    const rows = data.map(p => [
        p.municipality,
        p.professional,
        p.contact,
        p.frequency,
        p.competence,
        p.period,
        formatDate(p.releaseDate),
        formatDate(p.sendDate),
        p.status,
        p.observations
    ]);

    downloadXLSX("Relatorio_Producao_Filtrado", headers, rows);
}

function genRepIntegracoes() {
    // ... (Filtros iguais) ...
    const dateStart = document.getElementById('rep-int-start').value;
    const dateEnd = document.getElementById('rep-int-end').value;
    const statusFilter = document.getElementById('rep-int-status').value;
    const munFilter = document.getElementById('rep-int-mun').value;
    const apiFilter = document.getElementById('rep-int-api').value;

    let data = integrations.filter(i => {
        if (munFilter && i.municipality !== munFilter) return false;
        if (apiFilter && (!i.apis || !i.apis.includes(apiFilter))) return false;
        if (dateStart && i.expirationDate < dateStart) return false;
        if (dateEnd && i.expirationDate > dateEnd) return false;
        if (statusFilter) {
            const diff = getDaysDiff(i.expirationDate);
            if (statusFilter === 'Vencido' && diff >= 0) return false;
            if (statusFilter === 'Alerta' && (diff < 0 || diff > 30)) return false;
            if (statusFilter === 'Em dia' && diff <= 30) return false;
        }
        return true;
    });

    data.sort((a,b) => a.municipality.localeCompare(b.municipality));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhuma integração encontrada.</p>';

    const rows = data.map(i => {
        const diff = getDaysDiff(i.expirationDate);
        let statusTexto = `<span style="color:green; font-weight:bold;">Em dia (${diff} dias)</span>`;
        
        if (diff < 0) statusTexto = `<span style="color:#C85250; font-weight:bold;">Vencido há ${Math.abs(diff)} dias</span>`;
        else if (diff <= 30) statusTexto = `<span style="color:#E68161; font-weight:bold;">Vence em ${diff} dias</span>`;

        return `
        <tr>
            <td>${i.municipality}</td>
            <td>${(i.apis || []).join(', ')}</td>
            <td>${i.responsible || '-'}</td> <td style="text-align:center;">${formatDate(i.expirationDate)}</td>
            <td style="text-align:center;">${statusTexto}</td>
            <td>${i.observation || '-'}</td>
        </tr>`;
    }).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros:</strong> 
        Vencimento: ${dateStart ? formatDate(dateStart) : 'Início'} a ${dateEnd ? formatDate(dateEnd) : 'Fim'} |
        Status: ${statusFilter || 'Todos'} | API: ${apiFilter || 'Todas'}
    </div>
    <table class="report-table">
        <thead>
            <th>Município</th>
            <th>APIs Integradas</th>
            <th>Responsável</th> <th style="text-align:center;">Vencimento</th>
            <th style="text-align:center;">Status</th>
            <th>Observação</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}
function exportReportIntegracoesExcel() {
    // ... (Filtros iguais) ...
    const dateStart = document.getElementById('rep-int-start').value;
    const dateEnd = document.getElementById('rep-int-end').value;
    const statusFilter = document.getElementById('rep-int-status').value;
    const munFilter = document.getElementById('rep-int-mun').value;
    const apiFilter = document.getElementById('rep-int-api').value;

    let data = integrations.filter(i => {
        if (munFilter && i.municipality !== munFilter) return false;
        if (apiFilter && (!i.apis || !i.apis.includes(apiFilter))) return false;
        if (dateStart && i.expirationDate < dateStart) return false;
        if (dateEnd && i.expirationDate > dateEnd) return false;
        if (statusFilter) {
            const diff = getDaysDiff(i.expirationDate);
            if (statusFilter === 'Vencido' && diff >= 0) return false;
            if (statusFilter === 'Alerta' && (diff < 0 || diff > 30)) return false;
            if (statusFilter === 'Em dia' && diff <= 30) return false;
        }
        return true;
    });

    if (data.length === 0) { alert('Nada para exportar.'); return; }

    // Adicionado Responsável
    const headers = ['Município', 'APIs', 'Responsável Certificado', 'Data Vencimento', 'Dias Restantes', 'Observação'];
    const rows = data.map(i => [
        i.municipality,
        (i.apis || []).join(', '),
        i.responsible || '', // Valor
        formatDate(i.expirationDate),
        getDaysDiff(i.expirationDate),
        i.observation
    ]);

    downloadXLSX("Relatorio_Integracoes_Filtrado", headers, rows);
}
function genRepColaboradores() {
    // 1. Filtros
    const statusFilter = document.getElementById('rep-colab-status').value;
    const nameFilter = document.getElementById('rep-colab-name').value;
    const admStart = document.getElementById('rep-colab-adm-start').value;
    const admEnd = document.getElementById('rep-colab-adm-end').value;
    const termStart = document.getElementById('rep-colab-term-start').value;
    const termEnd = document.getElementById('rep-colab-term-end').value;

    // 2. Filtragem
    let data = collaboratorInfos.filter(c => {
        if (statusFilter && c.status !== statusFilter) return false;
        if (nameFilter && c.name !== nameFilter) return false;

        // Filtro Data Admissão
        if (admStart && c.admissionDate < admStart) return false;
        if (admEnd && c.admissionDate > admEnd) return false;

        // Filtro Data Desligamento
        if (termStart && (!c.terminationDate || c.terminationDate < termStart)) return false;
        if (termEnd && (!c.terminationDate || c.terminationDate > termEnd)) return false;

        return true;
    });

    data.sort((a,b) => a.name.localeCompare(b.name));

    if (!data.length) return '<p style="text-align:center; padding:20px;">Nenhum colaborador encontrado.</p>';

    const rows = data.map(c => {
        // Busca nascimento no cadastro mestre para calcular idade
        const master = orientadores.find(o => o.name === c.name);
        const birthDate = master ? master.birthDate : null;
        
        const tempoCasa = calcDateDiffString(c.admissionDate, c.status === 'Desligado da Empresa' ? c.terminationDate : null);
        const corStatus = c.status === 'Ativo na Empresa' ? 'green' : '#C85250';

        return `
        <tr>
            <td>${c.name}</td>
            <td style="color:${corStatus}; font-weight:bold;">${c.status}</td>
            <td style="text-align:center;">${formatDate(birthDate)}</td>
            <td style="text-align:center;">${formatDate(c.admissionDate)}</td>
            <td style="text-align:center;">${c.terminationDate ? formatDate(c.terminationDate) : '-'}</td>
            <td>${tempoCasa}</td>
            <td>${formatDate(c.lastVacationEnd)}</td>
        </tr>`;
    }).join('');

    return `
    <div style="margin-bottom:10px; font-size:11px; color:#666;">
        <strong>Filtros:</strong> 
        Status: ${statusFilter || 'Todas'} | 
        Admissão: ${admStart ? formatDate(admStart) : 'Início'} a ${admEnd ? formatDate(admEnd) : 'Fim'}
    </div>
    <table class="report-table">
        <thead>
            <th>Nome</th>
            <th>Situação</th>
            <th style="text-align:center;">Nascimento</th>
            <th style="text-align:center;">Admissão</th>
            <th style="text-align:center;">Desligamento</th>
            <th>Tempo de Casa</th>
            <th>Últimas Férias</th>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}
function exportReportColaboradoresExcel() {
    const statusFilter = document.getElementById('rep-colab-status').value;
    const nameFilter = document.getElementById('rep-colab-name').value;
    const admStart = document.getElementById('rep-colab-adm-start').value;
    const admEnd = document.getElementById('rep-colab-adm-end').value;
    const termStart = document.getElementById('rep-colab-term-start').value;
    const termEnd = document.getElementById('rep-colab-term-end').value;

    let data = collaboratorInfos.filter(c => {
        if (statusFilter && c.status !== statusFilter) return false;
        if (nameFilter && c.name !== nameFilter) return false;
        if (admStart && c.admissionDate < admStart) return false;
        if (admEnd && c.admissionDate > admEnd) return false;
        if (termStart && (!c.terminationDate || c.terminationDate < termStart)) return false;
        if (termEnd && (!c.terminationDate || c.terminationDate > termEnd)) return false;
        return true;
    });

    if (data.length === 0) { alert('Nada para exportar.'); return; }

    const headers = ['Nome', 'Status', 'Nascimento', 'Admissão', 'Desligamento', 'Tempo de Serviço', 'Últimas Férias', 'Obs'];
    
    const rows = data.map(c => {
        const master = orientadores.find(o => o.name === c.name);
        const birth = master ? master.birthDate : '';
        const tempo = calcDateDiffString(c.admissionDate, c.status === 'Desligado da Empresa' ? c.terminationDate : null);

        return [
            c.name,
            c.status,
            formatDate(birth),
            formatDate(c.admissionDate),
            formatDate(c.terminationDate),
            tempo,
            formatDate(c.lastVacationEnd),
            c.observation
        ];
    });

    downloadXLSX("Relatorio_RH_Colaboradores_Filtrado", headers, rows);
}
// ============================================================================
// 1. FUNÇÃO AUXILIAR: Retorna dados para o PDF (Array de Objetos)
// ============================================================================
function getFilterData(type) {
    let filters = [];
    
    const fmt = (d) => { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
    
    // Helper inteligente
    const add = (label, val) => {
        if (val && val !== 'Todos' && val !== 'Todas' && val !== '') {
            filters.push({ label: label, value: val });
        }
    };
    const addDate = (idS, idE, label) => {
        const s = document.getElementById(idS).value;
        const e = document.getElementById(idE).value;
        if (s || e) filters.push({ label: label, value: `${s ? fmt(s) : 'Início'} até ${e ? fmt(e) : 'Hoje'}` });
    };

    // Mapeamento dos campos
    if (type === 'municipios') {
        const dType = document.getElementById('rep-mun-date-type').value === 'visita' ? 'Última Visita' : 'Implantação';
        addDate('rep-mun-start', 'rep-mun-end', dType);
        add('Status', document.getElementById('rep-mun-status').value);
    }
    else if (type === 'treinamentos') {
        const dType = document.getElementById('rep-train-date-type').value === 'realizacao' ? 'Realização' : 'Solicitação';
        addDate('rep-train-start', 'rep-train-end', dType);
        add('Status', document.getElementById('rep-train-status').value);
        add('Município', document.getElementById('rep-train-mun').value);
        add('Colaborador', document.getElementById('rep-train-colab').value);
        add('Cargo', document.getElementById('rep-train-cargo').value);
        add('Profissional', document.getElementById('rep-train-prof').value);
    }
    else if (type === 'apresentacoes') {
        const dType = document.getElementById('rep-pres-date-type').value === 'realizacao' ? 'Realização' : 'Solicitação';
        addDate('rep-pres-start', 'rep-pres-end', dType);
        add('Status', document.getElementById('rep-pres-status').value);
        add('Município', document.getElementById('rep-pres-mun').value);
        add('Colaborador', document.getElementById('rep-pres-colab').value);
        add('Forma', document.getElementById('rep-pres-form').value);
    }
    else if (type === 'visitas') {
        const dType = document.getElementById('rep-vis-date-type').value === 'realizacao' ? 'Realização' : 'Solicitação';
        addDate('rep-vis-start', 'rep-vis-end', dType);
        add('Status', document.getElementById('rep-vis-status').value);
        add('Município', document.getElementById('rep-vis-mun').value);
        add('Solicitante', document.getElementById('rep-vis-applicant').value);
    }
    else if (type === 'producao') {
        const dType = document.getElementById('rep-prod-date-type').value === 'envio' ? 'Envio' : 'Liberação';
        addDate('rep-prod-start', 'rep-prod-end', dType);
        add('Status', document.getElementById('rep-prod-status').value);
        add('Frequência', document.getElementById('rep-prod-freq').value);
        add('Município', document.getElementById('rep-prod-mun').value);
        add('Profissional', document.getElementById('rep-prod-prof').value);
    }
    else if (type === 'integracoes') {
        addDate('rep-int-start', 'rep-int-end', 'Vencimento');
        add('Status', document.getElementById('rep-int-status').value);
        add('Município', document.getElementById('rep-int-mun').value);
        add('API', document.getElementById('rep-int-api').value);
    }
    else if (type === 'colaboradores') {
        addDate('rep-colab-adm-start', 'rep-colab-adm-end', 'Admissão');
        addDate('rep-colab-term-start', 'rep-colab-term-end', 'Desligamento');
        add('Situação', document.getElementById('rep-colab-status').value);
        add('Colaborador', document.getElementById('rep-colab-name').value);
    }

    return filters;
}
