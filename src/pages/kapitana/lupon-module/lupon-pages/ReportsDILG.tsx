import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Download,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  getMonthlyDilgReport,
  type LuponMonthlyReportDTO,
} from "../../../../service/lupon-api/LuponReport";
import { useKapitanaMockData } from "../../mock/kapitana-mock-flag";
import { mockLuponMonthlyDilg } from "../../mock/lupon-kapitana-mock";
import { TableFilter } from "../../../../hooks/TableFilter";
import { CenteredLoader } from "../../../../hooks/LoadingStates";
import { exportToWord } from "../lib/ReportExport";
const ROWS_PER_PAGE = 10;
const MONTHS = Array.from(
  {
    length: 12,
  },
  (_, i) => ({
    value: String(i + 1),
    label: new Date(0, i).toLocaleString("default", {
      month: "long",
    }),
  }),
);
const YEARS = [2022, 2023, 2024, 2025, 2026].map((y) => ({
  value: String(y),
  label: String(y),
}));
export function MonthlyReportPage() {
  const navigate = useNavigate();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportYear, setReportYear] = useState(currentYear);
  const [monthlyReport, setMonthlyReport] = useState<LuponMonthlyReportDTO[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const fetchMonthlyReport = async () => {
    setIsLoading(true);
    try {
      const data = useKapitanaMockData()
        ? mockLuponMonthlyDilg(reportMonth, reportYear)
        : await getMonthlyDilgReport(reportMonth, reportYear);
      setMonthlyReport(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching monthly report:", err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchMonthlyReport();
  }, [reportMonth, reportYear]);

  const formatDateRange = () => {
    const monthName = new Date(0, reportMonth - 1)
      .toLocaleString("default", {
        month: "short",
      })
      .toUpperCase();
    const lastDay = new Date(reportYear, reportMonth, 0).getDate();
    return {
      startDate: `${monthName}.01-${lastDay},${reportYear}`,
      endDate: `${monthName}.01-${lastDay},${reportYear}`,
    };
  };
  const handleExportWord = async () => {
    try {
      await exportToWord({
        month: reportMonth,
        year: reportYear,
        data: monthlyReport,
      });
    } catch (err) {
      console.error("Error exporting to Word:", err);
      alert("Failed to export document. Please try again.");
    }
  };
  const totalPages = Math.ceil(monthlyReport.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentRows = monthlyReport.slice(startIndex, endIndex);
  const dateRange = formatDateRange();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CenteredLoader minHeight="min-h-screen" />
      </div>
    );
  }
  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: landscape; 
            margin: 0.5in; 
          }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
          }
          .no-print { display: none !important; }
          .print-only { display: table-row !important; }
          .print-header { display: flex !important; }
          table { 
            page-break-inside: auto; 
            border-collapse: collapse;
            width: 100%;
          }
          tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          th, td {
            font-size: 8px !important;
            padding: 2px 4px !important;
          }
        }
        @media screen {
          .print-header { display: none; }
          .print-only { display: none; }
        }
      `}</style>

      <div className="min-h-screen p-4 md:p-8 font-sans text-gray-900">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Navigation Header */}
          <div className="no-print flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportWord}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export to Word
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="no-print">
            <TableFilter
              showSearch={false}
              showClearButton={false}
              filterButtonText="Apply"
              filters={[
                {
                  label: "Month",
                  key: "month",
                  value: String(reportMonth),
                  options: MONTHS,
                },
                {
                  label: "Year",
                  key: "year",
                  value: String(reportYear),
                  options: YEARS,
                },
              ]}
              onFilterChange={(key, value) => {
                if (key === "month") setReportMonth(Number(value));
                if (key === "year") setReportYear(Number(value));
              }}
              onFilterClick={fetchMonthlyReport}
            />
          </div>

          {/* Report Container */}
          <div
            id="printable-report"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Print-only header */}
            <div className="print-header p-6 border-b-2 border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <img
                    src="https://cdn.magicpatterns.com/uploads/pESsakdtCLvUXwLyEgPnhe/image.png"
                    alt="Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="text-[9px] leading-tight">
                    <p className="font-bold">NATIONAL CAPITAL REGION (NCR)</p>
                    <p className="font-semibold">CITY OF VALENZUELA</p>
                    <p className="font-semibold">BARANGAY UGONG</p>
                  </div>
                </div>
                <div className="text-center flex-1 px-4">
                  <h1 className="text-[11px] font-bold mb-1">
                    LUPON TAGAPAMAYAPA REPORT: CASES FILED, ACTION TAKEN
                  </h1>
                  <h2 className="text-[10px] font-bold">
                    AND PROBLEMS ENCOUNTERED ON KATARUNGANG PAMBARANGAY
                    IMPLEMENTATION
                  </h2>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-[9px] text-right leading-tight">
                    <p className="font-semibold">
                      REPORTING PERIOD: {dateRange.startDate}
                    </p>
                    <p className="font-semibold">
                      CALENDAR PERIOD: {dateRange.endDate}
                    </p>
                    <p className="font-semibold">
                      DATE ACCOMPLISHED:{" "}
                      {new Date()
                        .toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })
                        .toUpperCase()}
                    </p>
                  </div>
                  <img
                    src="https://cdn.magicpatterns.com/uploads/gjWketUJuqfe4XsW2MSZon/image.png"
                    alt="Seal"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Screen header */}
            <div className="no-print p-5 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Monthly DILG Report
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(0, reportMonth - 1).toLocaleString("default", {
                      month: "long",
                    })}{" "}
                    {reportYear} - {monthlyReport.length} total cases
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-[10px]">
                <thead>
                  <tr className="border-b-2 border-gray-800 bg-gray-100">
                    <th
                      rowSpan={2}
                      className="border border-gray-400 px-2 py-2 text-center font-bold text-[9px]"
                    >
                      DATE FILED
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-gray-400 px-2 py-2 text-center font-bold text-[9px]"
                    >
                      CASE
                      <br />
                      NO.
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-gray-400 px-3 py-2 text-center font-bold text-[9px] min-w-[200px]"
                    >
                      COMPLAINANT VS RESPONDENT
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-gray-400 px-3 py-2 text-center font-bold text-[9px] min-w-[200px]"
                    >
                      COMPLAINT
                    </th>
                    <th
                      colSpan={4}
                      className="border border-gray-400 px-2 py-1 text-center font-bold text-[9px] bg-blue-50"
                    >
                      NATURE OF CASES
                    </th>
                    <th
                      colSpan={4}
                      className="border border-gray-400 px-2 py-1 text-center font-bold text-[9px] bg-emerald-50"
                    >
                      SETTLED CASES
                    </th>
                    <th
                      colSpan={6}
                      className="border border-gray-400 px-2 py-1 text-center font-bold text-[9px] bg-amber-50"
                    >
                      UNSETTLED CASES
                    </th>
                  </tr>
                  <tr className="border-b-2 border-gray-800 bg-gray-50">
                    {["CRIMINAL", "CIVIL", "OTHERS", "TOTAL"].map((h) => (
                      <th
                        key={h}
                        className="border border-gray-400 px-1 py-1 text-center font-semibold text-[8px] bg-blue-50"
                      >
                        {h}
                      </th>
                    ))}
                    {["MEDIATION", "CONCILIATION", "ARBITRATION", "TOTAL"].map(
                      (h) => (
                        <th
                          key={h}
                          className="border border-gray-400 px-1 py-1 text-center font-semibold text-[8px] bg-emerald-50"
                        >
                          {h}
                        </th>
                      ),
                    )}
                    {[
                      "REPUDIATED",
                      "ON GOING",
                      "WITHDRAWN",
                      "DISMISSED",
                      "ISSUE CFA",
                      "REFFED",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border border-gray-400 px-1 py-1 text-center font-semibold text-[8px] bg-amber-50"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.length === 0 ? (
                    <tr>
                      <td
                        colSpan={20}
                        className="border border-gray-300 px-4 py-12 text-center text-gray-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-gray-300" />
                          <p>
                            No reports found for the selected month and year.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Screen rows (paginated) */}
                      {currentRows.map((row, idx) => {
                        const natureCasesTotal =
                          row.isCriminal + row.isCivil + row.isOthers;
                        const settledTotal =
                          row.mediation + row.conciliation + row.arbitration;
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors no-print"
                          >
                            <td className="border border-gray-300 px-2 py-2 text-center whitespace-nowrap text-[10px]">
                              {new Date(row.dateFiled).toLocaleDateString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-medium whitespace-nowrap text-[10px]">
                              {row.caseNo}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-left text-[10px]">
                              {row.parties}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-left text-[10px]">
                              {row.complaint}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.isCriminal || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.isCivil || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.isOthers || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-[10px] bg-blue-50">
                              {natureCasesTotal || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.mediation || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.conciliation || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.arbitration || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-[10px] bg-emerald-50">
                              {settledTotal || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]"></td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.ongoing || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.withdrawn || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.dismissed || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]">
                              {row.issueCFA || ""}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-[10px]"></td>
                          </tr>
                        );
                      })}

                      {/* Print rows (all data) */}
                      {monthlyReport.map((row, idx) => {
                        const natureCasesTotal =
                          row.isCriminal + row.isCivil + row.isOthers;
                        const settledTotal =
                          row.mediation + row.conciliation + row.arbitration;
                        return (
                          <tr
                            key={`print-${idx}`}
                            className="print-only"
                            style={{
                              display: "none",
                            }}
                          >
                            <td className="border border-gray-400 px-1 py-1 text-center whitespace-nowrap text-[8px]">
                              {new Date(row.dateFiled).toLocaleDateString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center font-medium whitespace-nowrap text-[8px]">
                              {row.caseNo}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-left text-[8px]">
                              {row.parties}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-left text-[8px]">
                              {row.complaint}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.isCriminal || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.isCivil || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.isOthers || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center font-semibold text-[8px]">
                              {natureCasesTotal || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.mediation || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.conciliation || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.arbitration || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center font-semibold text-[8px]">
                              {settledTotal || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]"></td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.ongoing || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.withdrawn || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.dismissed || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]">
                              {row.issueCFA || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-[8px]"></td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {monthlyReport.length > ROWS_PER_PAGE && (
              <div className="no-print p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, monthlyReport.length)} of{" "}
                  {monthlyReport.length} cases
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="text-sm text-gray-600 px-3">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
