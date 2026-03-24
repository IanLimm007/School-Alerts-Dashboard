export type AlertType = 'fire' | 'lockdown' | 'medical' | 'behaviour' | 'weather' | 'maintenance' | 'general';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'triggered' | 'acknowledged' | 'resolved' | 'archived';
export type Role = 'staff' | 'safety_manager' | 'school_admin' | 'it_admin';
export type ActionType = 'triggered' | 'notified' | 'acknowledged' | 'resolved' | 'reassigned' | 'follow_up_marked' | 'resolution_note_added' | 'archived';

export interface StakeholderAction {
  userId: string;
  name: string;
  action: ActionType;
  timestamp: string;
  note?: string;
}

export interface NotificationDelivery {
  recipientId: string;
  recipientName: string;
  sms: 'sent' | 'failed' | 'pending';
  email: 'sent' | 'failed' | 'pending';
  smsTimestamp?: string;
  emailTimestamp?: string;
}

export interface Incident {
  id: string;
  type: AlertType;
  priority: Priority;
  status: IncidentStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string; // display string
  date: string; // ISO date string for filtering/sorting
  device: string;
  triggeredById: string;
  triggeredByName: string;
  assignedToId?: string;
  assignedToName?: string;
  requiresFollowUp: boolean;
  followUpNote?: string;
  externalNotified: boolean;
  externalServices?: string[];
  resolutionNote?: string;
  stakeholders: StakeholderAction[];
  notifications: NotificationDelivery[];
  unacknowledgedFlag: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  department: string;
  notificationTypes: AlertType[];
  createdAt: string;
  lastLogin?: string;
}

export interface FailedAlert {
  id: string;
  type: AlertType;
  location: string;
  submittedBy: string;
  timestamp: string;
  reason: string;
}

export interface TestNotificationResult {
  channel: 'sms' | 'email' | 'both';
  success: boolean;
  recipient: string;
  timestamp: string;
}

export interface CreateIncidentInput {
  type: AlertType;
  priority: Priority;
  title: string;
  description: string;
  location: string;
  device: string;
  triggeredById: string;
  triggeredByName: string;
}

export interface CreateIncidentResult {
  success: boolean;
  incident?: Incident;
  isDuplicate?: boolean;
  message: string;
}

export interface QuickActionLog {
  id: string;
  button: '1' | '2';
  timestamp: string;
  date: string; // ISO string for sorting
  actions: string[]; // e.g., ['email', 'sms', 'record'] or ['email', 'record']
  title?: string;
  description?: string;
  location?: string;
  emergencyType?: 'Natural Disaster' | 'Fire' | 'Threat';
}