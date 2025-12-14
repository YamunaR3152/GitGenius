import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  let color = '#ea580c'; // Orange-600
  if (score >= 80) color = '#16a34a'; // Green-600
  if (score < 50) color = '#dc2626'; // Red-600

  return (
    <div className="relative h-40 w-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={75}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={10}
          >
            <Cell fill={color} />
            <Cell fill="currentColor" className="text-slate-100 dark:text-slate-700" /> 
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-slate-800 dark:text-white">{score}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">out of 100</span>
      </div>
    </div>
  );
};

export default ScoreGauge;