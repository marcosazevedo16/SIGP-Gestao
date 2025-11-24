// script.js - SIGP Saúde v20
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userNameDisplay = document.getElementById('userNameDisplay');

const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// === LOGIN ===
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('login-username').value.trim().toUpperCase();
  const pass = document.getElementById('login-password').value;

  if (user === 'ADMIN' && pass === '123') {
    userNameDisplay.textContent = user;
    loginScreen.classList.remove('active');
    mainApp.classList.add('active');
    loginError.textContent = '';
  } else {
    loginError.textContent = 'Usuário ou senha incorretos';
  }
});

// === MENU MOBILE ===
mobileMenuToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('mobile-open');
  sidebarOverlay.classList.toggle('active');
});
sidebarOverlay?.addEventListener('click', () => {
  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('active');
});

// === NAVEGAÇÃO SIDEBAR ===
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    const section = document.getElementById(btn.dataset.section);
    if (section) section.classList.add('active');

    // Fecha menu mobile
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
  });
});

// === TEMA ===
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

// === SAIR ===
document.getElementById('logout-btn')?.addEventListener('click', () => {
  mainApp.classList.remove('active');
  loginScreen.classList.add('active');
  document.getElementById('login-password').value = '';
});

// backup.js
document.getElementById('createBackup')?.addEventListener('click', () => {
  const data = {
    version: "SIGP_SAUDE_v20",
    timestamp: new Date().toISOString(),
    municipios: [], // aqui você coloca seus dados reais
    coresModulos: {
      "SAÚDE": "#1e88e5",
      "VIGILÂNCIA": "#43a047",
      // ... outros módulos
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_sigp_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showMessage('Backup criado com sucesso!', 'success');
});

document.getElementById('restoreBackup')?.addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput')?.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      // aqui você restaura os dados + cores dos módulos
      showMessage('Backup restaurado com sucesso!', 'success');
    } catch (err) {
      showMessage('Arquivo inválido', 'error');
    }
  };
  reader.readAsText(file);
});

function showMessage(text, type) {
  const msg = document.getElementById('backupMessage');
  msg.textContent = text;
  msg.className = `backup-message show ${type}`;
  setTimeout(() => msg.className = 'backup-message', 3000);
}

