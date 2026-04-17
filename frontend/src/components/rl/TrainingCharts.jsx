import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { movingAverage } from '@/lib/rl/trainer';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">Episode {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

function MetricsAnalysis({ metrics, comparisonMetrics }) {
  const analysis = useMemo(() => {
    const analyze = (m, label) => {
      if (!m || !m.rewards.length) return null;
      
      const successThreshold = 0.9;
      const convergenceEpisode = m.cumulativeSuccessRate.findIndex(r => r >= successThreshold) + 1;
      
      const last50Rewards = m.rewards.slice(-50);
      const stability = last50Rewards.length > 1 
        ? Math.sqrt(last50Rewards.reduce((s, r) => s + Math.pow(r - (last50Rewards.reduce((a, b) => a + b, 0) / last50Rewards.length), 2), 0) / last50Rewards.length)
        : 0;

      return { label, convergenceEpisode, stability };
    };

    const primary = analyze(metrics, 'Primary');
    const comparison = analyze(comparisonMetrics, 'Comparison');

    return { primary, comparison };
  }, [metrics, comparisonMetrics]);

  if (!analysis.primary) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-primary rounded-full transition-all" />
        Automated Performance Analysis
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Convergence:</strong> {analysis.primary.convergenceEpisode > 0 
              ? `Stabilized at 90% success by episode ${analysis.primary.convergenceEpisode}.` 
              : "Yet to consolidate at 90% success threshold."}
            {analysis.comparison && analysis.comparison.convergenceEpisode > 0 && (
              <span className="block mt-1">
                {(analysis.primary.convergenceEpisode || 9999) < analysis.comparison.convergenceEpisode 
                  ? "Primary algorithm reached peak performance faster." 
                  : "Comparison algorithm converged more rapidly."}
              </span>
            )}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Stability Analysis:</strong> Current reward variance is {analysis.primary.stability.toFixed(2)}.
            {analysis.comparison && (
               <span className="block mt-1">
                 {analysis.primary.stability < analysis.comparison.stability 
                   ? "Primary policy is currently more stable (less erratic)." 
                   : "Comparison policy shows higher consistency in rewards."}
               </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrainingCharts({ metrics, comparisonMetrics }) {
  const rewardData = useMemo(() => {
    const smoothed = movingAverage(metrics.rewards, 20);
    return metrics.rewards.map((r, i) => ({
      episode: i + 1,
      reward: r,
      smoothed: smoothed[i],
      ...(comparisonMetrics?.rewards?.[i] !== undefined && {
        compReward: comparisonMetrics.rewards[i],
        compSmoothed: movingAverage(comparisonMetrics.rewards, 20)[i],
      }),
    }));
  }, [metrics.rewards, comparisonMetrics]);

  const stepsData = useMemo(() => {
    const smoothed = movingAverage(metrics.steps, 20);
    return metrics.steps.map((s, i) => ({
      episode: i + 1,
      steps: s,
      smoothed: smoothed[i],
      ...(comparisonMetrics?.steps?.[i] !== undefined && {
        compSteps: comparisonMetrics.steps[i],
        compSmoothed: movingAverage(comparisonMetrics.steps, 20)[i],
      }),
    }));
  }, [metrics.steps, comparisonMetrics]);

  const successData = useMemo(() => {
    return metrics.cumulativeSuccessRate.map((r, i) => ({
      episode: i + 1,
      rate: r * 100,
      ...(comparisonMetrics?.cumulativeSuccessRate?.[i] !== undefined && {
        compRate: comparisonMetrics.cumulativeSuccessRate[i] * 100,
      }),
    }));
  }, [metrics.cumulativeSuccessRate, comparisonMetrics]);

  const epsilonData = useMemo(() => {
    return metrics.epsilons.map((e, i) => ({
      episode: i + 1,
      epsilon: e,
    }));
  }, [metrics.epsilons]);

  const hasComparison = !!comparisonMetrics;

  if (!metrics.rewards.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Start training to see charts
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MetricsAnalysis metrics={metrics} comparisonMetrics={comparisonMetrics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Reward Curve */}
      <ChartCard title="Reward per Episode" subtitle="Moving avg (window=20)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={rewardData}>
            <defs>
              <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187 85% 53%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(187 85% 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="compRewardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(25 95% 53%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(25 95% 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="episode" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="reward" stroke="hsl(187 85% 53%)" fill="url(#rewardGrad)" strokeWidth={0.5} opacity={0.3} name="Raw" />
            <Line type="monotone" dataKey="smoothed" stroke="hsl(187 85% 53%)" strokeWidth={2} dot={false} name="Avg Reward" />
            {hasComparison && (
              <>
                <Area type="monotone" dataKey="compReward" stroke="hsl(25 95% 53%)" fill="url(#compRewardGrad)" strokeWidth={0.5} opacity={0.3} name="Comp Raw" />
                <Line type="monotone" dataKey="compSmoothed" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} name="Comp Avg" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Steps per Episode */}
      <ChartCard title="Steps per Episode" subtitle="Lower is better">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stepsData}>
            <defs>
              <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 70% 45%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(142 70% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="episode" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="steps" stroke="hsl(142 70% 45%)" fill="url(#stepsGrad)" strokeWidth={0.5} opacity={0.3} name="Raw" />
            <Line type="monotone" dataKey="smoothed" stroke="hsl(142 70% 45%)" strokeWidth={2} dot={false} name="Avg Steps" />
            {hasComparison && (
              <Line type="monotone" dataKey="compSmoothed" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} name="Comp Avg" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Success Rate */}
      <ChartCard title="Cumulative Success Rate" subtitle="% of episodes reaching the goal">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={successData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="episode" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="rate" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={false} name="Success %" />
            {hasComparison && (
              <Line type="monotone" dataKey="compRate" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} name="Comp %" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Epsilon Decay */}
      <ChartCard title="Exploration Rate (ε)" subtitle="Epsilon decay over episodes">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={epsilonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="episode" tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="epsilon" stroke="hsl(340 75% 55%)" strokeWidth={2} dot={false} name="ε" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}