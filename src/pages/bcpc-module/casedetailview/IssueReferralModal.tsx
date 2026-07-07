import { useEffect, useState } from 'react';
import { PrinterIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { issueReferral } from '../../../service/bcpc-api/CaseDetail';
import { useUser, getUserDisplayName } from '../../../context/UserContext';

// Standard BCPC referral agencies
const BCPC_REFERRAL_AGENCIES = [
  'DSWD — Department of Social Welfare and Development',
  'DSWD — SWAD (Social Welfare and Development Area)',
  'PNP — Women and Children Protection Desk',
  'NBI — National Bureau of Investigation',
  'DOH — Department of Health',
  'City Health Office / Municipal Health Office',
  'Local Government Hospital / Health Center',
  'DepEd — School Guidance Counselor',
  'PDAO — Persons with Disability Affairs Office',
  'DILG — Department of Interior and Local Government',
  'DSWD — Pantawid Pamilyang Pilipino Program (4Ps)',
  'DOJ — Department of Justice (PAO)',
  'Office of the Prosecutor',
  'Family Court / Regional Trial Court',
  'Bahay Pag-Asa Youth Development Center',
  'Crisis Intervention Center',
  'Non-Government Organization (NGO)',
  'Other Agency / Office',
];

// ─── Print Referral Letter ─────────────────────────────────────────────────────

export function printReferralLetter(data: {
  caseNumber: string;
  childName: string;
  referredTo: string;
  grounds: string;
  referralDate: string;
  referredBy: string;
}) {
  const formattedDate = new Date(data.referralDate).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Referral Letter — ${data.caseNumber}</title>
<style>
  @media print { @page { size: A4; margin: 25mm 20mm; } }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; margin: 0; padding: 0; }
  .page { max-width: 680px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header .brgy { font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; color: #555; }
  .header .title { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 8px 0 4px; }
  .header .sub { font-size: 10pt; color: #444; }
  hr { border: 2px solid #000; margin: 16px 0; }
  .ref-number { font-size: 10pt; margin-bottom: 20px; }
  .date-line { text-align: right; margin-bottom: 24px; }
  .addressee { margin-bottom: 20px; font-weight: bold; }
  .body-text { line-height: 1.8; margin-bottom: 14px; text-align: justify; }
  .indent { margin-left: 40px; }
  .signatory { margin-top: 48px; }
  .signatory .name { font-weight: bold; text-transform: uppercase; margin-top: 48px; }
  .signatory .title-label { font-size: 10pt; }
  .case-pill { display: inline-block; background: #f0f4ff; border: 1px solid #c7d2fe; padding: 2px 10px; border-radius: 4px; font-size: 10pt; font-weight: bold; color: #3730a3; }
  .footer { margin-top: 60px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9pt; color: #888; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brgy">Republic of the Philippines</div>
    <div class="title">Barangay Child Protection Council</div>
    <div class="sub">Barangay Council for the Protection of Children (BCPC)</div>
  </div>
  <hr/>

  <p class="ref-number">Ref. No.: <span class="case-pill">${data.caseNumber}</span></p>
  <p class="date-line">${formattedDate}</p>

  <div class="addressee">
    ${data.referredTo}<br/>
  </div>

  <p class="body-text">Greetings!</p>

  <p class="body-text">
    This office respectfully refers to your good office the case of
    <strong>${data.childName}</strong> for appropriate action and assistance in connection with a child protection matter reported and documented under the above case reference number.
  </p>

  <p class="body-text"><strong>Grounds / Reason for Referral:</strong></p>
  <p class="body-text indent">${data.grounds.replace(/\n/g, '<br/>')}</p>

  <p class="body-text">
    We request your full cooperation and assistance in ensuring the welfare and best interest of the child involved. 
    Please coordinate with the undersigned for any information needed for the proper disposition of this case.
  </p>

  <p class="body-text">Thank you for your continued support and cooperation.</p>

  <div class="signatory">
    <p>Respectfully yours,</p>
    <p class="name">${data.referredBy}</p>
    <p class="title-label">BCPC Officer / Social Worker</p>
  </div>

  <div class="footer">
    This referral letter is issued by the Barangay Council for the Protection of Children (BCPC). For inquiries, please contact the BCPC office.
  </div>
</div>
<script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=800,height=900');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  caseId: number;
  caseNumber: string;
  childName: string;
  onClose: () => void;
  onSuccess: () => void;
};

// ─── Success Screen (shown after successful submission) ───────────────────────

function ReferralSuccessView(props: {
  caseNumber: string;
  childName: string;
  referredTo: string;
  grounds: string;
  referralDate: string;
  referredBy: string;
  onClose: () => void;
}) {
  return (
    <div className="px-6 py-8 flex flex-col items-center gap-5 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200">
        <PrinterIcon className="w-7 h-7 text-emerald-600" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900">Referral Issued Successfully</p>
        <p className="mt-1 text-sm text-gray-500">
          Referred to: <span className="font-medium text-gray-700">{props.referredTo}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Issued by {props.referredBy}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={() => printReferralLetter({
            caseNumber: props.caseNumber,
            childName: props.childName,
            referredTo: props.referredTo,
            grounds: props.grounds,
            referralDate: props.referralDate,
            referredBy: props.referredBy,
          })}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          <PrinterIcon className="w-4 h-4" />
          Print Referral Letter
        </button>
        <button
          onClick={props.onClose}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IssueReferralModal({
  caseId,
  caseNumber,
  childName,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useUser();
  const referredBy = getUserDisplayName(user);

  const [referredTo, setReferredTo] = useState('');
  const [referredToCustom, setReferredToCustom] = useState('');
  const [grounds, setGrounds] = useState('');
  const [referralDate, setReferralDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // After success — show print screen instead of closing immediately
  const [issued, setIssued] = useState<{
    referredTo: string; grounds: string; referralDate: string;
  } | null>(null);

  const resolvedReferredTo = referredTo === 'Other Agency / Office'
    ? referredToCustom.trim()
    : referredTo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedReferredTo || !grounds.trim() || !referralDate) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateTime = new Date(`${referralDate}T00:00:00`).toISOString();
      await issueReferral(caseId, {
        referredTo: resolvedReferredTo,
        grounds: grounds.trim(),
        referredBy,
        referralDate: dateTime,
      });
      setIssued({ referredTo: resolvedReferredTo, grounds: grounds.trim(), referralDate });
      onSuccess(); // refresh parent list in background
    } catch (err: any) {
      setError(err.message || 'Failed to issue referral.');
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (issued) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Issue Case Referral</h3>
            <p className="text-sm text-gray-500">Case {caseNumber} — {childName}</p>
          </div>
          <ReferralSuccessView
            caseNumber={caseNumber}
            childName={childName}
            referredTo={issued.referredTo}
            grounds={issued.grounds}
            referralDate={issued.referralDate}
            referredBy={referredBy}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // ── Form screen ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Issue Case Referral</h3>
          <p className="text-sm text-gray-500">Case {caseNumber} — {childName}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{error}</div>}

          {/* Referred To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referred To (Agency / Office) <span className="text-red-500">*</span>
            </label>
            <select
              value={referredTo}
              onChange={(e) => setReferredTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="">— Select Agency / Office —</option>
              {BCPC_REFERRAL_AGENCIES.map((agency) => (
                <option key={agency} value={agency}>{agency}</option>
              ))}
            </select>
          </div>

          {referredTo === 'Other Agency / Office' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specify Agency / Office <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter agency or office name..."
                value={referredToCustom}
                onChange={(e) => setReferredToCustom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          )}

          {/* Grounds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grounds / Reason for Referral <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={grounds}
              onChange={(e) => setGrounds(e.target.value)}
              placeholder="State the reason why this case needs to be referred..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date Issued */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Issued <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={referralDate}
                onChange={(e) => setReferralDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Referred By — auto from logged-in user */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 select-none">
                {referredBy}
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Issuing...
              </>
            ) : (
              <>
                <SendIcon className="h-4 w-4" />
                Issue Referral
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
