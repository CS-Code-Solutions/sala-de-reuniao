import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDa9ztrK6VxFVeLbP0ge6-31V05gnztjJw",
  authDomain: "reuniao-d1b29.firebaseapp.com",
  projectId: "reuniao-d1b29",
  storageBucket: "reuniao-d1b29.firebasestorage.app",
  messagingSenderId: "887897617950",
  appId: "1:887897617950:web:e96cf3cce4792e7e2b600f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function verificarAutenticacao() {
  onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.endsWith("login.html") || 
                        window.location.pathname.endsWith("index.html") || 
                        window.location.pathname === "/";

    if (user) {
      const emailUsuario = user.email.toLowerCase();
      
      const nomeBase = emailUsuario.split('@')[0];
      const userNameDisplay = document.getElementById("userNameDisplay");
      const userAvatarMobile = document.getElementById("userAvatarMobile");
      
      if (userNameDisplay) userNameDisplay.innerText = nomeBase;
      if (userAvatarMobile) userAvatarMobile.innerText = "Olá, " + nomeBase;

      // --------------------------------------------------------
      // VERIFICAÇÃO DE ADMINISTRADOR FLEXÍVEL
      // --------------------------------------------------------
      // Pode adicionar aqui o seu e-mail exato ou manter a regra do "admin" / "teste"
      const ehAdmin = emailUsuario.includes("admin") || 
                      emailUsuario.includes("teste") || 
                      emailUsuario === "seu-email-aqui@empresa.com";
      
      const adminMenu = document.getElementById("adminMenu");
      
      if (ehAdmin) {
        if (adminMenu) adminMenu.style.display = "block";
      } else {
        if (adminMenu) adminMenu.style.display = "none";
        
        if (window.location.pathname.includes("admin-users.html")) {
          alert("Acesso negado. Apenas administradores podem aceder a esta página.");
          window.location.href = "calendar.html";
        }
      }

      if (isLoginPage) {
        window.location.href = "pages/calendar.html";
      }

    } else {
      if (!isLoginPage) {
        window.location.href = "../index.html"; 
      }
    }
  });
}

window.fazerLogoutReal = function() {
  signOut(auth).then(() => {
    window.location.href = "../index.html";
  }).catch((error) => {
    console.error("Erro ao fazer logout", error);
  });
}
