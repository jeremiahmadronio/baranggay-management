import React from 'react';
import DonutChart from '../reusable/DonutChart';

export default function ChartPage() {
  const complaintsData = [
    { name: 'Physical Abuse', value: 15, color: '#e53935' },
    { name: 'Psychological', value: 12, color: '#8e24aa' },
    { name: 'Neglect', value: 8, color: '#fb8c00' },
    { name: 'Sexual Abuse', value: 5, color: '#546e7a' },
    { name: 'Bullying', value: 4, color: '#1e88e5' },
    { name: 'Others', value: 3, color: '#43a047' },
  ];

  return (
    <div className="p-10  min-h-screen">
      <DonutChart 
        title="Nature of Complaints Distribution"
        dateRange="January 1, 2026 — February 19, 2026"
        data={complaintsData}
      />
    </div>
  );
};

