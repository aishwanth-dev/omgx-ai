/**
 * Phones and reduced motion: the active row is the last row header whose top is
 * at or above the activation line (0 when none is). With equal tops the later
 * header wins. Pure and unit-tested.
 */
export function activeAt(lineY: number, headerTops: readonly number[]): number {
  let active = 0;
  for (let i = 0; i < headerTops.length; i++) if (headerTops[i] <= lineY) active = i;
  return active;
}
