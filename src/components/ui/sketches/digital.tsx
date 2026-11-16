import type { VisualKind } from "@/content/projects";
import { DRAW, Dim, Note, dl, lp, r1, type SketchDef } from "./kit";
import "./digital.css";

/**
 * Digital sketches: AR maintenance, platform architecture, R&D loop and AI
 * agent, plus one drawing per product / research initiative.
 *
 * Loop helpers (styled in digital.css):
 * - "dg-s dg-sN": snaps on at N x 8% of the cycle, stays, clears at 88-92%.
 * - "dg-w dg-wN": a stroke that writes itself from N x 8% (pathLength 1).
 * - Zip: a short dash running along a path once per cycle, offset with lp().
 * - "dg-blip" / "dg-lit": a quick blink / a soft fill that lights a block.
 * - "dg-spin": rotates once per cycle around an inline transform-origin.
 * - "dg-label": a small label that stays visible in the card variant.
 */

type Pt = readonly [number, number];

const snap = (n: number) => `dg-s dg-s${n}`;
const write = (n: number, extra = "") => `s dg-w dg-w${n}${extra ? ` ${extra}` : ""}`;

function Zip({ d, at, red = false }: { d: string; at: number; red?: boolean }) {
  return <path d={d} pathLength={1} className={`dg-zip${red ? " dg-zip--red" : ""}`} style={lp(at)} />;
}

/** four corner brackets around a box */
const corners = (x1: number, y1: number, x2: number, y2: number, k: number) =>
  `M${x1} ${y1 + k} V ${y1} H ${x1 + k} M${x2 - k} ${y1} H ${x2} V ${y1 + k} M${x2} ${y2 - k} V ${y2} H ${x2 - k} M${x1 + k} ${y2} H ${x1} V ${y2 - k}`;

/** a line from a to b, trimmed by ra at a and rb at b */
const seg = (a: Pt, b: Pt, ra: number, rb: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return `M${r1(a[0] + ux * ra)} ${r1(a[1] + uy * ra)} L ${r1(b[0] - ux * rb)} ${r1(b[1] - uy * rb)}`;
};

/* ---------- ar: tablet over a motor, AR overlay walks a maintenance step ---------- */

const AR_FINS = [48, 60, 72, 84, 96, 108, 120];
const AR_SCREEN_FINS = [226, 236, 246, 256, 266, 276, 286];
const AR_TRACK = ["M206 112 V 100 H 218", "M318 100 H 330 V 112", "M330 176 V 188 H 318", "M218 188 H 206 V 176"];

function ArMaintenance() {
  return (
    <g>
      {/* the real motor */}
      <line x1={16} y1={250} x2={178} y2={250} {...DRAW} style={dl(0)} />
      <rect x={36} y={242} width={104} height={8} rx={1} {...DRAW} style={dl(0.1)} />
      <path d="M46 230 V 242 M62 230 V 242 M114 230 V 242 M130 230 V 242" {...DRAW} style={dl(0.2)} />
      <rect x={34} y={150} width={104} height={80} rx={6} {...DRAW} style={dl(0.2)} />
      {AR_FINS.map((x, i) => (
        <line key={x} x1={x} y1={156} x2={x} y2={224} className="s s--soft d" pathLength={1} style={dl(0.5 + i * 0.04)} />
      ))}
      <path d="M138 160 H 148 Q 154 160 154 166 V 214 Q 154 220 148 220 H 138" {...DRAW} style={dl(0.4)} />
      <rect x={154} y={185} width={16} height={10} rx={1} {...DRAW} style={dl(0.6)} />
      <rect x={64} y={134} width={34} height={16} rx={2} {...DRAW} style={dl(0.5)} />
      <circle cx={164} cy={190} r={3.2} className="dg-blip dg-blip--red" style={lp(1.9)} />
      <Note x={34} y={126} d={0.8}>
        M1 · 7.5 kW
      </Note>
      <Dim x1={34} y1={262} x2={170} y2={262} label="L 420" />

      {/* view rays to the tablet camera */}
      <path d="M140 146 L 182 104 M156 222 L 182 198" className="s s--soft s--dash sk-fade" style={dl(0.9)} />

      {/* tablet and screen */}
      <rect x={182} y={56} width={194} height={150} rx={10} {...DRAW} style={dl(0.3)} />
      <rect x={192} y={66} width={174} height={130} rx={3} className="s s--soft d" pathLength={1} style={dl(0.5)} />
      <circle cx={279} cy={61} r={1.6} className="sk-dot sk-fade" style={dl(0.8)} />
      <Note x={182} y={48} d={1}>
        AR VIEW · TRACKED
      </Note>
      <Dim x1={182} y1={218} x2={376} y2={218} label="W 250" />

      {/* camera feed: the same motor, seen on screen */}
      <g className="sk-fade" style={dl(1)}>
        <rect x={214} y={118} width={82} height={60} rx={5} className="s s--soft" />
        {AR_SCREEN_FINS.map((x) => (
          <line key={x} x1={x} y1={123} x2={x} y2={173} className="s s--soft" />
        ))}
        <path d="M296 126 H 302 Q 307 126 307 131 V 165 Q 307 170 302 170 H 296" className="s s--soft" />
        <rect x={307} y={143} width={14} height={8} rx={1} className="s s--soft" />
        <rect x={238} y={106} width={28} height={12} rx={2} className="s s--soft" />
        <path d="M210 184 H 312 M222 178 V 184 M288 178 V 184" className="s s--soft" />
      </g>

      {/* overlay, in order: tracking lock, step panel, callouts, action arrow, progress */}
      <g className={snap(0)}>
        {AR_TRACK.map((d, i) => (
          <path key={d} d={d} className="s s--red dg-trk" style={lp(i * 0.15)} />
        ))}
      </g>
      <g className={snap(1)}>
        <rect x={198} y={70} width={110} height={18} rx={3} className="s s--blue" />
        <text x={204} y={82.5} className="dg-label">
          STEP 2 / 5
        </text>
        <path d="M266 79 H 272" className="s s--blue" />
        <path d="M282 79 H 288 M290 79 H 296 M298 79 H 304" className="s s--soft" />
      </g>
      <g className={snap(2)}>
        <circle cx={252} cy={112} r={8} className="s s--blue" />
        <path d="M258 106 L 268 94 H 334" className="s s--blue" />
        <text x={336} y={97} className="sk-note">
          T-BOX
        </text>
      </g>
      <g className={snap(3)}>
        <circle cx={321} cy={147} r={7} className="s s--blue" />
        <path d="M326 152 L 336 166" className="s s--blue" />
        <text x={334} y={176} className="sk-note">
          24 Nm
        </text>
      </g>
      <g className={snap(4)}>
        <g className="ar-nudge" style={lp(0)}>
          <path d="M312.1 133.7 A 16 16 0 0 1 336 140 M336.1 133.3 L 336 140 L 330.7 135.9" className="s s--red" />
        </g>
      </g>
      <g className={snap(5)}>
        <path d="M274 79 H 280" className="s s--blue" />
      </g>
    </g>
  );
}

/* ---------- platform: clients, API gateway, services, storage ---------- */

const PF_COLS = [80, 200, 320];
const PF_CLIENT_BOTTOM = [72, 80, 84];
const PF_SERVICES = ["auth", "content", "session"];
const PF_STORES = ["db", "objects", "cache"];
const PF_STEP = 1.6;

