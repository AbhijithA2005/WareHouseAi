import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

export default function AlgorithmInfo() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Algorithm Reference</h3>
      </div>

      {/* MDP Formulation */}
      <InfoSection title="MDP Formulation">
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li><strong className="text-foreground">States (S):</strong> Grid cell positions (row × size + col)</li>
          <li><strong className="text-foreground">Actions (A):</strong> &#123;Up, Down, Left, Right&#125;</li>
          <li><strong className="text-foreground">Transition:</strong> Deterministic moves + dynamic obstacles</li>
          <li><strong className="text-foreground">Rewards:</strong> +10 goal, −0.1/step, −1 wall, −2 obstacle, −0.3 revisit</li>
          <li><strong className="text-foreground">γ:</strong> Discount factor (default 0.95)</li>
        </ul>
      </InfoSection>

      {/* Q-Learning */}
      <InfoSection title="Q-Learning (Off-Policy)" badge="Off-Policy" badgeColor="bg-primary/20 text-primary">
        <div className="bg-secondary/60 rounded-lg p-3 font-mono text-xs border border-border/50 overflow-x-auto">
          Q(s,a) ← Q(s,a) + α[r + γ·max<sub>a'</sub> Q(s',a') − Q(s,a)]
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Updates Q-values using the <strong className="text-foreground">maximum</strong> Q-value of the next state,
          regardless of which action is actually taken. This makes it <em>off-policy</em> — it learns the optimal
          policy while following an exploratory (ε-greedy) policy. Generally converges faster but can be less stable in
          stochastic environments.
        </p>
      </InfoSection>

      {/* SARSA */}
      <InfoSection title="SARSA (On-Policy)" badge="On-Policy" badgeColor="bg-orange-500/20 text-orange-400">
        <div className="bg-secondary/60 rounded-lg p-3 font-mono text-xs border border-border/50 overflow-x-auto">
          Q(s,a) ← Q(s,a) + α[r + γ·Q(s',a') − Q(s,a)]
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Updates using the Q-value of the <strong className="text-foreground">actual next action</strong> taken
          (State-Action-Reward-State-Action). This makes it <em>on-policy</em> — it evaluates the policy it's
          currently following. More conservative but safer in environments with penalties near optimal paths.
        </p>
      </InfoSection>

      {/* Key Differences */}
      <InfoSection title="Key Differences">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
            <p className="font-semibold text-primary mb-1">Q-Learning</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• Off-policy learning</li>
              <li>• Uses max Q(s',a')</li>
              <li>• Faster convergence</li>
              <li>• Can overestimate values</li>
              <li>• Learns optimal policy</li>
            </ul>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-2.5">
            <p className="font-semibold text-orange-400 mb-1">SARSA</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• On-policy learning</li>
              <li>• Uses actual Q(s',a')</li>
              <li>• More conservative</li>
              <li>• Safer near penalties</li>
              <li>• Learns exploratory policy</li>
            </ul>
          </div>
        </div>
      </InfoSection>

      {/* Exploration */}
      <InfoSection title="ε-Greedy Exploration">
        <p className="text-xs text-muted-foreground">
          With probability <span className="font-mono text-foreground">ε</span>, choose a random action (explore).
          With probability <span className="font-mono text-foreground">1−ε</span>, choose the best known action (exploit).
          Epsilon decays over time: <span className="font-mono text-foreground">ε ← ε × decay_rate</span>, ensuring
          the agent transitions from exploration to exploitation.
        </p>
      </InfoSection>
    </div>
  );
}

function InfoSection({ title, badge, badgeColor, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {badge && <Badge className={`text-[10px] ${badgeColor}`}>{badge}</Badge>}
      </div>
      {children}
    </div>
  );
}