
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard, Card, Button } from '../components/ui/Common';
import { Truck, Users, Droplet, AlertTriangle, TrendingUp, CheckSquare, Plus, CheckCircle, Trash2, BarChart2, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { MachineStatus, ShiftStatus, MachineType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { calculateUtilization } from '../utils/helpers';
import { isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subDays, format, eachDayOfInterval } from 'date-fns';

export const Dashboard = () => {
  const { machines, operators, shifts, fuelLogs, maintenanceJobs, setPage, sites, partTransactions, spareParts, userReminders, addUserReminder, toggleUserReminder, deleteUserReminder, getCurrentSystemIdentity, currentRole } = useApp();

  // Inventory Timeframe State
  const [invTimeframe, setInvTimeframe] = useState<'day' | 'month' | 'year'>('month');
  
  // Work Analysis State
  const [workTimeframe, setWorkTimeframe] = useState<'week' | 'month'>('week');
  
  // Reminder State
  const [reminderText, setReminderText] = useState('');

  const currentUser = getCurrentSystemIdentity();
  
  // Calculations
  const totalMachines = machines.length;
  const activeMachines = machines.filter(m => m.current_status === MachineStatus.Working).length;
  const breakdownMachines = machines.filter(m => m.current_status === MachineStatus.Breakdown).length;
  const openJobs = maintenanceJobs.filter(j => j.status !== 'Completed').length;
  
  // Fuel Today (Simple Mock logic for 'today' check)
  const fuelUsed = fuelLogs.reduce((acc, log) => acc + log.litres, 0);

  // Reminders Filter
  const myReminders = userReminders.filter(r => r.user_id === currentUser.id);

  const handleAddReminder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!reminderText.trim()) return;
      addUserReminder({
          id: `REM-${Date.now()}`,
          user_id: currentUser.id,
          date: new Date().toISOString().split('T')[0],
          text: reminderText,
          is_completed: false
      });
      setReminderText('');
  };

  // Chart Data Preparation - STATUS
  const statusData = [
    { name: 'Working', value: activeMachines, color: '#10b981' }, // green-500
    { name: 'Idle', value: machines.filter(m => m.current_status === MachineStatus.Idle).length, color: '#94a3b8' }, // slate-400
    { name: 'Breakdown', value: breakdownMachines, color: '#ef4444' }, // red-500
    { name: 'Available', value: machines.filter(m => m.current_status === MachineStatus.Available).length, color: '#3b82f6' }, // blue-500
  ];

  // Chart Data Preparation - UTILIZATION
  const utilizationData = machines.slice(0, 5).map(m => {
    // Mock logic: aggregate shifts for this machine
    const machineShifts = shifts.filter(s => s.machine_id === m.id);
    const planned = machineShifts.reduce((acc, s) => acc + s.planned_hours, 0);
    const actual = machineShifts.reduce((acc, s) => acc + s.actual_work_hours, 0);
    return {
      name: m.code,
      utilization: calculateUtilization(actual, planned)
    };
  });

  // --- WORK ANALYTICS LOGIC (New Section) ---
  const workAnalytics = useMemo(() => {
    const today = new Date();
    const daysToSubtract = workTimeframe === 'week' ? 6 : 29;
    const startDate = subDays(today, daysToSubtract);
    
    // 1. Generate Array of Dates
    const dateRange = eachDayOfInterval({ start: startDate, end: today });

    // 2. Prepare Data Structure for Stacked Bar Chart
    // Format: [{ date: 'Mon', Excavator: 10, Dozer: 5, ... }, ...]
    const chartData = dateRange.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const shortDate = format(day, workTimeframe === 'week' ? 'EEE' : 'dd MMM');
        
        const dailyShifts = shifts.filter(s => s.shift_date === dateStr);
        
        // Initialize accumulator with date
        const acc: any = { name: shortDate, date: dateStr };
        
        // Sum hours by Machine Type
        dailyShifts.forEach(shift => {
            const machine = machines.find(m => m.id === shift.machine_id);
            if (machine) {
                const type = machine.type;
                acc[type] = (acc[type] || 0) + (shift.actual_work_hours || 0);
            }
        });

        return acc;
    });

    // 3. Prepare Data for Category Pie Chart (Total for period)
    const categoryTotals: Record<string, number> = {};
    const relevantShifts = shifts.filter(s => {
        const d = parseISO(s.shift_date);
        return isWithinInterval(d, { start: startDate, end: endOfDay(today) });
    });

    relevantShifts.forEach(shift => {
        const machine = machines.find(m => m.id === shift.machine_id);
        if (machine) {
             const type = machine.type;
             categoryTotals[type] = (categoryTotals[type] || 0) + (shift.actual_work_hours || 0);
        }
    });

    const pieData = Object.entries(categoryTotals).map(([name, value], index) => ({
        name, 
        value,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    })).filter(d => d.value > 0);

    return { chartData, pieData };
  }, [workTimeframe, shifts, machines]);

  // Extract unique keys (Machine Types) for the Stacked Bar Chart
  const machineTypesPresent = useMemo(() => {
     const keys = new Set<string>();
     workAnalytics.chartData.forEach(day => {
         Object.keys(day).forEach(k => {
             if (k !== 'name' && k !== 'date') keys.add(k);
         });
     });
     return Array.from(keys);
  }, [workAnalytics]);

  const typeColors: Record<string, string> = {
      [MachineType.Excavator]: '#3b82f6', // blue
      [MachineType.Dozer]: '#f59e0b', // amber
      [MachineType.Tipper]: '#10b981', // green
      [MachineType.Crane]: '#8b5cf6', // purple
      [MachineType.Loader]: '#ec4899', // pink
      [MachineType.Roller]: '#6366f1', // indigo
      [MachineType.Generator]: '#64748b', // slate
      [MachineType.Other]: '#94a3b8',
  };


  // --- INVENTORY ANALYTICS LOGIC ---
  const inventoryAnalysis = useMemo(() => {
    const now = new Date();
    let start, end;

    if (invTimeframe === 'day') {
        start = startOfDay(now);
        end = endOfDay(now);
    } else if (invTimeframe === 'month') {
        start = startOfMonth(now);
        end = endOfMonth(now);
    } else {
        start = startOfYear(now);
        end = endOfYear(now);
    }

    // 1. Filter Transactions by Timeframe and Type=OUT
    const relevantTransactions = partTransactions.filter(tx => {
        const txDate = parseISO(tx.date);
        return tx.type === 'OUT' && isWithinInterval(txDate, { start, end });
    });

    // 2. Aggregate Usage by Part
    const usageMap: Record<string, number> = {};
    relevantTransactions.forEach(tx => {
        usageMap[tx.part_id] = (usageMap[tx.part_id] || 0) + tx.quantity;
    });

    // 3. Sort Parts by Usage (Fast Moving)
    const sortedParts = Object.entries(usageMap)
        .map(([partId, qty]) => {
            const part = spareParts.find(p => p.id === partId);
            return { name: part?.name || partId, qty, partId };
        })
        .sort((a, b) => b.qty - a.qty);

    // 4. Categorize Fast/Medium/Slow
    let fastCount = 0;
    let mediumCount = 0;
    let slowCount = 0;

    const usedPartIds = new Set(Object.keys(usageMap));
    const totalParts = spareParts.length;
    
    // Slow moving are those with 0 usage in timeframe
    slowCount = totalParts - usedPartIds.size;

    // Split used parts into Fast (Top 33%) and Medium (Bottom 67% of used)
    const usedCount = usedPartIds.size;
    const fastThresholdIndex = Math.floor(usedCount * 0.33); 
    
    if (usedCount > 0) {
        fastCount = fastThresholdIndex || 1; // At least 1 if there is usage
        mediumCount = usedCount - fastCount;
    }

    return {
        topMoved: sortedParts.slice(0, 5), // Top 5 for bar chart
        distribution: [
            { name: 'Fast Moving', value: fastCount, color: '#10b981' },
            { name: 'Medium Moving', value: mediumCount, color: '#f59e0b' },
            { name: 'Slow Moving', value: slowCount, color: '#ef4444' }
        ]
    };
  }, [invTimeframe, partTransactions, spareParts]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <div className="text-sm text-slate-500">Welcome, {currentUser.name}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Machines" value={totalMachines} icon={Truck} />
        <StatCard title="Machines Working" value={activeMachines} icon={Truck} trend={`${Math.round((activeMachines/totalMachines)*100)}% Active`} />
        <StatCard title="Fuel Consumed" value={`${fuelUsed} L`} icon={Droplet} />
        <StatCard title="Open Maintenance" value={openJobs} icon={AlertTriangle} />
      </div>

      {/* --- NEW: WORK ANALYTICS SECTION --- */}
      <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <BarChart2 className="text-blue-600"/> Operational Analytics
             </h3>
             <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                 <button
                    onClick={() => setWorkTimeframe('week')}
                    className={`px-3 py-1 text-xs font-medium rounded ${workTimeframe === 'week' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                    Week
                 </button>
                 <button
                    onClick={() => setWorkTimeframe('month')}
                    className={`px-3 py-1 text-xs font-medium rounded ${workTimeframe === 'month' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                    Month
                 </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stacked Bar Chart */}
              <Card className="lg:col-span-2 p-6">
                  <h4 className="font-semibold text-slate-800 mb-4">Total Work Hours (Category Wise)</h4>
                  <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={workAnalytics.chartData} margin={{ left: -10 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip cursor={{fill: '#f1f5f9'}} />
                              <Legend iconType="circle" fontSize={10} />
                              {machineTypesPresent.map((type) => (
                                  <Bar 
                                    key={type} 
                                    dataKey={type} 
                                    stackId="a" 
                                    fill={typeColors[type] || '#cbd5e1'} 
                                    radius={[0,0,0,0]}
                                  />
                              ))}
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </Card>

              {/* Pie Chart Distribution */}
              <Card className="p-6">
                  <h4 className="font-semibold text-slate-800 mb-4">Work Distribution</h4>
                  <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={workAnalytics.pieData}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={2}
                                  dataKey="value"
                              >
                                  {workAnalytics.pieData.map((entry, index) => (
                                      <Cell key={`cell-work-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(val: number) => `${val} hrs`} />
                              <Legend verticalAlign="bottom" height={36} iconSize={10}/>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </Card>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Status Chart */}
        <Card className="lg:col-span-1 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Current Fleet Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={statusData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Utilization Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Top Machine Efficiency (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PERSONAL REMINDERS WIDGET */}
          <Card className="lg:col-span-1 p-0 overflow-hidden flex flex-col h-full">
               <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CheckSquare size={18} className="text-blue-600"/> My Personal Reminders
                    </h3>
               </div>
               <div className="p-4 border-b border-slate-100">
                    <form onSubmit={handleAddReminder} className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Add task..." 
                            className="flex-1 text-sm border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={reminderText}
                            onChange={(e) => setReminderText(e.target.value)}
                        />
                        <Button size="sm" type="submit" disabled={!reminderText.trim()}>
                            <Plus size={16} />
                        </Button>
                    </form>
               </div>
               <div className="flex-1 overflow-y-auto max-h-64">
                    {myReminders.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400 italic">
                            No active reminders.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {myReminders.map(rem => (
                                <li key={rem.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <button 
                                          onClick={() => toggleUserReminder(rem.id)}
                                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rem.is_completed ? 'bg-green-500 border-green-600 text-white' : 'border-slate-300 bg-white'}`}
                                        >
                                           {rem.is_completed && <CheckCircle size={12} />}
                                        </button>
                                        <span className={`text-sm ${rem.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {rem.text}
                                        </span>
                                    </div>
                                    <button onClick={() => deleteUserReminder(rem.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
               </div>
          </Card>

          {/* INVENTORY & OTHER WIDGETS */}
          <div className="lg:col-span-2 space-y-6">
              {/* --- INVENTORY ANALYTICS SECTION --- */}
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                         <TrendingUp className="text-blue-600"/> Inventory Health
                     </h3>
                     <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                         {['day', 'month', 'year'].map(period => (
                             <button
                                key={period}
                                onClick={() => setInvTimeframe(period as any)}
                                className={`px-3 py-1 text-xs font-medium rounded capitalize ${invTimeframe === period ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                             >
                                {period}
                             </button>
                         ))}
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Distribution Chart */}
                      <Card className="p-6">
                          <h4 className="font-semibold text-slate-800 mb-2">Stock Movement</h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={inventoryAnalysis.distribution}
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {inventoryAnalysis.distribution.map((entry, index) => (
                                            <Cell key={`cell-inv-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" iconSize={10} layout="horizontal" />
                                </PieChart>
                            </ResponsiveContainer>
                          </div>
                      </Card>

                      {/* Top Moved Items Chart */}
                      <Card className="p-6">
                          <h4 className="font-semibold text-slate-800 mb-2">Most Used Parts</h4>
                          <div className="h-48">
                            {inventoryAnalysis.topMoved.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={inventoryAnalysis.topMoved} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="qty" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} label={{ position: 'right', fill: '#64748b', fontSize: 10 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                    No data.
                                </div>
                            )}
                          </div>
                      </Card>
                  </div>
              </div>
          </div>
      </div>

      {/* Recent Shifts Table Snippet */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Today's Shifts</h3>
          <Button variant="outline" size="sm" onClick={() => setPage('shifts')}>View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3">Machine</th>
                <th className="px-6 py-3">Site</th>
                <th className="px-6 py-3">Operator</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {shifts.slice(0, 5).map(shift => {
                 const machine = machines.find(m => m.id === shift.machine_id);
                 const site = sites.find(s => s.id === shift.site_id);
                 const op = operators.find(o => o.id === shift.operator_id);
                 return (
                  <tr key={shift.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{machine?.code}</td>
                    <td className="px-6 py-4">{site?.name || shift.site_id}</td>
                    <td className="px-6 py-4">{op?.name}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-full text-xs ${shift.status === ShiftStatus.InProgress ? 'bg-green-100 text-green-800' : 'bg-slate-100'}`}>
                         {shift.status}
                       </span>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
