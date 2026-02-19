import React from 'react';
import DonutChart from '../reusable/DonutChart';
import BarChartComponent from '../reusable/BarChart';

// Data for Donut Chart
const complaintsData = [
  { name: 'Physical Abuse', value: 15, color: '#e53935' },
  { name: 'Psychological', value: 12, color: '#8e24aa' },
  { name: 'Neglect', value: 8, color: '#fb8c00' },
  { name: 'Sexual Abuse', value: 5, color: '#546e7a' },
  { name: 'Bullying', value: 4, color: '#1e88e5' },
  { name: 'Others', value: 3, color: '#43a047' },
];

// Data for Bar Chart
const caseStats = [
  { month: 'Jan', total: 8, resolved: 5 },
  { month: 'Feb', total: 12, resolved: 9 },
  { month: 'Mar', total: 6, resolved: 4 },
  { month: 'Apr', total: 10, resolved: 8 },
  { month: 'May', total: 14, resolved: 11 },
  { month: 'Jun', total: 9, resolved: 7 },
  { month: 'Jul', total: 11, resolved: 8 },
  { month: 'Aug', total: 7, resolved: 5 },
  { month: 'Sep', total: 13, resolved: 10 },
  { month: 'Oct', total: 8, resolved: 6 },
  { month: 'Nov', total: 10, resolved: 7 },
  { month: 'Dec', total: 5, resolved: 3 },
];

export default function ChartPage() {
  return (
    <div className="p-6 min-h-screen space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Barangay Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Donut Chart Section */}
        <div className="w-full">
          <DonutChart 
            title="Nature of Complaints Distribution"
            dateRange="January 1, 2026 — February 19, 2026"
            data={complaintsData}
          />
        </div>

        {/* Bar Chart Section */}
        <div className="w-full">
          <BarChartComponent 
            title="Monthly Case Statistics - 2026"
            data={caseStats}
          />
        </div>

      </div>
    </div>
  );
}