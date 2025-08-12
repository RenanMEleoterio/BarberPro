import React, { useState } from 'react';
import { Settings, Save, Clock, DollarSign, Users, Bell, Shield, MapPin } from 'lucide-react';

export default function ManagerSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    barbershopName: 'BarberPro',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    email: 'contato@barberpro.com',
    openTime: '08:00',
    closeTime: '18:00',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    appointmentDuration: 30,
    services: [
      { id: 1, name: 'Corte Simples', price: 25, duration: 30 },
      { id: 2, name: 'Corte + Barba', price: 45, duration: 45 },
      { id: 3, name: 'Barba', price: 20, duration: 20 },
      { id: 4, name: 'Sobrancelha', price: 15, duration: 15 }
    ],
    notifications: {
      newAppointments: true,
      cancellations: true,
      reviews: true,
      dailyReport: false
    }
  });

  const tabs = [
    { id: 'general', name: 'Geral', icon: Settings },
    { id: 'schedule', name: 'Horários', icon: Clock },
    { id: 'services', name: 'Serviços', icon: DollarSign },
    { id: 'team', name: 'Equipe', icon: Users },
    { id: 'notifications', name: 'Notificações', icon: Bell }
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

  const handleSave = () => {
    // Implementar salvamento das configurações
    alert('Configurações salvas com sucesso!');
  };

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
              value={settings.barbershopName}
              onChange={(e) => setSettings({...settings, barbershopName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({...settings, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({...settings, email: e.target.value})}
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
              value={settings.openTime}
              onChange={(e) => setSettings({...settings, openTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Horário de Fechamento
            </label>
            <input
              type="time"
              value={settings.closeTime}
              onChange={(e) => setSettings({...settings, closeTime: e.target.value})}
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
                  checked={settings.workDays.includes(day.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings({
                        ...settings,
                        workDays: [...settings.workDays, day.id]
                      });
                    } else {
                      setSettings({
                        ...settings,
                        workDays: settings.workDays.filter(d => d !== day.id)
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
        <button className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
          <span>Adicionar Serviço</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {settings.services.map((service) => (
          <div key={service.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  value={service.name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  value={service.price}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  value={service.duration}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
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
              checked={settings.notifications.newAppointments}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
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
              checked={settings.notifications.cancellations}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
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
              checked={settings.notifications.reviews}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
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
              checked={settings.notifications.dailyReport}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
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

