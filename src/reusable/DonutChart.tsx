import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  dateRange: string;
  data: ChartData[];
}

const DonutChart: React.FC<DonutChartProps> = ({ title, dateRange, data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
      {/* Header Section */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-400 font-medium">{dateRange}</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-5">
        {/* Actual Chart */}
        <div className="w-full h-56 md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend Layout */}
        <div className="w-full md:w-1/2 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-gray-600 font-semibold">{item.name}</span>
              </div>
              <span className="text-gray-900 font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonutChart;