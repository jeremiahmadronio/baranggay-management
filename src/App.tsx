import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { AdminLayout } from "./layout";
import {
  DcpcLayout,
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
import { ChangePasswordNewAccountPage } from "./pages/login/ChangePasswordNewAccountPage";
// Admin
import RecordInputDemo from "./pages/admin-module/user-management/record-input";
import AdminDashboard from "./pages/admin-module/dashboard/dashboard";
import UserManagement from "./pages/admin-module/user-management/user-management";
import { AdminSettings } from "./pages/admin-module/settings";
import { ResidentsPage } from "./pages/admin-module/resident/ResidentsPage";
import { OfficerManagementPage } from "./pages/admin-module/officer/officerManagement";
import ArchivePage from "./pages/admin-module/archive/archive";

// Root Admin
import RootAdminDashboard from "./pages/admin-root-module/dashboard";
import AdminManagement from "./pages/admin-root-module/admin-management";
import AuditLogs from "./pages/admin-root-module/audit-logs";
import { AccountSettings } from "./pages/admin-root-module/account-settings";
import { BackupPage } from "./pages/admin-root-module/BackupPage";
import Root_User_Management from "./pages/admin-root-module/user-management/user-management";
import RootOfficerManagementPage from "./pages/admin-root-module/officer/officerManagement";
import RootArchivePage from "./pages/admin-root-module/archive/archive";


// BCPC
import BCPCDashboard from "./bcpc-module/dashboard";

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

//FTJS
import FtjsDashboardPage from "./pages/first-time-job-seeker-module/Dashboard";
import FtjsEntryPage from "./pages/first-time-job-seeker-module/ftjsentry";
import FtjsManagementPage from "./pages/first-time-job-seeker-module/ftjsManagement";
import FtjsArchivePage from "./pages/first-time-job-seeker-module/Archive";
import FtjsReportPage from "./pages/first-time-job-seeker-module/report";
import FtjsDetailViewPage from "./pages/first-time-job-seeker-module/FtjsDetailView";

//LUPON
import LupongTagapamayapaDashboard from "./pages/lupon-module/lupon-pages/dashboard";
import LuponCases from "./pages/lupon-module/lupon-pages/Cases";
import LuponArchiveCasesPage from "./pages/lupon-module/lupon-pages/ArchiveCases";
import { ViewAllHearings } from "./pages/lupon-module/lupon-pages/ViewAllHearing";
import { LuponReportsPage } from "./pages/lupon-module/lupon-pages/LuponReports";
import { MonthlyReportPage } from "./pages/lupon-module/lupon-pages/ReportsDILG";
import LuponCaseDetailViewWrapper from "./pages/lupon-module/lupon-pages/LuponCaseDetailViewWrapper";
import OfficialDashboard from "./official-module/dashboard";

//VAWC
import VawcDashboard from "./pages/vawc-module/dashboard";
import VawcCaseTable from "./pages/vawc-module/cases";
import VawcNewComplaint from "./pages/vawc-module/newcomplaint";
import VawcReportsPage from "./pages/vawc-module/reports";
import VawcCaseDetailsPage from "./pages/vawc-module/casedetailview";

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
      <Route path="/mfa-verification" element={<MFAVerificationPage />} />
      <Route
        path="/change-password-new-account"
        element={<ChangePasswordNewAccountPage />}
      />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="inputform" element={<RecordInputDemo />} />
        <Route path="residents" element={<ResidentsPage />} />
        <Route path="officers" element={<OfficerManagementPage />} />
        <Route
          path="users"
          element={<PagePlaceholder title="User Management" />}
        />
        <Route path="tables" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Root Admin */}
      <Route path="/rootadmin" element={<RootAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RootAdminDashboard />} />
    <Route path="user-management" element={<Root_User_Management/>} />
      <Route path="residents" element={<ResidentsPage />} />
        <Route path="officers" element={<RootOfficerManagementPage />} />
        <Route path="admin-management" element={<AdminManagement />} />
        <Route path="backup-management" element={<BackupPage />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="account-settings" element={<AccountSettings />} />
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
        <Route path="account-settings" element={<AccountSettings />} />
      </Route>

      {/* BCPC */}
      <Route path="/bcpc" element={<DcpcLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BCPCDashboard />} />
        <Route
          path="reports"
          element={<PagePlaceholder title="DCPC Reports" />}
        />
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
      </Route>

      {/* Officials  */}
      <Route path="/official-portal" element={<OfficialLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OfficialDashboard />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>
    </Routes>
  );
}

export default App;
