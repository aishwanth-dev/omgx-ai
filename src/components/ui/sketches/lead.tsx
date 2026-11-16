import type { VisualKind } from "@/content/projects";
import { DRAW, Dim, Note, dl, lp, r1, type SketchDef } from "./kit";
import "./lead.css";

/* Lead group: scada, data, assembly, servo. Fixed coordinates only. */

/* ---------- scada: four stations wired to an HMI ---------- */

const SC_X = [65, 155, 245, 335];
const SC_STEP = 0.9; // seconds between stations in the 6s loop
const SC_NOK = 2; // ST-03 reports NOK
/** trend on the HMI: one 72px period, repeated so it can scroll seamlessly */
const SC_TREND_Y = [40, 30, 35, 22, 27, 16];
const SC_TREND = (() => {
  let d = `M0 ${SC_TREND_Y[0]}`;
  for (let p = 0; p < 3; p++) {
    SC_TREND_Y.forEach((y, i) => {
      if (p === 0 && i === 0) return;
      d += ` L${p * 72 + i * 12} ${y}`;
    });
    d += ` L${(p + 1) * 72} ${SC_TREND_Y[0]}`;
  }
  return d;
})();

function Scada() {
  return (
    <g>
      {/* HMI */}
      <rect x={116} y={18} width={168} height={100} rx={4} {...DRAW} style={dl(0)} />
      <rect x={128} y={34} width={144} height={62} rx={2} className="s s--soft d" pathLength={1} style={dl(0.3)} />
      {[52, 70, 88].map((y) => (
        <line key={y} x1={128} y1={y} x2={272} y2={y} className="s s--soft s--dash sk-fade" style={dl(0.8)} />
      ))}
      <line x1={128} y1={46} x2={272} y2={46} className="s s--red s--dash sk-fade" style={dl(1)} />
      <svg x={128} y={34} width={144} height={62} viewBox="0 0 144 62" overflow="hidden">
        <g className="sc-trend">
          <path d={SC_TREND} className="s s--blue d" pathLength={1} style={dl(1.2)} />
        </g>
      </svg>
      <Note x={128} y={30} d={0.9}>
        TIMESTAMP 06:42:18
      </Note>
      <Note x={272} y={30} anchor="end" d={0.9}>
        TREND
      </Note>
      {SC_X.map((_, i) => (
        <g key={`c${i}`}>
          <rect x={130 + i * 14} y={102} width={8} height={8} className="s s--soft sk-fade" style={dl(0.9)} />
          <rect
            x={131 + i * 14}
            y={103}
            width={6}
            height={6}
            className={`sc-lamp ${i === SC_NOK ? "sc-lamp--nok" : ""}`}
            style={lp(i * SC_STEP + 1.6)}
          />
        </g>
      ))}
      <Note x={272} y={109} anchor="end" d={1}>
        OK / NOK
      </Note>
      <Note x={200} y={12} anchor="middle" d={0.6}>
        SCADA / HMI
      </Note>

      {/* fieldbus: drops, bus, riser to the HMI */}
      <path d="M51 146 H 321" className="s s--soft d" pathLength={1} style={dl(0.6)} />
      <path d="M200 146 V 118" className="s s--soft d" pathLength={1} style={dl(0.5)} />
      {SC_X.map((x, i) => (
        <g key={`w${x}`}>
          <path d={`M${x - 14} 184 V 146`} className="s s--soft d" pathLength={1} style={dl(0.7 + i * 0.05)} />
          <circle cx={x - 14} cy={146} r={2.2} className="sk-dot sk-fade" style={dl(1.1)} />
        </g>
      ))}
      {SC_X.map((x, i) => (
        <path
          key={`p${x}`}
          d={`M${x - 14} 184 V 146 H 200 V 118`}
          pathLength={1}
          className={`pulse ${i === SC_NOK ? "pulse--red" : ""}`}
          style={lp(i * SC_STEP + 0.2)}
        />
      ))}

      {/* stations with status lamps */}
      {SC_X.map((x, i) => (
        <g key={`s${x}`}>
          <rect x={x - 32} y={184} width={64} height={44} rx={3} {...DRAW} style={dl(0.2 + i * 0.1)} />
          <rect x={x - 24} y={194} width={22} height={14} className="s s--soft d" pathLength={1} style={dl(0.5 + i * 0.1)} />
          <line x1={x + 4} y1={198} x2={x + 22} y2={198} className="s s--soft sk-fade" style={dl(0.9)} />
          <line x1={x + 4} y1={204} x2={x + 16} y2={204} className="s s--soft sk-fade" style={dl(0.9)} />
          <line x1={x - 24} y1={218} x2={x + 22} y2={218} className="s s--soft sk-fade" style={dl(0.9)} />
          <line x1={x + 18} y1={184} x2={x + 18} y2={176} {...DRAW} style={dl(0.6 + i * 0.1)} />
          <circle cx={x + 18} cy={171} r={5} {...DRAW} style={dl(0.7 + i * 0.1)} />
          <circle cx={x + 18} cy={171} r={3.4} className={`sc-lamp ${i === SC_NOK ? "sc-lamp--nok" : ""}`} style={lp(i * SC_STEP)} />
          <Note x={x} y={252} anchor="middle" d={1.2 + i * 0.1}>
            {`ST-0${i + 1}`}
          </Note>
        </g>
      ))}

      {/* conveyor under the line */}
      <rect x={20} y={230} width={360} height={10} rx={5} {...DRAW} style={dl(0.1)} />
      <line x1={30} y1={230} x2={370} y2={230} className="s s--blue sc-belt sk-fade" style={dl(1)} />
      <Dim x1={65} y1={266} x2={155} y2={266} label="900" />
    </g>
  );
}