function Platform() {
  return (
    <g>
      {/* clients: VR headset, web browser, phone */}
      <rect x={50} y={46} width={60} height={26} rx={8} {...DRAW} style={dl(0)} />
      <path d="M50 52 C 42 52 40 66 50 66 M110 52 C 118 52 120 66 110 66 M74 72 Q 80 64 86 72" {...DRAW} style={dl(0.2)} />
      <rect x={160} y={40} width={80} height={40} rx={3} {...DRAW} style={dl(0.1)} />
      <path d="M160 48 H 240 M168 58 H 210 M168 66 H 226 M168 73 H 196" className="s s--soft d" pathLength={1} style={dl(0.4)} />
      <rect x={304} y={36} width={32} height={48} rx={5} {...DRAW} style={dl(0.2)} />
      <path d="M314 41 H 326 M310 48 H 330 V 74 H 310 Z" className="s s--soft d" pathLength={1} style={dl(0.4)} />
      <Note x={80} y={36} anchor="middle" d={0.6}>
        VR
      </Note>
      <Note x={200} y={32} anchor="middle" d={0.6}>
        WEB
      </Note>
      <Note x={346} y={62} d={0.6}>
        MOBILE
      </Note>

      {/* API gateway */}
      <rect x={40} y={112} width={320} height={26} rx={4} {...DRAW} style={dl(0.5)} />
      <Note x={200} y={128} anchor="middle" d={1}>
        API GATEWAY · REST / WS
      </Note>

      {/* services and storage */}
      {PF_COLS.map((x, i) => (
        <g key={`svc${x}`}>
          <rect x={x - 40} y={168} width={80} height={36} rx={3} {...DRAW} style={dl(0.7 + i * 0.1)} />
          <rect x={x - 37} y={171} width={74} height={30} rx={2} className="dg-lit" style={lp(i * PF_STEP + 0.3)} />
          <Note x={x} y={190} anchor="middle" d={1.2}>
            {PF_SERVICES[i]}
          </Note>
          <ellipse cx={x} cy={238} rx={22} ry={6} {...DRAW} style={dl(0.9 + i * 0.1)} />
          <path d={`M${x - 22} 238 V 262 A 22 6 0 0 0 ${x + 22} 262 V 238`} {...DRAW} style={dl(1 + i * 0.1)} />
          <path d={`M${x - 22} 250 A 22 6 0 0 0 ${x + 22} 250`} className="s s--soft d" pathLength={1} style={dl(1.2 + i * 0.1)} />
          <ellipse cx={x} cy={238} rx={8} ry={2.4} className="dg-blip" style={lp(i * PF_STEP + 0.8)} />
          <Note x={x + 28} y={258} d={1.4}>
            {PF_STORES[i]}
          </Note>
        </g>
      ))}

      {/* connectors: requests down on the left lane, responses up on the right lane */}
      {PF_COLS.map((x, i) => {
        const t = i * PF_STEP;
        const top = PF_CLIENT_BOTTOM[i];
        return (
          <g key={`ln${x}`}>
            <path
              d={`M${x - 4} ${top} V 112 M${x + 4} ${top} V 112 M${x - 4} 138 V 168 M${x + 4} 138 V 168 M${x - 4} 204 V 232 M${x + 4} 204 V 232`}
              className="s s--soft d"
              pathLength={1}
              style={dl(0.6 + i * 0.1)}
            />
            <rect x={x - 6} y={110} width={4} height={4} className="dg-blip" style={lp(t + 0.3)} />
            <Zip d={`M${x - 4} ${top} V 112`} at={t} />
            <Zip d={`M${x - 4} 138 V 168`} at={t + 0.3} />
            <Zip d={`M${x - 4} 204 V 232`} at={t + 0.6} />
            <Zip d={`M${x + 4} 232 V 204`} at={t + 0.85} red />
            <Zip d={`M${x + 4} 168 V 138`} at={t + 1.1} red />
            <Zip d={`M${x + 4} 112 V ${top}`} at={t + 1.35} red />
          </g>
        );
      })}
      <Dim x1={370} y1={112} x2={370} y2={204} label="tiers" />
    </g>
  );
}

/* ---------- research: hypothesis notebook, scatter + fit, iterate ---------- */

const RS_Y0 = 186;
const rsCurve = (x: number) => r1(RS_Y0 - 120 * (1 - Math.exp(-(x - 180) / 60)));
const RS_FIT = Array.from({ length: 16 }, (_, i) => 180 + i * 12)
  .map((x, i) => `${i === 0 ? "M" : "L"}${x} ${rsCurve(x)}`)
  .join(" ");
const RS_X = [192, 210, 226, 244, 262, 280, 298, 318, 338, 356];
const RS_OFF = [-5, 6, -6, 4, -5, 5, -3, 4, -4, 3];
const RS_POINTS = RS_X.map((x, i) => ({ x, y: r1(rsCurve(x) + RS_OFF[i]), fit: rsCurve(x), step: i < 4 ? 3 : i < 7 ? 4 : 5 }));

function Research() {
  return (
    <g>
      {/* notebook */}
      <rect x={24} y={46} width={110} height={164} rx={3} {...DRAW} style={dl(0)} />
      {[58, 78, 98, 118, 138, 158, 178, 198].map((y) => (
        <circle key={`ring${y}`} cx={24} cy={y} r={3} className="s sk-fade" style={dl(0.4)} />
      ))}
      {[70, 84, 98, 112, 126, 140, 154, 168, 182, 196].map((y) => (
        <line key={`rule${y}`} x1={34} y1={y} x2={126} y2={y} className="s s--soft sk-fade" style={dl(0.5)} />
      ))}
      <Note x={38} y={66} d={0.8}>
        H1
      </Note>
      <path d="M40 80 q 6 -4 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0" pathLength={1} className={write(0)} />
      <path d="M40 94 q 6 -4 12 0 t 12 0 t 12 0 t 12 0" pathLength={1} className={write(1)} />
      <path d="M40 120 V 160 H 120" className="s s--soft sk-fade" style={dl(0.7)} />
      <path d="M42 156 Q 62 124 116 124" pathLength={1} className={write(2, "s--blue")} />

      {/* hypothesis to experiment */}
      <path d="M138 120 H 168 M162 116 L 168 120 L 162 124" {...DRAW} style={dl(0.6)} />
      <Zip d="M138 120 H 168" at={1.3} />

      {/* plot */}
      <path d="M176 46 V 196 H 368" {...DRAW} style={dl(0.4)} />
      {[212, 248, 284, 320, 356].map((x) => (
        <line key={`tx${x}`} x1={x} y1={196} x2={x} y2={200} className="s s--soft sk-fade" style={dl(0.8)} />
      ))}
      {[76, 106, 136, 166].map((y) => (
        <line key={`ty${y}`} x1={172} y1={y} x2={176} y2={y} className="s s--soft sk-fade" style={dl(0.8)} />
      ))}
      <Note x={170} y={52} anchor="end" d={1}>
        y
      </Note>
      <Note x={368} y={210} anchor="end" d={1}>
        trial
      </Note>
      {RS_POINTS.map((p) => (
        <g key={`pt${p.x}`} className={snap(p.step)}>
          <line x1={p.x} y1={p.y} x2={p.x} y2={p.fit} className="s s--soft" />
          <circle cx={p.x} cy={p.y} r={2.6} className="s" />
          <circle cx={p.x} cy={p.y} r={1} className="sk-dot" />
        </g>
      ))}
      <path d={RS_FIT} pathLength={1} className={write(5, "s--red")} />
      <g className={snap(6)}>
        <text x={364} y={58} textAnchor="end" className="sk-note">
          fit: 1 − e^(−x/τ)
        </text>
        <text x={364} y={70} textAnchor="end" className="sk-note">
          R² 0.97
        </text>
      </g>

      {/* feedback to the next hypothesis */}
      <path d="M272 214 V 256 H 79 V 216 M75 222 L 79 216 L 83 222" className="s s--soft d" pathLength={1} style={dl(1.2)} />
      <Zip d="M272 214 V 256 H 79 V 216" at={3.1} red />
      <g className="sk-fade" style={dl(1.4)}>
        <g className="dg-spin" style={{ transformOrigin: "176px 234px" }}>
          <path d="M176 223 A 11 11 0 1 1 165 234 M161 239 L 165 233.5 L 169 239" className="s s--blue" />
        </g>
        <text x={193} y={238} className="dg-label">
          iterate
        </text>
      </g>
    </g>
  );
}

/* ---------- agent: plan / act / observe ring calling tools in turn ---------- */

