/**
 * Tracks real readiness of the homepage's critical assets so the preloader
 * can show honest progress. Each task is resolved by the code that owns it.
 */

export type ReadinessTask = "document" | "fonts" | "scene";

export const READINESS_LABELS: Record<ReadinessTask, string> = {
  document: "Page",
  fonts: "Typography",
  scene: "3D scene",
};

type Listener = (done: Set<ReadinessTask>) => void;

const done = new Set<ReadinessTask>();
const listeners = new Set<Listener>();

export const markReady = (task: ReadinessTask) => {
  if (done.has(task)) return;
  done.add(task);
  listeners.forEach((l) => l(new Set(done)));
};

export const isReady = (task: ReadinessTask) => done.has(task);

export const subscribeReadiness = (listener: Listener) => {
  listeners.add(listener);
  listener(new Set(done));
  return () => {
    listeners.delete(listener);
  };
};

/** Signals that the intro (preloader exit) has finished so hero animations can start. */
export const INTRO_EVENT = "omgx:intro-complete";
let introDone = false;
export const markIntroDone = () => {
  if (introDone) return;
  introDone = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
};
export const isIntroDone = () => introDone;
