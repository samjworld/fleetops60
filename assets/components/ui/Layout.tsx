
import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, Truck, MapPin, CalendarClock, Droplet, Wrench, FileBarChart, 
  Menu, User, LogOut, ShieldAlert, Package, MessageSquare
} from 'lucide-react';
import { Role } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentRole, setRole, currentPage, setPage, currentUser, setCurrentUser, logout, unreadChat } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'super_admin'] },
    { id: 'machines', label: 'Fleet', icon: Truck, roles: ['manager', 'super_admin'] },
    { id: 'sites', label: 'Sites', icon: MapPin, roles: ['manager', 'super_admin'] },
    { id: 'shifts', label: 'Shifts', icon: CalendarClock, roles: ['manager', 'supervisor', 'super_admin'] },
    { id: 'fuel', label: 'Fuel Logs', icon: Droplet, roles: ['manager', 'super_admin'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['manager', 'super_admin'] },
    { id: 'spare_parts', label: 'Inventory', icon: Package, roles: ['manager', 'super_admin'] },
    { id: 'reports', label: 'Reports', icon: FileBarChart, roles: ['manager', 'super_admin'] },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare, roles: ['manager', 'supervisor', 'operator', 'super_admin'] },
    { id: 'admin', label: 'Team & Admin', icon: ShieldAlert, roles: ['manager', 'super_admin'] },
  ];

  // Mobile layout for Operator
  if (currentRole === 'operator') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">FleetOps 60</h1>
              {currentPage !== 'dashboard' && (
                 <button onClick={() => setPage('dashboard')} className="text-xs bg-slate-700 px-2 py-1 rounded">Back</button>
              )}
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <button onClick={() => setPage('chat')} className={`relative p-1.5 rounded-full ${currentPage === 'chat' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <MessageSquare size={18} />
                {unreadChat && currentPage !== 'chat' && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
                )}
            </button>
            <div className="flex items-center space-x-1">
                <User size={16} />
                <span>{currentUser?.name || 'Operator'}</span>
            </div>
            <button onClick={logout} className="text-xs bg-slate-700 px-2 py-1 rounded ml-2">
                Logout
            </button>
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

  // Desktop/Tablet layout for Manager & Supervisor & Super Admin
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`bg-slate-900 text-white w-64 flex-col hidden md:flex transition-all duration-300`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tighter text-amber-500">FleetOps 60</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{currentRole.replace('_', ' ')} Portal</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.filter(item => item.roles.includes(currentRole)).map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setPage(item.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </div>
                    {item.id === 'chat' && unreadChat && !isActive && (
                        <span className="bg-red-500 w-2.5 h-2.5 rounded-full"></span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">Logged In</p>
              <p className="text-xs text-slate-500 capitalize">{currentRole.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
             onClick={logout} 
             className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-200 text-slate-300 text-xs rounded p-2 transition-colors"
          >
             <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden">
          <div className="flex items-center space-x-2">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
               <Menu />
             </button>
             <span className="font-bold text-slate-900">FleetOps 60</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-1 bg-slate-100 rounded capitalize font-medium">
                  {currentRole.replace('_', ' ')}
              </div>
              <button onClick={logout} className="text-slate-500">
                  <LogOut size={18} />
              </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="bg-slate-900 text-white md:hidden absolute top-16 left-0 w-full z-50 p-4 shadow-xl">
             <ul className="space-y-2">
            {navItems.filter(item => item.roles.includes(currentRole)).map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setPage(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded ${
                      currentPage === item.id ? 'bg-blue-600' : 'hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.id === 'chat' && unreadChat && currentPage !== 'chat' && (
                        <span className="bg-red-500 w-2.5 h-2.5 rounded-full"></span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
