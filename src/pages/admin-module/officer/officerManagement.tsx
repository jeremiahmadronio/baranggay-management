import { useCallback, useEffect, useState } from "react";
import {
  ArchiveIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FilterIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import {
  employeeApi,
  EmployeeStatuses,
  type AddEmployeePayload,
  type DepartmentOption,
  type EditEmployeePayload,
  type EmployeeStatus,
  type EmployeeTable,
  type PagedTableParams,
} from "../../../service/admin-module-api/officer";
import { ActionModal } from "../../../reusable";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  StatusUpdateModal,
} from "../../../reusable";
import {
  normalizeStatusLabel,
  prettifyDepartmentName,
  STATUS_OPTIONS,
  STATUS_REASON_OPTIONS,
  STATUS_STYLES,
  type EmployeeModalMode,
  useDebounce,
} from "./officer-shared";
import { OfficerFormModal } from "./officer-form-modal";
import { OfficerProfileView } from "./officer-profile-view";

export function OfficerManagementPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [selectedDept, setSelectedDept] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">(
    "",
  );
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string;
    deptId: number | "";
    status: "" | "ACTIVE" | "INACTIVE";
  }>({
    search: "",
    deptId: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [tableData, setTableData] = useState<EmployeeTable[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<{
    totalEmployees: number;
    activeOfficers: number;
    inactiveStaff: number;
    totalDepartments: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<EmployeeModalMode>("add");
  const [targetEmployee, setTargetEmployee] = useState<EmployeeTable | null>(
    null,
  );
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success");
  const [successMessage, setSuccessMessage] = useState("");

  const activeFilterCount = [selectedDept, statusFilter].filter(Boolean).length;
  const derivedTotalPages = Math.max(
    totalPages,
    Math.ceil(totalItems / pageSize) || 1,
  );
  const shouldShowPagination =
    derivedTotalPages > 1 ||
    (totalItems === 0 && tableData.length >= pageSize) ||
    currentPage > 1;
  const canGoNext =
    currentPage < derivedTotalPages ||
    (totalItems === 0 && tableData.length >= pageSize);

  const getVisiblePages = () => {
    if (derivedTotalPages <= 7) {
      return Array.from({ length: derivedTotalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", derivedTotalPages] as const;
    }

    if (currentPage >= derivedTotalPages - 3) {
      return [
        1,
        "...",
        derivedTotalPages - 4,
        derivedTotalPages - 3,
        derivedTotalPages - 2,
        derivedTotalPages - 1,
        derivedTotalPages,
      ] as const;
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      derivedTotalPages,
    ] as const;
  };

  const loadStatsAndFilters = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, departmentRes] = await Promise.all([
        employeeApi.getStats(),
        employeeApi.getDepartmentOptions(),
      ]);
      setStats(statsRes);
      setDepartments(departmentRes || []);
    } catch (e) {
      console.error("Failed to load officer stats/options:", e);
      setStats(null);
      setDepartments([]);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadTable = useCallback(async () => {
    setLoading(true);
    try {
      const params: PagedTableParams = {
        page: Math.max(currentPage - 1, 0),
        size: pageSize,
        search: appliedFilters.search || undefined,
        deptId:
          appliedFilters.deptId === "" ? undefined : appliedFilters.deptId,
        status:
          appliedFilters.status === "" ? undefined : appliedFilters.status,
      };

      const res = await employeeApi.getPagedTable(params);
      setTableData(res.content || []);
      const nextTotalItems = Math.max(res.totalElements ?? 0, 0);
      const nextTotalPages = Math.max(
        res.totalPages || 0,
        Math.ceil(nextTotalItems / pageSize) || 1,
      );
      setTotalItems(nextTotalItems);
      setTotalPages(nextTotalPages);
    } catch (e) {
      console.error("Failed to load officers table:", e);
      setTableData([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    loadStatsAndFilters();
  }, [loadStatsAndFilters]);

  useEffect(() => {
    setAppliedFilters((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  useEffect(() => {
    const hasReliableMeta = totalItems > 0 || totalPages > 1;
    if (hasReliableMeta && currentPage > derivedTotalPages) {
      setCurrentPage(derivedTotalPages);
    }
  }, [currentPage, derivedTotalPages, totalItems, totalPages]);

  const handleClearFilters = () => {
    setSearch("");
    setSelectedDept("");
    setStatusFilter("");
    setAppliedFilters({
      search: "",
      deptId: "",
      status: "",
    });
    setCurrentPage(1);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      search,
      deptId: selectedDept,
      status: statusFilter,
    });
    setCurrentPage(1);
  };

  const refreshAll = async () => {
    await Promise.all([loadStatsAndFilters(), loadTable()]);
  };

  const handleAddSubmit = async (
    payload: AddEmployeePayload | EditEmployeePayload,
  ) => {
    if (formMode === "add") {
      await employeeApi.hireEmployee(payload as AddEmployeePayload);
      setSuccessTitle("Employee Added!");
      setSuccessMessage("New officer/staff has been successfully added.");
    } else if (targetEmployee) {
      await employeeApi.editEmployee(
        targetEmployee.id,
        payload as EditEmployeePayload,
      );
      setSuccessTitle("Employee Updated!");
      setSuccessMessage(
        `${targetEmployee.fullName} has been successfully updated.`,
      );
    }

    setShowSuccessModal(true);
    await refreshAll();
  };

  const handleArchiveSubmit = async (payload: { reason: string }) => {
    if (!targetEmployee) return;
    await employeeApi.updateStatus(targetEmployee.id, {
      reason: payload.reason,
      newStatus: EmployeeStatuses.ARCHIVED,
    });
    setShowArchiveModal(false);
    setSuccessTitle("Employee Archived!");
    setSuccessMessage(`${targetEmployee.fullName} has been archived.`);
    setShowSuccessModal(true);
    await refreshAll();
  };

  const handleStatusSubmit = async (payload: {
    status?: string;
    reason: string;
  }) => {
    if (!targetEmployee || !payload.status) return;
    await employeeApi.updateStatus(targetEmployee.id, {
      reason: payload.reason,
      newStatus: payload.status as EmployeeStatus,
    });
    setShowStatusModal(false);
    setSuccessTitle("Status Updated!");
    setSuccessMessage(
      `${targetEmployee.fullName} status changed to ${payload.status}.`,
    );
    setShowSuccessModal(true);
    await refreshAll();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {selectedEmployeeId !== null ? (
        <OfficerProfileView
          employeeId={selectedEmployeeId}
          onBack={() => {
            setSelectedEmployeeId(null);
            loadTable();
          }}
          onEdit={(employee) => {
            setTargetEmployee(employee);
            setFormMode("edit");
            setShowFormModal(true);
          }}
          onArchive={(employee) => {
            setTargetEmployee(employee);
            setShowArchiveModal(true);
          }}
          onStatusChange={(employee) => {
            setTargetEmployee(employee);
            setShowStatusModal(true);
          }}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900"></h1>
              <p className="text-sm text-gray-500 mt-1"></p>
            </div>
            <button
              onClick={() => {
                setTargetEmployee(null);
                setFormMode("add");
                setShowFormModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Add Officer
            </button>
          </div>

          <KPIGrid columns={4}>
            <KPICard
              title="Total Employees"
              value={
                statsLoading
                  ? "—"
                  : (stats?.totalEmployees ?? 0).toLocaleString()
              }
              icon={KPIIcons.users}
              color="blue"
              subtitle="All officers and staff"
            />
            <KPICard
              title="Active Officers"
              value={
                statsLoading
                  ? "—"
                  : (stats?.activeOfficers ?? 0).toLocaleString()
              }
              icon={KPIIcons.issued}
              color="emerald"
              subtitle="Currently active"
            />
            <KPICard
              title="Inactive Staff"
              value={
                statsLoading
                  ? "—"
                  : (stats?.inactiveStaff ?? 0).toLocaleString()
              }
              icon={KPIIcons.gift}
              color="amber"
              subtitle="Archived / inactive personnel"
            />
            <KPICard
              title="Departments"
              value={
                statsLoading
                  ? "—"
                  : (stats?.totalDepartments ?? 0).toLocaleString()
              }
              icon={KPIIcons.home}
              color="violet"
              subtitle="Configured departments"
            />
          </KPIGrid>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by first name or lastname"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2">
                <select
                  value={selectedDept}
                  onChange={(e) =>
                    setSelectedDept(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      (e.target.value as "" | "ACTIVE" | "INACTIVE") || "",
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <button
                  onClick={handleApplyFilter}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  <FilterIcon className="w-4 h-4" />
                  Apply
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-blue-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Active Cases
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 bg-gray-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No officers found.
                      </td>
                    </tr>
                  ) : (
                    tableData.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                              {item.fullName
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "OF"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">
                                {item.fullName}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-700">
                            {prettifyDepartmentName(item.departmentName)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {item.position || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-gray-700">
                            {`${item.activeCases ?? 0} ${(item.activeCases ?? 0) === 1 ? "case" : "cases"}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {(() => {
                            const statusLabel = normalizeStatusLabel(
                              item.status,
                            );
                            return (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[statusLabel]}`}
                              >
                                {statusLabel}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedEmployeeId(item.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTargetEmployee(item);
                                setFormMode("edit");
                                setShowFormModal(true);
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTargetEmployee(item);
                                setShowArchiveModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <ArchiveIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {shouldShowPagination && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
                  employees
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {getVisiblePages().map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-sm text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-9 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => {
                        if (derivedTotalPages > 1) {
                          return Math.min(prev + 1, derivedTotalPages);
                        }
                        return prev + 1;
                      });
                    }}
                    disabled={!canGoNext}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <OfficerFormModal
        isOpen={showFormModal}
        mode={formMode}
        departments={departments}
        targetEmployee={targetEmployee}
        onClose={() => {
          setShowFormModal(false);
          setTargetEmployee(null);
        }}
        onSubmit={handleAddSubmit}
      />

      {targetEmployee && (
        <StatusUpdateModal
          isOpen={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false);
            setTargetEmployee(null);
          }}
          title="Archive Officer / Staff"
          mode="reason-only"
          subjectName={targetEmployee.fullName}
          subjectLabel="employee"
          submitLabel="Archive"
          onSubmit={(payload) =>
            handleArchiveSubmit({ reason: payload.reason })
          }
        />
      )}

      {targetEmployee && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setTargetEmployee(null);
          }}
          title="Update Employee Status"
          mode="status-and-reason"
          subjectName={targetEmployee.fullName}
          subjectLabel="employee"
          statusOptions={STATUS_OPTIONS}
          reasonOptions={STATUS_REASON_OPTIONS}
          initialStatus={normalizeStatusLabel(targetEmployee.status)}
          submitLabel="Update"
          onSubmit={handleStatusSubmit}
        />
      )}

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        type="success"
      >
        {successMessage}
      </ActionModal>
    </div>
  );
}

export default OfficerManagementPage;
