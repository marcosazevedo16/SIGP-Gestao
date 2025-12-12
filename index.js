// ============================================================
// ARQUIVO PRINCIPAL (index.js)
// ============================================================
import { auth, db, appLogger, checkAuthentication, handleLogout } from './auth.js';

// Importa o script principal (para carregar tabelas, gráficos, etc.)
import './script.js'; 

// --- EXPONDO FUNÇÕES GLOBAIS PARA O HTML ---
// O HTML usa onclick="handleLogout()", então precisamos pendurar isso na janela
window.handleLogout = handleLogout;

document.addEventListener('DOMContentLoaded', () => {
    appLogger.log('🚀 Sistema iniciando via Módulos...');
    
    // 1. Verifica se já tem usuário logado
    checkAuthentication();

    // 2. Configura o Formulário de Login
    setupLoginForm();
});

// --- LÓGICA DE LOGIN ---
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        // Remove listeners antigos
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userInput = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const btnSubmit = newForm.querySelector('button[type="submit"]');
            const errorDiv = document.getElementById('login-error');
            const originalText = btnSubmit.innerText;

            // Reset visual
            if (errorDiv) { errorDiv.style.display = 'none'; errorDiv.innerText = ''; }
            btnSubmit.innerText = "Autenticando...";
            btnSubmit.disabled = true;

            try {
                let emailFinal = userInput;
                let nomeParaLog = userInput.toUpperCase(); // Padrão caso não ache o nome

                // 1. LÓGICA DE BUSCA DE CREDENCIAIS
                if (!userInput.includes('@')) {
                    // LOGIN (Sem @)
                    if (userInput.toUpperCase() === 'ADMIN') {
                        emailFinal = 'admin@sigpsaude.com';
                        nomeParaLog = 'Administrador';
                    } else {
                        const snapshot = await db.collection('users')
                            .where('login', '==', userInput.toUpperCase())
                            .limit(1)
                            .get();

                        if (snapshot.empty) throw { code: 'auth/user-not-found' };
                        
                        const dados = snapshot.docs[0].data();
                        emailFinal = dados.email;
                        nomeParaLog = dados.name; // <--- PEGA O NOME AQUI
                    }
                } else {
                    // E-MAIL (Com @)
                    // Busca o nome associado a este e-mail para o log ficar bonito
                    const snapshot = await db.collection('users')
                        .where('email', '==', userInput)
                        .limit(1)
                        .get();
                    
                    if (!snapshot.empty) {
                        nomeParaLog = snapshot.docs[0].data().name; // <--- PEGA O NOME AQUI
                    }
                }

                // 2. Autentica no Firebase
                await auth.signInWithEmailAndPassword(emailFinal, password);
                appLogger.log(`Login sucesso: ${emailFinal}`);

                // 3. REGISTRA O LOG DE AUDITORIA (AGORA COM O NOME CORRETO)
                db.collection('auditLogs').add({
                    timestamp: new Date().toISOString(),
                    user: nomeParaLog, // <--- CAMPO CORRIGIDO (Antes era userInput)
                    action: 'Login',
                    target: 'Sistema',
                    details: `Login realizado com sucesso. E-mail: ${emailFinal}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.error("Erro ao salvar log de login:", err));
                
                // O checkAuthentication() no auth.js fará o redirecionamento

            } catch (error) {
                appLogger.error("Erro no login:", error);
                
                let msg = "Falha ao entrar.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') msg = "Usuário não encontrado.";
                else if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
                else if (error.code === 'auth/too-many-requests') msg = "Muitas tentativas. Tente mais tarde.";
                
                if (errorDiv) {
                    errorDiv.innerText = msg;
                    errorDiv.style.display = 'block';
                } else {
                    alert(msg);
                }
                btnSubmit.innerText = originalText;
                btnSubmit.disabled = false;
            }
        });
    }
}
