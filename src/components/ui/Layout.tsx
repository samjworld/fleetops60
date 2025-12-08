
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LayoutDashboard, Truck, MapPin, CalendarClock, Droplet, Wrench, Package, ShieldAlert, LogOut, Map } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasRole } = useAuth();
  const { currentRole, setPage, currentPage, currentUser } = useApp(); // Use AppContext for local state nav if needed
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: '/', label: 'Control Tower', icon: LayoutDashboard },
    { id: '/map', label: 'Live Map', icon: Map, hidden: !hasRole(['super_admin', 'manager', 'supervisor']) },
    { id: '/machines', label: 'Fleet', icon: Truck, hidden: !hasRole(['super_admin', 'manager']) },
    { id: '/shifts', label: 'Shifts', icon: CalendarClock, hidden: !hasRole(['super_admin', 'manager', 'supervisor']) },
    { id: '/parts', label: 'Inventory', icon: Package, hidden: !hasRole(['super_admin', 'manager', 'supervisor']) },
    { id: '/admin', label: 'Admin', icon: ShieldAlert, hidden: !hasRole(['super_admin']) },
  ];

  // Mobile Operator View Handling (from AppContext Role)
  if (currentRole === 'operator') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">FleetOps 60</h1>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
                <span>{currentUser?.name || 'Operator'}</span>
            </div>
            {/* Logout Button Removed */}
          </div>
        </header>
        <main className="flex-1 p-4 overflow-y-auto pb-20">
          {children}
        </main>
        <div className="bg-white border-t border-slate-200 p-4 fixed bottom-0 w-full flex justify-between items-center text-xs text-slate-500 z-50">
           <span>Logged in as Operator</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-xl font-bold text-amber-500 tracking-wider">FLEET OPS 60</h1>
           <p className="text-xs text-slate-400 mt-1 uppercase">{user?.role.replace('_', ' ')} Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
           {navItems.filter(i => !i.hidden).map(item => (
               <button 
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
               >
                   <item.icon size={20} />
                   <span>{item.label}</span>
               </button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
            {/* Logout Button Removed */}
            <div className="text-xs text-slate-500 text-center">v1.0.0 Production</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
         <header className="bg-white border-b h-16 flex items-center px-6 shadow-sm sticky top-0 z-10">
             <div className="md:hidden font-bold text-slate-900">FleetOps 60</div>
             <div className="ml-auto flex items-center space-x-4">
                 <div className="text-right hidden md:block">
                     <div className="text-sm font-bold text-slate-900">{user?.name}</div>
                     <div className="text-xs text-slate-500">{user?.email}</div>
                 </div>
             </div>
         </header>
         <div className="p-6">
            {children}
         </div>
      </main>
    </div>
  );
};
