import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  month: string;
  total: number;
  resolved: number;
}

interface BarChartProps {
  title: string;
  data: ChartData[];
}

const BarChartComponent: React.FC<BarChartProps> = ({ title, data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full font-sans">
      <h3 className="text-lg font-bold text-gray-800 mb-8">{title}</h3>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            barGap={4} 
            barCategoryGap="25%" 
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={true} 
              horizontal={true} 
              stroke="#f1f3f4" 
            />
            
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#70757a', fontSize: 13 }}
              dy={10} 
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#70757a', fontSize: 13 }}
              domain={[0, 16]}
              ticks={[0, 4, 8, 12, 16]}
            />

            <Tooltip 
              cursor={{ fill: '#f8f9fa' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '10px'
              }}
            />

            <Legend 
              verticalAlign="bottom" 
              align="center" 
              iconType="rect"
              iconSize={14}
              wrapperStyle={{ paddingTop: '30px' }}
              formatter={(value) => <span className="text-gray-600 font-medium px-1">{value}</span>}
            />

            <Bar 
              dataKey="total" 
              name="Total Cases" 
              fill="#4285F4" 
              radius={[2, 2, 0, 0]} 
              barSize={14}
            />
            <Bar 
              dataKey="resolved" 
              name="Resolved" 
              fill="#34A853" 
              radius={[2, 2, 0, 0]} 
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;