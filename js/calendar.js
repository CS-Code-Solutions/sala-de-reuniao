document.addEventListener("DOMContentLoaded", () => {
    // Renderiza a agenda assim que o DOM carrega
    setTimeout(() => {
        carregarAgenda();
    }, 300);
});

function carregarAgenda() {
    const gridContainer = document.getElementById("gridHorarios");
    const proxContainer = document.getElementById("listaProximas");
    
    if (!gridContainer || !proxContainer) return;

    gridContainer.innerHTML = "";
    proxContainer.innerHTML = "";

    // Base de dados simulada para gerar o visual exato da imagem
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
            
            // 2. Adicionar simultaneamente à barra de Próximas Reservas (Direita)
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

function abrirModalReserva(inicio, fim) {
    const nomeReuniao = prompt(`Nova Reserva: ${inicio} às ${fim}\nQual o nome da reunião?`);
    if (nomeReuniao) {
        alert(`Sucesso! "${nomeReuniao}" foi agendada.`);
        // Em um sistema real, aqui chamaríamos o Firebase (Firestore) para salvar
    }
}
