
import React from 'react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarbershopCodeCardProps {
  code: string;
  loading?: boolean;
}

export const BarbershopCodeCard: React.FC<BarbershopCodeCardProps> = ({ code, loading }) => {
  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success('Código da barbearia copiado!');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Código da Barbearia</h2>
      <div className="flex items-center space-x-4">
        <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white break-all">{code || 'N/A'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Compartilhe para novos barbeiros se cadastrarem.</p>
        </div>
        <button
          onClick={copyToClipboard}
          disabled={!code}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:shadow-none"
          aria-label="Copiar código"
        >
          <Copy className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
