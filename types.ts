
export enum MachineType {
  Excavator = 'Excavator',
  Dozer = 'Dozer',
  Tipper = 'Tipper',
  Crane = 'Crane',
  Loader = 'Loader',
  Roller = 'Roller',
  Generator = 'Generator',
  Other = 'Other'
}

export enum MachineStatus {
  Available = 'Available',
  Working = 'Working',
  Idle = 'Idle',
  Breakdown = 'Breakdown',
  Maintenance = 'Under Maintenance'
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  make: string;
  model: string;
  ownership_type: 'Owned' | 'Rented';
  current_status: MachineStatus;
  current_site_id: string;
  hour_meter_reading: number;
  notes?: string;
}

export enum OperatorStatus {
  Available = 'Available',
  OnShift = 'On Shift',
  OnLeave = 'On Leave',
  Blocked = 'Blocked'
}

export interface Operator {
  id: string;
  name: string;
  phone: string;
  employee_code: string;
  skills: MachineType[];
  status: OperatorStatus;
  default_site_id: string;
  photo?: string;
}

export enum SiteStatus {
  Active = 'Active',
  Paused = 'Paused',
  Completed = 'Completed'
}

export interface Site {
  id: string;
  name: string;
  client_name: string;
  location_text: string;
  status: SiteStatus;
  start_date: string;
  geo_lat?: number;
  geo_lng?: number;
}

export enum ShiftStatus {
  Planned = 'Planned',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface Shift {
  id: string;
  machine_id: string;
  operator_id: string;
  site_id: string;
  shift_date: string; // YYYY-MM-DD
  planned_start_time: string; // HH:mm
  planned_end_time: string; // HH:mm
  actual_start_time?: string; // ISO string
  actual_end_time?: string; // ISO string
  planned_hours: number;
  actual_work_hours: number;
  idle_hours: number;
  status: ShiftStatus;
  notes?: string;
  assigned_by?: string; // Role or User Name of who assigned the task
}

export enum FuelEventType {
  Refuel = 'Refuel',
  Drain = 'Drain',
  Regular = 'Regular'
}

export interface FuelLog {
  id: string;
  machine_id: string;
  site_id: string;
  log_datetime: string;
  event_type: FuelEventType;
  litres: number;
  fuel_meter_reading?: number;
  recorded_by: string;
  slip_number?: string;
  notes?: string;
}

export enum MaintenanceType {
  Service = 'Service',
  Breakdown = 'Breakdown Repair',
  Inspection = 'Inspection',
  Other = 'Other'
}

export enum MaintenanceStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Completed = 'Completed'
}

export interface MaintenanceJob {
  id: string;
  machine_id: string;
  job_type: MaintenanceType;
  opened_on: string;
  due_on?: string;
  closed_on?: string;
  status: MaintenanceStatus;
  assigned_to?: string;
  description: string;
  resolution_notes?: string;
}

// Spare Parts
export type PartCategory = 'Filter' | 'Engine' | 'Hydraulic' | 'Electrical' | 'Undercarriage' | 'Tires' | 'Lubricant' | 'Other';

export interface SparePart {
  id: string;
  part_number: string;
  name: string;
  category: PartCategory;
  current_stock: number;
  min_stock_level: number;
  unit: string; // e.g., pcs, liters, kg
  cost_per_unit: number;
  location?: string; // Warehouse location
  compatible_models?: string;
  last_verified?: string; // Date of last physical stock verification
  verified_by?: string;
  last_received_date?: string; // Date of last IN transaction
  last_issued_date?: string;   // Date of last OUT transaction
}

export interface PartTransaction {
  id: string;
  part_id: string;
  type: 'IN' | 'OUT'; // IN = Purchase/Return, OUT = Usage
  quantity: number;
  date: string; // ISO DateTime
  reference_id?: string; // e.g., Job ID or PO Number
  notes?: string;
  performed_by: string;
}

export type Role = 'manager' | 'supervisor' | 'operator' | 'super_admin';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: Role;
  status: 'Active' | 'Inactive';
  last_login?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  timestamp: string;
  action: string;
  geo_lat?: number;
  geo_lng?: number;
  details?: string;
}

export type Feature = 'manage_sites' | 'manage_users' | 'bulk_edit_fleet' | 'view_reports' | 'view_inventory';

export interface RolePermissions {
  manage_sites: boolean;
  manage_users: boolean;
  bulk_edit_fleet: boolean;
  view_reports: boolean;
  view_inventory: boolean;
}

export interface UserReminder {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD or ISO
  text: string;
  is_completed: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  role: Role;
  message: string;
  timestamp: string;
  is_edited?: boolean;
}

// UI State Types
export type Page = 'dashboard' | 'machines' | 'sites' | 'shifts' | 'fuel' | 'maintenance' | 'reports' | 'admin' | 'spare_parts' | 'chat';