/* ---------- data: sensors, gateway, database, report ---------- */

const DT_SENSORS = [
  { y: 46, tag: "TT-01" },
  { y: 116, tag: "PT-02" },
  { y: 186, tag: "VT-03" },
];
const DT_IN = ["M68 60 H 90 V 130 H 112", "M68 130 H 112", "M68 200 H 90 V 130 H 112"];
/** db rings: bottom first */
const DT_SEG = [
  { y0: 150, y1: 186 },
  { y0: 114, y1: 150 },
  { y0: 78, y1: 114 },
];
const DT_BARS = [34, 58, 46, 80, 66];

function Data() {
  return (
    <g>
      {/* sensors */}
      {DT_SENSORS.map((s, i) => (
        <g key={s.tag}>
          <rect x={24} y={s.y} width={44} height={28} rx={3} {...DRAW} style={dl(i * 0.15)} />
          <circle cx={38} cy={s.y + 14} r={7} className="s s--soft d" pathLength={1} style={dl(0.3 + i * 0.15)} />
          <line x1={38} y1={s.y + 14} x2={42} y2={s.y + 9} className="s sk-fade" style={dl(0.8)} />
          <line x1={50} y1={s.y + 10} x2={62} y2={s.y + 10} className="s s--soft sk-fade" style={dl(0.8)} />
          <line x1={50} y1={s.y + 16} x2={58} y2={s.y + 16} className="s s--soft sk-fade" style={dl(0.8)} />
          <circle cx={62} cy={s.y + 21} r={2.4} className="flash" style={lp(i * 0.4)} />
          <Note x={24} y={s.y - 5} d={1 + i * 0.1}>
            {s.tag}
          </Note>
        </g>
      ))}
      {DT_IN.map((d, i) => (
        <path key={`w${i}`} d={d} className="s s--soft d" pathLength={1} style={dl(0.5 + i * 0.1)} />
      ))}
      {DT_IN.map((d, i) => (
        <path key={`p${i}`} d={d} pathLength={1} className="pulse" style={lp(i * 0.4)} />
      ))}

      {/* gateway */}
      <rect x={112} y={110} width={48} height={40} rx={3} {...DRAW} style={dl(0.6)} />
      <line x1={150} y1={110} x2={150} y2={96} {...DRAW} style={dl(0.9)} />
      <path d="M144 92 Q150 86 156 92" className="s s--blue sk-fade" style={dl(1.1)} />
      <path d="M140 87 Q150 78 160 87" className="s s--blue s--soft sk-fade" style={dl(1.2)} />
      <line x1={120} y1={124} x2={142} y2={124} className="s s--soft sk-fade" style={dl(1)} />
      <line x1={120} y1={132} x2={136} y2={132} className="s s--soft sk-fade" style={dl(1)} />
      <circle cx={150} cy={140} r={3} className="flash" style={lp(1.5)} />
      <Note x={136} y={164} anchor="middle" d={1.2}>
        GATEWAY
      </Note>
      <Note x={182} y={121} anchor="middle" d={1.3}>
        OPC UA
      </Note>
      <path d="M160 130 H 204" className="s s--soft d" pathLength={1} style={dl(0.9)} />
      <path d="M160 130 H 204" pathLength={1} className="pulse" style={lp(1.6)} />

      {/* database stack */}
      {DT_SEG.map((s, i) => (
        <path
          key={`f${i}`}
          d={`M204 ${s.y0} A30 8 0 0 0 264 ${s.y0} V ${s.y1} A30 8 0 0 1 204 ${s.y1} Z`}
          className="dt-fill"
          style={lp(3 + i * 0.5)}
        />
      ))}
      <ellipse cx={234} cy={78} rx={30} ry={8} {...DRAW} style={dl(0.8)} />
      <path d="M204 78 V 186 A30 8 0 0 0 264 186 V 78" {...DRAW} style={dl(1)} />
      {[114, 150].map((y, i) => (
        <path key={`r${y}`} d={`M204 ${y} A30 8 0 0 0 264 ${y}`} className="s s--soft d" pathLength={1} style={dl(1.2 + i * 0.1)} />
      ))}
      <Note x={234} y={206} anchor="middle" d={1.4}>
        SQL
      </Note>
      <path d="M264 132 H 290" className="s s--soft s--dash sk-fade" style={dl(1.4)} />
      <path d="M264 132 H 290" pathLength={1} className="pulse" style={lp(3.4)} />

      {/* report: bar chart */}
      <path d="M290 64 V 186 H 384" {...DRAW} style={dl(1.1)} />
      {[96, 128, 160].map((y) => (
        <line key={`g${y}`} x1={290} y1={y} x2={384} y2={y} className="s s--soft s--dash sk-fade" style={dl(1.5)} />
      ))}
      {DT_BARS.map((h, i) => (
        <rect key={`b${i}`} x={298 + i * 16} y={186 - h} width={10} height={h} className="dt-bar" style={lp(3.8 + i * 0.2)} />
      ))}
      <Note x={290} y={58} d={1.6}>
        REPORT
      </Note>
      <Note x={384} y={198} anchor="end" d={1.6}>
        SHIFT 1-5
      </Note>
      <Dim x1={204} y1={226} x2={264} y2={226} label="3 TB" />
    </g>
  );
}