const AG_C: Pt = [200, 150];
const AG_R = 48;
const AG_TOOLS: { at: Pt; label: string; lx: number; ly: number }[] = [
  { at: [64, 70], label: "database", lx: 64, ly: 100 },
  { at: [336, 70], label: "API", lx: 336, ly: 100 },
  { at: [336, 226], label: "sensor", lx: 336, ly: 262 },
  { at: [64, 226], label: "docs", lx: 64, ly: 262 },
];
const AG_LINKS = AG_TOOLS.map((t) => seg(AG_C, t.at, AG_R + 4, 26));
const AG_BACK = AG_TOOLS.map((t) => seg(t.at, AG_C, 26, AG_R + 4));
const AG_SLOT = 1.5;
const agOn = (deg: number): Pt => [r1(AG_C[0] + AG_R * Math.cos((deg * Math.PI) / 180)), r1(AG_C[1] + AG_R * Math.sin((deg * Math.PI) / 180))];
const AG_STATIONS = [
  { deg: -90, label: "plan", at: 0 },
  { deg: 30, label: "act", at: 0.5 },
  { deg: 150, label: "observe", at: 1 },
];
const AG_TRAIL = agOn(-120);

function Agent() {
  return (
    <g>
      {/* tools */}
      <ellipse cx={64} cy={58} rx={18} ry={5} {...DRAW} style={dl(0.6)} />
      <path d="M46 58 V 82 A 18 5 0 0 0 82 82 V 58 M46 70 A 18 5 0 0 0 82 70" {...DRAW} style={dl(0.7)} />
      <rect x={314} y={52} width={44} height={36} rx={4} {...DRAW} style={dl(0.7)} />
      <path
        d="M330 60 q -5 0 -5 5 v 2 q 0 3 -3 3 q 3 0 3 3 v 2 q 0 5 5 5 M342 60 q 5 0 5 5 v 2 q 0 3 3 3 q -3 0 -3 3 v 2 q 0 5 -5 5"
        className="s s--soft d"
        pathLength={1}
        style={dl(0.9)}
      />
      <circle cx={336} cy={226} r={8} {...DRAW} style={dl(0.8)} />
      <path d="M336 234 V 246 M326 246 H 346 M350 214 A 18 18 0 0 1 350 238 M357 208 A 26 26 0 0 1 357 244" className="s s--soft d" pathLength={1} style={dl(1)} />
      <path d="M48 206 H 72 L 82 216 V 246 H 48 Z M72 206 V 216 H 82" {...DRAW} style={dl(0.9)} />
      <path d="M54 222 H 74 M54 230 H 76 M54 238 H 68" className="s s--soft d" pathLength={1} style={dl(1.1)} />
      {AG_TOOLS.map((t, i) => (
        <g key={t.label}>
          <circle cx={t.at[0]} cy={t.at[1]} r={24} className="dg-lit" style={lp(i * AG_SLOT + 0.95)} />
          <Note x={t.lx} y={t.ly} anchor="middle" d={1.3}>
            {t.label}
          </Note>
        </g>
      ))}

      {/* links, calls out (blue) and results back (red), one tool per slot */}
      {AG_LINKS.map((d, i) => (
        <g key={`ln${i}`}>
          <path d={d} className="s s--soft s--dash sk-fade" style={dl(1 + i * 0.1)} />
          <Zip d={d} at={i * AG_SLOT + 0.5} />
          <Zip d={AG_BACK[i]} at={i * AG_SLOT + 1} red />
        </g>
      ))}

      {/* agent core and reasoning ring */}
      <circle cx={AG_C[0]} cy={AG_C[1]} r={AG_R} {...DRAW} style={dl(0)} />
      <circle cx={AG_C[0]} cy={AG_C[1]} r={22} {...DRAW} style={dl(0.3)} />
      <circle cx={AG_C[0]} cy={AG_C[1]} r={14} className="s s--soft s--dash sk-fade" style={dl(0.5)} />
      <circle cx={AG_C[0]} cy={AG_C[1]} r={2.4} className="sk-dot sk-fade" style={dl(0.6)} />
      <Note x={AG_C[0]} y={AG_C[1] + 36} anchor="middle" d={0.9}>
        AGENT
      </Note>
      {AG_STATIONS.map((s) => {
        const [x, y] = agOn(s.deg);
        const [lx, ly] = [r1(AG_C[0] + (AG_R + 14) * Math.cos((s.deg * Math.PI) / 180)), r1(AG_C[1] + (AG_R + 14) * Math.sin((s.deg * Math.PI) / 180))];
        return (
          <g key={s.label}>
            <circle cx={x} cy={y} r={4} className="s sk-fade" style={dl(0.6)} />
            <circle cx={x} cy={y} r={2.6} className="dg-blip dg-blip--q" style={lp(s.at)} />
            <Note x={lx} y={ly + 3} anchor={s.deg === -90 ? "middle" : s.deg === 30 ? "start" : "end"} d={1}>
              {s.label}
            </Note>
          </g>
        );
      })}
      <g className="sk-fade" style={dl(1.2)}>
        <g className="dg-spin dg-spin--q" style={{ transformOrigin: `${AG_C[0]}px ${AG_C[1]}px` }}>
          <path d={`M${AG_TRAIL[0]} ${AG_TRAIL[1]} A ${AG_R} ${AG_R} 0 0 1 200 102 M195 97.5 L 201 102 L 195 106.5`} className="s s--blue" />
        </g>
      </g>
    </g>
  );
}

/* ================= initiatives ================= */

/* BONA AI: inbound channels, AI triage, a lead moving through the pipeline */

const BN_GEAR = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return `M${r1(160 + 8 * Math.cos(a))} ${r1(150 + 8 * Math.sin(a))} L ${r1(160 + 11.5 * Math.cos(a))} ${r1(150 + 11.5 * Math.sin(a))}`;
}).join(" ");
const BN_HEX = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3;
  return `${r1(160 + 24 * Math.cos(a))},${r1(150 + 24 * Math.sin(a))}`;
}).join(" ");
const BN_IN = ["M70 72 C 110 72 112 138 138 144", "M70 150 H 134", "M66 230 C 110 230 112 162 138 156"];
const BN_COLS = [222, 274, 326];
const BN_CARDS: Pt[] = [
  [0, 80],
  [0, 110],
  [1, 80],
  [2, 80],
  [2, 110],
  [2, 140],
];

function BonaAi() {
  return (
    <g>
      {/* chat, mail, call */}
      <path d="M30 58 H 62 Q 66 58 66 62 V 80 Q 66 84 62 84 H 40 L 32 92 V 84 H 30 Q 26 84 26 80 V 62 Q 26 58 30 58 Z" {...DRAW} style={dl(0)} />
      <path d="M34 67 H 58 M34 75 H 50" className="s s--soft d" pathLength={1} style={dl(0.3)} />
      <rect x={26} y={136} width={40} height={28} rx={2} {...DRAW} style={dl(0.1)} />
      <path d="M26 136 L 46 152 L 66 136" {...DRAW} style={dl(0.3)} />
      <path d="M32 214 q -6 12 6 26 q 10 10 20 8 l 4 -6 l -8 -6 l -4 4 q -8 -4 -12 -14 l 4 -4 l -6 -8 z" {...DRAW} style={dl(0.2)} />

      {/* inbound to the AI node */}
      {BN_IN.map((d, i) => (
        <g key={d}>
          <path d={d} className="s s--soft d" pathLength={1} style={dl(0.4 + i * 0.1)} />
          <Zip d={d} at={i * 0.2} />
        </g>
      ))}
      <polygon points={BN_HEX} {...DRAW} style={dl(0.5)} />
      <polygon points={BN_HEX} className="dg-lit" style={lp(0.5)} />
      <g className="sk-fade" style={dl(0.8)}>
        <g className="dg-spin" style={{ transformOrigin: "160px 150px" }}>
          <circle cx={160} cy={150} r={8} className="s s--blue" />
          <path d={BN_GEAR} className="s s--blue" />
        </g>
      </g>
      <Note x={160} y={188} anchor="middle" d={1}>
        AI triage
      </Note>
      <path d="M184 150 H 220 M214 146 L 220 150 L 214 154" {...DRAW} style={dl(0.7)} />
      <Zip d="M184 150 H 220" at={0.9} />

      {/* pipeline board: new, qualified, won */}
      <rect x={222} y={54} width={156} height={192} rx={4} {...DRAW} style={dl(0.4)} />
      <path d="M222 70 H 378 M274 54 V 246 M326 54 V 246" className="s s--soft d" pathLength={1} style={dl(0.7)} />
      {BN_COLS.map((x, i) => (
        <line key={`h${x}`} x1={x + 8} y1={62} x2={x + 26 + i * 4} y2={62} className="s sk-fade" style={dl(1)} />
      ))}
      {BN_CARDS.map(([c, y]) => (
        <g key={`c${c}${y}`} className="sk-fade" style={dl(1 + c * 0.1)}>
          <rect x={BN_COLS[c] + 6} y={y} width={40} height={22} rx={2} className="s s--soft" />
          <line x1={BN_COLS[c] + 11} y1={y + 8} x2={BN_COLS[c] + 33} y2={y + 8} className="s s--soft" />
        </g>
      ))}
      <g className="bn-lead">
        <rect x={228} y={196} width={40} height={24} rx={2} className="s s--blue" />
        <path d="M233 204 H 257 M233 212 H 249" className="s s--blue" />
        <path d="M254 212 l 3 3 l 6 -6" className="s s--red bn-tick" />
      </g>
    </g>
  );
}

