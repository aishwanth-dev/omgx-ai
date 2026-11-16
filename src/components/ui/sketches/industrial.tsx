import type { VisualKind } from "@/content/projects";
import { DRAW, Dim, Note, dl, lp, r1, type SketchDef } from "./kit";
import "./industrial.css";

/* Industrial group: process, testrig, robotics, andon, wireless, embedded. Fixed coordinates only. */

const rad = (deg: number) => (deg * Math.PI) / 180;

/** arc around (cx, cy) from angle a0 to a1 (degrees, clockwise on screen) */
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) =>
  `M${r1(cx + r * Math.cos(rad(a0)))} ${r1(cy + r * Math.sin(rad(a0)))} A${r} ${r} 0 0 1 ${r1(cx + r * Math.cos(rad(a1)))} ${r1(cy + r * Math.sin(rad(a1)))}`;

/* ---------- process: coating syrup skid (tank, pump, flow meter, mix tank) ---------- */

/** butterfly valve on a horizontal pipe; the disc indicator rotates open/closed */
function Valve({ x, y, open, cls, label, d }: { x: number; y: number; open: boolean; cls: string; label: string; d: number }) {
  return (
    <g>
      <path d={`M${x - 8} ${y - 6} L${x + 8} ${y + 6} V${y - 6} L${x - 8} ${y + 6} Z`} {...DRAW} style={dl(d)} />
      <path d={`M${x} ${y} V${y - 14}`} className="s sk-fade" style={dl(d + 0.3)} />
      <circle cx={x} cy={y - 20} r={6} {...DRAW} style={dl(d + 0.3)} />
      <g className="sk-fade" style={dl(d + 0.6)}>
        <path d={open ? `M${x - 5} ${y - 20} H${x + 5}` : `M${x} ${y - 25} V${y - 15}`} className={`s s--blue pr-disc ${cls}`} />
      </g>
      <Note x={x + 9} y={y - 24} d={d + 0.5}>
        {label}
      </Note>
    </g>
  );
}

const tankPath = (x: number) => `M${x} 82 Q${x} 64 ${x + 32} 64 Q${x + 64} 64 ${x + 64} 82 V196 Q${x + 64} 208 ${x + 32} 208 Q${x} 208 ${x} 196 Z`;
const liquidPath = (x: number) => `M${x + 1} 88 H${x + 63} V196 Q${x + 63} 207 ${x + 32} 207 Q${x + 1} 207 ${x + 1} 196 Z`;

function Tank({ x, gx, n, label, name, d }: { x: number; gx: number; n: 1 | 2; label: string; name: string; d: number }) {
  const side = gx > x ? x + 64 : x;
  return (
    <g>
      <g className="sk-fade" style={dl(d + 0.9)}>
        <path d={liquidPath(x)} className={`pr-liq pr-l${n}`} />
        <path d={`M${x + 2} 88 Q${x + 12} 86 ${x + 22} 88 T${x + 42} 88 T${x + 62} 88`} className={`s s--blue pr-s${n}`} />
        <rect x={gx + 2} y={88} width={4} height={119} className={`pr-glass pr-l${n}`} />
      </g>
      <path d={tankPath(x)} {...DRAW} style={dl(d)} />
      {/* legs */}
      <path d={`M${x + 10} 205 V244 M${x + 54} 205 V244`} {...DRAW} style={dl(d + 0.2)} />
      {/* level gauge (sight glass) */}
      <rect x={gx} y={84} width={8} height={126} rx={3} {...DRAW} style={dl(d + 0.4)} />
      <path d={`M${side} 92 H${gx + (gx > x ? 0 : 8)} M${side} 200 H${gx + (gx > x ? 0 : 8)}`} className="s sk-fade" style={dl(d + 0.5)} />
      <Note x={gx + 4} y={80} anchor="middle" d={d + 0.6}>
        LG
      </Note>
      <Note x={x + 32} y={140} anchor="middle" d={d + 0.6}>
        {label}
      </Note>
      <Note x={x + 32} y={151} anchor="middle" d={d + 0.7}>
        {name}
      </Note>
    </g>
  );
}

const IMPELLER = [0, 90, 180, 270]
  .map((a) => {
    const c = [180 + 7 * Math.cos(rad(a + 40)), 224 + 7 * Math.sin(rad(a + 40))];
    const e = [180 + 10 * Math.cos(rad(a)), 224 + 10 * Math.sin(rad(a))];
    return `M180 224 Q${r1(c[0])} ${r1(c[1])} ${r1(e[0])} ${r1(e[1])}`;
  })
  .join(" ");

