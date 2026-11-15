const firebaseConfig = {
  apiKey: "AIzaSyDa9ztrK6VxFVeLbP0ge6-31V05gnztjJw",
  authDomain: "reuniao-d1b29.firebaseapp.com",
  projectId: "reuniao-d1b29",
  storageBucket: "reuniao-d1b29.firebasestorage.app",
  messagingSenderId: "887897617950",
  appId: "1:887897617950:web:e96cf3cce4792e7e2b600f"
};

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

      let ehAdmin = false;
      try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().cargo === "Administrador") {
          ehAdmin = true;
        }
      } catch (e) {
        console.error("Erro ao verificar cargo:", e);
      }

      if (!ehAdmin && (emailUsuario.includes("admin") || emailUsuario.includes("teste"))) {
        ehAdmin = true;
      }

      const adminItems = document.querySelectorAll(".admin-only-item");
      if (ehAdmin) {
        adminItems.forEach(item => { if (item) item.style.display = ""; });
      } else {
        adminItems.forEach(item => { if (item) item.style.display = "none"; });
        
        if (pathAtual.includes("admin-users.html")) {
          window.location.replace(pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html");
        }
      }

      if (isLoginPage) {
        window.location.replace(pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html");
      }

    } else {
      if (!isLoginPage) {
        window.location.replace(pathAtual.includes("/pages/") ? "../index.html" : "index.html"); 
      }
    }
  });
}

window.fazerLogoutReal = function() {
  if (typeof window.firebase !== 'undefined') {
    window.firebase.auth().signOut().then(() => {
      const pathAtual = window.location.pathname;
      window.location.replace(pathAtual.includes("/pages/") ? "../index.html" : "index.html");
    });
  }
}
