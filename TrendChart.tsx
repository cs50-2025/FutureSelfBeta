import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ProjectionPoint } from '../../types';

interface TrendChartProps {
  data: ProjectionPoint[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="year" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: 'none', 
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line 
            type="monotone" 
            dataKey="academic" 
            stroke="#6366f1" 
            strokeWidth={2} 
            dot={false}
            name="Academic"
          />
          <Line 
            type="monotone" 
            dataKey="burnout" 
            stroke="#f43f5e" 
            strokeWidth={2} 
            dot={false}
            name="Burnout"
          />
          <Line 
            type="monotone" 
            dataKey="health" 
            stroke="#10b981" 
            strokeWidth={2} 
            dot={false}
            name="Health"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 text-xs mt-1">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Academic
        </div>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div> Burnout Risk
        </div>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Health
        </div>
      </div>
    </div>
  );
};

export default TrendChart;