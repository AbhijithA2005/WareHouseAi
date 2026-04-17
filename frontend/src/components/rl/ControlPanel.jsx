import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Zap, FlaskConical } from 'lucide-react';

export default function ControlPanel({
  config, setConfig,
  isRunning, isPaused,
  onStart, onPause, onReset, onFastTrain,
  showPolicy, setShowPolicy,
  showValues, setShowValues,
  showPath, setShowPath,
  currentEpisode, totalEpisodes,
}) {
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      {/* Environment Preset */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Environment Preset</Label>
        <Select
          value={config.envType}
          onValueChange={(v) => {
            const updates = { envType: v };
            if (v === 'frozenlake') {
              updates.gridSize = 4;
              updates.numEpisodes = 800;
            } else if (v === 'warehouse') {
              updates.gridSize = 8;
            } else if (v === 'minigrid') {
              updates.gridSize = 10;
            }
            setConfig(prev => ({ ...prev, ...updates }));
          }}
          disabled={isRunning}
        >
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="warehouse">Standard Warehouse (8×8)</SelectItem>
            <SelectItem value="frozenlake">FrozenLake-v1 (4×4, Slippery)</SelectItem>
            <SelectItem value="minigrid">MiniGrid (10×10, Sparse)</SelectItem>
          </SelectContent>
        </Select>
        {config.envType === 'frozenlake' && (
          <p className="text-[10px] text-orange-400 font-medium">
            Slippery floors enabled! Agent may move perpendicularly.
          </p>
        )}
      </div>

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Algorithm</Label>
        <Select
          value={config.algorithm}
          onValueChange={(v) => updateConfig('algorithm', v)}
          disabled={isRunning}
        >
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="qlearning">
              <span className="flex items-center gap-2">
                <FlaskConical className="w-3 h-3" /> Q-Learning (Off-Policy)
              </span>
            </SelectItem>
            <SelectItem value="sarsa">
              <span className="flex items-center gap-2">
                <FlaskConical className="w-3 h-3" /> SARSA (On-Policy)
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid Size */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Grid Size: {config.gridSize}×{config.gridSize}
        </Label>
        <Select
          value={String(config.gridSize)}
          onValueChange={(v) => updateConfig('gridSize', parseInt(v))}
          disabled={isRunning}
        >
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6×6</SelectItem>
            <SelectItem value="8">8×8</SelectItem>
            <SelectItem value="10">10×10</SelectItem>
            <SelectItem value="12">12×12</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hyperparameters */}
      <div className="space-y-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hyperparameters</Label>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">α (Learning Rate)</span>
            <span className="font-mono text-primary">{config.alpha.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.alpha]}
            onValueChange={([v]) => updateConfig('alpha', v)}
            min={0.01} max={1.0} step={0.01}
            disabled={isRunning}
            className="py-1"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">γ (Discount Factor)</span>
            <span className="font-mono text-primary">{config.gamma.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.gamma]}
            onValueChange={([v]) => updateConfig('gamma', v)}
            min={0.1} max={1.0} step={0.01}
            disabled={isRunning}
            className="py-1"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">ε (Initial Exploration)</span>
            <span className="font-mono text-primary">{config.epsilon.toFixed(2)}</span>
          </div>
          <Slider
            value={[config.epsilon]}
            onValueChange={([v]) => updateConfig('epsilon', v)}
            min={0.01} max={1.0} step={0.01}
            disabled={isRunning}
            className="py-1"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">ε Decay Rate</span>
            <span className="font-mono text-primary">{config.epsilonDecay.toFixed(3)}</span>
          </div>
          <Slider
            value={[config.epsilonDecay]}
            onValueChange={([v]) => updateConfig('epsilonDecay', v)}
            min={0.9} max={0.999} step={0.001}
            disabled={isRunning}
            className="py-1"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Episodes</span>
            <span className="font-mono text-primary">{config.numEpisodes}</span>
          </div>
          <Slider
            value={[config.numEpisodes]}
            onValueChange={([v]) => updateConfig('numEpisodes', v)}
            min={50} max={2000} step={50}
            disabled={isRunning}
            className="py-1"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Animation Speed</span>
            <span className="font-mono text-primary">{config.speed}ms</span>
          </div>
          <Slider
            value={[config.speed]}
            onValueChange={([v]) => updateConfig('speed', v)}
            min={10} max={500} step={10}
            className="py-1"
          />
        </div>
      </div>

      {/* Visualization Toggles */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visualization</Label>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Show Policy Arrows</span>
          <Switch checked={showPolicy} onCheckedChange={setShowPolicy} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Show Q-Values</span>
          <Switch checked={showValues} onCheckedChange={setShowValues} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Show Path Trail</span>
          <Switch checked={showPath} onCheckedChange={setShowPath} />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={isRunning ? onPause : onStart}
            variant={isRunning && !isPaused ? "secondary" : "default"}
            className="gap-2"
          >
            {isRunning && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Start'}
          </Button>
          <Button onClick={onReset} variant="outline" className="gap-2" disabled={isRunning && !isPaused}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
        <Button onClick={onFastTrain} variant="secondary" className="w-full gap-2" disabled={isRunning}>
          <Zap className="w-4 h-4" /> Fast Train (No Animation)
        </Button>
      </div>

      {/* Progress */}
      {(isRunning || currentEpisode > 0) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">{currentEpisode} / {totalEpisodes}</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(currentEpisode / totalEpisodes) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}