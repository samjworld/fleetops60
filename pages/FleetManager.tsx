
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, StatusBadge } from '../components/ui/Common';
import { exportToCSV, formatDate, formatDateTime } from '../utils/helpers';
import { Download, Search, CheckSquare, Edit, X, Square, Plus, ArrowLeft, Calendar, Droplet, Wrench, History, Clock } from 'lucide-react';
import { Machine, MachineStatus, MachineType } from '../types';

export const FleetManager = () => {
  const { machines, sites, updateMachines, addMachine, currentRole, shifts, fuelLogs, maintenanceJobs, operators, systemConfig } = useApp();
  const [search, setSearch] = useState('');
  
  // Selection & Bulk Edit State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // View State
  const [viewingMachineId, setViewingMachineId] = useState<string | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'shifts' | 'fuel' | 'maintenance'>('shifts');

  // Modals
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  
  // Bulk Edit Form
  const [bulkField, setBulkField] = useState<'current_site_id' | 'ownership_type' | 'current_status'>('current_site_id');
  const [bulkValue, setBulkValue] = useState<string>('');

  // Machine Add/Edit Form
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [machineForm, setMachineForm] = useState<Partial<Machine>>({
    code: '', name: '', type: MachineType.Excavator, make: '', model: '', 
    ownership_type: 'Owned', current_status: MachineStatus.Available, current_site_id: ''
  });

  const filteredMachines = machines.filter(m => 
    m.code.toLowerCase().includes(search.toLowerCase()) || 
    m.type.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredMachines.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMachines.map(m => m.id));
    }
  };

  const handleBulkUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkValue) return;
    
    updateMachines(selectedIds, { [bulkField]: bulkValue });
    
    // Cleanup
    setShowBulkModal(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setBulkValue('');
  };

  const openAddModal = () => {
    setEditingMachineId(null);
    setMachineForm({
      code: '', name: '', type: MachineType.Excavator, make: '', model: '', 
      ownership_type: 'Owned', current_status: MachineStatus.Available, current_site_id: sites[0]?.id || ''
    });
    setShowMachineModal(true);
  };

  const openEditModal = (machine: Machine) => {
    setEditingMachineId(machine.id);
    setMachineForm({ ...machine });
    setShowMachineModal(true);
  };

  const handleMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check for unique machine code
    const normalizedCode = machineForm.code?.trim();
    if (!normalizedCode) {
        alert("Machine Code is required.");
        return;
    }

    const isDuplicate = machines.some(m => 
        m.code.toLowerCase() === normalizedCode.toLowerCase() && 
        m.id !== editingMachineId // Exclude self if editing
    );

    if (isDuplicate) {
        alert(`Machine Code "${normalizedCode}" already exists. Please use a unique code.`);
        return;
    }

    if (editingMachineId) {
        // Edit existing
        updateMachines([editingMachineId], machineForm);
    } else {
        // Add new
        addMachine({
            ...machineForm as Machine,
            id: `M-${Date.now()}`,
            hour_meter_reading: 0,
            created_at: new Date().toISOString()
        } as Machine);
    }
    setShowMachineModal(false);
  };

  // --- DETAIL VIEW RENDERER ---
  if (viewingMachineId) {
    const machine = machines.find(m => m.id === viewingMachineId);
    if (!machine) return <div>Machine not found</div>;

    const machineShifts = shifts.filter(s => s.machine_id === machine.id).sort((a,b) => new Date(b.shift_date).getTime() - new Date(a.shift_date).getTime());
    const machineFuel = fuelLogs.filter(f => f.machine_id === machine.id).sort((a,b) => new Date(b.log_datetime).getTime() - new Date(a.log_datetime).getTime());
    const machineJobs = maintenanceJobs.filter(j => j.machine_id === machine.id).sort((a,b) => new Date(b.opened_on).getTime() - new Date(a.opened_on).getTime());

    const totalHours = machineShifts.reduce((acc, s) => acc + (s.actual_work_hours || 0), 0);
    const totalFuel = machineFuel.reduce((acc, f) => acc + f.litres, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start gap-4">
                    <Button variant="secondary" onClick={() => setViewingMachineId(null)} className="mt-1">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-slate-900">{machine.code}</h2>
                            <StatusBadge status={machine.current_status} />
                        </div>
                        <p className="text-lg text-slate-600">{machine.name} • {machine.make} {machine.model}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                             <span className="flex items-center gap-1"><Clock size={14}/> {machine.hour_meter_reading.toLocaleString()} Engine Hrs</span>
                             <span className="flex items-center gap-1"><History size={14}/> Last active: {machineShifts[0] ? formatDate(machineShifts[0].shift_date) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 text-right">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-bold uppercase">Total Work</div>
                        <div className="text-xl font-bold text-blue-900">{totalHours.toFixed(1)} hrs</div>
                    </div>
                    <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
                        <div className="text-xs text-amber-600 font-bold uppercase">Total Fuel</div>
                        <div className="text-xl font-bold text-amber-900">{totalFuel.toLocaleString()} L</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-slate-200">
                <button 
                  onClick={() => setActiveHistoryTab('shifts')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeHistoryTab === 'shifts' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar size={16} /> Shift History
                </button>
                <button 
                  onClick={() => setActiveHistoryTab('fuel')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeHistoryTab === 'fuel' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Droplet size={16} /> Fuel Logs
                </button>
                <button 
                  onClick={() => setActiveHistoryTab('maintenance')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeHistoryTab === 'maintenance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Wrench size={16} /> Maintenance Jobs
                </button>
            </div>

            {/* Tab Content */}
            <Card className="overflow-hidden">
                {activeHistoryTab === 'shifts' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Site</th>
                                    <th className="px-6 py-3">Operator</th>
                                    <th className="px-6 py-3">Hours (Planned / Actual)</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machineShifts.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">No shift history available.</td></tr>
                                ) : (
                                    machineShifts.map(s => (
                                        <tr key={s.id} className="border-b hover:bg-slate-50">
                                            <td className="px-6 py-4">{formatDate(s.shift_date)}</td>
                                            <td className="px-6 py-4">{sites.find(site => site.id === s.site_id)?.name || s.site_id}</td>
                                            <td className="px-6 py-4">{operators.find(o => o.id === s.operator_id)?.name || s.operator_id}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono">{s.planned_hours} / <strong>{s.actual_work_hours}</strong></span>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeHistoryTab === 'fuel' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Date & Time</th>
                                    <th className="px-6 py-3">Site</th>
                                    <th className="px-6 py-3">Event Type</th>
                                    <th className="px-6 py-3">Quantity (L)</th>
                                    <th className="px-6 py-3">Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machineFuel.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">No fuel records available.</td></tr>
                                ) : (
                                    machineFuel.map(f => (
                                        <tr key={f.id} className="border-b hover:bg-slate-50">
                                            <td className="px-6 py-4">{formatDateTime(f.log_datetime)}</td>
                                            <td className="px-6 py-4">{sites.find(site => site.id === f.site_id)?.name || f.site_id}</td>
                                            <td className="px-6 py-4">{f.event_type}</td>
                                            <td className="px-6 py-4 font-bold">{f.litres} L</td>
                                            <td className="px-6 py-4">{f.recorded_by}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeHistoryTab === 'maintenance' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Opened On</th>
                                    <th className="px-6 py-3">Job Type</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Assigned To</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machineJobs.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">No maintenance jobs recorded.</td></tr>
                                ) : (
                                    machineJobs.map(j => (
                                        <tr key={j.id} className="border-b hover:bg-slate-50">
                                            <td className="px-6 py-4">{formatDate(j.opened_on)}</td>
                                            <td className="px-6 py-4">{j.job_type}</td>
                                            <td className="px-6 py-4 truncate max-w-xs" title={j.description}>{j.description}</td>
                                            <td className="px-6 py-4">{j.assigned_to || '-'}</td>
                                            <td className="px-6 py-4"><StatusBadge status={j.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
  }

  // --- MAIN FLEET LIST RENDERER ---
  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Fleet Management</h2>
        <div className="flex w-full md:w-auto gap-2">
          {['manager', 'super_admin'].includes(currentRole) && (
              <Button onClick={openAddModal}>
                  <Plus size={18} className="mr-2"/> Add Machine
              </Button>
          )}

          {isSelectionMode ? (
             <Button variant="secondary" onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}>
                Cancel Selection
             </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsSelectionMode(true)}>
               Bulk Actions
            </Button>
          )}
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search fleet..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => exportToCSV(machines, 'fleet_export')}>
            <Download size={18} />
          </Button>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {isSelectionMode && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-blue-600 hover:text-blue-800">
                   {selectedIds.length === filteredMachines.length ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <span className="font-bold text-blue-900">{selectedIds.length} Selected</span>
             </div>
             <span className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={selectAll}>
                {selectedIds.length === filteredMachines.length ? 'Deselect All' : 'Select All'}
             </span>
           </div>
           
           <Button 
             size="sm" 
             onClick={() => {
                 if (selectedIds.length > 0) {
                     setBulkValue(''); 
                     setShowBulkModal(true);
                 }
             }}
             disabled={selectedIds.length === 0}
             className="bg-blue-600 hover:bg-blue-700"
           >
             <Edit size={16} className="mr-2" /> Bulk Edit ({selectedIds.length})
           </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map(machine => {
           const isSelected = selectedIds.includes(machine.id);
           
           return (
            <Card 
              key={machine.id} 
              className={`overflow-hidden hover:shadow-md transition-all relative ${
                isSelectionMode ? 'cursor-pointer' : ''
              } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''}`}
              onClick={() => isSelectionMode && toggleSelection(machine.id)}
            >
              <div className="p-5">
                {isSelectionMode && (
                  <div className="absolute top-4 right-4 z-10 pointer-events-none">
                     {isSelected ? 
                       <CheckSquare className="text-blue-600 bg-white rounded" size={24} /> : 
                       <Square className="text-slate-300 bg-white rounded" size={24} />
                     }
                  </div>
                )}
                
                {/* Edit Icon for Single Machine */}
                {!isSelectionMode && ['manager', 'super_admin'].includes(currentRole) && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(machine); }}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                    >
                        <Edit size={16} />
                    </button>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{machine.code}</h3>
                    <p className="text-sm font-medium text-slate-700">{machine.name}</p>
                    <p className="text-xs text-slate-500">{machine.make} {machine.model}</p>
                  </div>
                  {!isSelectionMode && <StatusBadge status={machine.current_status} />}
                </div>
                
                <div className="space-y-2 text-sm pointer-events-none">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium">{machine.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ownership</span>
                    <span className="font-medium">{machine.ownership_type}</span>
                  </div>
                   <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Site</span>
                    <span className="font-medium truncate max-w-[150px]">
                        {sites.find(s => s.id === machine.current_site_id)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>

                {!isSelectionMode && (
                    <div className="mt-4 pt-3 flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setViewingMachineId(machine.id)}
                        >
                            <History size={16} className="mr-2" /> View History
                        </Button>
                    </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold">Bulk Edit {selectedIds.length} Machines</h3>
               <button onClick={() => setShowBulkModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Field to Update</label>
                 <select 
                    className="w-full border rounded-lg p-2.5 bg-slate-50"
                    value={bulkField}
                    onChange={(e) => {
                        setBulkField(e.target.value as any);
                        setBulkValue('');
                    }}
                 >
                    <option value="current_site_id">Current Site</option>
                    <option value="ownership_type">Ownership Type</option>
                    <option value="current_status">Status</option>
                 </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">New Value</label>
                 {bulkField === 'current_site_id' && (
                    <select 
                        className="w-full border rounded-lg p-2.5" 
                        value={bulkValue} 
                        onChange={e => setBulkValue(e.target.value)}
                        required
                    >
                        <option value="">Select Site</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 )}

                 {bulkField === 'ownership_type' && (
                    <select 
                        className="w-full border rounded-lg p-2.5" 
                        value={bulkValue} 
                        onChange={e => setBulkValue(e.target.value)}
                        required
                    >
                        <option value="">Select Ownership</option>
                        <option value="Owned">Owned</option>
                        <option value="Rented">Rented</option>
                    </select>
                 )}

                 {bulkField === 'current_status' && (
                    <select 
                        className="w-full border rounded-lg p-2.5" 
                        value={bulkValue} 
                        onChange={e => setBulkValue(e.target.value)}
                        required
                    >
                        <option value="">Select Status</option>
                        {Object.values(MachineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 )}
              </div>

              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                <Button type="submit">Update Machines</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add/Edit Machine Modal */}
      {showMachineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold">{editingMachineId ? 'Edit Machine' : 'Add New Machine'}</h3>
               <button onClick={() => setShowMachineModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
             <form onSubmit={handleMachineSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Code (Unique)</label>
                      <input type="text" required className="w-full border rounded p-2" value={machineForm.code} onChange={e => setMachineForm({...machineForm, code: e.target.value})} disabled={!!editingMachineId} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Machine Name</label>
                      <input type="text" required className="w-full border rounded p-2" value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Type</label>
                   <select className="w-full border rounded p-2 capitalize" value={machineForm.type} onChange={e => setMachineForm({...machineForm, type: e.target.value as MachineType})}>
                       {systemConfig.machineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Make</label>
                      <input type="text" className="w-full border rounded p-2" value={machineForm.make} onChange={e => setMachineForm({...machineForm, make: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Model</label>
                      <input type="text" className="w-full border rounded p-2" value={machineForm.model} onChange={e => setMachineForm({...machineForm, model: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Ownership</label>
                      <select className="w-full border rounded p-2" value={machineForm.ownership_type} onChange={e => setMachineForm({...machineForm, ownership_type: e.target.value as any})}>
                          <option value="Owned">Owned</option>
                          <option value="Rented">Rented</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Current Site</label>
                      <select className="w-full border rounded p-2" value={machineForm.current_site_id} onChange={e => setMachineForm({...machineForm, current_site_id: e.target.value})}>
                          <option value="">-- Select Site --</option>
                          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                   <Button type="button" variant="secondary" onClick={() => setShowMachineModal(false)}>Cancel</Button>
                   <Button type="submit">{editingMachineId ? 'Save Changes' : 'Create Machine'}</Button>
                </div>
             </form>
          </Card>
        </div>
      )}
    </div>
  );
};
