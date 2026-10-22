import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

export function verificarAutenticacao() {
  onAuthStateChanged(auth, async (user) => {
    const pathAtual = window.location.pathname;
    const isLoginPage = pathAtual.endsWith("login.html") || 
                        pathAtual.endsWith("index.html") || 
                        pathAtual === "/" ||
                        pathAtual.endsWith("/sala-de-reuniao/"); // Ajuste para a raiz do GitHub Pages

    if (user) {
      const emailUsuario = user.email.toLowerCase();
      const nomeBase = emailUsuario.split('@')[0];
      
      const userNameDisplay = document.getElementById("userNameDisplay");
      const userAvatarMobile = document.getElementById("userAvatarMobile");
      
      if (userNameDisplay) userNameDisplay.innerText = nomeBase;
      if (userAvatarMobile) userAvatarMobile.innerText = "Olá, " + nomeBase;

      // 1. Consulta o Firestore para verificar se é Administrador
      let ehAdmin = false;
      try {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const dadosUser = userDoc.data();
          if (dadosUser.cargo === "Administrador") {
            ehAdmin = true;
          }
        }
      } catch (e) {
        console.error("Erro ao verificar cargo no Firestore:", e);
      }

      // 2. Fallback de segurança por e-mail (garante acesso imediato a contas admin/teste)
      if (!ehAdmin && (emailUsuario.includes("admin") || emailUsuario.includes("teste"))) {
        ehAdmin = true;
      }

      // Gestão de exibição do menu de administração
      let adminMenu = document.getElementById("adminMenu");
      
      if (ehAdmin) {
        if (adminMenu) {
          adminMenu.style.display = "block";
        } else {
          const navLinks = document.querySelector(".nav-links");
          if (navLinks && !document.getElementById("adminMenu")) {
            const novoLink = document.createElement("a");
            novoLink.href = pathAtual.includes("/pages/") ? "admin-users.html" : "pages/admin-users.html";
            novoLink.id = "adminMenu";
            novoLink.innerText = "Usuários (Admin)";
            if (pathAtual.includes("admin-users.html")) {
              novoLink.className = "active";
            }
            navLinks.appendChild(novoLink);
          }
        }
      } else {
        if (adminMenu) adminMenu.style.display = "none";
        
        if (pathAtual.includes("admin-users.html")) {
          alert("Acesso negado. Apenas administradores podem aceder a esta página.");
          window.location.href = pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html";
        }
      }

      if (isLoginPage) {
        window.location.href = pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html";
      }

    } else {
      if (!isLoginPage) {
        // Redireciona para o index correto dependendo de onde o utilizador está
        window.location.href = pathAtual.includes("/pages/") ? "../index.html" : "index.html"; 
      }
    }
  });
}

window.fazerLogoutReal = function() {
  signOut(auth).then(() => {
    const pathAtual = window.location.pathname;
    window.location.href = pathAtual.includes("/pages/") ? "../index.html" : "index.html";
  }).catch((error) => {
    console.error("Erro ao fazer logout", error);
  });
}
