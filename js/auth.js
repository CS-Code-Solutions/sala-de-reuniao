// ==========================================
// AUTENTICAÇÃO E SESSÃO FIRESTORE (auth.js)
// ==========================================

window.obterSessaoAtual = function () {
  try {
    const raw = localStorage.getItem("meetingroom_sessao_atual");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

window.verificarAutenticacao = function (opcoes = {}) {
  const { apenasAdmin = false, onSessaoPronta = null } = opcoes;

  if (!window.auth || !window.db) {
    console.error("Firebase Auth/Firestore não inicializado. Verifique js/firebase-config.js.");
    return;
  }

  window.auth.onAuthStateChanged(async (user) => {
    const pathAtual = window.location.pathname;
    const estaEmPages = pathAtual.includes("/pages/");
    const isLoginPage =
      pathAtual.endsWith("login.html") ||
      pathAtual.endsWith("index.html") ||
      pathAtual === "/" ||
      pathAtual.endsWith("/sala-de-reuniao/");

    if (!user) {
      localStorage.removeItem("meetingroom_sessao_atual");
      localStorage.removeItem("app_perfil_ui");
      if (!isLoginPage) {
        window.location.replace(estaEmPages ? "../index.html" : "index.html");
      }
      return;
    }

    const emailUsuario = (user.email || "").toLowerCase();
    const nomeBase = emailUsuario.split("@")[0] || "Utilizador";

    let perfil = {
      uid: user.uid,
      email: user.email || "",
      nome: nomeBase,
      apelido: nomeBase,
      cargo: emailUsuario.includes("admin") || emailUsuario.includes("teste") ? "Administrador" : "Usuário",
      whatsapp: "",
      emailRealNotificacao: user.email || "",
      notificacoes: { email: true, tempoAntecedencia: 10 }
    };

    try {
      const userDoc = await window.db.collection("usuarios").doc(user.uid).get();
      if (userDoc.exists) {
        const dados = userDoc.data();
        perfil = {
          ...perfil,
          ...dados,
          uid: user.uid,
          email: user.email || dados.email || ""
        };
      }
    } catch (e) {
      console.error("Erro ao carregar perfil do usuário no Firestore:", e);
    }

    const ehAdmin =
      perfil.cargo === "Administrador" ||
      emailUsuario.includes("admin") ||
      emailUsuario.includes("teste");

    perfil.ehAdmin = ehAdmin;
    const nomeExibicao = perfil.apelido || (perfil.nome ? perfil.nome.split(" ")[0] : nomeBase);

    // Salva metadados de UI e sessão (sem credenciais sensíveis)
    localStorage.setItem("meetingroom_sessao_atual", JSON.stringify(perfil));
    localStorage.setItem(
      "app_perfil_ui",
      JSON.stringify({
        uid: user.uid,
        nome: nomeExibicao,
        cargo: perfil.cargo || (ehAdmin ? "Administrador" : "Usuário"),
        ehAdmin: ehAdmin
      })
    );

    // Atualiza elementos de cabeçalho e menu
    const userNameDisplay = document.getElementById("userNameDisplay");
    const userRoleDisplay = document.getElementById("userRoleDisplay");
    const userAvatarMobile = document.getElementById("userAvatarMobile");

    if (userNameDisplay) userNameDisplay.textContent = nomeExibicao;
    if (userRoleDisplay) userRoleDisplay.textContent = perfil.cargo || (ehAdmin ? "Administrador" : "Usuário");
    if (userAvatarMobile) userAvatarMobile.textContent = "Olá, " + nomeExibicao;

    const adminItems = document.querySelectorAll(".admin-only-item");
    adminItems.forEach((item) => {
      if (item) item.style.display = ehAdmin ? "" : "none";
    });

    // Bloqueia acesso não autorizado às páginas administrativas
    if (!ehAdmin && (apenasAdmin || pathAtual.includes("admin-users.html") || pathAtual.includes("rooms.html"))) {
      window.location.replace(estaEmPages ? "calendar.html" : "pages/calendar.html");
      return;
    }

    if (isLoginPage) {
      window.location.replace(estaEmPages ? "calendar.html" : "pages/calendar.html");
      return;
    }

    if (window.AntiFlicker) {
      window.AntiFlicker.reveal({ ehAdmin });
    }

    if (typeof window.verificarAceiteTermosUtilizador === "function") {
      window.verificarAceiteTermosUtilizador(perfil);
    }

    if (typeof onSessaoPronta === "function") {
      onSessaoPronta(perfil);
    }
  });
};

window.fazerLogoutLocal = function () {
  localStorage.removeItem("meetingroom_sessao_atual");
  localStorage.removeItem("app_perfil_ui");

  const pathAtual = window.location.pathname;
  const destino = pathAtual.includes("/pages/") ? "../index.html" : "index.html";

  if (window.auth) {
    window.auth
      .signOut()
      .then(() => window.location.replace(destino))
      .catch(() => window.location.replace(destino));
  } else {
    window.location.replace(destino);
  }
};

window.fazerLogoutReal = window.fazerLogoutLocal;
