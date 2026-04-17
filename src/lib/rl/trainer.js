// Training loop for Q-Learning and SARSA
import {
  createEnvironment, resetEnv, step, getState, getNumStates, NUM_ACTIONS
} from './environment';
import {
  createQTable, selectAction, qLearningUpdate, sarsaUpdate, qTableMagnitude, cloneQTable
} from './agents';

export function createTrainer(config) {
  const {
    gridSize = 8,
    algorithm = 'qlearning', // 'qlearning' or 'sarsa'
    alpha = 0.1,
    gamma = 0.95,
    epsilon = 1.0,
    epsilonMin = 0.01,
    epsilonDecay = 0.995,
    alphaDecay = 1.0,
    numEpisodes = 500,
  } = config;

  const env = createEnvironment(gridSize);
  const numStates = getNumStates(env);
  const qTable = createQTable(numStates);

  return {
    env,
    qTable,
    algorithm,
    alpha,
    alphaInitial: alpha,
    gamma,
    epsilon,
    epsilonMin,
    epsilonDecay,
    alphaDecay,
    numEpisodes,
    currentEpisode: 0,
    metrics: {
      rewards: [],
      steps: [],
      successes: [],
      epsilons: [],
      avgTdErrors: [],
      qMagnitudes: [],
      cumulativeSuccessRate: [],
    },
    isRunning: false,
    isPaused: false,
  };
}

// Run a single episode, returning step-by-step data for animation
export function runEpisode(trainer) {
  const { env, qTable, algorithm, gamma } = trainer;
  let { alpha, epsilon } = trainer;

  const state = resetEnv(env);
  const episodeSteps = [];
  let totalReward = 0;
  let totalTdError = 0;
  let stepCount = 0;
  let action = selectAction(qTable, state, epsilon);

  while (!env.done) {
    const currentState = getState(env);
    const currentAction = algorithm === 'sarsa' ? action : selectAction(qTable, currentState, epsilon);
    
    const result = step(env, currentAction);
    totalReward += result.reward;
    stepCount++;

    let tdError;
    if (algorithm === 'qlearning') {
      tdError = qLearningUpdate(qTable, currentState, currentAction, result.reward, result.state, result.done, alpha, gamma);
    } else {
      // SARSA: select next action first (on-policy)
      const nextAction = selectAction(qTable, result.state, epsilon);
      tdError = sarsaUpdate(qTable, currentState, currentAction, result.reward, result.state, nextAction, result.done, alpha, gamma);
      action = nextAction;
    }
    
    totalTdError += tdError;

    episodeSteps.push({
      state: currentState,
      action: currentAction,
      reward: result.reward,
      nextState: result.state,
      done: result.done,
      agentPos: [...env.agentPos],
      grid: env.grid.map(row => [...row]),
      path: env.path.map(p => [...p]),
    });
  }

  const success = env.agentPos[0] === env.goal[0] && env.agentPos[1] === env.goal[1];

  // Decay epsilon
  trainer.epsilon = Math.max(trainer.epsilonMin, trainer.epsilon * trainer.epsilonDecay);
  
  // Decay alpha
  trainer.alpha = trainer.alpha * trainer.alphaDecay;
  
  trainer.currentEpisode++;

  // Record metrics
  trainer.metrics.rewards.push(totalReward);
  trainer.metrics.steps.push(stepCount);
  trainer.metrics.successes.push(success ? 1 : 0);
  trainer.metrics.epsilons.push(trainer.epsilon);
  trainer.metrics.avgTdErrors.push(stepCount > 0 ? totalTdError / stepCount : 0);
  trainer.metrics.qMagnitudes.push(qTableMagnitude(qTable));
  
  const totalSuccesses = trainer.metrics.successes.reduce((a, b) => a + b, 0);
  trainer.metrics.cumulativeSuccessRate.push(totalSuccesses / trainer.currentEpisode);

  return {
    episodeSteps,
    totalReward,
    stepCount,
    success,
    episode: trainer.currentEpisode,
  };
}

// Run training in batches (for fast mode)
export function runBatch(trainer, batchSize = 10) {
  const results = [];
  for (let i = 0; i < batchSize && trainer.currentEpisode < trainer.numEpisodes; i++) {
    results.push(runEpisode(trainer));
  }
  return results;
}

// Get moving average of an array
export function movingAverage(arr, window = 20) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}