/**
 * Temporary OMGX AI mark: a ring crossed by two neural pathways with nodes.
 * Original placeholder until the official SVG logo is supplied (see docs/MISSING_ASSETS.md).
 */

export const LOGO_PATHS = {
  ring: "M20 7a13 13 0 1 1 0 26a13 13 0 1 1 0-26",
  pathA: "M4.5 6.5C14 13 26 27 35.5 33.5",
  pathB: "M35.5 6.5C26 13 14 27 4.5 33.5",
  nodes: [
    [4.5, 6.5],
    [35.5, 6.5],
    [4.5, 33.5],
    [35.5, 33.5],
  ] as [number, number][],
};

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={LOGO_PATHS.ring} stroke="currentColor" strokeWidth="2" />
      <path d={LOGO_PATHS.pathA} stroke="var(--omgx-matcha)" strokeWidth="2" strokeLinecap="round" />
      <path d={LOGO_PATHS.pathB} stroke="var(--omgx-matcha)" strokeWidth="2" strokeLinecap="round" />
      {LOGO_PATHS.nodes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" fill="currentColor" />
      ))}
      <circle cx="20" cy="20" r="2.6" fill="var(--omgx-matcha)" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo__word">
        OMGX<span className="logo__ai">AI</span>
      </span>
    </span>
  );
}
