// Q-Learning and SARSA Agents
import { NUM_ACTIONS } from './environment';

export function createQTable(numStates) {
  const table = {};
  for (let s = 0; s < numStates; s++) {
    table[s] = new Float64Array(NUM_ACTIONS); // initialized to 0
  }
  return table;
}

export function cloneQTable(qTable) {
  const clone = {};
  for (const s in qTable) {
    clone[s] = new Float64Array(qTable[s]);
  }
  return clone;
}

// Epsilon-greedy action selection
export function selectAction(qTable, state, epsilon) {
  if (Math.random() < epsilon) {
    return Math.floor(Math.random() * NUM_ACTIONS);
  }
  return greedyAction(qTable, state);
}

export function greedyAction(qTable, state) {
  const values = qTable[state];
  if (!values) return Math.floor(Math.random() * NUM_ACTIONS);
  let bestAction = 0;
  let bestValue = values[0];
  for (let a = 1; a < NUM_ACTIONS; a++) {
    if (values[a] > bestValue) {
      bestValue = values[a];
      bestAction = a;
    }
  }
  return bestAction;
}

// Q-Learning update (off-policy): uses max Q(s', a') 
export function qLearningUpdate(qTable, state, action, reward, nextState, done, alpha, gamma) {
  const currentQ = qTable[state][action];
  const maxNextQ = done ? 0 : Math.max(...qTable[nextState]);
  
  // Q(s,a) ← Q(s,a) + α[r + γ·max_a' Q(s',a') - Q(s,a)]
  const tdTarget = reward + gamma * maxNextQ;
  const tdError = tdTarget - currentQ;
  qTable[state][action] = currentQ + alpha * tdError;
  
  return Math.abs(tdError);
}

// SARSA update (on-policy): uses Q(s', a') where a' is the actual next action
export function sarsaUpdate(qTable, state, action, reward, nextState, nextAction, done, alpha, gamma) {
  const currentQ = qTable[state][action];
  const nextQ = done ? 0 : qTable[nextState][nextAction];
  
  // Q(s,a) ← Q(s,a) + α[r + γ·Q(s',a') - Q(s,a)]
  const tdTarget = reward + gamma * nextQ;
  const tdError = tdTarget - currentQ;
  qTable[state][action] = currentQ + alpha * tdError;
  
  return Math.abs(tdError);
}

// Get the max Q-value for a state (state value approximation)
export function getStateValue(qTable, state) {
  const values = qTable[state];
  if (!values) return 0;
  return Math.max(...values);
}

// Extract policy from Q-table
export function extractPolicy(qTable, numStates) {
  const policy = {};
  for (let s = 0; s < numStates; s++) {
    policy[s] = greedyAction(qTable, s);
  }
  return policy;
}

// Calculate total Q-table magnitude (for convergence tracking)
export function qTableMagnitude(qTable) {
  let sum = 0;
  for (const s in qTable) {
    for (let a = 0; a < NUM_ACTIONS; a++) {
      sum += Math.abs(qTable[s][a]);
    }
  }
  return sum;
}