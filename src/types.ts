
export type UserRole = 'super_admin' | 'manager' | 'supervisor' | 'operator';
export type Role = UserRole;

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  last_login?: string;
}

export enum MachineStatus {
  Working = 'Working',
  Idle = 'Idle',
  Breakdown = 'Breakdown',
  Available = 'Available',
  Maintenance = 'Maintenance'
}

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

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  make: string;
  model: string;
  ownership_type: 'Owned' | 'Rented';
  current_site_id: string | null;
  status: MachineStatus | string;
  current_status?: MachineStatus | string;
  hour_meter_reading: number;
  fuel_capacity_litres?: number;
  last_gps_lat?: number;
  last_gps_lng?: number;
}

export interface Site {
  id: string;
  name: string;
  client_name: string;
  location_text: string;
  status: 'Active' | 'Paused' | 'Completed';
  geo_center_lat?: number;
  geo_center_lng?: number;
  geo_radius_meters?: number;
  start_date?: string;
}

export interface Operator {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  skill_level?: number;
  status: 'Active' | 'Inactive';
  scorecard_grade?: number;
  employee_code?: string;
  skills?: string[];
  default_site_id?: string;
}

export enum ShiftStatus {
  Planned = 'Planned',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface Shift {
  id: string;
  site_id: string;
  machine_id: string;
  operator_id: string;
  shift_date: string;
  planned_start_time?: string;
  planned_end_time?: string;
  planned_hours: number;
  actual_start_time?: string;
  actual_end_time?: string;
  actual_work_hours: number;
  idle_hours?: number;
  status: 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
  assigned_by?: string;
  assigned_by_name?: string;
  notes?: string;
}

export interface FuelLog {
  id: string;
  machine_id: string;
  site_id: string;
  timestamp?: string;
  log_datetime?: string;
  litres: number;
  event_type: string;
  source?: string;
  meter_reading?: number;
  created_by?: string;
  recorded_by?: string;
  slip_number?: string;
}

export enum MaintenanceType {
  Service = 'Service',
  Breakdown = 'Breakdown',
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
  type?: string;
  job_type?: MaintenanceType;
  status: 'Open' | 'InProgress' | 'Completed';
  scheduled_date?: string;
  opened_on?: string;
  due_on?: string;
  closed_on?: string;
  description: string;
  total_cost?: number;
  assigned_to?: string;
}

export interface SparePart {
  id: string;
  part_number: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  location: string;
  unit: string;
  cost_per_unit: number;
  is_critical?: boolean;
  last_received_date?: string;
  last_issued_date?: string;
  last_verified?: string;
  verified_by?: string;
}

export type Page = 'dashboard' | 'machines' | 'sites' | 'shifts' | 'fuel' | 'maintenance' | 'reports' | 'admin' | 'spare_parts' | 'chat';

export interface PartTransaction {
  id: string;
  part_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  notes?: string;
  performed_by?: string;
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
  date: string;
  text: string;
  is_completed: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  message: string;
  timestamp: string;
  is_edited?: boolean;
}
