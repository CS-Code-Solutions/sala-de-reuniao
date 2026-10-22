const firebaseConfig = {
  apiKey: "AIzaSyDa9ztrK6VxFVeLbP0ge6-31V05gnztjJw",
  authDomain: "reuniao-d1b29.firebaseapp.com",
  projectId: "reuniao-d1b29",
  storageBucket: "reuniao-d1b29.firebasestorage.app",
  messagingSenderId: "887897617950",
  appId: "1:887897617950:web:e96cf3cce4792e7e2b600f"
};

// 1. Função principal exportada para o HTML
export function verificarAutenticacao() {
  if (typeof firebase === 'undefined') {
    // Injeta os scripts de forma sequencial se a página não os tiver
    carregarScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js", () => {
      carregarScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js", () => {
        carregarScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js", () => {
          iniciarAuth();
        });
      });
    });
  } else {
    // Se a página já tiver o Firebase (como a admin-users.html), arranca direto
    iniciarAuth();
  }
}

// 2. Auxiliar para injetar os scripts
function carregarScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

// 3. Lógica principal de validação de cargo e perfil
function iniciarAuth() {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const auth = firebase.auth();
  const db = firebase.firestore();

  auth.onAuthStateChanged(async (user) => {
    const pathAtual = window.location.pathname;
    const isLoginPage = pathAtual.endsWith("login.html") || 
                        pathAtual.endsWith("index.html") || 
                        pathAtual === "/" ||
                        pathAtual.endsWith("/sala-de-reuniao/");

    if (user) {
      const emailUsuario = user.email.toLowerCase();
      const nomeBase = emailUsuario.split('@')[0];
      
      const userNameDisplay = document.getElementById("userNameDisplay");
      const userAvatarMobile = document.getElementById("userAvatarMobile");
      
      if (userNameDisplay) userNameDisplay.innerText = nomeBase;
      if (userAvatarMobile) userAvatarMobile.innerText = "Olá, " + nomeBase;

      // Validação de cargo na nuvem
      let ehAdmin = false;
      try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().cargo === "Administrador") {
          ehAdmin = true;
        }
      } catch (e) {
        console.error("Erro ao verificar cargo:", e);
      }

      // Regra de segurança (Fallback)
      if (!ehAdmin && (emailUsuario.includes("admin") || emailUsuario.includes("teste"))) {
        ehAdmin = true;
      }

      // Controlo de permissões na Interface
      const adminItems = document.querySelectorAll(".admin-only-item");
      if (ehAdmin) {
        adminItems.forEach(item => {
          if (item) item.style.display = ""; 
        });
      } else {
        adminItems.forEach(item => {
          if (item) item.style.display = "none";
        });
        
        if (pathAtual.includes("admin-users.html")) {
          alert("Acesso negado. Apenas administradores podem aceder.");
          window.location.href = pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html";
        }
      }

      if (isLoginPage) {
        window.location.href = pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html";
      }

    } else {
      if (!isLoginPage) {
        window.location.href = pathAtual.includes("/pages/") ? "../index.html" : "index.html"; 
      }
    }
  });
}

// 4. Controlo de Logout global
window.fazerLogoutReal = function() {
  if (typeof firebase !== 'undefined') {
    firebase.auth().signOut().then(() => {
      const pathAtual = window.location.pathname;
      window.location.href = pathAtual.includes("/pages/") ? "../index.html" : "index.html";
    });
  }
}
