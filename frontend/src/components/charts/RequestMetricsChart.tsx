import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RequestMetrics } from '@/types';
import { grafanaColors, getTextColor, getGridColor, getTooltipStyle } from '@/lib/chart-colors';

interface RequestMetricsChartProps {
  data: RequestMetrics;
}

export function RequestMetricsChart({ data }: RequestMetricsChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const colors = isDark ? grafanaColors.dark : grafanaColors.light;
  const textColor = getTextColor(isDark);
  const gridColor = getGridColor(isDark);
  const tooltipStyle = getTooltipStyle(isDark);

  const chartData = [
    {
      name: 'Requests (24h)',
      GET: data.getRequests,
      PUT: data.putRequests,
      DELETE: data.deleteRequests,
      LIST: data.listRequests,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip
          formatter={(value) => (value as number).toLocaleString()}
          contentStyle={tooltipStyle as React.CSSProperties}
          labelStyle={{ color: textColor }}
        />
        <Legend wrapperStyle={{ color: textColor }} />
        <Bar dataKey="GET" stackId="a" fill={colors.blue} />
        <Bar dataKey="PUT" stackId="a" fill={colors.green} />
        <Bar dataKey="DELETE" stackId="a" fill={colors.red} />
        <Bar dataKey="LIST" stackId="a" fill={colors.orange} />
      </BarChart>
    </ResponsiveContainer>
  );
}
