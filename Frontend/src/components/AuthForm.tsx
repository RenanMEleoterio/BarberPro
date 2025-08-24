import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "client" as "client" | "barber" | "manager",
    barbershopCode: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const { signIn, signUp, signUpBarber, signUpBarbershop } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validação de email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido.';
    }

    // Validação de senha
    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!isLogin) {
      // Validação de nome
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
      }

      // Validação de código de convite para barbeiros
      if (formData.role === 'barber' && !formData.barbershopCode.trim()) {
        newErrors.barbershopCode = 'Código de convite é obrigatório para barbeiros';
      }

      // Validação de endereço e telefone para gerentes
      if (formData.role === 'manager') {
        if (!formData.address.trim()) {
          newErrors.address = 'Endereço é obrigatório para barbearias';
        }
        // Validação de telefone para gerentes (ajustado para o formato esperado pelo backend)
        if (!formData.phone.trim()) {
          newErrors.phone = 'Telefone é obrigatório para barbearias';
        } else if (!/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(formData.phone)) {
          newErrors.phone = 'Formato de telefone inválido.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let user;
      if (isLogin) {
        user = await signIn(formData.email, formData.password);
        toast.success('Login realizado com sucesso!');
      } else {
        if (formData.role === 'barber') {
          user = await signUpBarber(formData.email, formData.password, formData.name, formData.barbershopCode);
        } else if (formData.role === 'manager') {
          user = await signUpBarbershop(formData.name, formData.address, formData.phone, formData.email, formData.password);
        } else {
          user = await signUp(formData.email, formData.password, formData.name, 'client');
        }
        toast.success('Conta criada com sucesso!');
      }

      // Redirecionar baseado no role do usuário
      if (user) {
        switch (user.role) {
          case 'client':
            navigate('/client');
            break;
          case 'barber':
            navigate('/barber');
            break;
          case 'manager':
            navigate('/manager');
            break;
          default:
            navigate('/client');
        }
      }
    } catch (error: any) {
      console.error('Erro no formulário:', error);
      
      // Tratar erros específicos do backend
      if (error.message && typeof error.message === 'string') {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.field && errorData.message) {
            setErrors({ [errorData.field]: errorData.message });
            toast.error(errorData.message);
          } else {
            toast.error(errorData.message || 'Erro ao processar solicitação');
          }
        } catch {
          // Se não conseguir fazer parse, usar a mensagem como está
          toast.error(error.message);
        }
      } else {
        toast.error('Erro ao processar solicitação');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors[field] || '';
  };

  const hasFieldError = (field: string) => {
    return !!errors[field];
  };

  const handleGoogleSignIn = () => {
    toast.error('Funcionalidade do Google OAuth em desenvolvimento. Para ativar completamente, é necessário configurar as credenciais do Google Cloud Console.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full sm:max-w-lg lg:max-w-xl">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scissors className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
            <span className="text-2xl sm:text-3xl font-bold text-white">BarberPro</span>
          </div>
          <p className="text-sm sm:text-base text-gray-400">Sistema de Gerenciamento de Barbearias</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.role === 'manager' ? 'Nome da Barbearia' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      hasFieldError('name') || hasFieldError('nome') 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={formData.role === 'manager' ? 'Nome da Barbearia' : 'Seu nome completo'}
                  />
                  {(getFieldError("name") || getFieldError("nome")) && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError("name") || getFieldError("nome")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.role === 'manager' ? 'Nome da Barbearia' : 'Nome Completo'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="client">Cliente</option>
                    <option value="barber">Barbeiro</option>
                    <option value="manager">Gerente</option>
                  </select>
                </div>

                {formData.role === 'barber' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código da Barbearia
                    </label>
                    <input
                      type="text                      type="text                      type="text"                      type="text"
                      required
                      value={formData.barbershopCode}                   onChange={(e) => setFormData({ ...formData, barbershopCode: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        hasFieldError("barbershopCode") || hasFieldError("codigoConvite") 
                          ? "border-red-500 dark:border-red-500" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Código fornecido pela barbearia"
                    />
                    {(getFieldError("barbershopCode") || getFieldError("codigoConvite")) && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {getFieldError("barbershopCode") || getFieldError("codigoConvite")}
                      </p>
                    )}
                  </div>
                )}

                {formData.role === 'manager' && !isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Endereço da Barbearia
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          hasFieldError("address") 
                            ? "border-red-500 dark:border-red-500" 
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Endereço completo da barbearia"
                      />
                      {getFieldError("address") && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {getFieldError("address")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone da Barbearia
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          hasFieldError("phone") 
                            ? "border-red-500 dark:border-red-500" 
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="(XX) XXXXX-XXXX"
                      />
                      {getFieldError("phone") && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {getFieldError("phone")}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  hasFieldError('email') 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="seu@email.com"
              />
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {getFieldError('email')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    hasFieldError('password') || hasFieldError('senha') 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {(getFieldError('password') || getFieldError('senha')) && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {getFieldError('password') || getFieldError('senha')}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 px-4 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
            </button>
          </div>

          {/* Google Sign In Button */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.5h6.35c-.28 1.45-1.05 2.69-2.2 3.58v2.92h3.75c2.2-2.02 3.47-5 3.47-8.75z"/>
                <path fill="#34A853" d="M12 23c3.05 0 5.6-1 7.47-2.92l-3.75-2.92c-1.15.7-2.6 1.12-4.22 1.12-3.25 0-6.02-2.19-7.02-5.12H.98v2.92C2.8 20.7 7.15 23 12 23z"/>
                <path fill="#FBBC05" d="M4.98 14.12c-.2-.58-.32-1.2-.32-1.87s.12-1.29.32-1.87V7.41H1.23c-.6 1.2-.95 2.58-.95 4.09s.35 2.89.95 4.09L4.98 14.12z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.3-3.3c-2.2-2.02-5.02-3.25-8.02-3.25-4.85 0-9.2 2.3-11.02 6.12L4.98 10.1C5.98 7.17 8.75 4.75 12 4.75z"/>
              </svg>
              Entrar com Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

