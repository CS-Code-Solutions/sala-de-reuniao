export function verificarAutenticacao() {
  // Verifica se o Firebase foi carregado corretamente pela página HTML
  if (typeof firebase === 'undefined') {
    console.error("Firebase não carregado.");
    return;
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

      // Verifica o cargo no Firestore de forma segura
      let ehAdmin = false;
      try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().cargo === "Administrador") {
          ehAdmin = true;
        }
      } catch (e) {
        console.error("Erro ao verificar cargo:", e);
      }

      // Fallback para contas de teste
      if (!ehAdmin && (emailUsuario.includes("admin") || emailUsuario.includes("teste"))) {
        ehAdmin = true;
      }

      // Mostra ou oculta as abas de administrador em todos os ecrãs
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

      // Redireciona para a agenda se estiver na página de login e já autenticado
      if (isLoginPage) {
        window.location.href = pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html";
      }

    } else {
      // Bloqueia o acesso a páginas internas se não houver login
      if (!isLoginPage) {
        window.location.href = pathAtual.includes("/pages/") ? "../index.html" : "index.html"; 
      }
    }
  });
}

window.fazerLogoutReal = function() {
  if (typeof firebase !== 'undefined') {
    firebase.auth().signOut().then(() => {
      const pathAtual = window.location.pathname;
      window.location.href = pathAtual.includes("/pages/") ? "../index.html" : "index.html";
    });
  }
}
