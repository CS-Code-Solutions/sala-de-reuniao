import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Função de Login Real ligada globalmente ao botão
window.fazerLoginReal = function() {
    const email = document.getElementById("emailLogin").value;
    const senha = document.getElementById("senhaLogin").value;

    if (!email || !senha) {
        alert("Por favor, preencha o e-mail e a senha.");
        return;
    }

    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            window.location.href = "calendar.html";
        })
        .catch((error) => {
            alert("Erro ao entrar: " + error.message);
        });
};

// Função de Logout Real ligada globalmente
window.fazerLogoutReal = function() {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Erro ao sair:", error);
    });
};

// Verifica o estado da sessão e protege as rotas sem causar loops
export function verificarAutenticacao() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const nomeDisplay = document.getElementById("userNameDisplay");
            if (nomeDisplay) {
                nomeDisplay.innerText = user.email.split('@')[0];
            }

            // Libera o menu de administração se for o e-mail de teste/admin
            if (user.email.includes("admin") || user.email.includes("teste")) {
                const adminMenu = document.getElementById("adminMenu");
                if (adminMenu) adminMenu.style.display = "block";
            }
        } else {
            // Só redireciona se já não estivermos na página de login
            if (!window.location.pathname.includes("login.html")) {
                window.location.href = "login.html";
            }
        }
    });
}
```[cite: 35]

---

### 2. Páginas HTML Protegidas Ajustadas

Nas páginas internas, o erro ocorria porque o script final chamava acidentalmente o `calendar.js` genérico em páginas como `notifications.html` ou `admin-users.html`, ou chamava scripts incorretos. Abaixo estão os códigos completos corrigidos para cada uma das páginas principais:

#### A. `pages/calendar.html` completo:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeetingRoom - Agenda</title>
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
</head>
<body>

  <!-- Menu Lateral -->
  <aside class="sidebar">
    <div class="logo-area">
      <h2>📅 MeetingRoom</h2>
    </div>
    <nav class="nav-links">
      <a href="calendar.html" class="active">Agenda</a>
      <a href="my-reservations.html">Minhas Reservas</a>
      <a href="rooms.html">Salas</a>
      <a href="notifications.html">Notificações</a>
      <a href="admin-users.html" id="adminMenu" style="display:none;">Usuários (Admin)</a>
    </nav>
    <div class="user-profile">
      <span id="userNameDisplay">Carregando...</span>
      <a href="#" onclick="fazerLogoutReal(); return false;">Sair</a>
    </div>
  </aside>

  <!-- Conteúdo Principal -->
  <main class="main-content">
    <header class="topbar">
      <h1>Agenda de Reuniões</h1>
      <div class="room-selector">
        <select id="salaSelect" onchange="carregarAgenda()">
          <option value="1">Sala de Reuniões 01 (Cap. 8)</option>
          <option value="2">Sala de Reuniões 02 (Cap. 6)</option>
        </select>
      </div>
    </header>

    <!-- Grade de Horários -->
    <section class="schedule-grid-container">
      <div id="gridHorarios" class="time-slots">
        <!-- Preenchido dinamicamente via js/calendar.js -->
      </div>
    </section>
  </main>

  <script type="module">
    import { verificarAutenticacao } from "../js/auth.js";
    verificarAutenticacao();
  </script>
  <script src="../js/calendar.js"></script>
</body>
</html>
```[cite: 30]

#### B. `pages/admin-users.html` completo:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeetingRoom - Gestão de Utilizadores</title>
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
</head>
<body>

  <aside class="sidebar">
    <div class="logo-area">
      <h2>📅 MeetingRoom</h2>
    </div>
    <nav class="nav-links">
      <a href="calendar.html">Agenda</a>
      <a href="my-reservations.html">Minhas Reservas</a>
      <a href="rooms.html">Salas</a>
      <a href="notifications.html">Notificações</a>
      <a href="admin-users.html" class="active">Usuários (Admin)</a>
    </nav>
    <div class="user-profile">
      <span id="userNameDisplay">Carregando...</span>
     <a href="#" onclick="fazerLogoutReal(); return false;">Sair</a>
    </div>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <h1>Gerenciamento de Utilizadores</h1>
      <button onclick="abrirNovoUsuario()" style="padding: 10px 16px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">+ Novo Utilizador</button>
    </header>

    <section class="schedule-grid-container">
      <div id="listaUtilizadores" class="time-slots">
        <div class="slot-item">
          <div>
            <strong>Ana Costa</strong>
            <p>ana@empresa.com</p>
          </div>
          <span style="color: var(--primary); font-weight: 600;">Administrador</span>
        </div>
        <div class="slot-item">
          <div>
            <strong>Bruno Lima</strong>
            <p>bruno@empresa.com</p>
          </div>
          <span style="color: var(--text-muted);">Usuário</span>
        </div>
      </div>
    </section>
  </main>

  <script type="module">
    import { verificarAutenticacao } from "../js/auth.js";
    verificarAutenticacao();
  </script>
  <script src="../js/users.js"></script>
