
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface LineChartProps {
  data: any[];
  lines: {
    dataKey: string;
    color: string;
    name: string;
  }[];
  xAxisDataKey: string;
  formatter?: (value: number) => string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (value: number) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value as number) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  lines, 
  xAxisDataKey, 
  formatter, 
  height = 300
}) => {
  // Use the formatter provided or default to the value itself
  const valueFormatter = formatter || ((value: number) => `${value}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tickFormatter={valueFormatter}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            name={line.name}
            activeDot={{ r: 6 }}
            strokeWidth={2}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
