import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { CaseViewDTO, DisplayCFADTO } from '../../../service/vawc-api/vawc-api';

const FONT = 'Times New Roman';
const HP = (pt: number) => pt * 2;

function formatLetterDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function run(
  text: string,
  opts: { bold?: boolean; italic?: boolean; size?: number; allCaps?: boolean } = {},
): TextRun {
  return new TextRun({
    text: opts.allCaps ? text.toUpperCase() : text,
    bold: opts.bold ?? false,
    italics: opts.italic ?? false,
    size: HP(opts.size ?? 11),
    font: FONT,
  });
}

function para(
  children: TextRun[],
  opts: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceBefore?: number;
    spaceAfter?: number;
    borderBottom?: boolean;
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
            size: 8,
            color: '64748B',
            space: 1,
          },
        }
      : undefined,
    children,
  });
}

function buildVictimSentence(data: DisplayCFADTO, caseData?: CaseViewDTO): string {
  const age = caseData?.age ? `, ${caseData.age} years old,` : ',';
  const address = data.complainantAddress || caseData?.completeAddress || 'address not available';
  return `This is to formally refer to your good office the case of ${data.complainantName}${age} residing at ${address}.`;
}

function buildIncidentSentence(data: DisplayCFADTO, caseData?: CaseViewDTO): string {
  const respondent = data.respondentName || 'the respondent';
  const relationship = caseData?.relationshipToComplainant
    ? ` (${caseData.relationshipToComplainant})`
    : '';
  const nature = (data.matterFiled || caseData?.natureOfComplaint || 'VAWC incident').toLowerCase();
  const location = caseData?.incidentLocation ? ` at ${caseData.incidentLocation}` : '';
  return `The victim reported an incident of ${nature} committed by ${respondent}${relationship}${location}.`;
}

function buildNarrativeBlock(data: DisplayCFADTO, caseData?: CaseViewDTO): string {
  return caseData?.narrative?.trim() || data.grounds.trim();
}

function getOfficerPosition(data: DisplayCFADTO): string {
  return data.assignOfficerPosition?.trim() || 'VAWC Desk Officer';
}

export async function downloadVawcCFAasWord(
  data: DisplayCFADTO,
  caseData?: CaseViewDTO,
): Promise<void> {
  const letterDate = formatLetterDate(data.issuedAt);
  const officerPosition = getOfficerPosition(data);
  const narrativeBlock = buildNarrativeBlock(data, caseData);

  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1440 },
          },
        },
        children: [
          para([run('REPUBLIC OF THE PHILIPPINES', { bold: true, size: 12 })], {
            align: AlignmentType.CENTER,
            spaceAfter: 80,
          }),
          para([run('Barangay VAWC Desk', { bold: true, size: 14 })], {
            align: AlignmentType.CENTER,
            spaceAfter: 40,
          }),
          para([run('Valenzuela City', { size: 10 })], {
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          para([run('Province, Municipality', { size: 9 })], {
            align: AlignmentType.CENTER,
            borderBottom: true,
            spaceAfter: 240,
          }),

          para([run(letterDate, { size: 11 })], {
            align: AlignmentType.RIGHT,
            spaceAfter: 220,
          }),

          para([run('MSWDO Head', { bold: true, size: 11 })], { spaceAfter: 60 }),
          para([run('Municipal Social Welfare and Development Officer', { size: 11 })], {
            spaceAfter: 40,
          }),
          para([run('Municipality Hall, Brgy. Poblacion', { size: 11 })], {
            spaceAfter: 260,
          }),

          para([run(`SUBJECT:  REFERRAL: VAWC CASE NO. ${data.blotterNumber}`, { bold: true, size: 11 })], {
            spaceAfter: 280,
          }),

          para([run('Dear Sir/Madam,', { size: 11 })], { spaceAfter: 260 }),

          para([run(buildVictimSentence(data, caseData), { size: 11 })], {
            spaceAfter: 220,
          }),

          para([run(buildIncidentSentence(data, caseData), { size: 11 })], {
            spaceAfter: 220,
          }),

          para([run('Brief description of the incident:', { size: 11 })], {
            spaceAfter: 140,
          }),
          para([run(narrativeBlock, { size: 11 })], {
            spaceAfter: 220,
          }),

          para([
            run('We are referring this case for appropriate counseling, psychological support, and further intervention as deemed necessary by your office.', { size: 11 }),
          ], {
            spaceAfter: 520,
          }),

          para([run('Very truly yours,', { size: 11 })], { spaceAfter: 460 }),

          para([run(`OFFICER ${data.assignOfficerName}`, { bold: true, size: 11, allCaps: true })], {
            spaceAfter: 80,
          }),
          para([run(officerPosition, { size: 11 })], { spaceAfter: 40 }),
          para([run('Barangay VAWC Desk', { size: 11 })]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement('a'), {
    href: url,
    download: `CFA_${data.blotterNumber}.docx`,
  });
  anchor.click();
  URL.revokeObjectURL(url);
}
