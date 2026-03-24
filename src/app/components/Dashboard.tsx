import { useNavigate } from 'react-router';
import { AlertTriangle, Clock, CheckCircle2, Activity, Plus, Flag, ChevronRight, Cpu, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { TypeBadge, PriorityBadge, StatusBadge } from './shared/Badges';
import { Incident } from '../types';
import { QuickActions } from './QuickActions';

export function Dashboard() {
  const { currentUser } = useAuth();
  const { incidents, systemHealth } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  // Staff view: show their own submissions (ID035)
  if (currentUser.role === 'staff') {
    const myIncidents = incidents.filter(i => i.triggeredById === currentUser.id);
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-gray-900">My Dashboard</h1>
            <p className="text-sm text-gray-500">Quick actions and alert tracking</p>
          </div>
          <button
            onClick={() => navigate('/submit')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="size-4" />
            New Alert
          </button>
        </div>

        {/* Quick Actions Widget */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* My Submissions */}
        <div>
          <h2 className="text-gray-900 mb-3">My Alert Submissions</h2>
          {myIncidents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
              <AlertTriangle className="size-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">You have not submitted any alerts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* ID035: Accountability confirmation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  All your submitted alerts are logged and being actioned by the safety team. You can track their status below.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {myIncidents.map(i => (
                  <IncidentRow key={i.id} incident={i} onClick={() => navigate(`/incidents/${i.id}`)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // IT Admin view
  if (currentUser.role === 'it_admin') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-gray-900">System Overview</h1>
          <p className="text-sm text-gray-500">System health and notification delivery status</p>
        </div>
        <SystemHealthPanel health={systemHealth} />
        <div className="mt-6">
          <h2 className="text-gray-900 mb-3">Recent Notification Failures</h2>
          {incidents.flatMap(i => i.notifications.filter(n => n.sms === 'failed' || n.email === 'failed').map(n => ({ ...n, incidentId: i.id, incidentTitle: i.title }))).slice(0, 5).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
              No recent delivery failures.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {incidents.flatMap(i =>
                i.notifications.filter(n => n.sms === 'failed' || n.email === 'failed').map(n => ({ ...n, incidentId: i.id, incidentTitle: i.title }))
              ).slice(0, 5).map((n, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-800">{n.incidentTitle}</p>
                    <p className="text-xs text-gray-500">Recipient: {n.recipientName}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {n.sms === 'failed' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">SMS failed</span>}
                    {n.email === 'failed' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Email failed</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Safety Manager / School Admin view (ID002, ID004, ID026)
  const activeIncidents = incidents.filter(i => i.status !== 'archived');
  const criticalCount = activeIncidents.filter(i => i.priority === 'critical').length;
  const highCount = activeIncidents.filter(i => i.priority === 'high').length;
  const triggeredCount = activeIncidents.filter(i => i.status === 'triggered').length;
  const unacknowledged = activeIncidents.filter(i => i.unacknowledgedFlag);
  const followUpRequired = activeIncidents.filter(i => i.requiresFollowUp && i.status !== 'resolved');

  // avg response time: mock
  const responseTime = systemHealth.avgResponseTimeMin;
  const recent = [...activeIncidents].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {currentUser.name}</p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="size-4" />
          Submit Alert
        </button>
      </div>

      {/* Stats (ID004) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Incidents" value={activeIncidents.length} icon={AlertTriangle} color="text-gray-700" />
        <StatCard label="Critical" value={criticalCount} icon={Zap} color="text-red-600" />
        <StatCard label="High Priority" value={highCount} icon={Flag} color="text-orange-600" />
        <StatCard label="Avg Response" value={`${responseTime}m`} icon={Clock} color="text-blue-600" />
      </div>

      {/* System Health (ID004) */}
      <SystemHealthPanel health={systemHealth} className="mb-6" compact />

      {/* Unacknowledged alerts (ID026) */}
      {unacknowledged.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-gray-900">Unacknowledged Alerts</h2>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{unacknowledged.length}</span>
          </div>
          <div className="space-y-2">
            {unacknowledged.map(i => (
              <div
                key={i.id}
                onClick={() => navigate(`/incidents/${i.id}`)}
                className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="size-4 text-red-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-900 truncate">{i.title}</p>
                  <p className="text-xs text-red-600">{i.location} · {i.timestamp}</p>
                </div>
                <PriorityBadge priority={i.priority} />
                <ChevronRight className="size-4 text-red-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up required (ID032) */}
      {followUpRequired.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="size-4 text-amber-600" />
            <h2 className="text-gray-900">Follow-up Required</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{followUpRequired.length}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {followUpRequired.map(i => (
              <div key={i.id} onClick={() => navigate(`/incidents/${i.id}`)} className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{i.title}</p>
                  <p className="text-xs text-gray-500">{i.followUpNote}</p>
                </div>
                <StatusBadge status={i.status} />
                <ChevronRight className="size-4 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents (ID002, ID010) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-gray-900">Recent Incidents</h2>
          <button onClick={() => navigate('/incidents')} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No incidents recorded.</div>
          ) : (
            recent.map(i => (
              <IncidentRow key={i.id} incident={i} onClick={() => navigate(`/incidents/${i.id}`)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`${color} mb-1`}><Icon className="size-4" /></div>
      <div className={`text-2xl ${color}`} style={{ fontWeight: 600 }}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SystemHealthPanel({ health, className = '', compact = false }: { health: any; className?: string; compact?: boolean }) {
  const statusColor = health.status === 'operational' ? 'text-green-600 bg-green-100' : health.status === 'degraded' ? 'text-amber-600 bg-amber-100' : 'text-red-600 bg-red-100';
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-gray-500" />
          <h3 className="text-gray-900">System Health</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusColor}`}>{health.status}</span>
      </div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
        <div><p className="text-xs text-gray-500">Uptime</p><p className="text-sm text-gray-800">{health.uptime}%</p></div>
        <div><p className="text-xs text-gray-500">Active connections</p><p className="text-sm text-gray-800">{health.activeConnections}</p></div>
        <div><p className="text-xs text-gray-500">Alerts (24h)</p><p className="text-sm text-gray-800">{health.alertsProcessed24h}</p></div>
        <div><p className="text-xs text-gray-500">Last checked</p><p className="text-sm text-gray-800">{health.lastChecked}</p></div>
      </div>
    </div>
  );
}

function IncidentRow({ incident: i, onClick }: { incident: Incident; onClick: () => void }) {
  return (
    <div onClick={onClick} className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm text-gray-800 truncate">{i.title}</span>
          {i.unacknowledgedFlag && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded animate-pulse">Unacknowledged</span>
          )}
        </div>
        <p className="text-xs text-gray-500">{i.location} · {i.timestamp} · {i.triggeredByName}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <TypeBadge type={i.type} />
        <PriorityBadge priority={i.priority} />
        <StatusBadge status={i.status} />
      </div>
      <ChevronRight className="size-4 text-gray-400 shrink-0" />
    </div>
  );
}