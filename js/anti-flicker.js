// ==========================================
// BLINDAGEM ANTI-PISCADA (js/anti-flicker.js)
// Carregamento síncrono no <head> antes do DOM
// ==========================================
(function () {
  const CACHE_KEY = "mr_perfil_ui";

  // 1. Injeta regras CSS imediatas para evitar salto nos menus e suavizar troca de aba
  const style = document.createElement("style");
  style.textContent = `
    @view-transition { navigation: auto; }
    html.is-admin .admin-only-item { display: flex !important; }
    html.is-admin div.admin-only-item { display: block !important; }
    .sidebar, .mobile-topbar-bar, .mobile-bottom-nav {
      view-transition-name: app-shell;
    }
    .page-wrapper > header, .page-wrapper > section {
      animation: mrFadeContent 0.16s ease-out;
    }
    @keyframes mrFadeContent {
      from { opacity: 0.65; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // 2. Lê o cache visual da sessão atual antes da pintura da tela
  let perfil = null;
  try {
    const salvo = sessionStorage.getItem(CACHE_KEY);
    if (salvo) perfil = JSON.parse(salvo);
  } catch (e) {}

  if (perfil && perfil.ehAdmin) {
    document.documentElement.classList.add("is-admin");
  }

  // 3. Preenche nome e cargo no instante em que os elementos surgem no HTML
  function aplicarDadosUI(dados) {
    if (!dados || !dados.apelido) return;
    const elNome = document.getElementById("userNameDisplay");
    const elCargo = document.getElementById("userRoleDisplay");
    const elMob = document.getElementById("userAvatarMobile");

    if (elNome && elNome.innerText !== dados.apelido) {
      elNome.innerText = dados.apelido;
    }
    if (elCargo) {
      elCargo.innerText = dados.ehAdmin ? "Administrador" : "Usuário";
    }
    if (elMob && elMob.innerText !== "Olá, " + dados.apelido) {
      elMob.innerText = "Olá, " + dados.apelido;
    }
  }

  if (perfil) {
    const observer = new MutationObserver(() => {
      aplicarDadosUI(perfil);
      if (
        document.getElementById("userNameDisplay") &&
        document.getElementById("userAvatarMobile")
      ) {
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", () => aplicarDadosUI(perfil));
  }

  // 4. Funções globais para atualizar ou limpar o cache ao autenticar/sair
  window.salvarPerfilUICache = function (apelido, ehAdmin) {
    const dados = { apelido: apelido, ehAdmin: !!ehAdmin };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(dados));
    } catch (e) {}

    if (dados.ehAdmin) {
      document.documentElement.classList.add("is-admin");
    } else {
      document.documentElement.classList.remove("is-admin");
    }
    aplicarDadosUI(dados);
  };

  window.limparPerfilUICache = function () {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {}
    document.documentElement.classList.remove("is-admin");
  };
})();