function Process() {
  return (
    <g>
      {/* skid frame */}
      <rect x={24} y={244} width={352} height={10} rx={2} {...DRAW} style={dl(0)} />
      <Tank x={40} gx={110} n={1} label="T-101" name="SYRUP" d={0.2} />
      <Tank x={260} gx={330} n={2} label="T-102" name="COAT MIX" d={0.4} />

      {/* supply line into T-101 with inlet valve V-3 */}
      <path d="M18 50 H36 M52 50 H72 V64" {...DRAW} style={dl(0.6)} />
      <Valve x={44} y={50} open={false} cls="pr-v23" label="V-3" d={0.8} />
      <Note x={18} y={64} d={1}>
        IN
      </Note>

      {/* suction: T-101 to V-1 to pump */}
      <path d="M72 208 V224 H120 M136 224 H166" {...DRAW} style={dl(0.7)} />
      <Valve x={128} y={224} open cls="pr-v1" label="V-1" d={0.9} />

      {/* pump P-101 */}
      <circle cx={180} cy={224} r={14} {...DRAW} style={dl(0.9)} />
      <path d="M170 236 L166 244 H194 L190 236" {...DRAW} style={dl(1)} />
      <g className="pr-imp sk-fade" style={dl(1.2)}>
        <path d={IMPELLER} className="s" />
        <circle cx={180} cy={224} r={2.4} className="sk-dot" />
      </g>
      <Note x={198} y={238} d={1.3}>
        P-101
      </Note>

      {/* discharge through flow meter FT-101 into T-102 */}
      <path d="M180 210 V52 H227 M245 52 H292 V64" {...DRAW} style={dl(1)} />
      <circle cx={236} cy={52} r={9} {...DRAW} style={dl(1.2)} />
      <g className="sk-fade" style={dl(1.4)}>
        <path d="M232 48 L240 56 M240 48 L232 56" className="s s--blue pr-rot" />
      </g>
      <Note x={236} y={36} anchor="middle" d={1.5}>
        FT-101
      </Note>
      <Note x={236} y={74} anchor="middle" d={1.6}>
        4.2 m³/h
      </Note>

      {/* T-102 outlet to the coating pan with V-2 */}
      <path d="M292 208 V224 H344 M360 224 H380" {...DRAW} style={dl(1.1)} />
      <path d="M374 220 L380 224 L374 228" className="s sk-fade" style={dl(1.4)} />
      <Valve x={352} y={224} open={false} cls="pr-v23" label="V-2" d={1.2} />
      <Note x={380} y={240} anchor="end" d={1.5}>
        TO PAN
      </Note>

      {/* flow dashes (phase 1: transfer, phase 2: drain and refill) */}
      <path d="M72 208 V224 H166" className="pr-flow pr-flow--a" />
      <path d="M180 210 V52 H292 V64" className="pr-flow pr-flow--a" />
      <path d="M292 208 V224 H380" className="pr-flow pr-flow--b" />
      <path d="M18 50 H72 V64" className="pr-flow pr-flow--b" />

      <Dim x1={40} y1={266} x2={104} y2={266} label="Ø 800" />
    </g>
  );
}

/* ---------- testrig: pneumatic press, DUT spring, load cell, DAQ graph ---------- */

