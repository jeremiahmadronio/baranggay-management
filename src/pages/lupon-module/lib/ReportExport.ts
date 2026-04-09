import type { LuponMonthlyReportDTO } from "../../../service/lupon-api/LuponReport";

interface ExportOptions {
  month: number;
  year: number;
  data: LuponMonthlyReportDTO[];
}

function getMonthName(month: number): string {
  return new Date(0, month - 1).toLocaleString("default", { month: "long" });
}

function formatDateRange(month: number, year: number) {
  const monthName = getMonthName(month);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startDate: `${monthName} 01, ${year}`,
    endDate: `${monthName} ${lastDay}, ${year}`,
  };
}

export function exportToWord({ month, year, data }: ExportOptions) {
  const dateRange = formatDateRange(month, year);
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lupon Report ${getMonthName(month)} ${year}</title>
  <style>
    @page { size: landscape; margin: 0.5in; }
    body { font-family: Arial, sans-serif; font-size: 10px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 14px; margin: 5px 0; font-weight: bold; }
    .header h2 { font-size: 12px; margin: 5px 0; font-weight: bold; }
    .header p { margin: 3px 0; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 10px; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .nature-header { background-color: #dbeafe; }
    .settled-header { background-color: #d1fae5; }
    .unsettled-header { background-color: #fef3c7; }
    td.left-align { text-align: left; }
  </style>
</head>
<body>
  <div class="header">
    <h1>LUPON TAGAPAMAYAPA REPORT</h1>
    <h2>CASES FILED, ACTION TAKEN AND PROBLEMS ENCOUNTERED ON KATARUNGANG PAMBARANGAY IMPLEMENTATION</h2>
    <p>REPORTING PERIOD: ${dateRange.startDate.toUpperCase()}</p>
    <p>CALENDAR PERIOD: ${dateRange.startDate.toUpperCase()}</p>
    <p>DATE ACCOMPLISHED: ${today.toUpperCase()}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th rowspan="2">DATE FILED</th>
        <th rowspan="2">CASE NO.</th>
        <th rowspan="2">COMPLAINANT VS RESPONDENT</th>
        <th rowspan="2">COMPLAINT</th>
        <th colspan="4" class="nature-header">NATURE OF CASES</th>
        <th colspan="4" class="settled-header">SETTLED CASES</th>
        <th colspan="6" class="unsettled-header">UNSETTLED CASES</th>
      </tr>
      <tr>
        <th class="nature-header">CRIMINAL</th>
        <th class="nature-header">CIVIL</th>
        <th class="nature-header">OTHERS</th>
        <th class="nature-header">TOTAL</th>
        <th class="settled-header">MEDIATION</th>
        <th class="settled-header">CONCILIATION</th>
        <th class="settled-header">ARBITRATION</th>
        <th class="settled-header">TOTAL</th>
        <th class="unsettled-header">REPUDIATED</th>
        <th class="unsettled-header">ON MEDIATION</th>
        <th class="unsettled-header">WITHDRAWN</th>
        <th class="unsettled-header">DISMISSED</th>
        <th class="unsettled-header">ISSUE CFA</th>
        <th class="unsettled-header">REFFED</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .map((row) => {
          const natureCasesTotal = row.isCriminal + row.isCivil + row.isOthers;
          const settledTotal =
            row.mediation + row.conciliation + row.arbitration;
          return `
        <tr>
          <td>${new Date(row.dateFiled).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}</td>
          <td>${row.caseNo}</td>
          <td class="left-align">${row.parties}</td>
          <td class="left-align">${row.complaint}</td>
          <td>${row.isCriminal || ""}</td>
          <td>${row.isCivil || ""}</td>
          <td>${row.isOthers || ""}</td>
          <td><strong>${natureCasesTotal || ""}</strong></td>
          <td>${row.mediation || ""}</td>
          <td>${row.conciliation || ""}</td>
          <td>${row.arbitration || ""}</td>
          <td><strong>${settledTotal || ""}</strong></td>
          <td></td>
          <td>${row.ongoing || ""}</td>
          <td>${row.withdrawn || ""}</td>
          <td>${row.dismissed || ""}</td>
          <td>${row.issueCFA || ""}</td>
          <td></td>
        </tr>
        `;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>
  `;

  // Create blob and download as .doc file (opens in Word)
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Lupon_Report_${getMonthName(month)}_${year}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
