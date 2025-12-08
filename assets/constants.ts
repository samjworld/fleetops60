
import { 
  Machine, MachineType, MachineStatus, 
  Operator, OperatorStatus, 
  Site, SiteStatus, 
  Shift, ShiftStatus,
  MaintenanceJob, MaintenanceType, MaintenanceStatus,
  FuelLog, FuelEventType,
  SystemUser, SparePart, PartTransaction,
  UserActivity, RolePermissions,
  UserReminder, ChatMessage
} from './types';

// SITES
export const MOCK_SITES: Site[] = [
  { id: 'S1', name: 'Kollur Flyover', client_name: 'NHAI', location_text: 'Kollur, Hyderabad', status: SiteStatus.Active, start_date: '2023-01-15', geo_lat: 17.45, geo_lng: 78.32 },
  { id: 'S2', name: 'Metro Line 4', client_name: 'L&T', location_text: 'Mumbai', status: SiteStatus.Active, start_date: '2023-03-01', geo_lat: 19.07, geo_lng: 72.87 },
  { id: 'S3', name: 'Solar Park Ph-1', client_name: 'Adani Green', location_text: 'Rajasthan', status: SiteStatus.Paused, start_date: '2022-11-20', geo_lat: 26.91, geo_lng: 70.90 },
];

// MACHINES
export const MOCK_MACHINES: Machine[] = [
  { id: 'M1', code: 'EXC-01', name: 'Hitachi EX200', type: MachineType.Excavator, make: 'Hitachi', model: 'EX200', ownership_type: 'Owned', current_status: MachineStatus.Working, current_site_id: 'S1', hour_meter_reading: 4500 },
  { id: 'M2', code: 'TIP-05', name: 'Ashok Leyland 2518', type: MachineType.Tipper, make: 'Ashok Leyland', model: '2518', ownership_type: 'Rented', current_status: MachineStatus.Idle, current_site_id: 'S1', hour_meter_reading: 12000 },
  { id: 'M3', code: 'DOZ-02', name: 'CAT D6', type: MachineType.Dozer, make: 'Caterpillar', model: 'D6R', ownership_type: 'Owned', current_status: MachineStatus.Breakdown, current_site_id: 'S2', hour_meter_reading: 8900 },
  { id: 'M4', code: 'JCB-11', name: 'JCB 3DX', type: MachineType.Loader, make: 'JCB', model: '3DX', ownership_type: 'Owned', current_status: MachineStatus.Working, current_site_id: 'S2', hour_meter_reading: 3400 },
  { id: 'M5', code: 'CRN-01', name: 'Ace Hydra', type: MachineType.Crane, make: 'Ace', model: 'Hydra 14', ownership_type: 'Rented', current_status: MachineStatus.Available, current_site_id: 'S3', hour_meter_reading: 1200 },
];

// OPERATORS
export const MOCK_OPERATORS: Operator[] = [
  { id: 'OP1', name: 'Rajesh Kumar', phone: '9876543210', employee_code: 'EMP001', skills: [MachineType.Excavator, MachineType.Loader], status: OperatorStatus.OnShift, default_site_id: 'S1' },
  { id: 'OP2', name: 'Suresh Singh', phone: '9876543211', employee_code: 'EMP002', skills: [MachineType.Tipper], status: OperatorStatus.Available, default_site_id: 'S1' },
  { id: 'OP3', name: 'Mohan Lal', phone: '9876543212', employee_code: 'EMP003', skills: [MachineType.Dozer], status: OperatorStatus.Blocked, default_site_id: 'S2' },
  { id: 'OP4', name: 'Vikram Seth', phone: '9876543213', employee_code: 'EMP004', skills: [MachineType.Crane, MachineType.Excavator], status: OperatorStatus.OnShift, default_site_id: 'S2' },
];

// SYSTEM USERS
export const MOCK_SYSTEM_USERS: SystemUser[] = [
  { id: 'U1', name: 'Super Admin', email: 'admin@fleetops.com', phone: '9988776655', role: 'super_admin', status: 'Active', last_login: '2023-10-27T10:00:00', password: '123' },
  { id: 'U2', name: 'Site Manager A', email: 'manager.a@fleetops.com', phone: '9988776644', role: 'manager', status: 'Active', last_login: '2023-10-26T09:30:00', password: '123' },
  { id: 'U3', name: 'Supervisor Bob', email: 'bob@fleetops.com', phone: '9988776633', role: 'supervisor', status: 'Active', last_login: '2023-10-27T08:15:00', password: '123' },
  { id: 'U4', name: 'Operator Login', email: 'op@fleetops.com', phone: '9988000000', role: 'operator', status: 'Active', last_login: '2023-10-27T07:00:00', password: '123' },
];

