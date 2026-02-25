export function getParlayMultiplier(legs: number): number {
  const table: Record<number, number> = {
    2: 3.2,
    3: 5.8,
    4: 10.5,
    5: 18.9,
    6: 34.0,
  }
  if (!table[legs]) throw new Error('Invalid parlay legs')
  return table[legs]
}
