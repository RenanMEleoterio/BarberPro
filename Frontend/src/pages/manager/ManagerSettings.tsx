import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarbershopData, Service } from '../../types';
import apiService from '../../services/apiService';

const ManagerSettings: React.FC = () => {
  const [barbershopData, setBarbershopData] = useState<BarbershopData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newService, setNewService] = useState<Service>({ name: '', price: 0 });
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const barbeariaId = 16; // TODO: Get from context or auth

  useEffect(() => {
    const fetchBarbershopData = async () => {
      try {
        const data = await apiService.getBarbeariaById(barbeariaId);
        setBarbershopData(data);
      } catch (err) {
        setError('Failed to fetch barbershop data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershopData();
  }, [barbeariaId]);

  const handleAddService = async () => {
    try {
      await apiService.addService(barbeariaId, newService);
      setSuccessMessage('Service added successfully!');
      setNewService({ name: '', price: 0 });
      // Refresh services after adding
      const updatedData = await apiService.getServicosByBarbeariaId(barbeariaId);
      setBarbershopData(prev => prev ? { ...prev, services: updatedData } : null);
      setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError('Failed to add service.');
      setTimeout(() => setError(null), 3000); // Clear message after 3 seconds
    }
  };

  const handleUpdateService = async (serviceId: number) => {
    if (!editingService) return;
    try {
      await apiService.updateService(serviceId, editingService);
      setSuccessMessage('Service updated successfully!');
      setEditingServiceId(null);
      setEditingService(null);
      // Refresh services after updating
      const updatedData = await apiService.getServicosByBarbeariaId(barbeariaId);
      setBarbershopData(prev => prev ? { ...prev, services: updatedData } : null);
      setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError('Failed to update service.');
      setTimeout(() => setError(null), 3000); // Clear message after 3 seconds
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      await apiService.deleteService(serviceId);
      setSuccessMessage('Service deleted successfully!');
      // Refresh services after deleting
      const updatedData = await apiService.getServicosByBarbeariaId(barbeariaId);
      setBarbershopData(prev => prev ? { ...prev, services: updatedData } : null);
      setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError('Failed to delete service.');
      setTimeout(() => setError(null), 3000); // Clear message after 3 seconds
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'horarios', label: 'Horários' },
    { id: 'equipe', label: 'Equipe' },
    { id: 'pagamento', label: 'Pagamento' },
  ];

  const [activeTab, setActiveTab] = useState('geral');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'geral':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Informações Gerais</h2>
            {barbershopData ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Barbearia</label>
                  <input type="text" value={barbershopData.name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                  <input type="text" value={barbershopData.address} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                  <input type="text" value={barbershopData.phone} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
              </form>
            ) : (
              <p className="text-gray-900 dark:text-white">Loading...</p>
            )}
          </div>
        );
      case 'servicos':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Serviços</h2>
            <div className="space-y-4">
              {barbershopData?.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                  {editingServiceId === service.id ? (
                    <div className="flex-grow grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editingService?.name || ''}
                        onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                      <input
                        type="number"
                        value={editingService?.price || 0}
                        onChange={(e) => setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    </div>
                  ) : (
                    <div className="flex-grow grid grid-cols-2 gap-4">
                      <p className="text-gray-900 dark:text-white">{service.name}</p>
                      <p className="text-gray-900 dark:text-white">R$ {service.price.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingServiceId === service.id ? (
                      <button onClick={() => handleUpdateService(service.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Salvar</button>
                    ) : (
                      <button onClick={() => setEditingServiceId(service.id)} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Editar</button>
                    )}
                    <button onClick={() => handleDeleteService(service.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Adicionar Novo Serviço</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nome do Serviço"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <input
                  type="number"
                  placeholder="Preço"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <button onClick={handleAddService} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Adicionar Serviço</button>
            </div>
          </div>
        );
      case 'horarios':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Horários de Funcionamento</h2>
            <p className="text-gray-900 dark:text-white">Gerencie os horários de funcionamento da sua barbearia.</p>
          </div>
        );
      case 'equipe':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Equipe</h2>
            <p className="text-gray-900 dark:text-white">Gerencie os membros da sua equipe.</p>
          </div>
        );
      case 'pagamento':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Configurações de Pagamento</h2>
            <p className="text-gray-900 dark:text-white">Configure as opções de pagamento para sua barbearia.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configurações da Barbearia</h1>
      <div className="flex flex-wrap gap-4 mb-6 p-2">