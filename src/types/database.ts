export type UserRole = 'super_admin' | 'state_admin' | 'executor' | 'viewer';
export type TaskStatus = 'pending' | 'in_progress' | 'validation' | 'completed' | 'delayed' | 'canceled';
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'canceled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface State {
  id: string;
  name: string;
  uf: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  state_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  state_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  priority: PriorityLevel;
  status: ProjectStatus;
  progress_percent: number;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  tags: string[];
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  state_id: string;
  title: string;
  description: string | null;
  author_id: string | null;
  executor_id: string | null;
  reviewer_id: string | null;
  priority: PriorityLevel;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  progress_percent: number;
  tags: string[];
  location: string | null;
  requires_validation: boolean;
  is_recurring: boolean;
  recurrence_type: string | null;
  parent_task_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  author_id: string | null;
  title: string;
  message: string | null;
  type: string;
  related_task_id: string | null;
  related_project_id: string | null;
  is_read: boolean;
  sent_email: boolean;
  created_at: string;
}

export type NotificationWithAuthor = Notification & { author?: User };

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at: string;
}

export type ProjectWithManager = Project & { manager?: User; state?: State };
export type TaskWithRelations = Task & { 
  project?: Project; 
  state?: State; 
  author?: User; 
  executor?: User;
  reviewer?: User;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
};

export const STATES_BR = [
  { name: 'Acre', uf: 'AC', region: 'Norte' },
  { name: 'Alagoas', uf: 'AL', region: 'Nordeste' },
  { name: 'Amapá', uf: 'AP', region: 'Norte' },
  { name: 'Amazonas', uf: 'AM', region: 'Norte' },
  { name: 'Bahia', uf: 'BA', region: 'Nordeste' },
  { name: 'Ceará', uf: 'CE', region: 'Nordeste' },
  { name: 'Distrito Federal', uf: 'DF', region: 'Centro-Oeste' },
  { name: 'Espírito Santo', uf: 'ES', region: 'Sudeste' },
  { name: 'Goiás', uf: 'GO', region: 'Centro-Oeste' },
  { name: 'Maranhão', uf: 'MA', region: 'Nordeste' },
  { name: 'Mato Grosso', uf: 'MT', region: 'Centro-Oeste' },
  { name: 'Mato Grosso do Sul', uf: 'MS', region: 'Centro-Oeste' },
  { name: 'Minas Gerais', uf: 'MG', region: 'Sudeste' },
  { name: 'Pará', uf: 'PA', region: 'Norte' },
  { name: 'Paraíba', uf: 'PB', region: 'Nordeste' },
  { name: 'Paraná', uf: 'PR', region: 'Sul' },
  { name: 'Pernambuco', uf: 'PE', region: 'Nordeste' },
  { name: 'Piauí', uf: 'PI', region: 'Nordeste' },
  { name: 'Rio de Janeiro', uf: 'RJ', region: 'Sudeste' },
  { name: 'Rio Grande do Norte', uf: 'RN', region: 'Nordeste' },
  { name: 'Rio Grande do Sul', uf: 'RS', region: 'Sul' },
  { name: 'Rondônia', uf: 'RO', region: 'Norte' },
  { name: 'Roraima', uf: 'RR', region: 'Norte' },
  { name: 'Santa Catarina', uf: 'SC', region: 'Sul' },
  { name: 'São Paulo', uf: 'SP', region: 'Sudeste' },
  { name: 'Sergipe', uf: 'SE', region: 'Nordeste' },
  { name: 'Tocantins', uf: 'TO', region: 'Norte' },
] as const;

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  validation: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  delayed: 'bg-red-500/10 text-red-500 border-red-500/20',
  canceled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};
