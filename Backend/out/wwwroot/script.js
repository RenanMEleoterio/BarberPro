// Configuração da API
const API_BASE_URL = 'https://5000-its3wwx7cjrkd95okkecn-8444f3f7.manusvm.computer/api';

// Estado global
let currentUserType = '';
let currentUser = null;

// Elementos do DOM
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const barbeariaModal = document.getElementById('barbeariaModal');
const successModal = document.getElementById('successModal');

// Funções de Modal
function showLoginForm(userType) {
    currentUserType = userType;
    const modalTitle = document.getElementById('modalTitle');
    const registerLink = document.getElementById('registerLink');
    const createBarbeariaLink = document.getElementById('createBarbeariaLink');
    const codigoConviteGroup = document.getElementById('codigoConviteGroup');
    
    // Configurar título e opções baseado no tipo de usuário
    switch(userType) {
        case 'cliente':
            modalTitle.textContent = 'Login - Cliente';
            registerLink.style.display = 'block';
            createBarbeariaLink.style.display = 'none';
            codigoConviteGroup.style.display = 'none';
            break;
        case 'barbeiro':
            modalTitle.textContent = 'Login - Barbeiro';
            registerLink.style.display = 'block';
            createBarbeariaLink.style.display = 'none';
            codigoConviteGroup.style.display = 'none';
            break;
        case 'gerente':
            modalTitle.textContent = 'Login - Gerente';
            registerLink.style.display = 'none';
            createBarbeariaLink.style.display = 'block';
            codigoConviteGroup.style.display = 'none';
            break;
    }
    
    loginModal.style.display = 'block';
}

function closeModal() {
    loginModal.style.display = 'none';
    clearForm('loginForm');
}

function showRegisterForm() {
    loginModal.style.display = 'none';
    
    const registerTitle = document.getElementById('registerTitle');
    const barbeiroFields = document.querySelector('.barbeiro-fields');
    
    if (currentUserType === 'barbeiro') {
        registerTitle.textContent = 'Cadastro - Barbeiro';
        barbeiroFields.style.display = 'block';
        document.getElementById('regCodigoConvite').required = true;
    } else {
        registerTitle.textContent = 'Cadastro - Cliente';
        barbeiroFields.style.display = 'none';
        document.getElementById('regCodigoConvite').required = false;
    }
    
    registerModal.style.display = 'block';
}

function closeRegisterModal() {
    registerModal.style.display = 'none';
    clearForm('registerForm');
}

function showBarbeariaForm() {
    loginModal.style.display = 'none';
    barbeariaModal.style.display = 'block';
}

function closeBarbeariaModal() {
    barbeariaModal.style.display = 'none';
    clearForm('barbeariaForm');
}

function closeSuccessModal() {
    successModal.style.display = 'none';
    // Redirecionar para o dashboard apropriado
    if (currentUser) {
        redirectToDashboard(currentUser.tipoUsuario);
    }
}

function backToLogin() {
    registerModal.style.display = 'none';
    barbeariaModal.style.display = 'none';
    showLoginForm(currentUserType);
}

// Função para limpar formulários
function clearForm(formId) {
    document.getElementById(formId).reset();
    removeMessages();
}

// Função para mostrar mensagens
function showMessage(message, type = 'error') {
    removeMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    // Adicionar a mensagem no início do formulário ativo
    const activeModal = document.querySelector('.modal[style*="block"]');
    if (activeModal) {
        const form = activeModal.querySelector('form');
        form.insertBefore(messageDiv, form.firstChild);
    }
}

function removeMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.remove());
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', handleLogin);
document.getElementById('registerForm').addEventListener('submit', handleRegister);
document.getElementById('barbeariaForm').addEventListener('submit', handleBarbeariaRegister);

// Fechar modal clicando fora
window.addEventListener('click', function(event) {
    if (event.target === loginModal) closeModal();
    if (event.target === registerModal) closeRegisterModal();
    if (event.target === barbeariaModal) closeBarbeariaModal();
    if (event.target === successModal) closeSuccessModal();
});

// Funções de API
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        senha: formData.get('senha')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Verificar se o tipo de usuário corresponde
            if (result.tipoUsuario.toLowerCase() !== currentUserType) {
                showMessage(`Este usuário não é um ${currentUserType}. Tente fazer login na seção correta.`);
                return;
            }
            
            // Salvar dados do usuário
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result));
            currentUser = result;
            
            showMessage('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                closeModal();
                redirectToDashboard(result.tipoUsuario);
            }, 1500);
            
        } else {
            showMessage(result.message || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro de conexão. Tente novamente.');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    let endpoint = '';
    let registerData = {};
    
    if (currentUserType === 'cliente') {
        endpoint = '/auth/cadastro-cliente';
        registerData = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            senha: formData.get('senha')
        };
    } else if (currentUserType === 'barbeiro') {
        endpoint = '/auth/cadastro-barbeiro';
        registerData = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            senha: formData.get('senha'),
            codigoConvite: formData.get('codigoConvite'),
            especialidades: formData.get('especialidades'),
            descricao: formData.get('descricao')
        };
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Salvar dados do usuário
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result));
            currentUser = result;
            
            showMessage('Cadastro realizado com sucesso!', 'success');
            
            setTimeout(() => {
                closeRegisterModal();
                redirectToDashboard(result.tipoUsuario);
            }, 1500);
            
        } else {
            showMessage(result.message || 'Erro ao fazer cadastro');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro de conexão. Tente novamente.');
    }
}

async function handleBarbeariaRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const barbeariaData = {
        nome: formData.get('nome'),
        endereco: formData.get('endereco'),
        telefone: formData.get('telefone'),
        email: formData.get('email'),
        nomeGerente: formData.get('nomeGerente'),
        emailGerente: formData.get('emailGerente'),
        senhaGerente: formData.get('senhaGerente')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/cadastro-barbearia`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(barbeariaData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Salvar dados do usuário
            localStorage.setItem('token', result.gerente.token);
            localStorage.setItem('user', JSON.stringify(result.gerente));
            currentUser = result.gerente;
            
            // Mostrar modal de sucesso com código de convite
            document.getElementById('successContent').innerHTML = `
                <div class="success-info">
                    <h3>Barbearia "${result.nomeBarbearia}" criada com sucesso!</h3>
                    <p><strong>Código de Convite para Barbeiros:</strong></p>
                    <div class="codigo-convite">${result.codigoConvite}</div>
                    <p><small>Compartilhe este código com seus barbeiros para que eles possam se cadastrar na plataforma.</small></p>
                </div>
            `;
            
            closeBarbeariaModal();
            successModal.style.display = 'block';
            
        } else {
            showMessage(result.message || 'Erro ao criar barbearia');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro de conexão. Tente novamente.');
    }
}

// Função para redirecionar para o dashboard
function redirectToDashboard(tipoUsuario) {
    switch(tipoUsuario.toLowerCase()) {
        case 'cliente':
            window.location.href = 'cliente-dashboard.html';
            break;
        case 'barbeiro':
            window.location.href = 'barbeiro-dashboard.html';
            break;
        case 'gerente':
            window.location.href = 'gerente-dashboard.html';
            break;
        default:
            console.error('Tipo de usuário desconhecido:', tipoUsuario);
    }
}

// Verificar se já está logado
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        redirectToDashboard(currentUser.tipoUsuario);
    }
}

// Verificar autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', checkAuth);

