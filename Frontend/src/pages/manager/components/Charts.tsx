
import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PaymentData {
  name: string;
  value: number;
  color: string;
}

interface PaymentMethodsChartProps {
  data: PaymentData[];
  loading?: boolean;
}

const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
    <div className="p-6 flex items-center justify-center h-[300px]">
      <div className="h-48 w-48 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

export const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Formas de Pagamento (Mês)</h2>
      </div>
      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Sem dados de pagamento disponíveis.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={70}
                dataKey="value"
                paddingAngle={5}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Percentual']} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

interface WeeklyPerformanceChartProps {
  data: any[];
  loading?: boolean;
}

export const WeeklyPerformanceChart: React.FC<WeeklyPerformanceChartProps> = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Semanal</h2>
      </div>
      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Sem dados de performance disponíveis.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {/* Gráfico de Barras aqui */}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
