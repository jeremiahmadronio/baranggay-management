import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  WidthType,
  LevelFormat,
  UnderlineType,
  Table,
  TableRow,
  TableCell,
} from "docx";
import type { CFAResponse } from "../../../service/lupon-api/CFA";

const TAGALOG_MONTHS = [
  "ENERO",
  "PEBRERO",
  "MARSO",
  "ABRIL",
  "MAYO",
  "HUNYO",
  "HULYO",
  "AGOSTO",
  "SETYEMBRE",
  "OKTUBRE",
  "NOBYEMBRE",
  "DISYEMBRE",
];

function formatCFADate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: TAGALOG_MONTHS[d.getMonth()],
    year: d.getFullYear(),
  };
}

const FONT = "Times New Roman";
const HP = (pt: number) => pt * 2;

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
} as const;
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
} as const;

function run(
  text: string,
  opts: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    size?: number;
  } = {},
): TextRun {
  return new TextRun({
    text,
    bold: opts.bold ?? false,
    italics: opts.italic ?? false,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
    size: HP(opts.size ?? 11),
    font: FONT,
  });
}

function para(
  children: TextRun[],
  opts: {
    align?: any;
    spaceBefore?: number;
    spaceAfter?: number;
    borderBottom?: boolean;
    indent?: { left?: number; hanging?: number };
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: {
      before: opts.spaceBefore ?? 0,
      after: opts.spaceAfter ?? 0,
      line: 276,
    },
    border: opts.borderBottom
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "000000",
            space: 1,
          },
        }
      : undefined,
    indent: opts.indent,
    children,
  });
}

const spacer = () =>
  new Paragraph({ children: [], spacing: { after: 0, before: 0, line: 276 } });

