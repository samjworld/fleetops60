
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, StatusBadge } from '../components/ui/Common';
import { ShiftStatus, MaintenanceType, MaintenanceStatus } from '../types';
import { 
  Clock, MapPin, AlertTriangle, Play, Square, CheckCircle, 
  Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare, UserCheck, Bell
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, isToday, addMonths, subMonths, 
  parseISO, isFuture, isPast, addDays, subDays
} from 'date-fns';

export const MobileOperator = () => {
  const { 
    currentUser, shifts, machines, sites, updateShift, 
    userReminders, addUserReminder, toggleUserReminder, deleteUserReminder,
    addMaintenanceJob
  } = useApp();
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [reminderText, setReminderText] = useState('');

  if (!currentUser) return <div>Please select an operator for demo.</div>;

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Data for Selected Date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedShift = shifts.find(s => s.operator_id === currentUser.id && s.shift_date === selectedDateStr);
  const machine = machines.find(m => m.id === selectedShift?.machine_id);
  const site = sites.find(s => s.id === selectedShift?.site_id);
  
  // Reminders for Selected Date
  const dayReminders = userReminders.filter(r => r.user_id === currentUser.id && r.date === selectedDateStr);

  const handleAddReminder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!reminderText.trim()) return;
      
      addUserReminder({
          id: `REM-${Date.now()}`,
          user_id: currentUser.id,
          date: selectedDateStr,
          text: reminderText,
          is_completed: false
      });
      setReminderText('');
  };

  const handleReportBreakdown = () => {
    if (!selectedShift || !machine) return;
    if (window.confirm(`Report breakdown for ${machine.code}? This will open a maintenance ticket.`)) {
        addMaintenanceJob({
            id: `J-${Date.now()}`,
            machine_id: selectedShift.machine_id,
            job_type: MaintenanceType.Breakdown,
            opened_on: new Date().toISOString().split('T')[0],
            status: MaintenanceStatus.Open,
            description: `Reported by operator ${currentUser.name} during shift`
        });
        alert('Breakdown reported. Support has been notified.');
    }
  };

  const isShiftDate = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return shifts.some(s => s.operator_id === currentUser.id && s.shift_date === dateStr);
  };

  const isReminderDate = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return userReminders.some(r => r.user_id === currentUser.id && r.date === dateStr && !r.is_completed);
  };

  const renderContentForDate = () => {
      const isDateToday = isToday(selectedDate);
      const isDateFuture = isFuture(selectedDate) && !isDateToday;
      const isDatePast = isPast(selectedDate) && !isDateToday;

      if (!selectedShift) {
          return (
            <Card className="p-8 text-center bg-slate-50 border-dashed border-2 border-slate-200 mt-4">
               <div className="bg-slate-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Calendar className="text-slate-400" size={24} />
               </div>
               <h3 className="text-lg font-medium text-slate-700">No Shift Scheduled</h3>
               <p className="text-sm text-slate-500 mt-2">
                   {isDateFuture ? 'You are free on this day.' : 'No work was recorded for this day.'}
               </p>
            </Card>
          );
      }

      // FUTURE VIEW
      if (isDateFuture) {
          return (
              <Card className="p-6 border-blue-100 bg-white mt-4">
                 <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-700">Upcoming Shift</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Scheduled</span>
                 </div>
                 <div className="space-y-4">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Machine</div>
                        <div className="text-xl font-bold text-slate-900">{machine?.code}</div>
                        <div className="text-sm text-slate-600">{machine?.make} {machine?.model}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-2 rounded">
                           <div className="text-xs text-slate-500">Site</div>
                           <div className="font-medium text-sm">{site?.name}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                           <div className="text-xs text-slate-500">Time</div>
                           <div className="font-medium text-sm">{selectedShift.planned_start_time} - {selectedShift.planned_end_time}</div>
                        </div>
                    </div>
                    {selectedShift.assigned_by && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-50 pt-3">
                           <UserCheck size={14} /> Assigned by: <span className="font-medium">{selectedShift.assigned_by}</span>
                        </div>
                    )}
                 </div>
              </Card>
          );
      }

      // PAST VIEW (LOGS)
      if (isDatePast) {
          return (
               <Card className="p-6 bg-slate-50 border border-slate-200 mt-4">
                 <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-700">Shift Log (History)</h3>
                    <StatusBadge status={selectedShift.status} />
                 </div>
                 <div className="space-y-4 opacity-75">
                    <div className="flex justify-between">
                         <div>
                            <div className="text-xs text-slate-500">Machine</div>
                            <div className="font-bold">{machine?.code}</div>
                         </div>
                         <div className="text-right">
                             <div className="text-xs text-slate-500">Total Hours</div>
                             <div className="font-bold">{selectedShift.actual_work_hours} hrs</div>
                         </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-slate-400"/>
                                <span>Start: {selectedShift.actual_start_time ? format(parseISO(selectedShift.actual_start_time), 'HH:mm') : '--:--'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-slate-400"/>
                                <span>End: {selectedShift.actual_end_time ? format(parseISO(selectedShift.actual_end_time), 'HH:mm') : '--:--'}</span>
                            </div>
                        </div>
                    </div>
                    {selectedShift.assigned_by && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                           <UserCheck size={12} /> Work Assigned by: {selectedShift.assigned_by}
                        </div>
                    )}
                 </div>
              </Card>
          );
      }

      // PRESENT VIEW (TODAY)
      return (
        <Card className="p-6 border-blue-100 bg-blue-50/50 shadow-sm mt-4">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">Current Assignment</span>
                   <h1 className="text-3xl font-black text-slate-900">{machine?.code}</h1>
                   <p className="text-sm text-slate-600">{machine?.make} {machine?.model}</p>
                </div>
                <StatusBadge status={selectedShift.status} />
             </div>

             <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                   <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                     <MapPin size={12} /> Site
                   </div>
                   <div className="font-semibold text-slate-800">{site?.name}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                   <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                     <Clock size={12} /> Shift
                   </div>
                   <div className="font-semibold text-slate-800">{selectedShift.planned_start_time} - {selectedShift.planned_end_time}</div>
                </div>
             </div>

             {selectedShift.assigned_by && (
                 <div className="mb-4 text-xs text-slate-500 flex items-center gap-1 justify-end">
                     <UserCheck size={12} /> Assigned by: {selectedShift.assigned_by}
                 </div>
             )}

             <div className="space-y-3">
               {selectedShift.status === ShiftStatus.Planned && (
                  <Button 
                    className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                    onClick={() => updateShift({...selectedShift, status: ShiftStatus.InProgress, actual_start_time: new Date().toISOString()})}
                  >
                    <Play className="mr-2" /> Start Shift
                  </Button>
               )}
               
               {selectedShift.status === ShiftStatus.InProgress && (
                  <Button 
                    className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                    onClick={() => updateShift({...selectedShift, status: ShiftStatus.Completed, actual_end_time: new Date().toISOString(), actual_work_hours: 8})}
                  >
                    <Square className="mr-2" /> End Shift
                  </Button>
               )}

               {selectedShift.status === ShiftStatus.Completed && (
                 <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg font-medium flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> Shift Completed
                 </div>
               )}
             </div>
             
             {/* Today's Actions */}
             {selectedShift.status === ShiftStatus.InProgress && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button variant="secondary" className="h-12 border-slate-300 bg-white">
                        Checklist
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="h-12 border-red-200 text-red-600 bg-white hover:bg-red-50"
                      onClick={handleReportBreakdown}
                    >
                        <AlertTriangle size={18} className="mr-2" /> Report Breakdown
                    </Button>
                </div>
             )}
        </Card>
      );
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-20">
      
      {/* Date Navigation & Calendar Toggle */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-1">
                <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                   <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center w-36">
                   <span className="text-sm font-bold text-slate-800">
                      {format(selectedDate, 'EEE, dd MMM')}
                   </span>
                   {isToday(selectedDate) && <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Today</span>}
                </div>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                   <ChevronRight size={24} />
                </button>
             </div>
             
             <button 
               onClick={() => setShowCalendar(!showCalendar)} 
               className={`p-2 rounded-lg transition-colors ${showCalendar ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-500'}`}
             >
                <Calendar size={20} />
             </button>
         </div>

         {/* Collapsible Calendar Grid */}
         {showCalendar && (
            <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-center justify-between mb-4 px-2">
                     <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-full">
                        <ChevronLeft size={16} className="text-slate-600" />
                     </button>
                     <span className="text-sm font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</span>
                     <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-full">
                        <ChevronRight size={16} className="text-slate-600" />
                     </button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                       <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                     {calendarDays.map((day) => {
                         const isSelected = isSameDay(day, selectedDate);
                         const hasShift = isShiftDate(day);
                         const hasReminder = isReminderDate(day);
                         const isTodayDate = isToday(day);
                         const isCurrentMonth = isSameMonth(day, currentMonth);

                         return (
                            <button
                                key={day.toISOString()}
                                onClick={() => { setSelectedDate(day); setShowCalendar(false); }}
                                className={`
                                   relative h-9 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all
                                   ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                                   ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100'}
                                   ${isTodayDate && !isSelected ? 'ring-1 ring-blue-600 font-bold text-blue-600' : ''}
                                `}
                            >
                                {format(day, 'd')}
                                <div className="absolute bottom-1 flex gap-0.5 justify-center w-full">
                                    {hasShift && !isSelected && (
                                        <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                    )}
                                    {hasReminder && !isSelected && (
                                        <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                                    )}
                                </div>
                            </button>
                         );
                     })}
                </div>
            </div>
         )}
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderContentForDate()}
      </div>

      {/* Personal Reminders Section */}
      <div className="mt-8">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckSquare size={18} className="text-slate-500"/> My Reminders
          </h3>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                 <form onSubmit={handleAddReminder} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add personal note..." 
                      className="flex-1 text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={reminderText}
                      onChange={(e) => setReminderText(e.target.value)}
                    />
                    <Button size="sm" type="submit" disabled={!reminderText.trim()}>
                       <Plus size={16} />
                    </Button>
                 </form>
              </div>
              
              <div className="divide-y divide-slate-100">
                 {dayReminders.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400 italic">
                        No reminders for {isToday(selectedDate) ? 'today' : 'this day'}.
                    </div>
                 ) : (
                    dayReminders.map(rem => (
                        <div key={rem.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => toggleUserReminder(rem.id)}
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rem.is_completed ? 'bg-green-500 border-green-600 text-white' : 'border-slate-300 bg-white'}`}
                                >
                                   {rem.is_completed && <CheckCircle size={14} />}
                                </button>
                                <span className={`text-sm ${rem.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {rem.text}
                                </span>
                            </div>
                            <button 
                              onClick={() => deleteUserReminder(rem.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                 )}
              </div>
          </div>
          <p className="text-xs text-center text-slate-400 mt-2">Reminders are private and visible only to you.</p>
      </div>

    </div>
  );
};
