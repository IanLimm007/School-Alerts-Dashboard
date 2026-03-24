import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, WifiOff, CheckCircle2, Shield, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AlertType, Priority } from '../types';
import { LOCATIONS } from '../data/mockData';

const ALERT_TYPES: { value: AlertType; label: string; description: string }[] = [
  { value: 'fire', label: 'Fire', description: 'Fire alarm or smoke detected' },
  { value: 'lockdown', label: 'Lockdown', description: 'Intruder, threat, or security breach' },
  { value: 'medical', label: 'Medical Emergency', description: 'Injury, illness, or collapse' },
  { value: 'behaviour', label: 'Behaviour Incident', description: 'Altercation, harassment, or vandalism' },
  { value: 'weather', label: 'Severe Weather', description: 'Storm, flood, or extreme conditions' },
  { value: 'maintenance', label: 'Maintenance', description: 'Structural, utility, or safety hazard' },
  { value: 'general', label: 'General', description: 'Other safety concern' },
];

const PRIORITIES: { value: Priority; label: string; note: string }[] = [
  { value: 'critical', label: 'Critical', note: 'Life-threatening – immediate response required' },
  { value: 'high', label: 'High', note: 'Urgent – response needed within minutes' },
  { value: 'medium', label: 'Medium', note: 'Important – response needed today' },
  { value: 'low', label: 'Low', note: 'Routine – can be scheduled' },
];

const EXTERNAL_MAP: Partial<Record<AlertType, string[]>> = {
  fire: ['Fire Brigade'],
  lockdown: ['Police'],
  medical: ['Ambulance'],
};

// ID025: detect device/interface
function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Staff Mobile App';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet Browser';
  return 'Web Dashboard';
}

export function SubmitAlert() {
  const { currentUser } = useAuth();
  const { createIncident } = useApp();
  const navigate = useNavigate();

  const [type, setType] = useState<AlertType>('fire');
  const [priority, setPriority] = useState<Priority>('medium');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);

  // ID017: offline detection
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const effectiveLocation = location === 'Other' ? customLocation : location;
  const isHighRisk = (priority === 'critical' || priority === 'high') && ['fire', 'lockdown', 'medical'].includes(type);
  const willNotifyExternal = isHighRisk && !!EXTERNAL_MAP[type];
  const externalServices = EXTERNAL_MAP[type] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveLocation || !description || !title) {
      toast.error('Please fill in all required fields.');
      return;
    }
    // ID037: require reconfirmation for critical/high emergency alerts
    if (isHighRisk) {
      setShowConfirmDialog(true);
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const device = detectDevice();
    const result = createIncident({
      type, priority, title, description,
      location: effectiveLocation,
      device,
      triggeredById: currentUser!.id,
      triggeredByName: currentUser!.name,
    });
    setSubmitting(false);
    setShowConfirmDialog(false);

    if (result.isDuplicate) {
      toast.error(result.message);
      return;
    }
    if (result.success && result.incident) {
      setSuccessResult(result.incident);
    }
  };

  const handleConfirm = () => {
    if (!confirmChecked) { setPinError('Please confirm this is a genuine emergency.'); return; }
    if (confirmPin !== '1234') { setPinError('Incorrect PIN. Use 1234 for demo.'); return; }
    setPinError('');
    doSubmit();
  };

  // ID033: confirmation screen
  if (successResult) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center size-14 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="size-7 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-2">Alert Submitted Successfully</h2>
          <p className="text-sm text-gray-500 mb-1">
            Incident <strong>{successResult.id}</strong> has been logged and is being actioned by the safety team.
          </p>
          <p className="text-xs text-gray-400 mb-6">{successResult.timestamp}</p>

          {/* ID036: external services notified */}
          {successResult.externalNotified && successResult.externalServices?.length > 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-left">
              <Phone className="size-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-red-800 font-medium mb-0.5">External emergency services notified</p>
                <p className="text-xs text-red-700">{successResult.externalServices.join(', ')} have been automatically contacted via pre-configured emergency contacts.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-left mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Incident ID</p>
              <p className="text-sm text-gray-800">{successResult.id}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Priority</p>
              <p className="text-sm text-gray-800 capitalize">{successResult.priority}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm text-gray-800">{successResult.location}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Device</p>
              <p className="text-sm text-gray-800">{successResult.device}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/incidents/${successResult.id}`)}
              className="flex-1 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Incident
            </button>
            <button
              onClick={() => { setSuccessResult(null); setTitle(''); setDescription(''); setLocation(''); setPriority('medium'); setType('fire'); }}
              className="flex-1 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-gray-900">Submit Safety Alert</h1>
        <p className="text-sm text-gray-500">Report a safety incident so the team can respond immediately</p>
      </div>

      {/* ID017: offline warning */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          <WifiOff className="size-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            You are offline. Your alert will be queued and submitted automatically when connectivity is restored.
          </p>
        </div>
      )}

      {/* ID020: priority queue notice */}
      {(priority === 'critical' || priority === 'high') && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertTriangle className="size-4 text-red-600 shrink-0" />
          <p className="text-xs text-red-800">
            High-priority alerts are placed in an expedited processing queue and will never be delayed behind lower-priority submissions.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Incident Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Alert title <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief description of the incident"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what is happening, who is involved, and any relevant details…"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select location…</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {location === 'Other' && (
                <input
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                  placeholder="Specify location"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* Alert Type (ID009, ID024) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Alert Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALERT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  type === t.value
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div style={{ fontWeight: 500 }}>{t.label}</div>
                <div className="text-xs text-gray-400">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Priority / Severity (ID024) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Severity Level</h3>
          <div className="space-y-2">
            {PRIORITIES.map(p => (
              <label
                key={p.value}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  priority === p.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{p.label}</div>
                  <div className="text-xs text-gray-400">{p.note}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ID025: device info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <Shield className="size-4 text-gray-400" />
          <p className="text-xs text-gray-500">
            This alert will be logged as submitted from <strong>{detectDevice()}</strong> by <strong>{currentUser?.name}</strong>.
          </p>
        </div>

        {/* External services notice (ID036) */}
        {willNotifyExternal && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <Phone className="size-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">
              Submitting this alert will automatically notify external emergency services: <strong>{externalServices.join(', ')}</strong>.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          style={{ fontWeight: 500 }}
        >
          {isHighRisk ? 'Continue to Confirmation →' : 'Submit Alert'}
        </button>
      </form>

      {/* ID037: Reconfirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="size-4 text-red-600" />
              </div>
              <h2 className="text-gray-900">Confirm Emergency Alert</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You are submitting a <strong>{priority}</strong> <strong>{type}</strong> alert. This will immediately notify the safety team
              {willNotifyExternal ? ` and ${externalServices.join(', ')}` : ''}.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p><span className="text-gray-500">Title:</span> <span className="text-gray-800">{title}</span></p>
              <p><span className="text-gray-500">Location:</span> <span className="text-gray-800">{effectiveLocation}</span></p>
              <p><span className="text-gray-500">Priority:</span> <span className="text-gray-800 capitalize">{priority}</span></p>
            </div>

            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={e => setConfirmChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">I confirm this is a genuine emergency and I am submitting this alert intentionally.</span>
            </label>

            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Security PIN <span className="text-gray-400">(demo: 1234)</span></label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {pinError && <p className="text-xs text-red-600 mt-1">{pinError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmDialog(false); setConfirmPin(''); setConfirmChecked(false); setPinError(''); }}
                className="flex-1 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
