import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DashboardTrendPoint } from "@/types";

interface TrendAreaChartProps {
  data: DashboardTrendPoint[];
  color?: string;
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-[color:var(--color-ink-3)]">
        {new Date(label).toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
      </p>
      <p className="mono-tag mt-0.5 font-semibold text-[color:var(--color-ink-0)]">{payload[0].value}</p>
    </div>
  );
}

export function TrendAreaChart({ data, color = "var(--color-sentinel-500)", height = 180 }: TrendAreaChartProps) {
  const gradientId = `grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
