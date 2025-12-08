
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, StatusBadge, StatCard } from '../components/ui/Common';
import { 
  Package, Plus, Search, Filter, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  History, ScanLine, QrCode, CheckCircle, ShieldCheck, Clock, Edit, Trash2,
  Keyboard, FileText
} from 'lucide-react';
import { SparePart, PartTransaction } from '../types';
import { formatDateTime } from '../utils/helpers';

export const SparePartsManager = () => {
  const { spareParts, partTransactions, addSparePart, updateSparePart, deleteSparePart, adjustPartStock, verifyStock, currentRole, systemConfig } = useApp();
  
  // View State
  const [mode, setMode] = useState<'worker' | 'supervisor'>('worker');
  
  // Common State
  const [search, setSearch] = useState('');

  // Worker Mode State
  const [scannedPart, setScannedPart] = useState<SparePart | null>(null);
  const [workerAction, setWorkerAction] = useState<'IN' | 'OUT' | null>(null);
  const [workerQty, setWorkerQty] = useState<number>(1);
  const [workerNotes, setWorkerNotes] = useState<string>('');

  // Supervisor Mode State
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory');
  const [showAddPart, setShowAddPart] = useState(false);
  const [showEditPart, setShowEditPart] = useState(false);
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  
  // Form States
  const [partForm, setPartForm] = useState<Partial<SparePart>>({
    name: '', part_number: '', category: 'Other', current_stock: 0, min_stock_level: 5, unit: 'pcs', cost_per_unit: 0, location: ''
  });
  
  const [adjustment, setAdjustment] = useState<{type: 'IN' | 'OUT', qty: number, notes: string}>({
    type: 'OUT', qty: 1, notes: ''
  });

  // Derived Data
  const filteredParts = spareParts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.part_number.toLowerCase().includes(search.toLowerCase())
  );
  
  const lowStockParts = spareParts.filter(p => p.current_stock <= p.min_stock_level);
  const lowStockCount = lowStockParts.length;
  const totalValue = spareParts.reduce((acc, p) => acc + (p.current_stock * p.cost_per_unit), 0);

  // Filter recent transactions for worker
  const workerTransactions = partTransactions.slice(0, 15); // Show last 15 for context

  // Handlers
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    addSparePart({
      ...partForm as SparePart,
      id: `SP-${Date.now()}`
    });
    setShowAddPart(false);
    resetPartForm();
  };

  const handleUpdatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPartId) {
      updateSparePart(selectedPartId, partForm);
      setShowEditPart(false);
      resetPartForm();
      setSelectedPartId('');
    }
  };

  const handleDeletePart = (id: string) => {
    if (window.confirm('Are you sure you want to delete this spare part? This action cannot be undone.')) {
      deleteSparePart(id);
    }
  };

  const openEditModal = (part: SparePart) => {
    setSelectedPartId(part.id);
    setPartForm({
      name: part.name,
      part_number: part.part_number,
      category: part.category,
      current_stock: part.current_stock,
      min_stock_level: part.min_stock_level,
      unit: part.unit,
      cost_per_unit: part.cost_per_unit,
      location: part.location || ''
    });
    setShowEditPart(true);
  };

  const resetPartForm = () => {
    setPartForm({ name: '', part_number: '', category: 'Other', current_stock: 0, min_stock_level: 5, unit: 'pcs', cost_per_unit: 0, location: '' });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPartId) {
      adjustPartStock({
        id: `TX-${Date.now()}`,
        part_id: selectedPartId,
        type: adjustment.type,
        quantity: Number(adjustment.qty),
        date: new Date().toISOString(),
        notes: adjustment.notes,
        performed_by: 'Supervisor'
      });
      setShowAdjustStock(false);
      setAdjustment({ type: 'OUT', qty: 1, notes: '' });
      setSelectedPartId('');
    }
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedPart && workerAction) {
       adjustPartStock({
        id: `TX-${Date.now()}`,
        part_id: scannedPart.id,
        type: workerAction,
        quantity: workerQty,
        date: new Date().toISOString(),
        notes: workerNotes,
        performed_by: 'Worker'
      });
      // Reset
      setScannedPart(null);
      setWorkerAction(null);
      setWorkerQty(1);
      setWorkerNotes('');
      setSearch('');
    }
  };

  const simulateScan = () => {
    // Randomly pick a part to simulate scanning
    const randomPart = spareParts[Math.floor(Math.random() * spareParts.length)];
    setScannedPart(randomPart);
    setSearch(randomPart.part_number);
  };

  const findPart = () => {
    const part = spareParts.find(p => p.part_number === search || p.name.includes(search));
    if (part) setScannedPart(part);
    else alert('Part not found');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="text-blue-500" /> Inventory Panel
          </h2>
          <p className="text-slate-500">
            {mode === 'worker' ? 'Worker View: Scan & Feed Data' : 'Supervisor View: Control & Verification'}
          </p>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button 
             onClick={() => setMode('worker')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'worker' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Worker (Entry)
           </button>
           <button 
             onClick={() => setMode('supervisor')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'supervisor' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Supervisor (Control)
           </button>
        </div>
      </div>

      {/* WORKER MODE UI */}
      {mode === 'worker' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2">
           <div className="space-y-6">
             {/* Scan / Search Section */}
             <Card className="p-6 border-blue-200 bg-blue-50/30">
                <div className="text-center mb-6">
                   <h3 className="text-lg font-bold text-slate-800 mb-2">Identify Item</h3>
                   <p className="text-sm text-slate-500">Scan barcode or manually enter part number</p>
                </div>
                
                <div className="flex gap-2 mb-4">
                   <div className="relative flex-1">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        placeholder="Scan or Type Part Number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && findPart()}
                      />
                   </div>
                   <Button className="h-full px-6 bg-slate-800" onClick={simulateScan}>
                      <QrCode size={20} className="mr-2" /> Scan
                   </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="flex items-center gap-1"><Keyboard size={12}/> Manual Feed Supported</span>
                    <span className="flex items-center gap-1"><QrCode size={12}/> Scanner Ready</span>
                </div>
                
                {search && !scannedPart && (
                   <Button className="w-full mt-4" variant="secondary" onClick={findPart}>
                      Search Part Database
                   </Button>
                )}
             </Card>

             {/* Part Action Card */}
             {scannedPart && (
               <Card className="p-6 border-2 border-blue-500 shadow-lg animate-in zoom-in-95">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                     <div>
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">Selected Item</div>
                        <h2 className="text-2xl font-black text-slate-900">{scannedPart.name}</h2>
                        <p className="font-mono text-slate-500">{scannedPart.part_number}</p>
                     </div>
                     <div className="text-right">
                        <div className="text-sm text-slate-500">Current Stock</div>
                        <div className="text-3xl font-bold text-slate-900">{scannedPart.current_stock} <span className="text-sm font-normal text-slate-500">{scannedPart.unit}</span></div>
                     </div>
                  </div>

                  {!workerAction ? (
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => setWorkerAction('OUT')}
                         className="p-6 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-center group relative overflow-hidden"
                       >
                          <div className="bg-amber-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-800 group-hover:scale-110 transition-transform">
                             <ArrowUpRight size={24} />
                          </div>
                          <h3 className="font-bold text-amber-900 text-lg">ISSUE (OUT)</h3>
                          <p className="text-xs text-amber-700 mt-1">Record Usage / Consumption</p>
                       </button>

                       <button 
                         onClick={() => setWorkerAction('IN')}
                         className="p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-center group relative overflow-hidden"
                       >
                          <div className="bg-green-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-green-800 group-hover:scale-110 transition-transform">
                             <ArrowDownLeft size={24} />
                          </div>
                          <h3 className="font-bold text-green-900 text-lg">ENTER (IN)</h3>
                          <p className="text-xs text-green-700 mt-1">Feed New Stock / Return</p>
                       </button>
                    </div>
                  ) : (
                    <form onSubmit={handleWorkerSubmit} className="space-y-4 animate-in fade-in">
                       <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-200">
                          <span className={`font-bold flex items-center gap-2 ${workerAction === 'IN' ? 'text-green-700' : 'text-amber-700'}`}>
                             {workerAction === 'IN' ? <ArrowDownLeft /> : <ArrowUpRight />}
                             {workerAction === 'IN' ? 'STOCK ENTRY (IN)' : 'STOCK USAGE (OUT)'}
                          </span>
                          <button type="button" onClick={() => setWorkerAction(null)} className="text-sm text-blue-600 underline">Change</button>
                       </div>
                       
                       <div>
                          <label className="block text-sm font-medium mb-1">Quantity ({scannedPart.unit})</label>
                          <div className="flex items-center gap-4">
                             <button type="button" className="w-12 h-12 rounded-lg bg-slate-200 text-xl font-bold hover:bg-slate-300 transition-colors" onClick={() => setWorkerQty(Math.max(1, workerQty - 1))}>-</button>
                             <input 
                               type="number" 
                               className="flex-1 h-12 text-center text-2xl font-bold border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                               value={workerQty} 
                               onChange={(e) => setWorkerQty(Number(e.target.value))}
                               min="1"
                             />
                             <button type="button" className="w-12 h-12 rounded-lg bg-slate-200 text-xl font-bold hover:bg-slate-300 transition-colors" onClick={() => setWorkerQty(workerQty + 1)}>+</button>
                          </div>
                       </div>

                       <div>
                          <label className="block text-sm font-medium mb-1">Notes / Reference</label>
                          <input 
                             type="text" 
                             className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" 
                             placeholder={workerAction === 'OUT' ? "Where was it used? (e.g. Machine ID)" : "Source? (e.g. PO Number)"}
                             value={workerNotes}
                             onChange={(e) => setWorkerNotes(e.target.value)}
                          />
                       </div>

                       <Button type="submit" className={`w-full h-12 text-lg shadow-lg ${workerAction === 'IN' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}>
                          Confirm Data Feed
                       </Button>
                    </form>
                  )}
               </Card>
             )}
           </div>

           {/* Worker Activity Log - Explicitly labeled for Entry/Usage dates */}
           <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <FileText className="text-slate-500" /> Recent Product Entries & Usage Log
              </h3>
              <Card className="overflow-hidden h-full max-h-[600px] flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs sticky top-0">
                            <tr>
                                <th className="px-4 py-3 bg-slate-50">Part Details</th>
                                <th className="px-4 py-3 bg-slate-50">Event Type</th>
                                <th className="px-4 py-3 bg-slate-50">Qty</th>
                                <th className="px-4 py-3 bg-slate-50 text-right">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {workerTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                                        No recent manual entries found.
                                    </td>
                                </tr>
                            ) : (
                                workerTransactions.map(tx => {
                                    const part = spareParts.find(p => p.id === tx.part_id);
                                    return (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{part?.name || 'Unknown Part'}</div>
                                                <div className="text-xs text-slate-500 font-mono">{part?.part_number}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                 {tx.type === 'IN' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                                        <ArrowDownLeft size={12} /> Stock Entered
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                                        <ArrowUpRight size={12} /> Stock Used
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-700">
                                                {tx.quantity} <span className="text-xs font-normal text-slate-400">{part?.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="text-slate-900 font-medium">{formatDateTime(tx.date).split(' ')[0]} {formatDateTime(tx.date).split(' ')[1]}</div>
                                                <div className="text-xs text-slate-400">{formatDateTime(tx.date).split(' ').slice(2).join(' ')}</div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-500">
                   Showing last {workerTransactions.length} entries. Syncs automatically.
                </div>
              </Card>
           </div>
        </div>
      )}

      {/* SUPERVISOR MODE UI */}
      {mode === 'supervisor' && (
        <div className="animate-in fade-in">
           <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-1">
             <button 
               onClick={() => setActiveTab('inventory')}
               className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'inventory' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
               Inventory List
             </button>
             <button 
               onClick={() => setActiveTab('transactions')}
               className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'transactions' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
               Transaction History
             </button>
          </div>

          {activeTab === 'inventory' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <StatCard title="Total SKU Count" value={spareParts.length} icon={Package} />
                 <StatCard title="Low Stock Alerts" value={lowStockCount} icon={AlertTriangle} trend={lowStockCount > 0 ? 'Action Needed' : 'Good'} />
                 <StatCard title="Inventory Value" value={`$${totalValue.toLocaleString()}`} icon={History} />
              </div>

              {/* Low Stock Warning Section */}
              {lowStockCount > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900">Low Stock Alert ({lowStockCount} items)</h3>
                      <p className="text-sm text-red-700 mb-3">The following items are below minimum stock levels and need reordering.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {lowStockParts.map(p => (
                              <div key={p.id} className="bg-white border border-red-100 rounded px-3 py-2 flex justify-between items-center shadow-sm">
                                  <div>
                                      <div className="font-medium text-slate-700 text-sm truncate max-w-[150px]">{p.name}</div>
                                      <div className="text-xs text-slate-400">{p.part_number}</div>
                                  </div>
                                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                      {p.current_stock} / {p.min_stock_level}
                                  </span>
                              </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Card className="overflow-hidden">
                 <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         type="text" 
                         placeholder="Search parts..." 
                         className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm"
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                       />
                    </div>
                    <Button onClick={() => setShowAddPart(true)}>
                       <Plus size={16} className="mr-2" /> Add Part
                    </Button>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs">
                        <tr>
                          <th className="px-6 py-3">Part Details</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Stock</th>
                          <th className="px-6 py-3">Last Activity</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParts.map(part => (
                          <tr key={part.id} className={`border-b hover:bg-slate-50 ${part.current_stock <= part.min_stock_level ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4">
                               <div className="font-bold text-slate-900">{part.name}</div>
                               <div className="font-mono text-xs text-slate-500">{part.part_number}</div>
                               <div className="text-xs text-slate-400 mt-1">{part.location || 'No Loc'}</div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                 {part.category}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className={`font-bold ${part.current_stock <= part.min_stock_level ? 'text-red-600' : 'text-slate-900'}`}>
                                 {part.current_stock} {part.unit}
                               </div>
                               <div className="text-xs text-slate-400">${part.cost_per_unit}/unit</div>
                            </td>
                            <td className="px-6 py-4 space-y-1">
                               {part.last_received_date && (
                                  <div className="text-xs text-green-700 flex items-center gap-1">
                                      <ArrowDownLeft size={10} /> In: {new Date(part.last_received_date).toLocaleDateString()}
                                  </div>
                               )}
                               {part.last_issued_date && (
                                  <div className="text-xs text-amber-700 flex items-center gap-1">
                                      <ArrowUpRight size={10} /> Out: {new Date(part.last_issued_date).toLocaleDateString()}
                                  </div>
                               )}
                               {!part.last_received_date && !part.last_issued_date && (
                                   <span className="text-xs text-slate-400">No activity</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex justify-center space-x-2">
                                 <button 
                                  onClick={() => { setSelectedPartId(part.id); setShowAdjustStock(true); }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 px-2 py-1 rounded"
                                 >
                                  Adjust
                                 </button>
                                 <button 
                                  onClick={() => verifyStock(part.id)}
                                  title="Mark as Verified"
                                  className="text-green-600 hover:text-green-800 text-xs font-medium border border-green-200 px-2 py-1 rounded"
                                 >
                                  Verify
                                 </button>
                                 <button 
                                  onClick={() => openEditModal(part)}
                                  title="Edit"
                                  className="text-slate-600 hover:text-slate-800 p-1"
                                 >
                                  <Edit size={16} />
                                 </button>
                                 <button 
                                  onClick={() => handleDeletePart(part.id)}
                                  title="Delete"
                                  className="text-red-600 hover:text-red-800 p-1"
                                 >
                                  <Trash2 size={16} />
                                 </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </Card>
            </>
          )}

          {activeTab === 'transactions' && (
            <Card className="overflow-hidden">
               <div className="p-4 border-b font-medium text-slate-700">Stock Movement History</div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 border-b uppercase text-xs">
                     <tr>
                       <th className="px-6 py-3">Date</th>
                       <th className="px-6 py-3">Type</th>
                       <th className="px-6 py-3">Part</th>
                       <th className="px-6 py-3">Qty</th>
                       <th className="px-6 py-3">User</th>
                     </tr>
                   </thead>
                   <tbody>
                     {partTransactions.map(tx => {
                       const part = spareParts.find(p => p.id === tx.part_id);
                       return (
                         <tr key={tx.id} className="border-b hover:bg-slate-50">
                           <td className="px-6 py-4 text-slate-600">{formatDateTime(tx.date)}</td>
                           <td className="px-6 py-4">
                              {tx.type === 'IN' ? (
                                 <span className="flex items-center text-green-600 font-medium text-xs"><ArrowDownLeft size={14} className="mr-1"/> IN</span>
                              ) : (
                                 <span className="flex items-center text-amber-600 font-medium text-xs"><ArrowUpRight size={14} className="mr-1"/> OUT</span>
                              )}
                           </td>
                           <td className="px-6 py-4 font-medium">{part?.name || tx.part_id}</td>
                           <td className="px-6 py-4">{tx.quantity}</td>
                           <td className="px-6 py-4 text-slate-500 text-xs">{tx.performed_by}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </Card>
          )}
        </div>
      )}

      {/* Add Part Modal (Supervisor) */}
      {showAddPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
             <h3 className="text-xl font-bold mb-4">Add New Spare Part</h3>
             <form onSubmit={handleAddPart} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Part Number</label>
                      <input type="text" required className="w-full border rounded p-2" value={partForm.part_number} onChange={e => setPartForm({...partForm, part_number: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input type="text" required className="w-full border rounded p-2" value={partForm.name} onChange={e => setPartForm({...partForm, name: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select className="w-full border rounded p-2 capitalize" value={partForm.category} onChange={e => setPartForm({...partForm, category: e.target.value as any})}>
                         {systemConfig.partCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Unit</label>
                      <input type="text" className="w-full border rounded p-2" value={partForm.unit} onChange={e => setPartForm({...partForm, unit: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Initial Stock</label>
                      <input type="number" className="w-full border rounded p-2" value={partForm.current_stock} onChange={e => setPartForm({...partForm, current_stock: Number(e.target.value)})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Min Level</label>
                      <input type="number" className="w-full border rounded p-2" value={partForm.min_stock_level} onChange={e => setPartForm({...partForm, min_stock_level: Number(e.target.value)})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <input type="number" className="w-full border rounded p-2" value={partForm.cost_per_unit} onChange={e => setPartForm({...partForm, cost_per_unit: Number(e.target.value)})} />
                   </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" className="w-full border rounded p-2" value={partForm.location} onChange={e => setPartForm({...partForm, location: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                   <Button type="button" variant="secondary" onClick={() => setShowAddPart(false)}>Cancel</Button>
                   <Button type="submit">Create Part</Button>
                </div>
             </form>
          </Card>
        </div>
      )}

      {/* Edit Part Modal (Supervisor) */}
      {showEditPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
             <h3 className="text-xl font-bold mb-4">Edit Spare Part</h3>
             <form onSubmit={handleUpdatePart} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Part Number</label>
                      <input type="text" required className="w-full border rounded p-2" value={partForm.part_number} onChange={e => setPartForm({...partForm, part_number: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input type="text" required className="w-full border rounded p-2" value={partForm.name} onChange={e => setPartForm({...partForm, name: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select className="w-full border rounded p-2 capitalize" value={partForm.category} onChange={e => setPartForm({...partForm, category: e.target.value as any})}>
                         {systemConfig.partCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Unit</label>
                      <input type="text" className="w-full border rounded p-2" value={partForm.unit} onChange={e => setPartForm({...partForm, unit: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   {/* We typically don't edit current stock directly here, use adjustment instead. But for full edit rights: */}
                   <div>
                      <label className="block text-sm font-medium mb-1">Current Stock</label>
                      <input type="number" className="w-full border rounded p-2 bg-slate-100" readOnly title="Use Adjust Stock for changes" value={partForm.current_stock} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Min Level</label>
                      <input type="number" className="w-full border rounded p-2" value={partForm.min_stock_level} onChange={e => setPartForm({...partForm, min_stock_level: Number(e.target.value)})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <input type="number" className="w-full border rounded p-2" value={partForm.cost_per_unit} onChange={e => setPartForm({...partForm, cost_per_unit: Number(e.target.value)})} />
                   </div>
                </div>
                 <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" className="w-full border rounded p-2" value={partForm.location} onChange={e => setPartForm({...partForm, location: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                   <Button type="button" variant="secondary" onClick={() => setShowEditPart(false)}>Cancel</Button>
                   <Button type="submit">Update Part</Button>
                </div>
             </form>
          </Card>
        </div>
      )}

      {/* Adjust Stock Modal (Supervisor) */}
      {showAdjustStock && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-6">
             <h3 className="text-xl font-bold mb-4">Adjust Stock</h3>
             <p className="text-sm text-slate-500 mb-4">
               {spareParts.find(p => p.id === selectedPartId)?.name}
             </p>
             <form onSubmit={handleAdjustStock} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium mb-1">Movement Type</label>
                   <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setAdjustment({...adjustment, type: 'IN'})}
                        className={`flex-1 py-2 rounded border font-medium ${adjustment.type === 'IN' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-slate-300'}`}
                      >
                         IN
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAdjustment({...adjustment, type: 'OUT'})}
                        className={`flex-1 py-2 rounded border font-medium ${adjustment.type === 'OUT' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-300'}`}
                      >
                         OUT
                      </button>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Quantity</label>
                   <input type="number" min="1" required className="w-full border rounded p-2" value={adjustment.qty} onChange={e => setAdjustment({...adjustment, qty: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Notes</label>
                   <input type="text" className="w-full border rounded p-2" value={adjustment.notes} onChange={e => setAdjustment({...adjustment, notes: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                   <Button type="button" variant="secondary" onClick={() => setShowAdjustStock(false)}>Cancel</Button>
                   <Button type="submit">Confirm</Button>
                </div>
             </form>
          </Card>
         </div>
      )}
    </div>
  );
};