/* BiziGPT: a WhatsApp chat with the assistant, synced to the shop's stock */

function BiziGpt() {
  return (
    <g>
      {/* phone */}
      <rect x={70} y={32} width={100} height={236} rx={14} {...DRAW} style={dl(0)} />
      <rect x={78} y={50} width={84} height={200} rx={3} className="s s--soft d" pathLength={1} style={dl(0.3)} />
      <path d="M110 41 H 130" className="s sk-fade" style={dl(0.5)} />
      <circle cx={88} cy={58} r={4} className="s sk-fade" style={dl(0.6)} />
      <path d="M96 58 H 130 M78 66 H 162" className="s s--soft sk-fade" style={dl(0.6)} />
      <rect x={84} y={232} width={64} height={12} rx={6} className="s s--soft sk-fade" style={dl(0.7)} />
      <circle cx={155} cy={238} r={4} className="s s--blue sk-fade" style={dl(0.7)} />

      {/* the conversation */}
      <g className={snap(0)}>
        <rect x={84} y={74} width={50} height={18} rx={6} className="s" />
        <path d="M90 81 H 124 M90 86 H 112" className="s s--soft" />
      </g>
      <g className="bz-typing">
        <rect x={126} y={98} width={30} height={14} rx={6} className="s s--blue" />
        {[134, 141, 148].map((x, i) => (
          <circle key={x} cx={x} cy={105} r={1.6} className="sk-dot dg-blink" style={lp(i * 0.15)} />
        ))}
      </g>
      <g className={snap(3)}>
        <rect x={100} y={98} width={56} height={46} rx={6} className="s s--blue" />
        <rect x={106} y={104} width={18} height={18} rx={1} className="s s--soft" />
        <path d="M106 122 L 116 112 L 124 120 M130 108 H 150 M130 115 H 144 M106 130 H 150 M106 137 H 132" className="s s--soft" />
      </g>
      <g className={snap(4)}>
        <rect x={84} y={152} width={40} height={16} rx={6} className="s" />
        <path d="M90 160 H 116" className="s s--soft" />
      </g>
      <g className={snap(6)}>
        <rect x={110} y={176} width={46} height={18} rx={6} className="s s--blue" />
        <path d="M117 185 l 4 4 l 8 -8" className="s s--red" />
        <path d="M134 185 H 150" className="s s--soft" />
      </g>

      {/* link to the shop */}
      <path d="M174 146 H 256 M174 154 H 256" className="s s--soft s--dash sk-fade" style={dl(0.9)} />
      <Zip d="M174 146 H 256" at={0.15} />
      <Zip d="M256 154 H 174" at={0.65} red />
      <Zip d="M174 146 H 256" at={2} />
      <Zip d="M256 154 H 174" at={2.5} red />
      <Note x={215} y={140} anchor="middle" d={1.2}>
        stock · orders
      </Note>

      {/* shop front */}
      <path d="M270 84 H 362 L 370 100 H 262 Z" {...DRAW} style={dl(0.4)} />
      <path d="M262 100 q 9 10 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0" {...DRAW} style={dl(0.6)} />
      <rect x={268} y={100} width={96} height={100} {...DRAW} style={dl(0.5)} />
      <rect x={300} y={150} width={26} height={50} {...DRAW} style={dl(0.8)} />
      <rect x={276} y={120} width={18} height={26} className="s s--soft d" pathLength={1} style={dl(0.9)} />
      <rect x={336} y={120} width={22} height={26} className="s s--soft d" pathLength={1} style={dl(0.9)} />
      <path d="M276 133 H 294 M336 133 H 358" className="s s--soft sk-fade" style={dl(1.1)} />
      <rect x={277} y={121} width={16} height={24} className="dg-lit" style={lp(0.55)} />
      <rect x={301} y={151} width={24} height={48} className="dg-lit" style={lp(2.45)} />
      <line x1={250} y1={200} x2={384} y2={200} {...DRAW} style={dl(0.3)} />
    </g>
  );
}

/* JEV Vision Integration: camera scan of a sealant bead, plus operator PPE check */

const JV_BEAD = "M306 166 H 330 A 12 12 0 0 1 342 178 V 222 A 12 12 0 0 1 330 234 H 130 A 12 12 0 0 1 118 222 V 178 A 12 12 0 0 1 130 166 H 280";

function JevVision() {
  return (
    <g>
      {/* gantry camera and field of view */}
      <path d="M110 26 H 350 M230 26 V 30" {...DRAW} style={dl(0)} />
      <rect x={214} y={30} width={32} height={20} rx={3} {...DRAW} style={dl(0.2)} />
      <rect x={222} y={50} width={16} height={8} rx={1} {...DRAW} style={dl(0.3)} />
      <path d="M230 58 L 100 150 M230 58 L 360 150" className="s s--soft s--dash sk-fade" style={dl(0.6)} />

      {/* part and sealant bead (with a gap) */}
      <rect x={100} y={150} width={260} height={100} rx={4} {...DRAW} style={dl(0.4)} />
      <path d={JV_BEAD} pathLength={1} className="s s--blue d jv-bead" style={dl(0.8)} />
      <circle cx={280} cy={166} r={1.6} className="sk-dot sk-fade" style={dl(1.4)} />
      <circle cx={306} cy={166} r={1.6} className="sk-dot sk-fade" style={dl(1.4)} />

      {/* scan line sweeps the part */}
      <line x1={100} y1={146} x2={100} y2={254} className="s s--red jv-scan" />

      {/* detections, in the order the scan reaches them */}
      <rect x={110} y={188} width={16} height={24} className={`s s--blue ${snap(0)}`} />
      <rect x={168} y={226} width={24} height={16} className={`s s--blue ${snap(2)}`} />
      <rect x={238} y={158} width={24} height={16} className={`s s--blue ${snap(4)}`} />
      <g className={snap(5)}>
        <rect x={278} y={156} width={30} height={20} className="s s--red" />
        <path d="M287 160 l 12 12 M299 160 l -12 12" className="s s--red" />
        <text x={293} y={150} textAnchor="middle" className="dg-label dg-label--red">
          NG
        </text>
      </g>
      <rect x={334} y={188} width={16} height={24} className={`s s--blue ${snap(6)}`} />
      <Note x={360} y={264} anchor="end" d={1.6}>
        bead 4 OK · 1 NG
      </Note>

      {/* operator compliance */}
      <path d="M40 94 H 64 M42 94 A 10 10 0 0 1 62 94" {...DRAW} style={dl(0.5)} />
      <circle cx={52} cy={100} r={8} {...DRAW} style={dl(0.6)} />
      <path d="M36 146 Q 36 116 52 116 Q 68 116 68 146" {...DRAW} style={dl(0.7)} />
      <path d={corners(28, 80, 76, 152, 9)} className={`s s--blue ${snap(1)}`} />
      <path d="M44 166 l 5 5 l 10 -10" className={`s s--blue ${snap(2)}`} />
      <Note x={52} y={190} anchor="middle" d={1.2}>
        PPE
      </Note>
    </g>
  );
}