</body>
</html>
```[cite: 29]

#### C. `pages/my-reservations.html` completo:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeetingRoom - Minhas Reservas</title>
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
</head>
<body>

  <aside class="sidebar">
    <div class="logo-area">
      <h2>📅 MeetingRoom</h2>
    </div>
    <nav class="nav-links">
      <a href="calendar.html">Agenda</a>
      <a href="my-reservations.html" class="active">Minhas Reservas</a>
      <a href="rooms.html">Salas</a>
      <a href="notifications.html">Notificações</a>
      <a href="admin-users.html" id="adminMenu" style="display:none;">Usuários (Admin)</a>
    </nav>
    <div class="user-profile">
      <span id="userNameDisplay">Carregando...</span>
      <a href="#" onclick="fazerLogoutReal(); return false;">Sair</a>
    </div>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <h1>Minhas Reservas</h1>
    </header>

    <section class="schedule-grid-container">
      <div id="listaMinhasReservas" class="time-slots">
        <!-- Preenchido via JS -->
      </div>
    </section>
  </main>

  <script type="module">
    import { verificarAutenticacao } from "../js/auth.js";
    verificarAutenticacao();
  </script>
  <script src="../js/reservations.js"></script>
</body>
</html>
```[cite: 32]

#### D. `pages/rooms.html` completo:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeetingRoom - Salas de Reunião</title>
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
</head>
<body>

  <aside class="sidebar">
    <div class="logo-area">
      <h2>📅 MeetingRoom</h2>
    </div>
    <nav class="nav-links">
      <a href="calendar.html">Agenda</a>
      <a href="my-reservations.html">Minhas Reservas</a>
      <a href="rooms.html" class="active">Salas</a>
      <a href="notifications.html">Notificações</a>
      <a href="admin-users.html" id="adminMenu" style="display:none;">Usuários (Admin)</a>
    </nav>
    <div class="user-profile">
      <span id="userNameDisplay">Carregando...</span>
      <a href="#" onclick="fazerLogoutReal(); return false;">Sair</a>
    </div>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <h1>Salas Disponíveis</h1>
    </header>

    <section class="schedule-grid-container">
      <div class="time-slots">
        <div class="slot-item" style="border-left: 5px solid var(--primary);">
          <div>
            <strong>Sala de Reuniões 01</strong>
            <p>👥 Capacidade: 8 pessoas &nbsp;•&nbsp; 💻 Equipamentos: TV, Videoconferência, Quadro</p>
          </div>
          <span style="color: #10b981; font-weight: 600;">Ativa</span>
        </div>
        <div class="slot-item" style="border-left: 5px solid #cbd5e1;">
          <div>
            <strong>Sala de Reuniões 02</strong>
            <p>👥 Capacidade: 6 pessoas &nbsp;•&nbsp; 💻 Equipamentos: TV, Quadro</p>
          </div>
          <span style="color: var(--text-muted); font-weight: 600;">Em breve</span>
        </div>
      </div>
    </section>
  </main>

  <script type="module">
    import { verificarAutenticacao } from "../js/auth.js";
    verificarAutenticacao();
  </script>
</body>
</html>
```[cite: 34]

#### E. `pages/notifications.html` completo:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeetingRoom - Notificações</title>
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
  <style>
    .notif-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .notif-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
    .notif-item:last-child { border-bottom: none; padding-bottom: 0; }
    .switch { position: relative; display: inline-block; width: 48px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
    input:checked + .slider { background-color: var(--primary); }
    input:checked + .slider:before { transform: translateX(24px); }
  </style>
</head>
<body>

  <aside class="sidebar">
    <div class="logo-area">
      <h2>📅 MeetingRoom</h2>
    </div>
    <nav class="nav-links">
      <a href="calendar.html">Agenda</a>
      <a href="my-reservations.html">Minhas Reservas</a>
      <a href="rooms.html">Salas</a>
      <a href="notifications.html" class="active">Notificações</a>
      <a href="admin-users.html" id="adminMenu" style="display:none;">Usuários (Admin)</a>
    </nav>
    <div class="user-profile">
      <span id="userNameDisplay">Carregando...</span>
      <a href="#" onclick="fazerLogoutReal(); return false;">Sair</a>
    </div>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <h1>Configurações de Notificações</h1>
    </header>

    <section class="schedule-grid-container">
      <div class="notif-card">
        <h3>Receber notificações</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: -10px;">Escolha como deseja ser notificado sobre as suas reservas e alterações.</p>
        
        <div class="notif-item">
          <div>
            <strong>E-mail</strong>
            <p style="font-size: 13px; color: var(--text-muted);">Confirmações, cancelamentos e avisos importantes.</p>
          </div>
          <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
        <div class="notif-item">
          <div>
            <strong>Notificações no celular</strong>
            <p style="font-size: 13px; color: var(--text-muted);">Avisos em tempo real no navegador ou dispositivo móvel.</p>
          </div>
          <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
        <div class="notif-item">
          <div>
            <strong>Reservas de outras pessoas</strong>
            <p style="font-size: 13px; color: var(--text-muted);">Receber alerta quando alguém reservar ou cancelar na mesma sala.</p>
          </div>
          <label class="switch"><input type="checkbox"><span class="slider"></span></label>
        </div>
        <div class="notif-item">
          <div>
            <strong>Lembretes de reuniões</strong>
            <p style="font-size: 13px; color: var(--text-muted);">Um lembrete enviado alguns minutos antes da reunião.</p>
          </div>
          <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
        </div>
      </div>
    </section>
  </main>

  <script type="module">
    import { verificarAutenticacao } from "../js/auth.js";
    verificarAutenticacao();
  </script>
</body>
</html>
