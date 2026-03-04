import { useState } from "react";
import { Download, Search, Eye, SlidersHorizontal } from "lucide-react";

const ALL_LOGS = [
  { timestamp: "2026-02-26 14:32:15", user: "Maria Santos",    role: "Case Officer",      action: "Create",             module: "VAWC",        details: "Case #2026-001 created",           ip: "192.168.1.45", severity: "Info" },
  { timestamp: "2026-02-26 14:28:03", user: "Pedro Reyes",     role: "Social Worker",     action: "Update",             module: "BCPC",        details: "Child record #BC-445...",          ip: "192.168.1.52", severity: "Info" },
  { timestamp: "2026-02-26 14:15:22", user: "Root Admin",      role: "Root Admin",        action: "Create",             module: "System",      details: "New admin...",                     ip: "192.168.1.1",  severity: "Warning" },
  { timestamp: "2026-02-26 13:42:07", user: "Ana Lopez",       role: "Desk Officer",      action: "Login",              module: "System",      details: "3rd failed attempt -...",          ip: "192.168.1.78", severity: "Critical" },
  { timestamp: "2026-02-26 13:38:00", user: "Admin User",      role: "Admin",             action: "Lock",               module: "System",      details: "Account ana.lopez locked...",      ip: "192.168.1.1",  severity: "Warning" },
  { timestamp: "2026-02-26 13:15:44", user: "Roberto Garcia",  role: "Youth Officer",     action: "View",               module: "FTJS",        details: "Accessed youth records list",      ip: "192.168.1.61", severity: "Info" },
  { timestamp: "2026-02-26 12:58:13", user: "Liza Mendoza",    role: "Event Coordinator", action: "Create",             module: "Operational", details: "Barangay Assembly...",             ip: "192.168.1.44", severity: "Info" },
  { timestamp: "2026-02-26 12:45:19", user: "Root Admin",      role: "Root Admin",        action: "Modify Permissions", module: "System",      details: "Updated VAWC Case...",             ip: "192.168.1.1",  severity: "Warning" },
  { timestamp: "2026-02-26 12:30:05", user: "Maria Santos",    role: "Case Officer",      action: "Delete",             module: "VAWC",        details: "Draft case #2026-000...",          ip: "192.168.1.45", severity: "Warning" },
  { timestamp: "2026-02-26 12:10:44", user: "Juan Dela Cruz",  role: "Blotter Officer",   action: "Update",             module: "Blotter",     details: "Incident report #BL-112 updated",  ip: "192.168.1.33", severity: "Info" },
  { timestamp: "2026-02-26 11:55:30", user: "Elena Reyes",     role: "Clearance Officer", action: "Create",             module: "Clearance",   details: "Clearance #CL-889 issued",         ip: "192.168.1.22", severity: "Info" },
  { timestamp: "2026-02-26 11:40:17", user: "Root Admin",      role: "Root Admin",        action: "Delete",             module: "System",      details: "Removed expired audit logs",       ip: "192.168.1.1",  severity: "Warning" },
  { timestamp: "2026-02-26 11:20:05", user: "Carlos Bautista", role: "Lupong Member",     action: "View",               module: "Lupong",      details: "Accessed mediation record #L-44",  ip: "192.168.1.55", severity: "Info" },
  { timestamp: "2026-02-26 10:58:22", user: "Rosa Villanueva", role: "BCPC Officer",      action: "Update",             module: "BCPC",        details: "Child welfare report updated",     ip: "192.168.1.67", severity: "Info" },
  { timestamp: "2026-02-26 10:35:11", user: "Admin User",      role: "Admin",             action: "Create",             module: "System",      details: "New staff account created",        ip: "192.168.1.1",  severity: "Warning" },
  { timestamp: "2026-02-26 10:10:48", user: "Maria Santos",    role: "Case Officer",      action: "Update",             module: "VAWC",        details: "Case #2026-001 status changed",    ip: "192.168.1.45", severity: "Info" },
  { timestamp: "2026-02-26 09:55:33", user: "Pedro Reyes",     role: "Social Worker",     action: "Login",              module: "System",      details: "Successful login",                 ip: "192.168.1.52", severity: "Info" },
  { timestamp: "2026-02-26 09:40:20", user: "Liza Mendoza",    role: "Event Coordinator", action: "Update",             module: "Operational", details: "Assembly schedule updated",         ip: "192.168.1.44", severity: "Info" },
  { timestamp: "2026-02-26 09:25:07", user: "Root Admin",      role: "Root Admin",        action: "Modify Permissions", module: "System",      details: "BCPC permissions updated",         ip: "192.168.1.1",  severity: "Warning" },
  { timestamp: "2026-02-26 09:10:55", user: "Ana Lopez",       role: "Desk Officer",      action: "View",               module: "Clearance",   details: "Viewed clearance queue",           ip: "192.168.1.78", severity: "Info" },
  { timestamp: "2026-02-26 08:50:30", user: "Roberto Garcia",  role: "Youth Officer",     action: "Create",             module: "FTJS",        details: "Youth program #YP-77 created",     ip: "192.168.1.61", severity: "Info" },
  { timestamp: "2026-02-26 08:30:00", user: "Carlos Bautista", role: "Lupong Member",     action: "Login",              module: "System",      details: "Successful login",                 ip: "192.168.1.55", severity: "Info" },
];

