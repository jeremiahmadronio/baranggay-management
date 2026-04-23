import { FileOutputIcon, PlusIcon, UserCircle2Icon, CalendarDaysIcon } from 'lucide-react';
import { SectionCard, formatDate } from './shared';
import type { BcpcReferral } from './shared';

// ─── Mock referrals ───────────────────────────────────────────────────────────

const MOCK_REFERRALS: BcpcReferral[] = [
  {
    id: 1,
    referredTo: 'DSWD – Municipal Social Welfare Office',
    referralDate: '2026-01-20',
    grounds: 'Child requires psychosocial intervention and temporary shelter evaluation.',
    status: 'Active',
    referredBy: 'MSW Joana Reyes',
  },
];

const REFERRAL_STATUS_PILL: Record<string, string> = {
  Active: 'bg-blue-50 text-blue-700 border border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
};

type ReferralsTabProps = {
  caseId: number;
  isReadOnly: boolean;
};

export function ReferralsTab({ caseId: _caseId, isReadOnly }: ReferralsTabProps) {
  const referrals = MOCK_REFERRALS;

  return (
    <SectionCard
      title="Referrals"
      icon={<FileOutputIcon className="w-4 h-4 text-gray-400" />}
      action={
        !isReadOnly ? (
          <button
            onClick={() => {
              // TODO: open issue referral modal
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 border border-violet-200 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Issue Referral
          </button>
        ) : null
      }
    >
      {isReadOnly && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          This case is read-only. Referrals can no longer be issued.
        </div>
      )}

      {referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
          <FileOutputIcon className="w-8 h-8 text-gray-300" />
          <p className="text-sm">No referrals issued yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => (
            <div key={referral.id} className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{referral.referredTo}</p>
                  {referral.grounds && (
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{referral.grounds}</p>
                  )}
                </div>
                {referral.status && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      REFERRAL_STATUS_PILL[referral.status] ??
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {referral.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {formatDate(referral.referralDate)}
                </span>
                {referral.referredBy && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserCircle2Icon className="w-3.5 h-3.5" />
                    {referral.referredBy}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
