import React from 'react';

// --- Types ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  iconWrapperClass: string;
  icon: React.ReactNode;
}

interface ActivityCardProps {
  label: string;
  count: number;
  percentage: string;
  level: 1 | 2 | 3 | 4; // 1 (Lightest) to 4 (Darkest)
}

// --- Components ---
const StatCard = ({ title, value, subtitle, iconWrapperClass, icon }: StatCardProps) => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h2 className="text-2xl font-bold text-slate-800 mt-1">{value}</h2>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
    <div className={`p-2.5 rounded-full ${iconWrapperClass}`}>{icon}</div>
  </div>
);

const ActivityCard = ({ label, count, percentage, level }: ActivityCardProps) => {
  const bgColors = {
    1: "bg-blue-100 text-blue-700",
    2: "bg-blue-400 text-white",
    3: "bg-blue-500 text-white",
    4: "bg-blue-600 text-white",
  };

  return (
    <div className={`p-4 rounded-lg flex flex-col justify-between min-h-[110px] ${bgColors[level]}`}>
      <div>
        <p className="text-[10px] font-bold opacity-80">{label}</p>
        <h3 className="text-2xl font-bold mt-1">{count}</h3>
      </div>
      <p className="text-[10px] font-medium mt-4 border-t border-white/20 pt-2">{percentage}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const activities: ActivityCardProps[] = [
    { label: "VAWC", count: 245, percentage: "23.0%", level: 4 },
    { label: "BLOTTER", count: 189, percentage: "17.7%", level: 3 },
    { label: "BCPC", count: 156, percentage: "14.6%", level: 2 },
    { label: "FTJS", count: 98, percentage: "9.2%", level: 1 },
    { label: "CLEARANCE", count: 312, percentage: "29.2%", level: 4 },
    { label: "LUPON", count: 67, percentage: "6.3%", level: 1 },
  ];

  const recentActions = [
    { id: 1, timestamp: "2026-02-21 14:32:15", user: "Maria Santos", action: "Created new case", module: "VAWC", color: "bg-purple-100 text-purple-600" },
    { id: 2, timestamp: "2026-02-21 13:10:04", user: "John Doe", action: "Updated record", module: "BLOTTER", color: "bg-blue-100 text-blue-600" },
    { id: 3, timestamp: "2026-02-21 11:45:22", user: "Ana Reyes", action: "Deleted entry", module: "BCPC", color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="p-6 lg:p-10 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of certificate issuance and activities</p>
        </div>

        {/* 1. Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Staff" value="47" subtitle="Active accounts" iconWrapperClass="bg-blue-50 text-blue-500" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
          <StatCard title="Active Sessions" value="23" subtitle="Currently online" iconWrapperClass="bg-green-50 text-green-500" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
          <StatCard title="Security Alerts" value="3" subtitle="Require attention" iconWrapperClass="bg-red-50 text-red-500" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
          <StatCard title="Total Audit Entries" value="1,247" subtitle="This month" iconWrapperClass="bg-purple-50 text-purple-500" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        </div>

        {/* 2. Activity Overview Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold">Activity Overview</h2>
              <p className="text-xs text-slate-400">System usage across departments</p>
            </div>
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              1067 Total
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {activities.map((act, i) => (
              <ActivityCard key={i} {...act} />
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Activity Level:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((l) => (
                  <div key={l} className={`w-3 h-3 rounded-sm ${l === 1 ? 'bg-blue-100' : l === 2 ? 'bg-blue-400' : l === 3 ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
                ))}
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 italic">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> Last 30 days
            </div>
          </div>
        </div>

        {/* 3. Recent System Actions Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Recent System Actions</h2>
              <p className="text-xs text-slate-400">Last 5 activities across all modules</p>
            </div>
            <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
              View All <span>&rarr;</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-y border-slate-100">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3 text-right md:text-left">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentActions.map((row) => (
                  <tr key={row.id} className="text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">{row.timestamp}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{row.user}</td>
                    <td className="px-6 py-4">{row.action}</td>
                    <td className="px-6 py-4 text-right md:text-left">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${row.color}`}>
                        {row.module}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}