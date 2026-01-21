import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, DollarSign, Users, Bell, Shield, MapPin } from 'lucide-react';
import { apiService, LoginResponse } from '../../services/api';

/**
 * Componente de configurações para o gerente da barbearia.
 * Permite ao gerente visualizar e editar informações gerais da barbearia, horários de funcionamento,
 * serviços oferecidos e gerenciar a equipe de barbeiros.
 */
export default function ManagerSettings() {
  // Estado para controlar a aba ativa (Geral, Horários, Serviços, Equipe).
  const [activeTab, setActiveTab] = useState('general');
  // Estado para armazenar os dados da barbearia, incluindo informações de contato, horários, serviços e notificações.
  const [barbershopData, setBarbershopData] = useState({
    id: 0,
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    openTime: "08:00",
    closeTime: "18:00",
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    services: [], // Inicializa como array vazio para os serviços.
    notifications: {
      newAppointments: true,
      cancellations: true,
      reviews: true,
      dailyReport: false,
    },
  });
  // Estado para controlar o status de carregamento dos dados iniciais.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);
  // Estado para armazenar mensagens de sucesso após salvar alterações.
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Estado para controlar a visibilidade do modal de adição de serviço.
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  // Estado para armazenar os dados do novo serviço a ser adicionado.
  const [newService, setNewService] = useState({
    nome: '',
    preco: 0,
    duracaoMinutos: 0,
  });

  // Efeito que carrega os dados da barbearia ao montar o componente.
  useEffect(() => {
    /**
     * Função assíncrona para buscar os dados da barbearia e seus serviços.
     * Obtém o ID da barbearia do localStorage e faz chamadas à API.
     */
    const fetchBarbershopData = async () => {
      try {
        setLoading(true);
        const userDataString = localStorage.getItem('user');
        if (!userDataString) {
          throw new Error('Dados do usuário não encontrados no localStorage.');
        }
        const userData: LoginResponse = JSON.parse(userDataString);
        const barbeariaId = userData.barbeariaId;

        if (!barbeariaId) {
          throw new Error('ID da barbearia não encontrado nos dados do usuário.');
        }

        // Realiza chamadas paralelas para obter dados da barbearia e seus serviços.
        const [barbershopResponse, servicesResponse] = await Promise.all([
          apiService.getBarbeariaById(barbeariaId),
          apiService.getServicosByBarbeariaId(barbeariaId)
        ]);

        // Atualiza o estado com os dados recebidos da API.
        setBarbershopData({
          id: barbershopResponse.id,
          nome: barbershopResponse.nome,
          endereco: barbershopResponse.endereco,
          telefone: barbershopResponse.telefone,
          email: barbershopResponse.email,
          openTime: barbershopResponse.openTime || '08:00',
          closeTime: barbershopResponse.closeTime || '18:00',
          workDays: barbershopResponse.workDays
            ? barbershopResponse.workDays.split(',').map((day: string) => day.trim())
            : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          services: servicesResponse, // Dados reais do backend
          notifications: {
            newAppointments: true,
            cancellations: true,
            reviews: true,
            dailyReport: false,
          },
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados da barbearia.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershopData();
  }, []);

  /**
   * Lida com o salvamento das configurações gerais da barbearia.
   * Envia os dados atualizados para a API e exibe mensagens de sucesso ou erro.
   */
  const handleSave = async () => {
    try {
      const userDataString = localStorage.getItem("user");
      if (!userDataString) {
        throw new Error("Dados do usuário não encontrados no localStorage.");
      }
      const userData: LoginResponse = JSON.parse(userDataString);
      const barbeariaId = userData.barbeariaId;

      if (!barbeariaId) {
        throw new Error("ID da barbearia não encontrado nos dados do usuário.");
      }

      await apiService.updateBarbearia(barbeariaId, {
        nome: barbershopData.nome,
        endereco: barbershopData.endereco,
        telefone: barbershopData.telefone,
        email: barbershopData.email,
        openTime: barbershopData.openTime,
        closeTime: barbershopData.closeTime,
        workDays: barbershopData.workDays.join(','),
      });

      try {
        await apiService.generateHorariosParaBarbearia();
      } catch (generationError) {
        console.error("Erro ao gerar horários para a barbearia:", generationError);
      }

      setSuccessMessage("Configurações salvas com sucesso e horários gerados para a barbearia!");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar configurações.");
      setSuccessMessage(null);
    }
  };

  /**
   * Lida com a adição de um novo serviço à barbearia.
   * Envia os dados do novo serviço para a API, atualiza a lista de serviços e fecha o modal.
   */
  const handleAddService = async () => {
    try {
      const userDataString = localStorage.getItem("user");
      if (!userDataString) throw new Error("Dados do usuário não encontrados no localStorage.");
      const userData: LoginResponse = JSON.parse(userDataString);
      const barbeariaId = userData.barbeariaId;
      if (!barbeariaId) throw new Error("ID da barbearia não encontrado nos dados do usuário.");

      // Chama a API para adicionar o novo serviço.
      await apiService.addServico({ nome: newService.nome, preco: newService.preco, duracaoMinutos: newService.duracaoMinutos, barbeariaId });
      // Recarrega a lista de serviços para refletir a adição.
      const updatedServices = await apiService.getServicosByBarbeariaId(barbeariaId);
      setBarbershopData({ ...barbershopData, services: updatedServices });
      setSuccessMessage("Serviço adicionado com sucesso!");
      setError(null);
      setIsAddServiceModalOpen(false); // Fecha o modal após adicionar.
      setNewService({ nome: '', preco: 0, duracaoMinutos: 0 }); // Limpa o formulário do novo serviço.
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar serviço.");
      setSuccessMessage(null);
    }
  };

  // Definição das abas de navegação das configurações.
  const tabs = [
    { id: 'general', name: 'Geral', icon: Settings },
    { id: 'schedule', name: 'Horários', icon: Clock },
    { id: 'services', name: 'Serviços', icon: DollarSign },
    { id: 'team', name: 'Equipe', icon: Users } // Esta aba pode ser um link para ManagerBarbers
  ];

  // Definição dos dias da semana para seleção de horários de funcionamento.
  const weekDays = [
    { id: 'monday', name: 'Segunda-feira' },
    { id: 'tuesday', name: 'Terça-feira' },
    { id: 'wednesday', name: 'Quarta-feira' },
    { id: 'thursday', name: 'Quinta-feira' },
    { id: 'friday', name: 'Sexta-feira' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' }
  ];

  /**
   * Renderiza as configurações gerais da barbearia.
   * Inclui campos para nome, telefone, endereço e email.
   */
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações da Barbearia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Barbearia
            </label>
            <input
              type="text"
              value={barbershopData.nome}
              onChange={(e) => setBarbershopData({...barbershopData, nome: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={barbershopData.telefone}
              onChange={(e) => setBarbershopData({...barbershopData, telefone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={barbershopData.endereco}
              onChange={(e) => setBarbershopData({...barbershopData, endereco: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={barbershopData.email}
              onChange={(e) => setBarbershopData({...barbershopData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza as configurações de horário de funcionamento da barbearia.
   * Inclui campos para horário de abertura, fechamento e seleção dos dias de funcionamento.
   */
  const renderScheduleSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Horário de Funcionamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Horário de Abertura
            </label>
            <input
              type="time"
              value={barbershopData.openTime}
              onChange={(e) => setBarbershopData({...barbershopData, openTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Horário de Fechamento
            </label>
            <input
              type="time"
              value={barbershopData.closeTime}
              onChange={(e) => setBarbershopData({...barbershopData, closeTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dias de Funcionamento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {weekDays.map((day) => (
              <label key={day.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={barbershopData.workDays.includes(day.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBarbershopData({
                        ...barbershopData,
                        workDays: [...barbershopData.workDays, day.id]
                      });
                    } else {
                      setBarbershopData({
                        ...barbershopData,
                        workDays: barbershopData.workDays.filter(d => d !== day.id)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {day.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza as configurações de serviços da barbearia.
   * Exibe a lista de serviços existentes e um botão para adicionar novos serviços.
   */
  const renderServicesSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Serviços e Preços
        </h3>
        <button
          onClick={() => setIsAddServiceModalOpen(true)}
          className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <span>Adicionar Serviço</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Renderiza os serviços existentes */}
        {Array.isArray(barbershopData.services) ? barbershopData.services.map((service: any) => (
          <div key={service.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  value={service.nome}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  readOnly // Campo de nome do serviço é somente leitura.
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  value={service.preco}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  // Adicionar onChange para permitir edição do preço
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  value={service.duracaoMinutos}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  // Adicionar onChange para permitir edição da duração
                />
              </div>
            </div>
          </div>
        )) : []}
      </div>

      {/* Modal de Adicionar Serviço */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Adicionar Novo Serviço</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  value={newService.nome}
                  onChange={(e) => setNewService({ ...newService, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  value={newService.preco}
                  onChange={(e) => setNewService({ ...newService, preco: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duração (min)</label>
                <input
                  type="number"
                  value={newService.duracaoMinutos}
                  onChange={(e) => setNewService({ ...newService, duracaoMinutos: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddService}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Configurações da Barbearia</h1>
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
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white">
        <h1 className="text-xl sm:text-3xl font-bold mb-2">Configurações da Barbearia</h1>
        <p className="text-sm sm:text-base text-yellow-100">Gerencie as informações e operações da sua barbearia</p>
      </div>

      {/* Mensagens de erro ou sucesso */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <Save className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-green-800 dark:text-green-200">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Navegação por abas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === tab.id
                  ? 'text-yellow-600 border-b-2 border-yellow-600'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}
              `}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Conteúdo das abas */}
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'schedule' && renderScheduleSettings()}
          {activeTab === 'services' && renderServicesSettings()}
          {activeTab === 'team' && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Equipe</h3>
              <p className="text-gray-600 dark:text-gray-400">Vá para a seção de Gerenciar Barbeiros para configurar sua equipe.</p>
              {/* Link ou botão para a página ManagerBarbers */}
            </div>
          )}
        </div>
      </div>

      {/* Botão Salvar (visível apenas para abas que permitem salvar) */}
      {(activeTab === 'general' || activeTab === 'schedule') && (
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      )}
    </div>
  );
}


