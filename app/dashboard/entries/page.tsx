'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Entry {
  row: number;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  raffleCode: string;
  messageId: string;
  status: string;
  retry: number;
  lastSendTime: string;
  lastError: string;
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getEntries({
          page,
          pageSize,
          keyword: keyword || undefined,
          status: status || undefined,
        });
        setEntries(data.rows);
        setTotal(data.total);
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [page, pageSize, keyword, status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Registrations</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, company, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-4">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Sent">Sent</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No registrations found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">TIME</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">NAME</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">EMAIL</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">COMPANY</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">PHONE</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">CODE</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">STATUS</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">RETRY</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry) => (
                    <tr key={entry.row} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{entry.name}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{entry.email}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{entry.company}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{entry.phone}</td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {entry.raffleCode}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{entry.retry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex gap-2 items-center transition"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex gap-2 items-center transition"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
