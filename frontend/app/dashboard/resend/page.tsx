'use client';

import { useEffect, useState } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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

export default function ResendPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await apiClient.getEntries({
          page: 1,
          pageSize: 100,
          status: 'Failed',
        });
        setEntries(data.rows);
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const handleResend = async (row: number) => {
    setResending(row);
    setMessage('');

    try {
      const result = await apiClient.resendEmail(row);
      if (result.ok) {
        setMessage('✅ Email resent successfully');
        // 重新加載列表
        const data = await apiClient.getEntries({
          page: 1,
          pageSize: 100,
          status: 'Failed',
        });
        setEntries(data.rows);
      } else {
        setMessage(`❌ Failed: ${result.msg}`);
      }
    } catch (error) {
      setMessage('❌ Error sending email');
    } finally {
      setResending(null);
    }
  };

  const handleResendAll = async () => {
    if (!confirm(`Resend email to ${entries.length} recipients?`)) return;

    for (const entry of entries) {
      await handleResend(entry.row);
      await new Promise(resolve => setTimeout(resolve, 500)); // 延遲以避免速率限制
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Resend Email</h1>
        {entries.length > 0 && (
          <button
            onClick={handleResendAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex gap-2 items-center transition"
          >
            <Send size={18} />
            Resend All ({entries.length})
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {message}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <p className="text-gray-600">All emails have been delivered successfully! 🎉</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">NAME</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">EMAIL</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">RAFFLE CODE</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">RETRY</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">LAST ERROR</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.row} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{entry.email}</td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                        {entry.raffleCode}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        {entry.retry}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-red-600 max-w-xs truncate" title={entry.lastError}>
                      {entry.lastError || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleResend(entry.row)}
                        disabled={resending === entry.row}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition flex gap-1 items-center justify-center mx-auto"
                      >
                        {resending === entry.row ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Send
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
