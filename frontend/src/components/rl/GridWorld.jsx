import React, { useMemo } from 'react';
import { CELL, ACTION_ARROWS } from '@/lib/rl/environment';
import { greedyAction, getStateValue } from '@/lib/rl/agents';

const CELL_COLORS = {
  [CELL.EMPTY]: 'bg-secondary/40',
  [CELL.WALL]: 'bg-slate-700',
  [CELL.GOAL]: 'bg-accent',
  [CELL.START]: 'bg-primary/30',
  [CELL.DYNAMIC_OBS]: 'bg-orange-500',
};

export default function GridWorld({ env, qTable, showPolicy, showValues, showPath }) {
  const size = env?.size || 8;
  const agentPos = env?.agentPos;
  const path = env?.path || [];
  
  const maxQVal = useMemo(() => {
    if (!qTable || !showValues) return 1;
    let max = 0.01;
    for (let s = 0; s < size * size; s++) {
      const v = Math.abs(getStateValue(qTable, s));
      if (v > max) max = v;
    }
    return max;
  }, [qTable, showValues, size]);

  const pathSet = useMemo(() => {
    if (!showPath || !path.length) return new Set();
    return new Set(path.map(([r, c]) => `${r}-${c}`));
  }, [path, showPath]);

  return (
    <div className="relative">
      <div
        className="grid gap-0.5 rounded-xl overflow-hidden border border-border/50 p-1"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          background: 'hsl(222 47% 7%)',
        }}
      >
        {Array.from({ length: size }).map((_, r) =>
          Array.from({ length: size }).map((_, c) => {
            const cellType = env?.grid?.[r]?.[c] ?? CELL.EMPTY;
            const isAgent = agentPos && agentPos[0] === r && agentPos[1] === c;
            const isGoal = cellType === CELL.GOAL;
            const isStart = cellType === CELL.START;
            const isWall = cellType === CELL.WALL;
            const isDynamic = cellType === CELL.DYNAMIC_OBS;
            const isOnPath = pathSet.has(`${r}-${c}`);
            const state = r * size + c;
            
            let stateVal = 0;
            let bestAction = 0;
            if (qTable) {
              stateVal = getStateValue(qTable, state);
              bestAction = greedyAction(qTable, state);
            }

            const intensity = showValues && !isWall ? Math.min(1, Math.abs(stateVal) / maxQVal) : 0;
            const isPositive = stateVal >= 0;

            return (
              <div
                key={`${r}-${c}`}
                className={`
                  relative flex items-center justify-center aspect-square text-xs font-mono transition-all duration-200
                  ${isAgent ? 'cell-agent z-10' : ''}
                  ${isWall ? 'bg-slate-700/90' : ''}
                  ${isDynamic ? 'bg-orange-500/80 rounded-sm' : ''}
                  ${isGoal && !isAgent ? 'bg-accent/80' : ''}
                  ${isStart && !isAgent && !isGoal ? 'bg-primary/20' : ''}
                  ${isOnPath && !isAgent && !isGoal && !isWall && !isDynamic ? 'bg-primary/15' : ''}
                  ${!isWall && !isDynamic && !isGoal && !isStart && !isOnPath && !isAgent ? 'bg-secondary/30' : ''}
                `}
                style={
                  showValues && !isWall && !isGoal && !isDynamic
                    ? {
                        backgroundColor: isPositive
                          ? `rgba(34, 197, 94, ${intensity * 0.5})`
                          : `rgba(239, 68, 68, ${intensity * 0.5})`,
                      }
                    : undefined
                }
                title={`(${r},${c}) Q-val: ${stateVal.toFixed(2)}`}
              >
                {isAgent && (
                  <div className="absolute inset-0.5 rounded-md bg-primary flex items-center justify-center z-20">
                    <span className="text-primary-foreground font-bold" style={{ fontSize: size > 10 ? '8px' : '11px' }}>
                      🤖
                    </span>
                  </div>
                )}
                {isGoal && !isAgent && (
                  <span style={{ fontSize: size > 10 ? '10px' : '14px' }}>🎯</span>
                )}
                {isWall && (
                  <span className="text-slate-500" style={{ fontSize: size > 10 ? '7px' : '9px' }}>█</span>
                )}
                {isDynamic && !isAgent && (
                  <span style={{ fontSize: size > 10 ? '9px' : '12px' }}>⚡</span>
                )}
                {showPolicy && !isWall && !isGoal && !isDynamic && !isAgent && qTable && (
                  <span className="text-primary/70 font-bold" style={{ fontSize: size > 10 ? '10px' : '14px' }}>
                    {ACTION_ARROWS[bestAction]}
                  </span>
                )}
                {showValues && !isWall && !isGoal && !isDynamic && !isAgent && !showPolicy && (
                  <span className="text-foreground/60" style={{ fontSize: size > 10 ? '6px' : '8px' }}>
                    {stateVal.toFixed(1)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Agent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-accent inline-block" /> Goal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-700 inline-block" /> Wall</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Dynamic</span>
        {showPath && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/20 inline-block" /> Path</span>}
      </div>
    </div>
  );
}