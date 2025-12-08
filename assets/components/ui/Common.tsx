import React from 'react';
import { MachineStatus, ShiftStatus } from '../../types';

// Status Badge
export const StatusBadge = ({ status }: { status: string }) => {
  let colorClass = 'bg-slate-100 text-slate-800';

  switch (status) {
    case MachineStatus.Working:
    case ShiftStatus.InProgress:
    case 'Active':
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case MachineStatus.Idle:
    case ShiftStatus.Completed:
    case 'Available':
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case MachineStatus.Breakdown:
    case MachineStatus.Maintenance:
    case 'Blocked':
      colorClass = 'bg-red-100 text-red-800 border-red-200';
      break;
    case ShiftStatus.Planned:
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case 'Warning':
      colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};

// Card Component
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline: "bg-transparent border border-slate-300 text-slate-600 hover:bg-slate-50"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props} 
    />
  );
};

// Stat Card
export const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
      </div>
      <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
    </div>
  </Card>
);
