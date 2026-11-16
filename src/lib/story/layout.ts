/**
 * Where the 3D scene sits on screen. The DOM measures the hero (headline above, copy
 * below) and publishes this; the scene reads it every frame. Pure helpers, tested.
 */
import { HERO_CAM_Z, screenWeights } from "./journey";

export type StoryLayout = {
  /** Hero: centre of the free space between headline and copy, as a fraction of the stage height below the middle. */
  heroY: number;
  /** Hero: object height as a fraction of the stage height. */
  heroSize: number;
  /** Chapters: shift of the object, as fractions of stage width and height (positive = right / down). */
  reelX: number;
  reelY: number;
};

export const DEFAULT_LAYOUT: StoryLayout = { heroY: 0.08, heroSize: 0.33, reelX: -0.17, reelY: 0 };

/** Diameter of the hero object in scene units at pose scale 1.08 (measured from the model). */
export const HERO_OBJECT_UNITS = 2.6;

/** Camera distance at which the object spans `size` of the viewport height at vertical fov `fovDeg`. */
export const heroDistance = (size: number, fovDeg: number) =>
  HERO_OBJECT_UNITS / (2 * Math.tan((fovDeg * Math.PI) / 360) * Math.max(0.05, size));

/** Screen shift of the projection centre at progress p: fractions of width and height. */
export function stageShift(p: number, l: StoryLayout) {
  const w = screenWeights(p);
  return { x: l.reelX * w.reel, y: l.heroY * w.hero + l.reelY * w.reel, hero: w.hero };
}

/** Multiplier on the journey's camera distance while it is still in front of the object. */
export function distanceScale(p: number, l: StoryLayout, fovDeg: number, later = 1) {
  const { hero } = screenWeights(p);
  const start = heroDistance(l.heroSize, fovDeg) / HERO_CAM_Z;
  return later + (start - later) * hero;
}
