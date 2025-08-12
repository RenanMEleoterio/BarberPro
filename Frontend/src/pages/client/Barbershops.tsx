import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Clock, Phone } from 'lucide-react';
import { apiService } from '../../services/api';

export default function Barbershops() {
  const [searchTerm, setSearchTerm] = useState('');
  const [barbershops, setBarbershops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBarbershops();
  }, []);

  const loadBarbershops = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBarbershopsWithDetails();
      setBarbershops(data);
    } catch (error) {
      console.error('Erro ao carregar barbearias:', error);
      setError('Erro ao carregar barbearias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBarbershops = barbershops.filter(barbershop =>
    barbershop.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barbershop.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Barbearias</h1>
          <p className="text-gray-600 dark:text-gray-400">Carregando barbearias...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Barbearias</h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button 
          onClick={loadBarbershops}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Barbearias</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Encontre a barbearia perfeita para você</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
        <input
          type="text"
          placeholder="Buscar barbearias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
        />
      </div>

      {/* Barbershops Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredBarbershops.map((barbershop) => (
          <div key={barbershop.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <img
                src={barbershop.image}
                alt={barbershop.nome}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{barbershop.rating}</span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{barbershop.nome}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{barbershop.endereco}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{barbershop.telefone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{barbershop.openTime} - {barbershop.closeTime}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Barbeiros:</h4>
                <div className="space-y-1">
                  {barbershop.barbers && barbershop.barbers.length > 0 ? (
                    barbershop.barbers.map((barber: any) => (
                      <div key={barber.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{barber.name}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-gray-600 dark:text-gray-400">{barber.rating}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Nenhum barbeiro cadastrado</span>
                  )}
                </div>
              </div>

              <Link
                to={`/client/barbershops/${barbershop.id}/book`}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center block"
              >
                Agendar Horário
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredBarbershops.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma barbearia encontrada</p>
        </div>
      )}
    </div>
  );
}