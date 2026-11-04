export interface TreeStage {
  index: number;
  name: string;
  /** Total clean days (across ALL attempts) needed to reach this stage. */
  minDays: number;
  blurb: string;
}

export const TREE_STAGES: TreeStage[] = [
  { index: 0, name: 'Seed', minDays: 0, blurb: 'Every great tree begins as a single seed.' },
  { index: 1, name: 'Sprout', minDays: 1, blurb: 'A first green shoot breaks the surface.' },
  { index: 2, name: 'Small Plant', minDays: 7, blurb: 'Your roots are taking hold.' },
  { index: 3, name: 'Growing Tree', minDays: 21, blurb: 'Strong branches are reaching upward.' },
  { index: 4, name: 'Mature Tree', minDays: 60, blurb: 'A full canopy that shelters your future.' },
  { index: 5, name: 'Blooming Tree', minDays: 120, blurb: 'In full bloom. Flowers and fruit everywhere.' },
];

export interface TreeGrowth {
  stage: TreeStage;
  next: TreeStage | null;
  /** 0..100 overall growth toward a blooming tree. */
  percent: number;
  /** 0..1 progress inside the current stage. */
  stageFraction: number;
}

/**
 * Recovery-based growth: the tree grows with *total* clean days across every attempt,
 * so a setback pauses growth but never destroys the tree.
 */
export function getTreeGrowth(totalCleanDays: number): TreeGrowth {
  let stage = TREE_STAGES[0];
  for (const s of TREE_STAGES) if (totalCleanDays >= s.minDays) stage = s;
  const next = TREE_STAGES[stage.index + 1] ?? null;
  const max = TREE_STAGES[TREE_STAGES.length - 1].minDays;
  const stageFraction = next ? (totalCleanDays - stage.minDays) / (next.minDays - stage.minDays) : 1;
  return {
    stage,
    next,
    percent: Math.min(100, Math.round((totalCleanDays / max) * 100)),
    stageFraction: Math.min(1, Math.max(0, stageFraction)),
  };
}
