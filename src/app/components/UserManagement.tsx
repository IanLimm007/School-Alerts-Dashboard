import { useState } from 'react';
import { Plus, ShieldOff, Shield, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { Role, AlertType } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff Member',
  safety_manager: 'Safety Manager',
  school_admin: 'School Administrator',
  it_admin: 'IT Administrator',
};

const ROLE_COLORS: Record<Role, string> = {
  staff: 'bg-blue-100 text-blue-700',
  safety_manager: 'bg-red-100 text-red-700',
  school_admin: 'bg-purple-100 text-purple-700',
  it_admin: 'bg-gray-100 text-gray-600',
};

const ALERT_TYPES: AlertType[] = ['fire', 'lockdown', 'medical', 'behaviour', 'weather', 'maintenance', 'general'];

export function UserManagement() {
  const { users, addUser, revokeAccess, updateUser } = useApp();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<Role>('staff');
  const [newDept, setNewDept] = useState('');
  const [newNotifTypes, setNewNotifTypes] = useState<AlertType[]>(['fire', 'lockdown']);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = users.filter(u => !u.active).length;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newDept) { toast.error('Please fill in all required fields.'); return; }
    addUser({
      name: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      active: true,
      department: newDept,
      notificationTypes: newNotifTypes,
      lastLogin: undefined,
    });
    toast.success(`${newName} has been added to the system.`);
    setShowAddForm(false);
    setNewName(''); setNewEmail(''); setNewPhone(''); setNewDept('');
    setNewRole('staff'); setNewNotifTypes(['fire', 'lockdown']);
  };

  const handleRevoke = (id: string) => {
    revokeAccess(id);
    setConfirmRevoke(null);
    toast.success('Access revoked.');
  };

  const toggleNotifType = (type: AlertType) => {
    setNewNotifTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage staff access and roles</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="size-4" />
          Add User
        </button>
      </div>

      {/* ID005: No self-registration notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
        <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Self-registration is disabled.</strong> All user accounts must be created by an authorised Safety Manager. Staff who need access should contact their Safety Manager directly.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl text-gray-900" style={{ fontWeight: 600 }}>{users.length}</p>
          <p className="text-xs text-gray-500">Total users</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl text-green-600" style={{ fontWeight: 600 }}>{activeCount}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl text-gray-400" style={{ fontWeight: 600 }}>{inactiveCount}</p>
          <p className="text-xs text-gray-500">Revoked</p>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h3 className="text-gray-900 mb-4">Add New Staff Member</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Doe" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@school.edu" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+44 7700 900000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
              <input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="e.g. Science" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as Role)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Alert notifications</label>
              <div className="flex flex-wrap gap-2">
                {ALERT_TYPES.map(t => (
                  <label key={t} className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs transition-colors ${newNotifTypes.includes(t) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600'}`}>
                    <input type="checkbox" checked={newNotifTypes.includes(t)} onChange={() => toggleNotifType(t)} className="hidden" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">Add Staff Member</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or department…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
        />
      </div>

      {/* User list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_180px_140px_100px_120px_80px] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
          <span>Name</span>
          <span>Email</span>
          <span>Department</span>
          <span>Role</span>
          <span>Last login</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No users found.</div>
          ) : (
            filtered.map(u => (
              <div key={u.id} className={`grid grid-cols-1 md:grid-cols-[1fr_180px_140px_100px_120px_80px] gap-2 md:gap-4 px-4 py-3 items-center ${!u.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 shrink-0">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400 md:hidden">{u.email}</p>
                  </div>
                  {!u.active && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Revoked</span>}
                </div>
                <p className="text-xs text-gray-500 truncate hidden md:block">{u.email}</p>
                <p className="text-sm text-gray-600 hidden md:block">{u.department}</p>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                </div>
                <p className="text-xs text-gray-400 hidden md:block">{u.lastLogin || 'Never'}</p>
                <div className="flex gap-1">
                  {u.active ? (
                    <button
                      onClick={() => setConfirmRevoke(u.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      title="Revoke access"
                    >
                      <ShieldOff className="size-3" />
                      <span className="hidden sm:inline">Revoke</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { updateUser(u.id, { active: true }); toast.success('Access restored.'); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 border border-green-200 rounded hover:bg-green-50 transition-colors"
                    >
                      <Shield className="size-3" />
                      <span className="hidden sm:inline">Restore</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Revoke confirm dialog */}
      {confirmRevoke && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm">
            <h3 className="text-gray-900 mb-2">Revoke Access</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to revoke access for <strong>{users.find(u => u.id === confirmRevoke)?.name}</strong>? They will immediately lose access to the system.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRevoke(null)} className="flex-1 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleRevoke(confirmRevoke)} className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">Revoke Access</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
