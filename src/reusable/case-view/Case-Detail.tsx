import React from 'react'
import { type CaseData, type CaseSectionConfig, type QuickAction } from './case'
import { CaseHeader } from './Case-Header'
import { MediationProgress } from './Mediation-Progress'
import { QuickActions } from './Quick-Actions'
import { InfoCard } from './Info-Card'
import { IncidentNarrative } from './Incident-Narrative'
import { IncidentDetails } from './Incident-Details'
import { WitnessesCard } from './Witness-Card'
import { EvidenceCard } from './Evidence-Card'
import { MediationProcess } from './Mediation-Process'
interface CaseDetailLayoutProps {
  data: CaseData
  actions: QuickAction[]
  config?: CaseSectionConfig
  children?: React.ReactNode
  customTop?: React.ReactNode
  customMiddle?: React.ReactNode
}
export function CaseDetailLayout({
  data,
  actions,
  config = {},
  children,
  customTop,
  customMiddle,
}: CaseDetailLayoutProps) {
  const showHeader = config.showHeader !== false
  const showTabs = config.showTabs !== false
  const showProgress = config.showProgress !== false
  const showQuickActions = config.showQuickActions !== false
  const showPartiesInfo = config.showPartiesInfo !== false
  const showCaseInfo = config.showCaseInfo !== false
  const showNarrative = config.showNarrative !== false
  const showIncidentDetails = config.showIncidentDetails !== false
  const showWitnesses = config.showWitnesses !== false
  const showEvidence = config.showEvidence !== false
  const showProcess = config.showProcess !== false
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {showHeader && <CaseHeader data={data} showTabs={showTabs} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {customTop}

        {showProgress && (
          <MediationProgress
            daysRemaining={data.mediationDaysRemaining}
            totalDays={data.mediationTotalDays}
            dateFiled={data.dateFiled}
            deadlineDate={data.deadlineDate}
          />
        )}

        {showQuickActions && <QuickActions actions={actions} />}

        {customMiddle}

        {(showPartiesInfo || showCaseInfo) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {showPartiesInfo && (
              <div className="lg:col-span-2 space-y-6">
                <InfoCard title="Client Information" fields={data.clientInfo} />
                <InfoCard
                  title="Respondent Information"
                  fields={data.respondentInfo}
                />
              </div>
            )}
            {showCaseInfo && (
              <div
                className={!showPartiesInfo ? 'lg:col-span-3' : 'lg:col-span-1'}
              >
                <InfoCard
                  title="Case Information"
                  fields={data.caseInfo}
                  columns={1}
                  className="h-full"
                />
              </div>
            )}
          </div>
        )}

        {showNarrative && <IncidentNarrative narrative={data.narrative} />}

        {showIncidentDetails && (
          <IncidentDetails
            incidentTime={data.incidentTime}
            frequencyOfIncident={data.frequencyOfIncident}
            descriptionOfInjuries={data.descriptionOfInjuries}
          />
        )}

        {showWitnesses && <WitnessesCard witnesses={data.witnesses} />}

        {showEvidence && <EvidenceCard evidence={data.evidence} />}

        {showProcess && data.processSteps.length > 0 && (
          <MediationProcess steps={data.processSteps} />
        )}

        {children}
      </main>
    </div>
  )
}
