import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data, size = 160 }: { data: DonutSlice[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={size / 2 - 22}
            outerRadius={size / 2 - 6}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            animationDuration={1000}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono-tag text-xl font-semibold text-[color:var(--color-ink-0)]">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-3)]">Total</span>
      </div>
    </div>
  );
}