/* BinWin: AI vision scanner on a phone feeding the admin dashboard */

const BW_BARS: [number, number][] = [
  [216, 30],
  [232, 44],
  [248, 26],
  [264, 52],
  [280, 38],
];

function BinWin() {
  return (
    <g>
      {/* phone scanner */}
      <rect x={30} y={52} width={86} height={184} rx={12} {...DRAW} style={dl(0)} />
      <rect x={38} y={68} width={70} height={152} rx={3} className="s s--soft d" pathLength={1} style={dl(0.3)} />
      <path d="M56 120 L 60 196 H 86 L 90 120 Z M52 112 H 94 V 120 H 52 Z" {...DRAW} style={dl(0.5)} />
      <circle cx={63} cy={200} r={4} {...DRAW} style={dl(0.7)} />
      <circle cx={83} cy={200} r={4} {...DRAW} style={dl(0.7)} />
      <path d="M73 146 l 8 14 h -16 z" className="s s--soft d" pathLength={1} style={dl(0.8)} />
      <path d={corners(46, 100, 100, 212, 9)} className="s s--red dg-trk" />
      <line x1={42} y1={102} x2={104} y2={102} className="s s--red bw-scan" />
      <g className={snap(5)}>
        <rect x={46} y={76} width={54} height={14} rx={7} className="s s--blue" />
        <path d="M52 83 l 3 3 l 6 -6 M66 83 H 92" className="s s--blue" />
      </g>

      {/* sync to the dashboard */}
      <path d="M120 144 H 168" className="s s--soft s--dash sk-fade" style={dl(0.8)} />
      <Zip d="M120 144 H 168" at={2.3} />

      {/* admin dashboard */}
      <rect x={168} y={46} width={212} height={190} rx={4} {...DRAW} style={dl(0.2)} />
      <path d="M168 58 H 380 M200 58 V 236" className="s s--soft d" pathLength={1} style={dl(0.5)} />
      {[174, 180, 186].map((x) => (
        <circle key={x} cx={x} cy={52} r={1.5} className="s sk-fade" style={dl(0.7)} />
      ))}
      <rect x={210} y={49} width={110} height={6} rx={3} className="s s--soft sk-fade" style={dl(0.7)} />
      <path d="M176 72 H 192 M176 84 H 188 M176 96 H 192" className="s s--soft sk-fade" style={dl(0.8)} />
      {[208, 266, 324].map((x, i) => (
        <g key={`k${x}`} className="sk-fade" style={dl(0.8 + i * 0.1)}>
          <rect x={x} y={66} width={i === 2 ? 50 : 52} height={24} rx={2} className="s" />
          <path d={`M${x + 6} 74 H ${x + 26} M${x + 6} 82 H ${x + 38}`} className="s s--soft" />
        </g>
      ))}
      <rect x={209} y={67} width={50} height={22} className="dg-lit" style={lp(2.7)} />
      <path d="M208 100 V 170 H 300" className="s s--soft d" pathLength={1} style={dl(0.9)} />
      {BW_BARS.map(([x, h], i) => (
        <rect key={`b${x}`} x={x} y={170 - h} width={10} height={h} className={`s ${i === BW_BARS.length - 1 ? "s--blue bw-bar" : "s--soft sk-fade"}`} style={dl(1 + i * 0.05)} />
      ))}
      <circle cx={343} cy={135} r={24} className="s s--soft d" pathLength={1} style={dl(1)} />
      <path d="M343 111 A 24 24 0 0 1 362.4 149.1" className="s s--blue d" pathLength={1} style={dl(1.3)} />
      <path d="M208 182 H 374 M208 198 H 374 M208 212 H 374" className="s s--soft sk-fade" style={dl(1.1)} />
      <path d="M214 191 H 244 M262 191 H 290 M214 205 H 236 M262 205 H 296" className="s s--soft sk-fade" style={dl(1.2)} />
      <g className={snap(6)}>
        <rect x={208} y={214} width={166} height={14} className="s s--blue" />
        <path d="M214 221 H 240 M262 221 H 300 M352 221 l 3 3 l 6 -6" className="s s--blue" />
      </g>
    </g>
  );
}

/* Pitwall: tiled developer command centre with a timing tower of agents */

const PW_LINES = [110, 80, 128, 96, 60, 118];
const PW_ROWS = [
  { y: 68, len: 84 },
  { y: 84, len: 64 },
  { y: 100, len: 72 },
  { y: 116, len: 40 },
  { y: 132, len: 56 },
];
const PW_SPARK = [206, 200, 204, 192, 196, 184, 188, 176, 182, 172, 178, 168, 174, 166]
  .map((y, i) => `${i === 0 ? "M" : "L"}${222 + i * 10} ${y}`)
  .join(" ");

function Pitwall() {
  return (
    <g>
      {/* monitor */}
      <rect x={28} y={30} width={344} height={206} rx={6} {...DRAW} style={dl(0)} />
      <rect x={36} y={38} width={328} height={190} rx={2} className="s s--soft d" pathLength={1} style={dl(0.2)} />
      <path d="M186 236 L 182 256 H 218 L 214 236 M160 256 H 240" {...DRAW} style={dl(0.3)} />
      <path d="M36 48 H 364 M336 43 H 356" className="s s--soft sk-fade" style={dl(0.5)} />
      {[46, 56, 66, 76].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={43} r={2} className="s sk-fade" style={dl(0.6)} />
          {i === 1 && <circle cx={x} cy={43} r={2} className="dg-blip" style={lp(0)} />}
        </g>
      ))}

      {/* terminal pane */}
      <rect x={40} y={52} width={170} height={172} rx={3} {...DRAW} style={dl(0.4)} />
      {PW_LINES.map((w, i) => {
        const y = 69 + i * 14;
        return (
          <g key={`t${y}`}>
            <path d={`M48 ${y - 3} l 4 3 l -4 3`} className="s s--blue sk-fade" style={dl(0.8)} />
            <path d={`M58 ${y} H ${58 + w}`} pathLength={1} className={write(i)} />
          </g>
        );
      })}
      <path d="M48 150 l 4 3 l -4 3" className="s s--blue sk-fade" style={dl(0.8)} />
      <rect x={58} y={148} width={6} height={10} className="dg-cur dg-blink" />

      {/* timing tower: agent runs */}
      <rect x={214} y={52} width={146} height={98} rx={3} {...DRAW} style={dl(0.5)} />
      {PW_ROWS.map((r, i) => (
        <g key={`r${r.y}`}>
          <rect x={220} y={r.y - 5} width={10} height={10} className="s sk-fade" style={dl(0.9 + i * 0.05)} />
          <path d={`M236 ${r.y} H 260`} className="s s--soft sk-fade" style={dl(0.9 + i * 0.05)} />
          <line x1={268} y1={r.y} x2={352} y2={r.y} className="s s--soft sk-fade" style={dl(1)} />
          <line x1={268} y1={r.y} x2={268 + r.len} y2={r.y} className="s s--blue pw-fill" style={lp(i * 0.2)} />
        </g>
      ))}
      <rect x={221} y={64} width={8} height={8} className="dg-blip dg-blip--red" style={lp(2.4)} />

      {/* telemetry pane */}
      <rect x={214} y={154} width={146} height={70} rx={3} {...DRAW} style={dl(0.6)} />
      <path d="M222 214 H 352" className="s s--soft sk-fade" style={dl(1)} />
      <path d={PW_SPARK} pathLength={1} className={write(2, "s--blue")} />
      <circle cx={352} cy={166} r={2.4} className="dg-blip dg-blip--red" style={lp(1.5)} />
    </g>
  );
}

/* OMGX-app: voice in, transcript, agent, actions out */

