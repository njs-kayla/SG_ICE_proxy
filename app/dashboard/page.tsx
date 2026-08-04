"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw,
  Download,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock-data";
import { useDashboardHeaderActions } from "../../components/dashboard-header-actions-context";

interface Stats {
  total: number;
  success: number;
  pending: number;
  failed: number;
}

interface Entry {
  row: number;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  raffleCode: string;
  status: string;
}

interface DailyDatum {
  day: string;
  label: string;
  dateKey: string;
  entries: number;
}

const EVENT_DAYS = [
  { day: "D1", label: "Sep 29", year: 2026, month: 8, date: 29 },
  { day: "D2", label: "Sep 30", year: 2026, month: 8, date: 30 },
  { day: "D3", label: "Oct 01", year: 2026, month: 9, date: 1 },
];

function toDateKey(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    year: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusClasses(status: string) {
  if (status === "Sent") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Failed") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

function getStatusLabel(status: string) {
  if (status === "Sent") {
    return "Successful";
  }

  if (status === "Failed") {
    return "Failed";
  }

  return "Failed";
}

export default function DashboardPage() {
  const mockMode = isMockMode();
  const { setActions } = useDashboardHeaderActions();
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const eventStartDate = new Date(2026, 8, 29); // Sep 29, 2026
  const eventEndDate = new Date(2026, 9, 1); // Oct 1, 2026

  const dailyData: DailyDatum[] = EVENT_DAYS.map((eventDay) => ({
    ...eventDay,
    dateKey: `${eventDay.year}-${String(eventDay.month + 1).padStart(2, "0")}-${String(eventDay.date).padStart(2, "0")}`,
    entries: entries.filter(
      (entry) =>
        toDateKey(entry.createdAt) ===
        `${eventDay.year}-${String(eventDay.month + 1).padStart(2, "0")}-${String(eventDay.date).padStart(2, "0")}`,
    ).length,
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
  const selectedDayIndex = dateFilter
    ? dailyData.findIndex((item) => item.dateKey === dateFilter)
    : activeDayIndex;
  const activeDay = dailyData[selectedDayIndex] ?? dailyData[activeDayIndex] ?? dailyData[0];
  const previousDay = selectedDayIndex > 0 ? dailyData[selectedDayIndex - 1] ?? null : null;
  const activeDayDelta = previousDay
    ? activeDay.entries - previousDay.entries
    : 0;
  const visibleEntries = dateFilter
    ? entries.filter((entry) => toDateKey(entry.createdAt) === activeDay.dateKey)
    : entries;
  const activeDayCodes = visibleEntries
    .map((entry) => entry.raffleCode)
    .join(", ");
  const tableEntries = visibleEntries;

  const fetchSummaryData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [statsData, entriesData] = await Promise.all([
        apiClient.getStats(),
        apiClient.getAllEntries(),
      ]);
      setStats(statsData);
      setEntries(entriesData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
    const interval = setInterval(fetchSummaryData, 600000); // 10分鐘刷新一次
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActions(
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-gray-500">Last updated {lastUpdated}</span>
        <button
          onClick={fetchSummaryData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
          onClick={() => apiClient.exportCsv()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          <Download size={18} />
          <span className="text-sm">Export CSV</span>
        </button>
      </div>,
    );

    return () => setActions(null);
  }, [lastUpdated, loading, setActions]);

  const handleCopyTodays = () => {
    if (!activeDayCodes) {
      return;
    }

    navigator.clipboard.writeText(activeDayCodes);
    setCopied(true);
    setTimeout(() => setCopied(false), 10000);
  };

  if (!stats)
    return (
      <div className="flex items-center justify-center h-full">Loading ...</div>
    );

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {mockMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Local mock mode is active. The dashboard is showing fake participant
          data and local-only actions.
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Participants */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Participants
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">0 duplicates excluded</p>
        </div>

        {/* Active Day Stats */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {todayIndex >= 0
              ? `Today • ${activeDay.day}`
              : `${activeDay.label} • ${activeDay.day}`}
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {activeDay.entries}
          </p>
          <p
            className={`text-xs mt-2 ${activeDayDelta >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {previousDay
              ? `${activeDayDelta >= 0 ? "↑" : "↓"} ${Math.abs(activeDayDelta)} compared with ${previousDay.day}`
              : "First event day"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-end text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Daily Breakdown
          </p>
          <div className="mt-2 w-full">
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={dailyData}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                />
                <Tooltip />
                <Bar
                  dataKey="entries"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  minPointSize={5}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Email Delivery */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Email Delivery
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {stats.success} / {stats.total}
          </p>
          <p className="text-xs text-red-600 mt-2">{stats.failed} failed</p>
        </div>
      </div>

      {/* Recent Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value);
                    }}
                    className="appearance-none rounded-lg border border-gray-300 py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Dates</option>
                    {EVENT_DAYS.map((eventDay) => {
                      const dateKey = `${eventDay.year}-${String(eventDay.month + 1).padStart(2, "0")}-${String(eventDay.date).padStart(2, "0")}`;

                      return (
                        <option key={dateKey} value={dateKey}>
                          {eventDay.day} - {eventDay.label}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                { dateFilter && (
                  <button
                  onClick={handleCopyTodays}
                  disabled={!activeDayCodes}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex gap-2 items-center transition"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : dateFilter ? `Copy ${activeDay.day} Codes` : "Copy All Codes"}
                  <span className="px-2 bg-blue-600 text-white rounded-lg">
                    {tableEntries.length}
                  </span>
                </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-40 whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                  TIME
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  NAME
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  COMPANY
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  CODE
                </th>
                <th className="w-40 whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-700">
                  EMAIL STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    載入中...
                  </td>
                </tr>
              ) : tableEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    無資料
                  </td>
                </tr>
              ) : (
                tableEntries.map((entry) => (
                  <tr key={entry.row} className="hover:bg-gray-50 transition">
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 font-medium">
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {entry.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {entry.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {entry.company || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-3 py-1 font-bold bg-gray-100 text-gray-700 rounded">
                        {entry.raffleCode}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${getStatusClasses(entry.status)}`}
                      >
                        {getStatusLabel(entry.status)}
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
