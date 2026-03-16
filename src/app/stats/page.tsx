"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import { Flame, Clock, Target, Layers, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StatsData {
  totalCards: number;
  totalReviews: number;
  accuracy: number;
  bestStreak: number;
  dueNow: number;
  difficultyBuckets: { new: number; hard: number; learning: number; good: number };
  deckStats: Array<{ id: string; title: string; cards: number; accuracy: number; avgInterval: number; dueCount: number }>;
  sessionHistory: Array<{ date: string; accuracy: number; cardCount: number }>;
  heatmap: Array<{ date: string; count: number }>;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function StatsPage() {
  const { data, isLoading } = useSWR<StatsData>("/api/stats", fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Statistics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your learning at a glance</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading || !data ? (
          <StatsSkeleton />
        ) : (
          <motion.div
            className="flex flex-col gap-6 max-w-4xl"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* Hero tiles */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile
                value={data.totalCards}
                label="total cards"
                icon={<Layers size={13} className="text-muted-foreground" />}
              />
              <StatTile
                value={data.totalReviews}
                label="total reviews"
                icon={<TrendingUp size={13} className="text-muted-foreground" />}
              />
              <StatTile
                value={`${data.accuracy}%`}
                label="accuracy"
                icon={<Target size={13} className="text-muted-foreground" />}
                highlight={data.accuracy >= 80}
              />
              <StatTile
                value={data.bestStreak}
                label="best streak"
                icon={<Flame size={13} className="text-warning" />}
              />
            </motion.div>

            {/* Due now */}
            {data.dueNow > 0 && (
              <motion.div variants={item}>
                <DueSection data={data} />
              </motion.div>
            )}

            {/* Accuracy chart + Difficulty side by side */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AccuracyChart sessions={data.sessionHistory} />
              <DifficultyChart buckets={data.difficultyBuckets} total={data.totalCards} />
            </motion.div>

            {/* Heatmap */}
            <motion.div variants={item}>
              <Heatmap data={data.heatmap} />
            </motion.div>

            {/* Deck table */}
            {data.deckStats.length > 0 && (
              <motion.div variants={item}>
                <DeckTable decks={data.deckStats} />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Stat Tile ──────────────────────────────────────────────────────────────────

function StatTile({
  value,
  label,
  icon,
  highlight = false,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-background-2 border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <span
        className={`font-mono text-2xl font-semibold tabular-nums leading-none ${
          highlight ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Due section ────────────────────────────────────────────────────────────────

function DueSection({ data }: { data: StatsData }) {
  const { dueNow, difficultyBuckets, totalCards } = data;
  const newCards = difficultyBuckets.new;
  const reviewCards = dueNow - Math.min(dueNow, newCards);

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs font-medium text-foreground">
          <span className="font-mono text-base mr-1.5">{dueNow}</span>
          cards due now
        </span>
        <span className="text-[10px] text-muted-foreground">
          {newCards} new · {reviewCards} review
        </span>
      </div>
      {/* Due breakdown bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px bg-background-3">
        {newCards > 0 && (
          <div
            className="h-full rounded-full bg-[var(--chart-4)]"
            style={{ width: `${(newCards / totalCards) * 100}%` }}
          />
        )}
        {reviewCards > 0 && (
          <div
            className="h-full rounded-full bg-[var(--chart-1)]"
            style={{ width: `${(reviewCards / totalCards) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

// ── Accuracy chart ─────────────────────────────────────────────────────────────

function AccuracyChart({ sessions }: { sessions: StatsData["sessionHistory"] }) {
  const W = 300;
  const H = 80;
  const PAD = 8;

  if (sessions.length < 2) {
    return (
      <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">accuracy over time</span>
          <Clock size={13} className="text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground py-4 text-center">
          Complete more sessions to see trends
        </p>
      </div>
    );
  }

  const points = sessions.map((s, i) => ({
    x: PAD + (i / (sessions.length - 1)) * (W - PAD * 2),
    y: PAD + ((100 - s.accuracy) / 100) * (H - PAD * 2),
    accuracy: s.accuracy,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `${points[0].x},${H}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${H}`,
  ].join(" ");

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">accuracy over time</span>
        <span className="font-mono text-xs text-foreground">
          {sessions[sessions.length - 1].accuracy}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Gridlines */}
        {[25, 50, 75].map((v) => {
          const y = PAD + ((100 - v) / 100) * (H - PAD * 2);
          return (
            <line
              key={v}
              x1={PAD}
              y1={y}
              x2={W - PAD}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          );
        })}
        {/* Area fill */}
        <polygon points={area} fill="url(#area-grad)" />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="var(--chart-1)" />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>oldest</span>
        <span>{sessions.length} sessions</span>
        <span>latest</span>
      </div>
    </div>
  );
}

// ── Difficulty chart ───────────────────────────────────────────────────────────

function DifficultyChart({
  buckets,
  total,
}: {
  buckets: StatsData["difficultyBuckets"];
  total: number;
}) {
  const bars = [
    { label: "New", count: buckets.new, color: "var(--muted-foreground)" },
    { label: "Hard", count: buckets.hard, color: "var(--chart-5)" },
    { label: "Learning", count: buckets.learning, color: "var(--chart-4)" },
    { label: "Good", count: buckets.good, color: "var(--chart-2)" },
  ];

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <span className="text-xs text-muted-foreground">card difficulty</span>
      <div className="flex flex-col gap-2.5 mt-1">
        {bars.map(({ label, count, color }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-14 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-background-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground w-6 text-right shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Heatmap ────────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Heatmap({ data }: { data: StatsData["heatmap"] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // Split into weeks (columns of 7)
  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Month labels: find weeks where month changes
  const monthLabels: { weekIdx: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0].date);
    if (wi === 0 || new Date(weeks[wi - 1][0].date).getMonth() !== firstDay.getMonth()) {
      monthLabels.push({
        weekIdx: wi,
        label: firstDay.toLocaleDateString("en", { month: "short" }),
      });
    }
  });

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <span className="text-xs text-muted-foreground">study activity — last 12 weeks</span>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] shrink-0 pt-5">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="h-[10px] text-[9px] text-muted-foreground leading-none flex items-center"
              style={{ opacity: i % 2 === 0 ? 1 : 0 }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-0 min-w-0">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 h-4">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.weekIdx === wi);
              return (
                <div key={wi} className="w-[10px] text-[9px] text-muted-foreground leading-none shrink-0">
                  {ml ? ml.label : ""}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const intensity = day.count === 0 ? 0 : 0.2 + (day.count / maxCount) * 0.8;
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                      className="w-[10px] h-[10px] rounded-[2px]"
                      style={{
                        backgroundColor:
                          day.count === 0
                            ? "var(--background-3)"
                            : `color-mix(in oklch, var(--chart-1) ${Math.round(intensity * 100)}%, var(--background-3))`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Deck table ─────────────────────────────────────────────────────────────────

function DeckTable({ decks }: { decks: StatsData["deckStats"] }) {
  return (
    <div className="rounded-lg bg-background-2 border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs text-muted-foreground">decks</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground">name</th>
            <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground">cards</th>
            <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground">accuracy</th>
            <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground">avg interval</th>
            <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground">due</th>
          </tr>
        </thead>
        <tbody>
          {decks.map((deck, i) => (
            <tr
              key={deck.id}
              className={i < decks.length - 1 ? "border-b border-border" : ""}
            >
              <td className="px-4 py-2.5 text-foreground font-medium truncate max-w-[160px]">
                {deck.title}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{deck.cards}</td>
              <td className="px-4 py-2.5 text-right font-mono">
                <span
                  className={
                    deck.accuracy >= 80
                      ? "text-success"
                      : deck.accuracy >= 60
                      ? "text-warning"
                      : "text-destructive"
                  }
                >
                  {deck.cards > 0 && deck.accuracy === 0 && deck.cards === 0 ? "—" : `${deck.accuracy}%`}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                {deck.avgInterval > 0 ? `${deck.avgInterval}d` : "—"}
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                {deck.dueCount > 0 ? (
                  <span className="text-warning">{deck.dueCount}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-background-2" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="h-44 rounded-lg bg-background-2" />
        <div className="h-44 rounded-lg bg-background-2" />
      </div>
      <div className="h-32 rounded-lg bg-background-2" />
      <div className="h-40 rounded-lg bg-background-2" />
    </div>
  );
}
