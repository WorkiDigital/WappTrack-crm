
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, TooltipProps } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface BarChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  barColor?: string;
  label?: string;
  formatter?: (value: number) => string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (value: number) => string }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    return (
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-primary">
          {formatter ? formatter(value) : value}
        </p>
      </div>
    );
  }
  return null;
};

const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  nameKey,
  barColor = '#10B981',
  label,
  formatter,
  height = 300
}) => {
  // Use the formatter provided or default to the value itself
  const valueFormatter = formatter || ((value: number) => `${value}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey={nameKey} 
          angle={-45}
          textAnchor="end"
          height={80}
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
        {label && <Legend />}
        <Bar 
          dataKey={dataKey} 
          fill={barColor}
          name={label || dataKey}
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
