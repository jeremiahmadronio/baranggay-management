import React from 'react'

// ============================================
// GENERIC COMPONENT TYPES
// These types are for the reusable UI components ONLY.
// They have NO knowledge of any specific API or DTO.
// ============================================

export type CaseStatus = 'active' | 'pending' | 'resolved' | 'dismissed'
export type ProcessStepStatus = 'completed' | 'pending' | 'upcoming'
export type ActionVariant = 'primary' | 'danger' | 'success' | 'default'

/** Generic label-value pair for InfoCard */
export interface InfoField {
  label: string
  value: string | React.ReactNode
}

/** Generic process/timeline step */
export interface ProcessStep {
  step: number
  title: string
  description: string
  status: ProcessStepStatus
  date?: string
}

/** Generic action button */
export interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ElementType
  variant: ActionVariant
  onClick?: () => void
  disabled?: boolean
}

/** Generic witness info for display */
export interface WitnessInfo {
  fullName: string
  contactNumber?: string
  address?: string
}

/**
 * The data shape that CaseDetailLayout expects.
 * This is GENERIC — it doesn't care where the data comes from.
 * The parent page is responsible for transforming any DTO into this shape.
 */
export interface CaseData {
  id: string
  caseNumber: string
  status: CaseStatus
  complainant: string
  natureOfComplaint: string
  mediationDaysRemaining: number
  mediationTotalDays: number
  dateFiled: string
  deadlineDate: string
  clientInfo: InfoField[]
  respondentInfo: InfoField[]
  caseInfo: InfoField[]
  narrative: string
  processSteps: ProcessStep[]
  incidentTime?: string
  frequencyOfIncident?: string
  descriptionOfInjuries?: string
  witnesses: WitnessInfo[]
  evidence: string[]
}

/** Controls which sections are visible */
export interface CaseSectionConfig {
  showHeader?: boolean
  showTabs?: boolean
  showProgress?: boolean
  showQuickActions?: boolean
  showPartiesInfo?: boolean
  showCaseInfo?: boolean
  showNarrative?: boolean
  showIncidentDetails?: boolean
  showWitnesses?: boolean
  showEvidence?: boolean
  showProcess?: boolean
}
