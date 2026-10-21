import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Função de Login Real ligada globalmente ao botão
window.fazerLoginReal = function() {
    const email = document.getElementById("emailLogin").value;
    const senha = document.getElementById("senhaLogin").value;

    if (!email || !senha) {
        alert("Por favor, preencha o e-mail e a senha.");
        return;
    }

    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            window.location.href = "calendar.html";
        })
        .catch((error) => {
            alert("Erro ao entrar: " + error.message);
        });
};

// Função de Logout Real ligada globalmente
window.fazerLogoutReal = function() {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Erro ao sair:", error);
    });
};

// Verifica o estado da sessão e protege as rotas
export function verificarAutenticacao() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const nomeDisplay = document.getElementById("userNameDisplay");
            if (nomeDisplay) {
                nomeDisplay.innerText = user.email.split('@')[0];
            }

            // Libera o menu de administração se for o e-mail de teste/admin
            if (user.email.includes("admin") || user.email.includes("teste")) {
                const adminMenu = document.getElementById("adminMenu");
                if (adminMenu) adminMenu.style.display = "block";
            }
        } else {
            if (!window.location.pathname.includes("login.html")) {
                window.location.href = "login.html";
            }
        }
    });
}
