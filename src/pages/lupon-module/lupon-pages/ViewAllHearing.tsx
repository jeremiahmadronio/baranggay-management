import { useEffect, useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { HearingDetailView } from "./HearingDetailView";
import {
  getHearingSchedules,
  type HearingScheduleDTO,
  type PageResponse,
} from "../../../service/lupon-api/Hearing";
import { CenteredLoader } from "../../../hooks/LoadingStates";

const TABS = [
  { id: "All", label: "All" },
  { id: "Scheduled", label: "Scheduled" },
  { id: "Completed", label: "Completed" },
  { id: "Cancelled", label: "Cancelled" },
];

export function ViewAllHearings() {
  const [data, setData] = useState<PageResponse<HearingScheduleDTO> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    All: 0,
    Scheduled: 0,
    Completed: 0,
    Cancelled: 0,
  });
  const [detailHearing, setDetailHearing] = useState<HearingScheduleDTO | null>(
    null,
  );

  const fetchTabCounts = async () => {
    try {
      const promises = TABS.map((tab) =>
        getHearingSchedules({ tab: tab.id, page: 1, size: 1 }),
      );
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
        tab: activeTab,
        page: currentPage,
        size: 10,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };
      const response = await getHearingSchedules(params);
      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTabCounts();
    fetchData();
  }, [dateFrom, dateTo, activeTab, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, activeTab]);

  const handleClearDates = () => {
    setDateFrom("");
    setDateTo("");
  };

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
        if (res.content.length > 0) setDetailHearing(res.content[0]);
      });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

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
  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Hearing Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all barangay case hearings.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3 xl:max-w-2xl w-full">
              {/* From */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 pl-1">
                  From
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Divider */}
              <span className="hidden sm:flex items-center justify-center pb-2 text-gray-400 font-medium text-sm select-none">
                —
              </span>

              {/* To */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 pl-1">
                  To
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {hasDateFilter && (
              <div className="flex items-end">
                <button
                  onClick={handleClearDates}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {hasDateFilter && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <span className="text-xs text-gray-500">Filtered:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <CalendarIcon className="h-3 w-3" />
                {dateFrom
                  ? formatDate(dateFrom + "T00:00:00")
                  : "—"} &rarr;{" "}
                {dateTo ? formatDate(dateTo + "T00:00:00") : "—"}
              </span>
            </div>
          )}
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
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2.5 py-0.5 px-2.5 rounded-full text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
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
          <CenteredLoader minHeight="min-h-[400px]" />
        ) : data?.content.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No hearings found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {hasDateFilter
                ? "No hearings match the selected date range. Try adjusting your filter."
                : "Try adjusting your filter criteria to find what you are looking for."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {(() => {
              if (!data?.content) return null;
              let hearings = [...data.content];

              if (activeTab === "All") {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                hearings.sort((a, b) => {
                  const aDate = new Date(a.scheduledStart);
                  const bDate = new Date(b.scheduledStart);
                  const aFuture = aDate >= now;
                  const bFuture = bDate >= now;
                  if (aFuture && !bFuture) return -1;
                  if (!aFuture && bFuture) return 1;
                  const aScheduled = a.status === "SCHEDULED";
                  const bScheduled = b.status === "SCHEDULED";
                  if (aScheduled && !bScheduled) return -1;
                  if (!aScheduled && bScheduled) return 1;
                  return aDate.getTime() - bDate.getTime();
                });
              } else {
                hearings.sort(
                  (a, b) =>
                    new Date(a.scheduledStart).getTime() -
                    new Date(b.scheduledStart).getTime(),
                );
              }

              return hearings.map((hearing) => (
                <div
                  key={hearing.hearingId}
                  className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
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
                        Case:{" "}
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
              ));
            })()}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
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
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? "z-10 bg-blue-50 border-blue-600 text-blue-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
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
