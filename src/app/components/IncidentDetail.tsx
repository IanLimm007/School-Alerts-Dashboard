import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, CheckCircle2, Clock, User, MapPin, Monitor, Flag,
  UserCog, FileText, Phone, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { TypeBadge, PriorityBadge, StatusBadge } from './shared/Badges';
import { IncidentStatus } from '../types';
import { toast } from 'sonner';

const ACTION_LABELS: Record<string, string> = {
  triggered: 'Triggered alert',
  notified: 'Notified',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  reassigned: 'Reassigned',
  follow_up_marked: 'Marked for follow-up',
  resolution_note_added: 'Added resolution note',
  archived: 'Archived',
};

const ACTION_COLORS: Record<string, string> = {
  triggered: 'bg-red-100 text-red-700',
  notified: 'bg-gray-100 text-gray-600',
  acknowledged: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  reassigned: 'bg-purple-100 text-purple-700',
  follow_up_marked: 'bg-amber-100 text-amber-700',
  resolution_note_added: 'bg-teal-100 text-teal-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { incidents, users, updateIncidentStatus, assignIncident, markFollowUp, addResolutionNote } = useApp();
  const navigate = useNavigate();

  const incident = incidents.find(i => i.id === id);

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  if (!incident) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Incident not found.</p>
        <button onClick={() => navigate('/incidents')} className="mt-3 text-sm text-blue-600 hover:underline">← Back to Incident Log</button>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.active && u.id !== incident.assignedToId);
  const isManager = currentUser?.role === 'safety_manager' || currentUser?.role === 'school_admin';

  const handleAcknowledge = () => {
    updateIncidentStatus(incident.id, 'acknowledged', currentUser!.id, currentUser!.name);
    toast.success('Incident acknowledged.');
  };

  const handleResolve = () => {
    if (!resolveNote.trim()) { toast.error('Please add a resolution note.'); return; }
    updateIncidentStatus(incident.id, 'resolved', currentUser!.id, currentUser!.name, resolveNote);
    setShowResolveForm(false);
    setResolveNote('');
    toast.success('Incident resolved.');
  };

  const handleAssign = () => {
    if (!selectedAssignee) { toast.error('Please select a staff member.'); return; }
    const user = users.find(u => u.id === selectedAssignee);
    if (!user) return;
    assignIncident(incident.id, user.id, user.name, currentUser!.id, currentUser!.name);
    setShowAssignDialog(false);
    setSelectedAssignee('');
    toast.success(`Reassigned to ${user.name}.`);
  };

  const handleFollowUp = () => {
    if (!followUpNote.trim()) { toast.error('Please add a follow-up note.'); return; }
    markFollowUp(incident.id, followUpNote, currentUser!.id, currentUser!.name);
    setShowFollowUpForm(false);
    setFollowUpNote('');
    toast.success('Incident marked for follow-up.');
  };

  const handleAddNote = () => {
    if (!resolutionNote.trim()) { toast.error('Please enter a note.'); return; }
    addResolutionNote(incident.id, resolutionNote, currentUser!.id, currentUser!.name);
    setShowNoteForm(false);
    setResolutionNote('');
    toast.success('Resolution note added.');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">{incident.id}</span>
              <TypeBadge type={incident.type} />
              <PriorityBadge priority={incident.priority} />
              <StatusBadge status={incident.status} />
              {incident.unacknowledgedFlag && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded animate-pulse">⚠ Unacknowledged</span>
              )}
              {incident.requiresFollowUp && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Follow-up required</span>
              )}
            </div>
            <h2 className="text-gray-900">{incident.title}</h2>
          </div>

          {/* Actions */}
          {isManager && incident.status !== 'resolved' && incident.status !== 'archived' && (
            <div className="flex gap-2 flex-wrap shrink-0">
              {incident.status === 'triggered' && (
                <button onClick={handleAcknowledge} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  <CheckCircle2 className="size-4" />
                  Acknowledge
                </button>
              )}
              {(incident.status === 'triggered' || incident.status === 'acknowledged') && (
                <button onClick={() => setShowResolveForm(!showResolveForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle2 className="size-4" />
                  Resolve
                </button>
              )}
              <button onClick={() => setShowAssignDialog(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                <UserCog className="size-4" />
                Reassign
              </button>
              {!incident.requiresFollowUp && (
                <button onClick={() => setShowFollowUpForm(!showFollowUpForm)} className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 text-sm rounded-lg hover:bg-amber-50 transition-colors">
                  <Flag className="size-4" />
                  Flag Follow-up
                </button>
              )}
              <button onClick={() => setShowNoteForm(!showNoteForm)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                <FileText className="size-4" />
                Add Note
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 mb-4">{incident.description}</p>

        {/* Resolve form */}
        {showResolveForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <label className="block text-sm text-gray-700 mb-2">Resolution note (required)</label>
            <textarea
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder="Describe the steps taken to resolve this incident…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none resize-none mb-2"
            />
            <div className="flex gap-2">
              <button onClick={handleResolve} className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">Confirm Resolution</button>
              <button onClick={() => setShowResolveForm(false)} className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Follow-up form */}
        {showFollowUpForm && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <label className="block text-sm text-gray-700 mb-2">Follow-up note</label>
            <textarea
              value={followUpNote}
              onChange={e => setFollowUpNote(e.target.value)}
              placeholder="Describe what follow-up action is required…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none resize-none mb-2"
            />
            <div className="flex gap-2">
              <button onClick={handleFollowUp} className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors">Mark for Follow-up</button>
              <button onClick={() => setShowFollowUpForm(false)} className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Note form */}
        {showNoteForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <label className="block text-sm text-gray-700 mb-2">Resolution note</label>
            <textarea
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              placeholder="Add a note about this incident…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none resize-none mb-2"
            />
            <div className="flex gap-2">
              <button onClick={handleAddNote} className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">Save Note</button>
              <button onClick={() => setShowNoteForm(false)} className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5"><MapPin className="size-3" /> Location</div>
            <p className="text-gray-800">{incident.location}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5"><Clock className="size-3" /> Timestamp</div>
            <p className="text-gray-800">{incident.timestamp}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5"><User className="size-3" /> Triggered by</div>
            <p className="text-gray-800">{incident.triggeredByName}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5"><Monitor className="size-3" /> Device</div>
            <p className="text-gray-800">{incident.device}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5"><UserCog className="size-3" /> Assigned to</div>
            <p className="text-gray-800">{incident.assignedToName || <span className="text-gray-400">Unassigned</span>}</p>
          </div>
          {incident.externalNotified && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5"><Phone className="size-3" /> External services</div>
              <p className="text-gray-800">{incident.externalServices?.join(', ')}</p>
            </div>
          )}
          {incident.requiresFollowUp && (
            <div className="col-span-2">
              <div className="flex items-center gap-1 text-xs text-amber-600 mb-0.5"><Flag className="size-3" /> Follow-up note</div>
              <p className="text-gray-700">{incident.followUpNote}</p>
            </div>
          )}
        </div>

        {/* Resolution note */}
        {incident.resolutionNote && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700 mb-1" style={{ fontWeight: 500 }}>Resolution Note</p>
            <p className="text-sm text-green-900">{incident.resolutionNote}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stakeholder Timeline (ID011) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Activity Timeline</h3>
          <div className="space-y-3">
            {incident.stakeholders.map((s, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 shrink-0">
                    {s.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {idx < incident.stakeholders.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-sm text-gray-800">{s.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${ACTION_COLORS[s.action] || 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[s.action] || s.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{s.timestamp}</span>
                  </div>
                  {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Delivery (ID014) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Notification Delivery</h3>
          {incident.notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications sent.</p>
          ) : (
            <div className="space-y-2">
              {incident.notifications.map((n, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">{n.recipientName}</p>
                    {n.smsTimestamp && <p className="text-xs text-gray-400">SMS: {n.smsTimestamp}</p>}
                    {n.emailTimestamp && <p className="text-xs text-gray-400">Email: {n.emailTimestamp}</p>}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${n.sms === 'sent' ? 'bg-green-100 text-green-700' : n.sms === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      SMS {n.sms}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${n.email === 'sent' ? 'bg-green-100 text-green-700' : n.email === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      Email {n.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reassign Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md">
            <h3 className="text-gray-900 mb-4">Reassign Incident</h3>
            <p className="text-sm text-gray-500 mb-4">Select a staff member to assign this incident to.</p>
            <select
              value={selectedAssignee}
              onChange={e => setSelectedAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none mb-4"
            >
              <option value="">Select staff member…</option>
              {activeUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowAssignDialog(false)} className="flex-1 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleAssign} className="flex-1 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">Reassign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
