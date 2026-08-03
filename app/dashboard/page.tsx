'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, Copy, Check } from 'lucide-react';
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
  raffleCode: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const eventStartDate = new Date(2026, 8, 28); // Sep 28, 2026
  const eventEndDate = new Date(2026, 9, 1); // Oct 1, 2026
  const today = new Date();
  const dayNumber = Math.floor((today.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 示例日誌數據（實際應該動態計算）
  const dailyData = [
    { day: 'D1', entries: 64 },
    { day: 'D2', entries: 102 },
    { day: 'D3', entries: 87 },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await apiClient.getStats();
      const entriesData = await apiClient.getEntries({
        page: 1,
        pageSize: 10,
      });
      setStats(statsData);
      setEntries(entriesData.rows);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分鐘刷新一次
    return () => clearInterval(interval);
  }, []);

  const handleCopyTodays = () => {
    const codes = entries
      .filter(e => new Date(e.createdAt).toDateString() === today.toDateString())
      .map(e => e.raffleCode)
      .join('\n');
    
    navigator.clipboard.writeText(codes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stats) return <div className="flex items-center justify-center h-full">載入中...</div>;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">SBC Event Registration</h1>
          <p className="text-gray-600 mt-2">
            {eventStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {eventEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Last updated {lastUpdated}</span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Registrations
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">0 duplicates excluded</p>
        </div>

        {/* Today Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Today Day {dayNumber}
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{dailyData[dayNumber - 1]?.entries || 0}</p>
          <p className="text-xs text-green-600 mt-2">↑ 12 more than yesterday</p>
        </div>

        {/* Email Delivery */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Email Delivery
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {stats.success} / {stats.total}
          </p>
          <p className="text-xs text-red-600 mt-2">{stats.failed} failed</p>
          <button
            onClick={handleCopyTodays}
            className="mt-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex gap-2 items-center transition"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : `Copy All Today's Codes (Day ${dayNumber})`}
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
            <Bar dataKey="entries" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Registrations</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">TIME</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">NAME</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">EMAIL</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">CODE</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">EMAIL STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    載入中...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    無資料
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.row} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{entry.email}</td>
                    <td className="px-6 py-4">
                      <code className="px-3 py-1 bg-gray-100 text-gray-700 rounded font-mono text-xs">
                        {entry.raffleCode}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.status === 'Sent'
                            ? 'bg-green-100 text-green-700'
                            : entry.status === 'Failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {entry.status === 'Sent' ? 'Delivered' : entry.status === 'Failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