function TestRig() {
  return (
    <g>
      {/* frame */}
      <rect x={28} y={248} width={174} height={10} rx={2} {...DRAW} style={dl(0)} />
      <rect x={32} y={62} width={8} height={186} {...DRAW} style={dl(0.15)} />
      <rect x={190} y={62} width={8} height={186} {...DRAW} style={dl(0.15)} />
      <rect x={28} y={50} width={174} height={12} rx={2} {...DRAW} style={dl(0.3)} />

      {/* pneumatic cylinder and its 5/2 valve */}
      <rect x={95} y={62} width={40} height={56} rx={2} {...DRAW} style={dl(0.4)} />
      <Note x={50} y={90} d={0.9}>
        CYL Ø40
      </Note>
      <rect x={150} y={78} width={28} height={20} rx={2} {...DRAW} style={dl(0.6)} />
      <Note x={164} y={91} anchor="middle" d={0.9}>
        SV
      </Note>
      <path d="M135 70 H160 V78 M135 112 H164 V98 M178 88 H190" className="s s--soft d" pathLength={1} style={dl(0.7)} />
      <path d="M160 78 V70 H135" pathLength={1} className="tr-air tr-air--in" />
      <path d="M164 98 V112 H135" pathLength={1} className="tr-air tr-air--out" />

      {/* ram: piston, rod and pusher tip move together */}
      <g className="tr-ram">
        <rect x={98} y={86} width={34} height={6} {...DRAW} style={dl(0.6)} />
        <rect x={111} y={92} width={8} height={74} {...DRAW} style={dl(0.7)} />
        <rect x={105} y={166} width={20} height={8} {...DRAW} style={dl(0.8)} />
        <path d="M109 174 L115 180 L121 174" {...DRAW} style={dl(0.9)} />
      </g>

      {/* fixture, clamp jaws, load cell, DUT spring and platen */}
      <rect x={66} y={236} width={98} height={12} {...DRAW} style={dl(0.5)} />
      <rect x={72} y={196} width={10} height={40} {...DRAW} style={dl(0.7)} />
      <rect x={148} y={196} width={10} height={40} {...DRAW} style={dl(0.7)} />
      <rect x={95} y={222} width={40} height={14} rx={2} {...DRAW} style={dl(0.8)} />
      <path d="M103 229 H127" className="s s--soft sk-fade" style={dl(1)} />
      <path
        d="M115 198 L127 200 L103 204 L127 208 L103 212 L127 216 L103 220 L115 222"
        className="s s--blue tr-spring sk-fade"
        style={dl(1)}
      />
      <g className="tr-plat">
        <rect x={98} y={192} width={34} height={6} {...DRAW} style={dl(1)} />
      </g>
      <Note x={161} y={204} d={1.1}>
        DUT
      </Note>
      <Note x={161} y={215} d={1.1}>
        LC
      </Note>
      <Note x={161} y={224} d={1.1}>
        1 kN
      </Note>

      {/* load-cell signal to the DAQ */}
      <path d="M135 229 H206 Q214 229 214 221 V198 Q214 190 222 190" className="s s--soft s--dash sk-fade" style={dl(1.2)} />
      <path d="M135 229 H206 Q214 229 214 221 V198 Q214 190 222 190" className="tr-sig" />

      {/* DAQ: load vs time with a tolerance band, PASS/FAIL lamps */}
      <rect x={222} y={40} width={152} height={200} rx={4} {...DRAW} style={dl(0.9)} />
      <path d="M222 60 H374 M222 198 H374" className="s s--soft sk-fade" style={dl(1.2)} />
      <Note x={230} y={54} d={1.2}>
        DAQ · CH0 LOAD
      </Note>
      <path d="M238 72 V184 H362" {...DRAW} style={dl(1.2)} />
      <Note x={234} y={80} anchor="end" d={1.4}>
        N
      </Note>
      <Note x={364} y={188} d={1.4}>
        t
      </Note>
      <path d="M238 96 H362 M238 114 H362" className="s s--blue s--dash sk-fade" style={dl(1.4)} />
      <Note x={362} y={92} anchor="end" d={1.5}>
        USL
      </Note>
      <Note x={362} y={124} anchor="end" d={1.5}>
        LSL
      </Note>
      <path
        d="M238 184 H267.5 C277 182 284 108 293.4 104 L321.1 106 C328 108 332 182 337.7 184 H358"
        pathLength={1}
        className="tr-curve"
      />
      <g className="tr-peak">
        <circle cx={293.4} cy={104} r={2.4} className="tr-dot" />
        <text x={242} y={91} className="sk-note">
          Fmax 418 N
        </text>
      </g>
      <circle cx={250} cy={214} r={7} {...DRAW} style={dl(1.4)} />
      <circle cx={250} cy={214} r={4.6} className="tr-pass" />
      <Note x={262} y={217} d={1.5}>
        PASS
      </Note>
      <circle cx={316} cy={214} r={7} {...DRAW} style={dl(1.4)} />
      <Note x={328} y={217} d={1.5}>
        FAIL
      </Note>

      <Dim x1={50} y1={180} x2={50} y2={204} label="S 24" />
      <Dim x1={28} y1={268} x2={202} y2={268} label="RIG 600" />
    </g>
  );
}

/* ---------- robotics: 6-axis robot moving boxes from in-feed to pallet ---------- */

/** tool-point path from the joint-space moves (home, pick, place, home), sampled offline */
const RO_TRACE =
  "M270 168 L266.9 154 L261 140.5 L252.4 128.3 L241.6 117.7 L228.7 109.2 L214.4 103.1 L199 99.8 L183.2 99.3 L167.6 101.6 L152.7 106.8 L139 114.6 L127 124.7 L117.2 136.7 L109.9 150.1 L107.6 162.6 L107.6 175.3 L110 188 M109.9 150.1 L120 136.1 L132.6 123.7 L147.3 113.4 L163.8 105.5 L181.5 100.4 L199.9 98.3 L218.5 99.2 L236.7 103.1 L253.9 109.9 L269.6 119.3 L283.5 131.1 L295 144.8 L303.9 160 L310 176 L311.9 188.9 L311.9 201.7 L310 214.1 M310 176 L307.4 174.7 L302 172.5 L296.5 170.7 L290.8 169.3 L284.9 168.4 L279 167.9 L270 168";

const RO_ROLLERS = [50, 80, 110, 140];
const RO_SPARKS = [0, 60, 120, 180, 240, 300]
  .map((a) => `M${r1(270 + 8 * Math.cos(rad(a)))} ${r1(168 + 8 * Math.sin(rad(a)))} L${r1(270 + 12 * Math.cos(rad(a)))} ${r1(168 + 12 * Math.sin(rad(a)))}`)
  .join(" ");

