document.addEventListener("DOMContentLoaded", () => {
    // Aguarda um instante para garantir que a autenticação carregou o email
    setTimeout(() => {
        carregarAgenda();
    }, 500);
});

function carregarAgenda() {
    const container = document.getElementById("gridHorarios");
    if (!container) return;

    container.innerHTML = "";

    // Grade de horários detalhada inspirada no design padrão
    const horarios = [
        { inicio: "07:00", fim: "07:30", status: "disponivel" },
        { inicio: "07:30", fim: "10:00", status: "reservado", por: "Alex", assunto: "Planejamento Estratégico" },
        { inicio: "10:00", fim: "11:00", status: "disponivel" },
        { inicio: "11:00", fim: "12:00", status: "reservado", por: "Bruna", assunto: "Reunião de equipe" },
        { inicio: "12:00", fim: "13:30", status: "disponivel" },
        { inicio: "13:30", fim: "15:00", status: "reservado", por: "Carlos", assunto: "Projeto Alfa" },
        { inicio: "15:00", fim: "16:00", status: "disponivel" },
        { inicio: "16:00", fim: "17:00", status: "reservado", por: "Fernanda", assunto: "Revisão de resultados" }
    ];

    horarios.forEach(slot => {
        const div = document.createElement("div");
        div.className = `slot-item ${slot.status}`;
        
        if (slot.status === "reservado") {
            div.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${slot.inicio} - ${slot.fim}</span>
                    <strong style="color: var(--text-main); font-size: 15px;">${slot.assunto}</strong>
                    <span style="font-size: 13px; color: var(--text-muted);">Responsável: ${slot.por}</span>
                </div>
                <button onclick="solicitarNegociacao('${slot.por}')" style="padding: 8px 16px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Negociar / Ver</button>
            `;
        } else {
            div.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${slot.inicio} - ${slot.fim}</span>
                    <span style="color: #10b981; font-weight: 600; font-size: 14px;">● Disponível</span>
                </div>
                <button onclick="abrirModalReserva('${slot.inicio}', '${slot.fim}')" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Reservar</button>
            `;
        }
        container.appendChild(div);
    });
}

function solicitarNegociacao(responsavel) {
    alert(`Este horário já está reservado por ${responsavel}. Entre em contato para negociar a liberação.`);
}

function abrirModalReserva(inicio, fim) {
    const nomeReuniao = prompt(`Deseja reservar o horário das ${inicio} às ${fim}?\nDigite o nome da reunião:`);
    if (nomeReuniao) {
        alert(`Reserva confirmada com sucesso para: ${nomeReuniao}!`);
        carregarAgenda(); // Atualiza a grade em tempo real
    }
}