const OX_BARS = [8, 16, 26, 18, 30, 22, 12, 24, 14, 8];
const OX_ACTIONS = [
  { d: "M256 150 C 290 150 290 128 316 128", at: 2, tick: 128, step: 5 },
  { d: "M258 162 H 318", at: 2.4, tick: 170, step: 6 },
  { d: "M254 172 C 290 172 290 214 320 214", at: 2.8, tick: 214, step: 7 },
];

function OmgxApp() {
  return (
    <g>
      {/* phone with voice capture */}
      <rect x={36} y={36} width={90} height={228} rx={14} {...DRAW} style={dl(0)} />
      <rect x={44} y={54} width={74} height={192} rx={3} className="s s--soft d" pathLength={1} style={dl(0.3)} />
      <circle cx={81} cy={96} r={18} {...DRAW} style={dl(0.5)} />
      <circle cx={81} cy={96} r={6} className="s s--blue sk-fade" style={dl(0.8)} />
      {OX_BARS.map((h, i) => {
        const x = 54 + i * 6;
        return (
          <g key={x} className="sk-fade" style={dl(0.9)}>
            <line x1={x} y1={160 - h / 2} x2={x} y2={160 + h / 2} className="s s--blue ox-eq" style={lp(i * 0.08)} />
          </g>
        );
      })}
      <circle cx={81} cy={220} r={12} {...DRAW} style={dl(0.6)} />
      <path d="M78 214 V 221 Q 78 224 81 224 Q 84 224 84 221 V 214 Q 84 211 81 211 Q 78 211 78 214 Z M75 220 Q 75 228 81 228 Q 87 228 87 220 M81 228 V 231" className="s sk-fade" style={dl(0.9)} />
      <circle cx={81} cy={220} r={14} className="s s--blue ox-ring" style={lp(0)} />
      <circle cx={81} cy={220} r={14} className="s s--blue ox-ring" style={lp(0.6)} />

      {/* transcript */}
      <rect x={160} y={44} width={210} height={54} rx={6} {...DRAW} style={dl(0.4)} />
      <path d="M126 100 C 140 100 146 70 160 70" className="s s--soft d" pathLength={1} style={dl(0.6)} />
      <Zip d="M126 100 C 140 100 146 70 160 70" at={0} />
      <path d="M172 60 H 330" pathLength={1} className={write(0)} />
      <path d="M172 72 H 300" pathLength={1} className={write(1)} />
      <path d="M172 84 H 250" pathLength={1} className={write(2)} />

      {/* agent */}
      <path d="M230 98 V 126" className="s s--soft d" pathLength={1} style={dl(0.7)} />
      <Zip d="M230 98 V 126" at={1.5} />
      <circle cx={230} cy={160} r={26} {...DRAW} style={dl(0.5)} />
      <circle cx={230} cy={160} r={10} className="s s--blue d" pathLength={1} style={dl(0.8)} />
      <circle cx={230} cy={160} r={10} className="dg-lit" style={lp(1.9)} />
      <g className="sk-fade" style={dl(1)}>
        <g className="dg-spin" style={{ transformOrigin: "230px 160px" }}>
          <path d="M230 126 A 34 34 0 0 1 259.4 143 M253 140.5 L 259.4 143 L 259.6 136.2" className="s s--blue" />
        </g>
      </g>

      {/* actions: message, send, calendar */}
      <rect x={318} y={116} width={44} height={24} rx={6} {...DRAW} style={dl(0.8)} />
      <path d="M326 124 H 352 M326 131 H 344" className="s s--soft d" pathLength={1} style={dl(1)} />
      <path d="M322 172 L 358 156 L 346 188 L 340 176 Z M340 176 L 358 156" {...DRAW} style={dl(0.9)} />
      <rect x={322} y={200} width={36} height={30} rx={3} {...DRAW} style={dl(1)} />
      <path d="M322 210 H 358 M330 196 V 204 M350 196 V 204" className="s s--soft d" pathLength={1} style={dl(1.1)} />
      {OX_ACTIONS.map((a) => (
        <g key={a.d}>
          <path d={a.d} className="s s--soft s--dash sk-fade" style={dl(1.1)} />
          <Zip d={a.d} at={a.at} />
          <path d={`M366 ${a.tick} l 3 3 l 6 -6`} className={`s s--red ${snap(a.step)}`} />
        </g>
      ))}
    </g>
  );
}

/* Mallika AI Receptionist: enquiry, receptionist, a slot found and booked */

const ML_X0 = 186;
const ML_COL = 37;
const ML_Y0 = 62;
const ML_ROW = 32;
const ML_BOOKED: Pt[] = [
  [0, 0],
  [1, 1],
  [1, 2],
  [2, 0],
  [3, 3],
  [4, 1],
  [0, 4],
  [2, 5],
  [4, 4],
];
const mlSlot = (c: number, r: number) => ({ x: ML_X0 + c * ML_COL + 3, y: ML_Y0 + r * ML_ROW + 3, w: ML_COL - 6, h: ML_ROW - 6 });

function Mallika() {
  const cur = mlSlot(0, 2);
  const busy = mlSlot(1, 2);
  const book = mlSlot(2, 3);
  return (
    <g>
      {/* enquiry */}
      <g className={snap(0)}>
        <rect x={24} y={32} width={80} height={26} rx={8} className="s" />
        <path d="M32 42 H 90 M32 49 H 70" className="s s--soft" />
      </g>

      {/* receptionist with headset */}
      <circle cx={64} cy={112} r={16} {...DRAW} style={dl(0)} />
      <path d="M46 110 A 18 18 0 0 1 82 110" {...DRAW} style={dl(0.3)} />
      <rect x={42} y={106} width={6} height={12} rx={2} {...DRAW} style={dl(0.4)} />
      <rect x={80} y={106} width={6} height={12} rx={2} {...DRAW} style={dl(0.4)} />
      <path d="M45 118 Q 46 132 60 132" {...DRAW} style={dl(0.5)} />
      <circle cx={62} cy={132} r={2} className="sk-dot sk-fade" style={dl(0.7)} />
      <path d="M34 176 Q 34 140 64 140 Q 94 140 94 176" {...DRAW} style={dl(0.4)} />
      <circle cx={64} cy={112} r={16} className="dg-lit" style={lp(0.3)} />

      {/* salon scissors */}
      <circle cx={56} cy={220} r={5} {...DRAW} style={dl(0.6)} />
      <circle cx={72} cy={220} r={5} {...DRAW} style={dl(0.6)} />
      <path d="M59 216 L 78 194 M69 216 L 50 194" {...DRAW} style={dl(0.8)} />

      {/* reply */}
      <g className={snap(7)}>
        <rect x={24} y={240} width={92} height={26} rx={8} className="s s--blue" />
        <path d="M32 253 l 4 4 l 8 -8 M50 253 H 104" className="s s--blue" />
      </g>

      {/* receptionist to calendar */}
      <path d="M100 140 H 160 M154 136 L 160 140 L 154 144" className="s s--soft d" pathLength={1} style={dl(0.6)} />
      <Zip d="M100 140 H 160" at={0.5} />

      {/* week calendar */}
      <rect x={166} y={40} width={206} height={214} rx={4} {...DRAW} style={dl(0.2)} />
      <path d="M200 34 V 46 M338 34 V 46" {...DRAW} style={dl(0.4)} />
      <path d="M166 62 H 372" {...DRAW} style={dl(0.5)} />
      {[1, 2, 3, 4, 5].map((r) => (
        <line key={`r${r}`} x1={166} y1={ML_Y0 + r * ML_ROW} x2={372} y2={ML_Y0 + r * ML_ROW} className="s s--soft sk-fade" style={dl(0.8)} />
      ))}
      {[0, 1, 2, 3, 4].map((c) => (
        <g key={`c${c}`}>
          <line x1={ML_X0 + c * ML_COL} y1={62} x2={ML_X0 + c * ML_COL} y2={254} className="s s--soft sk-fade" style={dl(0.8)} />
          <line x1={ML_X0 + c * ML_COL + 10} y1={52} x2={ML_X0 + c * ML_COL + 26} y2={52} className="s s--soft sk-fade" style={dl(0.9)} />
        </g>
      ))}
      {ML_BOOKED.map(([c, r]) => {
        const s = mlSlot(c, r);
        return (
          <g key={`b${c}${r}`} className="sk-fade" style={dl(1 + (c + r) * 0.04)}>
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} className="s s--soft" />
            <line x1={s.x + 5} y1={s.y + 9} x2={s.x + s.w - 8} y2={s.y + 9} className="s s--soft" />
          </g>
        );
      })}
      <rect x={busy.x} y={busy.y} width={busy.w} height={busy.h} rx={2} className="dg-lit dg-lit--red" style={lp(1.8)} />
      <rect x={cur.x - 1} y={cur.y - 1} width={cur.w + 2} height={cur.h + 2} rx={3} className="s s--blue s--dash ml-cur" />
      <g className={snap(7)}>
        <rect x={book.x} y={book.y} width={book.w} height={book.h} rx={2} className="s s--blue" />
        <rect x={book.x} y={book.y} width={book.w} height={book.h} rx={2} className="dg-fill" />
        <path d={`M${book.x + 8} ${book.y + 13} l 4 4 l 9 -9`} className="s s--blue" />
      </g>
    </g>
  );
}

