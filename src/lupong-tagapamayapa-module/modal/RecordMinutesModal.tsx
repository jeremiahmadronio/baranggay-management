import { useState } from 'react'
import {
  XIcon,
  FileTextIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UserCheckIcon,
  UserXIcon,
  MapPinIcon,
  HashIcon,
} from 'lucide-react'
import type { RecordMinutesRequest } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'
import { recordHearingMinutes } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'
import type { HearingViewDTO } from '../../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2'

interface Props {
  hearing: HearingViewDTO
  caseNumber: string
  natureOfComplaint: string
  complainantName: string
  respondentName: string
  onSuccess: () => void
  onCancel: () => void
}

export function RecordMinutesModal({
  hearing,
  caseNumber,
  natureOfComplaint,
  complainantName,
  respondentName,
  onSuccess,
  onCancel,
}: Props) {
  const [complainantPresent, setComplainantPresent] = useState(true)
  const [respondentPresent, setRespondentPresent] = useState(true)
  const [hearingNotes, setHearingNotes] = useState('')
  const [outcome, setOutcome] = useState('')
  const [settlementTerms, setSettlementTerms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFormValid =
    !!outcome && (outcome !== 'SETTLED' || !!settlementTerms.trim())

  const handleSubmit = async () => {
    if (!outcome) {
      setError('Please select an outcome.')
      return
    }
    if (outcome === 'SETTLED' && !settlementTerms.trim()) {
      setError('Please provide settlement terms.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const body: RecordMinutesRequest = {
        hearingId: hearing.hearingId,
        complainantPresent,
        respondentPresent,
        hearingNotes: hearingNotes.trim() || undefined,
        outcome,
        settlementTerms: settlementTerms.trim(),
      }
      await recordHearingMinutes(body)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record minutes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .lrm-overlay {
          font-family: 'DM Sans', sans-serif;
        }

        .lrm-modal {
          animation: lrm-rise 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes lrm-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }

        .lrm-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .lrm-heading {
          font-family: 'Lora', Georgia, serif;
          font-weight: 600;
        }

        .lrm-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .lrm-attendance-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1.5px solid;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          width: 100%;
          background: white;
        }

        .lrm-attendance-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.08);
        }

        .lrm-attendance-btn.present {
          border-color: #bbf7d0;
          background: #f0fdf4;
        }

        .lrm-attendance-btn.absent {
          border-color: #fecaca;
          background: #fff5f5;
        }

        .lrm-outcome-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          width: 100%;
          background: white;
        }

        .lrm-outcome-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .lrm-outcome-btn.settled {
          border-color: #6ee7b7;
          background: #f0fdf4;
          box-shadow: 0 0 0 3px #d1fae5;
        }

        .lrm-outcome-btn.not-settled {
          border-color: #fca5a5;
          background: #fff5f5;
          box-shadow: 0 0 0 3px #fee2e2;
        }

        .lrm-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lrm-textarea {
          width: 100%;
          padding: 12px 14px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          outline: none;
          resize: none;
          color: #1e293b;
          background: #fafafa;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          line-height: 1.6;
          box-sizing: border-box;
        }

        .lrm-textarea:focus {
          border-color: #93c5fd;
          background: #fff;
          box-shadow: 0 0 0 3px #dbeafe;
        }

        .lrm-textarea.settlement:focus {
          border-color: #6ee7b7;
          box-shadow: 0 0 0 3px #d1fae5;
        }

        .lrm-textarea::placeholder {
          color: #94a3b8;
        }

        .lrm-btn-cancel {
          padding: 9px 20px;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .lrm-btn-cancel:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }

        .lrm-btn-cancel:disabled { opacity: 0.45; cursor: not-allowed; }

        .lrm-btn-submit {
          padding: 9px 22px;
          font-size: 13.5px;
          font-weight: 600;
          color: white;
          background: #1e40af;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
        }

        .lrm-btn-submit:hover:not(:disabled) {
          background: #1d3a9e;
          box-shadow: 0 4px 14px -3px rgba(30, 64, 175, 0.45);
          transform: translateY(-1px);
        }

        .lrm-btn-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .lrm-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
          margin: 0;
        }

        .lrm-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: lrm-spin 0.6s linear infinite;
        }

        @keyframes lrm-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="lrm-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="lrm-modal"
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 24px 60px -8px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.06)',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div style={{ padding: '22px 24px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px -2px rgba(37,99,235,0.35)',
                  flexShrink: 0,
                }}>
                  <FileTextIcon style={{ width: 18, height: 18, color: 'white' }} />
                </div>
                <div>
                  <h3 className="lrm-heading" style={{ fontSize: 17, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                    Record Hearing Minutes
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <span className="lrm-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                      <HashIcon style={{ width: 9, height: 9 }} />
                      {caseNumber}
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: 12 }}>·</span>
                    <span className="lrm-badge" style={{ background: '#f8fafc', color: '#64748b' }}>
                      Hearing {hearing.hearingNumber}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onCancel}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer',
                  color: '#94a3b8', transition: 'all 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
              >
                <XIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          <div className="lrm-divider" />

          {/* ── Body ── */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Case Info strip */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc' }}>
                <p className="lrm-section-label" style={{ marginBottom: 4 }}>Nature of Complaint</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{natureOfComplaint}</p>
              </div>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>
                <p className="lrm-section-label" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPinIcon style={{ width: 9, height: 9 }} /> Venue
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{hearing.venue}</p>
              </div>
            </div>

            {/* Attendance */}
            <div>
              <p className="lrm-section-label" style={{ marginBottom: 10 }}>Attendance</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Complainant */}
                <button
                  type="button"
                  onClick={() => setComplainantPresent(!complainantPresent)}
                  className={`lrm-attendance-btn ${complainantPresent ? 'present' : 'absent'}`}
                >
                  <div className="lrm-icon-wrap" style={{
                    background: complainantPresent ? '#dcfce7' : '#fee2e2',
                  }}>
                    {complainantPresent
                      ? <UserCheckIcon style={{ width: 16, height: 16, color: '#16a34a' }} />
                      : <UserXIcon style={{ width: 16, height: 16, color: '#dc2626' }} />
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="lrm-section-label" style={{ marginBottom: 2 }}>Complainant</p>
                    <p style={{
                      fontSize: 13, fontWeight: 600, margin: '0 0 2px',
                      color: complainantPresent ? '#15803d' : '#dc2626',
                    }}>
                      {complainantPresent ? 'Present' : 'Absent'}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {complainantName}
                    </p>
                  </div>
                </button>

                {/* Respondent */}
                <button
                  type="button"
                  onClick={() => setRespondentPresent(!respondentPresent)}
                  className={`lrm-attendance-btn ${respondentPresent ? 'present' : 'absent'}`}
                >
                  <div className="lrm-icon-wrap" style={{
                    background: respondentPresent ? '#dcfce7' : '#fee2e2',
                  }}>
                    {respondentPresent
                      ? <UserCheckIcon style={{ width: 16, height: 16, color: '#16a34a' }} />
                      : <UserXIcon style={{ width: 16, height: 16, color: '#dc2626' }} />
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="lrm-section-label" style={{ marginBottom: 2 }}>Respondent</p>
                    <p style={{
                      fontSize: 13, fontWeight: 600, margin: '0 0 2px',
                      color: respondentPresent ? '#15803d' : '#dc2626',
                    }}>
                      {respondentPresent ? 'Present' : 'Absent'}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {respondentName}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Mediation Narrative */}
            <div>
              <label className="lrm-section-label" style={{ display: 'block', marginBottom: 8 }}>
                Mediation Narrative
              </label>
              <textarea
                className="lrm-textarea"
                value={hearingNotes}
                onChange={(e) => setHearingNotes(e.target.value)}
                rows={4}
                placeholder="Describe what transpired during the hearing session…"
              />
            </div>

            {/* Outcome */}
            <div>
              <label className="lrm-section-label" style={{ display: 'block', marginBottom: 8 }}>
                Hearing Outcome <span style={{ color: '#f59e0b', marginLeft: 2 }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOutcome('SETTLED')}
                  className={`lrm-outcome-btn ${outcome === 'SETTLED' ? 'settled' : ''}`}
                >
                  <div className="lrm-icon-wrap" style={{
                    background: outcome === 'SETTLED' ? '#dcfce7' : '#f1f5f9',
                  }}>
                    <CheckCircleIcon style={{ width: 16, height: 16, color: outcome === 'SETTLED' ? '#16a34a' : '#94a3b8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 2px', color: outcome === 'SETTLED' ? '#15803d' : '#334155' }}>
                      Settled
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Amicable resolution</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOutcome('NOT_SETTLED')}
                  className={`lrm-outcome-btn ${outcome === 'NOT_SETTLED' ? 'not-settled' : ''}`}
                >
                  <div className="lrm-icon-wrap" style={{
                    background: outcome === 'NOT_SETTLED' ? '#fee2e2' : '#f1f5f9',
                  }}>
                    <AlertTriangleIcon style={{ width: 16, height: 16, color: outcome === 'NOT_SETTLED' ? '#dc2626' : '#94a3b8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 2px', color: outcome === 'NOT_SETTLED' ? '#dc2626' : '#334155' }}>
                      Not Settled
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Further action needed</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Settlement Terms */}
            {outcome === 'SETTLED' && (
              <div style={{ animation: 'lrm-rise 0.2s ease' }}>
                <label className="lrm-section-label" style={{ display: 'block', marginBottom: 8 }}>
                  Settlement Terms <span style={{ color: '#f59e0b', marginLeft: 2 }}>*</span>
                </label>
                <textarea
                  className="lrm-textarea settlement"
                  value={settlementTerms}
                  onChange={(e) => setSettlementTerms(e.target.value)}
                  rows={3}
                  placeholder="Describe the agreed terms of the settlement…"
                  style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 14px',
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              }}>
                <AlertTriangleIcon style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12.5, color: '#b91c1c', margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}
          </div>

          <div className="lrm-divider" />

          {/* ── Footer ── */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: 10, padding: '16px 24px', flexShrink: 0,
          }}>
            <button className="lrm-btn-cancel" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button className="lrm-btn-submit" onClick={handleSubmit} disabled={loading || !isFormValid}>
              {loading && <span className="lrm-spinner" />}
              Save Minutes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}