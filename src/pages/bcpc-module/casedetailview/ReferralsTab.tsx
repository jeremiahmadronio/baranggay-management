import { useState, useEffect, useCallback } from 'react';
import { FileOutputIcon, PlusIcon, UserCircle2Icon, CalendarDaysIcon, PrinterIcon } from 'lucide-react';
import { SectionCard, formatDate } from './shared';
import { getReferrals, BcpcReferralDTO } from '../../../service/bcpc-api/CaseDetail';
import { IssueReferralModal, printReferralLetter } from './IssueReferralModal';

const REFERRAL_STATUS_PILL: Record<string, string> = {
  Active: 'bg-blue-50 text-blue-700 border border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
};

type ReferralsTabProps = {
  caseId: number;
  isReadOnly: boolean;
  caseNumber?: string;
  childName?: string;
  onRefresh?: () => void;
};

export function ReferralsTab({ caseId, isReadOnly, caseNumber, childName, onRefresh }: ReferralsTabProps) {
  const [referrals, setReferrals] = useState<BcpcReferralDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReferrals(caseId);
      setReferrals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return (
    <SectionCard
      title="Referrals"
      icon={<FileOutputIcon className="w-4 h-4 text-gray-400" />}
      action={
        <button
          onClick={() => setShowIssueModal(true)}
          disabled={isReadOnly}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${
            isReadOnly
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100'
          }`}
        >
          <PlusIcon className="w-3.5 h-3.5" /> Issue Referral
        </button>
      }
    >

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-24 bg-gray-100 rounded-xl"></div>
          <div className="h-24 bg-gray-100 rounded-xl"></div>
        </div>
      ) : referrals.length === 0 ? (
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
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">{referral.grounds}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => printReferralLetter({
                      caseNumber: caseNumber || 'Unknown',
                      childName: childName || 'Unknown',
                      referredTo: referral.referredTo,
                      grounds: referral.grounds,
                      referralDate: referral.referralDate,
                      referredBy: referral.referredBy
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <PrinterIcon className="w-3.5 h-3.5" /> Print Letter
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                {referral.referralDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {formatDate(referral.referralDate)}
                  </span>
                )}
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

      {showIssueModal && (
        <IssueReferralModal
          caseId={caseId}
          caseNumber={caseNumber || 'Unknown'}
          childName={childName || 'Unknown'}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => {
            setShowIssueModal(false);
            fetchReferrals();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </SectionCard>
  );
}