/* ---------- assembly: a part moving through press, screw and vision ---------- */

const AS_ROLLERS = [40, 80, 120, 160, 200, 240, 280, 320, 360];

function Assembly() {
  return (
    <g>
      <line x1={16} y1={262} x2={384} y2={262} {...DRAW} style={dl(0)} />
      {[50, 350].map((x) => (
        <line key={`l${x}`} x1={x} y1={222} x2={x} y2={262} {...DRAW} style={dl(0.3)} />
      ))}
      <rect x={20} y={210} width={360} height={12} rx={6} {...DRAW} style={dl(0.2)} />
      <line x1={30} y1={210} x2={370} y2={210} className="s s--blue as-belt sk-fade" style={dl(1)} />
      {AS_ROLLERS.map((x, i) => (
        <g key={`r${x}`} className="as-roll">
          <circle cx={x} cy={216} r={4} className="s s--soft d" pathLength={1} style={dl(0.4 + i * 0.04)} />
          <line x1={x - 4} y1={216} x2={x + 4} y2={216} className="s s--soft sk-fade" style={dl(0.9)} />
        </g>
      ))}

      {/* press */}
      <line x1={88} y1={94} x2={88} y2={210} {...DRAW} style={dl(0.4)} />
      <line x1={132} y1={94} x2={132} y2={210} {...DRAW} style={dl(0.4)} />
      <rect x={82} y={84} width={56} height={10} rx={2} {...DRAW} style={dl(0.6)} />
      <rect x={100} y={94} width={20} height={26} rx={2} {...DRAW} style={dl(0.8)} />
      <g className="as-ram">
        <line x1={110} y1={120} x2={110} y2={150} {...DRAW} style={dl(1)} />
        <rect x={100} y={150} width={20} height={8} rx={1} {...DRAW} style={dl(1.1)} />
      </g>
      <Note x={110} y={78} anchor="middle" d={1.2}>
        PRESS
      </Note>
      <Note x={80} y={110} anchor="end" d={1.3}>
        12 kN
      </Note>

      {/* screwdriver */}
      <rect x={170} y={80} width={66} height={8} rx={2} {...DRAW} style={dl(0.6)} />
      <line x1={230} y1={88} x2={230} y2={210} {...DRAW} style={dl(0.5)} />
      <line x1={200} y1={88} x2={200} y2={100} className="s s--soft s--dash sk-fade" style={dl(1)} />
      <g className="as-drv">
        <rect x={192} y={100} width={16} height={40} rx={2} {...DRAW} style={dl(0.9)} />
        <line x1={200} y1={140} x2={200} y2={152} {...DRAW} style={dl(1.1)} />
        <line x1={200} y1={152} x2={200} y2={164} className="s s--blue d" pathLength={1} style={dl(1.2)} />
        <g className="as-tq">
          <path d="M186 122 A14 5 0 1 0 214 122" className="s s--red" />
          <path d="M214 122 l-5 -2 M214 122 l-1 -5" className="s s--red" />
        </g>
      </g>
      <Note x={200} y={74} anchor="middle" d={1.2}>
        SCREW
      </Note>
      <Note x={236} y={120} d={1.3}>
        2.4 Nm
      </Note>

      {/* vision */}
      <line x1={322} y1={100} x2={322} y2={210} {...DRAW} style={dl(0.5)} />
      <line x1={302} y1={100} x2={322} y2={100} {...DRAW} style={dl(0.7)} />
      <rect x={278} y={92} width={24} height={18} rx={2} {...DRAW} style={dl(0.8)} />
      <path d="M284 110 L282 118 H 298 L296 110" {...DRAW} style={dl(1)} />
      <path d="M283 118 L266 186 M297 118 L314 186" className="s s--soft s--dash sk-fade" style={dl(1.3)} />
      <path d="M283 118 L266 186 H 314 L297 118 Z" className="as-cone" />
      <circle cx={290} cy={101} r={2.6} className="as-cam" />
      <g className="as-frame">
        <path d="M262 178 V 172 H 268 M312 172 H 318 V 178 M318 202 V 208 H 312 M268 208 H 262 V 202" className="s s--blue" />
        <text x={258} y={170} textAnchor="end" className="sk-note">
          OK
        </text>
      </g>
      <Note x={290} y={84} anchor="middle" d={1.2}>
        VISION
      </Note>

      {/* the part on its pallet */}
      <g className="as-part">
        <rect x={30} y={202} width={30} height={8} rx={1} className="s" />
        <rect x={34} y={186} width={22} height={16} rx={1} className="s" />
        <line x1={38} y1={194} x2={52} y2={194} className="s s--soft" />
        <g className="as-pin">
          <line x1={45} y1={180} x2={45} y2={186} className="s" />
          <line x1={42} y1={180} x2={48} y2={180} className="s" />
        </g>
        <g className="as-screw">
          <circle cx={51} cy={190} r={2.4} className="s s--blue" />
        </g>
        <path d="M39 168 l3 3 l6 -6" className="s s--blue as-ok" />
      </g>

      <Dim x1={110} y1={240} x2={200} y2={240} label="pitch 900" />
    </g>
  );
}

