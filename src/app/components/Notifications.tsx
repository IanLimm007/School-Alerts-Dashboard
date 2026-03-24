import { useState } from 'react';
import { Bell, Send, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { AlertType } from '../types';
import { TypeBadge } from './shared/Badges';

const ALERT_TYPES: AlertType[] = ['fire', 'lockdown', 'medical', 'behaviour', 'weather', 'maintenance', 'general'];

const TYPE_LABELS: Record<AlertType, string> = {
  fire: 'Fire',
  lockdown: 'Lockdown',
  medical: 'Medical Emergency',
  behaviour: 'Behaviour Incident',
  weather: 'Severe Weather',
  maintenance: 'Maintenance',
  general: 'General',
};

// ID020: Priority queue labels
const PRIORITY_QUEUE_INFO: Record<AlertType, string> = {
  fire: 'Expedited queue – processed immediately',
  lockdown: 'Expedited queue – processed immediately',
  medical: 'Expedited queue – processed immediately',
  behaviour: 'Standard queue',
  weather: 'Standard queue',
  maintenance: 'Low-priority queue',
  general: 'Standard queue',
};

export function Notifications() {
  const { incidents, users, failedAlerts, notificationAssignments, updateNotificationAssignment, sendTestNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'delivery' | 'assignments' | 'test' | 'failed'>('delivery');
  const [testRecipient, setTestRecipient] = useState('');
  const [testAlertType, setTestAlertType] = useState<AlertType>('general');
  const [testChannel, setTestChannel] = useState<'sms' | 'email' | 'both'>('both');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // All notification deliveries across incidents (ID014)
  const allDeliveries = incidents.flatMap(i =>
    i.notifications.map(n => ({ ...n, incidentId: i.id, incidentTitle: i.title, incidentTimestamp: i.timestamp }))
  );

  const failedDeliveries = allDeliveries.filter(d => d.sms === 'failed' || d.email === 'failed');
  const totalSent = allDeliveries.length;
  const totalFailed = failedDeliveries.length;
  const deliveryRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 100;

  // ID015: Test notification
  const handleSendTest = async () => {
    if (!testRecipient) { toast.error('Please select a recipient.'); return; }
    setTestLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = sendTestNotification(testRecipient, testAlertType, testChannel);
    setTestLoading(false);
    setTestResult(result);
    if (result.success) {
      toast.success(`Test notification sent to ${result.recipient}.`);
    } else {
      toast.error(`Test notification failed for ${result.recipient}.`);
    }
  };

  // ID016: toggle assignment
  const toggleAssignment = (alertType: AlertType, userId: string) => {
    const current = notificationAssignments[alertType] || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    updateNotificationAssignment(alertType, updated);
  };

  const activeUsers = users.filter(u => u.active);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">Delivery status, alert assignments, and test notifications</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total notifications sent</p>
          <p className="text-2xl text-gray-900" style={{ fontWeight: 600 }}>{totalSent}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Delivery rate</p>
          <p className={`text-2xl ${deliveryRate >= 95 ? 'text-green-600' : deliveryRate >= 80 ? 'text-amber-600' : 'text-red-600'}`} style={{ fontWeight: 600 }}>{deliveryRate}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Delivery failures</p>
          <p className="text-2xl text-red-600" style={{ fontWeight: 600 }}>{totalFailed}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {[
          { key: 'delivery', label: 'Delivery Status' },
          { key: 'assignments', label: 'Alert Assignments' },
          { key: 'test', label: 'Test Notification' },
          { key: 'failed', label: `Failed Alerts (${failedAlerts.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === t.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Delivery Status (ID014, ID012, ID013) */}
      {activeTab === 'delivery' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 hidden md:grid grid-cols-[1fr_160px_90px_90px] gap-4 text-xs text-gray-500">
            <span>Incident</span>
            <span>Recipient</span>
            <span>SMS</span>
            <span>Email</span>
          </div>
          {allDeliveries.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No notifications recorded.</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {allDeliveries.map((d, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_160px_90px_90px] gap-2 md:gap-4 px-4 py-3 items-center">
                  <div>
                    <p className="text-sm text-gray-800 truncate">{d.incidentTitle}</p>
                    <p className="text-xs text-gray-400">{d.incidentTimestamp}</p>
                  </div>
                  <p className="text-sm text-gray-600">{d.recipientName}</p>
                  <DeliveryStatus status={d.sms} label="SMS" timestamp={d.smsTimestamp} />
                  <DeliveryStatus status={d.email} label="Email" timestamp={d.emailTimestamp} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert Assignments (ID016) */}
      {activeTab === 'assignments' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-600">Configure which staff members receive notifications for each alert type. Staff will be notified via SMS and email when an alert is triggered.</p>
          </div>
          {/* ID020: Priority queue info */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500 w-48">Alert Type</th>
                  <th className="text-left px-4 py-2.5 text-xs text-gray-500 w-48">Queue Priority</th>
                  {activeUsers.map(u => (
                    <th key={u.id} className="text-center px-3 py-2.5 text-xs text-gray-500 min-w-[90px]">
                      {u.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ALERT_TYPES.map(type => (
                  <tr key={type} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <TypeBadge type={type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {['fire', 'lockdown', 'medical'].includes(type) && (
                          <Zap className="size-3 text-red-500" />
                        )}
                        <span className="text-xs text-gray-500">{PRIORITY_QUEUE_INFO[type]}</span>
                      </div>
                    </td>
                    {activeUsers.map(u => {
                      const assigned = (notificationAssignments[type] || []).includes(u.id);
                      return (
                        <td key={u.id} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => toggleAssignment(type, u.id)}
                            className="cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Notification (ID015) */}
      {activeTab === 'test' && (
        <div className="max-w-md">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="size-4 text-gray-500" />
              <h3 className="text-gray-900">Send Test Notification</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Send a test SMS or email to confirm delivery is working correctly. This will not trigger a real alert.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Recipient</label>
                <select value={testRecipient} onChange={e => setTestRecipient(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                  <option value="">Select recipient…</option>
                  {activeUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} – {u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Alert type to simulate</label>
                <select value={testAlertType} onChange={e => setTestAlertType(e.target.value as AlertType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                  {ALERT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Channel</label>
                <div className="flex gap-3">
                  {(['sms', 'email', 'both'] as const).map(c => (
                    <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="channel" value={c} checked={testChannel === c} onChange={() => setTestChannel(c)} />
                      <span className="text-sm text-gray-700 capitalize">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSendTest}
                disabled={testLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                <Send className="size-4" />
                {testLoading ? 'Sending…' : 'Send Test Notification'}
              </button>

              {testResult && (
                <div className={`flex items-start gap-2 rounded-lg p-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResult.success
                    ? <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
                    : <XCircle className="size-4 text-red-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`} style={{ fontWeight: 500 }}>
                      {testResult.success ? 'Delivered successfully' : 'Delivery failed'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Recipient: {testResult.recipient} · {testResult.timestamp}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Failed Alerts (ID018) */}
      {activeTab === 'failed' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-red-500" />
            <p className="text-sm text-gray-600">Failed alert submissions that were not processed. These should be investigated and resolved.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {failedAlerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No failed alerts recorded.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {failedAlerts.map(fa => (
                  <div key={fa.id} className="px-4 py-3 flex items-start gap-3">
                    <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <TypeBadge type={fa.type} />
                        <span className="text-sm text-gray-800">{fa.location}</span>
                        <span className="text-xs text-gray-400">{fa.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500">Submitted by: {fa.submittedBy}</p>
                      <p className="text-xs text-red-600 mt-0.5">{fa.reason}</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded shrink-0">Failed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryStatus({ status, label, timestamp }: { status: 'sent' | 'failed' | 'pending'; label: string; timestamp?: string }) {
  const config = {
    sent: { color: 'text-green-600', bg: 'bg-green-50', Icon: CheckCircle2 },
    failed: { color: 'text-red-600', bg: 'bg-red-50', Icon: XCircle },
    pending: { color: 'text-gray-500', bg: 'bg-gray-50', Icon: Bell },
  };
  const { color, bg, Icon } = config[status];
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded ${bg} w-fit`}>
      <Icon className={`size-3 ${color}`} />
      <span className={`text-xs ${color}`}>{status}</span>
    </div>
  );
}
