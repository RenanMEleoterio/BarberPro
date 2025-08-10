const API_BASE_URL = 'https://5000-is488tjmsi2rao7bi8b82-557558dc.manusvm.computer';

// Variáveis globais
let currentUser = null;
let currentRegisterType = 'cliente';

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

// Função para redirecionar para o dashboard
function redirectToDashboard(tipoUsuario) {
    const dashboards = {
        'Cliente': 'cliente-dashboard.html',
        'Barbeiro': 'barbeiro-dashboard.html',
        'Gerente': 'gerente-dashboard.html'
    };
    
    const dashboard = dashboards[tipoUsuario];
    if (dashboard) {
        window.location.href = dashboard;
    }
}

// Funções de modal
function showLoginForm(userType) {
    currentRegisterType = userType;
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById("modalTitle").textContent = `Login - ${userType}`;
    
    // Atualizar o link de cadastro baseado no tipo de usuário
    const registerLink = document.getElementById("registerLink");
    if (userType === "gerente") {
        registerLink.innerHTML = 
            `<a href="#" id="createBarbeariaLink">Criar nova barbearia</a>`;
    } else if (userType === "barbeiro") {
        registerLink.innerHTML = 
            `<a href="#" id="registerBarbeiroLink">Não tem conta? Cadastre-se</a>`;
    } else {
        registerLink.innerHTML = 
            `<a href="#" id="registerClienteLink">Não tem conta? Cadastre-se</a>`;
    }
}

