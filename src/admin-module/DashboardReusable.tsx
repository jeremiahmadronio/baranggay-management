import {  InputField, ModuleBadge } from '../reusable/RecentSystemActions';

export default function AdminPage() {
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen font-sans">
     
      {/* SECTION B: Audit Logs base sa image_7af4d8.png format */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Recent System Actions</h1>
            <p className="text-xs text-gray-400">Last 5 activities across all modules</p>
          </div>
          <button className="text-blue-600 text-xs font-bold hover:underline">View All →</button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Module</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            <tr className="hover:bg-gray-50/30 transition-colors">
              <td className="px-6 py-4 text-gray-500 font-mono text-xs">2026-02-21 14:32:15</td>
              <td className="px-6 py-4 font-bold text-gray-700">Maria Santos</td>
              <td className="px-6 py-4 text-gray-600">Created new case</td>
              <td className="px-6 py-4"><ModuleBadge label="VAWC" type="VAWC" /></td>
            </tr>
            <tr className="hover:bg-gray-50/30 transition-colors">
              <td className="px-6 py-4 text-gray-500 font-mono text-xs">2026-02-21 14:28:03</td>
              <td className="px-6 py-4 font-bold text-gray-700">Pedro Reyes</td>
              <td className="px-6 py-4 text-gray-600">Updated case status</td>
              <td className="px-6 py-4"><ModuleBadge label="BCPC" type="BCPC" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}