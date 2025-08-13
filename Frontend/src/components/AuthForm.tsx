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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
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
        if (!formData.phone.trim()) {
          newErrors.phone = 'Telefone é obrigatório para barbearias';
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
        } else if (formData.role === 'client') {
          user = await signUp(formData.email, formData.password, formData.name, 'client');
        } else if (formData.role === 'manager') {
          user = await signUpBarbershop(formData.name, formData.address, formData.phone, formData.email, formData.password, formData.name);
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
                      type="text"
                      required
                      value={formData.barbershopCode}
                      onChange={(e) => setFormData({ ...formData, barbershopCode: e.target.value })}
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
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


