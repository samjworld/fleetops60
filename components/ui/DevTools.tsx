
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, UserCog, User, HardHat, X } from 'lucide-react';
import { Role } from '../../types';

export const DevTools = () => {
  const { currentRole, switchIdentity, isDevMode, toggleDevMode } = useApp();

  if (!isDevMode) return null;

  const roles: { id: Role; label: string; icon: React.ElementType }[] = [
    { id: 'super_admin', label: 'Admin', icon: Shield },
    { id: 'manager', label: 'Manager', icon: UserCog },
    { id: 'supervisor', label: 'Supervisor', icon: HardHat },
    { id: 'operator', label: 'Operator', icon: User },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 p-4 w-64 animate-in slide-in-from-bottom-5">
        <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
           <h3 className="font-bold text-xs uppercase tracking-wider text-green-400">Developer Mode</h3>
           <button onClick={toggleDevMode} className="text-slate-400 hover:text-white">
              <X size={14} />
           </button>
        </div>
        
        <p className="text-[10px] text-slate-400 mb-2">Instant Role Switcher</p>
        
        <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => {
               const Icon = r.icon;
               const isActive = currentRole === r.id;
               return (
                  <button
                    key={r.id}
                    onClick={() => switchIdentity(r.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all ${
                        isActive 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                     <Icon size={14} />
                     {r.label}
                  </button>
               );
            })}
        </div>
        
        <div className="mt-3 pt-2 border-t border-slate-700 text-[10px] text-center text-slate-500">
           Current: <span className="text-white font-mono">{currentRole}</span>
        </div>
      </div>
    </div>
  );
};