// SHIFTS
const today = new Date().toISOString().split('T')[0];
// Mock past dates
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

export const MOCK_SHIFTS: Shift[] = [
  { 
    id: 'SH1', machine_id: 'M1', operator_id: 'OP1', site_id: 'S1', 
    shift_date: today, planned_start_time: '08:00', planned_end_time: '18:00', 
    planned_hours: 10, actual_work_hours: 4, idle_hours: 0, status: ShiftStatus.InProgress,
    actual_start_time: new Date().toISOString(), assigned_by: 'Supervisor Bob'
  },
  { 
    id: 'SH2', machine_id: 'M4', operator_id: 'OP4', site_id: 'S2', 
    shift_date: today, planned_start_time: '09:00', planned_end_time: '17:00', 
    planned_hours: 8, actual_work_hours: 0, idle_hours: 0, status: ShiftStatus.Planned, assigned_by: 'Site Manager A'
  },
  { 
    id: 'SH3', machine_id: 'M2', operator_id: 'OP2', site_id: 'S1', 
    shift_date: yesterday, planned_start_time: '08:00', planned_end_time: '18:00', 
    planned_hours: 10, actual_work_hours: 9.5, idle_hours: 0.5, status: ShiftStatus.Completed, assigned_by: 'Supervisor Bob'
  },
  { 
    id: 'SH4', machine_id: 'M1', operator_id: 'OP1', site_id: 'S1', 
    shift_date: twoDaysAgo, planned_start_time: '08:00', planned_end_time: '18:00', 
    planned_hours: 10, actual_work_hours: 8.5, idle_hours: 1.5, status: ShiftStatus.Completed, assigned_by: 'Super Admin'
  },
];

// FUEL LOGS
export const MOCK_FUEL_LOGS: FuelLog[] = [
  { id: 'F1', machine_id: 'M1', site_id: 'S1', log_datetime: '2023-10-27T08:30:00', event_type: FuelEventType.Refuel, litres: 150, recorded_by: 'Supervisor A', slip_number: 'SLP-998' },
  { id: 'F2', machine_id: 'M3', site_id: 'S2', log_datetime: '2023-10-26T14:00:00', event_type: FuelEventType.Refuel, litres: 200, recorded_by: 'Supervisor B' },
];

// MAINTENANCE
export const MOCK_MAINTENANCE: MaintenanceJob[] = [
  { id: 'J1', machine_id: 'M3', job_type: MaintenanceType.Breakdown, opened_on: '2023-10-26', status: MaintenanceStatus.Open, description: 'Hydraulic leak in main cylinder', assigned_to: 'Mechanic Ramesh' },
  { id: 'J2', machine_id: 'M1', job_type: MaintenanceType.Service, opened_on: '2023-10-20', due_on: '2023-10-25', closed_on: '2023-10-25', status: MaintenanceStatus.Completed, description: '500 Hour Service' },
];

// SPARE PARTS
export const MOCK_SPARE_PARTS: SparePart[] = [
  { id: 'SP1', part_number: 'FIL-AIR-200', name: 'Air Filter Primary', category: 'Filter', current_stock: 5, min_stock_level: 3, unit: 'pcs', cost_per_unit: 1200, location: 'Rack A-01', compatible_models: 'Hitachi EX200, JCB 3DX', last_verified: '2023-10-20', verified_by: 'Supervisor Bob' },
  { id: 'SP2', part_number: 'OIL-HYD-68', name: 'Hydraulic Oil 68', category: 'Lubricant', current_stock: 200, min_stock_level: 50, unit: 'liters', cost_per_unit: 250, location: 'Drum Storage', compatible_models: 'All Excavators', last_verified: '2023-10-15', verified_by: 'Manager A' },
  { id: 'SP3', part_number: 'TEETH-BKT-01', name: 'Bucket Tooth GP', category: 'Undercarriage', current_stock: 12, min_stock_level: 10, unit: 'pcs', cost_per_unit: 850, location: 'Rack B-03', compatible_models: 'Hitachi EX200', last_verified: '2023-09-30', verified_by: 'Supervisor Bob' },
  { id: 'SP4', part_number: 'BAT-12V-150', name: 'Battery 12V 150Ah', category: 'Electrical', current_stock: 2, min_stock_level: 2, unit: 'pcs', cost_per_unit: 14500, location: 'Safe Room', compatible_models: 'Tipper, Dozer', last_verified: '2023-10-25', verified_by: 'Super Admin' },
];

