"use client";

import type { CapabilitySlug } from "@/content/capabilities";
import { DRAW, Dim, Note, SketchFrame, dl, lp, r1, type SketchDef } from "./sketches/kit";

/**
 * Animated engineering line sketch for each capability. Plain SVG: strokes draw
 * in once when the sketch enters view (stroke-dashoffset on pathLength="1"),
 * then a CSS loop tells the story (only transform, opacity and dashoffset
 * animate). Loops pause off-screen and in hidden tabs; reduced motion shows the
 * finished drawing. All coordinates are fixed, so server and client match.
 */

/* ---------- artificial intelligence: a forward pass through a small network ---------- */

const AI_LAYERS = [
  { x: 60, ys: [100, 140, 180, 220], label: "input" },
  { x: 155, ys: [80, 120, 160, 200, 240], label: "hidden 1" },
  { x: 245, ys: [80, 120, 160, 200, 240], label: "hidden 2" },
  { x: 340, ys: [130, 190], label: "output" },
];
const AI_STEP = 0.9; // seconds per layer in the 3.6s loop

const AI_EDGES = AI_LAYERS.slice(0, -1).flatMap((layer, L) => {
  const next = AI_LAYERS[L + 1];
  const rA = 7;
  const rB = L === 2 ? 9 : 7;
  return layer.ys.flatMap((y1, i) =>
    next.ys.map((y2, j) => {
      const dx = next.x - layer.x;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      return {
        key: `${L}-${i}-${j}`,
        L,
        x1: r1(layer.x + (dx / len) * rA),
        y1: r1(y1 + (dy / len) * rA),
        x2: r1(next.x - (dx / len) * rB),
        y2: r1(y2 - (dy / len) * rB),
        pulse: L === 2 || (i + j) % 2 === 0,
        order: i * next.ys.length + j,
      };
    }),
  );
});

