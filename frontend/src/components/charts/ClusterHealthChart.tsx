import {useEffect, useState} from 'react';
import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {ClusterHealth} from '@/types';
import {getGridColor, getTextColor, getTooltipStyle, grafanaColors} from '@/lib/chart-colors';

interface ClusterHealthChartProps {
  data: ClusterHealth;
}

export function ClusterHealthChart({ data }: ClusterHealthChartProps) {
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
  const unhealthyColor = isDark ? '#e8e8e8' : '#d1d5db';

  const chartData = [
    {
      metric: 'Nodes',
      healthy: data.storageNodesUp,
      unhealthy: data.storageNodes - data.storageNodesUp,
    },
    {
      metric: 'Partitions',
      healthy: data.partitionsAllOk,
      unhealthy: data.partitions - data.partitionsAllOk,
    },
    {
      metric: 'Connected',
      healthy: data.connectedNodes,
      unhealthy: data.knownNodes - data.connectedNodes,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="metric" stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip
          contentStyle={tooltipStyle as React.CSSProperties}
          labelStyle={{ color: textColor }}
        />
        <Legend wrapperStyle={{ color: textColor }} />
        <Bar dataKey="healthy" stackId="a" fill={colors.green} name="Healthy" />
        <Bar dataKey="unhealthy" stackId="a" fill={unhealthyColor} name="Unhealthy" />
      </BarChart>
    </ResponsiveContainer>
  );
}