/* ---------- servo: drive, motor, encoder, position trace ---------- */

const SV_C = { x: 336, y: 86 };
const SV_TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const s = Math.sin(a);
  const c = Math.cos(a);
  return { x1: r1(SV_C.x + s * 24), y1: r1(SV_C.y - c * 24), x2: r1(SV_C.x + s * 31), y2: r1(SV_C.y - c * 31) };
});
const SV_SINE = (() => {
  let d = "";
  for (let x = 150; x <= 370; x += 5) {
    const y = r1(228 - 24 * Math.sin(((x - 150) / 110) * Math.PI * 2));
    d += `${x === 150 ? "M" : " L"}${x} ${y}`;
  }
  return d;
})();
const SV_CMD = (() => {
  let d = "";
  for (let x = 150; x < 370; x += 11) {
    const y = r1(228 - 24 * Math.sin(((x - 150) / 110) * Math.PI * 2));
    d += `${x === 150 ? `M150 ${y}` : ` V ${y}`} H ${x + 11}`;
  }
  return d;
})();
/** PWM: two periods of 10px (duty 7 and 3), repeated four times so it can scroll */
const SV_PWM = (() => {
  let d = "M0 19";
  for (let k = 0; k < 8; k++) {
    const x0 = k * 10;
    const w = k % 2 === 0 ? 7 : 3;
    d += ` V 3 H ${x0 + w} V 19 H ${x0 + 10}`;
  }
  return d;
})();

