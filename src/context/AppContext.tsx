
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { 
  Machine, Operator, Site, Shift, FuelLog, MaintenanceJob,
  Role, Page, SystemUser, SparePart, PartTransaction,
  UserActivity, RolePermissions, Feature, UserReminder, ChatMessage,
  MachineType, MaintenanceType, MachineStatus
} from '../types';
import { INITIAL_PERMISSIONS } from '../constants';

// System Configuration Interface
export interface SystemConfig {
  machineTypes: string[];
  partCategories: string[];
  maintenanceTypes: string[];
}

interface AppContextType {
  // Data
  machines: Machine[];
  operators: Operator[];
  sites: Site[];
  shifts: Shift[];
  fuelLogs: FuelLog[];
  maintenanceJobs: MaintenanceJob[];
  systemUsers: SystemUser[];
  spareParts: SparePart[];
  partTransactions: PartTransaction[];
  userActivity: UserActivity[];
  userReminders: UserReminder[];
  chatMessages: ChatMessage[];
  unreadChat: boolean;
  
  // System Config
  systemConfig: SystemConfig;
  updateSystemConfig: (key: keyof SystemConfig, newOptions: string[]) => void;

  // Actions
  addShift: (shift: Shift) => void;
  bulkAddShifts: (shifts: Shift[]) => void;
  updateShift: (shift: Shift) => void;
  addFuelLog: (log: FuelLog) => void;
  addMaintenanceJob: (job: MaintenanceJob) => void;
  updateMachineStatus: (id: string, status: any) => void;
  addMachine: (machine: Machine) => void;
  updateMachines: (ids: string[], updates: Partial<Machine>) => void;
  
  // Spare Parts Actions
  addSparePart: (part: SparePart) => void;
  updateSparePart: (id: string, updates: Partial<SparePart>) => void;
  deleteSparePart: (id: string) => void;
  adjustPartStock: (transaction: PartTransaction) => void;
  verifyStock: (partId: string) => void;

  // Admin Actions
  addSystemUser: (user: SystemUser) => void;
  updateSystemUser: (id: string, updates: Partial<SystemUser>) => void;
  deleteSystemUser: (id: string) => void;
  resetSystemData: () => void;
  
  // Super Admin & Permissions
  permissions: Record<string, RolePermissions>;
  updatePermission: (role: string, feature: Feature, value: boolean) => void;
  canAccess: (feature: Feature) => boolean;
  addSite: (site: Site) => void;
  deleteSite: (id: string) => void;
  updateSite: (id: string, updates: Partial<Site>) => void;

  // User Reminders (Generic for all depts)
  addUserReminder: (reminder: UserReminder) => void;
  toggleUserReminder: (id: string) => void;
  deleteUserReminder: (id: string) => void;
  
  // Chat Actions
  sendChatMessage: (text: string) => void;
  deleteChatMessage: (id: string) => void;
  editChatMessage: (id: string, newText: string) => void;
  markChatRead: () => void;
  