function Robotics() {
  return (
    <g>
      <line x1={16} y1={262} x2={384} y2={262} {...DRAW} style={dl(0)} />

      {/* safety fence panel and light curtain */}
      <rect x={18} y={84} width={14} height={110} {...DRAW} style={dl(0.2)} />
      <path d="M18 98 L32 112 M18 122 L32 136 M18 146 L32 160 M18 170 L32 184 M32 98 L18 112 M32 122 L18 136 M32 146 L18 160 M32 170 L18 184" className="s s--soft sk-fade" style={dl(0.6)} />
      <Note x={18} y={78} d={0.8}>
        FENCE
      </Note>
      <rect x={352} y={96} width={12} height={14} rx={2} {...DRAW} style={dl(0.4)} />
      <rect x={352} y={248} width={12} height={14} rx={2} {...DRAW} style={dl(0.4)} />
      <g className="sk-fade" style={dl(0.9)}>
        <line x1={358} y1={110} x2={358} y2={248} className="ro-curtain" />
        <circle cx={358} cy={103} r={2.4} className="ro-led" />
      </g>
      <Note x={358} y={88} anchor="middle" d={1}>
        LC-1
      </Note>

      {/* in-feed conveyor */}
      <rect x={36} y={206} width={128} height={14} rx={7} {...DRAW} style={dl(0.3)} />
      <line x1={44} y1={206} x2={156} y2={206} className="s s--blue ro-belt sk-fade" style={dl(1)} />
      <path d="M50 220 V262 M150 220 V262" {...DRAW} style={dl(0.5)} />
      {RO_ROLLERS.map((x, i) => (
        <circle key={x} cx={x} cy={213} r={4} className="s s--soft d" pathLength={1} style={dl(0.5 + i * 0.06)} />
      ))}
      <g className="ro-box-in">
        <rect x={100} y={188} width={20} height={18} {...DRAW} style={dl(1.3)} />
        <path d="M100 194 H120" className="s s--soft sk-fade" style={dl(1.5)} />
      </g>
      <Note x={56} y={234} d={1}>
        IN-FEED
      </Note>

      {/* pallet with an earlier box */}
      <rect x={278} y={232} width={66} height={5} {...DRAW} style={dl(0.4)} />
      <path d="M280 237 h8 v10 h-8 Z M307 237 h8 v10 h-8 Z M334 237 h8 v10 h-8 Z M278 247 H344 M278 251 H344 M286 251 V262 M336 251 V262" className="s d" pathLength={1} style={dl(0.6)} />
      <rect x={322} y={214} width={20} height={18} {...DRAW} style={dl(1)} />
      <path d="M322 220 H342" className="s s--soft sk-fade" style={dl(1.2)} />
      <g className="ro-box-out">
        <rect x={300} y={214} width={20} height={18} className="s" />
        <path d="M300 220 H320" className="s s--soft" />
      </g>
      <Note x={278} y={272} d={1.2}>
        PALLET
      </Note>

      {/* tool-point path */}
      <path d={RO_TRACE} className="ro-trace sk-fade" style={dl(1.8)} />

      {/* base, J1 turntable, shoulder housing */}
      <rect x={172} y={242} width={56} height={20} rx={2} {...DRAW} style={dl(0.5)} />
      <rect x={180} y={230} width={40} height={12} rx={2} {...DRAW} style={dl(0.6)} />
      <rect x={186} y={208} width={28} height={24} rx={4} {...DRAW} style={dl(0.7)} />
      <Note x={232} y={240} d={1.2}>
        J1
      </Note>

      {/* J2 shoulder, J3 elbow, J5 wrist (keeps the tool vertical) */}
      <g className="ro-j2">
        <rect x={193} y={136} width={14} height={90} rx={7} {...DRAW} style={dl(0.9)} />
        <g className="ro-j3">
          <rect x={194} y={136} width={82} height={12} rx={6} {...DRAW} style={dl(1.1)} />
          <path d="M232 136 V148 M238 136 V148" className="s s--soft sk-fade" style={dl(1.3)} />
          <circle cx={200} cy={142} r={4} className="s sk-fade" style={dl(1.2)} />
          <g className="ro-j5">
            <circle cx={270} cy={142} r={5} {...DRAW} style={dl(1.3)} />
            <path d="M270 147 V156" {...DRAW} style={dl(1.35)} />
            <rect x={262} y={156} width={16} height={4} {...DRAW} style={dl(1.4)} />
            <path d="M264 160 L266 168 H274 L276 160" {...DRAW} style={dl(1.5)} />
            <path d="M265 168 H275 M270 163 V173" className="s s--red sk-fade" style={dl(1.6)} />
            <g className="ro-box-held">
              <rect x={260} y={168} width={20} height={18} className="s" />
              <path d="M260 174 H280" className="s s--soft" />
            </g>
            <g className="ro-grip">
              <circle cx={270} cy={168} r={5} className="ro-grip__core" />
              <path d={RO_SPARKS} className="s s--red" />
            </g>
          </g>
        </g>
      </g>
      <circle cx={200} cy={220} r={7} {...DRAW} style={dl(0.8)} />
      <circle cx={200} cy={220} r={2.4} className="sk-dot sk-fade" style={dl(1)} />
      <Note x={218} y={204} d={1.2}>
        J2
      </Note>

      <Dim x1={110} y1={270} x2={200} y2={270} label="PICK 1 100" />
    </g>
  );
}

/* ---------- andon: tower light, andon box, line board, supervisor tablet ---------- */

const AN_BOX_ARCS = [7, 12, 17].map((r) => arc(106, 150, r, -50, 50));
const AN_TAB_ARCS = [7, 12, 17].map((r) => arc(298, 170, r, 140, 220));
const AN_SEND_TAB = "M112 150 Q200 124 296 176";
const AN_ACK = "M296 176 Q200 124 112 150";
const AN_SEND_BOARD = "M112 146 Q128 104 150 96";
const AN_STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

