import type { TaskWithCourse } from '../lib/types';

export type GradeWarning =
  | { kind: 'total_weight_over_100'; message: string; totalWeight: number }
  | { kind: 'final_missing'; message: string }
  | { kind: 'final_weight_missing'; message: string }
  | { kind: 'graded_missing_grade'; message: string; taskId: string; taskTitle: string }
  | { kind: 'counted_missing_weight'; message: string; taskId: string; taskTitle: string };

function n(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}

export function computeWeightStats(tasks: TaskWithCourse[]) {
  const counted = tasks.filter((t) => (t.grade?.counts ?? true) === true);

  const weights = counted
    .map((t) => n(t.grade?.weight_percent))
    .filter((x): x is number => x !== null && x > 0);

  const totalCountedWeight = weights.reduce((a, b) => a + b, 0);

  const completedWeight = counted
    .filter((t) => (t.grade?.is_graded ?? false) === true)
    .map((t) => n(t.grade?.weight_percent))
    .filter((x): x is number => x !== null && x > 0)
    .reduce((a, b) => a + b, 0);

  const remainingWeight = 100 - totalCountedWeight;

  return { totalCountedWeight, completedWeight, remainingWeight };
}

// Current Grade So Far = graded-only, normalized by graded weights
export function computeCurrentSoFar(tasks: TaskWithCourse[]): number | null {
  const gradedCounted = tasks.filter(
    (t) => (t.grade?.counts ?? true) === true && (t.grade?.is_graded ?? false) === true
  );

  let sumW = 0;
  let sumWG = 0;

  for (const t of gradedCounted) {
    const w = n(t.grade?.weight_percent);
    const g = n(t.grade?.grade_percent);
    if (w === null || w <= 0) continue;
    if (g === null) continue; // graded flag but missing value -> handled by warnings
    sumW += w;
    sumWG += g * w;
  }

  if (sumW === 0) return null;
  return sumWG / sumW;
}

// Projected Overall = ungraded treated as 0 contribution (so only graded contributes)
export function computeProjectedOverall(tasks: TaskWithCourse[]): number {
  const gradedCounted = tasks.filter(
    (t) => (t.grade?.counts ?? true) === true && (t.grade?.is_graded ?? false) === true
  );

  let sum = 0;
  for (const t of gradedCounted) {
    const w = n(t.grade?.weight_percent);
    const g = n(t.grade?.grade_percent);
    if (w === null || w <= 0) continue;
    if (g === null) continue;
    sum += (g * w) / 100;
  }
  return sum;
}

export function computeKnownContribution(tasks: TaskWithCourse[]): number {
  // Σ(grade% * weight%) / 100 for graded + counted items
  return computeProjectedOverall(tasks);
}

export function computeNeededFinal(params: {
  target: number;
  knownContribution: number; // already /100 (e.g. 18.4 means 18.4% points)
  finalWeightPercent: number;
}): number | null {
  const { target, knownContribution, finalWeightPercent } = params;
  if (!Number.isFinite(finalWeightPercent) || finalWeightPercent <= 0) return null;
  return (target - knownContribution) / (finalWeightPercent / 100);
}

export function buildGradeWarnings(params: {
  tasks: TaskWithCourse[];
  finalTask: TaskWithCourse | null;
}): GradeWarning[] {
  const warnings: GradeWarning[] = [];
  const { tasks, finalTask } = params;

  const { totalCountedWeight } = computeWeightStats(tasks);
  if (totalCountedWeight > 100.0001) {
    warnings.push({
      kind: 'total_weight_over_100',
      totalWeight: totalCountedWeight,
      message: `Total counted weight is ${totalCountedWeight.toFixed(1)}% (over 100%).`,
    });
  }

  for (const t of tasks) {
    if ((t.grade?.counts ?? true) !== true) continue;

    const w = n(t.grade?.weight_percent);
    if (w === null || w <= 0) {
      warnings.push({
        kind: 'counted_missing_weight',
        taskId: t.id,
        taskTitle: t.title,
        message: `Missing weight on counted item: ${t.title}`,
      });
    }

    if ((t.grade?.is_graded ?? false) === true) {
      const g = n(t.grade?.grade_percent);
      if (g === null) {
        warnings.push({
          kind: 'graded_missing_grade',
          taskId: t.id,
          taskTitle: t.title,
          message: `Marked graded but no grade entered: ${t.title}`,
        });
      }
    }
  }

  if (!finalTask) {
    warnings.push({ kind: 'final_missing', message: 'Final exam task not found (type “Final”).' });
  } else {
    const wFinal = n(finalTask.grade?.weight_percent);
    if (wFinal === null || wFinal <= 0) {
      warnings.push({ kind: 'final_weight_missing', message: 'Final exam weight is missing or 0%.' });
    }
  }

  return warnings;
}











