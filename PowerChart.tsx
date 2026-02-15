import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface PowerChartProps {
  stats: {
    intelligence: number;
    vitality: number;
    strength: number;
    discipline: number;
    peace: number;
  };
}

const PowerChart: React.FC<PowerChartProps> = ({ stats }) => {
  const data = [
    { subject: 'Intelligence', A: stats.intelligence, fullMark: 100 },
    { subject: 'Vitality', A: stats.vitality, fullMark: 100 },
    { subject: 'Strength', A: stats.strength, fullMark: 100 },
    { subject: 'Discipline', A: stats.discipline, fullMark: 100 },
    { subject: 'Peace', A: stats.peace, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 md:h-80 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="My Stats"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={2}
            fill="#6366f1"
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PowerChart;
