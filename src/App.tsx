import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout, StaffLayout, UserLayout } from './layout'

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
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="Admin Dashboard" />} />
        <Route path="analytics" element={<PagePlaceholder title="Analytics" />} />
        <Route path="products" element={<PagePlaceholder title="Products" />} />
        <Route path="market" element={<PagePlaceholder title="Market" />} />
        <Route path="predictions" element={<PagePlaceholder title="Predictions" />} />
        <Route path="dietary-tags" element={<PagePlaceholder title="Dietary Tags" />} />
        <Route path="archive-products" element={<PagePlaceholder title="Archive Products" />} />
        <Route path="reports" element={<PagePlaceholder title="Reports" />} />
        <Route path="users" element={<PagePlaceholder title="User Management" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>

      {/* Staff Routes */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PagePlaceholder title="Staff Dashboard" />} />
        <Route path="products" element={<PagePlaceholder title="Products" />} />
        <Route path="market" element={<PagePlaceholder title="Market" />} />
        <Route path="reports" element={<PagePlaceholder title="Reports" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>

      {/* User Routes */}
      <Route path="/" element={<UserLayout />}>
        <Route path="dashboard" element={<PagePlaceholder title="Dashboard" />} />
        <Route path="products" element={<PagePlaceholder title="Products" />} />
        <Route path="market" element={<PagePlaceholder title="Market" />} />
        <Route path="settings" element={<PagePlaceholder title="Settings" />} />
      </Route>
    </Routes>
  )
}

export default App
