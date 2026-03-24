import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Search, Download, ChevronRight, Archive, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AlertType, Priority, IncidentStatus } from '../types';
import { TypeBadge, PriorityBadge, StatusBadge } from './shared/Badges';

type TimeRange = 'all' | 'day' | 'week' | 'month' | 'year';

function getDateThreshold(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case 'day': return new Date(now.getTime() - 86400000).toISOString();
    case 'week': return new Date(now.getTime() - 7 * 86400000).toISOString();
    case 'month': return new Date(now.getTime() - 30 * 86400000).toISOString();
    case 'year': return new Date(now.getTime() - 365 * 86400000).toISOString();
    default: return '';
  }
}

export function IncidentLog() {
  const { incidents, archiveResolved } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const threshold = getDateThreshold(timeRange);
    return incidents.filter(i => {
      if (tab === 'archived' && i.status !== 'archived') return false;
      if (tab === 'active' && i.status === 'archived') return false;
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (threshold && i.date < threshold) return false;
      if (search) {
        const q = search.toLowerCase();
        return i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.triggeredByName.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [incidents, tab, typeFilter, priorityFilter, statusFilter, timeRange, search]);

  // ID030: export as CSV
  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Priority', 'Status', 'Title', 'Location', 'Timestamp', 'Triggered By', 'Assigned To', 'Device', 'External Notified', 'Follow-up Required'];
    const rows = filtered.map(i => [
      i.id, i.type, i.priority, i.status, `"${i.title}"`, i.location, i.timestamp,
      i.triggeredByName, i.assignedToName || '', i.device,
      i.externalNotified ? 'Yes' : 'No', i.requiresFollowUp ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = incidents.filter(i => i.status !== 'archived').length;
  const archivedCount = incidents.filter(i => i.status === 'archived').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">Incident Log</h1>
          <p className="text-sm text-gray-500">All recorded safety incidents and their lifecycle status</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={archiveResolved}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Archive className="size-4" />
            <span className="hidden sm:inline">Archive Resolved</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${tab === 'active' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Active <span className="ml-1 text-xs opacity-70">{activeCount}</span>
        </button>
        <button
          onClick={() => setTab('archived')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${tab === 'archived' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Archived <span className="ml-1 text-xs opacity-70">{archivedCount}</span>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, location, ID, or person…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-600'}`}
          >
            <Filter className="size-4" />
            Filters
          </button>
        </div>

        {/* ID029: Time range filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'day', 'week', 'month', 'year'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${timeRange === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {r === 'all' ? 'All time' : r === 'day' ? 'Last 24h' : r === 'week' ? 'Last 7 days' : r === 'month' ? 'Last 30 days' : 'Last year'}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Alert type</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                <option value="all">All types</option>
                <option value="fire">Fire</option>
                <option value="lockdown">Lockdown</option>
                <option value="medical">Medical</option>
                <option value="behaviour">Behaviour</option>
                <option value="weather">Weather</option>
                <option value="maintenance">Maintenance</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                <option value="all">All priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                <option value="all">All statuses</option>
                <option value="triggered">Triggered</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-3">{filtered.length} incident{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No incidents match your filters.</div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_110px_90px_110px_100px_40px] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
              <span>ID</span>
              <span>Incident</span>
              <span>Type</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Date</span>
              <span />
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map(i => (
                <div
                  key={i.id}
                  onClick={() => navigate(`/incidents/${i.id}`)}
                  className="grid grid-cols-1 md:grid-cols-[80px_1fr_110px_90px_110px_100px_40px] gap-2 md:gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors items-center"
                >
                  <span className="text-xs text-gray-400 font-mono">{i.id}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{i.title}</p>
                    <p className="text-xs text-gray-400">{i.location} · {i.triggeredByName}</p>
                    {i.unacknowledgedFlag && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Unacknowledged</span>}
                    {i.requiresFollowUp && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Follow-up</span>}
                  </div>
                  <div className="md:block flex items-center gap-2"><TypeBadge type={i.type} /></div>
                  <div><PriorityBadge priority={i.priority} /></div>
                  <div><StatusBadge status={i.status} /></div>
                  <span className="text-xs text-gray-400 hidden md:block">{i.date.split('T')[0]}</span>
                  <ChevronRight className="size-4 text-gray-400 hidden md:block" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
