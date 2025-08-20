import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Star, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  rating: number;
  totalClients: number;
  monthlyRevenue: number;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar?: string;
}

interface BarbersData {
  barbeiros: Barber[];
  estatisticas: {
    totalBarbeiros: number;
    barbeirosAtivos: number;
    receitaTotal: number;
    avaliacaoMedia: number;
  };
}

export default function ManagerBarbers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [barbersData, setBarbersData] = useState<BarbersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadBarbersData();
  }, [user]);

  const loadBarbersData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.barbeariaId) {
        const data = await apiService.getManagerBarbers(user.barbeariaId);
        setBarbersData({
          barbeiros: data.Barbeiros.map((b: any) => ({
            id: b.Id,
            name: b.Name,
            email: b.Email,
            phone: b.Phone,
            specialties: b.Specialties,
            rating: b.Rating,
            totalClients: b.TotalClients,
            monthlyRevenue: b.MonthlyRevenue,
            status: b.Status,
            joinDate: b.JoinDate
          })),
          estatisticas: {
            totalBarbeiros: data.Estatisticas.TotalBarbeiros,
            barbeirosAtivos: data.Estatisticas.BarbeirosAtivos,
            receitaTotal: data.Estatisticas.ReceitaTotal,
            avaliacaoMedia: data.Estatisticas.AvaliacaoMedia
          }
        });
      } else {
        setError("ID da barbearia não encontrado.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados dos barbeiros:", err);
      setError("Erro ao carregar dados dos barbeiros");
      toast.error("Erro ao carregar dados dos barbeiros");
    } finally {
      setLoading(false);
    }
  };

  const barbers = barbersData?.barbeiros || [];
  const stats = barbersData?.estatisticas || {
    totalBarbeiros: 0,
    barbeirosAtivos: 0,
    receitaTotal: 0,
    avaliacaoMedia: 0
  };

  const filteredBarbers = barbers.filter(barber =>
    barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barber.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciar Barbeiros
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciar Barbeiros
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie a equipe de barbeiros da sua barbearia
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar Barbeiro</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar barbeiros por nome, email ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Barbeiros
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalBarbeiros}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Barbeiros Ativos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.barbeirosAtivos}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Receita Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {stats.receitaTotal.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avaliação Média
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avaliacaoMedia.toFixed(1)}
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Barbers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Lista de Barbeiros
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredBarbers.length} barbeiro(s) encontrado(s)
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredBarbers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum barbeiro encontrado com os critérios de busca.' : 'Nenhum barbeiro cadastrado na barbearia.'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {!searchTerm && 'Compartilhe o código da barbearia para que os barbeiros possam se cadastrar.'}
              </p>
            </div>
          ) : (
            filteredBarbers.map((barber) => (
              <div key={barber.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {barber.name.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {barber.name}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(barber.status)}`}>
                          {getStatusText(barber.status)}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{barber.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{barber.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Desde {new Date(barber.joinDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {barber.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {barber.rating}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Avaliação
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {barber.totalClients}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Clientes
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {barber.monthlyRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receita/Mês
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Editar
                      </button>
                      <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Barber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Adicionar Novo Barbeiro
            </h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Digite o nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Digite o email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Especialidades
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ex: Corte, Barba, Sobrancelha"
                />
              </div>
            </form>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

