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
import { Reusable } from "./admin-module/reusable";
import RecordInputDemo from "./admin-module/record-input";
import ChartPage from "./admin-module/chart";
import AdminPage from "./admin-module/DashboardReusable";
import AdminDashboard from "./admin-module/dashboard";
import UserManagement from "./admin-module/user-management";
import { AdminSettings } from "./admin-module/settings";


// Root Admin
import RootAdminDashboard from "./admin-root-module/dashboard";
import AdminManagement from "./admin-root-module/admin-management";
import AuditLogs from "./admin-root-module/audit-logs";
import {AccountSettings} from "./admin-root-module/account-settings";

// BCPC
import BCPCDashboard from "./bcpc-module/dashboard";

// Blotter
import BlotterDashboard from "./blotter-module/dashboard";
import BlotterEntryForm from "./blotter-module/BlotterFormComplaint";
import Docketview from './blotter-module/Docketview';

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
import LupongTagapamayapaDashboard from "./lupong-tagapamayapa-module/dashboard";

// Official
import OfficialDashboard from "./official-module/dashboard";

//VAWC
import VAWCDashboard from "./vawc-module/dashboard";

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
        <Route path="reusable" element={<Reusable />} />
        <Route path="charts" element={<ChartPage />} />
        <Route path="archive" element={<PagePlaceholder title="Archive" />} />
        <Route path="inputform" element={<RecordInputDemo />} />
        <Route
          path="users"
          element={<PagePlaceholder title="User Management" />}
        />
        <Route path="tables" element={<AdminPage />} />
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
        <Route path="entry-form" element={<BlotterEntryForm />} />
        <Route
          path="all-complaints"
          element={<PagePlaceholder title="All Complaints" />}
        />
        <Route path="reports" element={<PagePlaceholder title="Reports" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>

      {/* Lupong Tagapamayapa */}
      <Route path="/lupongtagapamayapa" element={<LupongTagapamayapaLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LupongTagapamayapaDashboard />} />
        <Route
          path="reports"
          element={<PagePlaceholder title="Lupon Reports" />}
        />
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
        <Route path="dashboard" element={<VAWCDashboard />} />
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
