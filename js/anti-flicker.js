// ==========================================
// GUARDIÃO ANTI-FLICKER (anti-flicker.js)
// ==========================================
(function () {
  const STORAGE_KEY = "app_perfil_ui";
  const MAX_LOCK_TIME_MS = 3000;
  let isRevealed = false;

  const root = document.documentElement;
  const path = window.location.pathname;
  const paginaAtual = path.split("/").pop() || "index.html";
  const isLoginOrPublic =
    root.hasAttribute("data-public-page") ||
    paginaAtual === "login.html" ||
    paginaAtual === "index.html" ||
    paginaAtual === "display-porta.html" ||
    paginaAtual === "privacy-policy.html";

  let cachedProfile = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cachedProfile = JSON.parse(raw);
  } catch (e) {}

  // Bloqueio preventivo de rotas exclusivas de Administrador
  const rotasAdmin = ["admin-users.html", "rooms.html"];
  if (cachedProfile && cachedProfile.uid && !cachedProfile.ehAdmin && rotasAdmin.includes(paginaAtual)) {
    window.location.replace("calendar.html");
    return;
  }

  // Regras CSS injetadas antes do <body> existir
  const dynamicCss = `
    html.af-not-admin .admin-only-item { display: none !important; }
    html.af-locked body {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    html.af-ready body {
      opacity: 1 !important;
      visibility: visible !important;
      transition: opacity 0.15s ease-out;
    }
  `;

  const style = document.createElement("style");
  style.id = "anti-flicker-style";
  style.textContent = dynamicCss;
  document.head.appendChild(style);

  if (cachedProfile && cachedProfile.uid) {
    root.classList.add("af-has-session");
    root.classList.add(cachedProfile.ehAdmin ? "af-is-admin" : "af-not-admin");
    isRevealed = true;

    const aplicarDadosCache = () => {
      if (!cachedProfile.nome) return;
      const userNameDisplay = document.getElementById("userNameDisplay");
      const userRoleDisplay = document.getElementById("userRoleDisplay");
      const userAvatarMobile = document.getElementById("userAvatarMobile");

      if (userNameDisplay && userNameDisplay.textContent.trim() !== cachedProfile.nome) {
        userNameDisplay.textContent = cachedProfile.nome;
      }
      if (userRoleDisplay && cachedProfile.cargo) {
        userRoleDisplay.textContent = cachedProfile.cargo;
      }
      if (userAvatarMobile && !userAvatarMobile.textContent.includes(cachedProfile.nome)) {
        userAvatarMobile.textContent = "Olá, " + cachedProfile.nome;
      }
    };

    const observer = new MutationObserver(() => {
      aplicarDadosCache();
      if (document.getElementById("userNameDisplay") && document.getElementById("userAvatarMobile")) {
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", () => {
      aplicarDadosCache();
      observer.disconnect();
    });
  } else if (!isLoginOrPublic) {
    root.classList.add("af-locked");
  }

  function reveal(perfilAtualizado) {
    if (perfilAtualizado && typeof perfilAtualizado.ehAdmin === "boolean") {
      root.classList.toggle("af-is-admin", perfilAtualizado.ehAdmin);
      root.classList.toggle("af-not-admin", !perfilAtualizado.ehAdmin);
    }

    if (isRevealed) return;
    isRevealed = true;

    root.classList.remove("af-locked");
    root.classList.add("af-ready");
  }

  window.AntiFlicker = {
    reveal,
    isLocked: () => !isRevealed
  };

  setTimeout(() => {
    if (!isRevealed) reveal();
  }, MAX_LOCK_TIME_MS);
})();
