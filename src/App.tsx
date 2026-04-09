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

import { LoginPage } from "./login/LoginPage";
import { ForgotPasswordPage } from "./login/ForgotPasswordPage";
import { TermsAndConditionsPage } from "./login/TermsAndConditionPage";
import { MFAVerificationPage } from "./login/MFAVerificationPage";
import { ResetCodeVerificationPage } from "./login/ResetCodeVerificationPage";
import { ResetPasswordPage } from "./login/ResetPasswordPage";
// Admin
import RecordInputDemo from "./pages/admin-module/user-management/record-input";
import AdminDashboard from "./pages/admin-module/dashboard/dashboard";
import UserManagement from "./pages/admin-module/user-management/user-management";
import { AdminSettings } from "./pages/admin-module/settings";
import { ResidentsPage } from "./pages/admin-module/resident/ResidentsPage";
import { OfficerManagementPage } from "./pages/admin-module/officer/officerManagement";
import ArchivePage from "./pages/admin-module/archive/archive";

// Root Admin
import RootAdminDashboard from "./admin-root-module/dashboard";
import AdminManagement from "./admin-root-module/admin-management";
import AuditLogs from "./admin-root-module/audit-logs";
import { AccountSettings } from "./admin-root-module/account-settings";

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
import ClearanceDashboard from "./clearance-module/Dashboard";
import { IssueCertificatePage } from "./clearance-module/issue-certificate";
import IssuedCertificatePage from "./clearance-module/issued-certificate";
import RevenueAndCollectionPage from "./clearance-module/revenue-and-collections";
import EditTemplate from "./clearance-module/clearance-template/EditTemplate";
import { ClearanceSettings } from "./clearance-module/settings";

//FTJS
import FirstTimeJobSeekerDashboard from "./first-time-job-seeker-module/dashboard";

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
import { VawcDashboard } from "./pages/vawc/dashboard";

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
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/officials" element={<OfficialsPage />} />
      <Route path="/map" element={<MapsPage />} />
      <Route path="/events" element={<EventsCalendar />} />

      {/*login page*/}
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
        <Route path="admin-management" element={<AdminManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="account-settings" element={<AccountSettings />} />
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
        <Route path="cases" element={<PagePlaceholder title="VAWC Cases" />} />
        <Route
          path="reports"
          element={<PagePlaceholder title="VAWC Reports" />}
        />
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
        <Route path="template" element={<EditTemplate />} />
        <Route path="settings" element={<ClearanceSettings />} />
      </Route>

      {/* First Time Job Seeker */}
      <Route
        path="/first-time-job-seeker"
        element={<FirstTimeJobSeekerLayout />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FirstTimeJobSeekerDashboard />} />
        <Route
          path="reports"
          element={<PagePlaceholder title="First Time Job Seeker Reports" />}
        />
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
