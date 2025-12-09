
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, StatusBadge } from '../components/ui/Common';
import { Shift, ShiftStatus, FuelEventType, MaintenanceType, MaintenanceStatus } from '../types';
import { formatDate } from '../utils/helpers';
import { Plus, Filter, Fuel, AlertTriangle, Play, Square, CalendarDays, X, UserCheck } from 'lucide-react';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

export const ShiftManager = () => {
  const { 
    shifts, machines, operators, sites, addShift, bulkAddShifts, updateShift, 
    addFuelLog, addMaintenanceJob, currentRole 
  } = useApp();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [filterSite, setFilterSite] = useState<string>('all');

  // New Single Shift State
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    shift_date: new Date().toISOString().split('T')[0],
    planned_start_time: '08:00',
    planned_end_time: '17:00',
    status: ShiftStatus.Planned
  });

  // Bulk Shift State
  const [bulkForm, setBulkForm] = useState({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      planned_start_time: '08:00',
      planned_end_time: '17:00',
      site_id: '',
      machine_id: '',
      operator_id: ''
  });

  const getAssignerName = () => {
      // In a real app, this would be the logged-in user's name
      return currentRole === 'super_admin' ? 'Super Admin' : 
             currentRole === 'manager' ? 'Site Manager' : 'Supervisor';
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.machine_id || !newShift.operator_id || !newShift.site_id) return;
    
    // Calculate planned hours
    const start = parseInt(newShift.planned_start_time!.split(':')[0]);
    const end = parseInt(newShift.planned_end_time!.split(':')[0]);
    
    addShift({
      ...newShift as Shift,
      id: `SH-${Date.now()}`,
      planned_hours: end - start,
      actual_work_hours: 0,
      idle_hours: 0,
      assigned_by: getAssignerName() // Track who assigned it
    });
    setShowAddModal(false);
  };

  const handleBulkCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!bulkForm.machine_id || !bulkForm.operator_id || !bulkForm.site_id) return;

      const startDate = parseISO(bulkForm.start_date);
      const endDate = parseISO(bulkForm.end_date);
      
      const startHour = parseInt(bulkForm.planned_start_time.split(':')[0]);
      const endHour = parseInt(bulkForm.planned_end_time.split(':')[0]);
      const plannedHours = endHour - startHour;

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const newShifts: Shift[] = days.map((day, idx) => ({
          id: `SH-BLK-${Date.now()}-${idx}`,
          machine_id: bulkForm.machine_id,
          operator_id: bulkForm.operator_id,
          site_id: bulkForm.site_id,
          shift_date: format(day, 'yyyy-MM-dd'),
          planned_start_time: bulkForm.planned_start_time,
          planned_end_time: bulkForm.planned_end_time,
          planned_hours: plannedHours,
          actual_work_hours: 0,
          idle_hours: 0,
          status: ShiftStatus.Planned,
          assigned_by: getAssignerName() // Track who assigned it
      }));

      bulkAddShifts(newShifts);
      setShowBulkModal(false);
      alert(`Successfully scheduled ${newShifts.length} shifts.`);
  };

  const filteredShifts = filterSite === 'all' 
    ? shifts 
    : shifts.filter(s => s.site_id === filterSite);

  // Actions for Supervisor
  const startShift = (shift: Shift) => {
    updateShift({
      ...shift,
      status: ShiftStatus.InProgress,
      actual_start_time: new Date().toISOString()
    });
  };

  const endShift = (shift: Shift) => {
    updateShift({
      ...shift,
      status: ShiftStatus.Completed,
      actual_end_time: new Date().toISOString(),
      actual_work_hours: shift.planned_hours // Mocking calculation for demo
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Shift Management</h2>
        <div className="flex space-x-2">
           <select 
             className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
             value={filterSite}
             onChange={(e) => setFilterSite(e.target.value)}
           >
             <option value="all">All Sites</option>
             {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>
           
           {['manager', 'super_admin'].includes(currentRole) && (
               <Button onClick={() => setShowBulkModal(true)} variant="secondary" className="flex items-center gap-2">
                   <CalendarDays size={16} /> Bulk Schedule
               </Button>
           )}

           <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
             <Plus size={16} /> Schedule Shift
           </Button>
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-4">
        {filteredShifts.map(shift => {
          const machine = machines.find(m => m.id === shift.machine_id);
          const op = operators.find(o => o.id === shift.operator_id);
          const site = sites.find(s => s.id === shift.site_id);

          return (
            <Card key={shift.id} className="p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg text-slate-900">{machine?.code}</span>
                    <span className="text-slate-500 text-sm">|</span>
                    <span className="font-medium text-slate-700">{op?.name}</span>
                    <StatusBadge status={shift.status} />
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap gap-4 items-center">
                    <span className="flex items-center gap-1">
                      <Filter size={14} /> {site?.name}
                    </span>
                    <span className="flex items-center gap-1">
                       {formatDate(shift.shift_date)} • {shift.planned_start_time} - {shift.planned_end_time}
                    </span>
                    {shift.assigned_by && (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                           <UserCheck size={12} /> Assigned by: {shift.assigned_by}
                        </span>
                    )}
                  </div>
                </div>

                {['supervisor', 'manager', 'super_admin'].includes(currentRole) && shift.status !== ShiftStatus.Completed && (
                  <div className="flex gap-2">
                    {shift.status === ShiftStatus.Planned && (
                      <Button size="sm" onClick={() => startShift(shift)} className="bg-green-600 hover:bg-green-700">
                        <Play size={16} className="mr-1" /> Start
                      </Button>
                    )}
                    {shift.status === ShiftStatus.InProgress && (
                      <Button size="sm" onClick={() => endShift(shift)} className="bg-slate-700 hover:bg-slate-800">
                        <Square size={16} className="mr-1" /> End
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => {
                        // Quick Action: Add Fuel
                        const liters = prompt("Enter Liters:");
                        if (liters) addFuelLog({
                            id: `F-${Date.now()}`,
                            machine_id: shift.machine_id,
                            site_id: shift.site_id,
                            log_datetime: new Date().toISOString(),
                            event_type: FuelEventType.Refuel,
                            litres: Number(liters),
                            recorded_by: 'Supervisor'
                        })
                    }}>
                      <Fuel size={16} />
                    </Button>
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => {
                            if(window.confirm('Report breakdown for this machine? This will create a maintenance ticket.')) {
                                addMaintenanceJob({
                                    id: `J-${Date.now()}`,
                                    machine_id: shift.machine_id,
                                    job_type: MaintenanceType.Breakdown,
                                    opened_on: new Date().toISOString().split('T')[0],
                                    status: MaintenanceStatus.Open,
                                    description: 'Reported by Supervisor from Shift List'
                                });
                            }
                        }}
                     >
                      <AlertTriangle size={16} className="mr-1" /> Breakdown
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Single Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Schedule New Shift</h3>
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full border rounded p-2"
                  value={newShift.shift_date}
                  onChange={e => setNewShift({...newShift, shift_date: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                  <input 
                    type="time" 
                    className="w-full border rounded p-2"
                    value={newShift.planned_start_time}
                    onChange={e => setNewShift({...newShift, planned_start_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                  <input 
                    type="time" 
                    className="w-full border rounded p-2"
                    value={newShift.planned_end_time}
                    onChange={e => setNewShift({...newShift, planned_end_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                 <select 
                    className="w-full border rounded p-2"
                    onChange={e => setNewShift({...newShift, site_id: e.target.value})}
                    required
                 >
                   <option value="">Select Site</option>
                   {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Machine</label>
                 <select 
                    className="w-full border rounded p-2"
                    onChange={e => setNewShift({...newShift, machine_id: e.target.value})}
                    required
                 >
                   <option value="">Select Machine</option>
                   {machines.map(m => <option key={m.id} value={m.id}>{m.code} - {m.type}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Operator</label>
                 <select 
                    className="w-full border rounded p-2"
                    onChange={e => setNewShift({...newShift, operator_id: e.target.value})}
                    required
                 >
                   <option value="">Select Operator</option>
                   {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                 </select>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Schedule Shift</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bulk Shift Modal */}
      {showBulkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Bulk Schedule Shifts</h3>
                      <button onClick={() => setShowBulkModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  
                  <form onSubmit={handleBulkCreate} className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 mb-4">
                          Select a date range to automatically generate shifts for every day in that period.
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                              <input 
                                  type="date" 
                                  className="w-full border rounded p-2"
                                  value={bulkForm.start_date}
                                  onChange={e => setBulkForm({...bulkForm, start_date: e.target.value})}
                                  required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                              <input 
                                  type="date" 
                                  className="w-full border rounded p-2"
                                  value={bulkForm.end_date}
                                  onChange={e => setBulkForm({...bulkForm, end_date: e.target.value})}
                                  required
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Shift Start</label>
                              <input 
                                  type="time" 
                                  className="w-full border rounded p-2"
                                  value={bulkForm.planned_start_time}
                                  onChange={e => setBulkForm({...bulkForm, planned_start_time: e.target.value})}
                                  required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Shift End</label>
                              <input 
                                  type="time" 
                                  className="w-full border rounded p-2"
                                  value={bulkForm.planned_end_time}
                                  onChange={e => setBulkForm({...bulkForm, planned_end_time: e.target.value})}
                                  required
                              />
                          </div>
                      </div>

                      <div className="space-y-3 pt-2">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                             <select 
                                className="w-full border rounded p-2"
                                value={bulkForm.site_id}
                                onChange={e => setBulkForm({...bulkForm, site_id: e.target.value})}
                                required
                             >
                               <option value="">Select Site</option>
                               {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Machine</label>
                             <select 
                                className="w-full border rounded p-2"
                                value={bulkForm.machine_id}
                                onChange={e => setBulkForm({...bulkForm, machine_id: e.target.value})}
                                required
                             >
                               <option value="">Select Machine</option>
                               {machines.map(m => <option key={m.id} value={m.id}>{m.code} - {m.type}</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Operator</label>
                             <select 
                                className="w-full border rounded p-2"
                                value={bulkForm.operator_id}
                                onChange={e => setBulkForm({...bulkForm, operator_id: e.target.value})}
                                required
                             >
                               <option value="">Select Operator</option>
                               {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                             </select>
                         </div>
                      </div>

                      <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                          <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                          <Button type="submit">Generate Shifts</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}
    </div>
  );
};
