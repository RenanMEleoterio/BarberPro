// Configuração da API
const API_BASE_URL = 'https://5000-ijmdl4waa9fls869qb8uw-0cf01204.manusvm.computer/api';

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
    document.getElementById('loginTitle').textContent = `Login - ${userType}`;
}

function showRegisterForm(userType) {
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
    } else if (userType === 'gerente') {
        title.textContent = 'Cadastrar Nova Barbearia';
        form.innerHTML = `
            <div class="form-group">
                <label for="nomeBarbearia">Nome da Barbearia:</label>
                <input type="text" id="nomeBarbearia" name="nomeBarbearia" required>
            </div>
            
            <div class="form-group">
                <label for="endereco">Endereço:</label>
                <input type="text" id="endereco" name="endereco" required>
            </div>
            
            <div class="form-group">
                <label for="telefone">Telefone:</label>
                <input type="tel" id="telefone" name="telefone" required>
            </div>
            
            <div class="form-group">
                <label for="emailBarbearia">Email da Barbearia:</label>
                <input type="email" id="emailBarbearia" name="emailBarbearia" required>
            </div>
            
            <div class="form-group">
                <label for="nomeGerente">Nome do Gerente:</label>
                <input type="text" id="nomeGerente" name="nomeGerente" required>
            </div>
            
            <div class="form-group">
                <label for="emailGerente">Email do Gerente:</label>
                <input type="email" id="emailGerente" name="emailGerente" required>
            </div>
            
            <div class="form-group">
                <label for="senhaGerente">Senha do Gerente:</label>
                <input type="password" id="senhaGerente" name="senhaGerente" required>
            </div>
            
            <button type="submit" class="btn-primary">Criar Barbearia</button>
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

function closeBarbeariaSuccessModal() {
    document.getElementById('barbeariaSuccessModal').style.display = 'none';
}

// Função para copiar código
function copyInviteCode() {
    const codeElement = document.getElementById('inviteCode');
    const code = codeElement.textContent;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            const button = document.querySelector('#barbeariaSuccessModal .btn-copy');
            const originalText = button.textContent;
            button.textContent = '✅ Copiado!';
            button.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
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
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();
        
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
        console.error('Erro na requisição de login:', error);
        showMessage('Erro de conexão. Tente novamente.');
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

            response = await fetch(`${API_BASE_URL}/auth/register`, {
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

            response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(barbeiroData)
            });
        } else if (currentRegisterType === 'gerente') {
            const barbeariaData = {
                nome: formData.get('nomeBarbearia'),
                endereco: formData.get('endereco'),
                telefone: formData.get('telefone'),
                email: formData.get("emailBarbearia"),
                nomeGerente: formData.get('nomeGerente'),
                emailGerente: formData.get('emailGerente'),
                senhaGerente: formData.get('senhaGerente')
            };

            response = await fetch(`${API_BASE_URL}/auth/cadastro-barbearia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(barbeariaData)
            });
        }

        const result = await response.json();
        
        if (response.ok) {
            if (currentRegisterType === 'gerente') {
                // Mostrar modal de sucesso com código de convite
                document.getElementById('inviteCode').textContent = result.codigoConvite;
                closeRegisterModal();
                document.getElementById('barbeariaSuccessModal').style.display = 'block';
            } else {
                // Salvar dados do usuário e redirecionar
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result));
                currentUser = result;
                
                showMessage('Cadastro realizado com sucesso!', 'success');
                
                setTimeout(() => {
                    closeRegisterModal();
                    redirectToDashboard(result.tipoUsuario);
                }, 1500);
            }
        } else {
            showMessage(result.message || 'Erro ao fazer cadastro');
        }
    } catch (error) {
        console.error('Erro na requisição de cadastro:', error);
        showMessage('Erro de conexão. Tente novamente.');
    }
}

function handleBarbeariaRegister() {
    showRegisterForm('gerente');
}

function continueToDashboard() {
    closeBarbeariaSuccessModal();
    window.location.href = 'gerente-dashboard.html';
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

    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const barbeariaModal = document.getElementById('barbeariaSuccessModal');
        
        if (event.target === loginModal) {
            closeLoginModal();
        }
        if (event.target === registerModal) {
            closeRegisterModal();
        }
        if (event.target === barbeariaModal) {
            closeBarbeariaSuccessModal();
        }
    });
});

