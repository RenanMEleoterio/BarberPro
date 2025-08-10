// Configuração da API
const API_BASE_URL = 'https://5000-ivevl7nqegw0u0r4mrbj3-0cf01204.manusvm.computer';

// Variáveis globais
let barbeariaId = null;
let codigoConvite = null;

// Função para mostrar mensagens
function showMessage(message, type = 'error') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        ${type === 'success' ? 'background-color: #28a745;' : 'background-color: #dc3545;'}
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Função para obter parâmetros da URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Função para inicializar o dashboard
function initializeDashboard() {
    // Obter ID da barbearia da URL ou localStorage
    barbeariaId = getUrlParameter('barbeariaId') || localStorage.getItem('barbeariaId');
    codigoConvite = localStorage.getItem('codigoConvite');
    
    if (!barbeariaId) {
        showMessage('ID da barbearia não encontrado. Redirecionando...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Carregar dados da barbearia
    loadBarbeariaData();
}

// Função para carregar dados da barbearia
async function loadBarbeariaData() {
    try {
        // Por enquanto, usar dados do localStorage
        // Em uma implementação completa, faria uma requisição para obter os dados da barbearia
        
        if (codigoConvite) {
            document.getElementById('codigoConviteDisplay').value = codigoConvite;
        }
        
        // Atualizar nome da barbearia (placeholder)
        document.getElementById('barbeariaName').textContent = 'Dashboard da Barbearia';
        document.getElementById('statusBarbearia').textContent = 'Barbearia criada com sucesso';
        
    } catch (error) {
        console.error('Erro ao carregar dados da barbearia:', error);
        showMessage('Erro ao carregar dados da barbearia');
    }
}

// Funções de modal
function showGerenteModal() {
    document.getElementById('gerenteModal').style.display = 'block';
}

function closeGerenteModal() {
    document.getElementById('gerenteModal').style.display = 'none';
}

// Função para copiar código de convite
function copyCodigoConvite() {
    const codeElement = document.getElementById('codigoConviteDisplay');
    const code = codeElement.value;
    
    if (!code) {
        showMessage('Código de convite não disponível');
        return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            const button = document.querySelector('.btn-copy');
            const originalText = button.textContent;
            button.textContent = '✅ Copiado!';
            button.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '#d4af37';
            }, 2000);
        }).catch(() => {
            fallbackCopyTextToClipboard(code);
        });
    } else {
        fallbackCopyTextToClipboard(code);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('Código copiado!', 'success');
    } catch (err) {
        showMessage('Erro ao copiar código');
    }
    
    document.body.removeChild(textArea);
}

// Handler para cadastro de gerente
async function handleGerenteRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const gerenteData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        senha: formData.get('senha'),
        barbeariaId: parseInt(barbeariaId)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/cadastro-gerente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gerenteData)
        });

        const result = await response.json();
        
        if (response.ok) {
            showMessage('Gerente cadastrado com sucesso!', 'success');
            closeGerenteModal();
            
            // Limpar formulário
            document.getElementById('gerenteForm').reset();
            
            // Atualizar status
            document.getElementById('statusBarbearia').textContent = 'Gerente cadastrado - Barbearia configurada';
            
        } else {
            showMessage(result.message || 'Erro ao cadastrar gerente');
        }
    } catch (error) {
        console.error('Erro na requisição de cadastro do gerente:', error);
        showMessage('Erro de conexão. Tente novamente.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar dashboard
    initializeDashboard();
    
    // Formulário de gerente
    const gerenteForm = document.getElementById('gerenteForm');
    if (gerenteForm) {
        gerenteForm.addEventListener('submit', handleGerenteRegister);
    }
    
    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        const gerenteModal = document.getElementById('gerenteModal');
        
        if (event.target === gerenteModal) {
            closeGerenteModal();
        }
    });
});
