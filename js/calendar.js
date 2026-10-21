// Exemplo estruturado de controle de horários e prevenção de conflitos
document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    carregarAgenda();
});

function carregarAgenda() {
    const salaId = document.getElementById("salaSelect").value;
    const container = document.getElementById("gridHorarios");
    container.innerHTML = "";

    // Simulação de horários do dia (07:00 às 18:00)
    const horarios = [
        { inicio: "07:00", fim: "07:30", status: "disponivel" },
        { inicio: "07:30", fim: "10:00", status: "reservado", por: "Alex", assunto: "Planejamento Estratégico" },
        { inicio: "10:00", fim: "11:00", status: "disponivel" },
        { inicio: "11:00", fim: "12:00", status: "reservado", por: "Bruna", assunto: "Reunião de equipe" }
    ];

    horarios.forEach(slot => {
        const div = document.createElement("div");
        div.className = `slot-item ${slot.status}`;
        
        if (slot.status === "reservado") {
            div.innerHTML = `
                <span>${slot.inicio} - ${slot.fim}</span>
                <strong>${slot.assunto} (${slot.por})</strong>
                <button onclick="solicitarNegociacao('${slot.por}')">Negociar / Ver</button>
            `;
        } else {
            div.innerHTML = `
                <span>${slot.inicio} - ${slot.fim}</span>
                <span class="status-livre">Disponível</span>
                <button onclick="abrirModalReserva('${slot.inicio}', '${slot.fim}')">Reservar</button>
            `;
        }
        container.appendChild(div);
    });
}

function solicitarNegociacao(responsavel) {
    alert(`Este horário já está reservado por ${responsavel}. Entre em contato para negociar a liberação ou solicite ao Administrador.`);
}

function abrirModalReserva(inicio, fim) {
    const nomeReuniao = prompt(`Deseja reservar o horário das ${inicio} às ${fim}?\nDigite o nome da reunião:`);
    if (nomeReuniao) {
        alert(`Reserva confirmada com sucesso para: ${nomeReuniao}!`);
        carregarAgenda(); // Atualiza a grade em tempo real
    }
}