function Lamp({ y, tone, cls }: { y: number; tone: "red" | "blue" | "white"; cls: string }) {
  const m = y + 14;
  const stroke = tone === "red" ? "s s--red" : tone === "blue" ? "s s--blue" : "s";
  return (
    <g className={`an-lamp ${cls}`}>
      <rect x={40} y={y + 2} width={24} height={24} className={`an-fill an-fill--${tone}`} />
      <path d={`M30 ${m} H34 M70 ${m} H74 M32 ${m - 10} L35 ${m - 7} M72 ${m - 10} L69 ${m - 7} M32 ${m + 10} L35 ${m + 7} M72 ${m + 10} L69 ${m + 7}`} className={stroke} />
    </g>
  );
}

function Andon() {
  return (
    <g>
      {/* tower light */}
      <g className="sk-fade" style={dl(0.9)}>
        <Lamp y={58} tone="red" cls="an-red" />
        <Lamp y={86} tone="white" cls="an-white" />
        <Lamp y={114} tone="blue" cls="an-blue" />
      </g>
      <path d="M38 58 Q38 48 52 48 Q66 48 66 58" {...DRAW} style={dl(0)} />
      {[58, 86, 114].map((y, i) => (
        <rect key={y} x={38} y={y} width={28} height={28} {...DRAW} style={dl(0.15 + i * 0.12)} />
      ))}
      <Note x={78} y={75} d={0.9}>
        STOP
      </Note>
      <Note x={78} y={131} d={0.9}>
        RUN
      </Note>
      <rect x={42} y={142} width={20} height={10} {...DRAW} style={dl(0.5)} />
      <path d="M52 152 V250" {...DRAW} style={dl(0.6)} />
      <rect x={36} y={250} width={32} height={10} rx={2} {...DRAW} style={dl(0.7)} />

      {/* touchscreen andon box with antenna */}
      <path d="M52 185 H64" className="s sk-fade" style={dl(0.8)} />
      <rect x={64} y={168} width={48} height={34} rx={3} {...DRAW} style={dl(0.8)} />
      <rect x={70} y={174} width={24} height={22} rx={1} className="s s--soft d" pathLength={1} style={dl(1)} />
      <circle cx={102} cy={180} r={3} className="s sk-fade" style={dl(1.1)} />
      <circle cx={102} cy={192} r={3} className="s sk-fade" style={dl(1.1)} />
      <path d="M106 168 V152" {...DRAW} style={dl(1)} />
      <circle cx={106} cy={150} r={2} className="sk-dot sk-fade" style={dl(1.2)} />
      <Note x={64} y={214} d={1.2}>
        ANDON BOX
      </Note>
      <Note x={64} y={224} d={1.3}>
        ARM · TCP/IP
      </Note>
      {AN_BOX_ARCS.map((d, i) => (
        <path key={d} d={d} className="s s--red an-arc an-arc--box" style={lp(i * 0.12)} />
      ))}

      {/* wireless links */}
      <path d={AN_SEND_TAB} className="s s--soft s--dash sk-fade" style={dl(1.4)} />
      <path d={AN_SEND_BOARD} className="s s--soft s--dash sk-fade" style={dl(1.4)} />
      <path d={AN_SEND_BOARD} pathLength={1} className="an-pkt an-pkt--board" />
      <path d={AN_SEND_TAB} pathLength={1} className="an-pkt an-pkt--tab" />
      <path d={AN_ACK} pathLength={1} className="an-pkt an-pkt--ack" />

      {/* production board (TV) */}
      <rect x={150} y={40} width={150} height={92} rx={4} {...DRAW} style={dl(0.4)} />
      <path d="M190 132 V150 M260 132 V150 M180 150 H200 M250 150 H270" {...DRAW} style={dl(0.7)} />
      <path d="M150 60 H300" className="s s--soft sk-fade" style={dl(0.9)} />
      <Note x={158} y={54} d={0.9}>
        LINE 2 · ASSY
      </Note>
      <Note x={292} y={54} anchor="end" d={0.9}>
        SHIFT A
      </Note>
      <Note x={158} y={79} d={1}>
        PLAN
      </Note>
      <Note x={158} y={99} d={1}>
        ACTUAL
      </Note>
      <Note x={158} y={119} d={1}>
        STATUS
      </Note>
      <g className="sk-fade" style={dl(1.2)}>
        {["0", "4", "8", "0"].map((c, i) => (
          <text key={`p${i}`} x={240 + i * 8} y={80} textAnchor="middle" className="an-digit">
            {c}
          </text>
        ))}
        {["0", "3", "1"].map((c, i) => (
          <text key={`a${i}`} x={240 + i * 8} y={100} textAnchor="middle" className="an-digit">
            {c}
          </text>
        ))}
        <svg x={260} y={89} width={8} height={14} overflow="hidden" className="an-win">
          <g className="an-strip">
            {AN_STRIP.map((n, i) => (
              <text key={i} x={4} y={11 + i * 14} textAnchor="middle" className="an-digit">
                {n}
              </text>
            ))}
          </g>
        </svg>
        <text x={236} y={120} className="an-status an-run">
          RUN
        </text>
        <text x={236} y={120} className="an-status an-stop">
          STOP
        </text>
      </g>

      {/* supervisor tablet */}
      <rect x={296} y={156} width={80} height={102} rx={8} {...DRAW} style={dl(0.6)} />
      <rect x={302} y={164} width={68} height={82} rx={2} className="s s--soft d" pathLength={1} style={dl(0.9)} />
      <circle cx={336} cy={252} r={2.5} className="s sk-fade" style={dl(1.1)} />
      <Note x={306} y={176} d={1.2}>
        SUPERVISOR
      </Note>
      <path d="M306 181 H366" className="s s--soft sk-fade" style={dl(1.2)} />
      <g className="an-alert">
        <rect x={306} y={188} width={60} height={24} rx={2} className="s s--red" />
        <text x={310} y={198} className="sk-note">
          STN 04
        </text>
        <text x={310} y={208} className="sk-note">
          STOP 00:42
        </text>
      </g>
      <rect x={306} y={220} width={60} height={16} rx={2} className="s sk-fade" style={dl(1.3)} />
      <rect x={307} y={221} width={58} height={14} rx={2} className="an-ackbtn" />
      <Note x={336} y={231} anchor="middle" d={1.4}>
        ACK
      </Note>
      {AN_TAB_ARCS.map((d, i) => (
        <path key={d} d={d} className="s s--blue an-arc an-arc--tab" style={lp(i * 0.12)} />
      ))}
      <Note x={298} y={270} d={1.4}>
        ANDROID
      </Note>
    </g>
  );
}

