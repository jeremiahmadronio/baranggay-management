import { useCallback, useEffect, useState, useRef } from "react";
import {
  SearchIcon,
  FilterIcon,
  EyeIcon,
  PencilIcon,
  ArchiveIcon,
  CheckIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";
import { KPICard, KPIGrid, KPIIcons } from "../../../reusable/KPICard";
import { ActionModal } from "../../../reusable/SuccessModal";
import { ResidentsView } from "./ResidentsView";
import { AddResidentsModal } from "./AddResidentsModal";
import { EditResidentsModal } from "./EditResidentsModal";
import { UpdateStatusModal } from "./UpdateStatusModal";
import { StatusUpdateModal } from "../../../reusable";
import {
  getResidentTable,
  getResidentProfile,
  getResidentStats,
  addResident,
  updateResident,
  updateResidentStatus,
} from "../../../service/admin-module-api/ResidentsManagement";
import type {
  ResidentSummary,
  ResidentStatsDTO,
  AddResidentRequest,
  UpdateResidentRequest,
} from "../../../service/admin-module-api/ResidentsManagement";
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
export function ResidentsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [isVoter, setIsVoter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    gender: "",
    isVoter: "",
  });
  const debouncedSearch = useDebounce(search);
  const [data, setData] = useState<ResidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [stats, setStats] = useState<ResidentStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success!");
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedResident, setSelectedResident] =
    useState<ResidentSummary | null>(null);

  const normalizeResidentStatus = (status?: string | null) =>
    String(status || "")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, "_");

  const fetchData = useCallback(
    async (
      params: { search: string; gender: string; isVoter: string },
      resetPage = true,
    ) => {
      setLoading(true);
      try {
        const result = await getResidentTable({
          search: params.search || undefined,
          gender: params.gender || undefined,
          isVoter:
            params.isVoter !== "" ? params.isVoter === "true" : undefined,
        });
        setData(
          (result || []).filter(
            (resident) => normalizeResidentStatus(resident.status) === "ACTIVE",
          ),
        );
        if (resetPage) {
          setCurrentPage(1);
        }
      } catch (e) {
        console.error("Failed to fetch residents:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const nextStats = await getResidentStats();
      setStats(nextStats);
    } catch (e) {
      console.error("Failed to fetch resident stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData(appliedFilters);
  }, []);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const next = {
      ...appliedFilters,
      search: debouncedSearch,
    };
    setAppliedFilters(next);
    fetchData(next);
  }, [debouncedSearch]);
  const handleApplyFilter = () => {
    const next = {
      search,
      gender,
      isVoter,
    };
    setAppliedFilters(next);
    fetchData(next);
  };
  const handleClearFilter = () => {
    const cleared = {
      search: "",
      gender: "",
      isVoter: "",
    };
    setSearch("");
    setGender("");
    setIsVoter("");
    setAppliedFilters(cleared);
    fetchData(cleared);
  };
  const activeFilterCount = [gender, isVoter].filter(Boolean).length;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = data.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const normalizePhotoSrc = (value?: string | null) => {
    if (!value) return "";
    if (value.startsWith("data:") || value.startsWith("http")) return value;
    return `data:image/jpeg;base64,${value}`;
  };

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages] as const;
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ] as const;
  };
  const handleAddResident = async (formData: AddResidentRequest) => {
    await addResident(formData);
    setSuccessTitle("Resident Added!");
    setSuccessMessage("Resident successfully added!");
    setShowSuccessModal(true);
    fetchData(appliedFilters);
    loadStats();
  };
  const handleEditResident = async (formData: UpdateResidentRequest) => {
    if (!selectedResident) return;
    await updateResident(selectedResident.residentId, formData);
    setSuccessTitle("Resident Updated!");
    setSuccessMessage("Resident successfully updated!");
    setShowSuccessModal(true);
    fetchData(appliedFilters);
    loadStats();
  };

  const handleArchive = (resident: ResidentSummary) => {
    setSelectedResident(resident);
    setShowArchiveModal(true);
  };

  const handleArchiveSubmit = async (payload: {
    status?: string;
    reason: string;
  }) => {
    if (!selectedResident) return;
    try {
      await updateResidentStatus(selectedResident.residentId, {
        status: "ARCHIVED",
        reason: payload.reason,
      });
      setSuccessTitle("Resident Archived!");
      setSuccessMessage(
        `${selectedResident.fullName} has been successfully archived.`,
      );
      setShowArchiveModal(false);
      setSelectedResident(null);
      setShowSuccessModal(true);
      fetchData(appliedFilters);
      loadStats();
    } catch (e: any) {
      console.error("Failed to archive resident:", e);
    }
  };

  if (selectedId !== null) {
    return (
      <ResidentsView
        residentId={selectedId}
        onBack={() => setSelectedId(null)}
        fetchProfile={getResidentProfile}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"></h1>
            <p className="text-sm text-gray-500 mt-1"></p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4" />
            Add Resident
          </button>
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="New Residents"
            value={
              statsLoading ? "—" : (stats?.totalResidents ?? 0).toLocaleString()
            }
            icon={KPIIcons["users"]}
            color="blue"
            subtitle={`Registered this ${new Date().toLocaleString("default", { month: "long" })}`}
          />
          <KPICard
            title="Registered Voters"
            value={
              statsLoading ? "—" : (stats?.totalVoters ?? 0).toLocaleString()
            }
            icon={KPIIcons["issued"]}
            color="emerald"
            subtitle="Active voter registrants"
          />
          <KPICard
            title="Senior Citizens"
            value={
              statsLoading
                ? "—"
                : (stats?.totalSeniorCitizen ?? 0).toLocaleString()
            }
            icon={KPIIcons["gift"]}
            color="amber"
            subtitle="Residents aged 60 and above"
          />
          <KPICard
            title="Heads of Family"
            value={
              statsLoading
                ? "—"
                : (stats?.headsOfTheFamily ?? 0).toLocaleString()
            }
            icon={KPIIcons["home"]}
            color="violet"
            subtitle="Registered household heads"
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
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select
                value={isVoter}
                onChange={(e) => setIsVoter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              >
                <option value="">All Voters</option>
                <option value="true">Registered Voter</option>
                <option value="false">Non-voter</option>
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
                  onClick={handleClearFilter}
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
                    Brgy. ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Household
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Voter
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
                  Array.from({
                    length: ITEMS_PER_PAGE,
                  }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-6 bg-gray-200 rounded-full mx-auto"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No residents found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => (
                    <tr
                      key={item.residentId}
                      className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.barangayIdNumber ? (
                          item.barangayIdNumber
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            No ID
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {normalizePhotoSrc(item.photo) ? (
                            <img
                              src={normalizePhotoSrc(item.photo)}
                              alt={item.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                              {item.fullName
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "R"}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">
                            {item.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">
                          {item.contactNumber || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-gray-600">
                          {item.householdNumber || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.isVoter ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                            <CheckIcon className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                            <XIcon className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : item.status === "ARCHIVED"
                                ? "bg-red-100 text-red-600"
                                : item.status === "INACTIVE"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedId(item.residentId)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedResident(item);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleArchive(item)}
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

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                {totalItems} residents
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddResidentsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddResident}
      />

      {selectedResident && (
        <>
          <EditResidentsModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedResident(null);
            }}
            residentId={selectedResident.residentId}
            fetchProfile={getResidentProfile}
            onSubmit={handleEditResident}
          />

          <UpdateStatusModal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setSelectedResident(null);
            }}
            residentName={selectedResident.fullName}
            onSubmit={(status, reason, reasonDetail) => {
              console.log("Status updated to:", status);
              console.log("Reason:", reason);
              if (reasonDetail) {
                console.log("Reason detail:", reasonDetail);
              }
            }}
          />
        </>
      )}

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successTitle}
        type="success"
      >
        {successMessage}
      </ActionModal>

      {selectedResident && (
        <StatusUpdateModal
          isOpen={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false);
            setSelectedResident(null);
          }}
          title="Archive Resident"
          mode="reason-only"
          subjectName={selectedResident.fullName}
          subjectLabel="resident"
          submitLabel="Archive Resident"
          onSubmit={handleArchiveSubmit}
        />
      )}
    </div>
  );
}
