import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bot, BarChart3, GitCompareArrows, BookOpen } from 'lucide-react';
import GridWorld from '@/components/rl/GridWorld';
import ControlPanel from '@/components/rl/ControlPanel';
import MetricsDashboard from '@/components/rl/MetricsDashboard';
import TrainingCharts from '@/components/rl/TrainingCharts';
import QTableVisualizer from '@/components/rl/QTableVisualizer';
import ComparisonPanel from '@/components/rl/ComparisonPanel';
import AlgorithmInfo from '@/components/rl/AlgorithmInfo';
import { createTrainer, runEpisode, runBatch } from '@/lib/rl/trainer';
import { cloneQTable } from '@/lib/rl/agents';
import { createEnvironment } from '@/lib/rl/environment';

const DEFAULT_CONFIG = {
  gridSize: 8,
  algorithm: 'qlearning',
  alpha: 0.15,
  gamma: 0.95,
  epsilon: 1.0,
  epsilonMin: 0.01,
  epsilonDecay: 0.995,
  alphaDecay: 1.0,
  numEpisodes: 500,
  speed: 80,
  envType: 'warehouse', // 'warehouse', 'frozenlake', 'minigrid'
};

export default function Home() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [trainer, setTrainer] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [env, setEnv] = useState(null);
  const [qTable, setQTable] = useState(null);
  const [metrics, setMetrics] = useState({
    rewards: [], steps: [], successes: [], epsilons: [],
    avgTdErrors: [], qMagnitudes: [], cumulativeSuccessRate: [],
  });
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [showPath, setShowPath] = useState(true);

  const trainerRef = useRef(null);
  const intervalRef = useRef(null);
  const animIntervalRef = useRef(null);

  const clearIntervals = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    intervalRef.current = null;
    animIntervalRef.current = null;
  }, []);

  const handleStart = useCallback(() => {
    let t = trainerRef.current;
    if (!t || isPaused === false) {
      // Fresh start
      const isSlippery = config.envType === 'frozenlake';
      t = createTrainer({ ...config, isSlippery });
      trainerRef.current = t;
    }

    setIsRunning(true);
    setIsPaused(false);
    setEnv({ ...t.env });
    setQTable(cloneQTable(t.qTable));

    const runStep = () => {
      if (!trainerRef.current || trainerRef.current.currentEpisode >= trainerRef.current.numEpisodes) {
        clearIntervals();
        setIsRunning(false);
        return;
      }
      const result = runEpisode(trainerRef.current);
      const tr = trainerRef.current;

      // Animate the episode steps
      if (result.episodeSteps.length > 0 && config.speed >= 30) {
        let stepIdx = 0;
        animIntervalRef.current = setInterval(() => {
          if (stepIdx >= result.episodeSteps.length) {
            clearInterval(animIntervalRef.current);
            animIntervalRef.current = null;
            return;
          }
          const s = result.episodeSteps[stepIdx];
          setEnv(prev => ({
            ...prev,
            agentPos: s.agentPos,
            grid: s.grid,
            path: s.path,
            done: s.done,
          }));
          stepIdx++;
        }, Math.max(5, config.speed / 4));
      } else {
        // Just show final position
        const last = result.episodeSteps[result.episodeSteps.length - 1];
        if (last) {
          setEnv(prev => ({
            ...prev,
            agentPos: last.agentPos,
            grid: last.grid,
            path: last.path,
            done: last.done,
          }));
        }
      }

      setQTable(cloneQTable(tr.qTable));
      setMetrics({ ...tr.metrics });
      setCurrentEpisode(tr.currentEpisode);
    };

    intervalRef.current = setInterval(runStep, config.speed);
  }, [config, isPaused, clearIntervals]);

  const handlePause = useCallback(() => {
    clearIntervals();
    setIsPaused(true);
    setIsRunning(true); // still "running" state, just paused
  }, [clearIntervals]);

  const handleReset = useCallback(() => {
    clearIntervals();
    trainerRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setEnv(null);
    setQTable(null);
    setCurrentEpisode(0);
    setMetrics({
      rewards: [], steps: [], successes: [], epsilons: [],
      avgTdErrors: [], qMagnitudes: [], cumulativeSuccessRate: [],
    });
  }, [clearIntervals]);

  const handleFastTrain = useCallback(() => {
  const isSlippery = config.envType === 'frozenlake';
    const t = createTrainer({ ...config, isSlippery });
    trainerRef.current = t;
    setIsRunning(false);
    setIsPaused(false);

    // Run all episodes in batches with UI updates
    let done = false;
    const batchRun = () => {
      if (t.currentEpisode >= t.numEpisodes) {
        setEnv({ ...t.env });
        setQTable(cloneQTable(t.qTable));
        setMetrics({ ...t.metrics });
        setCurrentEpisode(t.currentEpisode);
        return;
      }
      runBatch(t, 50);
      setMetrics({ ...t.metrics });
      setCurrentEpisode(t.currentEpisode);
      setQTable(cloneQTable(t.qTable));
      setEnv({ ...t.env });
      requestAnimationFrame(batchRun);
    };
    requestAnimationFrame(batchRun);
  }, [config]);

  // Cleanup on unmount
  useEffect(() => clearIntervals, [clearIntervals]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Warehouse Robot Navigation</h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                Dynamic Route Planning · Q-Learning & SARSA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] hidden sm:flex">
              {config.gridSize}×{config.gridSize} Grid
            </Badge>
            <Badge className={config.algorithm === 'qlearning' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-400'}>
              {config.algorithm === 'qlearning' ? 'Q-Learning' : 'SARSA'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar - Controls */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-card border border-border/50 rounded-xl p-4 sticky top-16">
              <ControlPanel
                config={config}
                setConfig={setConfig}
                isRunning={isRunning && !isPaused}
                isPaused={isPaused}
                onStart={isPaused ? handleStart : handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onFastTrain={handleFastTrain}
                showPolicy={showPolicy}
                setShowPolicy={setShowPolicy}
                showValues={showValues}
                setShowValues={setShowValues}
                showPath={showPath}
                setShowPath={setShowPath}
                currentEpisode={currentEpisode}
                totalEpisodes={config.numEpisodes}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* Top: Grid + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grid World */}
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold">Environment Simulator</h2>
                  {isRunning && !isPaused && (
                    <span className="flex items-center gap-1 text-[10px] text-accent">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <GridWorld
                  env={env || createPreviewEnv(config)}
                  qTable={qTable}
                  showPolicy={showPolicy}
                  showValues={showValues}
                  showPath={showPath}
                />
              </div>

              {/* Right Stats */}
              <div className="space-y-4">
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <MetricsDashboard
                    metrics={metrics}
                    epsilon={trainerRef.current?.epsilon ?? config.epsilon}
                    algorithm={config.algorithm}
                    currentEpisode={currentEpisode}
                  />
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <QTableVisualizer
                    qTable={qTable}
                    gridSize={config.gridSize}
                    env={env}
                  />
                </div>
              </div>
            </div>

            {/* Tabs: Charts, Comparison, Reference */}
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="charts" className="gap-1.5 text-xs">
                  <BarChart3 className="w-3.5 h-3.5" /> Training Charts
                </TabsTrigger>
                <TabsTrigger value="comparison" className="gap-1.5 text-xs">
                  <GitCompareArrows className="w-3.5 h-3.5" /> Comparison
                </TabsTrigger>
                <TabsTrigger value="reference" className="gap-1.5 text-xs">
                  <BookOpen className="w-3.5 h-3.5" /> Algorithm Reference
                </TabsTrigger>
              </TabsList>

              <TabsContent value="charts" className="mt-4">
                <TrainingCharts metrics={metrics} />
              </TabsContent>

              <TabsContent value="comparison" className="mt-4">
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <ComparisonPanel
                    currentConfig={config}
                    currentMetrics={metrics}
                  />
                </div>
              </TabsContent>

              <TabsContent value="reference" className="mt-4">
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <AlgorithmInfo />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}

// Create a preview environment for before training starts
function createPreviewEnv(config) {
  const isSlippery = config.envType === 'frozenlake';
  return createEnvironment(config.gridSize, isSlippery);
}