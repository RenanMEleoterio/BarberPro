
import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white shadow-lg">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-yellow-100">{subtitle}</p>
    </div>
  );
};
