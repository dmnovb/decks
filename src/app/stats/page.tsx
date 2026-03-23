"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import {
  Flame,
  Clock,
  Target,
  Layers,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StatsData {
  totalCards: number;
  totalReviews: number;
  accuracy: number;
  bestStreak: number;
  dueNow: number;
  difficultyBuckets: {
    new: number;
    hard: number;
    learning: number;
    good: number;
  };
  deckStats: Array<{
    id: string;
    title: string;
    cards: number;
    accuracy: number;
    avgInterval: number;
    dueCount: number;
  }>;
  sessionHistory: Array<{ date: string; accuracy: number; cardCount: number }>;
  heatmap: Array<{ date: string; count: number }>;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function StatsPage() {
  const { data, isLoading } = useSWR<StatsData>("/api/stats", fetcher, {
    revalidateOnFocus: false,
  });

  const derived = data
    ? {
        sessionCount: data.sessionHistory.length,
        avgCardsPerSession:
          data.sessionHistory.length > 0
            ? Math.round(
                data.sessionHistory.reduce((a, b) => a + b.cardCount, 0) /
                  data.sessionHistory.length,
              )
            : 0,
        accuracyTrend: (() => {
          const s = data.sessionHistory;
          if (s.length < 4) return 0;
          const half = Math.floor(s.length / 2);
          const recent =
            s.slice(-half).reduce((a, b) => a + b.accuracy, 0) / half;
          const earlier =
            s.slice(0, half).reduce((a, b) => a + b.accuracy, 0) / half;
          return Math.round(recent - earlier);
        })(),
      }
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Statistics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your learning at a glance
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {isLoading || !data || !derived ? (
          <StatsSkeleton />
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* ── Hero tiles ─────────────────────────────────────────── */}
            <motion.div
              variants={item}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              <StatTile
                value={data.totalCards}
                label="cards"
                icon={<Layers size={12} />}
              />
              <StatTile
                value={data.totalReviews}
                label="reviews"
                icon={<TrendingUp size={12} />}
              />
              <StatTile
                value={`${data.accuracy}%`}
                label="accuracy"
                icon={<Target size={12} />}
                highlight={data.accuracy >= 80}
                trend={derived.accuracyTrend}
              />
              <StatTile
                value={data.bestStreak}
                label="best streak"
                icon={<Flame size={12} className="text-warning" />}
              />
              <StatTile
                value={derived.sessionCount}
                label="sessions"
                icon={<Clock size={12} />}
              />
              <StatTile
                value={derived.avgCardsPerSession || "—"}
                label="avg / session"
                icon={<BookOpen size={12} />}
              />
            </motion.div>

            {/* ── Charts row ─────────────────────────────────────────── */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Accuracy chart — 2 cols */}
              {/* <div className="col-span-2">
                <AccuracyChart sessions={data.sessionHistory} />
              </div> */}

              {/* Right stack — 1 col */}
              <div className="flex flex-col gap-3">
                <DifficultyChart
                  buckets={data.difficultyBuckets}
                  total={data.totalCards}
                />
                {data.dueNow > 0 && <DueSection data={data} />}
              </div>
            </motion.div>

            {/* ── Heatmap ────────────────────────────────────────────── */}
            <motion.div variants={item}>
              <Heatmap data={data.heatmap} />
            </motion.div>

            {/* ── Deck table ─────────────────────────────────────────── */}
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
  trend,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
  trend?: number;
}) {
  return (
    <div className="flex flex-col justify-between p-4 rounded-lg bg-background-2 border border-border gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className={`font-mono text-2xl font-semibold tabular-nums leading-none ${
            highlight ? "text-success" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`text-[10px] font-mono flex items-center gap-0.5 mb-0.5 ${
              trend > 0 ? "text-success" : "text-destructive"
            }`}
          >
            {trend > 0 ? (
              <ArrowUpRight size={10} />
            ) : (
              <ArrowDownRight size={10} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Accuracy chart ─────────────────────────────────────────────────────────────

function AccuracyChart({
  sessions,
}: {
  sessions: StatsData["sessionHistory"];
}) {
  const W = 500;
  const H = 140;
  const PAD_L = 28;
  const PAD_R = 12;
  const PAD_Y = 12;

  if (sessions.length < 2) {
    return (
      <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3 min-h-[200px] justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
            Accuracy over time
          </span>
          <Clock size={12} className="text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground text-center pb-4">
          Complete more sessions to see trends
        </p>
      </div>
    );
  }

  const points = sessions.map((s, i) => ({
    x: PAD_L + (i / (sessions.length - 1)) * (W - PAD_L - PAD_R),
    y: PAD_Y + ((100 - s.accuracy) / 100) * (H - PAD_Y * 2),
    accuracy: s.accuracy,
    cardCount: s.cardCount,
  }));

  // Smooth cubic bezier path
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const latest = sessions[sessions.length - 1].accuracy;

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          Accuracy over time
        </span>
        <span className="font-mono text-sm text-foreground">{latest}%</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines + labels */}
        {[25, 50, 75, 100].map((v) => {
          const y = PAD_Y + ((100 - v) / 100) * (H - PAD_Y * 2);
          return (
            <g key={v}>
              <line
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
              <text
                x={PAD_L - 5}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="8"
                fill="var(--muted-foreground)"
                fontFamily="monospace"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#area-grad)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="var(--chart-1)"
            stroke="var(--background-2)"
            strokeWidth="1.5"
          >
            <title>
              {p.accuracy}% — {p.cardCount} cards
            </title>
          </circle>
        ))}
      </svg>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>first</span>
        <span className="font-mono">{sessions.length} sessions</span>
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
    <div className="flex-1 p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
        Card distribution
      </span>

      {/* Stacked overview bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {bars.map(({ label, count, color }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={label}
              className="h-full"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          );
        })}
      </div>

      {/* Breakdown rows */}
      <div className="flex flex-col gap-2.5">
        {bars.map(({ label, count, color }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-muted-foreground flex-1">
                {label}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {count}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Due section ────────────────────────────────────────────────────────────────

function DueSection({ data }: { data: StatsData }) {
  const { dueNow, difficultyBuckets } = data;
  const newCards = Math.min(difficultyBuckets.new, dueNow);
  const reviewCards = dueNow - newCards;

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
        Due now
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-semibold text-warning tabular-nums leading-none">
          {dueNow}
        </span>
        <span className="text-xs text-muted-foreground">cards</span>
      </div>
      <div className="flex gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--chart-4)" }}
          />
          <span className="text-muted-foreground">{newCards} new</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--chart-1)" }}
          />
          <span className="text-muted-foreground">{reviewCards} review</span>
        </div>
      </div>
    </div>
  );
}

// ── Heatmap ────────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Heatmap({ data }: { data: StatsData["heatmap"] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const totalSessions = data.reduce((a, b) => a + b.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  const weeks: (typeof data)[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const monthLabels: { weekIdx: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    if (!week[0]) return;
    const firstDay = new Date(week[0].date);
    if (
      wi === 0 ||
      new Date(weeks[wi - 1]?.[0]?.date ?? "").getMonth() !==
        firstDay.getMonth()
    ) {
      monthLabels.push({
        weekIdx: wi,
        label: firstDay.toLocaleDateString("en", { month: "short" }),
      });
    }
  });

  return (
    <div className="p-4 rounded-lg bg-background-2 border border-border flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          Study activity — last 12 weeks
        </span>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          <span>{totalSessions} sessions</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] shrink-0 pt-5">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="h-[12px] text-[9px] text-muted-foreground leading-none flex items-center"
              style={{ opacity: i % 2 === 0 ? 0.7 : 0 }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-0 flex-1 min-w-0">
          {/* Month labels */}
          <div className="flex gap-[4px] mb-1 h-4">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.weekIdx === wi);
              return (
                <div
                  key={wi}
                  className="w-[12px] text-[9px] text-muted-foreground leading-none shrink-0"
                >
                  {ml ? ml.label : ""}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="flex gap-[4px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[4px]">
                {week.map((day) => {
                  const intensity =
                    day.count === 0 ? 0 : 0.2 + (day.count / maxCount) * 0.8;
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                      className="w-[12px] h-[12px] rounded-[2px]"
                      style={{
                        backgroundColor:
                          day.count === 0
                            ? "var(--background-3)"
                            : `color-mix(in oklch, var(--chart-2) ${Math.round(intensity * 100)}%, var(--background-3))`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-end gap-1 shrink-0 pb-0.5">
          <span className="text-[9px] text-muted-foreground">less</span>
          <div className="flex flex-col gap-[4px]">
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <div
                key={v}
                className="w-[12px] h-[12px] rounded-[2px]"
                style={{
                  backgroundColor:
                    v === 0
                      ? "var(--background-3)"
                      : `color-mix(in oklch, var(--chart-2) ${Math.round((0.2 + v * 0.8) * 100)}%, var(--background-3))`,
                }}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">more</span>
        </div>
      </div>
    </div>
  );
}

// ── Deck table ─────────────────────────────────────────────────────────────────

function DeckTable({ decks }: { decks: StatsData["deckStats"] }) {
  return (
    <div className="rounded-lg bg-background-2 border border-border overflow-hidden">
      <div className="overflow-x-auto">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          Deck performance
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {decks.length} deck{decks.length !== 1 ? "s" : ""}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {["Name", "Cards", "Accuracy", "Avg interval", "Due"].map(
              (h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2 text-[10px] font-medium tracking-widest uppercase text-muted-foreground ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {decks.map((deck, i) => (
            <tr
              key={deck.id}
              className={`transition-colors hover:bg-background-3/50 ${
                i < decks.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <td className="px-4 py-2.5 text-foreground font-medium truncate max-w-[200px]">
                {deck.title}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                {deck.cards}
              </td>
              <td className="px-4 py-2.5 text-right font-mono">
                <span
                  className={
                    deck.accuracy >= 80
                      ? "text-success"
                      : deck.accuracy >= 60
                        ? "text-warning"
                        : deck.accuracy === 0
                          ? "text-muted-foreground"
                          : "text-destructive"
                  }
                >
                  {deck.accuracy === 0 ? "—" : `${deck.accuracy}%`}
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
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-background-2" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-2 h-56 rounded-lg bg-background-2" />
        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-lg bg-background-2" />
          <div className="h-28 rounded-lg bg-background-2" />
        </div>
      </div>
      <div className="h-32 rounded-lg bg-background-2" />
      <div className="h-40 rounded-lg bg-background-2" />
    </div>
  );
}
