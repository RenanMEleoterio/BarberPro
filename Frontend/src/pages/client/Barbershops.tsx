import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Clock, Phone } from 'lucide-react';
import { apiService } from '../../services/api';

/**
 * Componente para exibir uma lista de barbearias e permitir a busca e agendamento.
 */
export default function Barbershops() {
  // Estado para armazenar o termo de busca digitado pelo usuário.
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para armazenar a lista de barbearias obtida da API.
  const [barbershops, setBarbershops] = useState<any[]>([]);
  // Estado para controlar o status de carregamento das barbearias.
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens de erro.
  const [error, setError] = useState<string | null>(null);

  // Efeito que carrega as barbearias quando o componente é montado.
  useEffect(() => {
    loadBarbershops();
  }, []);

  /**
   * Carrega a lista de barbearias com detalhes a partir da API.
   * Atualiza os estados de carregamento, barbearias e erro.
   */
  const loadBarbershops = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBarbershopsWithDetails();
      setBarbershops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar barbearias:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao carregar barbearias. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Filtra as barbearias com base no termo de busca, comparando com o nome ou endereço.
  const filteredBarbershops = barbershops.filter(barbershop =>
    barbershop.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barbershop.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados.
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

  // Exibe uma mensagem de erro se houver problemas ao carregar as barbearias.
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
      {/* Cabeçalho da página */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Barbearias</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Encontre a barbearia perfeita para você</p>
      </div>

      {/* Campo de Busca */}
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

      {/* Grid de Barbearias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.isArray(filteredBarbershops) ? filteredBarbershops.map((barbershop) => (
          <div key={barbershop.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            {/* Imagem da Barbearia */}
            <div className="relative h-48">
              <img
                src={barbershop.image}
                alt={barbershop.nome}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Detalhes da Barbearia */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{barbershop.nome}</h3>
              
              <div className="space-y-2 mb-4">
                {/* Endereço */}
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{barbershop.endereco}</span>
                </div>
                {/* Telefone */}
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{barbershop.telefone}</span>
                </div>
                {/* Horário de Funcionamento */}
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{barbershop.openTime} - {barbershop.closeTime}</span>
                </div>
              </div>

              {/* Lista de Barbeiros da Barbearia */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Barbeiros:</h4>
                <div className="space-y-1">
                  {Array.isArray(barbershop.barbers) && barbershop.barbers.length > 0 ? (
                    barbershop.barbers.map((barber: any) => (
                      <div key={barber.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{barber.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Nenhum barbeiro cadastrado</span>
                  )}
                </div>
              </div>

              {/* Botão para Agendar Horário */}
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

      {/* Mensagem de nenhuma barbearia encontrada */}
      {filteredBarbershops.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma barbearia encontrada</p>
        </div>
      )}
    </div>
  );
}


