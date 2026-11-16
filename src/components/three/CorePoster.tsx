/**
 * Static render of the Blender hero object (public/images/hero-core-poster.webp).
 * Decorative: it sits inside an aria-hidden visual, so the alt text is empty.
 * Server-rendered under the canvases as the no-JS / no-WebGL fallback and as
 * the placeholder until the first WebGL frame. Content never depends on it.
 */
export const HERO_POSTER = { src: "/images/hero-core-poster.webp", width: 1600, height: 1600 } as const;

export function CorePoster({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static decorative poster; no optimiser round-trip
    <img
      className={className}
      src={HERO_POSTER.src}
      alt=""
      width={HERO_POSTER.width}
      height={HERO_POSTER.height}
      decoding="async"
      draggable={false}
      style={className ? style : { display: "block", width: "100%", height: "auto", ...style }}
    />
  );
}