function Servo() {
  return (
    <g>
      {/* drive */}
      <rect x={16} y={70} width={64} height={100} rx={3} {...DRAW} style={dl(0)} />
      <rect x={24} y={80} width={48} height={20} rx={1} className="s s--soft d" pathLength={1} style={dl(0.3)} />
      <circle cx={30} cy={114} r={3} className="sv-led" />
      {[28, 40, 52, 64].map((x) => (
        <circle key={`t${x}`} cx={x} cy={156} r={3} className="s s--soft sk-fade" style={dl(0.7)} />
      ))}
      <line x1={40} y1={114} x2={70} y2={114} className="s s--soft sk-fade" style={dl(0.7)} />
      <line x1={40} y1={124} x2={62} y2={124} className="s s--soft sk-fade" style={dl(0.7)} />
      <Note x={48} y={184} anchor="middle" d={1}>
        DRIVE
      </Note>

      {/* power cable with PWM */}
      <path d="M80 140 H 128" {...DRAW} style={dl(0.6)} />
      <path d="M80 140 H 128" pathLength={1} className="pulse" style={lp(0)} />
      <rect x={86} y={110} width={40} height={22} className="s s--soft sk-fade" style={dl(0.9)} />
      <svg x={86} y={110} width={40} height={22} viewBox="0 0 40 22" overflow="hidden">
        <g className="sv-pwm">
          <path d={SV_PWM} className="s s--blue sk-fade" style={dl(1.1)} />
        </g>
      </svg>
      <Note x={106} y={104} anchor="middle" d={1.2}>
        PWM 20 kHz
      </Note>

      {/* feedback cable */}
      <path d="M172 72 V 52 H 48 V 70" className="s s--soft s--dash sk-fade" style={dl(1)} />
      <path d="M172 72 V 52 H 48 V 70" pathLength={1} className="pulse pulse--red" style={lp(0.4)} />
      <Note x={110} y={46} anchor="middle" d={1.2}>
        FEEDBACK
      </Note>

      {/* motor, flange, shaft */}
      <rect x={128} y={92} width={8} height={56} rx={1} {...DRAW} style={dl(0.4)} />
      <rect x={136} y={84} width={90} height={72} rx={3} {...DRAW} style={dl(0.3)} />
      {[148, 156, 164, 172, 180, 188, 196, 204, 212].map((x, i) => (
        <line key={`f${x}`} x1={x} y1={90} x2={x} y2={150} className="s s--soft d" pathLength={1} style={dl(0.6 + i * 0.04)} />
      ))}
      <rect x={160} y={72} width={24} height={12} rx={1} {...DRAW} style={dl(0.7)} />
      <rect x={226} y={90} width={10} height={60} rx={1} {...DRAW} style={dl(0.6)} />
      <rect x={236} y={115} width={34} height={10} rx={1} {...DRAW} style={dl(0.9)} />
      <line x1={244} y1={120} x2={262} y2={120} className="s s--soft sk-fade" style={dl(1.2)} />
      <path d="M276 110 A10 10 0 1 1 276 130" className="s s--blue sk-fade" style={dl(1.4)} />
      <path d="M276 130 l5 -1 M276 130 l2 -5" className="s s--blue sk-fade" style={dl(1.4)} />
      <Dim x1={128} y1={172} x2={270} y2={172} label="L 142" />

      {/* detail A: encoder disc */}
      <line x1={272} y1={114} x2={306} y2={98} className="s s--soft s--dash sk-fade" style={dl(1.4)} />
      <circle cx={SV_C.x} cy={SV_C.y} r={34} {...DRAW} style={dl(1)} />
      <g className="sv-disc">
        {SV_TICKS.map((t, i) => (
          <line key={`k${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={i === 0 ? "s s--red" : "s s--soft"} />
        ))}
        <line x1={SV_C.x} y1={SV_C.y - 16} x2={SV_C.x} y2={SV_C.y - 24} className="s s--red" />
      </g>
      <circle cx={SV_C.x} cy={SV_C.y} r={8} {...DRAW} style={dl(1.2)} />
      <circle cx={SV_C.x} cy={SV_C.y} r={2.4} className="sk-dot sk-fade" style={dl(1.3)} />
      <rect x={330} y={40} width={12} height={8} rx={1} {...DRAW} style={dl(1.3)} />
      <rect x={331} y={41} width={10} height={6} className="sv-z" />
      <Note x={346} y={47} d={1.5}>
        Z
      </Note>
      <Note x={SV_C.x} y={134} anchor="middle" d={1.5}>
        DETAIL A
      </Note>
      <Note x={SV_C.x} y={144} anchor="middle" d={1.5}>
        ENC 2048 PPR
      </Note>

      {/* position trace */}
      <path d="M146 194 V 262 H 384" {...DRAW} style={dl(0.8)} />
      <line x1={146} y1={228} x2={384} y2={228} className="s s--soft s--dash sk-fade" style={dl(1.2)} />
      <path d={SV_CMD} className="s s--soft sk-fade" style={dl(1.4)} />
      <path d={SV_SINE} pathLength={1} className="s s--blue sv-sine" />
      <line x1={150} y1={196} x2={150} y2={260} className="s s--red s--soft sv-cursor" />
      <Note x={140} y={202} anchor="end" d={1.5}>
        θ
      </Note>
      <Note x={384} y={272} anchor="end" d={1.5}>
        t
      </Note>
      <Note x={384} y={202} anchor="end" d={1.6}>
        CMD / ACT
      </Note>
    </g>
  );
}

export const leadSketches: Partial<Record<VisualKind, SketchDef>> = {
  scada: { fig: "FIG. · SCADA LINE MONITOR", cycle: 6, body: Scada },
  data: { fig: "FIG. · MACHINE DATA PIPELINE", cycle: 6, body: Data },
  assembly: { fig: "FIG. · ASSEMBLY LINE", cycle: 7.2, body: Assembly },
  servo: { fig: "FIG. · SERVO AXIS", cycle: 4, body: Servo },
};
