import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function verificarAutenticacao(callbackUsuarioPronto = null) {
  onAuthStateChanged(auth, async (user) => {
    const pathAtual = window.location.pathname;
    const isLoginPage =
      pathAtual.endsWith("login.html") ||
      pathAtual.endsWith("index.html") ||
      pathAtual === "/" ||
      pathAtual.endsWith("/sala-de-reuniao/");

    const isDisplayPorta = pathAtual.includes("display-porta.html");

    if (user) {
      const emailUsuario = user.email.toLowerCase();
      let nomeExibicao = emailUsuario.split("@")[0];
      let cargoUsuario = "Usuário";
      let ehAdmin = false;

      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          const dados = userDoc.data();
          nomeExibicao = dados.apelido || dados.nome || nomeExibicao;
          cargoUsuario = dados.cargo || "Usuário";
          if (cargoUsuario === "Administrador") {
            ehAdmin = true;
          }
        }
      } catch (e) {
        console.error("Erro ao consultar perfil no Firestore:", e);
      }

      if (!ehAdmin && (emailUsuario.includes("admin") || emailUsuario.includes("teste"))) {
        ehAdmin = true;
        cargoUsuario = "Administrador";
      }

      // Atualiza interface da Sidebar e Topo
      const userNameDisplay = document.getElementById("userNameDisplay");
      const userRoleDisplay = document.getElementById("userRoleDisplay");
      const userAvatarMobile = document.getElementById("userAvatarMobile");

      if (userNameDisplay) userNameDisplay.innerText = nomeExibicao;
      if (userRoleDisplay) userRoleDisplay.innerText = cargoUsuario;
      if (userAvatarMobile) userAvatarMobile.innerText = "Olá, " + nomeExibicao;

      // Controle de visibilidade para itens administrativos
      const adminItems = document.querySelectorAll(".admin-only-item");
      adminItems.forEach((item) => {
        if (item) item.style.display = ehAdmin ? "" : "none";
      });

      // Bloqueia acesso de não-administradores às páginas restritas
      if (!ehAdmin && (pathAtual.includes("admin-users.html") || pathAtual.includes("rooms.html"))) {
        window.location.replace(pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html");
        return;
      }

      // Redireciona se já estiver autenticado e abrir a página de login
      if (isLoginPage) {
        window.location.replace(pathAtual.includes("/pages/") ? "calendar.html" : "pages/calendar.html");
        return;
      }

      // Dispara verificação de aceite dos Termos de Uso / LGPD (exceto no Display de Porta)
      if (!isDisplayPorta && typeof window.verificarAceiteTermosUtilizador === "function") {
        window.verificarAceiteTermosUtilizador({
          uid: user.uid,
          email: user.email,
          nome: nomeExibicao
        });
      }

      if (typeof callbackUsuarioPronto === "function") {
        callbackUsuarioPronto({
          uid: user.uid,
          email: user.email,
          nome: nomeExibicao,
          cargo: cargoUsuario,
          ehAdmin
        });
      }
    } else {
      // Permite acesso ao Display de Porta ou redireciona para o Login
      if (!isLoginPage && !isDisplayPorta) {
        window.location.replace(pathAtual.includes("/pages/") ? "../index.html" : "index.html");
      }
    }
  });
}

window.fazerLogoutReal = async function () {
  try {
    await signOut(auth);
    localStorage.removeItem("meetingroom_sessao_atual");
    const pathAtual = window.location.pathname;
    window.location.replace(pathAtual.includes("/pages/") ? "../index.html" : "index.html");
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
};

// Alias para compatibilidade com botões antigos
window.fazerLogoutLocal = window.fazerLogoutReal;