function NeuralNet() {
  return (
    <g>
      {AI_LAYERS.map((layer, L) => (
        <g key={`lab${L}`}>
          <Note x={layer.x} y={50} anchor="middle" d={0.2 + L * 0.5}>
            {layer.label}
          </Note>
          <line x1={layer.x} y1={56} x2={layer.x} y2={64} className="s s--soft sk-fade" style={dl(0.2 + L * 0.5)} />
        </g>
      ))}
      {["W1", "W2", "W3"].map((w, i) => (
        <Note key={w} x={(AI_LAYERS[i].x + AI_LAYERS[i + 1].x) / 2} y={66} anchor="middle" d={0.6 + i * 0.5}>
          {w}
        </Note>
      ))}

      {AI_EDGES.map((e) => (
        <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} pathLength={1} className="s s--soft d" style={dl(0.35 + e.L * 0.55 + e.order * 0.012)} />
      ))}
      {AI_EDGES.filter((e) => e.pulse).map((e) => (
        <line
          key={`p${e.key}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          pathLength={1}
          className={`pulse ${e.L === 2 ? "pulse--red" : ""}`}
          style={lp(e.L * AI_STEP)}
        />
      ))}

      {AI_LAYERS.map((layer, L) =>
        layer.ys.map((y, i) => {
          const out = L === AI_LAYERS.length - 1;
          return (
            <g key={`n${L}-${i}`}>
              <circle cx={layer.x} cy={y} r={out ? 9 : 7} {...DRAW} style={dl(L * 0.55 + i * 0.05)} />
              <circle cx={layer.x} cy={y} r={2.4} className="sk-dot sk-fade" style={dl(0.3 + L * 0.55)} />
              <circle cx={layer.x} cy={y} r={out ? 4 : 3} className={`flash ${out ? "flash--red" : ""}`} style={lp(L * AI_STEP + (out ? 0.05 : 0))} />
              {out && <circle cx={layer.x} cy={y} r={14} className="s s--red ai-ring" style={lp(L * AI_STEP)} />}
            </g>
          );
        }),
      )}
      {AI_LAYERS[0].ys.map((y, i) => (
        <Note key={`x${i}`} x={44} y={y + 3} anchor="end" d={0.4}>
          {`x${i + 1}`}
        </Note>
      ))}
      {AI_LAYERS[3].ys.map((y, i) => (
        <Note key={`y${i}`} x={356} y={y + 3} d={2}>
          {`y${i + 1}`}
        </Note>
      ))}
      <Dim x1={60} y1={262} x2={340} y2={262} label="4 layers · 16 nodes" />
    </g>
  );
}

/* ---------- industrial automation: a pick-and-place cell ---------- */

const ROLLERS = [42, 71, 100, 129, 158];

function PickAndPlace() {
  return (
    <g>
      {/* floor */}
      <line x1={16} y1={262} x2={384} y2={262} {...DRAW} style={dl(0)} />

      {/* PLC and sensor wiring */}
      <rect x={24} y={36} width={64} height={38} rx={3} {...DRAW} style={dl(0.2)} />
      <line x1={32} y1={62} x2={64} y2={62} className="s s--soft sk-fade" style={dl(0.6)} />
      <line x1={32} y1={67} x2={56} y2={67} className="s s--soft sk-fade" style={dl(0.6)} />
      <circle cx={78} cy={47} r={3} className="ia-led" />
      <Note x={32} y={50} d={0.6}>
        PLC-01
      </Note>
      <path d="M56 74 V 160 H 148 V 194" className="s s--soft s--dash sk-fade" style={dl(0.9)} />
      <Note x={60} y={156} d={1}>
        I/O
      </Note>

      {/* conveyor */}
      <rect x={30} y={220} width={140} height={20} rx={10} {...DRAW} style={dl(0.3)} />
      <line x1={40} y1={220} x2={160} y2={220} className="s s--blue ia-belt sk-fade" style={dl(1)} />
      {[48, 152].map((x) => (
        <line key={x} x1={x} y1={240} x2={x} y2={262} {...DRAW} style={dl(0.5)} />
      ))}
      {ROLLERS.map((x, i) => (
        <g key={x} className="ia-roll">
          <circle cx={x} cy={230} r={6} {...DRAW} style={dl(0.5 + i * 0.06)} />
          <line x1={x - 6} y1={230} x2={x + 6} y2={230} className="s s--soft sk-fade" style={dl(0.9)} />
        </g>
      ))}
      {/* photo-eye sensor */}
      <rect x={142} y={194} width={12} height={10} rx={2} {...DRAW} style={dl(0.8)} />
      <line x1={142} y1={199} x2={120} y2={199} className="s s--red ia-beam" />
      <Note x={148} y={190} anchor="middle" d={1}>
        S1
      </Note>

      {/* place table */}
      <line x1={296} y1={220} x2={364} y2={220} {...DRAW} style={dl(0.4)} />
      {[302, 358].map((x) => (
        <line key={x} x1={x} y1={220} x2={x} y2={262} {...DRAW} style={dl(0.55)} />
      ))}

      {/* boxes: on the conveyor, then placed */}
      <g className="ia-box-in">
        <rect x={102} y={204} width={16} height={16} {...DRAW} style={dl(1.3)} />
        <line x1={102} y1={209} x2={118} y2={209} className="s s--soft sk-fade" style={dl(1.5)} />
      </g>
      <g className="ia-box-out">
        <rect x={322} y={204} width={16} height={16} className="s" />
        <line x1={322} y1={209} x2={338} y2={209} className="s s--soft" />
      </g>

      {/* robot base */}
      <rect x={190} y={250} width={50} height={12} rx={2} {...DRAW} style={dl(0.5)} />
      <rect x={204} y={180} width={22} height={70} rx={3} {...DRAW} style={dl(0.7)} />
      {/* shoulder, elbow, wrist: wrist counter-rotates so the gripper hangs level */}
      <g className="ia-j1">
        <rect x={209} y={96} width={12} height={78} rx={6} {...DRAW} style={dl(0.9)} />
        <g className="ia-j2">
          <rect x={211} y={95} width={73} height={10} rx={5} {...DRAW} style={dl(1.1)} />
          <circle cx={215} cy={100} r={3} className="s sk-fade" style={dl(1.2)} />
          <g className="ia-j3">
            <circle cx={280} cy={100} r={3} {...DRAW} style={dl(1.3)} />
            <line x1={280} y1={103} x2={280} y2={112} {...DRAW} style={dl(1.35)} />
            <line x1={264} y1={112} x2={296} y2={112} {...DRAW} style={dl(1.4)} />
            <path d="M266 112 V 130 H 269" className="s d ia-fl" pathLength={1} style={dl(1.5)} />
            <path d="M294 112 V 130 H 291" className="s d ia-fr" pathLength={1} style={dl(1.5)} />
            <g className="ia-box-held">
              <rect x={272} y={114} width={16} height={16} className="s" />
              <line x1={272} y1={119} x2={288} y2={119} className="s s--soft" />
            </g>
          </g>
        </g>
      </g>
      <circle cx={215} cy={170} r={8} {...DRAW} style={dl(0.8)} />
      <circle cx={215} cy={170} r={2.4} className="sk-dot sk-fade" style={dl(1)} />

      <Dim x1={30} y1={276} x2={170} y2={276} label="conveyor 1 400" />
      <Dim x1={378} y1={170} x2={378} y2={262} label="H 920" />
      <Note x={228} y={166} d={1.4}>
        J1
      </Note>
    </g>
  );
}

/* ---------- immersive technologies: headset, field of view, tracked room ---------- */

const VP = { x: 300, y: 150 };
const BACK = 0.27;
const bx = (x: number) => r1(VP.x + (x - VP.x) * BACK);
const by = (y: number) => r1(VP.y + (y - VP.y) * BACK);
const FLOOR_X = [214, 258, 302, 346];
const WALL_Y = [95, 150, 205];
const TRACKERS = [
  [190, 60],
  [370, 60],
  [370, 240],
  [190, 240],
];

function Headset() {
  return (
    <g>
      {/* room: near frame, back wall, depth edges */}
      <rect x={170} y={40} width={220} height={220} className="s s--soft d" pathLength={1} style={dl(1)} />
      <rect x={bx(170)} y={by(40)} width={r1(220 * BACK)} height={r1(220 * BACK)} {...DRAW} style={dl(1.2)} />
      {[
        [170, 40],
        [390, 40],
        [390, 260],
        [170, 260],
      ].map(([x, y]) => (
        <line key={`c${x}${y}`} x1={x} y1={y} x2={bx(x)} y2={by(y)} className="s s--soft d" pathLength={1} style={dl(1.3)} />
      ))}
      {FLOOR_X.map((x, i) => (
        <g key={`f${x}`}>
          <line x1={bx(x)} y1={by(260)} x2={x} y2={260} className="s s--soft d" pathLength={1} style={dl(1.4 + i * 0.05)} />
          <line x1={bx(x)} y1={by(40)} x2={x} y2={40} className="s s--soft d" pathLength={1} style={dl(1.45 + i * 0.05)} />
        </g>
      ))}
      {WALL_Y.map((y, i) => (
        <line key={`w${y}`} x1={bx(170)} y1={by(y)} x2={170} y2={y} className="s s--soft d" pathLength={1} style={dl(1.5 + i * 0.05)} />
      ))}
      {/* rails that scroll toward the viewer */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={`r${i}`}>
          <line x1={170} y1={260} x2={390} y2={260} className="s s--blue im-rail" style={lp(i * 0.6)} />
          <line x1={170} y1={40} x2={390} y2={40} className="s s--blue im-rail" style={lp(i * 0.6)} />
        </g>
      ))}

      {/* field of view cone from the visor */}
      <path d="M146 153 L330 112 L330 198 Z" className="im-cone sk-fade" style={dl(1.1)} />
      <line x1={146} y1={153} x2={330} y2={112} className="s s--blue d" pathLength={1} style={dl(1)} />
      <line x1={146} y1={153} x2={330} y2={198} className="s s--blue d" pathLength={1} style={dl(1)} />
      <path d="M190.9 143 A46 46 0 0 1 190.7 163.9" className="s s--blue d" pathLength={1} style={dl(1.4)} />
      <Note x={196} y={156} d={1.6}>
        FOV
      </Note>

      {/* headset in three-quarter view */}
      <path
        d="M60 128 Q60 120 68 119 L128 124 Q136 125 136 133 L136 172 Q136 180 128 181 L68 186 Q60 187 60 179 Z"
        {...DRAW}
        style={dl(0)}
      />
      <path d="M136 133 L146 137 L146 170 L136 173" {...DRAW} style={dl(0.4)} />
      <path d="M68 132 L126 136 M68 174 L126 170" className="s s--soft d" pathLength={1} style={dl(0.5)} />
      <path d="M60 138 C30 136 22 150 30 166 C36 178 50 180 60 176" {...DRAW} style={dl(0.6)} />
      <path d="M84 120 C80 100 52 100 42 126" {...DRAW} style={dl(0.7)} />
      <circle cx={146} cy={153} r={2.4} className="sk-dot sk-fade" style={dl(0.9)} />
      <Note x={60} y={112} d={0.9}>
        HMD
      </Note>
      <Dim x1={104} y1={198} x2={136} y2={198} label="IPD 63" d={1} />

      {/* tracking markers and gaze cursor */}
      {TRACKERS.map(([x, y], i) => (
        <path key={`t${i}`} d={`M${x - 5} ${y} H ${x + 5} M${x} ${y - 5} V ${y + 5}`} className="s s--red im-track" style={lp(i * 0.5)} />
      ))}
      <Note x={196} y={72} d={2}>
        tracking
      </Note>
      <g className="im-gaze">
        <circle cx={VP.x} cy={VP.y} r={6} className="s s--red" />
        <path d={`M${VP.x - 11} ${VP.y} H ${VP.x - 7} M${VP.x + 7} ${VP.y} H ${VP.x + 11} M${VP.x} ${VP.y - 11} V ${VP.y - 7} M${VP.x} ${VP.y + 7} V ${VP.y + 11}`} className="s s--red" />
      </g>
      <Note x={VP.x + 4} y={VP.y - 34} d={2}>
        VP
      </Note>
      <Dim x1={170} y1={26} x2={390} y2={26} label="room scale 4.0 m" />
    </g>
  );
}

/* ---------- hardware engineering: a microcontroller board ---------- */

const PIN_Y = [125, 135, 145, 155, 165, 175];
const PIN_X = [175, 185, 195, 205, 215, 225];
const J1_Y = [75, 105, 135, 165, 195, 225];
const HW_TRACES = J1_Y.map((yc, i) => {
  const yp = PIN_Y[i];
  const dy = yp - yc;
  return `M58 ${yc} H 95 L ${95 + Math.abs(dy)} ${yp} H 157`;
});
const HW_OTHER = [
  "M185 107 V 88 L 168 71 H 130",
  "M205 107 V 66",
  "M225 107 V 88 L 242 71 H 262",
  "M243 125 H 282",
  "M324 125 H 334",
  "M243 145 H 262 L 267 150 H 300",
  "M306 150 H 334",
  "M243 175 H 262 L 292 205 H 334",
  "M185 193 V 212",
  "M215 193 V 212",
];
const VIAS = [
  [126, 71],
  [205, 62],
  [266, 71],
  [338, 125],
  [338, 150],
];
const HW_STEP = 0.35;

function Board() {
  return (
    <g>
      <rect x={24} y={42} width={340} height={216} rx={8} {...DRAW} style={dl(0)} />
      {[
        [38, 56],
        [350, 56],
        [38, 244],
        [350, 244],
      ].map(([x, y]) => (
        <circle key={`h${x}${y}`} cx={x} cy={y} r={5} {...DRAW} style={dl(0.3)} />
      ))}

      {/* J1 header */}
      <rect x={46} y={64} width={18} height={172} rx={2} {...DRAW} style={dl(0.4)} />
      {J1_Y.map((y) => (
        <rect key={`j${y}`} x={52} y={y - 3} width={6} height={6} className="s sk-fade" style={dl(0.7)} />
      ))}
      <Note x={55} y={250} anchor="middle" d={0.8}>
        J1
      </Note>

      {/* traces, then vias and parts */}
      {HW_TRACES.map((d, i) => (
        <path key={`t${i}`} d={d} {...DRAW} style={dl(0.9 + i * 0.08)} />
      ))}
      {HW_OTHER.map((d, i) => (
        <path key={`o${i}`} d={d} className="s s--soft d" pathLength={1} style={dl(1.2 + i * 0.05)} />
      ))}
      {VIAS.map(([x, y]) => (
        <g key={`v${x}${y}`} className="sk-fade" style={dl(1.6)}>
          <circle cx={x} cy={y} r={4} className="s" />
          <circle cx={x} cy={y} r={1.4} className="sk-dot" />
        </g>
      ))}

      {/* U1 */}
      <rect x={165} y={115} width={70} height={70} rx={3} {...DRAW} style={dl(0.6)} />
      <circle cx={174} cy={124} r={2} className="s sk-fade" style={dl(0.9)} />
      <Note x={200} y={148} anchor="middle" d={1}>
        U1
      </Note>
      <Note x={200} y={160} anchor="middle" d={1}>
        MCU
      </Note>
      {PIN_Y.map((y) => (
        <g key={`py${y}`} className="sk-fade" style={dl(0.9)}>
          <rect x={157} y={y - 1.5} width={8} height={3} className="hw-pin" />
          <rect x={235} y={y - 1.5} width={8} height={3} className="hw-pin" />
        </g>
      ))}
      {PIN_X.map((x) => (
        <g key={`px${x}`} className="sk-fade" style={dl(0.9)}>
          <rect x={x - 1.5} y={107} width={3} height={8} className="hw-pin" />
          <rect x={x - 1.5} y={185} width={3} height={8} className="hw-pin" />
        </g>
      ))}
      {/* pins light as each pulse arrives */}
      {PIN_Y.map((y, i) => (
        <rect key={`pl${y}`} x={156} y={y - 2} width={9} height={4} className="flash flash--red" style={lp(i * HW_STEP + 0.8)} />
      ))}
      {HW_TRACES.map((d, i) => (
        <path key={`pu${i}`} d={d} pathLength={1} className="pulse" style={lp(i * HW_STEP)} />
      ))}

      {/* R1, C1, C2, Y1 */}
      <path d="M282 125 H 290" className="s sk-fade" style={dl(1.5)} />
      <rect x={290} y={121} width={26} height={8} rx={2} {...DRAW} style={dl(1.5)} />
      <path d="M316 125 H 324" className="s sk-fade" style={dl(1.5)} />
      <Note x={303} y={116} anchor="middle" d={1.7}>
        R1
      </Note>
      <path d="M300 141 V 159 M306 141 V 159" {...DRAW} style={dl(1.55)} />
      <Note x={303} y={170} anchor="middle" d={1.7}>
        C1
      </Note>
      <rect x={334} y={199} width={14} height={12} rx={2} {...DRAW} style={dl(1.6)} />
      <Note x={341} y={224} anchor="middle" d={1.7}>
        C2
      </Note>
      <rect x={175} y={212} width={50} height={18} rx={9} {...DRAW} style={dl(1.6)} />
      <Note x={200} y={244} anchor="middle" d={1.7}>
        Y1 16 MHz
      </Note>

      {/* oscilloscope probe on the clock line */}
      <rect x={278} y={54} width={60} height={46} rx={3} {...DRAW} style={dl(1.7)} />
      <path d="M278 77 H 338 M308 54 V 100" className="s s--soft s--dash sk-fade" style={dl(1.9)} />
      <path d="M282 88 H 288 V 66 H 298 V 88 H 308 V 66 H 318 V 88 H 328 V 66 H 334" pathLength={1} className="s s--red hw-wave" />
      <Note x={281} y={96} d={1.9}>
        CH1
      </Note>

      <Dim x1={24} y1={28} x2={364} y2={28} label="86.0 mm" />
      <Dim x1={380} y1={42} x2={380} y2={258} label="54.0 mm" />
    </g>
  );
}

const SKETCH: Record<CapabilitySlug, SketchDef> = {
  "artificial-intelligence": { fig: "FIG. 01 · FORWARD PASS", loop: 2.3, cycle: 3.6, body: NeuralNet },
  "industrial-automation": { fig: "FIG. 02 · PICK AND PLACE CELL", loop: 2.2, cycle: 6, body: PickAndPlace },
  "immersive-technologies": { fig: "FIG. 03 · HMD, FOV, TRACKED ROOM", loop: 2.2, cycle: 3, body: Headset },
  "hardware-engineering": { fig: "FIG. 04 · MCU BOARD", loop: 2.2, cycle: 3.6, body: Board },
};

export function CapabilityGlyph({ slug, variant = "hero" }: { slug: CapabilitySlug; variant?: "hero" | "card" }) {
  return <SketchFrame id={slug} def={SKETCH[slug]} variant={variant} className="glyph" />;
}