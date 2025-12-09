import React from 'react';

type LucideIcon = React.ComponentType<{ className?: string }>;

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`rounded-xl bg-white border border-slate-200 shadow-sm p-4 ${className}`}>
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-emerald-600">{trend}</p>}
        </div>
        <div className="p-2 rounded-full bg-slate-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};
