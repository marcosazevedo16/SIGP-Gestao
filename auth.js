// ============================================================
// MÓDULO DE AUTENTICAÇÃO (auth.js)
// ============================================================
// 1. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyATTTu0WtcWC0p8irfTkbco-CfzPzZXqxs",
    authDomain: "sigpgestao.firebaseapp.com",
    projectId: "sigpgestao",
    storageBucket: "sigpgestao.firebasestorage.app",
    messagingSenderId: "225860756360",
    appId: "1:225860756360:web:04a21a8ead9ae03fa5503d",
    measurementId: "G-JWFFYZP83Z"
};
// Inicializa o Firebase (usando a global 'firebase' do HTML)
firebase.initializeApp(firebaseConfig);

// EXPORTAÇÕES (Para que outros arquivos possam usar)
export const db = firebase.firestore();
export const auth = firebase.auth();
export let isAuthenticated = false; 
export let currentUser = null; 

// ============================================================
// 2. LOGGER CENTRALIZADO
// ============================================================
const IS_DEVELOPMENT = true; 

export const appLogger = {
    log: function(message) {
        if (IS_DEVELOPMENT) console.log(`[SIGP DEV]: ${message}`);
    },
    error: function(message) {
        console.error(`[SIGP ERROR]: ${message}`);
    }
};
// ============================================================
// 3. FUNÇÕES DE LOGIN E SESSÃO
// ============================================================
export function checkAuthentication() {
    auth.onIdTokenChanged(user => {
        appLogger.log('🔍 Autenticação: Verificando token...');
        
        if (user) {
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        currentUser = { ...userData, id: user.uid };
                        
                        if (userData.status === 'Inativo') {
                            alert('Usuário inativo.');
                            return auth.signOut();
                        }
                        
                        isAuthenticated = true;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        showAppScreen();
                    }
                });
        } else {
            showLoginScreen();
        }
    });
}
// Funções visuais (Exportadas para uso interno ou externo)
export function showAppScreen() {
    if (isAuthenticated) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        document.body.classList.remove('loading'); // Remove o flash branco
        
        // Tenta iniciar o resto do sistema (se a função existir no global)
        if (window.initializeApp) window.initializeApp();
    }
}
export function showLoginScreen() {
    // 1. Limpezas padrão (mantendo o que já existia)
    currentUser = null;
    isAuthenticated = false;
    
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.classList.add('active');
    if (mainApp) mainApp.classList.remove('active');
    document.body.classList.remove('loading');

    // --- 2. NOVO: DETECTOR DE LOGOUT POR INATIVIDADE ---
    // Verifica se a "tatuagem" está na aba
    try {
        if (window.name === "LOGOUT_POR_INATIVIDADE") {
            // a. Limpa a marca para não avisar de novo num F5 futuro
            window.name = "";
            
            // b. Exibe o alerta (com pequeno delay para garantir que a tela apareceu)
            setTimeout(function() {
                alert("⚠️ SESSÃO EXPIRADA\n\nVocê ficou inativo por muito tempo e foi desconectado por segurança.\n\nPor favor, faça login novamente.");
            }, 500); 
        }
    } catch (e) {
        console.error("Erro ao verificar aviso de inatividade:", e);
    }
}

export function handleLogout() {
    auth.signOut().then(() => location.reload());
}

// Inicialização do Módulo
appLogger.log("🔥 Módulo Auth carregado com sucesso!");

