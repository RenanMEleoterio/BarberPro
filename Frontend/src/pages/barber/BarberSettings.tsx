import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Scissors, FileText, Save, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente de configurações do perfil do barbeiro.
 * Permite ao barbeiro visualizar e editar suas informações pessoais e profissionais.
 */
export default function BarberSettings() {
  // Estado para armazenar os dados do formulário do perfil do barbeiro.
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidades: '',
    descricao: ''
  });
  // Estado para controlar o status de carregamento inicial dos dados.
  const [loading, setLoading] = useState(true);
  // Estado para controlar o status de salvamento das alterações.
  const [saving, setSaving] = useState(false);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  // Estado para armazenar mensagens de sucesso.
  const [success, setSuccess] = useState<string | null>(null);
  // Hook para acessar as informações do usuário logado.
  const { user } = useAuth();

  // Efeito que carrega os dados do barbeiro quando o componente é montado.
  useEffect(() => {
    loadBarberData();
  }, []);

  /**
   * Carrega os dados do perfil do barbeiro a partir da API.
   * Atualiza os estados de carregamento e preenche o formulário com os dados existentes.
   */
  const loadBarberData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.id) {
        const data = await apiService.getBarberProfile(user.id);
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          especialidades: data.especialidades || '',
          descricao: data.descricao || ''
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do barbeiro:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao carregar dados do perfil';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lida com a mudança de valores nos campos do formulário.
   * Atualiza o estado `formData` com os novos valores.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - O evento de mudança do input.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Lida com o envio do formulário de atualização do perfil.
   * Envia os dados atualizados para a API e exibe mensagens de sucesso ou erro.
   * @param {React.FormEvent} e - O evento de envio do formulário.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (user?.id) {
        await apiService.updateBarberProfile(user.id, formData);
        setSuccess('Perfil atualizado com sucesso!');
        setTimeout(() => setSuccess(null), 3000); // Limpa a mensagem de sucesso após 3 segundos.
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao atualizar perfil. Tente novamente.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Exibe um spinner de carregamento enquanto os dados iniciais estão sendo buscados.
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-yellow-100">Carregando dados...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-yellow-100">Gerencie seus dados pessoais e informações profissionais</p>
      </div>

      {/* Mensagens de erro ou sucesso */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <Save className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-green-800 dark:text-green-200">{success}</span>
          </div>
        </div>
      )}

      {/* Formulário de Configurações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informações Pessoais</h2>
          <p className="text-gray-600 dark:text-gray-400">Atualize suas informações pessoais e profissionais</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Nome Completo
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Campo Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Campo Especialidades */}
          <div>
            <label htmlFor="especialidades" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Scissors className="h-4 w-4 inline mr-2" />
              Especialidades
            </label>
            <input
              type="text"
              id="especialidades"
              name="especialidades"
              value={formData.especialidades}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Corte masculino, Barba, Bigode, etc."
            />
          </div>

          {/* Campo Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Descrição Profissional
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Conte um pouco sobre sua experiência e estilo de trabalho..."
            />
          </div>

          {/* Botão de Envio */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


