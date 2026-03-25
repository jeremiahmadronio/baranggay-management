import { useEffect, useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
 
  HashIcon,
} from "lucide-react";
import { Badge } from "../lupong-tagapamayapa-module/ui/Badge";
import { Button } from "../lupong-tagapamayapa-module/ui/Button";
import { HearingDetailView } from "./HearingDetailView";
import {
  getHearingSchedules,
  type HearingScheduleDTO,
  type PageResponse,
} from "../lupong-tagapamayapa-api/Hearing";

const TABS = [
  {
    id: "All",
    label: "All",
  },
  {
    id: "Scheduled",
    label: "Scheduled",
  },
  {
    id: "Completed",
    label: "Completed",
  },
  {
    id: "Postponed",
    label: "Postponed",
  },
  {
    id: "Cancelled",
    label: "Cancelled",
  },
];
export function ViewAllHearings() {
  const [data, setData] = useState<PageResponse<HearingScheduleDTO> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    All: 0,
    Scheduled: 0,
    Completed: 0,
    Postponed: 0,
    Cancelled: 0,
  });
  const [detailHearing, setDetailHearing] = useState<HearingScheduleDTO | null>(
    null,
  );
  // Calendar removed
  const fetchTabCounts = async () => {
    try {
      const promises = TABS.map((tab) => {
        const params: any = {
          tab: tab.id,
          page: 1,
          size: 1,
        };
        return getHearingSchedules(params);
      });
      const results = await Promise.all(promises);
      const newCounts: Record<string, number> = {};
      TABS.forEach((tab, index) => {
        newCounts[tab.id] = results[index].page.totalElements;
      });
      setTabCounts(newCounts);
    } catch (error) {
      console.error("Failed to fetch tab counts:", error);
    }
  };
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        search: searchTerm,
        tab: activeTab,
        page: currentPage,
        size: 10,
      };
      const response = await getHearingSchedules(params);
      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  // Removed fetchMonthlyData and getAllHearingsForMonth usage

  // Calendar removed
  useEffect(() => {
    fetchTabCounts();
    fetchData();
  }, [searchTerm, activeTab, currentPage]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);
  const handleStatusSuccess = () => {
    fetchData();
    fetchTabCounts();
    if (detailHearing) {
      getHearingSchedules({
        search: detailHearing.blotterNumber,
        tab: "All",
        page: 1,
        size: 1,
      }).then((res) => {
        if (res.content.length > 0) {
          setDetailHearing(res.content[0]);
        }
      });
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // Calendar removed
  if (detailHearing) {
    return (
      <HearingDetailView
        hearing={detailHearing}
        onBack={() => setDetailHearing(null)}
        onSuccess={handleStatusSuccess}
      />
    );
  }
  const totalElements = data?.page.totalElements ?? 0;
  const totalPages = data?.page.totalPages ?? 0;
  const pageNumber = data?.page.number ?? 0;
  const pageSize = data?.page.size ?? 10;
  const isFirst = pageNumber === 0;
  const isLast = pageNumber >= totalPages - 1;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Hearing Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all barangay case hearings.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search cases, names, blotter no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                {tab.label}
                <span
                  className={`ml-2.5 py-0.5 px-2.5 rounded-full text-xs font-semibold transition-colors ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {tabCounts[tab.id] ?? 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* List */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
            <p className="text-sm text-gray-500">Loading hearings...</p>
          </div>
        ) : data?.content.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No hearings found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {
                "Try adjusting your search or filter criteria to find what you are looking for."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data?.content.map((hearing) => (
              <div
                key={hearing.hearingId}
                className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                {/* Date & Time */}
                <div className="flex flex-col sm:w-48 flex-shrink-0 gap-2">
                  <div className="flex items-center text-gray-900 font-semibold">
                    <CalendarIcon className="h-4 w-4 mr-2.5 text-blue-600 flex-shrink-0" />
                    {formatDate(hearing.scheduledStart)}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <ClockIcon className="h-4 w-4 mr-2.5 flex-shrink-0 text-gray-400" />
                    {formatTime(hearing.scheduledStart)}
                    {hearing.scheduledEnd && (
                      <span className="ml-1 text-gray-400">
                        – {formatTime(hearing.scheduledEnd)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Case Info */}
                <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
                  <div className="flex items-center flex-wrap gap-2.5 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {hearing.complainantName}{" "}
                      <span className="text-gray-400 font-normal text-sm mx-1">
                        vs
                      </span>{" "}
                      {hearing.respondentName}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {hearing.casePhase}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <HashIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      Ref:{" "}
                      <span className="font-medium text-gray-700 ml-1">
                        {hearing.blotterNumber}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{hearing.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:w-40 flex-shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <Badge status={hearing.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailHearing(hearing)}
                    className="w-full sm:w-auto"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{pageNumber * pageSize + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min((pageNumber + 1) * pageSize, totalElements)}
              </span>{" "}
              of <span className="font-medium">{totalElements}</span> results
            </p>
            <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={isFirst}
                className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                // Simple pagination logic to not show too many pages
                if (
                  totalPages > 7 &&
                  i !== 0 &&
                  i !== totalPages - 1 &&
                  Math.abs(i - pageNumber) > 1
                ) {
                  if (Math.abs(i - pageNumber) === 2)
                    return (
                      <span
                        key={i}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  return null;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${currentPage === i + 1 ? "z-10 bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={isLast}
                className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>

          {/* Mobile Pagination */}
          <div className="flex items-center justify-between w-full sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={isFirst}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {pageNumber + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={isLast}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
