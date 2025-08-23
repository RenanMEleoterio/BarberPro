import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, DollarSign, Users, Bell, Shield, MapPin } from 'lucide-react';
import { apiService, LoginResponse } from '../../services/api';

export default function ManagerSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [barbershopData, setBarbershopData] = useState({
    id: 0,
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    openTime: "08:00",
    closeTime: "18:00",
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    services: [], // Inicializa como array vazio
    notifications: {
      newAppointments: true,
      cancellations: true,
      reviews: true,
      dailyReport: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState({
    nome: '',
    preco: 0,
    duracaoMinutos: 0,
  });

  useEffect(() => {
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

        const [barbershopResponse, servicesResponse] = await Promise.all([
          apiService.getBarbeariaById(barbeariaId),
          apiService.getServicosByBarbeariaId(barbeariaId)
        ]);

        setBarbershopData({
          id: barbershopResponse.id,
          nome: barbershopResponse.nome,
          endereco: barbershopResponse.endereco,
          telefone: barbershopResponse.telefone,
          email: barbershopResponse.email,
          openTime: '08:00', // Dados mockados, ajustar com dados reais do backend
          closeTime: '18:00', // Dados mockados, ajustar com dados reais do backend
          workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], // Dados mockados, ajustar com dados reais do backend
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
      });
      setSuccessMessage("Configurações salvas com sucesso!");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar configurações.");
      setSuccessMessage(null);
    }
  };

  const handleAddService = async () => {
    try {
      const userDataString = localStorage.getItem("user");
      if (!userDataString) throw new Error("Dados do usuário não encontrados no localStorage.");
      const userData: LoginResponse = JSON.parse(userDataString);
      const barbeariaId = userData.barbeariaId;
      if (!barbeariaId) throw new Error("ID da barbearia não encontrado nos dados do usuário.");

      await apiService.addServico({ nome: newService.nome, preco: newService.preco, duracaoMinutos: newService.duracaoMinutos, barbeariaId });
      const updatedServices = await apiService.getServicosByBarbeariaId(barbeariaId);
      setBarbershopData({ ...barbershopData, services: updatedServices });
      setSuccessMessage("Serviço adicionado com sucesso!");
      setError(null);
      setIsAddServiceModalOpen(false); // Fecha o modal após adicionar
      setNewService({ nome: '', preco: 0, duracaoMinutos: 0 }); // Limpa o formulário
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar serviço.");
      setSuccessMessage(null);
    }
  };

  const tabs = [
    { id: 'general', name: 'Geral', icon: Settings },
    { id: 'schedule', name: 'Horários', icon: Clock },
    { id: 'services', name: 'Serviços', icon: DollarSign },
    { id: 'team', name: 'Equipe', icon: Users }
  ];

  const weekDays = [
    { id: 'monday', name: 'Segunda-feira' },
    { id: 'tuesday', name: 'Terça-feira' },
    { id: 'wednesday', name: 'Quarta-feira' },
    { id: 'thursday', name: 'Quinta-feira' },
    { id: 'friday', name: 'Sexta-feira' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' }
  ];

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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
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
        {barbershopData.services && barbershopData.services.map((service: any) => (
          <div key={service.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  value={service.nome}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  value={service.preco}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  value={service.duracaoMinutos}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  readOnly
                />
              </div>
            </div>
          </div>
        ))}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  value={newService.preco}
                  onChange={(e) => setNewService({ ...newService, preco: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duração (min)</label>
                <input
                  type="number"
                  value={newService.duracaoMinutos}
                  onChange={(e) => setNewService({ ...newService, duracaoMinutos: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preferências de Notificação
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Novos Agendamentos
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receber notificação quando um novo agendamento for feito
              </p>
            </div>
            <input
              type="checkbox"
              checked={barbershopData.notifications.newAppointments}
              onChange={(e) => setBarbershopData({
                ...barbershopData,
                notifications: {
                  ...barbershopData.notifications,
                  newAppointments: e.target.checked
                }
              })}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Cancelamentos
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receber notificação quando um agendamento for cancelado
              </p>
            </div>
            <input
              type="checkbox"
              checked={barbershopData.notifications.cancellations}
              onChange={(e) => setBarbershopData({
                ...barbershopData,
                notifications: {
                  ...barbershopData.notifications,
                  cancellations: e.target.checked
                }
              })}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Avaliações
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receber notificação quando uma nova avaliação for feita
              </p>
            </div>
            <input
              type="checkbox"
              checked={barbershopData.notifications.reviews}
              onChange={(e) => setBarbershopData({
                ...barbershopData,
                notifications: {
                  ...barbershopData.notifications,
                  reviews: e.target.checked
                }
              })}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Relatório Diário
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receber um resumo diário das atividades
              </p>
            </div>
            <input
              type="checkbox"
              checked={barbershopData.notifications.dailyReport}
              onChange={(e) => setBarbershopData({
                ...barbershopData,
                notifications: {
                  ...barbershopData.notifications,
                  dailyReport: e.target.checked
                }
              })}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="text-center text-gray-500 dark:text-gray-400">Carregando...</div>;
    }
    if (error) {
      return <div className="text-center text-red-500 dark:text-red-400">Erro: {error}</div>;
    }
    if (successMessage) {
      return <div className="text-center text-green-500 dark:text-green-400">{successMessage}</div>;
    }

    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'schedule':
        return renderScheduleSettings();
      case 'services':
        return renderServicesSettings();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie as configurações da sua barbearia
          </p>
        </div>
        
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Save className="h-5 w-5" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

