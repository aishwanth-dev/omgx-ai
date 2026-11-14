/**
 * Static SVG stand-in for the neural core, used when WebGL is unavailable.
 * Core content and calls to action never depend on the 3D layer.
 */
export function CorePoster({ className }: { className?: string }) {
  const loops = [
    { rx: 150, ry: 62, rot: -24, w: 10 },
    { rx: 142, ry: 80, rot: 32, w: 7 },
    { rx: 120, ry: 128, rot: 0, w: 2 },
    { rx: 160, ry: 40, rot: 76, w: 5 },
    { rx: 134, ry: 104, rot: -58, w: 2 },
    { rx: 110, ry: 52, rot: 12, w: 2 },
  ];
  const nodes = [
    [70, -110], [-130, -40], [140, 30], [-60, 120], [20, 60], [-20, -70], [110, -60], [-110, 70],
  ];
  return (
    <svg className={className} viewBox="-220 -220 440 440" role="img" aria-label="Illustration of the OMGX neural core">
      <defs>
        <radialGradient id="poster-glow" cx="0" cy="0" r="210" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00e89a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#00e89a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="210" fill="url(#poster-glow)" />
      {loops.map((l, i) => (
        <ellipse
          key={i}
          rx={l.rx}
          ry={l.ry}
          transform={`rotate(${l.rot})`}
          fill="none"
          stroke={l.w > 4 ? "#1e292c" : "#3b4a4e"}
          strokeWidth={l.w}
        />
      ))}
      {loops.slice(0, 2).map((l, i) => (
        <ellipse key={`rim-${i}`} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot})`} fill="none" stroke="#00e89a" strokeOpacity="0.55" strokeWidth="1" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.6} fill="#a5f3d2" />
      ))}
    </svg>
  );
}
