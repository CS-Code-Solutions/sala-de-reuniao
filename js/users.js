document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    carregarUtilizadores();
});

function carregarUtilizadores() {
    const container = document.getElementById("listaUtilizadores");
    if (!container) return;

    // Lista simulada de utilizadores cadastrados no sistema
    const utilizadores = [
        { id: 1, nome: "Ana Costa", email: "ana@empresa.com", perfil: "Administrador" },
        { id: 2, nome: "Bruno Lima", email: "bruno@empresa.com", perfil: "Usuário" },
        { id: 3, nome: "Carla Souza", email: "carla@empresa.com", perfil: "Usuário" },
        { id: 4, nome: "Diego Ferreira", email: "diego@empresa.com", perfil: "Usuário" },
        { id: 5, nome: "Fernanda Alves", email: "fernanda@empresa.com", perfil: "Recepcionista" }
    ];

    container.innerHTML = "";

    utilizadores.forEach(user => {
        const div = document.createElement("div");
        div.className = "slot-item";
        
        let corPerfil = "var(--text-muted)";
        if (user.perfil === "Administrador") corPerfil = "var(--primary)";
        if (user.perfil === "Recepcionista") corPerfil = "#10b981";

        div.innerHTML = `
            <div>
                <strong>${user.nome}</strong>
                <p style="font-size: 13px; color: var(--text-muted);">${user.email}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span style="color: ${corPerfil}; font-weight: 600;">${user.perfil}</span>
                <button onclick="editarUtilizador(${user.id})" style="padding: 6px 12px; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">Gerir</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirNovoUsuario() {
    const nome = prompt("Digite o nome completo do novo utilizador:");
    if (!nome) return;
    
    const email = prompt("Digite o e-mail corporativo:");
    if (!email) return;

    const perfilTipo = prompt("Defina o perfil (1 para Usuário, 2 para Administrador, 3 para Recepcionista):");
    let perfil = "Usuário";
    if (perfilTipo === "2") perfil = "Administrador";
    if (perfilTipo === "3") perfil = "Recepcionista";

    alert(`Utilizador ${nome} (${perfil}) cadastrado com sucesso!`);
    carregarUtilizadores(); // Atualiza a lista na tela
}

function editarUtilizador(id) {
    alert(`Abrindo painel de edição para o utilizador ID: ${id}`);
}
