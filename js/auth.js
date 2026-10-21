function verificarAutenticacao() {
    // Simulando usuário logado (Em produção virá do banco/localStorage)
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioAtual")) || {
        nome: "Mariana Silva",
        perfil: "usuario" // pode ser 'usuario', 'admin' ou 'recepcao'
    };

    document.getElementById("userNameDisplay").innerText = usuarioLogado.nome;

    // Se for Administrador, exibe a aba de gerenciamento de usuários
    if (usuarioLogado.perfil === "admin") {
        const adminMenu = document.getElementById("adminMenu");
        if (adminMenu) adminMenu.style.display = "block";
    }
}
