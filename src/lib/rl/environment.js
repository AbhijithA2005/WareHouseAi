// Grid-World Warehouse Environment
// Cell types: 0=empty, 1=wall, 2=goal, 3=agent_start, 4=dynamic_obstacle

export const CELL = {
  EMPTY: 0,
  WALL: 1,
  GOAL: 2,
  START: 3,
  DYNAMIC_OBS: 4,
};

export const ACTIONS = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
};

export const ACTION_NAMES = ['Up', 'Down', 'Left', 'Right'];
export const ACTION_ARROWS = ['↑', '↓', '←', '→'];
export const ACTION_DELTAS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function createEnvironment(size = 8) {
  const grid = Array.from({ length: size }, () => Array(size).fill(CELL.EMPTY));
  
  // Place walls (warehouse shelves)
  const walls = generateWalls(size);
  walls.forEach(([r, c]) => { grid[r][c] = CELL.WALL; });
  
  // Start at top-left area, goal at bottom-right area
  const start = [0, 0];
  const goal = [size - 1, size - 1];
  grid[start[0]][start[1]] = CELL.START;
  grid[goal[0]][goal[1]] = CELL.GOAL;
  
  // Place dynamic obstacles
  const dynamicObs = generateDynamicObstacles(size, grid);
  dynamicObs.forEach(([r, c]) => { grid[r][c] = CELL.DYNAMIC_OBS; });
  
  return {
    size,
    grid: grid.map(row => [...row]),
    originalGrid: grid.map(row => [...row]),
    start,
    goal,
    agentPos: [...start],
    dynamicObstacles: dynamicObs.map(o => [...o]),
    originalDynamicObstacles: dynamicObs.map(o => [...o]),
    done: false,
    steps: 0,
    totalReward: 0,
    path: [[...start]],
    maxSteps: size * size * 3,
  };
}

function generateWalls(size) {
  const walls = [];
  const wallDensity = Math.floor(size * size * 0.12);
  const rng = mulberry32(42); // deterministic seed
  
  for (let i = 0; i < wallDensity; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    // Don't block start, goal, or their adjacent cells
    if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
    if ((r === 0 && c === 1) || (r === 1 && c === 0)) continue;
    if ((r === size - 1 && c === size - 2) || (r === size - 2 && c === size - 1)) continue;
    walls.push([r, c]);
  }
  return walls;
}

function generateDynamicObstacles(size, grid) {
  const obs = [];
  const count = Math.max(1, Math.floor(size * 0.3));
  const rng = mulberry32(123);
  
  for (let i = 0; i < count; i++) {
    let r, c;
    let attempts = 0;
    do {
      r = Math.floor(rng() * size);
      c = Math.floor(rng() * size);
      attempts++;
    } while (grid[r][c] !== CELL.EMPTY && attempts < 100);
    if (grid[r][c] === CELL.EMPTY) {
      obs.push([r, c]);
    }
  }
  return obs;
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function resetEnv(env) {
  env.agentPos = [...env.start];
  env.done = false;
  env.steps = 0;
  env.totalReward = 0;
  env.path = [[...env.start]];
  
  // Reset grid
  env.grid = env.originalGrid.map(row => [...row]);
  env.dynamicObstacles = env.originalDynamicObstacles.map(o => [...o]);
  env.dynamicObstacles.forEach(([r, c]) => {
    if (env.grid[r][c] === CELL.EMPTY) {
      env.grid[r][c] = CELL.DYNAMIC_OBS;
    }
  });
  
  return getState(env);
}

export function getState(env) {
  return env.agentPos[0] * env.size + env.agentPos[1];
}

export function getStateFromPos(row, col, size) {
  return row * size + col;
}

export function getPosFromState(state, size) {
  return [Math.floor(state / size), state % size];
}

export function step(env, action) {
  if (env.done) return { state: getState(env), reward: 0, done: true };
  
  const [dr, dc] = ACTION_DELTAS[action];
  const newR = env.agentPos[0] + dr;
  const newC = env.agentPos[1] + dc;
  
  let reward = -0.1; // step penalty
  
  // Check boundaries
  if (newR < 0 || newR >= env.size || newC < 0 || newC >= env.size) {
    reward = -1.0; // wall hit penalty
    env.steps++;
    if (env.steps >= env.maxSteps) env.done = true;
    env.totalReward += reward;
    return { state: getState(env), reward, done: env.done };
  }
  
  const cellType = env.grid[newR][newC];
  
  // Check wall collision
  if (cellType === CELL.WALL) {
    reward = -1.0;
    env.steps++;
    if (env.steps >= env.maxSteps) env.done = true;
    env.totalReward += reward;
    return { state: getState(env), reward, done: env.done };
  }
  
  // Check dynamic obstacle collision
  if (cellType === CELL.DYNAMIC_OBS) {
    reward = -2.0;
    env.steps++;
    if (env.steps >= env.maxSteps) env.done = true;
    env.totalReward += reward;
    return { state: getState(env), reward, done: env.done };
  }
  
  // Move agent
  env.agentPos = [newR, newC];
  env.path.push([newR, newC]);
  
  // Check goal
  if (cellType === CELL.GOAL) {
    reward = 10.0;
    env.done = true;
  }
  
  // Check revisiting cells (small penalty)
  const visited = env.path.slice(0, -1).some(([r, c]) => r === newR && c === newC);
  if (visited && !env.done) {
    reward -= 0.3;
  }
  
  env.steps++;
  if (env.steps >= env.maxSteps) {
    env.done = true;
    reward -= 1.0;
  }
  
  env.totalReward += reward;
  
  // Move dynamic obstacles periodically
  if (env.steps % 5 === 0) {
    moveDynamicObstacles(env);
  }
  
  return { state: getState(env), reward, done: env.done };
}

function moveDynamicObstacles(env) {
  env.dynamicObstacles.forEach((obs, idx) => {
    // Clear old position
    if (env.grid[obs[0]][obs[1]] === CELL.DYNAMIC_OBS) {
      env.grid[obs[0]][obs[1]] = CELL.EMPTY;
    }
    
    // Try random move
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nr = obs[0] + dir[0];
    const nc = obs[1] + dir[1];
    
    if (nr >= 0 && nr < env.size && nc >= 0 && nc < env.size && env.grid[nr][nc] === CELL.EMPTY &&
        !(nr === env.agentPos[0] && nc === env.agentPos[1])) {
      obs[0] = nr;
      obs[1] = nc;
    }
    
    // Place at new/same position
    if (env.grid[obs[0]][obs[1]] === CELL.EMPTY) {
      env.grid[obs[0]][obs[1]] = CELL.DYNAMIC_OBS;
    }
  });
}

export function getNumStates(env) {
  return env.size * env.size;
}

export const NUM_ACTIONS = 4;