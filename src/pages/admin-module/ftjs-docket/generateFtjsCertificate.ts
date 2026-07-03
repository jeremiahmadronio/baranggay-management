import { jsPDF } from "jspdf";

type FtjsCertificateData = {
  fullName: string;
  age?: number | null;
  address: string;
  purpose: string;
  dateIssued: Date;
};

const BARANGAY_NAME = "Barangay Ugong";
const CITY_NAME = "Valenzuela City";
const VENUE = "3S Center Barangay Ugong Valenzuela City";
const PUNONG_BARANGAY = "Hon. MARICEL PINEDA-EMPERADOR";
const BARANGAY_SECRETARY = "MS. JOYCES KRISHA TAN";

function formatDayWithOrdinal(day: number) {
  const remainderTen = day % 10;
  const remainderHundred = day % 100;

  if (remainderTen === 1 && remainderHundred !== 11) return `${day}st`;
  if (remainderTen === 2 && remainderHundred !== 12) return `${day}nd`;
  if (remainderTen === 3 && remainderHundred !== 13) return `${day}rd`;
  return `${day}th`;
}

function formatLongMonth(date: Date) {
  return date.toLocaleDateString("en-PH", { month: "long" }).toUpperCase();
}

function formatFullName(fullName: string) {
  return fullName
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function buildIntroLine(data: FtjsCertificateData) {
  const agePart = typeof data.age === "number" && Number.isFinite(data.age)
    ? `, ${data.age} years old`
    : "";

  return `This is to certify that ${formatFullName(data.fullName)}${agePart} is a bona fide resident of ${data.address.toUpperCase()}, BARANGAY UGONG, CITY OF VALENZUELA, and is a qualified beneficiary under Republic Act No. 11261, otherwise known as the First Time Jobseekers Assistance Act of 2019.`;
}

export function generateFtjsCertificate(data: FtjsCertificateData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const marginLeft = 26;
  const marginRight = 26;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const paragraphs = [
    buildIntroLine(data),
    "This Office further certifies that the bearer has been duly informed of the rights, duties, and responsibilities provided under Republic Act No. 11261 through the Oath of Undertaking executed in the presence of the proper Barangay Official.",
    `This certification is issued upon the request of the above-named individual for ${data.purpose} and for whatever lawful purpose it may serve.`,
    `Issued this ${formatDayWithOrdinal(data.dateIssued.getDate())} day of ${formatLongMonth(data.dateIssued)} ${data.dateIssued.getFullYear()} at ${VENUE}.`,
  ];

  let y = 32;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Republic of the Philippines", centerX, y, { align: "center" });
  y += 5;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(BARANGAY_NAME.toUpperCase(), centerX, y, { align: "center" });
  y += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(CITY_NAME.toUpperCase(), centerX, y, { align: "center" });

  y += 18;
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("CERTIFICATION", centerX, y, { align: "center" });
  doc.line(centerX - 22, y + 1.5, centerX + 22, y + 1.5);

  y += 18;
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  paragraphs.forEach((paragraph, index) => {
    const lines = doc.splitTextToSize(paragraph, contentWidth);
    doc.text(lines, marginLeft, y);
    y += lines.length * 6.2 + (index === paragraphs.length - 1 ? 0 : 10);
  });

  y += 26;
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text(PUNONG_BARANGAY, pageWidth - marginRight, y, { align: "right" });
  y += 9;
  doc.text("Punong Barangay", pageWidth - marginRight, y, { align: "right" });
  y += 18;
  doc.text(BARANGAY_SECRETARY, pageWidth - marginRight, y, { align: "right" });
  y += 9;
  doc.text("Barangay Secretary", pageWidth - marginRight, y, { align: "right" });

  const printableDoc = doc as jsPDF & { autoPrint: () => void };
  printableDoc.autoPrint();

  const previewUrl = doc.output("bloburl");
  const previewWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");

  if (!previewWindow) {
    doc.save(`FTJS_Certificate_${formatFullName(data.fullName).replace(/\s+/g, "_")}.pdf`);
  }
}