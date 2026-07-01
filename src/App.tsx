import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { AdminLayout } from "./layout";
import {
  BcpcLayout,
  BlotterLayout,
  LupongTagapamayapaLayout,
  ClearanceLayout,
  VawcLayout,
  FirstTimeJobSeekerLayout,
  OfficialLayout,
  RootAdminLayout,
} from "./layout/Layout";

import { LoginPage } from "./pages/login/LoginPage";
import { ForgotPasswordPage } from "./pages/login/ForgotPasswordPage";
import { TermsAndConditionsPage } from "./pages/login/TermsAndConditionPage";
import { MFAVerificationPage } from "./pages/login/MFAVerificationPage";
import { ResetCodeVerificationPage } from "./pages/login/ResetCodeVerificationPage";
import { ResetPasswordPage } from "./pages/login/ResetPasswordPage";
import { SecuritySetupPage } from "./pages/login/SecuritySetupPage";

import { ChangePasswordNewAccountPage } from "./pages/login/ChangePasswordNewAccountPage";

// Admin
import RecordInputDemo from "./pages/admin-module/user-management/record-input";
import AdminDashboard from "./pages/admin-module/dashboard/dashboard";
import UserManagement from "./pages/admin-module/user-management/user-management";
import { ResidentsPage } from "./pages/admin-module/resident/ResidentsPage";
import { OfficerManagementPage } from "./pages/admin-module/officer/officerManagement";
import ArchivePage from "./pages/admin-module/archive/archive";
import EventsManagement from "./pages/admin-module/events/EventsManagement";
import AdminReportsPage from "./pages/admin-module/reports";
import AdminDocketview from "./pages/admin-module/blotter-docket/Docketview";
import AdminBlotterRecordsPage from "./pages/admin-module/blotter-docket/BlotterRecord";
import AdminBlotterRecordDetailView from "./pages/admin-module/blotter-docket/BlotterRecordDetailView";
import AdminBlotterReportPage from "./pages/admin-module/blotter-docket/BlotterReport";
import AdminLuponCases from "./pages/admin-module/lupon-docket/Cases";
import AdminLuponCaseDetailViewWrapper from "./pages/admin-module/lupon-docket/LuponCaseDetailViewWrapper";


// Root Admin
import RootAdminDashboard from "./pages/admin-root-module/dashboard";
import AdminManagement from "./pages/admin-root-module/admin-management";
import AdminViewPage from "./pages/admin-root-module/admin-view-page";
import AuditLogs from "./pages/admin-root-module/audit-logs";
import { Settings as SharedAccountSettings } from "./pages/admin-root-module/account-settings";
import { BackupPage } from "./pages/admin-root-module/BackupPage";
import Root_User_Management from "./pages/admin-root-module/user-management/user-management";
import RootOfficerManagementPage from "./pages/admin-root-module/officer/officerManagement";
import RootArchivePage from "./pages/admin-root-module/archive/archive";
import RootAdminReportsPage from "./pages/admin-root-module/reports";

// BCPC
import BcpcDashboard from "./pages/bcpc-module/dashboard";
import BcpcNewCaseEntry from "./pages/bcpc-module/new-case-entry";
import BcpcCaseManagement from "./pages/bcpc-module/case-management";
import BcpcCaseDetailsPage from "./pages/bcpc-module/casedetailview";
import BcpcReport from "./pages/bcpc-module/report";

// Blotter
import BlotterDashboard from "./pages/blotter-module/dashboard";
import BlotterEntryForm from "./pages/blotter-module/BlotterEntryForm";
import Docketview from "./pages/blotter-module/Docketview";
import ArchiveCasesPage from "./pages/blotter-module/ArchiveCases";
import BlotterRecordsPage from "./pages/blotter-module/BlotterRecord";
import BlotterViewPage from "./pages/blotter-module/BlotterRecordDetailView";
import ReportsPage from "./pages/blotter-module/BlotterReport";
import ResidentListPage from "./pages/blotter-module/Residents";

