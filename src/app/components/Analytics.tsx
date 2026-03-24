import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { AlertType } from '../types';

type TimeRange = 'week' | 'month' | 'year' | 'all';

const TYPE_COLORS: Record<AlertType, string> = {
  fire: '#ef4444',
  lockdown: '#8b5cf6',
  medical: '#3b82f6',
  behaviour: '#f97316',
  weather: '#0ea5e9',
  maintenance: '#6b7280',
  general: '#9ca3af',
};

export function Analytics() {
  const { incidents } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const threshold = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'week': return new Date(now.getTime() - 7 * 86400000).toISOString();
      case 'month': return new Date(now.getTime() - 30 * 86400000).toISOString();
      case 'year': return new Date(now.getTime() - 365 * 86400000).toISOString();
      default: return '';
    }
  }, [timeRange]);

  const filtered = useMemo(() =>
    incidents.filter(i => i.status !== 'archived' && (!threshold || i.date >= threshold)),
    [incidents, threshold]
  );

  // ID021: Location incident count
  const locationData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(i => { counts[i.location] = (counts[i.location] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([location, count]) => ({ location: location.length > 16 ? location.slice(0, 16) + '…' : location, count }));
  }, [filtered]);

  // ID022: Trend over time by type (monthly)
  const trendData = useMemo(() => {
    const months: Record<string, Record<AlertType, number>> = {};
    filtered.forEach(i => {
      const month = i.date.slice(0, 7); // YYYY-MM
      if (!months[month]) months[month] = { fire: 0, lockdown: 0, medical: 0, behaviour: 0, weather: 0, maintenance: 0, general: 0 };
      months[month][i.type] = (months[month][i.type] || 0) + 1;
    });
    return Object.entries(months).sort().map(([month, types]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      ...types,
    }));
  }, [filtered]);

  // ID024: Type breakdown
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count, color: TYPE_COLORS[type as AlertType] }));
  }, [filtered]);

  // ID004: Response time analysis (mock calculated)
  const responseData = useMemo(() => {
    const byType: Record<string, { total: number; count: number }> = {};
    filtered.filter(i => i.status !== 'triggered').forEach(i => {
      if (!byType[i.type]) byType[i.type] = { total: 0, count: 0 };
      // Mock response times based on priority
      const rt = i.priority === 'critical' ? 3 + Math.random() * 4 : i.priority === 'high' ? 5 + Math.random() * 8 : 10 + Math.random() * 15;
      byType[i.type].total += rt;
      byType[i.type].count += 1;
    });
    return Object.entries(byType).map(([type, { total, count }]) => ({
      type,
      avg: parseFloat((total / count).toFixed(1)),
    }));
  }, [filtered]);

  // ID023: Repeated issues (most common types/locations)
  const repeatedIssues = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const locationCount: Record<string, number> = {};
    filtered.forEach(i => {
      typeCount[i.type] = (typeCount[i.type] || 0) + 1;
      locationCount[i.location] = (locationCount[i.location] || 0) + 1;
    });
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    const topLocation = Object.entries(locationCount).sort((a, b) => b[1] - a[1])[0];
    const unresolved = filtered.filter(i => i.status === 'triggered' || i.status === 'acknowledged').length;
    const followUp = filtered.filter(i => i.requiresFollowUp).length;
    return { topType, topLocation, unresolved, followUp };
  }, [filtered]);

  const statCard = (label: string, value: string | number, note?: string) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl text-gray-900" style={{ fontWeight: 600 }}>{value}</p>
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Incident trends, locations, and response metrics</p>
        </div>
        {/* ID029: Time period filter */}
        <div className="flex gap-1">
          {(['week', 'month', 'year', 'all'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${timeRange === r ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {r === 'week' ? '7 days' : r === 'month' ? '30 days' : r === 'year' ? '12 months' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* ID004: Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCard('Total Incidents', filtered.length)}
        {statCard('Avg Response Time', `${(responseData.reduce((s, r) => s + r.avg, 0) / (responseData.length || 1)).toFixed(1)}m`)}
        {statCard('Critical Incidents', filtered.filter(i => i.priority === 'critical').length, 'Requiring immediate response')}
        {statCard('Follow-up Required', filtered.filter(i => i.requiresFollowUp).length)}
      </div>

      {/* ID023: Repeated issues / operational insights */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <h3 className="text-gray-900 mb-3">Operational Insights</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {repeatedIssues.topType && (
            <div>
              <p className="text-xs text-gray-500">Most frequent type</p>
              <p className="text-gray-800 capitalize" style={{ fontWeight: 500 }}>{repeatedIssues.topType[0]} ({repeatedIssues.topType[1]})</p>
            </div>
          )}
          {repeatedIssues.topLocation && (
            <div>
              <p className="text-xs text-gray-500">Highest-risk location</p>
              <p className="text-gray-800" style={{ fontWeight: 500 }}>{repeatedIssues.topLocation[0]} ({repeatedIssues.topLocation[1]})</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Open / unresolved</p>
            <p className="text-gray-800" style={{ fontWeight: 500 }}>{repeatedIssues.unresolved}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending follow-ups</p>
            <p className="text-gray-800" style={{ fontWeight: 500 }}>{repeatedIssues.followUp}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* ID021: Location chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Incidents by Location</h3>
          {locationData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for selected period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={locationData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="location" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ID024: Type breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 mb-4">Incidents by Type</h3>
          {typeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for selected period</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={typeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {typeData.map(d => (
                  <div key={d.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600 capitalize">{d.type}</span>
                    </div>
                    <span className="text-gray-800" style={{ fontWeight: 500 }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ID022: Trend over time */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h3 className="text-gray-900 mb-4">Incident Trends Over Time</h3>
        {trendData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for selected period</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {(['medical', 'behaviour', 'fire', 'lockdown'] as AlertType[]).map(type => (
                <Line key={type} type="monotone" dataKey={type} stroke={TYPE_COLORS[type]} dot={{ r: 3 }} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ID004: Response time by type */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-gray-900 mb-4">Average Response Time by Type (minutes)</h3>
        {responseData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for selected period</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={responseData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="m" />
              <Tooltip formatter={(v: any) => [`${v}m`, 'Avg response']} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {responseData.map((entry, i) => <Cell key={i} fill={TYPE_COLORS[entry.type as AlertType] || '#6b7280'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