/* ---------- wireless: nutrunner nodes, mesh hops, access point, RSSI ---------- */

type Pt = [number, number];
const WL_NODES: Pt[] = [
  [52, 84],
  [44, 196],
  [140, 142],
  [132, 240],
  [222, 204],
];
const WL_TIP: Pt[] = WL_NODES.map(([x, y]) => [x + 7, y - 18]);
const WL_G: Pt = [325, 78];
const WL_LINKS: [number, number][] = [
  [0, 2],
  [1, 2],
  [1, 3],
  [3, 4],
  [2, 4],
];
/** one transmitting node per 1s slot; routes hop through a relay to the AP */
const WL_ROUTES = [
  [0, 2],
  [1, 2],
  [3, 4],
  [2],
  [4],
].map((hops, slot) => {
  const pts: Pt[] = [...hops.map((i) => WL_TIP[i]), WL_G];
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  return {
    slot,
    src: hops[0],
    d: `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")}`,
    /** relay node index (-1 for a direct hop) and when the packet passes it */
    relay: hops.length > 1 ? hops[1] : -1,
    relayAt: r1(slot + 0.15 + (0.6 * segs[0]) / total),
  };
});
const WL_BARS = [6, 11, 16, 21, 26];

function Wireless() {
  return (
    <g>
      {/* mesh links */}
      {WL_LINKS.map(([a, b], i) => (
        <line key={`l${i}`} x1={WL_TIP[a][0]} y1={WL_TIP[a][1]} x2={WL_TIP[b][0]} y2={WL_TIP[b][1]} className="s s--soft s--dash sk-fade" style={dl(1 + i * 0.08)} />
      ))}
      {[2, 4].map((i) => (
        <line key={`g${i}`} x1={WL_TIP[i][0]} y1={WL_TIP[i][1]} x2={WL_G[0]} y2={WL_G[1]} className="s s--soft s--dash sk-fade" style={dl(1.4)} />
      ))}

      {/* nodes: RCM serial-to-TCP boxes on the nutrunners */}
      {WL_NODES.map(([x, y], i) => (
        <g key={`n${i}`}>
          <rect x={x - 12} y={y - 8} width={24} height={16} rx={2} {...DRAW} style={dl(0.2 + i * 0.12)} />
          <path d={`M${x - 7} ${y} H${x + 1}`} className="s s--soft sk-fade" style={dl(0.6 + i * 0.1)} />
          <path d={`M${x + 7} ${y - 8} V${y - 16}`} {...DRAW} style={dl(0.4 + i * 0.12)} />
          <circle cx={x + 7} cy={y - 18} r={2} className="sk-dot sk-fade" style={dl(0.6 + i * 0.12)} />
          <Note x={x} y={y + 18} anchor="middle" d={0.8 + i * 0.1}>
            {`NR-0${i + 1}`}
          </Note>
        </g>
      ))}

      {/* radio rings from each transmitting node in turn */}
      {WL_ROUTES.map((r) => (
        <circle key={`r${r.slot}`} cx={WL_TIP[r.src][0]} cy={WL_TIP[r.src][1]} r={10} className="s s--blue wl-ring" style={lp(r.slot)} />
      ))}
      {/* packets hop node to relay to access point */}
      {WL_ROUTES.map((r) => (
        <path key={`p${r.slot}`} d={r.d} pathLength={1} className="wl-pkt" style={lp(r.slot)} />
      ))}
      {WL_ROUTES.filter((r) => r.relay >= 0).map((r) => (
        <circle key={`f${r.slot}`} cx={WL_TIP[r.relay][0]} cy={WL_TIP[r.relay][1]} r={3.4} className="wl-flash" style={lp(r.relayAt)} />
      ))}

      {/* access point mast and box */}
      <path d="M317 124 L325 84 L333 124 M319.4 112 H330.6 M321.8 100 H328.2 M319.4 112 L328.2 100 M330.6 112 L321.8 100" {...DRAW} style={dl(0.6)} />
      <path d="M325 84 V80" className="s sk-fade" style={dl(0.9)} />
      <circle cx={325} cy={78} r={2.4} className="sk-dot sk-fade" style={dl(1)} />
      {WL_ROUTES.map((r) => (
        <circle key={`a${r.slot}`} cx={325} cy={78} r={10} className="s s--red wl-ring wl-ring--ap" style={lp(r.slot + 0.75)} />
      ))}
      <rect x={300} y={124} width={50} height={30} rx={3} {...DRAW} style={dl(0.5)} />
      <circle cx={340} cy={139} r={2.6} className="s sk-fade" style={dl(1)} />
      {WL_ROUTES.map((r) => (
        <circle key={`l${r.slot}`} cx={340} cy={139} r={2.4} className="wl-flash wl-flash--red" style={lp(r.slot + 0.75)} />
      ))}
      <Note x={306} y={142} d={1.1}>
        AP-1
      </Note>

      {/* ethernet to the collection server */}
      <path d="M325 154 V196" {...DRAW} style={dl(0.8)} />
      {WL_ROUTES.map((r) => (
        <path key={`e${r.slot}`} d="M325 154 V196" pathLength={1} className="wl-pkt wl-pkt--eth" style={lp(r.slot + 0.75)} />
      ))}
      <Note x={330} y={178} d={1.2}>
        TCP/IP
      </Note>
      <rect x={300} y={196} width={50} height={56} rx={2} {...DRAW} style={dl(0.9)} />
      <path d="M306 210 H344 M306 224 H344 M306 238 H344" className="s s--soft sk-fade" style={dl(1.2)} />
      <Note x={300} y={266} d={1.3}>
        SERVER
      </Note>

      {/* signal-strength meter */}
      <rect x={200} y={28} width={88} height={42} rx={3} {...DRAW} style={dl(1)} />
      {WL_BARS.map((h, i) => (
        <g key={`b${i}`}>
          <rect x={208 + i * 8} y={62 - h} width={6} height={h} className="s s--soft sk-fade" style={dl(1.2 + i * 0.05)} />
          <g className="sk-fade" style={dl(1.4 + i * 0.05)}>
            <rect x={208 + i * 8} y={62 - h} width={6} height={h} className={`wl-bar wl-bar--${i + 1}`} />
          </g>
        </g>
      ))}
      <Note x={250} y={44} d={1.4}>
        RSSI
      </Note>
      <Note x={250} y={58} d={1.4}>
        -58 dBm
      </Note>

      <Dim x1={44} y1={272} x2={240} y2={272} label="COVERAGE ≈ 600 m" />
    </g>
  );
}

