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

      // Consulta direta ao Firestore para verificar se o utilizador é Administrador na base de dados
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

      // Fallback de segurança temporário caso o documento ainda não tenha sido sincronizado
      if (!ehAdmin && (emailUsuario.includes("admin") || emailUsuario.includes("teste"))) {
        ehAdmin = true;
      }

      // Gestão de exibição do menu de administração
      let adminMenu = document.getElementById("adminMenu");
      
      if (ehAdmin) {
        if (adminMenu) {
          adminMenu.style.display = "block";
        } else {
          // Cria o link dinamicamente se não estiver presente na página
          const navLinks = document.querySelector(".nav-links");
          if (navLinks) {
            const novoLink = document.createElement("a");
            novoLink.href = "admin-users.html";
            novoLink.id = "adminMenu";
            novoLink.innerText = "Usuários (Admin)";
            if (window.location.pathname.includes("admin-users.html")) {
              novoLink.className = "active";
            }
            navLinks.appendChild(novoLink);
          }
        }
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