// Clearance
import ClearanceDashboard from "./pages/clearance-module/Dashboard";
import { IssueCertificatePage } from "./pages/clearance-module/issue-certificate";
import IssuedCertificatePage from "./pages/clearance-module/issued-certificate";
import RevenueAndCollectionPage from "./pages/clearance-module/revenue-and-collections";
import CreateTemplate from "./pages/clearance-module/clearance-template/CreateTemplate";
import { ClearanceSettings } from "./pages/clearance-module/settings";

// FTJS
import FtjsDashboardPage from "./pages/first-time-job-seeker-module/Dashboard";
import FtjsEntryPage from "./pages/first-time-job-seeker-module/ftjsentry";
import FtjsManagementPage from "./pages/first-time-job-seeker-module/ftjsManagement";
import FtjsArchivePage from "./pages/first-time-job-seeker-module/Archive";
import FtjsReportPage from "./pages/first-time-job-seeker-module/report";
import FtjsDetailViewPage from "./pages/first-time-job-seeker-module/FtjsDetailView";

// LUPON
import LupongTagapamayapaDashboard from "./pages/lupon-module/lupon-pages/dashboard";
import LuponCases from "./pages/lupon-module/lupon-pages/Cases";
import LuponArchiveCasesPage from "./pages/lupon-module/lupon-pages/ArchiveCases";
import { ViewAllHearings } from "./pages/lupon-module/lupon-pages/ViewAllHearing";
import { LuponReportsPage } from "./pages/lupon-module/lupon-pages/LuponReports";
import { MonthlyReportPage } from "./pages/lupon-module/lupon-pages/ReportsDILG";
import LuponCaseDetailViewWrapper from "./pages/lupon-module/lupon-pages/LuponCaseDetailViewWrapper";
import OfficialDashboard from "./official-module/dashboard";

// VAWC
import VawcDashboard from "./pages/vawc-module/dashboard";
import VawcCaseTable from "./pages/vawc-module/cases";
import VawcNewComplaint from "./pages/vawc-module/newcomplaint";
import VawcReportsPage from "./pages/vawc-module/reports";
import VawcCaseDetailsPage from "./pages/vawc-module/casedetailview";

//kapitana
import Kapitana_User_Management from "./pages/kapitana/admin-root-module/user-management/user-management";
import KapitanaAdminViewPage from "./pages/kapitana/admin-root-module/admin-view-page";
import KapitanaAdminReportsPage from "./pages/kapitana/admin-root-module/reports";
import KapitanaBackupPage from "./pages/kapitana/admin-root-module/BackupPage";
import KapitanaAuditLogs from "./pages/kapitana/admin-root-module/audit-logs";
import KapitanaBcpcCaseManagement from "./pages/kapitana/bcpc-module/case-management";
import KapitanaBcpcReportPage from "./pages/kapitana/bcpc-module/report";
import KapitanaBcpcCaseDetailsPage from "./pages/kapitana/bcpc-module/casedetailview";
import KapitanaBlotterRecordsPage from "./pages/kapitana/blotter-module/BlotterRecord";
import KapitanaDocketview from "./pages/kapitana/blotter-module/Docketview";
import KapitanaReportsPage from "./pages/kapitana/blotter-module/BlotterReport";
import KapitanaLuponCases from "./pages/kapitana/lupon-module/lupon-pages/Cases";
import KapitanaLuponCaseDetailViewWrapper from "./pages/kapitana/lupon-module/lupon-pages/LuponCaseDetailViewWrapper";
import { KapitanaLuponReportsPage } from "./pages/kapitana/lupon-module/lupon-pages/LuponReports";
import KapitanaVawcCaseTable from "./pages/kapitana/vawc-module/cases";
import KapitanaVawcReportsPage from "./pages/kapitana/vawc-module/reports";
import KapitanaVawcCaseDetailsPage from "./pages/kapitana/vawc-module/casedetailview";
import { KapitanaIssuedCertificatePage } from "./pages/kapitana/clearance-module/issued-certificate";
import KapitanaRevenueAndCollectionPage from "./pages/kapitana/clearance-module/revenue-and-collections";
import KapitanaFtjsManagementPage from "./pages/kapitana/first-time-job-seeker-module/ftjsManagement";
import KapitanaFtjsDetailViewPage from "./pages/kapitana/first-time-job-seeker-module/FtjsDetailView";
import KapitanaFtjsReportPage from "./pages/kapitana/first-time-job-seeker-module/report";
import KapitanaAdminManagement from "./pages/kapitana/admin-root-module/admin-management";

