// ============================================================================
// SIGP SAÚDE v32.0 - VERSÃO FINAL "MONSTRA" (SEM COMPACTAÇÃO)
// Data: 22/11/2025
// ============================================================================

// ----------------------------------------------------------------------------
// 1. VERIFICAÇÃO DE SEGURANÇA
// ----------------------------------------------------------------------------
if (typeof CryptoJS === 'undefined') {
    alert('ERRO CRÍTICO: A biblioteca CryptoJS não foi carregada. Verifique sua conexão ou o cabeçalho do HTML.');
    throw new Error('CryptoJS is missing');
}

// ----------------------------------------------------------------------------
// 2. CONFIGURAÇÕES GERAIS E VARIÁVEIS DE ESTADO
// ----------------------------------------------------------------------------
const SALT_LENGTH = 16;

// Variável temporária para o restore de backup
let pendingBackupData = null;

// Variáveis Globais para Instâncias de Gráficos (Chart.js)
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
// 3. FUNÇÕES DE MENU MOBILE (CORREÇÃO FINAL)
// ----------------------------------------------------------------------------
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    // Se não existir overlay, cria dinamicamente (Segurança)
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

function salvarNoArmazenamento(chave, dados) {
    try {
        const dadosJSON = JSON.stringify(dados);
        localStorage.setItem(chave, dadosJSON);
    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        if (erro.name === 'QuotaExceededError') {
            alert('⚠️ Espaço de armazenamento cheio! Por favor, faça um backup e limpe dados antigos.');
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
        console.error('Erro ao recuperar:', erro);
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

function calculateDaysSince(dateString) {
    if (!dateString) return '-';
    
    const last = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return `${diffDays} dias`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
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
        alert('Biblioteca PDF não carregada.');
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
// 6. MÁSCARAS E FORMATAÇÃO
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
    
    // Refresh automático nos filtros
    const filters = document.querySelectorAll('.filters-section select, .filters-section input');
    filters.forEach(function(el) {
        el.addEventListener('change', function() {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                refreshCurrentTab(activeTab.id);
            }
        });
    });
}

// ----------------------------------------------------------------------------
// 7. CARREGAMENTO DE DADOS (STATE) - DADOS PADRÃO COMPLETOS
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
        { id: 1, name: 'Cadastros', abbreviation: 'CAD', color: '#005580' }, 
        { id: 2, name: 'TFD', abbreviation: 'TFD', color: '#005580' },
        { id: 3, name: 'Prontuário', abbreviation: 'PEC', color: '#005580' }, 
        { id: 4, name: 'Administração', abbreviation: 'ADM', color: '#005580' }
    ]
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
// ----------------------------------------------------------------------------
// 8. INTERFACE E NAVEGAÇÃO
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
    if (!currentUser) return;
    
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
            
            // Remove active de todos
            buttons.forEach(function(b) {
                b.classList.remove('active');
            });
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
            
            // Fecha menu mobile se estiver aberto
            if (window.innerWidth <= 900) {
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                if(sidebar && sidebar.classList.contains('mobile-open')) {
                    toggleMobileMenu();
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

// Navegação de Configurações
function navigateToUserManagement() { toggleSettingsMenu(); openTab('usuarios-section'); renderUsers(); }
function navigateToCargoManagement() { toggleSettingsMenu(); openTab('cargos-section'); renderCargos(); }
function navigateToOrientadorManagement() { toggleSettingsMenu(); openTab('orientadores-section'); renderOrientadores(); }
function navigateToModuloManagement() { toggleSettingsMenu(); openTab('modulos-section'); renderModulos(); }
function navigateToMunicipalityListManagement() { toggleSettingsMenu(); openTab('municipality-list-section'); renderMunicipalityList(); }
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
// 9. AUTENTICAÇÃO
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
// 10. MUNICÍPIOS CLIENTES (REGRAS PDF 1)
// ----------------------------------------------------------------------------

function handleMunicipalityStatusChange() {
    const status = document.getElementById('municipality-status').value;
    const groupBlocked = document.getElementById('group-date-blocked');
    const groupStopped = document.getElementById('group-date-stopped');
    
    if (groupBlocked) {
        groupBlocked.style.display = 'none';
    }
    if (groupStopped) {
        groupStopped.style.display = 'none';
    }
    
    if (status === 'Bloqueado' && groupBlocked) {
        groupBlocked.style.display = 'block';
    } else if (status === 'Parou de usar' && groupStopped) {
        groupStopped.style.display = 'block';
    }
}

function showMunicipalityModal(id = null) {
    editingId = id;
    document.getElementById('municipality-form').reset();
    
    populateSelect('municipality-name', municipalitiesList);
    
    const statusSel = document.getElementById('municipality-status');
    statusSel.onchange = handleMunicipalityStatusChange;

    // Renderiza checkboxes de módulos dinamicamente
    const checkboxContainer = document.querySelector('#municipality-form .checkbox-grid');
    if(checkboxContainer) {
        if(modulos.length > 0) {
            checkboxContainer.innerHTML = modulos.map(function(m) {
                return `<label><input type="checkbox" value="${m.name}" class="module-checkbox"> ${m.name}</label>`;
            }).join('');
        } else {
            checkboxContainer.innerHTML = '<p style="font-size:12px;color:gray;">Nenhum módulo cadastrado.</p>';
        }
    }

    if (id) {
        const m = municipalities.find(function(x) { return x.id === id; });
        if (m) {
            document.getElementById('municipality-name').value = m.name;
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
            handleMunicipalityStatusChange();
        }
    } else {
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
    
    const counter = document.getElementById('municipalities-results-count');
    if (counter) {
        counter.style.display = 'block';
        counter.innerHTML = '<strong>' + filtered.length + '</strong> município(s) no total';
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum município encontrado.</div>';
    } else {
        const rows = filtered.map(function(m) {
            const modulesBadges = m.modules.map(function(modName) {
                const modConfig = modulos.find(function(x) { return x.name === modName; });
                const abbrev = modConfig ? modConfig.abbreviation : modName.substring(0,3).toUpperCase();
                // Ajuste 8: Todos os módulos azul #005580
                return `<span class="module-tag" style="background:#005580;color:white;padding:2px 6px;border-radius:4px;font-size:10px;margin-right:2px;" title="${modName}">${abbrev}</span>`;
            }).join('');
            
            // Ajuste 8: Cores de Status
            let statusColor = '#005580'; // Azul (Em uso)
            if (m.status === 'Bloqueado') statusColor = '#C85250'; // Vermelho
            if (m.status === 'Parou de usar') statusColor = '#E68161'; // Laranja
            if (m.status === 'Não Implantado') statusColor = '#79C2A9'; // Verde

            return `<tr>
                <td><strong>${m.name}</strong></td>
                <td><div class="module-tags">${modulesBadges}</div></td>
                <td>${m.manager}</td>
                <td>${m.contact}</td>
                <td>${formatDate(m.implantationDate)}</td>
                <td>${formatDate(m.lastVisit)}</td>
                <td>${calculateTimeInUse(m.implantationDate)}</td>
                <td>${calculateDaysSince(m.lastVisit)}</td>
                <td><span class="status-badge" style="background:${statusColor};color:white;">${m.status}</span></td>
                <td>
                    <button class="btn btn--sm" onclick="showMunicipalityModal(${m.id})">✏️</button>
                    <button class="btn btn--sm" onclick="deleteMunicipality(${m.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        c.innerHTML = `<table><thead><th>Município</th><th>Módulos</th><th>Gestor</th><th>Contato</th><th>Implantação</th><th>Última Visita</th><th>Tempo de Uso</th><th>Dias s/ Visita</th><th>Status</th><th>Ações</th></thead><tbody>${rows}</tbody></table>`;
    }
    
    updateMunicipalityCharts(filtered);
}

function updateMunicipalityCharts(data) {
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
                        data.filter(function(m) { return m.status === 'Em uso'; }).length, 
                        data.filter(function(m) { return m.status === 'Bloqueado'; }).length, 
                        data.filter(function(m) { return m.status === 'Parou de usar'; }).length,
                        data.filter(function(m) { return m.status === 'Não Implantado'; }).length
                    ], 
                    backgroundColor: ['#4ECDC4', '#FF6B6B', '#FFA07A', '#95A5A6'] 
                }] 
            }
        });
    }
    
    const ctxModules = document.getElementById('modulesChart');
    if (ctxModules && window.Chart) {
        if (chartModulesMun) {
            chartModulesMun.destroy();
        }
        
        const modCounts = {};
        data.forEach(function(m) {
            m.modules.forEach(function(mod) {
                modCounts[mod] = (modCounts[mod] || 0) + 1;
            });
        });
        
        chartModulesMun = new Chart(document.getElementById('modulesChart'), {
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

    const ctxTimeline = document.getElementById('timelineChart');
    if (ctxTimeline && window.Chart) {
        if (chartTimelineMun) {
            chartTimelineMun.destroy();
        }
        
        const timeData = {};
        data.forEach(function(m) { 
            if(m.implantationDate) {
                const y = m.implantationDate.split('-')[0];
                timeData[y] = (timeData[y]||0)+1; 
            }
        });
        
        const sortedYears = Object.keys(timeData).sort();
        chartTimelineMun = new Chart(document.getElementById('timelineChart'), {
            type: 'line',
            data: { 
                labels: sortedYears, 
                datasets: [{ 
                    label: 'Implantações', 
                    data: sortedYears.map(function(y) { return timeData[y]; }), 
                    borderColor: '#FF6B6B' 
                }] 
            }
        });
    }

    // Atualiza contadores
    if(document.getElementById('total-municipalities')) {
        document.getElementById('total-municipalities').textContent = data.length;
    }
    if(document.getElementById('active-municipalities')) {
        document.getElementById('active-municipalities').textContent = data.filter(function(m) { return m.status === 'Em uso'; }).length;
    }
    if(document.getElementById('inactive-municipalities')) {
        document.getElementById('inactive-municipalities').textContent = data.filter(function(m) { return m.status !== 'Em uso'; }).length;
    }
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
// 12. TREINAMENTOS (Itens 1, 2 e Correções)
// ----------------------------------------------------------------------------

function showTaskModal(id = null) {
    editingId = id;
    document.getElementById('task-form').reset();
    updateGlobalDropdowns();
    
    // Ajuste: Mover município para o topo
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
        tasks[i] = { ...tasks[i], ...data };
    } else {
        tasks.push({ id: getNextId('task'), ...data });
    }
    salvarNoArmazenamento('tasks', tasks);
    document.getElementById('task-modal').classList.remove('show');
    renderTasks();
    showToast('Treinamento salvo!', 'success');
}

function getFilteredTasks() {
    const fMun = document.getElementById('filter-task-municipality') ? document.getElementById('filter-task-municipality').value : '';
    const fStatus = document.getElementById('filter-task-status') ? document.getElementById('filter-task-status').value : '';
    const fReq = document.getElementById('filter-task-requester') ? document.getElementById('filter-task-requester').value.toLowerCase() : '';
    const fPerf = document.getElementById('filter-task-performer') ? document.getElementById('filter-task-performer').value : '';
    const fCargo = document.getElementById('filter-task-position') ? document.getElementById('filter-task-position').value : '';
    const fDateType = document.getElementById('filter-task-date-type') ? document.getElementById('filter-task-date-type').value : 'requested';
    const fDateStart = document.getElementById('filter-task-date-start') ? document.getElementById('filter-task-date-start').value : '';
    const fDateEnd = document.getElementById('filter-task-date-end') ? document.getElementById('filter-task-date-end').value : '';

    let filtered = tasks.filter(function(t) {
        if (fMun && t.municipality !== fMun) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fReq && !t.requestedBy.toLowerCase().includes(fReq)) return false;
        if (fPerf && t.performedBy !== fPerf) return false;
        if (fCargo && t.trainedPosition !== fCargo) return false;

        const dateToCheck = (fDateType === 'performed') ? t.datePerformed : t.dateRequested;
        if (fDateStart && dateToCheck < fDateStart) return false;
        if (fDateEnd && dateToCheck > fDateEnd) return false;
        
        return true;
    });

    return filtered.sort(function(a, b) {
        // Ordenação: Pendentes primeiro
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return new Date(a.dateRequested) - new Date(b.dateRequested);
    });
}

function renderTasks() {
    const filtered = getFilteredTasks();
    const c = document.getElementById('tasks-table');
    
    const counter = document.getElementById('tasks-results-count');
    if (counter) {
        counter.style.display = 'block';
        counter.innerHTML = '<strong>' + filtered.length + '</strong> treinamentos';
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum treinamento encontrado.</div>';
    } else {
        const rows = filtered.map(function(t) {
            return '<tr>' +
                '<td><strong>' + t.municipality + '</strong></td>' +
                '<td>' + formatDate(t.dateRequested) + '</td>' +
                '<td>' + formatDate(t.datePerformed) + '</td>' +
                '<td>' + t.requestedBy + '</td>' +
                '<td>' + t.performedBy + '</td>' +
                '<td>' + t.trainedName + '</td>' +
                '<td>' + t.trainedPosition + '</td>' +
                '<td>' + t.contact + '</td>' +
                '<td><span class="task-status ' + (t.status === 'Concluído' ? 'completed' : 'pending') + '">' + t.status + '</span></td>' +
                '<td>' +
                    '<button class="btn btn--sm" onclick="showTaskModal(' + t.id + ')">✏️</button> ' +
                    '<button class="btn btn--sm" onclick="deleteTask(' + t.id + ')">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        c.innerHTML = '<table><thead><th>Município</th><th>Data Sol.</th><th>Data Real.</th><th>Solicitante</th><th>Orientador</th><th>Profissional</th><th>Cargo</th><th>Contato</th><th>Status</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    }
    
    if(document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent = filtered.length;
    if(document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent = filtered.filter(function(t){return t.status==='Concluído'}).length;
    if(document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent = filtered.filter(function(t){return t.status==='Pendente'}).length;
    if(document.getElementById('cancelled-tasks')) document.getElementById('cancelled-tasks').textContent = filtered.filter(function(t){return t.status==='Cancelado'}).length;
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
    ['filter-task-municipality', 'filter-task-status', 'filter-task-requester', 'filter-task-performer', 'filter-task-position', 'filter-task-date-start', 'filter-task-date-end'].forEach(function(id) {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderTasks();
}

// ----------------------------------------------------------------------------
// 13. SOLICITAÇÕES (PDF Item 2, 4, 5, 17)
// ----------------------------------------------------------------------------

function handleRequestStatusChange() {
    const status = document.getElementById('request-status').value;
    const grpReal = document.getElementById('group-request-date-realization');
    const grpJust = document.getElementById('group-request-justification');
    
    // Reset visual
    if (grpReal) grpReal.style.display = 'none';
    if (grpJust) grpJust.style.display = 'none';

    // Lógica de exibição conforme PDF
    if (status === 'Realizado' && grpReal) {
        grpReal.style.display = 'block';
    } else if (status === 'Inviável' && grpJust) {
        grpJust.style.display = 'block';
    }
}

function showRequestModal(id = null) {
    editingId = id;
    const form = document.getElementById('request-form');
    form.reset();
    
    // Ajuste Visual: Move campo Município para o topo
    const fieldMun = document.getElementById('request-municipality').closest('.form-group');
    if (fieldMun) {
        form.insertBefore(fieldMun, form.firstChild);
    }

    const statusSel = document.getElementById('request-status');
    statusSel.onchange = handleRequestStatusChange;
    
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
            
            if (document.getElementById('request-date-realization')) {
                document.getElementById('request-date-realization').value = r.dateRealization || '';
            }
            if (document.getElementById('request-justification')) {
                document.getElementById('request-justification').value = r.justification || '';
            }
            
            handleRequestStatusChange();
        }
    }
    document.getElementById('request-modal').classList.add('show');
}

function saveRequest(e) {
    e.preventDefault();
    const status = document.getElementById('request-status').value;
    
    // Validações Específicas (PDF Item 2)
    if (status === 'Realizado') {
        const dateReal = document.getElementById('request-date-realization').value;
        if (!dateReal) {
            alert('Erro: Data de Realização é obrigatória para status Realizado.');
            return;
        }
    }
    
    if (status === 'Inviável') {
        const just = document.getElementById('request-justification').value;
        if (!just) {
            alert('Erro: Justificativa é obrigatória para status Inviável.');
            return;
        }
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
    showToast('Solicitação salva com sucesso!', 'success');
}

function getFilteredRequests() {
    const fMun = document.getElementById('filter-request-municipality') ? document.getElementById('filter-request-municipality').value : '';
    const fStatus = document.getElementById('filter-request-status') ? document.getElementById('filter-request-status').value : '';
    const fSol = document.getElementById('filter-request-solicitante') ? document.getElementById('filter-request-solicitante').value.toLowerCase() : '';
    const fUser = document.getElementById('filter-request-user') ? document.getElementById('filter-request-user').value.toLowerCase() : '';
    const fDateType = document.getElementById('filter-request-date-type') ? document.getElementById('filter-request-date-type').value : 'solicitacao';
    const fDateStart = document.getElementById('filter-request-date-start') ? document.getElementById('filter-request-date-start').value : '';
    const fDateEnd = document.getElementById('filter-request-date-end') ? document.getElementById('filter-request-date-end').value : '';

    let filtered = requests.filter(function(r) {
        if (fMun && r.municipality !== fMun) return false;
        if (fStatus && r.status !== fStatus) return false;
        if (fSol && !r.requester.toLowerCase().includes(fSol)) return false;
        if (fUser && (!r.user || !r.user.toLowerCase().includes(fUser))) return false;
        
        const dateToCheck = (fDateType === 'realizacao') ? r.dateRealization : r.date;
        if (fDateStart && dateToCheck < fDateStart) return false;
        if (fDateEnd && dateToCheck > fDateEnd) return false;
        
        return true;
    });

    // Ordenação (Pendentes primeiro)
    return filtered.sort(function(a, b) {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return new Date(a.date) - new Date(b.date);
    });
}

function renderRequests() {
    const filtered = getFilteredRequests();
    const c = document.getElementById('requests-table');
    
    const counter = document.getElementById('requests-results-count');
    if (counter) {
        counter.innerHTML = '<strong>' + filtered.length + '</strong> solicitações';
        counter.style.display = 'block';
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhuma solicitação encontrada.</div>';
    } else {
        const rows = filtered.map(function(x) {
            const desc = x.description.length > 30 ? x.description.substring(0,30)+'...' : x.description;
            return '<tr>' +
                '<td><strong>' + x.municipality + '</strong></td>' +
                '<td>' + formatDate(x.date) + '</td>' +
                '<td>' + formatDate(x.dateRealization) + '</td>' +
                '<td>' + x.requester + '</td>' +
                '<td>' + x.contact + '</td>' +
                '<td title="' + x.description + '">' + desc + '</td>' +
                '<td>' + (x.user || '-') + '</td>' +
                '<td>' + x.status + '</td>' +
                '<td>' +
                    '<button class="btn btn--sm" onclick="showRequestModal(' + x.id + ')">✏️</button> ' +
                    '<button class="btn btn--sm" onclick="deleteRequest(' + x.id + ')">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        c.innerHTML = '<table><thead><th>Município</th><th>Data Sol.</th><th>Data Real.</th><th>Solicitante</th><th>Contato</th><th>Descrição</th><th>Usuário</th><th>Status</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    }
    
    // Atualiza Estatísticas
    if(document.getElementById('total-requests')) document.getElementById('total-requests').textContent = filtered.length;
    if(document.getElementById('pending-requests')) document.getElementById('pending-requests').textContent = filtered.filter(function(r) { return r.status==='Pendente'; }).length;
    if(document.getElementById('completed-requests')) document.getElementById('completed-requests').textContent = filtered.filter(function(r) { return r.status==='Realizado'; }).length;
    
    updateRequestCharts(filtered);
}

function updateRequestCharts(data) {
    if (document.getElementById('requestStatusChart') && window.Chart) {
        if (chartStatusReq) chartStatusReq.destroy();
        chartStatusReq = new Chart(document.getElementById('requestStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizado', 'Inviável'], 
                datasets: [{ 
                    data: [
                        data.filter(function(x) { return x.status==='Pendente'; }).length, 
                        data.filter(function(x) { return x.status==='Realizado'; }).length, 
                        data.filter(function(x) { return x.status==='Inviável'; }).length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
    if (document.getElementById('requestMunicipalityChart') && window.Chart) {
        if (chartMunReq) chartMunReq.destroy();
        const mCounts = {}; 
        data.forEach(function(r) { mCounts[r.municipality] = (mCounts[r.municipality]||0)+1; });
        chartMunReq = new Chart(document.getElementById('requestMunicipalityChart'), {
            type: 'bar', 
            data: { labels: Object.keys(mCounts), datasets: [{ label: 'Qtd', data: Object.values(mCounts), backgroundColor: '#4ECDC4' }] }
        });
    }
    if (document.getElementById('requestRequesterChart') && window.Chart) {
        if (chartSolReq) chartSolReq.destroy();
        const sCounts = {}; 
        data.forEach(function(r) { sCounts[r.requester] = (sCounts[r.requester]||0)+1; });
        chartSolReq = new Chart(document.getElementById('requestRequesterChart'), {
            type: 'bar', 
            data: { labels: Object.keys(sCounts), datasets: [{ label: 'Qtd', data: Object.values(sCounts), backgroundColor: '#FF6B6B' }] }
        });
    }
}

function deleteRequest(id) {
    if (confirm('Excluir solicitação?')) {
        requests = requests.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('requests', requests);
        renderRequests();
    }
}
function closeRequestModal() { document.getElementById('request-modal').classList.remove('show'); }
function clearRequestFilters() {
    ['filter-request-municipality','filter-request-status','filter-request-solicitante','filter-request-user','filter-request-date-start','filter-request-date-end'].forEach(function(id) {
        if(document.getElementById(id)) document.getElementById(id).value = '';
    });
    renderRequests();
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


// =====================================================
// 14. APRESENTAÇÕES (PDF Item 3)
// =====================================================

function showPresentationModal(id = null) {
    editingId = id;
    document.getElementById('presentation-form').reset();
    updateGlobalDropdowns();
    
    // Popula checkboxes
    const divO = document.getElementById('presentation-orientador-checkboxes');
    if (divO) {
        divO.innerHTML = orientadores.map(function(o) {
            return '<label><input type="checkbox" value="' + o.name + '" class="orientador-check"> ' + o.name + '</label>';
        }).join('');
    }
    const divF = document.getElementById('presentation-forms-checkboxes');
    if (divF) {
        divF.innerHTML = formasApresentacao.map(function(f) {
            return '<label><input type="checkbox" value="' + f.name + '" class="forma-check"> ' + f.name + '</label>';
        }).join('');
    }

    if (id) {
        const p = presentations.find(function(x) { return x.id === id; });
        if (p) {
            document.getElementById('presentation-municipality').value = p.municipality;
            document.getElementById('presentation-date-solicitacao').value = p.dateSolicitacao;
            document.getElementById('presentation-requester').value = p.requester;
            document.getElementById('presentation-status').value = p.status;
            document.getElementById('presentation-description').value = p.description;
            
            if (document.getElementById('presentation-date-realizacao')) {
                document.getElementById('presentation-date-realizacao').value = p.dateRealizacao || '';
            }
            
            if (p.orientadores) {
                document.querySelectorAll('.orientador-check').forEach(function(cb) {
                    cb.checked = p.orientadores.includes(cb.value);
                });
            }
            if (p.forms) {
                document.querySelectorAll('.forma-check').forEach(function(cb) {
                    cb.checked = p.forms.includes(cb.value);
                });
            }
        }
    }
    document.getElementById('presentation-modal').classList.add('show');
}

function savePresentation(e) {
    e.preventDefault();
    const status = document.getElementById('presentation-status').value;
    const orientadoresSel = Array.from(document.querySelectorAll('.orientador-check:checked')).map(function(c) { return c.value; });
    const formasSel = Array.from(document.querySelectorAll('.forma-check:checked')).map(function(c) { return c.value; });
    
    // Validação PDF Item 3
    if (status === 'Realizada') {
        if (formasSel.length === 0) {
            alert('Erro: Selecione pelo menos uma Forma de Apresentação.');
            return;
        }
        if (!document.getElementById('presentation-date-realizacao').value) {
            alert('Erro: Informe a Data de Realização.');
            return;
        }
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
        const i = presentations.findIndex(function(x) { return x.id === editingId; });
        presentations[i] = { ...presentations[i], ...data };
    } else {
        presentations.push({ id: getNextId('pres'), ...data });
    }
    
    salvarNoArmazenamento('presentations', presentations);
    document.getElementById('presentation-modal').classList.remove('show');
    renderPresentations();
    showToast('Apresentação salva!', 'success');
}

function getFilteredPresentations() {
    const fMun = document.getElementById('filter-presentation-municipality') ? document.getElementById('filter-presentation-municipality').value : '';
    const fStatus = document.getElementById('filter-presentation-status') ? document.getElementById('filter-presentation-status').value : '';
    
    let filtered = presentations.filter(function(p) {
        if (fMun && p.municipality !== fMun) return false;
        if (fStatus && p.status !== fStatus) return false;
        return true;
    });

    return filtered.sort(function(a,b) {
        return new Date(a.dateSolicitacao) - new Date(b.dateSolicitacao);
    });
}

function renderPresentations() {
    const filtered = getFilteredPresentations();
    const c = document.getElementById('presentations-table');
    const counter = document.getElementById('presentations-results-count');
    if (counter) {
        counter.innerHTML = '<strong>' + filtered.length + '</strong> apresentações';
        counter.style.display = 'block';
    }

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        // Ajuste 4: Descrição curta, Botões lado a lado
        const rows = filtered.map(function(p) {
            const desc = p.description ? (p.description.length > 20 ? p.description.substring(0,20) + '...' : p.description) : '-';
            return '<tr>' +
                '<td>' + p.municipality + '</td>' +
                '<td>' + formatDate(p.dateSolicitacao) + '</td>' +
                '<td>' + p.requester + '</td>' +
                '<td>' + p.status + '</td>' +
                '<td>' + formatDate(p.dateRealizacao) + '</td>' +
                '<td>' + (p.orientadores ? p.orientadores.join(', ') : '-') + '</td>' +
                '<td>' + (p.forms ? p.forms.join(', ') : '-') + '</td>' +
                '<td title="' + (p.description || '') + '">' + desc + '</td>' +
                '<td>' +
                    '<div style="display:flex;gap:5px;">' +
                    '<button class="btn btn--sm" onclick="showPresentationModal(' + p.id + ')">✏️</button> ' +
                    '<button class="btn btn--sm" onclick="deletePresentation(' + p.id + ')">🗑️</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
        c.innerHTML = '<table><thead><th>Município</th><th>Data Sol.</th><th>Solicitante</th><th>Status</th><th>Realização</th><th>Orientadores</th><th>Forma</th><th>Descrição</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    }
    
    if(document.getElementById('total-presentations')) document.getElementById('total-presentations').textContent = filtered.length;
    updatePresentationCharts(filtered);
}

function updatePresentationCharts(data) {
    if (document.getElementById('presentationStatusChart') && window.Chart) {
        if (chartStatusPres) chartStatusPres.destroy();
        chartStatusPres = new Chart(document.getElementById('presentationStatusChart'), {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Realizada', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(function(p){return p.status==='Pendente';}).length,
                        data.filter(function(p){return p.status==='Realizada';}).length,
                        data.filter(function(p){return p.status==='Cancelada';}).length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }
    
    if (document.getElementById('presentationMunicipalityChart') && window.Chart) {
        if (chartMunPres) chartMunPres.destroy();
        const mCounts = {}; 
        data.forEach(function(p) { mCounts[p.municipality] = (mCounts[p.municipality]||0)+1; });
        chartMunPres = new Chart(document.getElementById('presentationMunicipalityChart'), {
            type: 'bar',
            data: { labels: Object.keys(mCounts), datasets: [{ label: 'Qtd', data: Object.values(mCounts), backgroundColor: '#4ECDC4' }] }
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
    if(document.getElementById('filter-presentation-municipality')) document.getElementById('filter-presentation-municipality').value = ''; 
    renderPresentations(); 
}
function exportPresentationsCSV() {
    const data = getFilteredPresentations();
    const headers = ['Município', 'Data', 'Status'];
    const rows = data.map(function(p) { return [p.municipality, formatDate(p.dateSolicitacao), p.status]; });
    downloadCSV('apresentacoes.csv', headers, rows);
}
function generatePresentationsPDF() {
    const data = getFilteredPresentations();
    const headers = ['Município', 'Data', 'Status'];
    const rows = data.map(function(p) { return [p.municipality, formatDate(p.dateSolicitacao), p.status]; });
    downloadPDF('Relatório Apresentações', headers, rows);
}


// =====================================================
// 15. DEMANDAS (PDF Item 4)
// =====================================================
function handleDemandStatusChange() {
    const status = document.getElementById('demand-status').value;
    const grpReal = document.getElementById('group-demand-date-realization');
    const grpJust = document.getElementById('group-demand-justification');
    
    if(grpReal) grpReal.style.display = (status === 'Realizada') ? 'block' : 'none';
    if(grpJust) grpJust.style.display = (status === 'Inviável') ? 'block' : 'none';
}

function showDemandModal(id = null) {
    editingId = id;
    document.getElementById('demand-form').reset();
    const statusSel = document.getElementById('demand-status');
    statusSel.onchange = handleDemandStatusChange;

    if (id) {
        const d = demands.find(function(x) { return x.id === id; });
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
    
    if (status === 'Realizada' && !document.getElementById('demand-date-realization').value) {
        alert('Erro: Data de Realização é obrigatória.'); return;
    }
    
    const data = {
        date: document.getElementById('demand-date').value,
        description: document.getElementById('demand-description').value,
        priority: document.getElementById('demand-priority').value,
        status: status,
        dateRealization: document.getElementById('demand-date-realization').value,
        justification: document.getElementById('demand-justification').value,
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

function getFilteredDemands() {
    const fStatus = document.getElementById('filter-demand-status')?.value;
    
    let filtered = demands.filter(function(d) {
        if (fStatus && d.status !== fStatus) return false;
        return true;
    });

    // Ordenação (Alta primeiro)
    const prioMap = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    return filtered.sort(function(a, b) {
        return prioMap[a.priority] - prioMap[b.priority];
    });
}

function renderDemands() {
    const filtered = getFilteredDemands();
    const c = document.getElementById('demands-table');
    
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        // Ajuste 5: Colunas reordenadas
        const rows = filtered.map(function(d) {
            return '<tr>' +
                '<td>' + (d.user || '-') + '</td>' +
                '<td>' + formatDate(d.date) + '</td>' +
                '<td>' + d.description + '</td>' +
                '<td>' + d.priority + '</td>' +
                '<td>' + d.status + '</td>' +
                '<td>' + (d.justification || '-') + '</td>' +
                '<td>' + formatDate(d.dateRealization) + '</td>' +
                '<td>' +
                    '<button class="btn btn--sm" onclick="showDemandModal(' + d.id + ')">✏️</button> ' +
                    '<button class="btn btn--sm" onclick="deleteDemand(' + d.id + ')">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        c.innerHTML = '<table><thead><th>Usuário</th><th>Data Sol.</th><th>Descrição</th><th>Prioridade</th><th>Status</th><th>Justificativa</th><th>Realização</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    }
    
    if (document.getElementById('total-demands')) document.getElementById('total-demands').textContent = filtered.length;
    updateDemandCharts(filtered);
}

function updateDemandCharts(data) {
    if (document.getElementById('demandStatusChart') && window.Chart) {
        if (chartStatusDem) chartStatusDem.destroy();
        chartStatusDem = new Chart(document.getElementById('demandStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Inviável'], 
                datasets: [{ 
                    data: [
                        data.filter(function(d){return d.status==='Pendente';}).length, 
                        data.filter(function(d){return d.status==='Realizada';}).length, 
                        data.filter(function(d){return d.status==='Inviável';}).length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
}

function deleteDemand(id) { if(confirm('Excluir?')){ demands=demands.filter(x=>x.id!==id); salvarNoArmazenamento('demands',demands); renderDemands(); }}
function closeDemandModal() { document.getElementById('demand-modal').classList.remove('show'); }
function clearDemandFilters() { document.getElementById('filter-demand-status').value=''; renderDemands(); }
function exportDemandsCSV(){const d=getFilteredDemands(); const h=['Data','Prioridade','Status']; const r=d.map(x=>[x.date,x.priority,x.status]); downloadCSV('dem.csv',h,r);}
function generateDemandsPDF(){const d=getFilteredDemands(); const h=['Data','Prioridade','Status']; const r=d.map(x=>[x.date,x.priority,x.status]); downloadPDF('Dem',h,r);}


// =====================================================
// 16. VISITAS (PDF Item 5)
// =====================================================
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
    
    const statusSel = document.getElementById('visit-status');
    statusSel.onchange = handleVisitStatusChange;
    updateGlobalDropdowns();

    if (id) {
        const v = visits.find(function(x) { return x.id === id; });
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
    
    if (status === 'Realizada' && !document.getElementById('visit-date-realization').value) {
        alert('Erro: Data de Realização é obrigatória.'); return;
    }
    if (status === 'Cancelada' && !document.getElementById('visit-justification').value) {
        alert('Erro: Justificativa é obrigatória.'); return;
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
    return visits.filter(function(v) {
        if (fMun && v.municipality !== fMun) return false;
        return true;
    });
}

function renderVisits() {
    const filtered = getFilteredVisits();
    const c = document.getElementById('visits-table');
    
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Vazio.</div>';
    } else {
        const rows = filtered.map(function(v) {
            return '<tr>' +
                '<td>' + v.municipality + '</td>' +
                '<td>' + formatDate(v.date) + '</td>' +
                '<td>' + v.applicant + '</td>' +
                '<td>' + (v.reason || '-') + '</td>' +
                '<td>' + v.status + '</td>' +
                '<td>' + formatDate(v.dateRealization) + '</td>' +
                '<td>' + (v.justification || '-') + '</td>' +
                '<td>' +
                    '<button class="btn btn--sm" onclick="showVisitModal(' + v.id + ')">✏️</button> ' +
                    '<button class="btn btn--sm" onclick="deleteVisit(' + v.id + ')">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        c.innerHTML = '<table><thead><th>Município</th><th>Data Sol.</th><th>Solicitante</th><th>Motivo</th><th>Status</th><th>Data Real.</th><th>Justificativa</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    }
    
    if(document.getElementById('total-visits')) document.getElementById('total-visits').textContent = filtered.length;
    updateVisitCharts(filtered);
}

function updateVisitCharts(data) {
    if (document.getElementById('visitStatusChart') && window.Chart) {
        if (chartStatusVis) chartStatusVis.destroy();
        chartStatusVis = new Chart(document.getElementById('visitStatusChart'), {
            type: 'pie',
            data: { 
                labels: ['Pendente', 'Realizada', 'Cancelada'], 
                datasets: [{ 
                    data: [
                        data.filter(function(v){return v.status==='Pendente';}).length, 
                        data.filter(function(v){return v.status==='Realizada';}).length, 
                        data.filter(function(v){return v.status==='Cancelada';}).length
                    ], 
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B'] 
                }] 
            }
        });
    }
}

function deleteVisit(id) { if(confirm('Excluir?')){ visits=visits.filter(x=>x.id!==id); salvarNoArmazenamento('visits',visits); renderVisits(); } }
function closeVisitModal() { document.getElementById('visit-modal').classList.remove('show'); }
function clearVisitFilters() { document.getElementById('filter-visit-municipality').value=''; renderVisits(); }
function exportVisitsCSV(){const d=getFilteredVisits(); const h=['Município','Data','Status']; const r=d.map(v=>[v.municipality,v.date,v.status]); downloadCSV('visitas.csv',h,r);}
function generateVisitsPDF(){const d=getFilteredVisits(); const h=['Município','Data','Status']; const r=d.map(v=>[v.municipality,v.date,v.status]); downloadPDF('Visitas',h,r);}

// =====================================================
// 17. PRODUÇÃO
// =====================================================
function showProductionModal(id = null) {
    editingId = id;
    document.getElementById('production-form').reset();
    updateGlobalDropdowns();
    
    if (id) {
        const p = productions.find(function(x) { return x.id === id; });
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

function getFilteredProductions() {
    const fMun = document.getElementById('filter-production-municipality')?.value;
    return productions.filter(function(p) {
        if (fMun && p.municipality !== fMun) return false;
        return true;
    });
}

function renderProductions() {
    const filtered = getFilteredProductions();
    const c = document.getElementById('productions-table');
    if (filtered.length === 0) { c.innerHTML = '<div class="empty-state">Vazio.</div>'; } 
    else {
        const rows = filtered.map(function(p) {
            return '<tr>' +
                '<td>' + p.municipality + '</td>' +
                '<td>' + (p.professional || '-') + '</td>' +
                '<td>' + p.contact + '</td>' +
                '<td>' + p.frequency + '</td>' +
                '<td>' + p.competence + '</td>' +
                '<td>' + p.period + '</td>' +
                '<td>' + formatDate(p.releaseDate) + '</td>' +
                '<td>' + p.status + '</td>' +
                '<td>' + formatDate(p.sendDate) + '</td>' +
                '<td>' + (p.observations || '-') + '</td>' +
                '<td>' +
                    '<button class="btn btn--sm" onclick="showProductionModal(' + p.id + ')">✏️</button> ' +
                    '<button class="btn btn--sm" onclick="deleteProduction(' + p.id + ')">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        c.innerHTML = '<table><thead><th>Município</th><th>Profissional</th><th>Contato</th><th>Frequência</th><th>Competência</th><th>Período</th><th>Liberação</th><th>Status</th><th>Envio</th><th>Obs</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    }
    updateProductionCharts(filtered);
}

function updateProductionCharts(data) {
    if (document.getElementById('productionStatusChart') && window.Chart) {
        if (chartStatusProd) chartStatusProd.destroy();
        chartStatusProd = new Chart(document.getElementById('productionStatusChart'), {
            type: 'pie',
            data: {
                labels: ['Pendente', 'Enviada', 'Cancelada'],
                datasets: [{
                    data: [
                        data.filter(function(p){return p.status==='Pendente';}).length, 
                        data.filter(function(p){return p.status==='Enviada';}).length, 
                        data.filter(function(p){return p.status==='Cancelada';}).length
                    ],
                    backgroundColor: ['#FFA07A', '#45B7D1', '#FF6B6B']
                }]
            }
        });
    }
}

function deleteProduction(id){ if(confirm('Excluir?')){ productions=productions.filter(x=>x.id!==id); salvarNoArmazenamento('productions',productions); renderProductions(); }}
function closeProductionModal(){document.getElementById('production-modal').classList.remove('show');}
function clearProductionFilters(){document.getElementById('filter-production-municipality').value='';renderProductions();}
function exportProductionsCSV(){const d=getFilteredProductions(); const h=['Município','Status']; const r=d.map(p=>[p.municipality,p.status]); downloadCSV('prod.csv',h,r);}
function generateProductionsPDF(){const d=getFilteredProductions(); const h=['Município','Status']; const r=d.map(p=>[p.municipality,p.status]); downloadPDF('Prod',h,r);}
// =====================================================
// 18. CADASTROS BÁSICOS E CONFIGURAÇÕES
// (Usuários, Cargos, Orientadores, Módulos, Lista Mestra, Formas)
// =====================================================

// --- USUÁRIOS ---
function showUserModal(id = null) {
    const m = document.getElementById('user-modal');
    document.getElementById('user-form').reset();
    editingId = id;
    document.getElementById('user-login').disabled = false;
    
    if (id) {
        const u = users.find(function(x) { return x.id === id; });
        document.getElementById('user-login').value = u.login;
        document.getElementById('user-login').disabled = true; // Não permite mudar login
        document.getElementById('user-name').value = u.name;
        document.getElementById('user-permission').value = u.permission;
        document.getElementById('user-status').value = u.status;
        // Senha não é obrigatória na edição
        document.getElementById('user-password').required = false;
    } else {
        document.getElementById('user-password').required = true;
    }
    m.classList.add('show');
}

function saveUser(e) {
    e.preventDefault();
    const login = document.getElementById('user-login').value.trim().toUpperCase();
    
    // Verifica duplicidade de login
    if (!editingId && users.some(function(u) { return u.login === login; })) {
        alert('Erro: Este login já existe!');
        return;
    }
    
    const data = {
        login: login,
        name: document.getElementById('user-name').value,
        permission: document.getElementById('user-permission').value,
        status: document.getElementById('user-status').value
    };
    
    if (!editingId) {
        data.id = getNextId('user');
        data.salt = generateSalt();
        data.passwordHash = hashPassword(document.getElementById('user-password').value, data.salt);
        data.mustChangePassword = true; // Novo usuário deve trocar senha
        users.push(data);
    } else {
        const i = users.findIndex(function(u) { return u.id === editingId; });
        users[i] = { ...users[i], ...data };
        
        // Se preencheu senha na edição, atualiza
        const newPass = document.getElementById('user-password').value;
        if (newPass) {
            users[i].salt = generateSalt();
            users[i].passwordHash = hashPassword(newPass, users[i].salt);
        }
    }
    
    salvarNoArmazenamento('users', users);
    document.getElementById('user-modal').classList.remove('show');
    renderUsers();
    showToast('Usuário salvo com sucesso!');
}

function renderUsers() {
    const c = document.getElementById('users-table');
    const filter = document.getElementById('filter-user-name') ? document.getElementById('filter-user-name').value.toLowerCase() : '';
    
    const filtered = users.filter(function(u) {
        return u.name.toLowerCase().includes(filter) || u.login.toLowerCase().includes(filter);
    });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>';
        return;
    }
    
    const rows = filtered.map(function(u) {
        return '<tr>' +
            '<td>' + u.login + '</td>' +
            '<td>' + u.name + '</td>' +
            '<td>' + u.permission + '</td>' +
            '<td>' + u.status + '</td>' +
            '<td>' +
                '<button class="btn btn--sm" onclick="showUserModal(' + u.id + ')">✏️</button> ' +
                '<button class="btn btn--sm" onclick="deleteUser(' + u.id + ')">🗑️</button>' +
            '</td>' +
        '</tr>';
    }).join('');
    c.innerHTML = '<table><thead><th>Login</th><th>Nome</th><th>Permissão</th><th>Status</th><th>Ações</th></thead><tbody>' + rows + '</tbody></table>';
    
    // Atualiza Stats de Usuários
    if(document.getElementById('total-users')) document.getElementById('total-users').textContent = users.length;
    if(document.getElementById('active-users')) document.getElementById('active-users').textContent = users.filter(function(u){return u.status==='Ativo'}).length;
    if(document.getElementById('inactive-users')) document.getElementById('inactive-users').textContent = users.filter(function(u){return u.status!=='Ativo'}).length;
}

function deleteUser(id) {
    const u = users.find(function(x) { return x.id === id; });
    if (u.login === 'ADMIN') {
        alert('Erro: Não é permitido excluir o Administrador Principal.');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        users = users.filter(function(x) { return x.id !== id; });
        salvarNoArmazenamento('users', users);
        renderUsers();
    }
}

function closeUserModal() { document.getElementById('user-modal').classList.remove('show'); }
function clearUserFilters() { document.getElementById('filter-user-name').value=''; renderUsers(); }


// --- CARGOS ---
function showCargoModal(id=null){ editingId=id; document.getElementById('cargo-form').reset(); if(id){const c=cargos.find(x=>x.id===id); document.getElementById('cargo-name').value=c.name; if(document.getElementById('cargo-description')) document.getElementById('cargo-description').value=c.description||'';} document.getElementById('cargo-modal').classList.add('show'); }
function saveCargo(e){ e.preventDefault(); const data={name:document.getElementById('cargo-name').value, description:document.getElementById('cargo-description')?document.getElementById('cargo-description').value:''}; if(editingId){const i=cargos.findIndex(x=>x.id===editingId); cargos[i]={...cargos[i],...data};}else{cargos.push({id:getNextId('cargo'),...data});} salvarNoArmazenamento('cargos',cargos); document.getElementById('cargo-modal').classList.remove('show'); renderCargos(); }
function renderCargos(){ const c=document.getElementById('cargos-table'); if(cargos.length===0){c.innerHTML='Vazio.';return;} const r=cargos.map(x=>`<tr><td>${x.name}</td><td>${x.description||'-'}</td><td><button class="btn btn--sm" onclick="showCargoModal(${x.id})">✏️</button> <button class="btn btn--sm" onclick="deleteCargo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Cargo</th><th>Descrição</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; if(document.getElementById('cargos-total')) document.getElementById('cargos-total').textContent = `Total: ${cargos.length}`; }
function deleteCargo(id){ if(confirm('Excluir?')){ cargos=cargos.filter(x=>x.id!==id); salvarNoArmazenamento('cargos',cargos); renderCargos(); }}
function closeCargoModal(){document.getElementById('cargo-modal').classList.remove('show');}

// --- ORIENTADORES ---
function showOrientadorModal(id=null){ editingId=id; document.getElementById('orientador-form').reset(); if(id){const o=orientadores.find(x=>x.id===id); document.getElementById('orientador-name').value=o.name; document.getElementById('orientador-contact').value=o.contact; document.getElementById('orientador-email').value=o.email;} document.getElementById('orientador-modal').classList.add('show'); }
function saveOrientador(e){ e.preventDefault(); const data={name:document.getElementById('orientador-name').value, contact:document.getElementById('orientador-contact').value, email:document.getElementById('orientador-email').value}; if(editingId){const i=orientadores.findIndex(x=>x.id===editingId); orientadores[i]={...orientadores[i],...data};}else{orientadores.push({id:getNextId('orient'),...data});} salvarNoArmazenamento('orientadores',orientadores); document.getElementById('orientador-modal').classList.remove('show'); renderOrientadores(); }
function renderOrientadores(){ const c=document.getElementById('orientadores-table'); if(orientadores.length===0){c.innerHTML='Vazio.';return;} const r=orientadores.map(x=>`<tr><td>${x.name}</td><td>${x.contact}</td><td><button class="btn btn--sm" onclick="showOrientadorModal(${x.id})">✏️</button> <button class="btn btn--sm" onclick="deleteOrientador(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>Contato</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; if(document.getElementById('orientadores-total')) document.getElementById('orientadores-total').textContent = `Total: ${orientadores.length}`; }
function deleteOrientador(id){ if(confirm('Excluir?')){ orientadores=orientadores.filter(x=>x.id!==id); salvarNoArmazenamento('orientadores',orientadores); renderOrientadores(); }}
function closeOrientadorModal(){document.getElementById('orientador-modal').classList.remove('show');}

// --- MÓDULOS ---
function showModuloModal(id=null){ editingId=id; document.getElementById('modulo-form').reset(); const form=document.getElementById('modulo-form'); if(!document.getElementById('modulo-description')){const d=document.createElement('div');d.className='form-group';d.innerHTML=`<label class="form-label">Descrição</label><textarea class="form-control" id="modulo-description"></textarea>`;f.insertBefore(d,f.querySelector('.modal-actions'));} if(id){const m=modulos.find(x=>x.id===id); document.getElementById('modulo-name').value=m.name; document.getElementById('modulo-abbreviation').value=m.abbreviation; document.getElementById('modulo-description').value=m.description||'';} document.getElementById('modulo-modal').classList.add('show'); }
function saveModulo(e){ e.preventDefault(); const data={name:document.getElementById('modulo-name').value, abbreviation:document.getElementById('modulo-abbreviation').value, description:document.getElementById('modulo-description').value, color: '#005580'}; if(editingId){const i=modulos.findIndex(x=>x.id===editingId); modulos[i]={...modulos[i],...data};}else{modulos.push({id:getNextId('mod'),...data});} salvarNoArmazenamento('modulos',modulos); document.getElementById('modulo-modal').classList.remove('show'); renderModulos(); }
function renderModulos(){ const c=document.getElementById('modulos-table'); if(modulos.length===0){c.innerHTML='Vazio.';return;} const r=modulos.map(x=>`<tr><td>${x.name}</td><td>${x.abbreviation}</td><td><button class="btn btn--sm" onclick="showModuloModal(${x.id})">✏️</button> <button class="btn btn--sm" onclick="deleteModulo(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Módulo</th><th>Abrev.</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; if(document.getElementById('modulos-total')) document.getElementById('modulos-total').textContent = `Total: ${modulos.length}`; }
function deleteModulo(id){ if(confirm('Excluir?')){ modulos=modulos.filter(x=>x.id!==id); salvarNoArmazenamento('modulos',modulos); renderModulos(); }}
function closeModuloModal(){document.getElementById('modulo-modal').classList.remove('show');}

// --- LISTA MESTRA MUNICÍPIOS ---
function showMunicipalityListModal(id=null){ editingId=id; document.getElementById('municipality-list-form').reset(); if(id){const m=municipalitiesList.find(x=>x.id===id); document.getElementById('municipality-list-name').value=m.name; document.getElementById('municipality-list-uf').value=m.uf;} document.getElementById('municipality-list-modal').classList.add('show'); }
function saveMunicipalityList(e){ e.preventDefault(); const data={name:document.getElementById('municipality-list-name').value, uf:document.getElementById('municipality-list-uf').value}; if(editingId){const i=municipalitiesList.findIndex(x=>x.id===editingId); municipalitiesList[i]={...municipalitiesList[i],...data};}else{municipalitiesList.push({id:getNextId('munList'),...data});} salvarNoArmazenamento('municipalitiesList',municipalitiesList); document.getElementById('municipality-list-modal').classList.remove('show'); renderMunicipalityList(); updateGlobalDropdowns(); showToast('Salvo!'); }
function renderMunicipalityList(){ const c=document.getElementById('municipalities-list-table'); if(municipalitiesList.length===0){c.innerHTML='Vazio.';return;} const r=municipalitiesList.sort((a,b)=>a.name.localeCompare(b.name)).map(m=>`<tr><td>${m.name}</td><td>${m.uf}</td><td><button class="btn btn--sm" onclick="showMunicipalityListModal(${m.id})">✏️</button> <button class="btn btn--sm" onclick="deleteMunicipalityList(${m.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Nome</th><th>UF</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; if(document.getElementById('municipalities-list-total')) document.getElementById('municipalities-list-total').textContent = `Total: ${municipalitiesList.length}`; }
function deleteMunicipalityList(id){ if(confirm('Excluir?')){ municipalitiesList=municipalitiesList.filter(x=>x.id!==id); salvarNoArmazenamento('municipalitiesList',municipalitiesList); renderMunicipalityList(); updateGlobalDropdowns(); }}
function closeMunicipalityListModal() { document.getElementById('municipality-list-modal').classList.remove('show'); }

// --- FORMAS DE APRESENTAÇÃO ---
function showFormaApresentacaoModal(id=null){ editingId=id; document.getElementById('forma-apresentacao-form').reset(); if(id){const f=formasApresentacao.find(x=>x.id===id); document.getElementById('forma-apresentacao-name').value=f.name;} document.getElementById('forma-apresentacao-modal').classList.add('show'); }
function saveFormaApresentacao(e){ e.preventDefault(); const data={name:document.getElementById('forma-apresentacao-name').value}; if(editingId){const i=formasApresentacao.findIndex(x=>x.id===editingId); formasApresentacao[i]={...formasApresentacao[i],...data};}else{formasApresentacao.push({id:getNextId('forma'),...data});} salvarNoArmazenamento('formasApresentacao',formasApresentacao); document.getElementById('forma-apresentacao-modal').classList.remove('show'); renderFormas(); }
function renderFormas(){ const c=document.getElementById('formas-apresentacao-table'); if(formasApresentacao.length===0){c.innerHTML='Vazio.';return;} const r=formasApresentacao.map(x=>`<tr><td>${x.name}</td><td><button class="btn btn--sm" onclick="showFormaApresentacaoModal(${x.id})">✏️</button> <button class="btn btn--sm" onclick="deleteForma(${x.id})">🗑️</button></td></tr>`).join(''); c.innerHTML=`<table><thead><th>Forma</th><th>Ações</th></thead><tbody>${r}</tbody></table>`; if(document.getElementById('formas-apresentacao-total')) document.getElementById('formas-apresentacao-total').textContent = `Total: ${formasApresentacao.length}`; }
function deleteForma(id){ if(confirm('Excluir?')){ formasApresentacao=formasApresentacao.filter(x=>x.id!==id); salvarNoArmazenamento('formasApresentacao',formasApresentacao); renderFormas(); }}
function closeFormaApresentacaoModal() { document.getElementById('forma-apresentacao-modal').classList.remove('show'); }

// =====================================================
// 20. BACKUP E RESTAURAÇÃO (COM PREVIEW COMPLETO)
// =====================================================
function updateBackupInfo() {
    if(document.getElementById('backup-info-municipalities')) document.getElementById('backup-info-municipalities').textContent = municipalities.length;
    if(document.getElementById('backup-info-trainings')) document.getElementById('backup-info-trainings').textContent = tasks.length;
    
    // Atualiza contadores detalhados se existirem no HTML
    if(document.getElementById('backup-info-cargos')) document.getElementById('backup-info-cargos').textContent = cargos.length;
    if(document.getElementById('backup-info-orientadores')) document.getElementById('backup-info-orientadores').textContent = orientadores.length;
    if(document.getElementById('backup-info-modules')) document.getElementById('backup-info-modules').textContent = modulos.length;
    if(document.getElementById('backup-info-users')) document.getElementById('backup-info-users').textContent = users.length;
    if(document.getElementById('backup-info-requests')) document.getElementById('backup-info-requests').textContent = requests.length;
    if(document.getElementById('backup-info-presentations')) document.getElementById('backup-info-presentations').textContent = presentations.length;
    if(document.getElementById('backup-info-formas')) document.getElementById('backup-info-formas').textContent = formasApresentacao.length;
    if(document.getElementById('backup-info-demands')) document.getElementById('backup-info-demands').textContent = demands.length;
}

function createBackup() {
    const backupData = { 
        version: "v31.0", 
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
            cargos: cargos, 
            orientadores: orientadores, 
            modulos: modulos, 
            formasApresentacao: formasApresentacao, 
            counters: counters 
        } 
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "backup_sigp_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(dl); 
    dl.click(); 
    dl.remove();
    showToast('Backup baixado com sucesso!', 'success');
}

function triggerRestoreBackup() { 
    const input = document.getElementById('backup-file-input');
    if(input) input.click(); 
}

function handleBackupFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if (!backup.data) {
                alert('Arquivo inválido ou corrompido.');
                return;
            }
            
            pendingBackupData = backup;
            
            const list = document.getElementById('restore-preview-list');
            if(list) {
                list.innerHTML = '';
                const d = backup.data;
                
                // Lista COMPLETA para preview
                const items = [
                    {l:'Treinamentos', c: d.tasks ? d.tasks.length : (d.trainings ? d.trainings.length : 0)},
                    {l:'Municípios Clientes', c: d.municipalities.length},
                    {l:'Lista Mestra', c: d.municipalitiesList ? d.municipalitiesList.length : 0},
                    {l:'Solicitações', c: d.requests ? d.requests.length : 0},
                    {l:'Apresentações', c: d.presentations ? d.presentations.length : 0},
                    {l:'Demandas', c: d.demands ? d.demands.length : 0},
                    {l:'Visitas', c: d.visits ? d.visits.length : 0},
                    {l:'Produção', c: d.productions ? d.productions.length : 0},
                    {l:'Cargos', c: d.cargos.length},
                    {l:'Orientadores', c: d.orientadores.length},
                    {l:'Módulos', c: d.modules.length},
                    {l:'Formas Apres.', c: d.formasApresentacao ? d.formasApresentacao.length : 0},
                    {l:'Usuários', c: d.users.length}
                ];
                
                items.forEach(i => {
                    list.innerHTML += `<li><strong>${i.l}:</strong> ${i.c}</li>`;
                });
            }
            
            document.getElementById('restore-confirm-modal').classList.add('show');
            
        } catch (err) { 
            alert('Erro ao ler arquivo. Verifique se é um JSON válido.'); 
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function confirmRestore() {
    if(!pendingBackupData) return;
    const d = pendingBackupData.data;
    
    localStorage.clear();
    
    // Restaura item por item com segurança
    localStorage.setItem('users', JSON.stringify(d.users));
    localStorage.setItem('municipalities', JSON.stringify(d.municipalities));
    localStorage.setItem('municipalitiesList', JSON.stringify(d.municipalitiesList));
    localStorage.setItem('tasks', JSON.stringify(d.tasks || d.trainings));
    localStorage.setItem('requests', JSON.stringify(d.requests));
    localStorage.setItem('demands', JSON.stringify(d.demands));
    localStorage.setItem('visits', JSON.stringify(d.visits));
    localStorage.setItem('productions', JSON.stringify(d.productions));
    localStorage.setItem('presentations', JSON.stringify(d.presentations));
    localStorage.setItem('cargos', JSON.stringify(d.cargos));
    localStorage.setItem('orientadores', JSON.stringify(d.orientadores));
    localStorage.setItem('modulos', JSON.stringify(d.modules || d.modulos));
    localStorage.setItem('formasApresentacao', JSON.stringify(d.formasApresentacao));
    
    if (d.counters) {
        localStorage.setItem('counters', JSON.stringify(d.counters));
    }
    
    // Logout forçado
    deletarDoArmazenamento('currentUser');
    deletarDoArmazenamento('isAuthenticated');
    
    alert('Restauração concluída com sucesso! Por favor, faça login novamente.');
    location.reload();
}

function closeRestoreConfirmModal() { 
    document.getElementById('restore-confirm-modal').classList.remove('show'); 
    pendingBackupData = null;
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se quiser
    document.getElementById('backup-file-input').value = '';
}

// =====================================================
// 21. DASHBOARD E INICIALIZAÇÃO
// =====================================================
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

function populateSelect(selectId, data, valKey, textKey) {
    const select = document.getElementById(selectId);
    if(!select) return;
    
    const current = select.value;
    let html = '<option value="">Selecione...</option>';
    
    data.sort(function(a,b){ return a[textKey].localeCompare(b[textKey]); }).forEach(function(i) { 
        html += '<option value="' + i[valKey] + '">' + i[textKey] + '</option>'; 
    });
    
    select.innerHTML = html;
    select.value = current;
}

function populateFilterSelects() {
    const muns = municipalities.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
    const filterIds = ['filter-municipality-name','filter-task-municipality','filter-request-municipality','filter-visit-municipality','filter-production-municipality','filter-presentation-municipality'];
    
    filterIds.forEach(function(id) { 
        const el = document.getElementById(id); 
        if(el) { 
            let html = '<option value="">Todos</option>'; 
            muns.forEach(function(m) { 
                html += '<option value="' + m.name + '">' + m.name + '</option>'; 
            }); 
            el.innerHTML = html; 
        } 
    });
    
    // Orientadores e Cargos
    const oriSelect = document.getElementById('filter-task-performer');
    if(oriSelect && oriSelect.tagName === 'SELECT') { // Se for select no HTML
         // Se não, nada a fazer (é input text)
    }
    
    const presOriSelect = document.getElementById('filter-presentation-orientador');
    if(presOriSelect) {
        let html = '<option value="">Todos</option>';
        orientadores.forEach(function(o) { html += '<option value="' + o.name + '">' + o.name + '</option>'; });
        presOriSelect.innerHTML = html;
    }
}

function updateGlobalDropdowns() {
    const activeMuns = municipalities.filter(function(m) { return m.status === 'Em uso'; });
    
    ['task-municipality','request-municipality','visit-municipality','production-municipality','presentation-municipality'].forEach(function(id) { 
        populateSelect(id, activeMuns, 'name', 'name'); 
    });
    
    // Atualiza selects de formulários específicos
    if(document.getElementById('task-performed-by')) populateSelect('task-performed-by', orientadores, 'name', 'name');
    if(document.getElementById('task-trained-position')) populateSelect('task-trained-position', cargos, 'name', 'name');

    populateFilterSelects();
}

// Helper para campos dinâmicos (Se o HTML não tiver)
function setupDynamicFormFields() {
    // Mantido vazio pois o HTML já possui os campos, evitando duplicação
}

function initializeApp() {
    updateUserInterface();
    initializeTheme();
    initializeTabs();
    applyMasks();
    setupDynamicFormFields();
    updateGlobalDropdowns();
    
    // Renderiza todas as tabelas
    renderMunicipalities();
    renderTasks();
    renderRequests();
    renderDemands();
    renderVisits();
    renderProductions();
    renderPresentations();
    
    // Configs
    renderUsers();
    renderCargos();
    renderOrientadores();
    renderModulos();
    renderMunicipalitiesList();
    renderFormasApresentacao();
    
    updateDashboardStats();
    initializeDashboardCharts();
    
    // Listener global para fechar menu mobile
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.onclick = toggleMobileMenu;
    }
    
    // Se nenhuma aba ativa, vai para home
    if(!document.querySelector('.sidebar-btn.active')) {
        navigateToHome();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    // Fechar modais ao clicar fora
    window.onclick = function(e) { 
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    };
    
    // Botoes fechar modal
    document.querySelectorAll('.close-btn').forEach(function(b) { 
        b.onclick = function(){ 
            this.closest('.modal').classList.remove('show'); 
        }; 
    });
    
    // Botoes cancelar modal
    document.querySelectorAll('.btn--secondary').forEach(function(b) { 
        if (b.textContent.includes('Cancelar')) {
            b.onclick = function(){ 
                this.closest('.modal').classList.remove('show'); 
            }; 
        }
    });
});
