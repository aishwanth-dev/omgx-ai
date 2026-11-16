/** Journey ring marker orbit. Pure; shared by JourneyRingCanvas and its tests. */
export const STAGES = 4;

/**
 * Orbit angle (radians, in the ring's local XZ plane) of marker i at stage
 * cursor c. The marker whose index equals the cursor sits at the top (local −Z,
 * which the ring's tilt turns towards screen-up); markers are evenly spaced.
 */
export const markerAngle = (i: number, cursor: number, n = STAGES) => -Math.PI / 2 + ((i - cursor) * 2 * Math.PI) / n;

/** Highlight weight 0–1 of marker i: 1 when the cursor is on it, 0 one stage away. */
export const markerWeight = (i: number, cursor: number) => Math.max(0, 1 - Math.abs(i - cursor));