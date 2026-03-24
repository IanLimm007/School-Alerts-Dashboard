import { AlertType, Priority, IncidentStatus } from '../../types';

export const TYPE_CONFIG: Record<AlertType, { label: string; color: string }> = {
  fire: { label: 'Fire', color: 'bg-red-100 text-red-700' },
  lockdown: { label: 'Lockdown', color: 'bg-purple-100 text-purple-700' },
  medical: { label: 'Medical', color: 'bg-blue-100 text-blue-700' },
  behaviour: { label: 'Behaviour', color: 'bg-orange-100 text-orange-700' },
  weather: { label: 'Weather', color: 'bg-sky-100 text-sky-700' },
  maintenance: { label: 'Maintenance', color: 'bg-gray-100 text-gray-600' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-600' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
};

export const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string }> = {
  triggered: { label: 'Triggered', color: 'bg-yellow-100 text-yellow-800' },
  acknowledged: { label: 'Acknowledged', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
};

export function TypeBadge({ type }: { type: AlertType }) {
  const cfg = TYPE_CONFIG[type];
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${cfg.color}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>;
}
