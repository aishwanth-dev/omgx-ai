import type { CapabilitySlug } from "@/content/capabilities";

/** Unique, lightweight animated line glyph for each capability (CSS-animated SVG). */
export function CapabilityGlyph({ slug }: { slug: CapabilitySlug }) {
  return (
    <svg viewBox="0 0 240 180" className={`glyph glyph--${slug}`} aria-hidden="true">
      {slug === "artificial-intelligence" && (
        <g>
          {[
            [40, 40], [90, 28], [150, 46], [200, 30], [60, 100], [120, 90], [180, 110], [40, 150], [110, 150], [200, 150],
          ].map(([x, y], i, arr) => (
            <g key={i}>
              {arr.slice(i + 1, i + 3).map(([x2, y2], j) => (
                <line key={j} x1={x} y1={y} x2={x2} y2={y2} className="glyph__line" />
              ))}
              <circle cx={x} cy={y} r={i === 5 ? 7 : 4} className="glyph__node" style={{ animationDelay: `${i * 0.23}s` }} />
            </g>
          ))}
        </g>
      )}
      {slug === "industrial-automation" && (
        <g>
          <g className="glyph__spin" style={{ transformOrigin: "92px 92px" }}>
            <circle cx="92" cy="92" r="46" className="glyph__line" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <line key={i} x1={92 + Math.cos(a) * 46} y1={92 + Math.sin(a) * 46} x2={92 + Math.cos(a) * 58} y2={92 + Math.sin(a) * 58} className="glyph__line" />;
            })}
            <circle cx="92" cy="92" r="10" className="glyph__accent" />
          </g>
          <g className="glyph__spin glyph__spin--rev" style={{ transformOrigin: "170px 120px" }}>
            <circle cx="170" cy="120" r="24" className="glyph__line" />
            {Array.from({ length: 7 }, (_, i) => {
              const a = (i / 7) * Math.PI * 2;
              return <line key={i} x1={170 + Math.cos(a) * 24} y1={120 + Math.sin(a) * 24} x2={170 + Math.cos(a) * 33} y2={120 + Math.sin(a) * 33} className="glyph__line" />;
            })}
          </g>
        </g>
      )}
      {slug === "immersive-technologies" && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x="40"
              y="20"
              width="160"
              height="140"
              rx="26"
              className="glyph__frame"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
          ))}
          <circle cx="120" cy="90" r="4" className="glyph__accent" />
        </g>
      )}
      {slug === "hardware-engineering" && (
        <g>
          <rect x="88" y="58" width="64" height="64" rx="4" className="glyph__line" />
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i}>
              <path d={`M${96 + i * 12} 58 V ${30 - (i % 2) * 10} H ${40 + i * 30}`} className="glyph__trace" style={{ animationDelay: `${i * 0.3}s` }} />
              <path d={`M${96 + i * 12} 122 V ${150 + (i % 2) * 10} H ${200 - i * 30}`} className="glyph__trace" style={{ animationDelay: `${i * 0.3 + 0.15}s` }} />
            </g>
          ))}
          <circle cx="120" cy="90" r="8" className="glyph__accent" />
        </g>
      )}
    </svg>
  );
}
