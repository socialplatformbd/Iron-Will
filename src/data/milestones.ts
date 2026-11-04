import type { Milestone } from '@/types';

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: 'd1', days: 1, title: 'First Step', description: 'You began. The hardest part is behind you.' },
  { id: 'd3', days: 3, title: 'Beginner', description: 'Three days of choosing yourself.' },
  { id: 'd7', days: 7, title: 'Warrior', description: 'A full week. Your resolve is real.' },
  { id: 'd14', days: 14, title: 'Strong Mind', description: 'Two weeks. New patterns are forming.' },
  { id: 'd30', days: 30, title: 'Iron Mind', description: 'A month of discipline. Remarkable.' },
  { id: 'd60', days: 60, title: 'Unbreakable', description: 'Sixty days. This is who you are now.' },
  { id: 'd90', days: 90, title: 'Champion', description: 'Ninety days. A true transformation.' },
  { id: 'd180', days: 180, title: 'Legend', description: 'Half a year of iron will.' },
  { id: 'd365', days: 365, title: 'Master', description: 'One full year. You mastered yourself.' },
];
