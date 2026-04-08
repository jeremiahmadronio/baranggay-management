// Unified blotter API facade (single import point for blotter module pages)
// Pattern: keep endpoint logic in domain files, consume through this service entry.

// Permissions
export {
  BLOTTER_PERMISSIONS,
  hasBlotterPermission,
  hasAnyBlotterPermission,
  getMyAccess,
  getPermissionOptions,
  type PermissionOptions,
  type UserAccessPermission,
  type UserSecurityProfile,
} from "../../blotter-api/BlotterPermission";

// Dashboard
export {
  getMainStats,
  getMonthlyChart,
  getCaseDistribution,
  getRecentCases,
  getUpcomingHearings,
  type DashboardStatsDTO,
  type MonthlyCaseChartDTO,
  type CaseStatusDistributionDTO,
  type RecentCaseDTO,
  type UpcomingHearingDTO,
} from "../../blotter-api/Dashboard";

// Docket / case management
export {
  getDocketTable,
  getRecordTable,
  getArchiveTable,
  getFullBlotterDocket,
  getMediationProcess,
  getHearingView,
  getMarkers,
  getBusySlots,
  getMediationHearingView,
  getCaseNotes,
  addCaseNote,
  scheduleHearing,
  recordHearingMinutes,
  getDocketStats,
  getArchiveStats,
  updateCaseStatus,
  recordHearingFollowUp,
  getHearingFullDetails,
  getFrequencyOptions,
  getCaseTimeline,
  archiveCase,
  restoreCase,
  type DocketTableParams,
  type ArchiveTableParams,
  type ArchiveTableDTO,
  type ArchiveTableResponse,
  type BlotterSummaryDTO,
  type BlotterDocketViewDTO,
  type MediationProcessDTO,
  type HearingViewDTO,
  type HearingFullDetailsDTO,
  type CaseNoteViewDTO,
  type BlotterStatsDTO,
  type ArchiveStatsDTO,
  type UpdateCaseStatusRequest,
  type FollowUpHearingDTO,
  type CaseTimelineDTO,
  type archivedDTO,
} from "./DocketView";

export type {
  ScheduleHearingRequest,
  RecordMinutesRequest,
  CalendarMarkerDTO,
  BusySlotDTO,
} from "./DocketView";

// For-the-record / record views
export {
  getPagedBlotters,
  getFullBlotterRecord,
  getRecordStats,
  type RecordTableParams,
  type FtrSummaryStatsDTO,
  type BlotterRecordViewDTO,
  type BlotterSummaryDTO as RecordBlotterSummaryDTO,
} from "../../blotter-api/RecordView";

// Complaint form / options
export {
  getNatureOfComplaintOptions,
  getEvidenceTypeOptions,
  submitForTheRecord,
  submitFormalComplaint,
  updateCaseInformation,
  luponOptions,
  escalateToFormalComplaint,
  getOfficerOptions,
  type NatureOptionDTO,
  type EvidenceOptionDTO,
  type OfficerOptionDTO,
  type RecordBlotterEntry,
  type WitnessEntry,
  type FormalComplaintEntry,
  type EditComplaintEntry,
  type LuponOptionDTO,
} from "../../blotter-api/BlotterFormComplaint";

// Lupon referral
export {
  referToLupon,
  type PangkatMemberDTO,
  type ReferToLuponRequest,
} from "../../blotter-api/ForwardToLupon";

// Hearing update
export { updateHearingStatus } from "../../blotter-api/HearingUpdate";

// Resident search/profile for blotter forms
export {
  searchPeople,
  getResidentTable,
  getResidentProfile,
  getResidentStats,
  type PersonSearchResponseDTO,
  type ResidentSummary,
  type ResidentProfileViewDTO,
  type ResidentStatsDTO,
  type ResidentTableParams,
} from "../../blotter-api/Resident";

// Reports
export {
  getReportsStats,
  getCasesTrend,
  getCasesByNature,
  getCasesByStatus,
  getSettlementEfficiency,
  type ReportsStatsDTO,
  type ChartDataDTO,
  type NatureStatDTO,
  type StatusStatDTO,
  type SettlementEfficiencyDTO,
} from "../../blotter-api/BlotterReports";