/* OMG Now: apartment community, hyperlocal radius, services from the gateway app */

const ON_A_WIN = [48, 68, 88].flatMap((x) => [100, 124, 148, 172, 196, 220].map((y) => [x, y] as Pt));
const ON_B_WIN = [130, 154, 178].flatMap((x) => [142, 166, 190, 214].map((y) => [x, y] as Pt));
const ON_LINKS = [
  { d: "M266 88 C 230 88 226 148 192 148", win: [178, 142] as Pt, tile: [278, 74] as Pt },
  { d: "M266 122 C 232 122 228 172 192 172", win: [178, 166] as Pt, tile: [278, 108] as Pt },
  { d: "M266 156 C 234 156 230 220 192 220", win: [178, 214] as Pt, tile: [278, 142] as Pt },
];
const ON_STEP = 1.8;
const ON_ICONS = [
  "M284 92 V 84 L 292 78 L 300 84 V 92 Z",
  "M314 80 H 318 L 322 92 H 332 L 334 84 H 320",
  "M285 128 L 296 117 M298 111 a 4 4 0 1 1 -1 6",
  "M318 128 H 334 Q 330 124 330 118 A 4 4 0 0 0 322 118 Q 322 124 318 128 Z",
  "M284 152 H 300 V 166 H 284 Z M288 152 V 149 A 4 4 0 0 1 296 149 V 152",
  "M316 150 H 334 V 162 H 322 L 318 166 V 162 H 316 Z",
];

function OmgNow() {
  return (
    <g>
      <line x1={16} y1={252} x2={240} y2={252} {...DRAW} style={dl(0)} />
      {/* building A and B */}
      <rect x={40} y={90} width={70} height={162} {...DRAW} style={dl(0.1)} />
      <rect x={120} y={130} width={80} height={122} {...DRAW} style={dl(0.2)} />
      {ON_A_WIN.map(([x, y], i) => (
        <rect key={`a${x}${y}`} x={x} y={y} width={12} height={12} className="s s--soft sk-fade" style={dl(0.6 + i * 0.015)} />
      ))}
      {ON_B_WIN.map(([x, y], i) => (
        <rect key={`b${x}${y}`} x={x} y={y} width={14} height={12} className="s s--soft sk-fade" style={dl(0.7 + i * 0.02)} />
      ))}
      <rect x={66} y={236} width={18} height={16} {...DRAW} style={dl(0.5)} />
      <rect x={150} y={236} width={20} height={16} {...DRAW} style={dl(0.5)} />

      {/* hyperlocal pin and radius */}
      <path d="M75 76 C 65 62 61 56 61 50 A 14 14 0 0 1 89 50 C 89 56 85 62 75 76 Z" className="s s--red d" pathLength={1} style={dl(0.8)} />
      <circle cx={75} cy={50} r={5} className="s s--red sk-fade" style={dl(1)} />
      {[0, 1.8, 3.6].map((t) => (
        <circle key={t} cx={75} cy={50} r={16} className="s s--red on-ring" style={lp(t)} />
      ))}

      {/* gateway app */}
      <rect x={266} y={50} width={84} height={160} rx={12} {...DRAW} style={dl(0.3)} />
      <rect x={274} y={64} width={68} height={132} rx={3} className="s s--soft d" pathLength={1} style={dl(0.5)} />
      {[278, 310].flatMap((x) => [74, 108, 142].map((y) => [x, y] as Pt)).map(([x, y], i) => (
        <g key={`t${x}${y}`}>
          <rect x={x} y={y} width={28} height={28} rx={3} className="s sk-fade" style={dl(0.8 + i * 0.06)} />
        </g>
      ))}
      {ON_ICONS.map((d, i) => (
        <path key={d} d={d} className="s s--soft sk-fade" style={dl(1 + i * 0.06)} />
      ))}
      <rect x={278} y={178} width={60} height={10} rx={5} className="s s--soft sk-fade" style={dl(1.2)} />

      {/* a service request travels to a home */}
      {ON_LINKS.map((l, i) => (
        <g key={l.d}>
          <path d={l.d} className="s s--soft s--dash sk-fade" style={dl(1.2 + i * 0.1)} />
          <rect x={l.tile[0] + 1} y={l.tile[1] + 1} width={26} height={26} rx={2} className="dg-lit" style={lp(i * ON_STEP)} />
          <Zip d={l.d} at={i * ON_STEP + 0.3} />
          <rect x={l.win[0]} y={l.win[1]} width={14} height={12} className="dg-lit dg-lit--strong" style={lp(i * ON_STEP + 0.75)} />
        </g>
      ))}
    </g>
  );
}

/* Pattern Internet: a decentralised mesh, patterns propagating from either edge */

