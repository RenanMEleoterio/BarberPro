
import React from 'react';
import { Users, Plus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface Barber {
  id: number;
  nome: string;
  email: string;
  receitaMensal: number;
  clientesUnicos: number;
  avaliacaoMedia: number;
  ultimaAtividade: string;
}

interface BarbersListProps {
  barbers: Barber[];
  barbershopCode: string;
  loading?: boolean;
  onAddBarber?: () => void;
}

const BarbersListSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-10 bg-yellow-500/20 rounded-lg w-32"></div>
    </div>
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full animate-pulse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-20 bg-blue-500/20 rounded"></div>
                    <div className="h-8 w-8 bg-gray-500/20 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const BarbersList: React.FC<BarbersListProps> = ({ barbers, barbershopCode, loading, onAddBarber }) => {
  const generateBarberLink = (barberId: number) => {
    const link = `${window.location.origin}/barber/register?code=${barbershopCode}&barberId=${barberId}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link de registro para o barbeiro copiado!`);
  };

  if (loading) return <BarbersListSkeleton />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Barbeiros Cadastrados</h2>
        <button 
          onClick={onAddBarber}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Barbeiro</span>
        </button>
      </div>
      <div className="p-6">
        {barbers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum barbeiro cadastrado.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Clique em "Adicionar Barbeiro" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receita Mês</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clientes Únicos</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última Atividade</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {barbers.map((barber) => (
                  <tr key={barber.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{barber.nome}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{barber.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      R$ {barber.receitaMensal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {barber.clientesUnicos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {barber.ultimaAtividade ? new Date(barber.ultimaAtividade).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => generateBarberLink(barber.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Gerar Link de Registro"
                        >
                          Gerar Link
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                          title="Configurações do Barbeiro"
                        >
                          <Settings className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
