import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout, } from './layout'
import { DcpcLayout,BlotterLayout, LupongTagapamayapaLayout,ClearanceLayout, VawcLayout,FirstTimeJobSeekerLayout, OfficialLayout} from './layout/Layout'


//admin 
import { Dashboard } from './admin-module/dashboard'
import RecordInputDemo from './admin-module/record-input'
import ChartPage from './admin-module/chart'
import AdminPage from './admin-module/DashboardReusable'


//clearance
import ClearanceDashboard from './clearance-module/dashboard'
import { IssueCertificatePage } from './clearance-module/issue-certificate'
import IssuedCertificatePage from './clearance-module/issued-certificate'
import RevenueAndCollectionPage from './clearance-module/revenue-and-collection'
import ClearanceTemplatesPage from './clearance-module/templates'
import { ClearanceSettings } from './clearance-module/settings'

import { MainTemplatePage } from './clearance-module/MainTemplate'





//landing page
import { LandingPage } from './landing-page'
import OfficialsPage from './landing-page/OfficialsPage'
import MapsPage from './landing-page/MapsPage'
import { EventsCalendar } from './landing-page/EventsCalendar'

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This is the {title} page.</p>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      {/* Landing Page  */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/officials" element={<OfficialsPage />} />
      <Route path="/map" element={<MapsPage />} />
      <Route path="/events" element={<EventsCalendar />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="charts" element={<ChartPage />} />
        <Route path="archive" element={<PagePlaceholder title="Archive" />} />
          <Route path="inputform" element={<RecordInputDemo/>} />
        <Route path="users" element={<PagePlaceholder title="User Management" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
        <Route path="tables" element={<AdminPage />} />
      </Route>

      {/* Blotter Routes */}
      <Route path="/blotter" element={<BlotterLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="Blotter Dashboard" />} />
        <Route path="docket" element={<PagePlaceholder title="Docket Books" />} />
        <Route path="new-complaints" element={<PagePlaceholder title="New Complaints" />} />
        <Route path="all-complaints" element={<PagePlaceholder title="All Complaints" />} />
        <Route path="reports" element={<PagePlaceholder title="Reports" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>

      {/* Lupong Tagapamayapa Routes */}
      <Route path="/lupongtagapamayapa" element={<LupongTagapamayapaLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="Lupon Dashboard" />} />
        <Route path="reports" element={<PagePlaceholder title="Lupon Reports" />} />
      </Route>

      {/* DCPC Routes */}
      <Route path="/dcpc" element={<DcpcLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="DCPC Dashboard" />} />
        <Route path="reports" element={<PagePlaceholder title="DCPC Reports" />} />
      </Route>

      {/* Vawc Routes */}
      <Route path="/vawc" element={<VawcLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="VAWC Dashboard" />} />
        <Route path="cases" element={<PagePlaceholder title="VAWC Cases" />} />
        <Route path="reports" element={<PagePlaceholder title="VAWC Reports" />} />
      </Route>


      {/* Clearance Routes */}
      <Route path="/clearance" element={<ClearanceLayout />}>
        <Route path="dashboard" element={<ClearanceDashboard />} />
        <Route path="templates" element={<ClearanceTemplatesPage />} />
        <Route path="issued-certificates" element={<IssuedCertificatePage />} />
        <Route path="revenue-and-collection" element={<RevenueAndCollectionPage />} />
        <Route path="issue-certificate" element={<IssueCertificatePage />} />
        <Route path="settings" element={<ClearanceSettings />} />
        <Route path="main-template" element={<MainTemplatePage />} />
      </Route>



      {/* First Time Job Seeker Routes */}
      <Route path="/first-time-job-seeker" element={<FirstTimeJobSeekerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="First Time Job Seeker Dashboard" />} />
        <Route path="reports" element={<PagePlaceholder title="First Time Job Seeker Reports" />} />
      </Route>



      {/* Officials Routes */}
      <Route path="/officials" element={<OfficialLayout />}>
        <Route path="dashboard" element={<PagePlaceholder title="Dashboard" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>
    </Routes>
  )
}

export default App
