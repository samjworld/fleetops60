
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Machine, Operator, Site, Shift, FuelLog, MaintenanceJob,
  Role, Page, SystemUser, SparePart, PartTransaction,
  UserActivity, RolePermissions, Feature, UserReminder, ChatMessage,
  MachineType, MaintenanceType
} from '../types';
import { 
  MOCK_MACHINES, MOCK_OPERATORS, MOCK_SITES, 
  MOCK_SHIFTS, MOCK_FUEL_LOGS, MOCK_MAINTENANCE, MOCK_SYSTEM_USERS,
  MOCK_SPARE_PARTS, MOCK_PART_TRANSACTIONS,
  MOCK_USER_ACTIVITY, INITIAL_PERMISSIONS, MOCK_OPERATOR_REMINDERS, MOCK_CHAT_MESSAGES
} from '../constants';

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
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  
  // Dev Mode & Helpers
  isDevMode: boolean;
  toggleDevMode: () => void;
  switchIdentity: (role: Role) => void;
  getCurrentSystemIdentity: () => { id: string, name: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>(MOCK_MACHINES);
  const [operators, setOperators] = useState<Operator[]>(MOCK_OPERATORS);
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(MOCK_FUEL_LOGS);
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJob[]>(MOCK_MAINTENANCE);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(MOCK_SYSTEM_USERS);
  const [spareParts, setSpareParts] = useState<SparePart[]>(MOCK_SPARE_PARTS);
  const [partTransactions, setPartTransactions] = useState<PartTransaction[]>(MOCK_PART_TRANSACTIONS);
  const [userActivity, setUserActivity] = useState<UserActivity[]>(MOCK_USER_ACTIVITY);
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [userReminders, setUserReminders] = useState<UserReminder[]>(MOCK_OPERATOR_REMINDERS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [unreadChat, setUnreadChat] = useState(false);
  
  // Dynamic Configuration State
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
      machineTypes: Object.values(MachineType),
      partCategories: ['Filter', 'Engine', 'Hydraulic', 'Electrical', 'Undercarriage', 'Tires', 'Lubricant', 'Other'],
      maintenanceTypes: Object.values(MaintenanceType)
  });
  
  // AUTO-LOGIN ENABLED: Defaults to Authenticated Super Admin
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentRole, setRole] = useState<Role>('super_admin');
  const [currentPage, setPage] = useState<Page>('dashboard');
  const [currentUser, setCurrentUser] = useState<Operator | null>(MOCK_OPERATORS[0]); 
  
  // For non-operator login tracking, default to Super Admin (U1)
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>('U1');
  const [isDevMode, setIsDevMode] = useState(false);

  const login = (email: string, pass: string) => {
      // 1. Check System Users
      const sysUser = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (sysUser && sysUser.password === pass && sysUser.status === 'Active') {
          setIsAuthenticated(true);
          setRole(sysUser.role);
          setLoggedInUserId(sysUser.id);
          setCurrentUser(null);
          setPage('dashboard');
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsAuthenticated(false);
      setLoggedInUserId(null);
      setRole('manager'); // Reset to default for safety
  };

  const toggleDevMode = () => {
    setIsDevMode(prev => !prev);
  };

  // Smart Role Switcher for Devs
  const switchIdentity = (targetRole: Role) => {
    setRole(targetRole);
    
    // Switch Identity based on mock data
    if (targetRole === 'operator') {
      setCurrentUser(operators[0]); // Assign first mock operator
      setLoggedInUserId(null);
      setPage('dashboard'); // Mobile operator dashboard
    } else {
      // Find a mock user for this role
      const mockUser = systemUsers.find(u => u.role === targetRole);
      if (mockUser) {
        setLoggedInUserId(mockUser.id);
      }
      setCurrentUser(null);
      setPage('dashboard');
    }
  };

  // Helper to simulate logged-in user based on demo role selection
  const getCurrentSystemIdentity = () => {
      if (currentRole === 'operator' && currentUser) {
          return { id: currentUser.id, name: currentUser.name };
      }
      
      // If actually logged in
      if (loggedInUserId) {
          const user = systemUsers.find(u => u.id === loggedInUserId);
          return { id: user?.id || 'U-Unknown', name: user?.name || 'Unknown User' };
      }
      
      // Fallback for demo mode if bypassing auth
      const mapRoleToUser: Record<string, string> = {
          'super_admin': 'U1',
          'manager': 'U2',
          'supervisor': 'U3'
      };
      const userId = mapRoleToUser[currentRole] || 'U2';
      const user = systemUsers.find(u => u.id === userId);
      return { id: user?.id || 'unknown', name: user?.name || 'Unknown User' };
  };

  const updateSystemConfig = (key: keyof SystemConfig, newOptions: string[]) => {
      setSystemConfig(prev => ({ ...prev, [key]: newOptions }));
  };

  const addShift = (shift: Shift) => {
    setShifts(prev => [shift, ...prev]);
  };

  const bulkAddShifts = (newShifts: Shift[]) => {
    setShifts(prev => [...newShifts, ...prev]);
  };

  const updateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    
    // Side effect: Update machine status based on shift
    if (updatedShift.status === 'In Progress') {
       updateMachineStatus(updatedShift.machine_id, 'Working');
    } else if (updatedShift.status === 'Completed') {
       updateMachineStatus(updatedShift.machine_id, 'Idle');
    }
  };

  const addFuelLog = (log: FuelLog) => {
    setFuelLogs(prev => [log, ...prev]);
  };

  const addMaintenanceJob = (job: MaintenanceJob) => {
    setMaintenanceJobs(prev => [job, ...prev]);
    updateMachineStatus(job.machine_id, 'Breakdown');
  };

  const updateMachineStatus = (id: string, status: any) => {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, current_status: status } : m));
  };

  const addMachine = (machine: Machine) => {
    setMachines(prev => [machine, ...prev]);
  };

  const updateMachines = (ids: string[], updates: Partial<Machine>) => {
    setMachines(prev => prev.map(m => ids.includes(m.id) ? { ...m, ...updates } : m));
  };

  // Spare Parts Logic
  const addSparePart = (part: SparePart) => {
    setSpareParts(prev => [part, ...prev]);
  };

  const updateSparePart = (id: string, updates: Partial<SparePart>) => {
    setSpareParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteSparePart = (id: string) => {
    setSpareParts(prev => prev.filter(p => p.id !== id));
  };

  const adjustPartStock = (transaction: PartTransaction) => {
    setPartTransactions(prev => [transaction, ...prev]);
    setSpareParts(prev => prev.map(p => {
      if (p.id === transaction.part_id) {
        const qtyChange = transaction.type === 'IN' ? transaction.quantity : -transaction.quantity;
        const updates: Partial<SparePart> = { 
            current_stock: p.current_stock + qtyChange 
        };
        if (transaction.type === 'IN') {
            updates.last_received_date = transaction.date;
        } else {
            updates.last_issued_date = transaction.date;
        }
        return { ...p, ...updates };
      }
      return p;
    }));
  };

  const verifyStock = (partId: string) => {
    setSpareParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, last_verified: new Date().toISOString(), verified_by: 'Current User' };
      }
      return p;
    }));
  };

  // Admin Functions
  const addSystemUser = (user: SystemUser) => {
    setSystemUsers(prev => [...prev, user]);
  };

  const updateSystemUser = (id: string, updates: Partial<SystemUser>) => {
    setSystemUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteSystemUser = (id: string) => {
    setSystemUsers(prev => prev.filter(u => u.id !== id));
  };

  const resetSystemData = () => {
    setMachines(MOCK_MACHINES);
    setOperators(MOCK_OPERATORS);
    setSites(MOCK_SITES);
    setShifts(MOCK_SHIFTS);
    setFuelLogs(MOCK_FUEL_LOGS);
    setMaintenanceJobs(MOCK_MAINTENANCE);
    setSystemUsers(MOCK_SYSTEM_USERS);
    setSpareParts(MOCK_SPARE_PARTS);
    setPartTransactions(MOCK_PART_TRANSACTIONS);
    setUserActivity(MOCK_USER_ACTIVITY);
    setUserReminders(MOCK_OPERATOR_REMINDERS);
    setChatMessages(MOCK_CHAT_MESSAGES);
    alert('System data has been reset to defaults.');
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

  const addSite = (site: Site) => {
      setSites(prev => [...prev, site]);
  };

  const deleteSite = (id: string) => {
      setSites(prev => prev.filter(s => s.id !== id));
  };
  
  const updateSite = (id: string, updates: Partial<Site>) => {
      setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // User Reminders
  const addUserReminder = (reminder: UserReminder) => {
      setUserReminders(prev => [...prev, reminder]);
  };

  const toggleUserReminder = (id: string) => {
      setUserReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: !r.is_completed } : r));
  };

  const deleteUserReminder = (id: string) => {
      setUserReminders(prev => prev.filter(r => r.id !== id));
  };

  // Chat Logic
  const sendChatMessage = (text: string) => {
      const user = getCurrentSystemIdentity();
      const newMessage: ChatMessage = {
          id: `MSG-${Date.now()}`,
          user_id: user.id,
          user_name: user.name,
          role: currentRole,
          message: text,
          timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, newMessage]);
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
      isAuthenticated, login, logout,
      getCurrentSystemIdentity, isDevMode, toggleDevMode, switchIdentity
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