/* ---------- embedded: Hall-effect coin validator board ---------- */

const EM_PINS = [118, 130, 142, 154, 166, 178];
const EM_PINS_X = [172, 184, 196, 208, 220, 232];

function Embedded() {
  return (
    <g>
      {/* coin chute with the Hall sensor on its wall */}
      <path d="M40 24 V262 M66 24 V136 M66 160 V262" {...DRAW} style={dl(0)} />
      <g className="em-coin">
        <circle cx={53} cy={34} r={10} className="s" />
        <circle cx={53} cy={34} r={6} className="s s--soft" />
      </g>
      <rect x={66} y={136} width={22} height={24} rx={2} {...DRAW} style={dl(0.4)} />
      <rect x={68} y={138} width={18} height={20} rx={1} className="em-hall" />
      <g className="sk-fade" style={dl(0.8)}>
        <path d="M64 140 Q54 148 64 156 M60 136 Q46 148 60 160" className="s s--blue em-field" />
      </g>
      <Note x={70} y={172} d={1}>
        U2
      </Note>
      <Note x={70} y={181} d={1}>
        HALL
      </Note>
      <Note x={16} y={276} d={1}>
        COIN CHUTE
      </Note>

      {/* board */}
      <rect x={100} y={44} width={280} height={212} rx={6} {...DRAW} style={dl(0.1)} />
      {[
        [112, 56],
        [368, 56],
        [112, 244],
        [368, 244],
      ].map(([x, y]) => (
        <circle key={`h${x}${y}`} cx={x} cy={y} r={4} {...DRAW} style={dl(0.3)} />
      ))}

      {/* I2C from the sensor, with pull-ups to 3V3 */}
      <path d="M88 142 H160 M88 154 H160" {...DRAW} style={dl(0.6)} />
      <path d="M120 76 H160 M130 76 V86 M130 102 V142 M142 76 V90 M142 106 V154" className="s s--soft d" pathLength={1} style={dl(0.8)} />
      <rect x={127} y={86} width={6} height={16} rx={1} {...DRAW} style={dl(1)} />
      <rect x={139} y={90} width={6} height={16} rx={1} {...DRAW} style={dl(1)} />
      <circle cx={130} cy={142} r={1.8} className="sk-dot sk-fade" style={dl(1.1)} />
      <circle cx={142} cy={154} r={1.8} className="sk-dot sk-fade" style={dl(1.1)} />
      <Note x={120} y={70} d={1.1}>
        3V3
      </Note>
      <Note x={104} y={138} d={1.1}>
        SDA
      </Note>
      <Note x={104} y={166} d={1.1}>
        SCL
      </Note>
      <path d="M88 142 H160" pathLength={1} className="em-bus em-sda" />
      <path d="M88 154 H160" pathLength={1} className="em-bus em-scl" />

      {/* MCU */}
      <rect x={160} y={104} width={80} height={84} rx={3} {...DRAW} style={dl(0.4)} />
      <circle cx={168} cy={112} r={2} className="s sk-fade" style={dl(0.8)} />
      <Note x={200} y={142} anchor="middle" d={0.9}>
        U1
      </Note>
      <Note x={200} y={154} anchor="middle" d={0.9}>
        RCM3000
      </Note>
      <g className="sk-fade" style={dl(0.8)}>
        {EM_PINS.map((y) => (
          <g key={`py${y}`}>
            <rect x={154} y={y - 1.5} width={6} height={3} className="em-pin" />
            <rect x={240} y={y - 1.5} width={6} height={3} className="em-pin" />
          </g>
        ))}
        {EM_PINS_X.map((x) => (
          <g key={`px${x}`}>
            <rect x={x - 1.5} y={98} width={3} height={6} className="em-pin" />
            <rect x={x - 1.5} y={188} width={3} height={6} className="em-pin" />
          </g>
        ))}
      </g>

      {/* SPI to the display */}
      <path d="M246 118 H262 M246 130 H262" {...DRAW} style={dl(0.9)} />
      <Note x={246} y={114} d={1.2}>
        SDI
      </Note>
      <Note x={246} y={142} d={1.2}>
        SCK
      </Note>
      <path d="M246 118 H262" pathLength={1} className="em-bus em-mosi" />
      <path d="M246 130 H262" pathLength={1} className="em-bus em-sck" />

      {/* display */}
      <rect x={262} y={62} width={100} height={90} rx={3} {...DRAW} style={dl(0.6)} />
      <rect x={270} y={70} width={84} height={74} rx={1} className="s s--soft d" pathLength={1} style={dl(0.9)} />
      <path d="M274 116 H350" className="s s--soft s--dash sk-fade" style={dl(1.2)} />
      <Note x={274} y={80} d={1.2}>
        HALL mV
      </Note>
      <path d="M274 116 H292 C298 116 300 88 306 88 C312 88 314 126 320 126 C325 126 327 116 332 116 H350" pathLength={1} className="em-wave" />
      <text x={274} y={138} className="sk-note em-ok">
        COIN 5 · OK
      </text>
      <Note x={312} y={164} anchor="middle" d={1.2}>
        LCD 128×64
      </Note>

      {/* crystal, regulator */}
      <path d="M184 194 V204 M216 194 V204" className="s sk-fade" style={dl(1)} />
      <rect x={176} y={204} width={48} height={14} rx={7} {...DRAW} style={dl(1)} />
      <Note x={200} y={232} anchor="middle" d={1.3}>
        Y1
      </Note>
      <rect x={112} y={200} width={34} height={24} rx={2} {...DRAW} style={dl(1.1)} />
      <Note x={129} y={236} anchor="middle" d={1.3}>
        U3 LDO
      </Note>

      {/* heartbeat LED */}
      <path d="M246 178 H290 V220 H306 M324 220 H335" className="s s--soft d" pathLength={1} style={dl(1.1)} />
      <rect x={306} y={216} width={18} height={8} rx={1} {...DRAW} style={dl(1.2)} />
      <circle cx={340} cy={220} r={5} {...DRAW} style={dl(1.3)} />
      <circle cx={340} cy={220} r={3.4} className="em-hb" />
      <Note x={340} y={238} anchor="middle" d={1.4}>
        HB
      </Note>

      <Dim x1={100} y1={30} x2={380} y2={30} label="90.0 mm" />
    </g>
  );
}

export const industrialSketches: Partial<Record<VisualKind, SketchDef>> = {
  process: { fig: "FIG. P-07 · COATING PROCESS SKID", cycle: 6, loop: 2.4, body: Process },
  testrig: { fig: "FIG. T-04 · LOAD TEST RIG", cycle: 4.8, loop: 2.4, body: TestRig },
  robotics: { fig: "FIG. R-02 · ROBOT HANDLING CELL", cycle: 6, loop: 2.4, body: Robotics },
  andon: { fig: "FIG. A-03 · WIRELESS ANDON", cycle: 6, loop: 2.4, body: Andon },
  wireless: { fig: "FIG. W-05 · WIRELESS DAQ NETWORK", cycle: 5, loop: 2.4, body: Wireless },
  embedded: { fig: "FIG. E-01 · HALL COIN VALIDATOR", cycle: 4, loop: 2.4, body: Embedded },
};
