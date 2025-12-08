import React from 'react';
import { useData } from '../context/DataContext';
import { StatCard, Card } from '../components/ui/Common';
import { Truck, Users, Droplet, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Dashboard = () => {
  const { machines, shifts, fuelLogs, maintenanceJobs, loading } = useData();

  if (loading) return <div className="p-10 text-center">Loading Fleet Intelligence...</div>;

  const totalMachines = machines.length;
  const activeMachines = machines.filter(m => m.status === 'Working').length;
  const breakdownMachines = machines.filter(m => m.status === 'Breakdown').length;
  
  // Fuel Logic
  const fuelConsumed = fuelLogs.reduce((acc, log) => acc + log.litres, 0);
  const anomalies = fuelLogs.filter(log => log.event_type === 'TheftSuspected' || log.event_type === 'LeakSuspected').length;

  const statusData = [
    { name: 'Working', value: activeMachines, color: '#10b981' },
    { name: 'Idle', value: machines.filter(m => m.status === 'Idle').length, color: '#94a3b8' },
    { name: 'Breakdown', value: breakdownMachines, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Control Tower</h2>
        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full animate-pulse">Live Telemetry Active</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Fleet Availability" value={`${Math.round(((totalMachines - breakdownMachines)/totalMachines)*100 || 0)}%`} icon={Truck} trend={`${activeMachines} Active Now`} />
        <StatCard title="Fuel Integrity" value={anomalies > 0 ? `${anomalies} Alerts` : 'Secure'} icon={Droplet} trend={`${fuelConsumed}L Consumed`} className={anomalies > 0 ? 'border-red-200 bg-red-50' : ''} />
        <StatCard title="Maintenance" value={maintenanceJobs.filter(j => j.status === 'Open').length} icon={AlertTriangle} trend="Open Jobs" />
        <StatCard title="Est. Cost (Mo)" value="$12.5k" icon={DollarSign} trend="Within Budget" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="p-6">
            <h3 className="font-bold mb-4">Real-time Status</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Legend verticalAlign="bottom" />
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
         </Card>
         
         <Card className="lg:col-span-2 p-6">
             <h3 className="font-bold mb-4">Utilization Trends (Last 7 Days)</h3>
             <div className="h-64 flex items-center justify-center bg-slate-50 text-slate-400 border border-dashed rounded">
                 Chart Data Loading from Supabase...
             </div>
         </Card>
      </div>
    </div>
  );
};
