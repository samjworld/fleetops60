
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, StatusBadge, StatCard } from '../components/ui/Common';
import { Shield, Users, Database, Server, Trash2, Plus, UserPlus, Phone, Edit, Lock, CheckCircle, Unlock, Settings, Ban, Terminal, UserCog, Map, Code, LogIn, MapPin, ToggleRight, ToggleLeft, Sliders, X } from 'lucide-react';
import { Role, SystemUser, Feature, RolePermissions } from '../types';
import { SystemConfig } from '../context/AppContext';

export const SuperAdmin = () => {
  const { 
    systemUsers, addSystemUser, updateSystemUser, deleteSystemUser, resetSystemData, 
    permissions, updatePermission, canAccess, addSite, deleteSite, updateSite, 
    userActivity, currentRole, setRole, setPage, currentPage, isDevMode, toggleDevMode, switchIdentity,
    systemConfig, updateSystemConfig
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'sites' | 'activity' | 'system' | 'developer' | 'config'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Activity Filter State
  const [activityFilter, setActivityFilter] = useState<'all' | 'login'>('all');

  // Config State
  const [newConfigOption, setNewConfigOption] = useState('');

  // User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<SystemUser>>({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
    status: 'Active'
  });

  // Site Form State
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteForm, setSiteForm] = useState({ name: '', location: '', client: '' });

  // Tab Visibility logic
  const isSuperAdmin = currentRole === 'super_admin';

  // Helper: Can current user manage target user?
  const canManageTargetUser = (targetUser: SystemUser) => {
      // Super Admin can do everything
      if (isSuperAdmin) return true;
      
      // Managers cannot touch Super Admins
      if (targetUser.role === 'super_admin') return false;
      
      // Managers can manage other Managers, Supervisors, Operators
      return true;
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userForm.name && userForm.email) {
      if (editingUserId) {
          updateSystemUser(editingUserId, userForm);
      } else {
          addSystemUser({
            ...userForm as SystemUser,
            id: `U${Date.now()}`,
            last_login: undefined
          });
      }
      setShowUserModal(false);
      setUserForm({ name: '', email: '', phone: '', role: 'manager', status: 'Active' });
      setEditingUserId(null);
    }
  };

  const openEditUser = (user: SystemUser) => {
      setEditingUserId(user.id);
      setUserForm({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.status
      });
      setShowUserModal(true);
  };

  const openAddUser = () => {
      setEditingUserId(null);
      setUserForm({ name: '', email: '', phone: '', role: 'manager', status: 'Active' });
      setShowUserModal(true);
  };

  const handleAddSite = (e: React.FormEvent) => {
      e.preventDefault();
      addSite({
          id: `S${Date.now()}`,
          name: siteForm.name,
          location_text: siteForm.location,
          client_name: siteForm.client,
          status: 'Active' as any,
          start_date: new Date().toISOString().split('T')[0]
      });
      setShowSiteModal(false);
      setSiteForm({ name: '', location: '', client: '' });
  };

  // Config Handlers
  const handleAddConfigOption = (key: keyof SystemConfig) => {
      if(!newConfigOption.trim()) return;
      const currentList = systemConfig[key];
      if(!currentList.includes(newConfigOption.trim())) {
          updateSystemConfig(key, [...currentList, newConfigOption.trim()]);
      }
      setNewConfigOption('');
  };

  const handleDeleteConfigOption = (key: keyof SystemConfig, option: string) => {
      const currentList = systemConfig[key];
      updateSystemConfig(key, currentList.filter(item => item !== option));
  };


  const features: {id: Feature, label: string}[] = [
      { id: 'manage_sites', label: 'Manage Sites' },
      { id: 'manage_users', label: 'Manage Users' },
      { id: 'bulk_edit_fleet', label: 'Bulk Edit Fleet' },
      { id: 'view_reports', label: 'View Reports' },
      { id: 'view_inventory', label: 'View Inventory' },
  ];

  const roles: Role[] = ['manager', 'supervisor', 'operator'];

  // Define available roles for dropdown based on current user hierarchy
  const availableRolesForCreation: Role[] = isSuperAdmin 
      ? ['manager', 'supervisor', 'operator', 'super_admin']
      : ['manager', 'supervisor', 'operator'];

  // Filtered Activity Logs
  const filteredActivity = userActivity.filter(act => 
      activityFilter === 'all' || (activityFilter === 'login' && act.action === 'Login')
  ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Shield className="text-blue-600" /> Team & System Admin
           </h2>
           <p className="text-slate-500">Manage users, access controls, and system settings.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 p-1 rounded-lg flex flex-wrap text-sm font-medium shadow-sm">
           <button 
             onClick={() => setActiveTab('users')}
             className={`px-4 py-2 rounded-md transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
           >
             User Management
           </button>
           <button 
             onClick={() => setActiveTab('permissions')}
             className={`px-4 py-2 rounded-md transition-all ${activeTab === 'permissions' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Access Control
           </button>
           {isSuperAdmin && (
             <>
               <button 
                 onClick={() => setActiveTab('config')}
                 className={`px-4 py-2 rounded-md transition-all ${activeTab === 'config' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Configurations
               </button>
               <button 
                 onClick={() => setActiveTab('sites')}
                 className={`px-4 py-2 rounded-md transition-all ${activeTab === 'sites' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Sites
               </button>
               <button 
                 onClick={() => setActiveTab('activity')}
                 className={`px-4 py-2 rounded-md transition-all ${activeTab === 'activity' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Activity Logs
               </button>
               <button 
                 onClick={() => setActiveTab('system')}
                 className={`px-4 py-2 rounded-md transition-all ${activeTab === 'system' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 System Health
               </button>
               <button 
                 onClick={() => setActiveTab('developer')}
                 className={`px-4 py-2 rounded-md transition-all ${activeTab === 'developer' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Backend / Dev
               </button>
             </>
           )}
        </div>
      </div>

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Users" value={systemUsers.length} icon={Users} />
              <StatCard title="Managers" value={systemUsers.filter(u => u.role === 'manager').length} icon={Users} />
              <StatCard title="Supervisors" value={systemUsers.filter(u => u.role === 'supervisor').length} icon={Users} />
           </div>

           <Card className="overflow-hidden">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-semibold text-slate-800">System Users Directory</h3>
               <Button size="sm" onClick={openAddUser}>
                 <UserPlus size={16} className="mr-2" /> Add User
               </Button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Name / Role</th>
                      <th className="px-6 py-3">Contact Info</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Last Login</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemUsers.map(user => {
                      const allowedToManage = canManageTargetUser(user);
                      
                      return (
                        <tr key={user.id} className="border-b hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                {user.name}
                                {!allowedToManage && <Lock size={12} className="text-slate-400" />}
                            </div>
                            <div className={`text-xs inline-block px-2 py-0.5 rounded mt-1 capitalize border ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-100 border-slate-200'}`}>
                               {user.role.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-600">{user.email}</div>
                            {user.phone && (
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <Phone size={12} /> {user.phone}
                                </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs border ${user.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-600'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                             {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                 {allowedToManage ? (
                                   <>
                                     <button 
                                       onClick={() => openEditUser(user)} 
                                       className="text-slate-500 hover:text-blue-600 p-1 bg-slate-100 rounded transition-colors"
                                       title="Edit User"
                                     >
                                         <Edit size={16} />
                                     </button>
                                     <button 
                                       onClick={() => deleteSystemUser(user.id)} 
                                       className="text-slate-500 hover:text-red-600 p-1 bg-slate-100 rounded transition-colors"
                                       title="Delete User"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                   </>
                                 ) : (
                                   <div className="flex gap-2 opacity-50 cursor-not-allowed">
                                       <div className="p-1 bg-slate-50 rounded"><Lock size={16} className="text-slate-300"/></div>
                                   </div>
                                 )}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
           </Card>
        </div>
      )}

      {/* ACCESS CONTROL TAB */}
      {activeTab === 'permissions' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                  <Lock className="text-blue-600 mt-1 shrink-0" />
                  <div>
                      <h3 className="font-bold text-blue-900">Feature Access Matrix</h3>
                      <p className="text-sm text-blue-800">
                          Define which roles can access specific modules.
                      </p>
                  </div>
              </div>

              <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-900 text-white border-b uppercase text-xs">
                              <tr>
                                  <th className="px-6 py-4">Feature / Module</th>
                                  {roles.map(role => (
                                      <th key={role} className="px-6 py-4 text-center capitalize">
                                          {role.replace('_', ' ')}
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {features.map(feature => (
                                  <tr key={feature.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-800">
                                          {feature.label}
                                      </td>
                                      {roles.map(role => {
                                          const hasAccess = permissions[role][feature.id];
                                          return (
                                              <td key={`${role}-${feature.id}`} className="px-6 py-4 text-center">
                                                  <button
                                                      onClick={() => updatePermission(role, feature.id, !hasAccess)}
                                                      className={`
                                                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                          ${hasAccess ? 'bg-green-600' : 'bg-slate-200'}
                                                      `}
                                                  >
                                                      <span
                                                          className={`
                                                              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                              ${hasAccess ? 'translate-x-5' : 'translate-x-0'}
                                                          `}
                                                      />
                                                  </button>
                                              </td>
                                          );
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      )}
      
      {/* CONFIGURATIONS TAB (SUPER ADMIN ONLY) */}
      {activeTab === 'config' && isSuperAdmin && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex items-start gap-3">
                  <Sliders className="text-purple-600 mt-1 shrink-0" />
                  <div>
                      <h3 className="font-bold text-purple-900">System Options Configuration</h3>
                      <p className="text-sm text-purple-800">
                          Add or remove options for dropdowns used throughout the application. Changes reflect immediately.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Machine Types Config */}
                 <Card className="p-5 flex flex-col">
                     <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Machine Types</h4>
                     <ul className="flex-1 space-y-2 mb-4 max-h-60 overflow-y-auto">
                        {systemConfig.machineTypes.map((opt, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded text-sm">
                                <span>{opt}</span>
                                <button onClick={() => handleDeleteConfigOption('machineTypes', opt)} className="text-slate-400 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            </li>
                        ))}
                     </ul>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder="Add New Type..."
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    handleAddConfigOption('machineTypes');
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                            onChange={(e) => setNewConfigOption(e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleAddConfigOption('machineTypes')}><Plus size={16}/></Button>
                     </div>
                 </Card>

                 {/* Spare Part Categories Config */}
                 <Card className="p-5 flex flex-col">
                     <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Spare Part Categories</h4>
                     <ul className="flex-1 space-y-2 mb-4 max-h-60 overflow-y-auto">
                        {systemConfig.partCategories.map((opt, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded text-sm">
                                <span>{opt}</span>
                                <button onClick={() => handleDeleteConfigOption('partCategories', opt)} className="text-slate-400 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            </li>
                        ))}
                     </ul>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder="Add Category..."
                            onChange={(e) => setNewConfigOption(e.target.value)}
                             onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    handleAddConfigOption('partCategories');
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                        <Button size="sm" onClick={() => handleAddConfigOption('partCategories')}><Plus size={16}/></Button>
                     </div>
                 </Card>

                 {/* Maintenance Job Types Config */}
                 <Card className="p-5 flex flex-col">
                     <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Maintenance Job Types</h4>
                     <ul className="flex-1 space-y-2 mb-4 max-h-60 overflow-y-auto">
                        {systemConfig.maintenanceTypes.map((opt, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded text-sm">
                                <span>{opt}</span>
                                <button onClick={() => handleDeleteConfigOption('maintenanceTypes', opt)} className="text-slate-400 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            </li>
                        ))}
                     </ul>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder="Add Job Type..."
                            onChange={(e) => setNewConfigOption(e.target.value)}
                             onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    handleAddConfigOption('maintenanceTypes');
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                        <Button size="sm" onClick={() => handleAddConfigOption('maintenanceTypes')}><Plus size={16}/></Button>
                     </div>
                 </Card>
              </div>
          </div>
      )}

      {/* DEVELOPER TAB (SUPER ADMIN ONLY) */}
      {activeTab === 'developer' && isSuperAdmin && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500 rounded text-slate-900">
                              <Terminal size={24} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold">Developer Console</h3>
                              <p className="text-slate-400 text-sm">Backend tools, department toggles, and debugging.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-300">Floating Dev Widget</span>
                          <button 
                             onClick={toggleDevMode}
                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDevMode ? 'bg-green-600' : 'bg-slate-700'}`}
                          >
                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isDevMode ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Role Simulator */}
                      <div>
                          <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                              <UserCog size={18} /> Role Simulator (Departments)
                          </h4>
                          <p className="text-xs text-slate-400 mb-4">
                              Toggle your session context. Turn on "Floating Widget" to keep switching access while in restricted roles (Operator/Supervisor).
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                              {['super_admin', 'manager', 'supervisor', 'operator'].map(r => (
                                  <button
                                      key={r}
                                      onClick={() => switchIdentity(r as any)}
                                      className={`px-3 py-2 rounded border text-sm capitalize transition-all ${currentRole === r ? 'bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-slate-600 hover:bg-slate-800 text-slate-300'}`}
                                  >
                                      {r.replace('_', ' ')}
                                      {currentRole === r && ' (Active)'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Route Jumper */}
                      <div>
                          <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                              <Map size={18} /> Route Jumper (Sections)
                          </h4>
                           <p className="text-xs text-slate-400 mb-4">
                              Force navigation to specific app sections instantly.
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                              {['dashboard', 'machines', 'sites', 'shifts', 'fuel', 'maintenance', 'spare_parts', 'reports', 'admin', 'chat'].map(p => (
                                  <button
                                      key={p}
                                      onClick={() => setPage(p as any)}
                                      className={`px-2 py-1.5 rounded border text-xs capitalize transition-all ${currentPage === p ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'border-slate-600 hover:bg-slate-800 text-slate-300'}`}
                                  >
                                      {p.replace('_', ' ')}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Debug Info */}
                  <div className="mt-8 pt-4 border-t border-slate-800">
                      <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Code size={12}/> Session State
                      </h4>
                      <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-400 overflow-x-auto">
                          {`{
  "currentRole": "${currentRole}",
  "isDevMode": ${isDevMode},
  "currentPage": "${currentPage}",
  "permissions": ${JSON.stringify(permissions[currentRole])}
}`}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SYSTEM HEALTH TAB (SUPER ADMIN ONLY) */}
      {activeTab === 'system' && isSuperAdmin && (
        <div className="space-y-6 animate-in fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Server size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">System Status</h3>
                    <p className="text-sm text-slate-500">Version 1.0.0 (Beta)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-slate-600">Database Status</span>
                     <span className="text-green-600 font-medium flex items-center gap-1">● Connected</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-slate-600">API Latency</span>
                     <span className="text-slate-900 font-medium">24ms</span>
                  </div>
                   <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-slate-600">Storage Usage</span>
                     <span className="text-slate-900 font-medium">45%</span>
                  </div>
                </div>
             </Card>

             <Card className="p-6 border-red-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Danger Zone</h3>
                    <p className="text-sm text-slate-500">Irreversible actions</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Resetting the system will revert all data (machines, shifts, logs) to the default demo state. Any changes made during this session will be lost.
                </p>
                <Button variant="danger" className="w-full" onClick={() => {
                   if(window.confirm('Are you sure you want to reset all data to factory defaults?')) {
                      resetSystemData();
                   }
                }}>
                   Reset System Data
                </Button>
             </Card>
           </div>
        </div>
      )}

      {/* SITES TAB (SUPER ADMIN ONLY) */}
      {activeTab === 'sites' && isSuperAdmin && (
          <div className="space-y-6 animate-in fade-in">
              <Card className="p-8 text-center bg-slate-50 border-dashed">
                 <h3 className="text-lg font-medium text-slate-700">Site Management</h3>
                 <p className="text-sm text-slate-500 mb-4">Add or archive project sites.</p>
                 <Button onClick={() => setShowSiteModal(true)}>Add New Site</Button>
              </Card>
          </div>
      )}

      {/* ACTIVITY TAB (SUPER ADMIN ONLY) */}
      {activeTab === 'activity' && isSuperAdmin && (
          <div className="space-y-6 animate-in fade-in">
               <div className="flex justify-between items-center">
                   <div className="flex gap-2">
                       <button 
                         onClick={() => setActivityFilter('all')}
                         className={`px-3 py-1.5 rounded-md text-sm font-medium ${activityFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                       >
                         All Activity
                       </button>
                       <button 
                         onClick={() => setActivityFilter('login')}
                         className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activityFilter === 'login' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-blue-600'}`}
                       >
                         <LogIn size={16} /> Login History (User Access)
                       </button>
                   </div>
               </div>

               <Card className="overflow-hidden">
                 <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        {activityFilter === 'login' ? <LogIn size={18}/> : <MapPin size={18}/>}
                        {activityFilter === 'login' ? 'User Login & Location Access Logs' : 'Global Activity Logs'}
                     </h3>
                     <span className="text-xs text-slate-500">{filteredActivity.length} events found</span>
                 </div>
                 <table className="w-full text-sm text-left">
                   <thead className="bg-white text-slate-500 border-b uppercase text-xs">
                     <tr>
                       <th className="px-6 py-3">User</th>
                       <th className="px-6 py-3">Action / Event</th>
                       <th className="px-6 py-3">Geo-Location</th>
                       <th className="px-6 py-3">Time</th>
                       <th className="px-6 py-3 text-right">Details</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredActivity.map(act => (
                       <tr key={act.id} className={`border-b hover:bg-slate-50 ${act.action === 'Login' ? 'bg-blue-50/30' : ''}`}>
                         <td className="px-6 py-4 font-medium">
                            {systemUsers.find(u => u.id === act.user_id)?.name || act.user_id}
                         </td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${act.action === 'Login' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-slate-700'}`}>
                                {act.action === 'Login' && <LogIn size={12} />}
                                {act.action}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                                    <MapPin size={14} />
                                </div>
                                <div className="font-mono text-xs">
                                   {act.geo_lat?.toFixed(4)}, {act.geo_lng?.toFixed(4)}
                                </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(act.timestamp).toLocaleString()}</td>
                         <td className="px-6 py-4 text-right text-xs text-slate-500">
                             <div className="flex justify-end items-center gap-2">
                                <span>{act.details}</span>
                                {act.geo_lat && (
                                    <button 
                                      className="text-blue-600 hover:underline"
                                      onClick={() => alert(`Opening Map View for coordinates: ${act.geo_lat}, ${act.geo_lng}`)}
                                    >
                                        [Map]
                                    </button>
                                )}
                             </div>
                         </td>
                       </tr>
                     ))}
                     {filteredActivity.length === 0 && (
                         <tr>
                             <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                                 No records found for the selected filter.
                             </td>
                         </tr>
                     )}
                   </tbody>
                 </table>
               </Card>
          </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingUserId ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2"
                  value={userForm.name}
                  onChange={e => setUserForm({...userForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full border rounded p-2"
                  value={userForm.email}
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Assigned)</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2"
                  placeholder="+91..."
                  value={userForm.phone}
                  onChange={e => setUserForm({...userForm, phone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select 
                      className="w-full border rounded p-2 capitalize"
                      value={userForm.role}
                      onChange={e => setUserForm({...userForm, role: e.target.value as Role})}
                    >
                      {availableRolesForCreation.map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                      className="w-full border rounded p-2 capitalize"
                      value={userForm.status}
                      onChange={e => setUserForm({...userForm, status: e.target.value as any})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                <Button type="button" variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button>
                <Button type="submit">{editingUserId ? 'Save Changes' : 'Create User'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Site Modal */}
      {showSiteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
             <h3 className="text-xl font-bold mb-4">Add Project Site</h3>
             <form onSubmit={handleAddSite} className="space-y-4">
                 <div>
                     <label className="block text-sm font-medium mb-1">Site Name</label>
                     <input type="text" required className="w-full border rounded p-2" value={siteForm.name} onChange={e => setSiteForm({...siteForm, name: e.target.value})} />
                 </div>
                 <div>
                     <label className="block text-sm font-medium mb-1">Client Name</label>
                     <input type="text" className="w-full border rounded p-2" value={siteForm.client} onChange={e => setSiteForm({...siteForm, client: e.target.value})} />
                 </div>
                 <div>
                     <label className="block text-sm font-medium mb-1">Location</label>
                     <input type="text" className="w-full border rounded p-2" value={siteForm.location} onChange={e => setSiteForm({...siteForm, location: e.target.value})} />
                 </div>
                 <div className="flex gap-2 justify-end mt-4">
                    <Button type="button" variant="secondary" onClick={() => setShowSiteModal(false)}>Cancel</Button>
                    <Button type="submit">Add Site</Button>
                 </div>
             </form>
          </Card>
        </div>
      )}
    </div>
  );
};