function showRegisterForm(userType) {
    console.log('showRegisterForm called with userType:', userType);
    currentRegisterType = userType;
    const modal = document.getElementById('registerModal');
    const title = document.getElementById('registerTitle');
    const form = document.getElementById('registerForm');

    // Limpar formulário
    form.innerHTML = '';

    if (userType === 'cliente') {
        title.textContent = 'Cadastro - Cliente';
        form.innerHTML = `
            <div class="form-group">
                <label for="clienteNome">Nome:</label>
                <input type="text" id="clienteNome" name="nome" required>
            </div>
            
            <div class="form-group">
                <label for="clienteEmail">Email:</label>
                <input type="email" id="clienteEmail" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="clienteSenha">Senha:</label>
                <input type="password" id="clienteSenha" name="senha" required>
            </div>
            
            <button type="submit" class="btn-primary">Cadastrar</button>
        `;
    } else if (userType === 'barbeiro') {
        title.textContent = 'Cadastro - Barbeiro';
        form.innerHTML = `
            <div class="form-group">
                <label for="barbeiroNome">Nome:</label>
                <input type="text" id="barbeiroNome" name="nome" required>
            </div>
            
            <div class="form-group">
                <label for="barbeiroEmail">Email:</label>
                <input type="email" id="barbeiroEmail" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="barbeiroSenha">Senha:</label>
                <input type="password" id="barbeiroSenha" name="senha" required>
            </div>
            
            <div class="form-group">
                <label for="codigoConvite">Código de Convite:</label>
                <input type="text" id="codigoConvite" name="codigoConvite" placeholder="Ex: BARB1234" required>
            </div>
            
            <div class="form-group">
                <label for="especialidades">Especialidades:</label>
                <input type="text" id="especialidades" name="especialidades" placeholder="Ex: Corte masculino, Barba">
            </div>
            
            <div class="form-group">
                <label for="descricao">Descrição:</label>
                <textarea id="descricao" name="descricao" placeholder="Conte um pouco sobre você..."></textarea>
            </div>
            
            <button type="submit" class="btn-primary">Cadastrar</button>
        `;
    }
    
    modal.style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function closeBarbeariaModal() {
    document.getElementById('barbeariaModal').style.display = 'none';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

function backToLogin() {
    closeRegisterModal();
    closeBarbeariaModal();
    showLoginForm(currentRegisterType);
}

// Função para copiar código
function copyCodigoConvite() {
    const codeElement = document.getElementById('codigoConviteDisplay');
    const code = codeElement.value;
    
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

// Handlers de formulário
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        senha: formData.get('senha'),
        tipoUsuario: currentRegisterType
    };

    try {
        console.log('Attempting login with data:', loginData);
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();
        console.log("Login response status:", response.status);
        console.log("Login response data:", result);
        
        if (response.ok) {
            // Salvar dados do usuário
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result));
            currentUser = result;
            
            showMessage('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                closeLoginModal();
                redirectToDashboard(result.tipoUsuario);
            }, 1500);
            
        } else {
            showMessage(result.message || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error("Erro na requisição de login:", error);
        if (error instanceof TypeError) {
            console.error("Provável erro de rede ou CORS.");
        } else if (error.response) {
            console.error("Erro de resposta do servidor:", error.response.status, error.response.data);
        } else {
            console.error("Erro desconhecido:", error.message);
        }
        showMessage("Erro de conexão. Tente novamente.");
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    let response;

    try {
        if (currentRegisterType === 'cliente') {
            const clienteData = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                senha: formData.get('senha'),
                tipoUsuario: 'Cliente'
            };

            response = await fetch(`${API_BASE_URL}/api/auth/cadastro-cliente`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clienteData)
            });
        } else if (currentRegisterType === 'barbeiro') {
            const barbeiroData = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                senha: formData.get('senha'),
                codigoConvite: formData.get('codigoConvite'),
                especialidades: formData.get('especialidades'),
                descricao: formData.get('descricao'),
                tipoUsuario: 'Barbeiro'
            };

            response = await fetch(`${API_BASE_URL}/api/auth/cadastro-barbeiro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(barbeiroData)
            });
        }

        const result = await response.json();
        
        if (response.ok) {
            // Salvar dados do usuário e redirecionar
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
        console.error('Erro na requisição de cadastro:', error);
        showMessage('Erro de conexão. Tente novamente.');
    }
}

async function handleBarbeariaRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const barbeariaData = {
        nome: formData.get("nome"),
        endereco: formData.get("endereco"),
        telefone: formData.get("telefone"),
        email: formData.get("email")
    };

    try {
        console.log('Attempting barbearia register with data:', barbeariaData);
        const response = await fetch(`${API_BASE_URL}/api/auth/cadastro-barbearia`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(barbeariaData)
        });

        const result = await response.json();
        console.log("Barbearia register response status:", response.status);
        console.log("Barbearia register response data:", result);
        
        if (response.ok) {
            // Redirecionar para o dashboard da barbearia com o ID da barbearia
            closeBarbeariaModal();
            localStorage.setItem("barbeariaId", result.barbeariaId);
            localStorage.setItem("codigoConvite", result.codigoConvite);
            window.location.href = `barbearia-dashboard.html?barbeariaId=${result.barbeariaId}`;
        } else {
            showMessage(result.message || "Erro ao fazer cadastro da barbearia");
        }
    } catch (error) {
        console.error("Erro na requisição de cadastro da barbearia:", error);
        if (error instanceof TypeError) {
            console.error("Provável erro de rede ou CORS.");
        } else if (error.response) {
            console.error("Erro de resposta do servidor:", error.response.status, error.response.data);
        } else {
            console.error("Erro desconhecido:", error.message);
        }
        showMessage("Erro de conexão. Tente novamente.");
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Formulário de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Formulário de barbearia
    const barbeariaForm = document.getElementById('barbeariaForm');
    if (barbeariaForm) {
        barbeariaForm.addEventListener('submit', handleBarbeariaRegister);
    }

    // Event listeners para links de cadastro
    document.addEventListener('click', function(event) {
        if (event.target && event.target.id === 'registerClienteLink') {
            event.preventDefault();
            showRegisterForm('cliente');
        }
        if (event.target && event.target.id === 'registerBarbeiroLink') {
            event.preventDefault();
            showRegisterForm('barbeiro');
        }
        if (event.target && event.target.id === 'createBarbeariaLink') {
            event.preventDefault();
            closeLoginModal();
            document.getElementById('barbeariaModal').style.display = 'block';
        }
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const barbeariaModal = document.getElementById('barbeariaModal');
        const successModal = document.getElementById('successModal');
        
        if (event.target === loginModal) {
            closeLoginModal();
        }
        if (event.target === registerModal) {
            closeRegisterModal();
        }
        if (event.target === barbeariaModal) {
            closeBarbeariaModal();
        }
        if (event.target === successModal) {
            closeSuccessModal();
        }
    });
});

