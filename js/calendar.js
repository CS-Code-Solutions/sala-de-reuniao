let dataAtual = new Date(); // Começa com a data de hoje

document.addEventListener("DOMContentLoaded", () => {
    atualizarTextoData(); // Preenche as datas no HTML
    setTimeout(() => {
        carregarAgenda();
    }, 300);
});

// ==========================================
// FUNÇÕES DE NAVEGAÇÃO DE DATAS E BOTÕES
// ==========================================

window.mudarData = function(dias) {
    // Adiciona ou subtrai dias à data atual
    dataAtual.setDate(dataAtual.getDate() + dias);
    atualizarTextoData();
    
    // Animação leve para simular carregamento
    const grid = document.getElementById("gridHorarios");
    if(grid) grid.style.opacity = "0.5";
    
    setTimeout(() => {
        carregarAgenda();
        if(grid) grid.style.opacity = "1";
    }, 200); // Simulando delay de internet
};

window.resetarData = function() {
    dataAtual = new Date(); // Volta para hoje
    atualizarTextoData();
    carregarAgenda();
};

window.mudarVisualizacao = function(tipo, btnClicado) {
    // Remove a classe 'active' de todos os botões do grupo
    const botoes = document.querySelectorAll("#viewTogglesGroup button");
    botoes.forEach(btn => btn.classList.remove("active"));
    
    // Adiciona ao botão que foi clicado
    btnClicado.classList.add("active");
    
    // Alerta temporário para mostrar funcionamento
    alert("Visualização alterada para: " + tipo.toUpperCase());
};

function atualizarTextoData() {
    const spanData = document.getElementById("dataAtualExibicao");
    // Seleciona o subtítulo da grelha (ex: "Terça, 28 de outubro de 2026")
    const divSubtituloGrelha = document.querySelector(".cal-main-header span:nth-child(2)"); 
    
    if (!spanData) return;

    // Formato Curto (ex: "28 de out. de 2026")
    const opcoesCurta = { day: '2-digit', month: 'short', year: 'numeric' };
    let dataCurta = dataAtual.toLocaleDateString('pt-BR', opcoesCurta).replace('.', '');
    spanData.innerText = dataCurta;

    // Formato Longo (ex: "Terça-feira, 28 de outubro de 2026")
    if (divSubtituloGrelha) {
        const opcoesLonga = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
        let dataLonga = dataAtual.toLocaleDateString('pt-BR', opcoesLonga);
        dataLonga = dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1); // Primeira letra maiúscula
        divSubtituloGrelha.innerText = dataLonga;
    }
}

// ==========================================
// RENDERIZAÇÃO DA AGENDA
// ==========================================

function carregarAgenda() {
    const gridContainer = document.getElementById("gridHorarios");
    const proxContainer = document.getElementById("listaProximas");
    
    if (!gridContainer || !proxContainer) return;

    gridContainer.innerHTML = "";
    proxContainer.innerHTML = "";

    // Base de dados simulada (No futuro, estes dados virão do Firebase filtrados pela "dataAtual")
    const horarios = [
        { hora: "07:00", inicio: "07:00", fim: "07:30", status: "disponivel", cor: "green" },
        { hora: "08:00", inicio: "07:30", fim: "10:00", status: "reservado", titulo: "Planejamento Estratégico", responsavel: "Alex", tipo: "Reunião", cor: "blue" },
        { hora: "10:00", inicio: "10:00", fim: "11:00", status: "disponivel", cor: "green" },
        { hora: "11:00", inicio: "11:00", fim: "12:00", status: "reservado", titulo: "Reunião de equipe", responsavel: "Bruna", tipo: "Reunião", cor: "blue" },
        { hora: "12:00", inicio: "12:00", fim: "13:30", status: "disponivel", cor: "green" },
        { hora: "14:00", inicio: "13:30", fim: "15:00", status: "reservado", titulo: "Projeto Alfa", responsavel: "Carlos", tipo: "Reunião", cor: "purple" },
        { hora: "16:00", inicio: "15:00", fim: "16:00", status: "disponivel", cor: "green" },
        { hora: "17:00", inicio: "16:00", fim: "17:00", status: "reservado", titulo: "Revisão de resultados", responsavel: "Fernanda", tipo: "Reunião", cor: "blue" }
    ];

    horarios.forEach(slot => {
        // 1. Gerar Bloco Principal na Grelha (Esquerda)
        const row = document.createElement("div");
        row.className = "time-row";
        
        if (slot.status === "reservado") {
            row.innerHTML = `
                <div class="time-label">${slot.hora}</div>
                <div class="event-block ${slot.cor}">
                    <div class="event-time">${slot.inicio} - ${slot.fim}</div>
                    <div class="event-title">${slot.titulo}</div>
                    <div class="event-meta">${slot.responsavel} • ${slot.tipo}</div>
                </div>
            `;
            
            // 2. Adicionar à barra de Próximas Reservas
            const upItem = document.createElement("div");
            upItem.className = "upcoming-item";
            upItem.innerHTML = `
                <div class="dot ${slot.cor}"></div>
                <div class="up-info">
                    <span class="up-time">${slot.inicio} - ${slot.fim}</span>
                    <span class="up-title">${slot.titulo}</span>
                    <span class="up-meta">${slot.responsavel}</span>
                </div>
            `;
            proxContainer.appendChild(upItem);
            
        } else {
            row.innerHTML = `
                <div class="time-label">${slot.hora}</div>
                <div class="event-block ${slot.cor}" style="cursor:pointer;" onclick="abrirModalReserva('${slot.inicio}', '${slot.fim}')">
                    <div class="event-time"><span>●</span> ${slot.inicio} - ${slot.fim} • Disponível</div>
                </div>
            `;
        }
        
        gridContainer.appendChild(row);
    });
}

window.abrirModalReserva = function(inicio, fim) {
    const dataFormatada = document.getElementById("dataAtualExibicao").innerText;
    const nomeReuniao = prompt(`Nova Reserva em: ${dataFormatada}\nHorário: ${inicio} às ${fim}\nQual o nome da reunião?`);
    if (nomeReuniao) {
        alert(`Sucesso! "${nomeReuniao}" foi agendada.`);
    }
};