const MODULE_STYLES: Record<string, string> = {
  VAWC:        "bg-blue-100 text-blue-600",
  BCPC:        "bg-teal-100 text-teal-600",
  System:      "bg-gray-100 text-gray-600",
  FTJS:        "bg-cyan-100 text-cyan-600",
  Operational: "bg-pink-100 text-pink-600",
  Blotter:     "bg-orange-100 text-orange-600",
  Clearance:   "bg-green-100 text-green-600",
  Lupong:      "bg-yellow-100 text-yellow-700",
};

const PAGE_SIZE = 10;

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());

  const toggleReveal = (idx: number) => {
    setRevealedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const filtered = ALL_LOGS.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch = !q || log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q);
    const matchAction = actionFilter === "All Actions" || log.action === actionFilter;
    const matchDept = deptFilter === "All Departments" || log.module === deptFilter;
    const matchSeverity = severityFilter === "All Severity" || log.severity === severityFilter;
    return matchSearch && matchAction && matchDept && matchSeverity;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const warnings = ALL_LOGS.filter((l) => l.severity === "Warning").length;
  const critical = ALL_LOGS.filter((l) => l.severity === "Critical").length;

  const resetPage = () => setPage(1);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-400 mt-0.5">Complete system activity trail — all {ALL_LOGS.length} entries</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition shadow-sm">
          <Download className="w-4 h-4" />
          Export All CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Entries", value: ALL_LOGS.length, color: "text-gray-900" },
          { label: "Today",         value: ALL_LOGS.length, color: "text-blue-600" },
          { label: "Warnings",      value: warnings,        color: "text-yellow-500" },
          { label: "Critical",      value: critical,        color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Box */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 pt-4 pb-5 mb-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          FILTERS
        </div>
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              placeholder="Search user, action, or details..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); resetPage(); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Actions</option>
            <option>Login</option>
            <option>Update</option>
            <option>Delete</option>
            <option>Create</option>
            <option>View</option>
            <option>Lock</option>
            <option>Modify Permissions</option>
          </select>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-5 gap-3">
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); resetPage(); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2">
            <option>All Departments</option>
            <option>VAWC</option>
            <option>BCPC</option>
            <option>System</option>
            <option>FTJS</option>
            <option>Operational</option>
            <option>Blotter</option>
            <option>Clearance</option>
            <option>Lupong</option>
          </select>
          <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); resetPage(); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Severity</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100">
              {["Timestamp","User","Role","Action","Module","Details","IP Address","Severity",""].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-300 text-sm">No records found.</td></tr>
            ) : paginated.map((log, i) => {
              const globalIdx = (page - 1) * PAGE_SIZE + i;
              const revealed = revealedRows.has(globalIdx);
              return (
                <tr key={i} className={`border-b border-gray-50 transition-colors ${revealed ? "bg-blue-50/30" : "hover:bg-gray-50"}`}>

                  {/* Timestamp — always visible */}
                  <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{log.timestamp}</td>

                  {/* User */}
                  <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                    {revealed
                      ? log.user
                      : <><span>{log.user.split(" ")[0]} </span><span className="blur-sm select-none text-gray-300">{log.user.split(" ").slice(1).join(" ")}</span></>
                    }
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {revealed
                      ? <span className="text-gray-500">{log.role}</span>
                      : <span className="blur-sm select-none text-gray-300 text-xs pointer-events-none">{"●●●●●●●●●"}</span>
                    }
                  </td>

                  {/* Action — always visible */}
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{log.action}</td>

                  {/* Module — always visible */}
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded ${MODULE_STYLES[log.module] || "bg-purple-100 text-purple-600"}`}>
                      {log.module}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="px-4 py-3.5 max-w-[160px]">
                    {revealed
                      ? <span className="text-gray-500 text-xs">{log.details}</span>
                      : <span className="blur-sm select-none text-gray-300 text-xs pointer-events-none">{"●●●●●●●●●●●●●●●"}</span>
                    }
                  </td>

                  {/* IP Address */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    {revealed
                      ? <span className="text-gray-400">{log.ip}</span>
                      : <span className="blur-sm select-none text-gray-300 pointer-events-none">{log.ip.replace(/\d+$/, "•••")}</span>
                    }
                  </td>

                  {/* Severity — always visible */}
                  <td className="px-4 py-3.5">
                    {log.severity === "Critical" ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Critical
                      </span>
                    ) : log.severity === "Warning" ? (
                      <span className="inline-flex items-center gap-1.5 text-yellow-500 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Info
                      </span>
                    )}
                  </td>

                  {/* Eye toggle */}
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => toggleReveal(globalIdx)}
                      title={revealed ? "Hide details" : "Reveal details"}
                      className={`p-1.5 rounded transition ${revealed ? "bg-blue-100" : "hover:bg-gray-100"}`}
                    >
                      <Eye className={`w-4 h-4 transition ${revealed ? "text-blue-500" : "text-gray-300 hover:text-blue-400"}`} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100">
          <span className="text-sm text-gray-400">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-base">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center rounded text-sm font-medium transition ${p === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-base">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}