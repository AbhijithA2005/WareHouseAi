import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Footprints, Target, Brain } from 'lucide-react';

export default function MetricsDashboard({ metrics, epsilon, algorithm, currentEpisode }) {
  const lastReward = metrics.rewards.length > 0 ? metrics.rewards[metrics.rewards.length - 1] : 0;
  const lastSteps = metrics.steps.length > 0 ? metrics.steps[metrics.steps.length - 1] : 0;
  const successRate = metrics.cumulativeSuccessRate.length > 0
    ? metrics.cumulativeSuccessRate[metrics.cumulativeSuccessRate.length - 1]
    : 0;
  const lastTdError = metrics.avgTdErrors.length > 0 ? metrics.avgTdErrors[metrics.avgTdErrors.length - 1] : 0;

  // Moving avg reward (last 20)
  const recentRewards = metrics.rewards.slice(-20);
  const avgReward = recentRewards.length > 0
    ? recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length
    : 0;

  const stats = [
    {
      label: 'Episode',
      value: currentEpisode,
      icon: Brain,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Avg Reward (20)',
      value: avgReward.toFixed(1),
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Last Steps',
      value: lastSteps,
      icon: Footprints,
      color: 'text-chart-3',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Success Rate',
      value: `${(successRate * 100).toFixed(1)}%`,
      icon: Target,
      color: 'text-chart-4',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Stats</h3>
        <Badge variant="outline" className="text-xs font-mono">
          {algorithm === 'qlearning' ? 'Q-Learning' : 'SARSA'} · ε={epsilon.toFixed(3)}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-lg p-3 border border-border/30`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2">
        <span>TD Error: <span className="font-mono text-foreground">{lastTdError.toFixed(4)}</span></span>
        <span>Last Reward: <span className={`font-mono ${lastReward >= 0 ? 'text-accent' : 'text-destructive'}`}>{lastReward.toFixed(1)}</span></span>
      </div>
    </div>
  );
}