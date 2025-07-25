// Agenda Semanal - Funcionalidades JavaScript
class AgendaSemanal {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            horaInicio: options.horaInicio || 8,
            horaFim: options.horaFim || 19,
            intervalo: options.intervalo || 30, // minutos
            diasSemana: options.diasSemana || ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'],
            modo: options.modo || 'visualizacao', // 'visualizacao' ou 'selecao'
            agendamentos: options.agendamentos || [],
            onHorarioSelecionado: options.onHorarioSelecionado || null,
            barbeiroId: options.barbeiroId || null,
            semanaAtual: options.semanaAtual || this.getSemanAtual()
        };
        
        this.horarioSelecionado = null;
        this.init();
    }

    getSemanAtual() {
        const hoje = new Date();
        const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.
        const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
        const segunda = new Date(hoje);
        segunda.setDate(hoje.getDate() + diasParaSegunda);
        return segunda;
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        const html = `
            <div class="agenda-semanal">
                <div class="agenda-header">
                    <h3 class="agenda-title">
                        ${this.options.modo === 'selecao' ? 'Selecione um Horário' : 'Agenda da Semana'}
                        <span class="semana-info">${this.formatarSemana()}</span>
                    </h3>
                </div>
                <table class="agenda-table">
                    <thead>
                        <tr>
                            <th>HORA</th>
                            ${this.options.diasSemana.map(dia => `<th>${dia}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderHorarios()}
                    </tbody>
                </table>
                ${this.renderLegenda()}
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    formatarSemana() {
        const inicio = new Date(this.options.semanaAtual);
        const fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 4); // sexta-feira
        
        const formatarData = (data) => {
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        };
        
        return `(${formatarData(inicio)} - ${formatarData(fim)})`;
    }

    renderHorarios() {
        let html = '';
        const totalMinutos = (this.options.horaFim - this.options.horaInicio) * 60;
        const totalSlots = totalMinutos / this.options.intervalo;

        for (let i = 0; i < totalSlots; i++) {
            const minutoAtual = this.options.horaInicio * 60 + (i * this.options.intervalo);
            const hora = Math.floor(minutoAtual / 60);
            const minuto = minutoAtual % 60;
            const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

            html += '<tr>';
            html += `<td>${horaFormatada}</td>`;

            for (let dia = 0; dia < this.options.diasSemana.length; dia++) {
                const dataSlot = this.getDataSlot(dia, hora, minuto);
                const agendamento = this.getAgendamentoPorSlot(dataSlot);
                const cssClass = this.getCssClassPorSlot(dataSlot, agendamento);
                const conteudo = this.getConteudoSlot(agendamento);
                
                html += `<td class="${cssClass}" data-dia="${dia}" data-hora="${hora}" data-minuto="${minuto}" data-data="${dataSlot.toISOString()}">${conteudo}</td>`;
            }

            html += '</tr>';
        }

        return html;
    }

    getDataSlot(dia, hora, minuto) {
        const data = new Date(this.options.semanaAtual);
        data.setDate(data.getDate() + dia);
        data.setHours(hora, minuto, 0, 0);
        return data;
    }

    getAgendamentoPorSlot(dataSlot) {
        return this.options.agendamentos.find(agendamento => {
            const dataAgendamento = new Date(agendamento.dataHora);
            return dataAgendamento.getTime() === dataSlot.getTime() &&
                   (!this.options.barbeiroId || agendamento.barbeiroId === this.options.barbeiroId);
        });
    }

    getCssClassPorSlot(dataSlot, agendamento) {
        const agora = new Date();
        const classes = [];

        if (dataSlot < agora) {
            classes.push('horario-passado');
        } else if (agendamento) {
            if (this.options.modo === 'visualizacao') {
                classes.push('horario-agendado');
            } else {
                classes.push('horario-ocupado');
            }
        } else {
            classes.push('horario-disponivel');
        }

        return classes.join(' ');
    }

    getConteudoSlot(agendamento) {
        if (agendamento) {
            if (this.options.modo === 'visualizacao') {
                return agendamento.clienteNome || 'Agendado';
            } else {
                return 'Ocupado';
            }
        }
        return '';
    }

    renderLegenda() {
        if (this.options.modo === 'selecao') {
            return `
                <div class="agenda-legenda">
                    <div class="legenda-item">
                        <div class="legenda-cor disponivel"></div>
                        <span>Disponível</span>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-cor ocupado"></div>
                        <span>Ocupado</span>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-cor selecionado"></div>
                        <span>Selecionado</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="agenda-legenda">
                    <div class="legenda-item">
                        <div class="legenda-cor disponivel"></div>
                        <span>Livre</span>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-cor agendado"></div>
                        <span>Agendado</span>
                    </div>
                </div>
            `;
        }
    }

    attachEvents() {
        if (this.options.modo === 'selecao') {
            this.container.addEventListener('click', (e) => {
                const td = e.target.closest('td');
                if (td && td.classList.contains('horario-disponivel')) {
                    this.selecionarHorario(td);
                }
            });
        }
    }

    selecionarHorario(td) {
        // Remover seleção anterior
        const selecionadoAnterior = this.container.querySelector('.horario-selecionado');
        if (selecionadoAnterior) {
            selecionadoAnterior.classList.remove('horario-selecionado');
            selecionadoAnterior.classList.add('horario-disponivel');
        }

        // Adicionar nova seleção
        td.classList.remove('horario-disponivel');
        td.classList.add('horario-selecionado');

        // Armazenar horário selecionado
        this.horarioSelecionado = {
            dia: parseInt(td.dataset.dia),
            hora: parseInt(td.dataset.hora),
            minuto: parseInt(td.dataset.minuto),
            data: new Date(td.dataset.data)
        };

        // Callback
        if (this.options.onHorarioSelecionado) {
            this.options.onHorarioSelecionado(this.horarioSelecionado);
        }
    }

    getHorarioSelecionado() {
        return this.horarioSelecionado;
    }

    atualizarAgendamentos(novosAgendamentos) {
        this.options.agendamentos = novosAgendamentos;
        this.render();
        this.attachEvents();
    }

    proximaSemana() {
        const novaSemana = new Date(this.options.semanaAtual);
        novaSemana.setDate(novaSemana.getDate() + 7);
        this.options.semanaAtual = novaSemana;
        this.render();
        this.attachEvents();
    }

    semanaAnterior() {
        const novaSemana = new Date(this.options.semanaAtual);
        novaSemana.setDate(novaSemana.getDate() - 7);
        this.options.semanaAtual = novaSemana;
        this.render();
        this.attachEvents();
    }
}

// Função utilitária para criar agenda
function criarAgendaSemanal(containerId, options) {
    return new AgendaSemanal(containerId, options);
}