// SPARE PART TRANSACTIONS
export const MOCK_PART_TRANSACTIONS: PartTransaction[] = [
  { id: 'TX1', part_id: 'SP2', type: 'OUT', quantity: 20, date: '2023-10-25', reference_id: 'J1', notes: 'Top up for EX200', performed_by: 'Manager A' },
  { id: 'TX2', part_id: 'SP1', type: 'IN', quantity: 10, date: '2023-10-20', reference_id: 'PO-5541', notes: 'Vendor Delivery', performed_by: 'Super Admin' },
];

// USER ACTIVITY LOGS
export const MOCK_USER_ACTIVITY: UserActivity[] = [
  { id: 'ACT1', user_id: 'U3', timestamp: '2023-10-27T08:15:00', action: 'Login', geo_lat: 17.451, geo_lng: 78.324, details: 'Login from Mobile App (Android)' },
  { id: 'ACT2', user_id: 'U3', timestamp: '2023-10-27T08:20:00', action: 'Shift Start', geo_lat: 17.451, geo_lng: 78.324, details: 'Started shift for OP1' },
  { id: 'ACT3', user_id: 'U2', timestamp: '2023-10-26T14:00:00', action: 'Update Site', geo_lat: 19.071, geo_lng: 72.871, details: 'Updated status of S2' },
  { id: 'ACT4', user_id: 'U1', timestamp: '2023-10-27T10:00:00', action: 'Login', geo_lat: 12.971, geo_lng: 77.594, details: 'Login from Web Dashboard' },
  { id: 'ACT5', user_id: 'U2', timestamp: '2023-10-27T09:30:00', action: 'Login', geo_lat: 19.076, geo_lng: 72.877, details: 'Login from Web Dashboard' },
  { id: 'ACT6', user_id: 'U4', timestamp: '2023-10-27T07:00:00', action: 'Login', geo_lat: 28.704, geo_lng: 77.102, details: 'Login from Mobile App (iOS)' },
];

// PERMISSIONS
export const INITIAL_PERMISSIONS: Record<string, RolePermissions> = {
  super_admin: { manage_sites: true, manage_users: true, bulk_edit_fleet: true, view_reports: true, view_inventory: true },
  manager: { manage_sites: true, manage_users: true, bulk_edit_fleet: true, view_reports: true, view_inventory: true },
  supervisor: { manage_sites: false, manage_users: false, bulk_edit_fleet: false, view_reports: false, view_inventory: true },
  operator: { manage_sites: false, manage_users: false, bulk_edit_fleet: false, view_reports: false, view_inventory: false }
};

// USER REMINDERS (Renamed from OPERATOR_REMINDERS)
export const MOCK_OPERATOR_REMINDERS: UserReminder[] = [
  { id: 'R1', user_id: 'OP1', date: today, text: 'Check engine oil level', is_completed: false },
  { id: 'R2', user_id: 'OP1', date: today, text: 'Submit weekly timesheet', is_completed: true },
  { id: 'R3', user_id: 'OP1', date: yesterday, text: 'Bring safety boots', is_completed: true },
];

// CHAT MESSAGES
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'M1', user_id: 'U1', user_name: 'Super Admin', role: 'super_admin', message: 'Welcome to the team chat everyone!', timestamp: '2023-10-27T09:00:00' },
  { id: 'M2', user_id: 'U2', user_name: 'Site Manager A', role: 'manager', message: 'Updates for Kollur Flyover: We need 2 more tippers tomorrow.', timestamp: '2023-10-27T09:05:00' },
  { id: 'M3', user_id: 'U3', user_name: 'Supervisor Bob', role: 'supervisor', message: 'Noted. I will arrange them from the depot.', timestamp: '2023-10-27T09:10:00' },
];
