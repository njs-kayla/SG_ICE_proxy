"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useDashboardHeaderActions } from "./dashboard-header-actions-context";

export default function Header() {
  const router = useRouter();
  const { actions } = useDashboardHeaderActions();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            Fastspin SBC Lucky Draw Participants
          </h1>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-end">
          {actions ? <div className="flex justify-end">{actions}</div> : null}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
