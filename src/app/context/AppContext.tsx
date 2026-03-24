import React, { createContext, useContext, useState } from 'react';
import {
  Incident, User, FailedAlert, AlertType, IncidentStatus,
  StakeholderAction, CreateIncidentInput, CreateIncidentResult, TestNotificationResult, QuickActionLog,
} from '../types';
import { mockIncidents, mockUsers, mockFailedAlerts, defaultNotificationAssignments } from '../data/mockData';

interface AppContextType {
  incidents: Incident[];
  users: User[];
  failedAlerts: FailedAlert[];
  notificationAssignments: Record<string, string[]>;
  systemHealth: SystemHealth;
  quickActionLogs: QuickActionLog[];

  createIncident: (input: CreateIncidentInput) => CreateIncidentResult;
  updateIncidentStatus: (id: string, status: IncidentStatus, userId: string, userName: string, note?: string) => void;
  assignIncident: (id: string, assigneeId: string, assigneeName: string, assignerId: string, assignerName: string) => void;
  markFollowUp: (id: string, note: string, userId: string, userName: string) => void;
  addResolutionNote: (id: string, note: string, userId: string, userName: string) => void;
  archiveResolved: () => void;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  revokeAccess: (id: string) => void;

  updateNotificationAssignment: (alertType: AlertType, userIds: string[]) => void;
  sendTestNotification: (recipientId: string, alertType: AlertType, channel: 'sms' | 'email' | 'both') => TestNotificationResult;
  
  triggerQuickAction: (button: '1' | '2', emergencyType?: 'Natural Disaster' | 'Fire' | 'Threat') => void;
  updateQuickActionLog: (id: string, updates: { title?: string; description?: string; location?: string }) => void;
}

interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  activeConnections: number;
  alertsProcessed24h: number;
  avgResponseTimeMin: number;
  lastChecked: string;
}

const AppContext = createContext<AppContextType | null>(null);

const now = () => new Date().toISOString();
const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

