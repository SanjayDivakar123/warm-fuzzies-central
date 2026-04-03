import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

/** First stage is onboarding (no "Hiring" — narrative starts once the team is forming). */
const data = [
  { stage: "Onboarding",      perceived: 79, actual: 56, optimized: 74 },
  { stage: "Early Execution", perceived: 77, actual: 44, optimized: 82 },
  { stage: "Collaboration",   perceived: 75, actual: 34, optimized: 90 },
  { stage: "Scaling",         perceived: 73, actual: 28, optimized: 94 },
  { stage: "Deadlines",       perceived: 71, actual: 22, optimized: 97 },
];

const chartConfig = {
  perceived: {
    label: "Perceived Performance",
    color: "hsl(210 80% 56%)",
  },
  actual: {
    label: "Actual Performance",
    color: "hsl(0 72% 56%)",
  },
  optimized: {
    label: "With RoleColor™",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-md text-xs min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-background flex-shrink-0"
                style={{ borderColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
              </span>
            </div>
            <span className="font-mono font-semibold text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamPerformanceChart({
  compact = false,
  viewport = false,
}: {
  compact?: boolean;
  /** Marketing slide layout: fills parent height for a stronger performance-gap visual. */
  viewport?: boolean;
}) {
  const chartHeight = viewport
    ? "h-full min-h-[150px] flex-1 aspect-auto w-full"
    : compact
      ? "h-[200px] w-full"
      : "h-[280px] w-full";
  const yDomain = viewport ? [20, 100] : [10, 100];

  return (
    <div
      className={
        viewport
          ? "flex h-full min-h-0 w-full flex-1 flex-col p-2 sm:p-2.5 pb-1"
          : compact
            ? "w-full"
            : "rounded-2xl border border-border bg-muted/50 p-6 sm:p-8"
      }
    >
      {!compact && !viewport && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">The Performance Gap</p>
          <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug mb-1">
            The Gap Between How Teams Are Perceived, How They Operate, and How They Could Perform
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Most leaders believe their teams are performing well. The data tells a different story.
          </p>
        </>
      )}

      <ChartContainer config={chartConfig} className={cn(chartHeight)}>
        <LineChart
          data={data}
          margin={
            viewport
              ? { top: 8, right: 4, left: -8, bottom: 0 }
              : { top: 10, right: 10, left: -10, bottom: 0 }
          }
        >
          <CartesianGrid
            strokeDasharray="4 8"
            vertical={false}
            stroke="currentColor"
            className="text-border/60"
          />
          <XAxis
            dataKey="stage"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: viewport ? 9 : 11 }}
            tickMargin={viewport ? 6 : 10}
            interval={0}
            className="text-muted-foreground"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: viewport ? 9 : 11 }}
            tickFormatter={(v) => `${v}%`}
            domain={yDomain}
            tickMargin={8}
            className="text-muted-foreground"
          />
          <ChartTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--border))" }} />

          {/* Gap shading via reference area replaced with lines */}
          <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="3 6" strokeOpacity={0.5} />

          <Line
            dataKey="perceived"
            type="monotone"
            stroke={chartConfig.perceived.color}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 3, fill: chartConfig.perceived.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="actual"
            type="monotone"
            stroke={chartConfig.actual.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: chartConfig.actual.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="optimized"
            type="monotone"
            stroke={chartConfig.optimized.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: chartConfig.optimized.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>

      {/* Legend */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-center text-muted-foreground",
          viewport ? "mt-0.5 gap-1 text-[8px] leading-tight" : "mt-4 gap-4 text-xs"
        )}
      >
        {Object.entries(chartConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-background flex-shrink-0"
              style={{ borderColor: cfg.color }}
            />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Callout — hidden in compact / viewport mode */}
      {!compact && !viewport && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 px-3 py-2.5">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-0.5">What leaders believe</p>
            <p className="text-muted-foreground">~78% average engagement assumed</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-3 py-2.5">
            <p className="font-semibold text-red-700 dark:text-red-400 mb-0.5">What's actually happening</p>
            <p className="text-muted-foreground">21% engagement. 86% collaboration issues.</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 px-3 py-2.5">
            <p className="font-semibold text-green-700 dark:text-green-400 mb-0.5">With RoleColor™</p>
            <p className="text-muted-foreground">5x performance likelihood. Better alignment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
