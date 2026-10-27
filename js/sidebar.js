document.addEventListener("DOMContentLoaded", () => {
  // Renderiza a Sidebar Desktop
  const sidebarContainer = document.getElementById("sidebar-container");
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div>
          <div class="brand-area">
            <img src="../cabe.png" alt="Logo" class="brand-logo">
          </div>

          <nav class="nav-links">
            <a href="calendar.html" id="nav-calendar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Agenda</span>
            </a>
            <a href="my-reservations.html" id="nav-my-reservations">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              <span>Minhas reservas</span>
            </a>
            <a href="notifications.html" id="nav-notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span>Notificações</span>
            </a>
            
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin: 16px 0 6px 12px; letter-spacing: 0.5px;" class="admin-only-item" style="display:none;">Administração</div>
            <a href="rooms.html" id="nav-rooms" class="admin-only-item" style="display:none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path><path d="M2 20h20"></path><circle cx="14" cy="12" r="1"></circle></svg>
              <span>Salas</span>
            </a>
            <a href="admin-users.html" id="nav-admin-users" class="admin-only-item" style="display:none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 1-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Usuários</span>
            </a>
          </nav>
        </div>

        <div class="user-profile-box">
          <div class="user-info-text">
            <h4 id="userNameDisplay">Carregando...</h4>
            <p id="userRoleDisplay">Utilizador</p>
          </div>
          <a href="#" onclick="fazerLogoutLocal(); return false;" title="Sair" style="color: #94a3b8; display: flex; align-items: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </a>
        </div>
      </aside>
    `;
  }

  // Renderiza a Navegação Inferior Mobile
  const mobileNavContainer = document.getElementById("mobile-nav-container");
  if (mobileNavContainer) {
    mobileNavContainer.innerHTML = `
      <nav class="mobile-bottom-nav">
        <a href="calendar.html" id="mob-calendar" class="mob-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Agenda</span>
        </a>
        <a href="my-reservations.html" id="mob-my-reservations" class="mob-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          <span>Reservas</span>
        </a>
        <a href="rooms.html" id="mob-rooms" class="mob-nav-item admin-only-item" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path><path d="M2 20h20"></path><circle cx="14" cy="12" r="1"></circle></svg>
          <span>Salas</span>
        </a>
        <a href="notifications.html" id="mob-notifications" class="mob-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span>Avisos</span>
        </a>
        <a href="admin-users.html" id="mob-admin-users" class="mob-nav-item admin-only-item" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Admin</span>
        </a>
      </nav>
    `;
  }

  // Marca o item ativo automaticamente com base no nome do ficheiro atual na URL
  const pathAtual = window.location.pathname.split("/").pop() || "calendar.html";
  
  if (pathAtual.includes("calendar")) {
    document.getElementById("nav-calendar")?.classList.add("active");
    document.getElementById("mob-calendar")?.classList.add("active");
  } else if (pathAtual.includes("my-reservations")) {
    document.getElementById("nav-my-reservations")?.classList.add("active");
    document.getElementById("mob-my-reservations")?.classList.add("active");
  } else if (pathAtual.includes("notifications")) {
    document.getElementById("nav-notifications")?.classList.add("active");
    document.getElementById("mob-notifications")?.classList.add("active");
  } else if (pathAtual.includes("rooms")) {
    document.getElementById("nav-rooms")?.classList.add("active");
    document.getElementById("mob-rooms")?.classList.add("active");
  } else if (pathAtual.includes("admin-users")) {
    document.getElementById("nav-admin-users")?.classList.add("active");
    document.getElementById("mob-admin-users")?.classList.add("active");
  }
});
