/**
 * Registry of the real assets the homepage needs before it can run without
 * further loading. Each item has a weight (bytes where known) and a progress
 * in [0, 1]. The preloader registers the list, every loader reports into it,
 * and the preloader shows the weighted sum. Code elsewhere (the hero scene,
 * the error boundary) resolves items with `markReady(name)`.
 */

export type ReadinessTask = string;

export type ReadinessSnapshot = {
  /** Weighted progress in [0, 1]. Reaches 1 only when every registered item is done. */
  progress: number;
  /** Names of items that are not done yet. */
  pending: string[];
  /** True when at least one item is registered and all are done. */
  complete: boolean;
};

type Item = { weight: number; value: number };
type Listener = (snap: ReadinessSnapshot) => void;

const items = new Map<string, Item>();
const listeners = new Set<Listener>();

const snapshot = (): ReadinessSnapshot => {
  let total = 0;
  let sum = 0;
  const pending: string[] = [];
  items.forEach((it, name) => {
    total += it.weight;
    sum += it.weight * it.value;
    if (it.value < 1) pending.push(name);
  });
  return { progress: total > 0 ? sum / total : 0, pending, complete: items.size > 0 && pending.length === 0 };
};

const emit = () => {
  const s = snapshot();
  listeners.forEach((l) => l(s));
};

/** Declares an item (and its weight) up front. Keeps any progress already reported for it. */
export const registerReadiness = (name: ReadinessTask, weight: number) => {
  const prev = items.get(name);
  items.set(name, { weight: Math.max(0.0001, weight), value: prev ? prev.value : 0 });
  emit();
};

/** Reports partial progress in [0, 1] for an item. Never moves backwards. */
export const reportReadiness = (name: ReadinessTask, fraction: number) => {
  const it = items.get(name) ?? { weight: 1, value: 0 };
  const next = Math.min(1, Math.max(it.value, fraction));
  if (items.has(name) && next === it.value) return;
  items.set(name, { weight: it.weight, value: next });
  emit();
};

/** Marks an item done. `weight` only applies when the item was not registered yet. */
export const markReady = (name: ReadinessTask, weight?: number) => {
  const it = items.get(name);
  if (it && it.value >= 1) return;
  items.set(name, { weight: it ? it.weight : (weight ?? 1), value: 1 });
  emit();
};

export const isReady = (name: ReadinessTask) => (items.get(name)?.value ?? 0) >= 1;

export const subscribeReadiness = (listener: Listener) => {
  listeners.add(listener);
  listener(snapshot());
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
