'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, Copy, Check, Send, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Stats {
  total: number;
  success: number;
  pending: number;
  failed: number;
  retry: number;
}

interface Entry {
  row: number;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  raffleCode: string;
  status: string;
  retry: number;
  lastError: string;
}

interface DailyDatum {
  day: string;
  label: string;
  dateKey: string;
  entries: number;
}

const EVENT_DAYS = [
  { day: 'D1', label: 'Sep 29', year: 2026, month: 8, date: 29 },
  { day: 'D2', label: 'Sep 30', year: 2026, month: 8, date: 30 },
  { day: 'D3', label: 'Oct 01', year: 2026, month: 9, date: 1 },
];

function toDateKey(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getStatusClasses(status: string) {
  if (status === 'Sent') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'Failed') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-yellow-100 text-yellow-700';
}

function getStatusLabel(status: string) {
  if (status === 'Sent') {
    return 'Delivered';
  }

  if (status === 'Failed') {
    return 'Failed';
  }

  return 'Pending';
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tableEntries, setTableEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [resendingRow, setResendingRow] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const eventStartDate = new Date(2026, 8, 29); // Sep 29, 2026
  const eventEndDate = new Date(2026, 9, 1); // Oct 1, 2026

  const dailyData: DailyDatum[] = EVENT_DAYS.map((eventDay) => ({
    ...eventDay,
    dateKey: `${eventDay.year}-${String(eventDay.month + 1).padStart(2, '0')}-${String(eventDay.date).padStart(2, '0')}`,
    entries: entries.filter((entry) => toDateKey(entry.createdAt) === `${eventDay.year}-${String(eventDay.month + 1).padStart(2, '0')}-${String(eventDay.date).padStart(2, '0')}`).length,
  }));

  const todayKey = toDateKey(new Date().toISOString());
  const todayIndex = dailyData.findIndex((item) => item.dateKey === todayKey);
  const fallbackIndex = dailyData.reduce((selectedIndex, item, index) => {
    if (item.entries > 0) {
      return index;
    }

    return selectedIndex;
  }, 0);
  const activeDayIndex = todayIndex >= 0 ? todayIndex : fallbackIndex;
  const activeDay = dailyData[activeDayIndex] ?? dailyData[0];
  const previousDay = dailyData[activeDayIndex - 1] ?? null;
  const activeDayDelta = previousDay ? activeDay.entries - previousDay.entries : 0;
  const activeDayCodes = entries
    .filter((entry) => toDateKey(entry.createdAt) === activeDay.dateKey)
    .map((entry) => entry.raffleCode)
    .join('\n');
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const fetchSummaryData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [statsData, entriesData] = await Promise.all([
        apiClient.getStats(),
        apiClient.getAllEntries(),
      ]);
      setStats(statsData);
      setEntries(entriesData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    setTableLoading(true);
    setMessage('');
    try {
      const data = await apiClient.getEntries({
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      setTableEntries(data.rows);
      setTotalEntries(data.total);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch table data:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to fetch participant list');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchSummaryData(), fetchTableData()]);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分鐘刷新一次
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [page, pageSize, keyword, statusFilter]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const handleCopyTodays = () => {
    if (!activeDayCodes) {
      return;
    }

    navigator.clipboard.writeText(activeDayCodes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async (row: number) => {
    setResendingRow(row);
    setMessage('');

    try {
      await apiClient.resendEmail(row);
      setMessage('Email resent successfully.');
      await fetchData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend email');
    } finally {
      setResendingRow(null);
    }
  };

  if (!stats) return <div className="flex items-center justify-center h-full">載入中...</div>;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">SBC Lucky Draw Participants</h1>
          <p className="text-gray-600 mt-2">
            {eventStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {eventEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Last updated {lastUpdated}</span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 hover:bg-gray-100 rounded-lg transition flex gap-2 items-center text-sm font-medium text-gray-700"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => apiClient.exportCsv()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex gap-2 items-center transition"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Participants */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Participants
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">0 duplicates excluded</p>
        </div>

        {/* Active Day Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {todayIndex >= 0 ? `Today • ${activeDay.day}` : `${activeDay.label} • ${activeDay.day}`}
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{activeDay.entries}</p>
          <p className={`text-xs mt-2 ${activeDayDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {previousDay
              ? `${activeDayDelta >= 0 ? '↑' : '↓'} ${Math.abs(activeDayDelta)} compared with ${previousDay.day}`
              : 'First event day'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Daily Breakdown
          </p>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="entries" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Email Delivery */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Email Delivery
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {stats.success} / {stats.total}
          </p>
          <p className="text-xs text-red-600 mt-2">{stats.failed} failed</p>
          <button
            onClick={handleCopyTodays}
            disabled={!activeDayCodes}
            className="mt-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex gap-2 items-center transition"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : `Copy ${activeDay.day} Codes`}
          </button>
        </div>
      </div>

      {/* Daily Breakdown Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="entries" name="Participants" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-gray-900">Lucky Draw Participants</h2>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2 lg:min-w-[360px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search name, email, company..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Search
                </button>
              </form>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setPage(1);
                    setStatusFilter(event.target.value);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Sent">Delivered</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>

                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPage(1);
                    setPageSize(Number(event.target.value));
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">TIME</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">NAME</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">EMAIL</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">COMPANY</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">CODE</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">EMAIL STATUS</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    載入中...
                  </td>
                </tr>
              ) : tableEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    無資料
                  </td>
                </tr>
              ) : (
                tableEntries.map((entry) => (
                  <tr key={entry.row} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-600">{formatTimestamp(entry.createdAt)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{entry.email}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{entry.company || '-'}</td>
                    <td className="px-6 py-4">
                      <code className="px-3 py-1 bg-gray-100 text-gray-700 rounded font-mono text-xs">
                        {entry.raffleCode}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                        {entry.lastError ? (
                          <p className="text-xs text-red-600 max-w-xs truncate" title={entry.lastError}>
                            {entry.lastError}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleResend(entry.row)}
                        disabled={resendingRow === entry.row}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex gap-2 items-center transition"
                      >
                        {resendingRow === entry.row ? (
                          <>
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Resend
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 text-sm text-gray-600 lg:flex-row lg:items-center lg:justify-between">
          <span>
            Showing {totalEntries === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalEntries)} of {totalEntries} participants
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page === 1 || tableLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-medium text-gray-700">
              Page {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              disabled={page === totalPages || tableLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
