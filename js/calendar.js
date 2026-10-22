let dataAtual = new Date(); // Inicia com a data de hoje

document.addEventListener("DOMContentLoaded", () => {
    atualizarTextoData();
    setTimeout(() => { carregarAgenda(); }, 300);
});

// ==========================================
// FUNÇÕES DE NAVEGAÇÃO DE DATAS E BOTÕES
// ==========================================

window.mudarData = function(dias) {
    dataAtual.setDate(dataAtual.getDate() + dias);
    atualizarTextoData();
    
    // Efeito de opacidade para simular o carregamento suave
    const grid = document.getElementById("gridHorarios");
    const prox = document.getElementById("listaProximas");
    if(grid) grid.style.opacity = "0.4";
    if(prox) prox.style.opacity = "0.4";
    
    setTimeout(() => {
        carregarAgenda(); // Recarrega os dados com base na nova data
        if(grid) grid.style.opacity = "1";
        if(prox) prox.style.opacity = "1";
    }, 250); 
};

window.resetarData = function() {
    dataAtual = new Date(); 
    atualizarTextoData();
    carregarAgenda();
};

window.mudarVisualizacao = function(tipo, btnClicado) {
    const botoes = document.querySelectorAll("#viewTogglesGroup button");
    botoes.forEach(btn => btn.classList.remove("active"));
    btnClicado.classList.add("active");
    
    // Removemos a caixa de alerta e criamos a simulação visual!
    const gridContainer = document.getElementById("gridHorarios");
    if (tipo === 'dia') {
        carregarAgenda(); // Mostra a agenda normal
    } else if (tipo === 'semana') {
        gridContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #64748b; font-weight: 500;">📅 A visualização Semanal está em desenvolvimento.</div>`;
    } else if (tipo === 'mes') {
        gridContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #64748b; font-weight: 500;">📆 A visualização Mensal está em desenvolvimento.</div>`;
    }
};

function atualizarTextoData() {
    const spanData = document.getElementById("dataAtualExibicao");
    const divSubtituloGrelha = document.querySelector(".cal-main-header span:nth-child(2)"); 
    
    if (!spanData) return;

    const opcoesCurta = { day: '2-digit', month: 'short', year: 'numeric' };
    let dataCurta = dataAtual.toLocaleDateString('pt-BR', opcoesCurta).replace('.', '');
    spanData.innerText = dataCurta;

    if (divSubtituloGrelha) {
        const opcoesLonga = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
        let dataLonga = dataAtual.toLocaleDateString('pt-BR', opcoesLonga);
        dataLonga = dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1); 
        divSubtituloGrelha.innerText = dataLonga;
    }
}

// ==========================================
// RENDERIZAÇÃO DA AGENDA DINÂMICA
// ==========================================

function obterHorariosSimulados() {
    const diaSemana = dataAtual.getDay(); // 0 (Domingo) a 6 (Sábado)
    
    // Simulação para Fins de Semana
    if (diaSemana === 0 || diaSemana === 6) {
        return [
            { hora: "08:00", inicio: "08:00", fim: "12:00", status: "disponivel", cor: "green" },
            { hora: "14:00", inicio: "14:00", fim: "18:00", status: "disponivel", cor: "green" }
        ];
    }
    
    // Simulação para Terças e Quintas
    if (diaSemana === 2 || diaSemana === 4) { 
        return [
            { hora: "08:00", inicio: "08:00", fim: "09:30", status: "disponivel", cor: "green" },
            { hora: "09:30", inicio: "09:30", fim: "11:30", status: "reservado", titulo: "Reunião de Diretoria", responsavel: "Mariana Silva", tipo: "Reunião", cor: "purple" },
            { hora: "12:00", inicio: "12:00", fim: "14:00", status: "disponivel", cor: "green" },
            { hora: "14:00", inicio: "14:00", fim: "17:00", status: "reservado", titulo: "Treinamento de Vendas", responsavel: "Equipe RH", tipo: "Workshop", cor: "blue" }
        ];
    }

    // Padrão Original (Segunda, Quarta, Sexta)
    return [
        { hora: "07:00", inicio: "07:00", fim: "07:30", status: "disponivel", cor: "green" },
        { hora: "08:00", inicio: "07:30", fim: "10:00", status: "reservado", titulo: "Planejamento Estratégico", responsavel: "Alex", tipo: "Reunião", cor: "blue" },
        { hora: "10:00", inicio: "10:00", fim: "11:00", status: "disponivel", cor: "green" },
        { hora: "11:00", inicio: "11:00", fim: "12:00", status: "reservado", titulo: "Reunião de equipe", responsavel: "Bruna", tipo: "Reunião", cor: "blue" },
        { hora: "12:00", inicio: "12:00", fim: "13:30", status: "disponivel", cor: "green" },
        { hora: "14:00", inicio: "13:30", fim: "15:00", status: "reservado", titulo: "Projeto Alfa", responsavel: "Carlos", tipo: "Reunião", cor: "purple" },
        { hora: "16:00", inicio: "15:00", fim: "16:00", status: "disponivel", cor: "green" },
        { hora: "17:00", inicio: "16:00", fim: "17:00", status: "reservado", titulo: "Revisão de resultados", responsavel: "Fernanda", tipo: "Reunião", cor: "blue" }
    ];
}

function carregarAgenda() {
    const gridContainer = document.getElementById("gridHorarios");
    const proxContainer = document.getElementById("listaProximas");
    
    if (!gridContainer || !proxContainer) return;

    gridContainer.innerHTML = "";
    proxContainer.innerHTML = "";

    const horarios = obterHorariosSimulados();
    let reservasCount = 0;

    horarios.forEach(slot => {
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
            
            // Adicionar à barra de Próximas Reservas (Direita)
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
            reservasCount++;
            
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

    if (reservasCount === 0) {
        proxContainer.innerHTML = `<div style="font-size: 13px; color: #94a3b8;">Sem reservas para este dia.</div>`;
    }
}

window.abrirModalReserva = function(inicio, fim) {
    const dataFormatada = document.getElementById("dataAtualExibicao").innerText;
    const nomeReuniao = prompt(`Nova Reserva em: ${dataFormatada}\nHorário: ${inicio} às ${fim}\nQual o nome da reunião?`);
    if (nomeReuniao) {
        alert(`Sucesso! "${nomeReuniao}" foi agendada.`);
    }
};
