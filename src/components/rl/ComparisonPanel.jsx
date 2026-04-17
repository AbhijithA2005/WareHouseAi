import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCompareArrows, Loader2, CheckCircle2 } from 'lucide-react';
import { createTrainer, runBatch } from '@/lib/rl/trainer';
import TrainingCharts from './TrainingCharts';

export default function ComparisonPanel({ currentConfig, currentMetrics }) {
  const [compMetrics, setCompMetrics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [compAlgo, setCompAlgo] = useState(null);

  const runComparison = useCallback(() => {
    const otherAlgo = currentConfig.algorithm === 'qlearning' ? 'sarsa' : 'qlearning';
    setCompAlgo(otherAlgo);
    setIsRunning(true);

    const trainer = createTrainer({
      ...currentConfig,
      algorithm: otherAlgo,
    });

    // Run all episodes in batches
    const interval = setInterval(() => {
      if (trainer.currentEpisode >= trainer.numEpisodes) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      runBatch(trainer, 50);
      setCompMetrics({ ...trainer.metrics });
    }, 10);
  }, [currentConfig]);

  const algoLabel = (algo) => algo === 'qlearning' ? 'Q-Learning' : 'SARSA';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Algorithm Comparison</h3>
          <p className="text-xs text-muted-foreground">
            Compare {algoLabel(currentConfig.algorithm)} against {algoLabel(currentConfig.algorithm === 'qlearning' ? 'sarsa' : 'qlearning')}
          </p>
        </div>
        <Button
          onClick={runComparison}
          disabled={isRunning || !currentMetrics.rewards.length}
          className="gap-2"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GitCompareArrows className="w-4 h-4" />
          )}
          {isRunning ? 'Running...' : 'Run Comparison'}
        </Button>
      </div>

      {!currentMetrics.rewards.length && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Train the primary algorithm first, then run comparison
        </div>
      )}

      {currentMetrics.rewards.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Badge className="bg-primary/20 text-primary border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-primary mr-1.5 inline-block" />
              {algoLabel(currentConfig.algorithm)} (Primary)
            </Badge>
            {compMetrics && (
              <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-1.5 inline-block" />
                {algoLabel(compAlgo)} (Comparison)
              </Badge>
            )}
          </div>

          <TrainingCharts
            metrics={currentMetrics}
            comparisonMetrics={compMetrics}
          />

          {/* Summary Stats */}
          {compMetrics && compMetrics.rewards.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                title={algoLabel(currentConfig.algorithm)}
                metrics={currentMetrics}
                color="primary"
              />
              <SummaryCard
                title={algoLabel(compAlgo)}
                metrics={compMetrics}
                color="orange"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, metrics, color }) {
  const last50Rewards = metrics.rewards.slice(-50);
  const avgReward = last50Rewards.length > 0
    ? last50Rewards.reduce((a, b) => a + b, 0) / last50Rewards.length
    : 0;
  const last50Steps = metrics.steps.slice(-50);
  const avgSteps = last50Steps.length > 0
    ? last50Steps.reduce((a, b) => a + b, 0) / last50Steps.length
    : 0;
  const finalSuccessRate = metrics.cumulativeSuccessRate.length > 0
    ? metrics.cumulativeSuccessRate[metrics.cumulativeSuccessRate.length - 1]
    : 0;

  const borderClass = color === 'primary' ? 'border-primary/30' : 'border-orange-500/30';
  const bgClass = color === 'primary' ? 'bg-primary/5' : 'bg-orange-500/5';
  const textClass = color === 'primary' ? 'text-primary' : 'text-orange-400';

  return (
    <div className={`${bgClass} border ${borderClass} rounded-xl p-4 space-y-2`}>
      <h4 className={`text-sm font-bold ${textClass}`}>{title}</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Reward (last 50)</span>
          <span className="font-mono text-foreground">{avgReward.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Steps (last 50)</span>
          <span className="font-mono text-foreground">{avgSteps.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Final Success Rate</span>
          <span className="font-mono text-foreground">{(finalSuccessRate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Episodes</span>
          <span className="font-mono text-foreground">{metrics.rewards.length}</span>
        </div>
      </div>
    </div>
  );
}