const PI_NODES: Pt[] = [
  [60, 70],
  [140, 52],
  [230, 64],
  [320, 60],
  [90, 150],
  [180, 130],
  [270, 140],
  [350, 150],
  [50, 230],
  [140, 220],
  [230, 236],
  [320, 226],
];
const PI_EDGES: Pt[] = [
  [0, 1], [0, 4], [1, 2], [1, 5], [2, 3], [2, 5], [2, 6], [3, 6], [3, 7], [4, 5], [4, 8],
  [4, 9], [5, 6], [5, 9], [5, 10], [6, 7], [6, 10], [6, 11], [7, 11], [8, 9], [9, 10], [10, 11],
];
const piDist = (src: number) => {
  const dist = PI_NODES.map(() => -1);
  dist[src] = 0;
  const queue = [src];
  while (queue.length) {
    const u = queue.shift() as number;
    for (const [a, b] of PI_EDGES) {
      const v = a === u ? b : b === u ? a : -1;
      if (v >= 0 && dist[v] < 0) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;
};
const PI_STEP = 0.45;
const PI_WAVES = [
  { src: 0, t0: 0, red: false, dist: piDist(0) },
  { src: 7, t0: 2.4, red: true, dist: piDist(7) },
];

function PatternInternet() {
  return (
    <g>
      {PI_EDGES.map(([a, b], i) => (
        <path key={`e${a}-${b}`} d={seg(PI_NODES[a], PI_NODES[b], 9, 9)} className="s s--soft d" pathLength={1} style={dl(0.4 + i * 0.03)} />
      ))}
      {PI_WAVES.map((w) =>
        PI_EDGES.flatMap(([a, b]) => {
          const [u, v] = w.dist[a] < w.dist[b] ? [a, b] : [b, a];
          if (w.dist[u] + 1 !== w.dist[v]) return [];
          return [<Zip key={`z${w.src}-${u}-${v}`} d={seg(PI_NODES[u], PI_NODES[v], 9, 9)} at={w.t0 + w.dist[u] * PI_STEP} red={w.red} />];
        }),
      )}
      {PI_NODES.map(([x, y], i) => (
        <g key={`n${i}`}>
          <circle cx={x} cy={y} r={7} {...DRAW} style={dl(i * 0.05)} />
          <g className="sk-fade" style={dl(0.6 + i * 0.03)}>
            <circle cx={x - 2.6} cy={y + 1.6} r={1.1} className="sk-dot" />
            <circle cx={x + 2.6} cy={y + 1.6} r={1.1} className="sk-dot" />
            <circle cx={x} cy={y - 2.8} r={1.1} className="sk-dot" />
          </g>
          {PI_WAVES.map((w) => (
            <circle key={`f${w.src}`} cx={x} cy={y} r={7} className={`dg-blip${w.red ? " dg-blip--red" : ""} dg-blip--soft`} style={lp(w.t0 + w.dist[i] * PI_STEP + (w.dist[i] === 0 ? 0 : 0.38))} />
          ))}
        </g>
      ))}
      <Note x={60} y={92} anchor="middle" d={1.6}>
        origin A
      </Note>
      <Note x={350} y={172} anchor="middle" d={1.6}>
        origin B
      </Note>
      <Note x={24} y={270} d={1.8}>
        no central node · peer links only
      </Note>
    </g>
  );
}

/* Fruit Brain: a neuron firing, its spike train, and a dynamical attractor */

const FB_SPIKES = [
  { step: 1, at: 0 },
  { step: 3, at: 0.77 },
  { step: 4, at: 1.15 },
  { step: 7, at: 2.3 },
];
const fbX = (step: number) => 220 + step * 0.08 * 150;
const FB_AXON = "M100 140 C 120 136 140 146 160 142 S 180 138 188 140";
const FB_C: Pt = [300, 196];
const FB_SPIRAL = Array.from({ length: 49 }, (_, i) => {
  const th = (i * Math.PI) / 12;
  const r = 34 + 26 * Math.exp(-th / 5);
  return `${i === 0 ? "M" : "L"}${r1(FB_C[0] + r * Math.cos(th - Math.PI / 2))} ${r1(FB_C[1] + r * Math.sin(th - Math.PI / 2))}`;
}).join(" ");
const FB_DENDRITES = [
  "M72 130 Q 56 112 44 96",
  "M56 113 Q 50 112 36 116",
  "M44 96 L 40 80 M44 96 L 30 92",
  "M70 150 Q 52 166 40 186",
  "M52 166 L 32 166",
  "M40 186 L 34 204 M40 186 L 50 202",
  "M84 124 Q 82 100 92 78",
  "M86 98 L 74 86",
  "M92 78 L 86 64 M92 78 L 104 68",
  "M84 156 Q 86 184 76 208",
  "M76 208 L 64 220 M76 208 L 86 224",
];

function FruitBrain() {
  return (
    <g>
      {/* neuron */}
      <path d="M70 128 Q 84 118 98 128 Q 106 140 98 152 Q 84 162 70 152 Q 62 140 70 128 Z" {...DRAW} style={dl(0)} />
      <circle cx={84} cy={140} r={5} className="s s--blue sk-fade" style={dl(0.5)} />
      {FB_DENDRITES.map((d, i) => (
        <path key={d} d={d} className="s s--soft d" pathLength={1} style={dl(0.3 + i * 0.05)} />
      ))}
      <path d={FB_AXON} {...DRAW} style={dl(0.5)} />
      {[112, 134, 156].map((x) => (
        <rect key={x} x={x} y={136} width={14} height={8} rx={4} className="s sk-fade" style={dl(0.9)} />
      ))}
      <path d="M188 140 L 200 130 M188 140 L 202 140 M188 140 L 200 150" {...DRAW} style={dl(0.9)} />
      {[
        [200, 130],
        [202, 140],
        [200, 150],
      ].map(([x, y]) => (
        <circle key={`bt${y}`} cx={x} cy={y} r={2.4} className="s sk-fade" style={dl(1.1)} />
      ))}
      {FB_SPIKES.map((s) => (
        <g key={`ap${s.step}`}>
          <Zip d={FB_AXON} at={s.at} />
          <circle cx={84} cy={140} r={5} className="dg-blip" style={lp(s.at)} />
          <circle cx={202} cy={140} r={3} className="dg-blip dg-blip--red" style={lp(s.at + 0.4)} />
        </g>
      ))}

      {/* spike train */}
      <path d="M212 52 V 104 H 372" {...DRAW} style={dl(0.4)} />
      {FB_SPIKES.map((s) => {
        const x = fbX(s.step);
        return <path key={`sp${s.step}`} d={`M${x - 6} 104 H ${x - 1} L ${x} 58 L ${x + 2} 110 L ${x + 4} 104 H ${x + 8}`} className={`s s--red ${snap(s.step)}`} />;
      })}
      <line x1={220} y1={54} x2={220} y2={108} className="s s--soft fb-sweep" />
      <Note x={216} y={48} d={1}>
        Vm
      </Note>
      <Note x={372} y={118} anchor="end" d={1}>
        t
      </Note>

      {/* phase plane: trajectory settles onto a limit cycle */}
      <path d={`M240 ${FB_C[1]} H 364 M${FB_C[0]} 134 V 258`} className="s s--soft sk-fade" style={dl(0.8)} />
      <circle cx={FB_C[0]} cy={FB_C[1]} r={34} className="s s--blue d" pathLength={1} style={dl(1)} />
      <path d={FB_SPIRAL} pathLength={1} className="s fb-traj" />
      <g className="sk-fade" style={dl(1.4)}>
        <g className="dg-spin" style={{ transformOrigin: `${FB_C[0]}px ${FB_C[1]}px` }}>
          <circle cx={FB_C[0]} cy={FB_C[1] - 34} r={3.2} className="sk-dot" />
        </g>
      </g>
      <Note x={366} y={192} anchor="end" d={1.2}>
        V
      </Note>
      <Note x={306} y={140} d={1.2}>
        dV/dt
      </Note>
    </g>
  );
}

/* ---------- exports ---------- */

export const digitalSketches: Partial<Record<VisualKind, SketchDef>> = {
  ar: { fig: "FIG. A-01 · AR MAINTENANCE STEP", cycle: 6, body: ArMaintenance },
  platform: { fig: "FIG. P-01 · PLATFORM TIERS", cycle: 4.8, body: Platform },
  research: { fig: "FIG. R-01 · R&D LOOP", cycle: 5.4, body: Research },
  agent: { fig: "FIG. AG-01 · AGENT LOOP", cycle: 6, body: Agent },
};

/** One drawing per initiative, keyed "init-<slug>". OMGX-OS uses the agent sketch. */
export const initiativeSketches: Record<string, SketchDef> = {
  "init-bona-ai": { fig: "FIG. I-01 · LEAD PIPELINE", cycle: 4.8, body: BonaAi },
  "init-bizigpt": { fig: "FIG. I-02 · CHAT ASSISTANT", cycle: 6, body: BiziGpt },
  "init-jev-vision-integration": { fig: "FIG. I-03 · SEALANT INSPECTION", cycle: 5.4, body: JevVision },
  "init-binwin-ai-applications": { fig: "FIG. I-04 · SCAN TO DASHBOARD", cycle: 5.4, body: BinWin },
  "init-pitwall": { fig: "FIG. I-05 · DEV COMMAND CENTRE", cycle: 4.8, body: Pitwall },
  "init-omgx-app": { fig: "FIG. I-07 · VOICE AGENT", cycle: 5.4, body: OmgxApp },
  "init-mallika-ai-receptionist": { fig: "FIG. I-08 · SALON BOOKING", cycle: 6, body: Mallika },
  "init-omg-now": { fig: "FIG. I-09 · COMMUNITY GATEWAY", cycle: 5.4, body: OmgNow },
  "init-pattern-internet": { fig: "FIG. I-10 · PATTERN MESH", cycle: 4.8, body: PatternInternet },
  "init-fruit-brain": { fig: "FIG. I-11 · DYNAMICAL CORE", cycle: 4.8, body: FruitBrain },
};
