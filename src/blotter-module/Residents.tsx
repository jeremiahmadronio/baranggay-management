import { useEffect, useState, useCallback, useRef } from "react";
import { Table } from "../reusable/Table";
import type { TableColumn } from "../reusable/Table";
import { TableFilter } from "../reusable/TableFilter";
import { ResidentProfilePage } from "./ResidentView";
import {
  getResidentTable,
  getResidentProfile,
  getResidentStats,
} from "../blotter-api/Resident";
import type {
  ResidentSummary,
  ResidentStatsDTO,
} from "../blotter-api/Resident";
import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ResidentListPage() {
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

  const fetchData = useCallback(
    async (params: { search: string; gender: string; isVoter: string }) => {
      setLoading(true);
      try {
        const result = await getResidentTable({
          search: params.search || undefined,
          gender: params.gender || undefined,
          isVoter:
            params.isVoter !== "" ? params.isVoter === "true" : undefined,
        });
        setData(result);
        setCurrentPage(1);
      } catch (e) {
        console.error("Failed to fetch residents:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(appliedFilters);
  }, []);

  useEffect(() => {
    getResidentStats()
      .then(setStats)
      .catch((e) => console.error("Failed to fetch resident stats:", e))
      .finally(() => setStatsLoading(false));
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const next = { ...appliedFilters, search: debouncedSearch };
    setAppliedFilters(next);
    fetchData(next);
  }, [debouncedSearch]);

  const handleApplyFilter = () => {
    const next = { search, gender, isVoter };
    setAppliedFilters(next);
    fetchData(next);
  };

  const handleClearFilter = () => {
    const cleared = { search: "", gender: "", isVoter: "" };
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

  const COLUMNS: TableColumn<ResidentSummary>[] = [
    {
      key: "barangayIdNumber",
      header: "Brgy. ID",
      width: "200px",
      render: (item) =>
        item.barangayIdNumber ? (
          <span className="font-mono text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
            {item.barangayIdNumber}
          </span>
        ) : (
          <span className="text-gray-400 text-xs italic">No ID</span>
        ),
    },
    {
      key: "fullName",
      header: "Full Name",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.photo ? (
            <img
              src={item.photo}
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
          <span className="font-medium text-gray-800">{item.fullName}</span>
        </div>
      ),
    },
    {
      key: "contactNumber",
      header: "Contact",
      render: (item) => (
        <span className="text-gray-600">{item.contactNumber || "—"}</span>
      ),
    },
    {
      key: "householdNumber",
      header: "Household",
      align: "center",
      render: (item) => (
        <span className="text-gray-600">{item.householdNumber || "—"}</span>
      ),
    },
    {
      key: "isVoter",
      header: "Voter",
      align: "center",
      width: "80px",
      render: (item) =>
        item.isVoter ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "180px",
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(item.residentId);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
        >
          View
        </button>
      ),
    },
  ];

  if (selectedId !== null) {
    return (
      <ResidentProfilePage
        residentId={selectedId}
        onBack={() => setSelectedId(null)}
        fetchProfile={getResidentProfile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Stats — KPI Cards */}
        <KPIGrid columns={4}>
          <KPICard
            title="Total Residents"
            value={
              statsLoading ? "—" : (stats?.totalResidents ?? 0).toLocaleString()
            }
            icon={KPIIcons["users"]}
            color="blue"
            subtitle="All registered residents"
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

        {/* Filters */}
        <TableFilter
          searchPlaceholder="Search by name, ID, contact..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              label: "Gender",
              key: "gender",
              value: gender,
              options: [
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ],
            },
            {
              label: "Voter Status",
              key: "isVoter",
              value: isVoter,
              options: [
                { value: "true", label: "Registered Voter" },
                { value: "false", label: "Non-voter" },
              ],
            },
          ]}
          onFilterChange={(key, value) => {
            if (key === "gender") setGender(value);
            if (key === "isVoter") setIsVoter(value);
          }}
          onFilterClick={handleApplyFilter}
          onClearClick={handleClearFilter}
          filterButtonText="Apply"
          clearButtonText="Clear"
          activeFilterCount={activeFilterCount}
        />

        {/* Table */}
        <Table<ResidentSummary>
          columns={COLUMNS}
          data={paginatedData}
          keyExtractor={(item) => item.residentId}
          loading={loading}
          emptyMessage="No residents found matching your filters."
          hoverable
          striped
          minRows={10}
          onRowClick={(item) => setSelectedId(item.residentId)}
          pagination={
            totalPages > 1
              ? {
                  currentPage,
                  totalPages,
                  totalItems,
                  itemsPerPage: ITEMS_PER_PAGE,
                  onPageChange: setCurrentPage,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
