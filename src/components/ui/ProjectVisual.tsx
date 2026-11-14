import type { VisualKind } from "@/content/projects";

/**
 * Procedural technical line illustrations. These are clearly labelled
 * conceptual visualisations — never presented as project photography,
 * client facilities, machines or software screenshots.
 */

const A = "var(--pv-accent)";

function Art({ kind }: { kind: VisualKind }) {
  switch (kind) {
    case "scada":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${40 + i * 84} 60)`}>
              <rect width="56" height="40" rx="3" />
              <circle cx="46" cy="10" r="4" fill={i === 2 ? "none" : A} stroke={A} />
              <path d={`M28 40 V 110 H ${160 - (40 + i * 84) + 40}`} className="pv-flow" />
            </g>
          ))}
          <rect x="150" y="170" width="100" height="64" rx="4" />
          <path d="M162 218 l14 -14 l12 8 l18 -22 l20 12" stroke={A} />
          <text x="150" y="258">OK / NOK · TIMESTAMP</text>
        </g>
      );
    case "data":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${50 + i * 70} 60)`}>
              <rect width="44" height="32" rx="3" />
              <path d={`M22 32 C 22 90, ${150 - i * 70 + 100} 80, ${150 - i * 70 + 100} 130`} className="pv-flow" />
            </g>
          ))}
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx="300" cy={140 + i * 26} rx="44" ry="12" />
          ))}
          <path d="M256 140 V 192 M344 140 V 192" />
          <path d="M60 230 H 220" stroke={A} />
          <text x="60" y="252">SQL · OPC · REPORTS</text>
        </g>
      );
    case "wireless":
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i} transform={`translate(${40 + (i % 3) * 60} ${70 + Math.floor(i / 3) * 110})`}>
              <rect width="24" height="44" rx="4" />
              <path d="M12 0 v-10" />
              <path d="M2 -16 q10 -10 20 0" stroke={A} />
            </g>
          ))}
          <circle cx="310" cy="150" r="10" fill={A} stroke="none" />
          {[34, 64, 94].map((r) => (
            <circle key={r} cx="310" cy="150" r={r} strokeDasharray="3 6" />
          ))}
          <text x="250" y="270">~600 M · 18 NODES</text>
        </g>
      );
    case "assembly":
      return (
        <g>
          <rect x="70" y="80" width="260" height="130" rx="6" />
          {[0, 1, 2, 3].map((i) =>
            [0, 1].map((j) => (
              <g key={`${i}-${j}`}>
                <circle cx={110 + i * 60} cy={115 + j * 60} r="12" />
                <circle cx={110 + i * 60} cy={115 + j * 60} r="4" fill={i === 1 && j === 0 ? A : "none"} stroke={A} />
              </g>
            )),
          )}
          <path d="M40 250 H 120 M40 250 V 170" stroke={A} />
          <path d="M120 250 l-8 -5 v10 z M40 170 l-5 8 h10 z" fill={A} stroke="none" />
          <text x="132" y="254">X</text>
          <text x="28" y="160">Y</text>
        </g>
      );
    case "servo":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${44 + i * 66} 54)`}>
              <rect width="30" height="70" rx="3" />
              <path d="M15 70 V 110" stroke={A} />
              <rect x="6" y="110" width="18" height="10" />
            </g>
          ))}
          <path d="M30 210 C 70 170, 110 250, 150 210 S 230 170, 270 210 S 350 250, 380 210" stroke={A} />
          <path d="M30 210 H 380" strokeDasharray="2 5" />
          <text x="30" y="268">5 × SERVO VALVE · 5 × LVDT</text>
        </g>
      );
    case "testrig":
      return (
        <g>
          <path d="M40 240 H 360 M40 240 V 50" />
          {[1, 2, 3, 4].map((i) => (
            <path key={i} d={`M40 ${240 - i * 45} H 360`} strokeDasharray="2 6" />
          ))}
          <path d="M40 236 C 80 230, 100 90, 140 80 S 190 190, 230 200 S 300 150, 360 160" stroke={A} strokeWidth="2" />
          <circle cx="140" cy="80" r="5" fill={A} stroke="none" />
          <text x="48" y="64">LOAD</text>
          <text x="318" y="262">TIME</text>
        </g>
      );
    case "process":
      return (
        <g>
          <ellipse cx="200" cy="140" rx="110" ry="70" />
          <ellipse cx="200" cy="140" rx="80" ry="48" strokeDasharray="4 6" stroke={A} />
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={150 + (i % 5) * 25} cy={128 + Math.floor(i / 5) * 22} r="7" />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M${60 + i * 24} 250 v ${i % 3 === 0 ? -16 : -8}`} stroke={i % 3 === 0 ? A : undefined} />
          ))}
          <text x="60" y="275">CYCLE · TEMP · RH</text>
        </g>
      );
    case "robotics":
      return (
        <g>
          <path d="M20 220 H 380 M20 236 H 380" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={40 + i * 64} cy="228" r="6" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={50 + i * 90} y={186} width="44" height="34" />
          ))}
          <path d="M290 40 V 110 H 250 V 150" stroke={A} />
          <rect x="236" y="150" width="28" height="12" fill={A} stroke="none" />
          <rect x="300" y="150" width="70" height="66" strokeDasharray="4 4" />
        </g>
      );
    case "andon":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <rect key={i} x="60" y={60 + i * 34} width="40" height="30" rx="3" fill={i === 0 ? A : "none"} />
          ))}
          <path d="M80 162 V 240" />
          {[30, 52, 74].map((r) => (
            <path key={r} d={`M${110 + r * 0.2} ${110 - r * 0.6} a ${r} ${r} 0 0 1 0 ${r * 1.2}`} stroke={A} />
          ))}
          <rect x="210" y="70" width="150" height="96" rx="4" />
          <path d="M226 140 h 30 M226 120 h 60 M226 100 h 90" />
          <rect x="250" y="190" width="70" height="50" rx="6" />
          <text x="210" y="264">TABLET · TV · SMS</text>
        </g>
      );
    case "embedded":
      return (
        <g>
          <rect x="130" y="80" width="140" height="140" rx="6" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <path d={`M${145 + i * 18} 80 v -16 M${145 + i * 18} 220 v 16`} />
              <path d={`M130 ${95 + i * 18} h -16 M270 ${95 + i * 18} h 16`} />
            </g>
          ))}
          <circle cx="200" cy="150" r="30" stroke={A} />
          <circle cx="200" cy="150" r="18" />
          <text x="150" y="268">HALL-EFFECT SENSING</text>
        </g>
      );
    case "kiosk":
      return (
        <g>
          <path d="M140 40 H 260 V 260 H 140 Z" />
          <rect x="158" y="62" width="84" height="60" rx="3" />
          <path d="M176 150 h 48" stroke={A} strokeWidth="3" />
          <circle cx="200" cy="186" r="12" />
          <path d="M170 226 h 60 v 50 h -60 z" strokeDasharray="3 4" stroke={A} />
          <text x="270" y="160">COIN</text>
          <text x="270" y="240">TICKET</text>
        </g>
      );
    case "streaming":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(40 ${54 + i * 70})`}>
              <rect width="44" height="28" rx="4" />
              <path d="M44 9 l14 -8 v26 l-14 -8" />
              <path d={`M60 14 C 110 14, 120 ${100 - i * 70 + 50}, 170 ${100 - i * 70 + 50}`} className="pv-flow" />
            </g>
          ))}
          <rect x="170" y="120" width="56" height="80" rx="4" stroke={A} />
          <path d="M226 160 H 270" className="pv-flow" />
          <rect x="270" y="110" width="100" height="100" rx="6" />
          <path d="M310 145 l24 15 l-24 15 z" fill={A} stroke="none" />
          <text x="40" y="270">RTSP · LIVE · CENTRAL SERVER</text>
        </g>
      );
    case "network":
      return (
        <g>
          {[
            [60, 80], [150, 50], [250, 90], [340, 60], [110, 170], [210, 160], [310, 190], [170, 250], [60, 240],
          ].map(([x, y], i, arr) => (
            <g key={i}>
              {arr.slice(i + 1, i + 3).map(([x2, y2], j) => (
                <path key={j} d={`M${x} ${y} L ${x2} ${y2}`} strokeDasharray={j ? "3 5" : undefined} />
              ))}
              <circle cx={x} cy={y} r={i === 5 ? 9 : 5} fill={i === 5 ? A : "var(--pv-bg)"} />
            </g>
          ))}
        </g>
      );
    case "vr":
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M200 150 L ${-40 + i * 60} 300`} />
          ))}
          {[180, 210, 250].map((y) => (
            <path key={y} d={`M0 ${y} H 400`} strokeDasharray="2 6" />
          ))}
          <path d="M120 70 h 160 a 20 20 0 0 1 20 20 v 30 a 20 20 0 0 1 -20 20 h -50 l -30 -16 l -30 16 h -50 a 20 20 0 0 1 -20 -20 v -30 a 20 20 0 0 1 20 -20 z" stroke={A} />
          <circle cx="165" cy="105" r="14" />
          <circle cx="235" cy="105" r="14" />
        </g>
      );
    case "ar":
      return (
        <g>
          <path d="M70 120 h 110 l 20 -10 l 20 10 h 110" />
          <rect x="80" y="110" width="100" height="50" rx="16" />
          <rect x="220" y="110" width="100" height="50" rx="16" />
          {[
            [70, 200],
            [300, 200],
          ].map(([x, y], i) => (
            <g key={i} stroke={A}>
              <path d={`M${x} ${y} h 18 M${x} ${y} v 18`} />
              <path d={`M${x + 30} ${y + 50} h -18 M${x + 30} ${y + 50} v -18`} />
            </g>
          ))}
          <path d="M150 230 h 100" stroke={A} />
          <text x="150" y="214">GUIDANCE</text>
        </g>
      );
    case "platform":
      return (
        <g>
          <rect x="50" y="50" width="300" height="200" rx="6" />
          <path d="M50 80 H 350 M130 80 V 250" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M66 ${104 + i * 26} h 46`} stroke={i === 1 ? A : undefined} />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M150 ${104 + i * 22} h ${60 + ((i * 47) % 120)}`} />
          ))}
          <path d="M280 200 l 20 -30 l 20 30 z" stroke={A} />
          {[64, 78, 92].map((x) => (
            <circle key={x} cx={x} cy="65" r="4" />
          ))}
        </g>
      );
    case "underwater":
      return (
        <g>
          {[60, 80].map((y) => (
            <path key={y} d={`M0 ${y} q 25 -12 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0`} stroke={y === 60 ? A : undefined} />
          ))}
          {[
            [120, 160, 1],
            [230, 200, 0.8],
            [280, 140, 0.7],
          ].map(([x, y, s], i) => (
            <path
              key={i}
              transform={`translate(${x} ${y}) scale(${s})`}
              d="M-40 0 q 30 -26 60 0 q -30 26 -60 0 z M20 0 l 18 -14 v 28 z"
            />
          ))}
          <rect x="40" y="220" width="40" height="28" rx="4" stroke={A} />
          <path d="M80 234 l 14 -8 v 16 z" stroke={A} />
          <path d="M60 220 V 70" strokeDasharray="3 5" />
          <text x="110" y="270">LIVE UNDERWATER STREAM</text>
        </g>
      );
    case "agent":
    case "research":
    default:
      return (
        <g>
          {Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx="200" cy="150" r={30 + i * 24} strokeDasharray={i % 2 ? "2 6" : undefined} />
          ))}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i} cx={200 + Math.cos(a) * 102} cy={150 + Math.sin(a) * 102} r="5" fill={i % 3 ? "var(--pv-bg)" : A} />;
          })}
        </g>
      );
  }
}

export function ProjectVisual({
  kind,
  tone = "dark",
  caption = true,
  className,
}: {
  kind: VisualKind;
  tone?: "dark" | "light";
  caption?: boolean;
  className?: string;
}) {
  return (
    <figure className={`pv pv--${tone}${className ? ` ${className}` : ""}`}>
      <svg viewBox="0 0 400 300" className="pv__svg" aria-hidden="true">
        <defs>
          <pattern id={`pv-grid-${tone}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 H0 V20" className="pv__grid" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#pv-grid-${tone})`} stroke="none" />
        <g className="pv__art">
          <Art kind={kind} />
        </g>
      </svg>
      {caption && <figcaption className="visual-caption pv__caption">Conceptual visualisation — not project imagery</figcaption>}
    </figure>
  );
}
