export interface Tier {
  name: string;
  minPoints: number;
}

/** Points earned for a spend: `pointsPerUnit` per whole currency unit
 *  (100 minor units), rounded down. */
export function pointsForSpend(totalMinor: number, pointsPerUnit: number): number {
  if (totalMinor <= 0 || pointsPerUnit <= 0) return 0;
  return Math.floor(totalMinor / 100) * pointsPerUnit;
}

/** The highest tier whose threshold the balance reaches, or null below all. */
export function tierFor(balance: number, tiers: Tier[]): string | null {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((t) => balance >= t.minPoints)?.name ?? null;
}