// Landing Page
import { LandingPage } from "./landing-page";
import OfficialsPage from "./landing-page/OfficialsPage";
import MapsPage from "./landing-page/MapsPage";
import { EventsCalendar } from "./landing-page/EventsCalendar";

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This is the {title} page.</p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/officials" element={<OfficialsPage />} />
      <Route path="/map" element={<MapsPage />} />
      <Route path="/events" element={<EventsCalendar />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/reset-code-verification"
        element={<ResetCodeVerificationPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/terms-and-conditions"
        element={<TermsAndConditionsPage />}
      />
      <Route path="/security-setup" element={<SecuritySetupPage />} />
      <Route path="/mfa-verification" element={<MFAVerificationPage />} />
      <Route
        path="/change-password-new-account"
        element={<ChangePasswordNewAccountPage />}
      />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="user-management" element={<AdminManagement />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="inputform" element={<RecordInputDemo />} />
        <Route path="residents" element={<ResidentsPage />} />
        <Route path="officers" element={<RootOfficerManagementPage />} />
        <Route path="events" element={<EventsManagement />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
        <Route path="blotter-docket" element={<AdminDocketview />} />
        <Route path="blotter-records" element={<AdminBlotterRecordsPage />} />
        <Route path="blotter-records/view" element={<AdminBlotterRecordDetailView />} />
        <Route path="blotter-reports" element={<AdminBlotterReportPage />} />
        <Route path="lupon-cases" element={<AdminLuponCases />} />
        <Route path="lupon-cases/view/:blotterNumber" element={<AdminLuponCaseDetailViewWrapper />} />

        

          

        <Route
          path="users"
          element={<PagePlaceholder title="User Management" />}
        />
        <Route path="tables" element={<AdminDashboard />} />
      </Route>

      {/* Root Admin */}
      <Route path="/rootadmin" element={<RootAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RootAdminDashboard />} />
        <Route path="user-management" element={<Root_User_Management />} />
        <Route path="residents" element={<ResidentsPage />} />
        <Route path="officers" element={<RootOfficerManagementPage />} />
        <Route path="admin-management" element={<AdminManagement />} />
        <Route
          path="admin-management/view/:adminId"
          element={<AdminViewPage />}
        />
        <Route path="backup-management" element={<BackupPage />} />
        <Route path="events" element={<EventsManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="reports" element={<RootAdminReportsPage />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
        <Route path="archive" element={<RootArchivePage />} />
      </Route>

      {/* Blotter */}
      <Route path="/blotter" element={<BlotterLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BlotterDashboard />} />
        <Route path="docket" element={<Docketview />} />
        <Route path="archive" element={<ArchiveCasesPage />} />
        <Route path="records" element={<BlotterRecordsPage />} />
        <Route path="entry-form" element={<BlotterEntryForm />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="record-view" element={<BlotterViewPage />} />
        <Route path="residents" element={<ResidentListPage />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
      </Route>

      {/* Lupong Tagapamayapa */}
      <Route path="/lupongtagapamayapa" element={<LupongTagapamayapaLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LupongTagapamayapaDashboard />} />
        <Route path="cases" element={<LuponCases />} />
        <Route path="archive" element={<LuponArchiveCasesPage />} />
        <Route path="residents" element={<ResidentListPage />} />
        <Route
          path="cases/:blotterNumber"
          element={<LuponCaseDetailViewWrapper />}
        />
        <Route path="view-all-hearings" element={<ViewAllHearings />} />
        <Route path="reports" element={<LuponReportsPage />} />
        <Route path="monthly-report" element={<MonthlyReportPage />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
      </Route>

      {/* BCPC */}
      <Route path="/bcpc" element={<BcpcLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BcpcDashboard />} />
        <Route path="new-case-entry" element={<BcpcNewCaseEntry />} />
        <Route path="case-management" element={<BcpcCaseManagement />} />
        <Route path="casedetailview" element={<BcpcCaseDetailsPage />} />{" "}
        {/* ✅ added */}
        <Route path="report" element={<BcpcReport />} />
        <Route path="resident-records" element={<ResidentListPage />} />
      </Route>

      {/* VAWC */}
      <Route path="/vawc" element={<VawcLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VawcDashboard />} />
        <Route path="newcomplaint" element={<VawcNewComplaint />} />
        <Route path="cases" element={<VawcCaseTable />} />
        <Route path="casedetailview" element={<VawcCaseDetailsPage />} />
        <Route path="reports" element={<VawcReportsPage />} />
        <Route path="residents" element={<ResidentListPage />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
      </Route>

      {/* Clearance */}
      <Route path="/clearance" element={<ClearanceLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClearanceDashboard />} />
        <Route path="issued-certificates" element={<IssuedCertificatePage />} />
        <Route
          path="revenue-and-collection"
          element={<RevenueAndCollectionPage />}
        />
        <Route path="issue-certificate" element={<IssueCertificatePage />} />
        <Route path="template" element={<CreateTemplate />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
        <Route path="settings" element={<ClearanceSettings />} />
      </Route>

      {/* First Time Job Seeker */}
      <Route
        path="/first-time-job-seeker"
        element={<FirstTimeJobSeekerLayout />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FtjsDashboardPage />} />
        <Route path="entry" element={<FtjsEntryPage />} />
        <Route path="management" element={<FtjsManagementPage />} />
        <Route path="management/:ftjsId" element={<FtjsDetailViewPage />} />
        <Route path="archive" element={<FtjsArchivePage />} />
        <Route path="reports" element={<FtjsReportPage />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
      </Route>

      {/* Officials */}
      <Route path="/official-portal" element={<OfficialLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OfficialDashboard />} />
        <Route path="account-settings" element={<SharedAccountSettings />} />
        <Route
          path="settings"
          element={<Navigate to="/official-portal/account-settings" replace />}
        />

        {/* Kapitana */}
          <Route path="admin-management" element={<KapitanaAdminManagement />} />
            <Route
          path="kapitana-admin-management/view/:adminId"
          element={<KapitanaAdminViewPage />}
        />
          

            <Route path="user-management" element={<Kapitana_User_Management />} />
        <Route path="reports" element={<KapitanaAdminReportsPage />} />
        <Route path="backup-management" element={<KapitanaBackupPage />} />
        <Route path="audit-logs" element={<KapitanaAuditLogs />} />

        <Route
          path="blotter/records"
          element={<KapitanaBlotterRecordsPage />}
        />
        <Route path="blotter/docket" element={<KapitanaDocketview />} />
        <Route
          path="blotter/record-view"
          element={<KapitanaBlotterRecordsPage />}
        />
        <Route path="blotter/reports" element={<KapitanaReportsPage />} />

        <Route path="lupon/cases" element={<KapitanaLuponCases />} />
        <Route path="lupon/reports" element={<KapitanaLuponReportsPage />} />
        <Route path="lupon/case-detail/:blotterNumber" element={<KapitanaLuponCaseDetailViewWrapper />} />

        <Route path="vawc/cases" element={<KapitanaVawcCaseTable />} />
        <Route path="vawc/casedetailview" element={<KapitanaVawcCaseDetailsPage />} />
        <Route path="vawc/reports" element={<KapitanaVawcReportsPage />} />

        <Route path="bcpc/cases" element={<KapitanaBcpcCaseManagement />} />
        <Route path="bcpc/casedetailview" element={<KapitanaBcpcCaseDetailsPage />} />
        <Route path="bcpc/reports" element={<KapitanaBcpcReportPage />} />

        <Route
          path="clearance/issued-certificates"
          element={<KapitanaIssuedCertificatePage />}
        />
        <Route
          path="clearance/revenue-and-collection"
          element={<KapitanaRevenueAndCollectionPage />}
        />

        <Route
          path="ftjs/management"
          element={<KapitanaFtjsManagementPage />}
        />
        <Route path="ftjs/management/:ftjsId" element={<KapitanaFtjsDetailViewPage />} />
        <Route path="ftjs/reports" element={<KapitanaFtjsReportPage />} />
      </Route>
    </Routes>
  );
}

export default App;
