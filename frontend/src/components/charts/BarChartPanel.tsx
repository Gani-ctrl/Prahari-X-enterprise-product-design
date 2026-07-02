import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-[color:var(--color-ink-3)]">{label}</p>
      <p className="mono-tag mt-0.5 font-semibold text-[color:var(--color-ink-0)]">{payload[0].value}</p>
    </div>
  );
}

interface BarChartPanelProps {
  data: BarDatum[];
  color?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
}

/** Generic bar chart used across the Analytics page — one series, per-bar color override supported. */
export function BarChartPanel({ data, color = "var(--color-sentinel-500)", height = 220, layout = "vertical" }: BarChartPanelProps) {
  const isVertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isVertical ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 12, left: isVertical ? 8 : -12, bottom: 0 }}
      >
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={!isVertical} vertical={isVertical} />
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fill: "var(--color-ink-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={120} tick={{ fill: "var(--color-ink-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={{ fill: "var(--color-ink-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--color-ink-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} animationDuration={900}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
