/** Section surfaces, edges and blends. Pure, unit- and property-tested. */
export const SURFACE_HEX = {
  ink: "#05070f",
  mist: "#f3f5fa",
  matcha: "#17389f",
  showcase: "#0b1020",
  footer: "#05070f",
} as const;

export type Surface = keyof typeof SURFACE_HEX;
export type Tone = "dark" | "light";

/** The header and text tone each surface carries. */
export const SURFACE_TONE: Record<Surface, Tone> = {
  ink: "dark",
  mist: "light",
  matcha: "dark",
  showcase: "dark",
  footer: "dark",
};

/** Server-rendered attributes for a section. The edge is the colour its bottom ends on. */
export const surfaceAttrs = (surface: Surface, edge: Surface = surface) => ({
  "data-theme": SURFACE_TONE[surface],
  "data-surface": surface,
  "data-edge": edge,
});

/** The surface for a section's colour theme prop. */
export const themeSurface = (theme: "dark" | "light" | "matcha"): Surface =>
  theme === "light" ? "mist" : theme === "matcha" ? "matcha" : "ink";

export type Blend = { from: string; to: string } | null;

/** The blend a section paints in its top padding: from the previous edge to its own surface. */
export const blendBetween = (prevEdge: Surface, next: Surface): Blend => {
  const from = SURFACE_HEX[prevEdge];
  const to = SURFACE_HEX[next];
  return from === to ? null : { from, to };
};

/** Blends for a sequence of sections; the first section has none. */
export const blendsFor = (sections: readonly { surface: Surface; edge?: Surface }[]): Blend[] =>
  sections.map((s, i) => (i === 0 ? null : blendBetween(sections[i - 1].edge ?? sections[i - 1].surface, s.surface)));

/**
 * Header tone inside a blend (3.9): the previous section's tone while the
 * header's sample point is in the upper half of the blend region.
 */
export const headerToneAt = (offsetInSection: number, blendH: number, prevTone: Tone, ownTone: Tone): Tone =>
  blendH > 0 && offsetInSection >= 0 && offsetInSection < blendH / 2 ? prevTone : ownTone;
