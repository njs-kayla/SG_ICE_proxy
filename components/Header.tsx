'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">SBC Lucky Draw Participants</h1>
        </div>
        
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex gap-2 items-center transition font-medium text-sm"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}
