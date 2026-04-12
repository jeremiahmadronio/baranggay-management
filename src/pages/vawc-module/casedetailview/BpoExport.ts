import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { BpoDetails, CaseViewDTO } from '../../../service/vawc-api/vawc-api';

const FONT = 'Times New Roman';
const HP = (pt: number) => pt * 2;

function formatLetterDate(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
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

function getVictimName(caseData: CaseViewDTO, bpoDetails?: BpoDetails | null) {
  if (bpoDetails?.complainant?.trim()) return bpoDetails.complainant.trim();
  return [caseData.firstName, caseData.middleName, caseData.lastName]
    .filter(Boolean)
    .join(' ') || 'Complainant';
}

function getRespondentName(caseData: CaseViewDTO, bpoDetails?: BpoDetails | null) {
  if (bpoDetails?.respondent?.trim()) return bpoDetails.respondent.trim();
  return [
    caseData.respondentFirstName,
    caseData.respondentMiddleName,
    caseData.respondentLastName,
  ]
    .filter(Boolean)
    .join(' ') || 'Respondent';
}

function buildRequestSentence(caseData: CaseViewDTO, bpoDetails?: BpoDetails | null) {
  const victim = getVictimName(caseData, bpoDetails);
  const respondent = getRespondentName(caseData, bpoDetails);
  const nature = caseData.natureOfComplaint || 'VAWC complaint';
  return `This is to respectfully request the issuance of a Barangay Protection Order in favor of ${victim} against ${respondent} in connection with the reported ${nature.toLowerCase()} case.`;
}

function buildIncidentSentence(caseData: CaseViewDTO) {
  const location = caseData.incidentLocation
    ? ` at ${caseData.incidentLocation}`
    : '';
  const incidentDate = caseData.incidentDate
    ? ` on ${formatLetterDate(caseData.incidentDate)}`
    : '';
  return `Based on the sworn complaint and initial assessment, the incident was reported${incidentDate}${location}. Immediate protection is being requested to help prevent further harm while the case is under barangay intervention.`;
}

function buildNarrativeBlock(caseData: CaseViewDTO) {
  return caseData.narrative?.trim() || 'Narrative not available.';
}

export async function downloadVawcBpoRequestAsWord(
  caseData: CaseViewDTO,
  bpoDetails?: BpoDetails | null,
): Promise<void> {
  const letterDate = formatLetterDate();
  const caseNumber = bpoDetails?.caseNumber || caseData.caseNumber;
  const assignedOfficer = bpoDetails?.assignOfficer || caseData.assignOfficer || 'Assigned Officer';

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

          para([run('Punong Barangay', { bold: true, size: 11 })], { spaceAfter: 60 }),
          para([run('Barangay Ugong', { size: 11 })], { spaceAfter: 40 }),
          para([run('Valenzuela City', { size: 11 })], { spaceAfter: 260 }),

          para([
            run(`SUBJECT:  REQUEST FOR BARANGAY PROTECTION ORDER - CASE NO. ${caseNumber}`, {
              bold: true,
              size: 11,
            }),
          ], {
            spaceAfter: 280,
          }),

          para([run('Dear Punong Barangay:', { size: 11 })], { spaceAfter: 260 }),

          para([run(buildRequestSentence(caseData, bpoDetails), { size: 11 })], {
            spaceAfter: 220,
          }),
          para([run(buildIncidentSentence(caseData), { size: 11 })], {
            spaceAfter: 220,
          }),
          para([run('Brief description of the incident:', { size: 11 })], {
            spaceAfter: 140,
          }),
          para([run(buildNarrativeBlock(caseData), { size: 11 })], {
            spaceAfter: 220,
          }),
          para([
            run(
              'In view of the foregoing, may we respectfully request your approval and signature on the attached Barangay Protection Order request for the immediate protection of the complainant.',
              { size: 11 },
            ),
          ], {
            spaceAfter: 520,
          }),

          para([run('Very truly yours,', { size: 11 })], { spaceAfter: 460 }),
          para([run(assignedOfficer, { bold: true, size: 11, allCaps: true })], {
            spaceAfter: 80,
          }),
          para([run('VAWC Desk Officer', { size: 11 })], { spaceAfter: 40 }),
          para([run('Barangay VAWC Desk', { size: 11 })]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement('a'), {
    href: url,
    download: `BPO_Request_${caseNumber}.docx`,
  });
  anchor.click();
  URL.revokeObjectURL(url);
}