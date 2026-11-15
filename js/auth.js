const firebaseConfig = {
  apiKey: "AIzaSyDa9ztrK6VxFVeLbP0ge6-31V05gnztjJw",
  authDomain: "reuniao-d1b29.firebaseapp.com",
  projectId: "reuniao-d1b29",
  storageBucket: "reuniao-d1b29.firebasestorage.app",
  messagingSenderId: "887897617950",
  appId: "1:887897617950:web:e96cf3cce4792e7e2b600f"
};

const UI_CACHE_KEY = "mr_perfil_ui";

function salvarCacheUI(dados) {
  try {
    localStorage.setItem(UI_CACHE_KEY, JSON.stringify(dados));
  } catch (e) {}
}

function limparCacheUI() {
  try {
    localStorage.removeItem(UI_CACHE_KEY);
  } catch (e) {}
}

export function verificarAutenticacao() {
  if (typeof window.firebase === 'undefined') {
    let s1 = document.createElement("script");
    s1.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
    document.head.appendChild(s1);
    s1.onload = () => {
      let s2 = document.createElement("script");
      s2.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js";
      document.head.appendChild(s2);
      s2.onload = () => {
        let s3 = document.createElement("script");
        s3.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js";
        document.head.appendChild(s3);
        s3.onload = () => iniciarAuth();
      };
    };
  } else {
    iniciarAuth();
  }
}

function iniciarAuth() {
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }

  const auth = window.firebase.auth();
  const db = window.firebase.firestore();

  auth.onAuthStateChanged(async (user) => {
    const pathAtual = window.location.pathname;
    const isLoginPage =
      pathAtual.endsWith("login.html") ||
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

      let ehAdmin = false;
      let modulosNegados = [];
      let logoBase64 = null;

      try {
        const cacheAtual = JSON.parse(localStorage.getItem(UI_CACHE_KEY) || "null");
        if (cacheAtual && cacheAtual.uid === user.uid) {
          ehAdmin = Boolean(cacheAtual.ehAdmin);
          modulosNegados = Array.isArray(cacheAtual.modulosNegados) ? cacheAtual.modulosNegados : [];
          logoBase64 = cacheAtual.logoBase64 || null;
        }
      } catch (e) {}

      try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();
        if (userDoc.exists) {
          const dados = userDoc.data();
          ehAdmin = dados.cargo === "Administrador";
          if (Array.isArray(dados.modulosNegados)) modulosNegados = dados.modulosNegados;
          if (dados.logoBase64) logoBase64 = dados.logoBase64;
        }
      } catch (e) {
        console.error("Erro ao verificar cargo:", e);
      }

      if (!ehAdmin && emailUsuario.includes("admin")) {
        ehAdmin = true;
      }

      if (ehAdmin) {
        modulosNegados = [];
      }

      salvarCacheUI({
        uid: user.uid,
        nome: nomeBase,
        ehAdmin,
        modulosNegados,
        logoBase64
      });

      const adminItems = document.querySelectorAll(".admin-only-item");
      adminItems.forEach(item => {
        if (item) item.style.display = ehAdmin ? "" : "none";
      });

      if (!ehAdmin && pathAtual.includes("admin-users.html")) {
        window.location.replace(pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html");
        return;
      }

      if (isLoginPage) {
        window.location.replace(pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html");
        return;
      }

      window.AntiFlicker?.reveal({ ehAdmin });

    } else {
      limparCacheUI();

      if (!isLoginPage) {
        window.location.replace(pathAtual.includes("/pages/") ? "../index.html" : "index.html");
      } else {
        window.AntiFlicker?.reveal();
      }
    }
  });
}

window.fazerLogoutReal = function () {
  limparCacheUI();
  if (typeof window.firebase !== 'undefined') {
    window.firebase.auth().signOut().then(() => {
      const pathAtual = window.location.pathname;
      window.location.replace(pathAtual.includes("/pages/") ? "../index.html" : "index.html");
    });
  }
};
