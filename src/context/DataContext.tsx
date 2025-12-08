import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Machine, Site, Shift, FuelLog, MaintenanceJob, SparePart, Operator, MachineStatus } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  machines: Machine[];
  sites: Site[];
  shifts: Shift[];
  fuelLogs: FuelLog[];
  maintenanceJobs: MaintenanceJob[];
  spareParts: SparePart[];
  operators: Operator[];
  loading: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  updateMachineStatus: (id: string, status: MachineStatus) => Promise<void>;
  createShift: (shift: Partial<Shift>) => Promise<void>;
  recordFuel: (log: Partial<FuelLog>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJob[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) refreshData();
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [m, s, sh, f, mj, sp, ops] = await Promise.all([
        supabase.from('machines').select('*').order('code'),
        supabase.from('sites').select('*'),
        supabase.from('shifts').select('*').order('shift_date', { ascending: false }).limit(100),
        supabase.from('fuel_logs').select('*').order('timestamp', { ascending: false }).limit(100),
        supabase.from('maintenance_jobs').select('*').order('scheduled_date'),
        supabase.from('spare_parts').select('*'),
        supabase.from('operators').select('*')
      ]);

      if (m.data) setMachines(m.data);
      if (s.data) setSites(s.data);
      if (sh.data) setShifts(sh.data);
      if (f.data) setFuelLogs(f.data);
      if (mj.data) setMaintenanceJobs(mj.data);
      if (sp.data) setSpareParts(sp.data);
      if (ops.data) setOperators(ops.data);

    } catch (e) {
      console.error("Data load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const updateMachineStatus = async (id: string, status: MachineStatus) => {
    const { error } = await supabase.from('machines').update({ status }).eq('id', id);
    if (!error) {
      setMachines(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    }
  };

  const createShift = async (shift: Partial<Shift>) => {
    const { data, error } = await supabase.from('shifts').insert([{ ...shift, created_by: user?.id }]).select();
    if (data) setShifts(prev => [...data, ...prev]);
  };

  const recordFuel = async (log: Partial<FuelLog>) => {
    const { data, error } = await supabase.from('fuel_logs').insert([{ ...log, created_by: user?.id }]).select();
    if (data) setFuelLogs(prev => [...data, ...prev]);
  };

  return (
    <DataContext.Provider value={{
      machines, sites, shifts, fuelLogs, maintenanceJobs, spareParts, operators, loading,
      refreshData, updateMachineStatus, createShift, recordFuel
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within DataProvider');
  return context;
};
