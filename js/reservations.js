document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    carregarMinhasReservas();
});

function carregarMinhasReservas() {
    const container = document.getElementById("listaMinhasReservas");
    container.innerHTML = `
        <div class="slot-item reservado">
            <div>
                <strong>Planejamento Estratégico</strong>
                <p>28/10/2025 • 07:30 - 10:00 (Sala de Reuniões 01)</p>
            </div>
            <button onclick="cancelarReserva(1)">Cancelar Reserva</button>
        </div>
    `;
}

function cancelarReserva(id) {
    if (confirm("Tem certeza que deseja cancelar esta reserva? O horário ficará livre para outros usuários.")) {
        alert("Reserva cancelada com sucesso!");
        carregarMinhasReservas();
    }
}
