import React, { useState, useMemo } from 'react';
import { ACTION_NAMES, ACTION_ARROWS, NUM_ACTIONS } from '@/lib/rl/environment';
import { getStateValue, greedyAction } from '@/lib/rl/agents';
import { Badge } from '@/components/ui/badge';

export default function QTableVisualizer({ qTable, gridSize, env }) {
  const [selectedState, setSelectedState] = useState(null);

  const heatmapData = useMemo(() => {
    if (!qTable) return [];
    const data = [];
    let maxVal = 0.01;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const s = r * gridSize + c;
        const v = getStateValue(qTable, s);
        if (Math.abs(v) > maxVal) maxVal = Math.abs(v);
        data.push({ r, c, s, value: v });
      }
    }
    return data.map(d => ({ ...d, normalized: d.value / maxVal }));
  }, [qTable, gridSize]);

  const selectedQValues = useMemo(() => {
    if (selectedState === null || !qTable || !qTable[selectedState]) return null;
    const values = qTable[selectedState];
    const best = greedyAction(qTable, selectedState);
    return Array.from({ length: NUM_ACTIONS }, (_, a) => ({
      action: a,
      name: ACTION_NAMES[a],
      arrow: ACTION_ARROWS[a],
      value: values[a],
      isBest: a === best,
    }));
  }, [selectedState, qTable]);

  if (!qTable) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Train the agent to see Q-table
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Q-Value Heatmap</h3>
        <span className="text-[10px] text-muted-foreground">Click a cell to inspect</span>
      </div>

      {/* Heatmap Grid */}
      <div
        className="grid gap-0.5 rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {heatmapData.map(({ r, c, s, value, normalized }) => {
          const cellType = env?.grid?.[r]?.[c] ?? 0;
          const isWall = cellType === 1;
          const isGoal = cellType === 2;
          const isSelected = selectedState === s;

          const hue = normalized >= 0 ? 142 : 0;
          const lightness = isWall ? 15 : 20 + Math.abs(normalized) * 30;
          const saturation = isWall ? 0 : Math.abs(normalized) * 70;

          return (
            <div
              key={s}
              onClick={() => !isWall && setSelectedState(isSelected ? null : s)}
              className={`
                aspect-square flex items-center justify-center cursor-pointer
                transition-all duration-150 text-[9px] font-mono
                ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-sm z-10' : ''}
                ${isWall ? 'bg-slate-800 cursor-default' : ''}
                ${isGoal ? 'ring-1 ring-accent/50' : ''}
              `}
              style={
                !isWall
                  ? { backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)` }
                  : undefined
              }
              title={`(${r},${c}) V=${value.toFixed(2)}`}
            >
              {!isWall && (
                <span className={`${Math.abs(value) > 0.5 ? 'text-white' : 'text-white/50'}`}>
                  {value.toFixed(1)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Color Scale */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Low</span>
        <div className="flex-1 h-2 rounded-full" style={{
          background: 'linear-gradient(to right, hsl(0 70% 35%), hsl(0 0% 20%), hsl(142 70% 35%))'
        }} />
        <span>High</span>
      </div>

      {/* Selected State Detail */}
      {selectedQValues && (
        <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-mono">
              State {selectedState} ({Math.floor(selectedState / gridSize)},{selectedState % gridSize})
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {selectedQValues.map((qv) => (
              <div
                key={qv.action}
                className={`
                  rounded-md p-2 text-center text-xs
                  ${qv.isBest ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/60 border border-border/30'}
                `}
              >
                <div className="text-lg mb-0.5">{qv.arrow}</div>
                <div className="text-[10px] text-muted-foreground">{qv.name}</div>
                <div className={`font-mono font-bold ${qv.isBest ? 'text-primary' : 'text-foreground/70'}`}>
                  {qv.value.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}