let incidentCounter = 16;
let userCounter = 7;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [failedAlerts, setFailedAlerts] = useState<FailedAlert[]>(mockFailedAlerts);
  const [notificationAssignments, setNotificationAssignments] = useState<Record<string, string[]>>(defaultNotificationAssignments);
  const [quickActionLogs, setQuickActionLogs] = useState<QuickActionLog[]>([]);

  const systemHealth: SystemHealth = {
    status: 'operational',
    uptime: 99.8,
    activeConnections: 47,
    alertsProcessed24h: 12,
    avgResponseTimeMin: 4.2,
    lastChecked: 'Today, 09:15 AM',
  };

  // ID001, ID003, ID017, ID019, ID024, ID025, ID027, ID036
  const createIncident = (input: CreateIncidentInput): CreateIncidentResult => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const duplicate = incidents.find(
      i =>
        i.triggeredById === input.triggeredById &&
        i.type === input.type &&
        i.location === input.location &&
        i.date > fiveMinAgo
    );
    if (duplicate) {
      const fa: FailedAlert = {
        id: `FA-${Date.now()}`,
        type: input.type,
        location: input.location,
        submittedBy: input.triggeredByName,
        timestamp: fmt(now()),
        reason: 'Duplicate submission rejected – same source within 5 minutes',
      };
      setFailedAlerts(prev => [fa, ...prev]);
      return { success: false, isDuplicate: true, message: 'Duplicate alert rejected. A similar alert was recently submitted from the same source.' };
    }

    const id = `INC-${String(incidentCounter++).padStart(3, '0')}`;
    const timestamp = fmt(now());
    const dateStr = now();

    const isExternal = (input.priority === 'critical' || input.priority === 'high') &&
      ['fire', 'lockdown', 'medical'].includes(input.type);

    const externalServices: string[] = [];
    if (isExternal) {
      if (input.type === 'fire') externalServices.push('Fire Brigade');
      if (input.type === 'lockdown') externalServices.push('Police');
      if (input.type === 'medical') externalServices.push('Ambulance');
    }

    const assignedUsers = (notificationAssignments[input.type] || []);
    const notifications = assignedUsers.map(uid => {
      const u = users.find(x => x.id === uid);
      return {
        recipientId: uid,
        recipientName: u?.name || 'Unknown',
        sms: 'sent' as const,
        email: 'sent' as const,
        smsTimestamp: timestamp,
        emailTimestamp: timestamp,
      };
    });

    const stakeholders: StakeholderAction[] = [
      { userId: input.triggeredById, name: input.triggeredByName, action: 'triggered', timestamp },
      ...assignedUsers.map(uid => {
        const u = users.find(x => x.id === uid);
        return { userId: uid, name: u?.name || 'Unknown', action: 'notified' as const, timestamp };
      }),
    ];

    const incident: Incident = {
      id,
      type: input.type,
      priority: input.priority,
      status: 'triggered',
      title: input.title,
      description: input.description,
      location: input.location,
      timestamp,
      date: dateStr,
      device: input.device,
      triggeredById: input.triggeredById,
      triggeredByName: input.triggeredByName,
      assignedToId: undefined,
      assignedToName: undefined,
      requiresFollowUp: false,
      externalNotified: isExternal,
      externalServices,
      resolutionNote: undefined,
      unacknowledgedFlag: false,
      stakeholders,
      notifications,
    };

    setIncidents(prev => [incident, ...prev]);
    return { success: true, incident, message: `Alert ${id} has been logged and is being actioned.` };
  };

  // ID010, ID031, ID034
  const updateIncidentStatus = (id: string, status: IncidentStatus, userId: string, userName: string, note?: string) => {
    setIncidents(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const action: StakeholderAction = { userId, name: userName, action: status as any, timestamp: fmt(now()), note };
        return {
          ...i,
          status,
          unacknowledgedFlag: false,
          stakeholders: [...i.stakeholders, action],
          resolutionNote: status === 'resolved' && note ? note : i.resolutionNote,
        };
      })
    );
  };

  const assignIncident = (id: string, assigneeId: string, assigneeName: string, assignerId: string, assignerName: string) => {
    setIncidents(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const action: StakeholderAction = {
          userId: assignerId, name: assignerName, action: 'reassigned',
          timestamp: fmt(now()), note: `Reassigned to ${assigneeName}`,
        };
        return { ...i, assignedToId: assigneeId, assignedToName: assigneeName, stakeholders: [...i.stakeholders, action] };
      })
    );
  };

  const markFollowUp = (id: string, note: string, userId: string, userName: string) => {
    setIncidents(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const action: StakeholderAction = { userId, name: userName, action: 'follow_up_marked', timestamp: fmt(now()), note };
        return { ...i, requiresFollowUp: true, followUpNote: note, stakeholders: [...i.stakeholders, action] };
      })
    );
  };

  const addResolutionNote = (id: string, note: string, userId: string, userName: string) => {
    setIncidents(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const action: StakeholderAction = { userId, name: userName, action: 'resolution_note_added', timestamp: fmt(now()), note };
        return { ...i, resolutionNote: note, stakeholders: [...i.stakeholders, action] };
      })
    );
  };

  // ID028: archive resolved incidents older than 30 days
  const archiveResolved = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    setIncidents(prev =>
      prev.map(i =>
        i.status === 'resolved' && i.date < thirtyDaysAgo ? { ...i, status: 'archived' as IncidentStatus } : i
      )
    );
  };

  // ID006
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...user, id: `u${userCounter++}`, createdAt: new Date().toISOString().split('T')[0] };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
  };

  const revokeAccess = (id: string) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, active: false } : u)));
  };

  // ID016
  const updateNotificationAssignment = (alertType: AlertType, userIds: string[]) => {
    setNotificationAssignments(prev => ({ ...prev, [alertType]: userIds }));
  };

  // ID015
  const sendTestNotification = (recipientId: string, alertType: AlertType, channel: 'sms' | 'email' | 'both'): TestNotificationResult => {
    const user = users.find(u => u.id === recipientId);
    const success = Math.random() > 0.15; // 85% success rate in demo
    if (!success) {
      const fa: FailedAlert = {
        id: `FA-${Date.now()}`,
        type: alertType,
        location: 'Test',
        submittedBy: 'System (Test)',
        timestamp: fmt(now()),
        reason: `Test notification ${channel} delivery failed – gateway error`,
      };
      setFailedAlerts(prev => [fa, ...prev]);
    }
    return { channel, success, recipient: user?.name || recipientId, timestamp: fmt(now()) };
  };

  const triggerQuickAction = (button: '1' | '2', emergencyType?: 'Natural Disaster' | 'Fire' | 'Threat') => {
    const timestamp = fmt(now());
    const dateStr = now();
    const actions = button === '1' ? ['Email', 'SMS', 'Record'] : ['Email', 'Record'];
    
    const action: QuickActionLog = {
      id: `QA-${Date.now()}`,
      button,
      timestamp,
      date: dateStr,
      actions,
      emergencyType,
    };
    setQuickActionLogs(prev => [action, ...prev]);
  };

  const updateQuickActionLog = (id: string, updates: { title?: string; description?: string; location?: string }) => {
    setQuickActionLogs(prev =>
      prev.map(log => (log.id === id ? { ...log, ...updates } : log))
    );
  };

  return (
    <AppContext.Provider value={{
      incidents, users, failedAlerts, notificationAssignments, systemHealth, quickActionLogs,
      createIncident, updateIncidentStatus, assignIncident, markFollowUp, addResolutionNote, archiveResolved,
      addUser, updateUser, revokeAccess,
      updateNotificationAssignment, sendTestNotification,
      triggerQuickAction,
      updateQuickActionLog,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}