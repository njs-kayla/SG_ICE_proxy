'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getMockToken, isMockMode } from '@/lib/mock-data';
import Logo from './dark.png';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mockMode = isMockMode();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mockMode) {
        localStorage.setItem('token', getMockToken());
        router.push('/dashboard');
        return;
      }

      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await axios.post(`${baseURL}/api/auth`, { password });

      if (response.data.ok && response.data.token) {
        localStorage.setItem('token', response.data.token);
        router.push('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={Logo.src} className='w-72' alt="Logo"/>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SBC 2026</h1>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
          </div>

          {mockMode && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Local preview mode is using fake participant data and bypassing API authentication.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} className="flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type={mockMode ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mockMode ? 'Any text is fine in local mock mode' : 'Enter admin password'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex gap-2 items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  {mockMode ? 'Enter Demo Dashboard' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-xs text-gray-500">
            Secure Admin Panel • Password Protected
          </div>
        </div>
      </div>
    </div>
  );
}