  // Navigation & Role & Auth
  currentRole: Role;
  setRole: (role: Role) => void;
  currentPage: Page;
  setPage: (page: Page) => void;
  currentUser: Operator | null; // For Operator View
  setCurrentUser: (op: Operator | null) => void;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  
  // Dev Mode & Helpers
  isDevMode: boolean;
  toggleDevMode: () => void;
  switchIdentity: (role: Role) => void;
  getCurrentSystemIdentity: () => { id: string, name: string };
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, signIn, signOut } = useAuth();
  
  // Data States
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJob[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [partTransactions, setPartTransactions] = useState<PartTransaction[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [userReminders, setUserReminders] = useState<UserReminder[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // UI States
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [unreadChat, setUnreadChat] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
      machineTypes: Object.values(MachineType),
      partCategories: ['Filter', 'Engine', 'Hydraulic', 'Electrical', 'Undercarriage', 'Tires', 'Lubricant', 'Other'],
      maintenanceTypes: Object.values(MaintenanceType)
  });
  
  const [currentRole, setRole] = useState<Role>('manager'); // Default fallback
  const [currentPage, setPage] = useState<Page>('dashboard');
  const [currentUser, setCurrentUser] = useState<Operator | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Sync Auth State
  useEffect(() => {
    if (user) {
        setRole(user.role);
    }
  }, [user]);

  // Fetch Data on Load
  useEffect(() => {
    if (user) {
        refreshData();
        setupRealtimeSubscription();
    }
  }, [user]);

  const refreshData = async () => {
    setDataLoading(true);
    try {
        const [m, s, sh, f, mj, sp, pt, op, su, ua, ch] = await Promise.all([
            supabase.from('machines').select('*').order('code'),
            supabase.from('sites').select('*'),
            supabase.from('shifts').select('*').order('shift_date', { ascending: false }).limit(200),
            supabase.from('fuel_logs').select('*').order('timestamp', { ascending: false }).limit(200),
            supabase.from('maintenance_jobs').select('*').order('scheduled_date'),
            supabase.from('spare_parts').select('*'),
            supabase.from('part_transactions').select('*').order('timestamp', { ascending: false }),
            supabase.from('operators').select('*'),
            supabase.from('system_users').select('*'),
            supabase.from('user_activity').select('*').order('timestamp', { ascending: false }).limit(100),
            supabase.from('chat_messages').select('*').order('timestamp', { ascending: true })
        ]);

        if (m.data) setMachines(m.data);
        if (s.data) setSites(s.data);
        if (sh.data) setShifts(sh.data);
        if (f.data) setFuelLogs(f.data);
        if (mj.data) setMaintenanceJobs(mj.data);
        if (sp.data) setSpareParts(sp.data);
        if (pt.data) setPartTransactions(pt.data);
        if (op.data) setOperators(op.data);
        if (su.data) setSystemUsers(su.data);
        // if (ua.data) setUserActivity(ua.data); // Assuming user_activity table exists
        if (ch.data) setChatMessages(ch.data);

    } catch (e) {
        console.error("Failed to load initial data", e);
    } finally {
        setDataLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
      // In production, you would set up Supabase realtime channels here
      // For now, we rely on optimistic updates or manual refresh
  };

  // Auth wrappers
  const login = async (email: string, pass: string) => {
      const { error } = await signIn(email, pass);
      if (error) {
          alert('Login failed: ' + error.message);
          return false;
      }
      setPage('dashboard');
      return true;
  };

  const logout = () => {
      signOut();
      setPage('dashboard');
  };

  const toggleDevMode = () => setIsDevMode(prev => !prev);
  
  const switchIdentity = (targetRole: Role) => {
    setRole(targetRole);
    setPage('dashboard');
  };

  const getCurrentSystemIdentity = () => {
      if (user) return { id: user.id, name: user.name };
      return { id: 'unknown', name: 'Guest' };
  };

  const updateSystemConfig = (key: keyof SystemConfig, newOptions: string[]) => {
      setSystemConfig(prev => ({ ...prev, [key]: newOptions }));
  };

  // --- CRUD OPERATIONS ---

  const addShift = async (shift: Shift) => {
    const { data, error } = await supabase.from('shifts').insert(shift).select().single();
    if (data) setShifts(prev => [data, ...prev]);
    else console.error(error);
  };

  const bulkAddShifts = async (newShifts: Shift[]) => {
    const { data, error } = await supabase.from('shifts').insert(newShifts).select();
    if (data) setShifts(prev => [...data, ...prev]);
  };

  const updateShift = async (updatedShift: Shift) => {
    const { error } = await supabase.from('shifts').update(updatedShift).eq('id', updatedShift.id);
    if (!error) {
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
        // Side effect: update machine status
        if (updatedShift.status === 'InProgress') updateMachineStatus(updatedShift.machine_id, 'Working');
        else if (updatedShift.status === 'Completed') updateMachineStatus(updatedShift.machine_id, 'Idle');
    }
  };

  const addFuelLog = async (log: FuelLog) => {
    const { data, error } = await supabase.from('fuel_logs').insert(log).select().single();
    if (data) setFuelLogs(prev => [data, ...prev]);
  };

  const addMaintenanceJob = async (job: MaintenanceJob) => {
    const { data, error } = await supabase.from('maintenance_jobs').insert(job).select().single();
    if (data) {
        setMaintenanceJobs(prev => [data, ...prev]);
        updateMachineStatus(job.machine_id, 'Breakdown');
    }
  };

  const updateMachineStatus = async (id: string, status: any) => {
    const { error } = await supabase.from('machines').update({ status }).eq('id', id);
    if (!error) {
        setMachines(prev => prev.map(m => m.id === id ? { ...m, status: status as MachineStatus } : m));
    }
  };

  const addMachine = async (machine: Machine) => {
    const { data, error } = await supabase.from('machines').insert(machine).select().single();
    if (data) setMachines(prev => [data, ...prev]);
  };

  const updateMachines = async (ids: string[], updates: Partial<Machine>) => {
    const { error } = await supabase.from('machines').update(updates).in('id', ids);
    if (!error) {
        setMachines(prev => prev.map(m => ids.includes(m.id) ? { ...m, ...updates } : m));
    }
  };

  const addSparePart = async (part: SparePart) => {
    const { data, error } = await supabase.from('spare_parts').insert(part).select().single();
    if (data) setSpareParts(prev => [data, ...prev]);
  };

  const updateSparePart = async (id: string, updates: Partial<SparePart>) => {
    const { error } = await supabase.from('spare_parts').update(updates).eq('id', id);
    if (!error) {
        setSpareParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const deleteSparePart = async (id: string) => {
    const { error } = await supabase.from('spare_parts').delete().eq('id', id);
    if (!error) {
        setSpareParts(prev => prev.filter(p => p.id !== id));
    }
  };

  const adjustPartStock = async (transaction: PartTransaction) => {
    // 1. Record Transaction
    const { data: tx, error: txError } = await supabase.from('part_transactions').insert(transaction).select().single();
    if (tx) setPartTransactions(prev => [tx, ...prev]);
    
    // 2. Update Stock
    const part = spareParts.find(p => p.id === transaction.part_id);
    if (part) {
        const qtyChange = transaction.type === 'IN' ? transaction.quantity : -transaction.quantity;
        const newStock = part.current_stock + qtyChange;
        
        const updates: Partial<SparePart> = { current_stock: newStock };
        if (transaction.type === 'IN') updates.last_received_date = transaction.date;
        else updates.last_issued_date = transaction.date;

        await updateSparePart(part.id, updates);
    }
  };

  const verifyStock = async (partId: string) => {
    const updates = { last_verified: new Date().toISOString(), verified_by: user?.name };
    await updateSparePart(partId, updates);
  };

  const addSystemUser = async (newUser: SystemUser) => {
    // In Supabase, creating a user usually involves auth.api.createUser (server side) 
    // or just inserting into public.system_users if managing profiles separately.
    const { data, error } = await supabase.from('system_users').insert(newUser).select().single();
    if (data) setSystemUsers(prev => [...prev, data]);
  };

  const updateSystemUser = async (id: string, updates: Partial<SystemUser>) => {
    const { error } = await supabase.from('system_users').update(updates).eq('id', id);
    if (!error) setSystemUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteSystemUser = async (id: string) => {
    const { error } = await supabase.from('system_users').delete().eq('id', id);
    if (!error) setSystemUsers(prev => prev.filter(u => u.id !== id));
  };

  const resetSystemData = async () => {
    if(confirm("This will wipe all data in the connected database. Are you sure?")) {
        // Implementation blocked for safety in production
        alert("Reset function disabled for production safety.");
    }
  };

  // Permission & Site Logic
  const updatePermission = (role: string, feature: Feature, value: boolean) => {
      setPermissions(prev => ({
          ...prev,
          [role]: { ...prev[role], [feature]: value }
      }));
  };

  const canAccess = (feature: Feature) => {
      const rolePerms = permissions[currentRole];
      return rolePerms ? rolePerms[feature] : false;
  };

  const addSite = async (site: Site) => {
      const { data } = await supabase.from('sites').insert(site).select().single();
      if (data) setSites(prev => [...prev, data]);
  };

  const deleteSite = async (id: string) => {
      const { error } = await supabase.from('sites').delete().eq('id', id);
      if (!error) setSites(prev => prev.filter(s => s.id !== id));
  };
  
  const updateSite = async (id: string, updates: Partial<Site>) => {
      const { error } = await supabase.from('sites').update(updates).eq('id', id);
      if (!error) setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // User Reminders (Mock implementation for now or create table)
  const addUserReminder = (reminder: UserReminder) => {
      setUserReminders(prev => [...prev, reminder]);
  };

  const toggleUserReminder = (id: string) => {
      setUserReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: !r.is_completed } : r));
  };

  const deleteUserReminder = (id: string) => {
      setUserReminders(prev => prev.filter(r => r.id !== id));
  };
  
  // Chat Logic (Supabase Realtime ideally)
  const sendChatMessage = async (text: string) => {
      const newMessage = {
          user_id: user?.id,
          user_name: user?.name || 'User',
          role: currentRole,
          message: text,
          timestamp: new Date().toISOString()
      };
      // const { data } = await supabase.from('chat_messages').insert(newMessage).select().single();
      // if (data) setChatMessages(prev => [...prev, data]);
      // Mocking locally for immediate feedback in demo
      const mockMsg = { ...newMessage, id: `msg-${Date.now()}` };
      setChatMessages(prev => [...prev, mockMsg]);
      setUnreadChat(true);
  };

  const deleteChatMessage = (id: string) => {
      setChatMessages(prev => prev.filter(m => m.id !== id));
  };

  const editChatMessage = (id: string, newText: string) => {
      setChatMessages(prev => prev.map(m => m.id === id ? { ...m, message: newText, is_edited: true } : m));
  };

  const markChatRead = () => {
      setUnreadChat(false);
  };

  return (
    <AppContext.Provider value={{
      machines, operators, sites, shifts, fuelLogs, maintenanceJobs, systemUsers, spareParts, partTransactions, userActivity, userReminders, chatMessages, unreadChat,
      systemConfig, updateSystemConfig,
      addShift, bulkAddShifts, updateShift, addFuelLog, addMaintenanceJob, updateMachineStatus, addMachine, updateMachines,
      addSparePart, updateSparePart, deleteSparePart, adjustPartStock, verifyStock,
      addSystemUser, updateSystemUser, deleteSystemUser, resetSystemData,
      permissions, updatePermission, canAccess, addSite, deleteSite, updateSite,
      addUserReminder, toggleUserReminder, deleteUserReminder,
      sendChatMessage, deleteChatMessage, editChatMessage, markChatRead,
      currentRole, setRole, currentPage, setPage, currentUser, setCurrentUser,
      isAuthenticated: !!user, login, logout,
      getCurrentSystemIdentity, isDevMode, toggleDevMode, switchIdentity,
      loading: dataLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