export async function downloadCFAasWord(data: CFAResponse): Promise<void> {
  const { day, month, year } = formatCFADate(data.issuedAt);

  const COL_W = 4860;
  const INNER = 360;
  const SEC_LEFT_W = 6200;
  const SEC_RIGHT_W = 3520;

  const sigTable = new Table({
    width: { size: COL_W * 2, type: WidthType.DXA },
    columnWidths: [COL_W, COL_W],
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS,
            width: { size: COL_W, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 0, right: INNER },
            children: [
              para(
                [
                  run(data.luponChairman.toUpperCase(), {
                    bold: true,
                    size: 10,
                  }),
                ],
                { align: AlignmentType.CENTER },
              ),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 360, after: 60, line: 276 },
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000",
                    space: 1,
                  },
                },
                children: [new TextRun({ text: "", size: HP(4) })],
              }),
              para([run(data.chairmanPosition, { size: 9 })], {
                align: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            borders: NO_BORDERS,
            width: { size: COL_W, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: INNER, right: 0 },
            children: [
              para(
                [run(data.luponMember.toUpperCase(), { bold: true, size: 10 })],
                { align: AlignmentType.CENTER },
              ),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 360, after: 60, line: 276 },
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000",
                    space: 1,
                  },
                },
                children: [new TextRun({ text: "", size: HP(4) })],
              }),
              para([run(data.memberPosition, { size: 9 })], {
                align: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const secretaryTable = new Table({
    width: { size: COL_W * 2, type: WidthType.DXA },
    columnWidths: [SEC_LEFT_W, SEC_RIGHT_W],
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS,
            width: { size: SEC_LEFT_W, type: WidthType.DXA },
            children: [spacer()],
          }),
          new TableCell({
            borders: NO_BORDERS,
            width: { size: SEC_RIGHT_W, type: WidthType.DXA },
            children: [
              para([run(data.luponSecretary.toUpperCase(), { bold: true })], {
                align: AlignmentType.CENTER,
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60, line: 276 },
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000",
                    space: 1,
                  },
                },
                children: [new TextRun({ text: "", size: HP(4) })],
              }),
              para([run(data.secretaryPosition, { size: 10 })], {
                align: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const wordDoc = new Document({
    numbering: {
      config: [
        {
          reference: "cfa-items",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                  spacing: { line: 276, after: 120 },
                },
                run: { font: FONT, size: HP(11) },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1440 },
          },
        },
        children: [
          para([run("Tanggapan ng Sangguniang Barangay", { size: 9 })], {
            align: AlignmentType.CENTER,
          }),
          para([run("BARANGAY UGONG", { bold: true, size: 20 })], {
            align: AlignmentType.CENTER,
          }),
          para([run("Valenzuela City, Metro Manila", { size: 10 })], {
            align: AlignmentType.CENTER,
            borderBottom: true,
            spaceAfter: 200,
          }),

          para(
            [
              run(`Usaping Barangay Blg: ${data.controlNumber}`, {
                bold: true,
              }),
            ],
            { align: AlignmentType.RIGHT },
          ),
          para(
            [
              run(`Usaping Inihain: ${data.matterFiled.toUpperCase()}`, {
                bold: true,
              }),
            ],
            { align: AlignmentType.RIGHT, spaceAfter: 240 },
          ),

          para([
            run(data.complinantName.toUpperCase(), {
              bold: true,
              underline: true,
            }),
          ]),
          para([
            run(data.complinantAddress.toUpperCase(), { underline: true }),
          ]),
          para([run("(Mga) May Sumbong", { italic: true })], {
            spaceAfter: 160,
          }),

          para([run("Laban kay/kina:")]),
          para([
            run(data.respondentName.toUpperCase(), {
              bold: true,
              underline: true,
            }),
          ]),
          para([
            run(data.respondentAddress.toUpperCase(), { underline: true }),
          ]),
          para([run("(Mga) Ipinagsumbong", { italic: true })], {
            spaceAfter: 280,
          }),

          para(
            [run("KATIBAYAN PARA MAKAPAGDEMANDA", { bold: true, size: 13 })],
            { align: AlignmentType.CENTER },
          ),
          para(
            [run("(Certificate to File Action)", { bold: true, size: 11 })],
            { align: AlignmentType.CENTER, spaceAfter: 200 },
          ),

          para([run("Pinatunayan na:", { bold: true })], { spaceAfter: 120 }),

          new Paragraph({
            numbering: { reference: "cfa-items", level: 0 },
            spacing: { after: 120, line: 276 },
            children: [
              run(
                "Dumalo ang magkabilang panig sa Punong Barangay at nagbigay ng kanya kanyang salaysay ngunit walang naganap na pagkakasundo.",
              ),
            ],
          }),
          new Paragraph({
            numbering: { reference: "cfa-items", level: 0 },
            spacing: { after: 120, line: 276 },
            children: [run(data.grounds)],
          }),
          new Paragraph({
            numbering: { reference: "cfa-items", level: 0 },
            spacing: { after: 0, line: 276 },
            children: [
              run(
                "Dahil dito, ang kaukulang demanda para sa usaping ito ay maaari nang idulog sa hukuman o alin mang mataas na tanggapan ng pamahalaan.",
              ),
            ],
          }),

          spacer(),
          spacer(),

          new Paragraph({
            spacing: { after: 0, line: 276 },
            children: [
              run("Ngayong "),
              run(`Ika \u2013 ${day}`, { bold: true, underline: true }),
              run(" ng "),
              run(` ${month} `, { bold: true, underline: true }),
              run(" taong "),
              run(` ${year}`, { bold: true, underline: true }),
            ],
          }),

          spacer(),
          spacer(),

          secretaryTable,

          new Paragraph({ spacing: { after: 280, line: 276 }, children: [] }),

          para([run("Pinatunayan:", { bold: true })], { spaceAfter: 280 }),

          sigTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `CFA_${data.blotterNumber}.docx`,
  });
  a.click();
  URL.revokeObjectURL(url);
}
