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
        // Remove listeners antigos para evitar duplicidade (boa prática)
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

                // Se digitou apenas LOGIN (sem @), buscamos o e-mail no banco
                if (!userInput.includes('@')) {
                    if (userInput.toUpperCase() === 'ADMIN') {
                        emailFinal = 'admin@sigpsaude.com'; // E-mail fixo do admin
                    } else {
                        const snapshot = await db.collection('users')
                            .where('login', '==', userInput.toUpperCase())
                            .limit(1)
                            .get();

                        if (snapshot.empty) throw { code: 'auth/user-not-found' };
                        emailFinal = snapshot.docs[0].data().email;
                    }
                }

                // Autentica no Firebase
                await auth.signInWithEmailAndPassword(emailFinal, password);
                appLogger.log(`Login sucesso: ${emailFinal}`);
                
                // O checkAuthentication() no auth.js vai perceber a mudança
                // e redirecionar para a tela principal automaticamente.

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