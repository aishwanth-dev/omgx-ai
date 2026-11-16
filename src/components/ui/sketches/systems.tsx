import type { VisualKind } from "@/content/projects";
import { DRAW, Dim, Note, dl, lp, r1, type SketchDef, type Vars } from "./kit";
import "./systems.css";

/**
 * Systems sketches: kiosk, video streaming, network, underwater monitoring and
 * VR training. Each draws in once, then loops a short story (see systems.css).
 * Fixed coordinates only.
 */

/* ---------- kiosk: platform ticket vending machine ---------- */

const KI_TAP = { x: 190, y: 111 };
/* pointing hand, fingertip at 0,0 */
const KI_HAND =
  "M-5 34 V5 A5 5 0 0 1 5 5 V24 A5 5 0 0 1 15 26 A5 5 0 0 1 25 30 V50 Q25 66 10 66 H4 Q-6 66 -12 56 L-20 42 Q-22 36 -16 35 Q-11 35 -5 42 Z";

function Kiosk() {
  return (
    <g>
      <line x1={16} y1={250} x2={384} y2={250} {...DRAW} style={dl(0)} />

      {/* cabinet, plinth, header */}
      <rect x={120} y={34} width={140} height={206} rx={8} {...DRAW} style={dl(0.1)} />
      <rect x={128} y={240} width={124} height={10} rx={2} {...DRAW} style={dl(0.3)} />
      <rect x={132} y={44} width={116} height={14} rx={2} {...DRAW} style={dl(0.3)} />
      <Note x={186} y={54} anchor="middle" d={0.8}>
        PLATFORM TICKET
      </Note>
      <circle cx={240} cy={51} r={2} className="sk-dot sk-fade" style={dl(0.8)} />

      {/* touch screen */}
      <rect x={134} y={66} width={112} height={80} rx={3} {...DRAW} style={dl(0.4)} />
      <rect x={140} y={72} width={100} height={68} rx={1} className="s s--soft d" pathLength={1} style={dl(0.6)} />

      {/* UI state A: menu */}
      <g className="ki-sa">
        <line x1={146} y1={80} x2={196} y2={80} {...DRAW} style={dl(0.9)} />
        {[86, 104, 122].map((y, i) => (
          <g key={y}>
            <rect x={146} y={y} width={88} height={14} rx={2} className="s s--blue d" pathLength={1} style={dl(1 + i * 0.1)} />
            <line x1={152} y1={y + 7} x2={184 - i * 8} y2={y + 7} className="s s--soft sk-fade" style={dl(1.3)} />
          </g>
        ))}
      </g>
      <rect x={146} y={104} width={88} height={14} rx={2} className="ki-hl" />

      {/* UI state B: scan to pay */}
      <g className="ki-sb">
        <rect x={148} y={82} width={30} height={30} className="s" />
        {[
          [150, 84],
          [168, 84],
          [150, 102],
        ].map(([x, y]) => (
          <rect key={`q${x}${y}`} x={x} y={y} width={8} height={8} className="s s--soft" />
        ))}
        <path d="M161 87 h3 M161 92 h4 M168 97 h6 M161 101 h3 M168 104 h7 M161 108 h4 M170 109 h5" className="s" />
        <line x1={186} y1={90} x2={230} y2={90} className="s" />
        <line x1={186} y1={98} x2={214} y2={98} className="s s--soft" />
        <text x={186} y={110} className="sk-note">
          SCAN QR
        </text>
        <rect x={146} y={124} width={88} height={6} rx={3} className="s s--soft" />
        <rect x={147} y={125} width={86} height={4} rx={2} className="ki-prog" />
      </g>

      {/* UI state C: printing */}
      <g className="ki-sc">
        <circle cx={190} cy={98} r={13} className="s s--blue" />
        <path d="M183 98 l5 5 l9 -10" className="s s--blue" />
        <text x={190} y={126} textAnchor="middle" className="sk-note">
          PRINTING
        </text>
      </g>

      {/* tap ripples */}
      <circle cx={KI_TAP.x} cy={KI_TAP.y} r={8} className="s s--red ki-ripple" />
      <circle cx={KI_TAP.x} cy={KI_TAP.y} r={8} className="s s--red ki-ripple" style={lp(0.18)} />

      {/* QR / NFC reader with scan line */}
      <rect x={140} y={152} width={44} height={32} rx={3} {...DRAW} style={dl(0.6)} />
      <rect x={146} y={158} width={32} height={20} rx={1} className="s s--soft d" pathLength={1} style={dl(0.9)} />
      <rect x={146} y={158} width={32} height={20} rx={1} className="flash ki-ok" style={lp(3.3)} />
      <line x1={148} y1={160} x2={176} y2={160} className="s s--red ki-scan" />

      {/* coin slot and change tray */}
      <rect x={198} y={152} width={40} height={12} rx={2} {...DRAW} style={dl(0.7)} />
      <line x1={208} y1={158} x2={228} y2={158} className="s sk-fade" style={dl(1.1)} />
      <path d="M198 172 H238 V180 Q238 186 232 186 H204 Q198 186 198 180 Z" {...DRAW} style={dl(0.8)} />

      {/* ticket printer and the ticket */}
      <rect x={150} y={196} width={80} height={6} rx={2} {...DRAW} style={dl(0.9)} />
      <g className="ki-rcpt">
        <g className="sk-fade" style={dl(1.4)}>
          <path d="M164 200 V234 H216 V200" className="s" />
          <path d="M170 208 H206 M170 214 H196 M170 220 H210" className="s s--soft" />
          <line x1={164} y1={228} x2={216} y2={228} className="s s--soft s--dash" />
        </g>
      </g>

      {/* the user's hand: rests to the right, reaches in and taps */}
      <g transform={`translate(${KI_TAP.x} ${KI_TAP.y})`}>
        <g className="ki-hand">
          <path d={KI_HAND} {...DRAW} className="s d ki-hand__shape" style={dl(1.2)} />
          <path d="M5 24 V32 M15 27 V34 M2 66 L0 80 M22 61 L28 76" className="s s--soft sk-fade" style={dl(1.5)} />
        </g>
      </g>

      {/* callouts */}
      <Note x={22} y={104} d={1.2}>
        TOUCH UI
      </Note>
      <line x1={70} y1={101} x2={134} y2={101} className="s s--soft sk-fade" style={dl(1.2)} />
      <Note x={22} y={171} d={1.3}>
        QR / NFC
      </Note>
      <line x1={70} y1={168} x2={140} y2={168} className="s s--soft sk-fade" style={dl(1.3)} />
      <Note x={22} y={202} d={1.4}>
        PRINTER
      </Note>
      <line x1={66} y1={199} x2={150} y2={199} className="s s--soft sk-fade" style={dl(1.4)} />
      <Note x={272} y={161} d={1.3}>
        COIN
      </Note>
      <line x1={238} y1={158} x2={268} y2={158} className="s s--soft sk-fade" style={dl(1.3)} />
      <Note x={272} y={182} d={1.4}>
        CHANGE
      </Note>
      <line x1={238} y1={179} x2={268} y2={179} className="s s--soft sk-fade" style={dl(1.4)} />

      <Dim x1={120} y1={262} x2={260} y2={262} label="W 600" d={1.6} />
      <Dim x1={372} y1={34} x2={372} y2={250} label="H 1 700" d={1.6} />
    </g>
  );
}

/* ---------- streaming: IP cameras to NVR to monitor wall ---------- */

const ST_CAM_Y = [70, 150, 230];
const ST_LINKS = ["M96 70 H 118 V 132 H 140", "M96 150 H 140", "M96 230 H 118 V 168 H 140"];
const ST_TILES = [
  [254, 82],
  [318, 82],
  [254, 130],
  [318, 130],
];
const ST_PKT = 1.6; // first frame leaves the NVR
const ST_GAP = 0.25;

function TileScene({ i, x, y }: { i: number; x: number; y: number }) {
  const common = { className: "s s--soft sk-fade", style: dl(1.3) };
  if (i === 0)
    return (
      <g>
        <rect x={x + 12} y={y + 18} width={30} height={12} rx={2} {...common} />
        <circle cx={x + 19} cy={y + 31} r={2} {...common} />
        <circle cx={x + 35} cy={y + 31} r={2} {...common} />
      </g>
    );
  if (i === 1)
    return (
      <g>
        <circle cx={x + 29} cy={y + 14} r={3} {...common} />
        <path d={`M${x + 29} ${y + 17} V ${y + 26} M${x + 29} ${y + 26} L ${x + 25} ${y + 33} M${x + 29} ${y + 26} L ${x + 33} ${y + 33}`} {...common} />
      </g>
    );
  if (i === 2)
    return (
      <g>
        <rect x={x + 10} y={y + 12} width={14} height={21} {...common} />
        <rect x={x + 32} y={y + 18} width={16} height={15} {...common} />
      </g>
    );
  return (
    <path
      d={`M${x + 14} ${y + 30} V ${y + 24} H ${x + 20} L ${x + 25} ${y + 18} H ${x + 36} L ${x + 41} ${y + 24} H ${x + 46} V ${y + 30} Z`}
      {...common}
    />
  );
}

function Streaming() {
  return (
    <g>
      <line x1={16} y1={252} x2={384} y2={252} {...DRAW} style={dl(0)} />

      {/* pole with three cameras; each head pans with its field of view */}
      <line x1={96} y1={40} x2={96} y2={252} {...DRAW} style={dl(0.1)} />
      <path d="M86 252 L96 240 L106 252" {...DRAW} style={dl(0.2)} />
      <Note x={104} y={44} d={0.9}>
        IP CAM · ONVIF
      </Note>
      {ST_CAM_Y.map((y, i) => (
        <g key={`c${y}`}>
          <line x1={88} y1={y} x2={96} y2={y} {...DRAW} style={dl(0.3)} />
          <g className="st-head" style={{ ...lp(i * 0.8), transformOrigin: `88px ${y}px` }}>
            <path d={`M60 ${y} L18 ${y - 24} L18 ${y + 24} Z`} className="sy-fill sk-fade" style={dl(1.1)} />
            <path d={`M60 ${y} L18 ${y - 24} M60 ${y} L18 ${y + 24}`} className="s s--blue s--dash sk-fade" style={dl(1)} />
            <rect x={66} y={y - 7} width={20} height={14} rx={3} {...DRAW} style={dl(0.3 + i * 0.1)} />
            <rect x={60} y={y - 5} width={6} height={10} rx={1} {...DRAW} style={dl(0.4 + i * 0.1)} />
            <path d={`M58 ${y - 10} H 86`} {...DRAW} style={dl(0.5 + i * 0.1)} />
            <circle cx={80} cy={y - 2} r={1.4} className="sk-dot sk-fade" style={dl(0.9)} />
          </g>
          <circle cx={88} cy={y} r={2.5} {...DRAW} style={dl(0.4)} />
          <Note x={60} y={y + 18} d={1}>
            {`CAM ${i + 1}`}
          </Note>
        </g>
      ))}
      <Note x={22} y={113} d={1.3}>
        FOV 60°
      </Note>

      {/* camera links, frames travelling to the NVR */}
      {ST_LINKS.map((d, i) => (
        <path key={`l${i}`} d={d} {...DRAW} style={dl(0.6 + i * 0.1)} />
      ))}
      {ST_LINKS.map((d, i) => (
        <path key={`p${i}`} d={d} pathLength={1} className="pulse" style={lp(i * 0.3)} />
      ))}

      {/* NVR / encoder */}
      <rect x={140} y={118} width={56} height={64} rx={3} {...DRAW} style={dl(0.5)} />
      {[148, 158, 168].map((y) => (
        <rect key={`b${y}`} x={146} y={y} width={44} height={6} rx={1} className="s s--soft sk-fade" style={dl(1)} />
      ))}
      {[150, 158, 166].map((x, i) => (
        <g key={`e${x}`}>
          <circle cx={x} cy={128} r={1.8} className="sk-dot sk-fade" style={dl(1)} />
          <circle cx={x} cy={128} r={3} className="flash" style={lp(1.2 + i * 0.3)} />
        </g>
      ))}
      <Note x={186} y={131} anchor="middle" d={1}>
        NVR
      </Note>
      <Note x={168} y={196} anchor="middle" d={1.2}>
        H.264
      </Note>

      {/* uplink: encoded frames as packets */}
      <path d="M196 150 H 248" {...DRAW} style={dl(0.9)} />
      <Note x={222} y={143} anchor="middle" d={1.2}>
        RTSP
      </Note>
      {ST_TILES.map((_, k) => (
        <g key={`f${k}`} className="st-pkt" style={lp(ST_PKT + k * ST_GAP)}>
          <rect x={198} y={146} width={9} height={8} rx={1} className="s s--blue" />
          <line x1={200} y1={150} x2={205} y2={150} className="s s--blue" />
        </g>
      ))}

      {/* monitor wall: 2 x 2 tiles, REC dots, each tile refreshes as its frame lands */}
      <rect x={248} y={76} width={132} height={102} rx={3} {...DRAW} style={dl(0.6)} />
      {ST_TILES.map(([x, y], i) => (
        <g key={`t${i}`}>
          <rect x={x} y={y} width={58} height={42} rx={1} className="s s--soft d" pathLength={1} style={dl(0.9 + i * 0.08)} />
          <line x1={x + 4} y1={y + 34} x2={x + 54} y2={y + 34} className="s s--soft sk-fade" style={dl(1.2)} />
          <TileScene i={i} x={x} y={y} />
          <rect x={x + 1} y={y + 1} width={56} height={40} className="flash st-tile" style={lp(ST_PKT + 0.8 + i * ST_GAP)} />
          <g className="sk-fade" style={dl(1.4)}>
            <circle cx={x + 7} cy={y + 7} r={2} className="st-rec" style={lp(i * 0.15)} />
          </g>
          <text x={x + 12} y={y + 10} className="sk-note sk-fade" style={dl(1.4)}>
            REC
          </text>
          <text x={x + 54} y={y + 40} textAnchor="end" className="sk-note sk-fade" style={dl(1.4)}>
            {`CH${i + 1}`}
          </text>
        </g>
      ))}
      <path d="M314 178 V 240 M296 252 L314 240 L332 252" {...DRAW} style={dl(0.7)} />
      <Dim x1={248} y1={62} x2={380} y2={62} label="4 x 1080p" d={1.6} />
    </g>
  );
}

/* ---------- network: WAN, firewall, core, access, hosts, NMS ---------- */

const NW_LINKS = [
  "M200 66 V 84",
  "M200 110 V 136",
  "M180 158 V 176 H 110 V 196",
  "M220 158 V 176 H 290 V 196",
  "M96 212 V 226 H 60 V 238",
  "M110 212 V 238",
  "M124 212 V 226 H 160 V 238",
  "M276 212 V 226 H 240 V 238",
  "M290 212 V 238",
  "M304 212 V 226 H 340 V 236",
];
/* the route: inbound packet is held and scanned at the firewall, then forwarded to the server;
   telemetry from host H1 travels up to the NMS */
const NW_HOPS = [
  { d: "M200 66 V 84", l: 0, red: true },
  { d: "M200 110 V 136", l: 1.3 },
  { d: "M220 158 V 176 H 290 V 196", l: 1.84 },
  { d: "M304 212 V 226 H 340 V 236", l: 2.38 },
  { d: "M60 238 V 226 H 96 V 212", l: 3 },
  { d: "M110 196 V 176 H 180 V 158", l: 3.54 },
  { d: "M240 147 H 300", l: 4.08 },
];
const NW_PCS = [60, 110, 160, 240, 290];
const NW_CORE_LED = [0, 1, 2, 3, 4, 5, 6, 7];
const NW_ACC_LED = [0, 1, 2, 3, 4, 5];

function Network() {
  return (
    <g>
      {/* legend */}
      <g className="sk-fade" style={dl(1.5)}>
        <line x1={24} y1={36} x2={40} y2={36} className="s" />
        <line x1={24} y1={48} x2={40} y2={48} className="s s--soft s--dash" />
        <line x1={24} y1={60} x2={40} y2={60} className="nw-legend" />
      </g>
      <Note x={46} y={39} d={1.5}>
        DATA 10G / 1G
      </Note>
      <Note x={46} y={51} d={1.5}>
        MGMT · SNMP
      </Note>
      <Note x={46} y={63} d={1.5}>
        PACKET
      </Note>

      {/* WAN cloud */}
      <path d="M170 64 A11 11 0 0 1 174 43 A16 16 0 0 1 204 35 A13 13 0 0 1 226 46 A10 10 0 0 1 228 64 Z" {...DRAW} style={dl(0)} />
      <Note x={200} y={57} anchor="middle" d={0.6}>
        WAN
      </Note>

      {/* firewall */}
      <rect x={176} y={84} width={48} height={26} rx={1} {...DRAW} style={dl(0.2)} />
      <path d="M176 93 H224 M176 101 H224 M192 84 V93 M208 84 V93 M184 93 V101 M200 93 V101 M216 93 V101 M192 101 V110 M208 101 V110" className="s s--soft sk-fade" style={dl(0.7)} />
      <Note x={230} y={100} d={0.8}>
        FW · DPI
      </Note>

      {/* core switch */}
      <rect x={160} y={136} width={80} height={22} rx={3} {...DRAW} style={dl(0.35)} />
      <g className="sk-fade" style={dl(0.9)}>
        {NW_CORE_LED.map((i) => (
          <g key={`cp${i}`}>
            <rect x={166 + i * 9} y={148} width={6} height={5} className="s s--soft" />
            <circle cx={169 + i * 9} cy={142} r={1.5} className="nw-led" style={lp(r1((i * 0.37) % 1.7))} />
          </g>
        ))}
      </g>
      <Note x={154} y={150} anchor="end" d={0.9}>
        CORE L3
      </Note>

      {/* access switches */}
      {[74, 254].map((x, s) => (
        <g key={`a${x}`}>
          <rect x={x} y={196} width={72} height={16} rx={2} {...DRAW} style={dl(0.5 + s * 0.1)} />
          <g className="sk-fade" style={dl(1)}>
            {NW_ACC_LED.map((i) => (
              <g key={`ap${i}`}>
                <rect x={x + 8 + i * 10} y={204} width={6} height={4} className="s s--soft" />
                <circle cx={x + 11 + i * 10} cy={200} r={1.3} className="nw-led" style={lp(r1(((i + s * 3) * 0.53) % 2.1))} />
              </g>
            ))}
          </g>
        </g>
      ))}
      <Note x={68} y={204} anchor="end" d={1.1}>
        SW-A
      </Note>
      <Note x={68} y={213} anchor="end" d={1.1}>
        VLAN 10
      </Note>
      <Note x={332} y={204} d={1.1}>
        SW-B
      </Note>
      <Note x={332} y={213} d={1.1}>
        VLAN 20
      </Note>

      {/* links */}
      {NW_LINKS.map((d, i) => (
        <path key={`l${i}`} d={d} className="s s--soft d" pathLength={1} style={dl(0.6 + i * 0.05)} />
      ))}
      <path d="M240 147 H 300" className="s s--soft s--dash sk-fade" style={dl(1)} />

      {/* hosts and server */}
      {NW_PCS.map((x, i) => (
        <g key={`h${x}`}>
          <rect x={x - 11} y={238} width={22} height={14} rx={1} {...DRAW} style={dl(0.8 + i * 0.06)} />
          <path d={`M${x} 252 V 257 M${x - 6} 257 H ${x + 6}`} className="s sk-fade" style={dl(1.1)} />
          <Note x={x} y={268} anchor="middle" d={1.2}>
            {`H${i + 1}`}
          </Note>
        </g>
      ))}
      <rect x={332} y={236} width={16} height={24} rx={1} {...DRAW} style={dl(1.1)} />
      <path d="M335 242 H345 M335 248 H345" className="s s--soft sk-fade" style={dl(1.3)} />
      <circle cx={340} cy={255} r={1.4} className="sk-dot sk-fade" style={dl(1.3)} />
      <Note x={340} y={270} anchor="middle" d={1.3}>
        SRV
      </Note>

      {/* NMS with a live graph */}
      <rect x={300} y={126} width={60} height={40} rx={2} {...DRAW} style={dl(0.7)} />
      <path d="M330 166 V 172 M322 172 H 338" className="s sk-fade" style={dl(1)} />
      <path d="M306 158 L316 150 L326 154 L336 142 L346 146 L354 136" className="s s--soft d" pathLength={1} style={dl(1.2)} />
      <g className="sk-fade" style={dl(1.5)}>
        <path d="M306 158 L316 150 L326 154 L336 142 L346 146 L354 136" pathLength={1} className="nw-graph" />
      </g>
      <Note x={330} y={120} anchor="middle" d={1.1}>
        NMS · SNMP
      </Note>

      {/* firewall check: hold, scan, pass */}
      <circle cx={200} cy={84} r={3} className="flash flash--red" style={lp(0.5)} />
      <line x1={178} y1={85} x2={178} y2={109} className="s s--red nw-scan" />
      <path d="M200 86 L210 90 V97 Q210 105 200 109 Q190 105 190 97 V90 Z" className="s s--blue nw-shield" />

      {/* device glows as the packet arrives */}
      <rect x={160} y={136} width={80} height={22} rx={3} className="flash nw-glow" style={lp(1.84)} />
      <rect x={254} y={196} width={72} height={16} rx={2} className="flash nw-glow" style={lp(2.38)} />
      <rect x={332} y={236} width={16} height={24} rx={1} className="flash nw-glow" style={lp(2.92)} />
      <rect x={49} y={238} width={22} height={14} rx={1} className="flash nw-glow" style={lp(3)} />
      <rect x={74} y={196} width={72} height={16} rx={2} className="flash nw-glow" style={lp(3.54)} />
      <rect x={160} y={136} width={80} height={22} rx={3} className="flash nw-glow" style={lp(4.08)} />
      <rect x={300} y={126} width={60} height={40} rx={2} className="flash nw-glow" style={lp(4.62)} />

      {/* packets hop along the route */}
      {NW_HOPS.map((h, i) => (
        <path key={`p${i}`} d={h.d} pathLength={1} className={`nw-hop ${h.red ? "nw-hop--red" : ""}`} style={lp(h.l)} />
      ))}
    </g>
  );
}

/* ---------- underwater: buoy, tethered camera pod, sonar ---------- */

const wave = (x0: number, y: number, n: number, up: number) => `M${x0} ${y} q10 ${-up} 20 0` + " t20 0".repeat(n - 1);
const UW_RAD = [7, 12, 17].map((r) => {
  const c = r1(r * Math.cos(Math.PI / 4.5));
  const s = r1(r * Math.sin(Math.PI / 4.5));
  return { r, d: `M${120 + c} ${r1(36 - s)} A${r} ${r} 0 0 1 ${120 + c} ${r1(36 + s)}` };
});
const UW_PING = "M136.1 216.9 A14 14 0 0 0 155.9 216.9";
const UW_FISH = "M14 0 Q8 -9 -6 -8 Q-10 -8 -12 -4 L-20 -9 L-18 0 L-20 9 L-12 4 Q-10 8 -6 8 Q8 9 14 0 Z";
const UW_BUBBLES = [
  { x: 150, r: 2, bx: 4, l: 0 },
  { x: 156, r: 1.5, bx: -3, l: 1.4 },
  { x: 146, r: 2.4, bx: 6, l: 2.9 },
  { x: 153, r: 1.8, bx: -5, l: 4.3 },
];
const UW_HATCH = [24, 44, 64, 84, 104, 124, 144, 164, 184, 204, 224, 244, 264, 284, 304, 324, 344, 364];

function Fish() {
  return (
    <g>
      <path d={UW_FISH} className="s" />
      <path d="M6 -7 Q-2 -15 -10 -7 M5 -5 Q2 0 5 5" className="s s--soft" />
      <circle cx={9} cy={-1} r={1.2} className="sk-dot" />
    </g>
  );
}

function Underwater() {
  return (
    <g>
      {/* surface swell */}
      <g className="uw-wave">
        <path d={wave(32, 70, 17, 4)} {...DRAW} style={dl(0)} />
      </g>
      <g className="uw-wave uw-wave--2">
        <path d={wave(40, 78, 16, -3)} className="s s--soft d" pathLength={1} style={dl(0.2)} />
      </g>
      <Note x={330} y={60} d={0.8}>
        SURFACE
      </Note>

      {/* buoy with beacon and radio uplink */}
      <g className="uw-bob">
        <path d="M100 64 H140 L133 80 H107 Z" {...DRAW} style={dl(0.2)} />
        <line x1={120} y1={64} x2={120} y2={39} {...DRAW} style={dl(0.4)} />
        <circle cx={120} cy={36} r={3} {...DRAW} style={dl(0.5)} />
        <circle cx={120} cy={36} r={3} className="flash flash--red" style={lp(0)} />
        {UW_RAD.map((a, i) => (
          <path key={`r${a.r}`} d={a.d} className="s s--blue uw-rad" style={lp(2.8 + i * 0.15)} />
        ))}
      </g>
      <Note x={146} y={44} d={0.9}>
        BUOY · 4G UPLINK
      </Note>

      {/* tether, live video travelling up it */}
      <path d="M118 80 C 108 118, 160 136, 148 174" {...DRAW} style={dl(0.5)} />
      <path d="M148 174 C 160 136, 108 118, 118 80" pathLength={1} className="pulse" style={lp(1.3)} />
      <path d="M148 174 C 160 136, 108 118, 118 80" pathLength={1} className="pulse" style={lp(4)} />
      <Note x={152} y={112} d={1.1}>
        TETHER · PoE
      </Note>

      {/* camera pod */}
      <path d="M134 178 V174 H160 V178" {...DRAW} style={dl(0.7)} />
      <rect x={122} y={178} width={50} height={24} rx={5} {...DRAW} style={dl(0.7)} />
      <path d="M172 180 A12 12 0 0 1 172 200" {...DRAW} style={dl(0.9)} />
      <circle cx={164} cy={190} r={5} {...DRAW} style={dl(1)} />
      <circle cx={164} cy={190} r={2} className="sk-dot sk-fade" style={dl(1.2)} />
      <line x1={128} y1={190} x2={150} y2={190} className="s s--soft sk-fade" style={dl(1.1)} />
      <rect x={140} y={202} width={12} height={5} rx={1} {...DRAW} style={dl(1)} />

      {/* camera field of view and the tilapia it watches */}
      <path d="M180 190 L340 130 L340 250 Z" className="sy-fill sk-fade" style={dl(1.2)} />
      <path d="M180 190 L340 130 M180 190 L340 250" className="s s--blue s--dash sk-fade" style={dl(1.1)} />
      <Note x={200} y={146} d={1.3}>
        CAM · 1080p LIVE
      </Note>
      <g transform="translate(275 184)">
        <g className="uw-fish" style={lp(0.3)}>
          <Fish />
        </g>
      </g>
      <g transform="translate(280 204) scale(-0.8 0.8)">
        <g className="uw-fish" style={lp(2.6)}>
          <Fish />
        </g>
      </g>

      {/* sonar ping and its echo off the bed */}
      {[0, 0.5, 1].map((l) => (
        <path key={`s${l}`} d={UW_PING} className="s s--blue uw-ping" style={lp(l)} />
      ))}
      <circle cx={146} cy={259} r={3} className="flash flash--red" style={lp(1.8)} />
      <Note x={190} y={250} d={1.4}>
        SONAR 200 kHz
      </Note>

      {/* bubbles from the pod vent */}
      {UW_BUBBLES.map((b) => (
        <circle key={`b${b.x}`} cx={b.x} cy={172} r={b.r} className="s s--soft uw-bub" style={{ ...lp(b.l), "--bx": `${b.bx}px` } as Vars} />
      ))}

      {/* mooring and seabed */}
      <line x1={126} y1={202} x2={112} y2={252} className="s s--soft d" pathLength={1} style={dl(1)} />
      <rect x={104} y={252} width={16} height={7} rx={1} {...DRAW} style={dl(1.1)} />
      <path d="M16 262 Q60 256 100 260 T180 258 T260 262 T340 257 T384 260" {...DRAW} style={dl(0.3)} />
      <g className="sk-fade" style={dl(1)}>
        {UW_HATCH.map((x) => (
          <line key={`h${x}`} x1={x} y1={266} x2={x - 6} y2={272} className="s s--soft" />
        ))}
      </g>

      <Dim x1={30} y1={70} x2={30} y2={262} label="DEPTH 6.5 m" d={1.5} />
      <Dim x1={62} y1={70} x2={62} y2={190} label="POD 3.0 m" d={1.6} />
    </g>
  );
}

/* ---------- VR training: tracked trainee, base stations, virtual valve ---------- */

const VR_SPOKES = [90, 210, 330].map((a) => {
  const c = Math.cos((a * Math.PI) / 180);
  const s = Math.sin((a * Math.PI) / 180);
  return `M${r1(320 + 4 * c)} ${r1(128 - 4 * s)} L${r1(320 + 18 * c)} ${r1(128 - 18 * s)}`;
});
const VR_SWEEPS = [
  { st: "a", l: 0 },
  { st: "b", l: 1.5 },
  { st: "a", l: 3 },
  { st: "b", l: 4.5 },
];
/* when each sweep crosses the headset */
const VR_HITS = [0.31, 1.76, 3.31, 4.76];

function VrTraining() {
  return (
    <g>
      <line x1={16} y1={250} x2={384} y2={250} {...DRAW} style={dl(0)} />
      <path d="M64 250 L328 250 L298 222 L94 222 Z" className="s s--soft s--dash sk-fade" style={dl(0.8)} />

      {/* base stations */}
      <path d="M28 28 H52 M40 28 V38" {...DRAW} style={dl(0.1)} />
      <g transform="rotate(30 40 46)">
        <rect x={32} y={40} width={16} height={12} rx={2} {...DRAW} style={dl(0.2)} />
        <line x1={44} y1={43} x2={44} y2={49} className="s s--soft sk-fade" style={dl(0.6)} />
      </g>
      <path d="M348 28 H372 M360 28 V38" {...DRAW} style={dl(0.1)} />
      <g transform="rotate(-30 360 46)">
        <rect x={352} y={40} width={16} height={12} rx={2} {...DRAW} style={dl(0.2)} />
        <line x1={356} y1={43} x2={356} y2={49} className="s s--soft sk-fade" style={dl(0.6)} />
      </g>
      <Note x={58} y={36} d={0.8}>
        BASE A
      </Note>
      <Note x={342} y={36} anchor="end" d={0.8}>
        BASE B
      </Note>
      {VR_SWEEPS.map((s, i) => (
        <line
          key={`w${i}`}
          x1={s.st === "a" ? 40 : 360}
          y1={46}
          x2={s.st === "a" ? 270 : 130}
          y2={46}
          className={`s s--red vr-sweep vr-sweep--${s.st}`}
          style={lp(s.l)}
        />
      ))}

      {/* trainee in profile: headset, torso, legs, arms */}
      <circle cx={168} cy={78} r={13} {...DRAW} style={dl(0.3)} />
      <path d="M172 68 H190 Q194 68 194 72 V82 Q194 86 190 86 H172 Z" {...DRAW} style={dl(0.5)} />
      <path d="M172 72 Q160 64 156 76 Q156 86 172 84 M164 65 Q170 62 176 68" className="s s--soft d" pathLength={1} style={dl(0.7)} />
      {[
        [186, 72],
        [190, 80],
      ].map(([x, y]) => (
        <g key={`ir${x}`}>
          <circle cx={x} cy={y} r={1.3} className="sk-dot sk-fade" style={dl(1)} />
          {VR_HITS.map((l) => (
            <circle key={`hit${l}`} cx={x} cy={y} r={3} className="vr-hit" style={lp(l)} />
          ))}
        </g>
      ))}
      <path d="M164 91 V96 M172 91 V96" {...DRAW} style={dl(0.6)} />
      <path d="M152 98 Q146 128 152 162 H180 Q186 128 180 98 Q166 94 152 98 Z" {...DRAW} style={dl(0.6)} />
      <path d="M154 162 L150 244 H161 L166 180 L171 244 H182 L178 162" {...DRAW} style={dl(0.8)} />
      <path d="M178 100 L198 120 L224 112 L226 120 L198 130 L174 114" {...DRAW} style={dl(0.9)} />
      <path d="M154 100 L140 132 L144 156 L150 155 L147 134 L158 112" className="s s--soft d" pathLength={1} style={dl(0.9)} />

      {/* controllers */}
      <circle cx={232} cy={108} r={6} {...DRAW} style={dl(1.1)} />
      <path d="M226 112 L222 126" {...DRAW} style={dl(1.1)} />
      <circle cx={146} cy={162} r={5} className="s s--soft d" pathLength={1} style={dl(1.1)} />
      <path d="M146 156 V 170" className="s s--soft sk-fade" style={dl(1.2)} />
      <Note x={184} y={60} d={1.2}>
        HMD · 6DoF
      </Note>
      <Note x={234} y={140} d={1.3}>
        CTRL · RAY
      </Note>

      {/* virtual valve on a pipe, inside its hologram bounds */}
      <rect x={290} y={100} width={92} height={104} className="s s--soft s--dash sk-fade" style={dl(1.4)} />
      <Note x={292} y={96} d={1.4}>
        SIM VALVE V-12
      </Note>
      <path d="M276 174 H382 M276 186 H382 M276 170 V190" className="s s--blue d" pathLength={1} style={dl(0.9)} />
      <path d="M306 168 L334 192 V168 L306 192 Z" className="s s--blue d" pathLength={1} style={dl(1.1)} />
      <line x1={320} y1={146} x2={320} y2={174} className="s s--blue d" pathLength={1} style={dl(1.2)} />
      <path d="M360 192 V250" className="s s--soft s--dash sk-fade" style={dl(1.2)} />
      <path d="M282 180 H304 M336 180 H382" className="vr-flow" />
      <g className="vr-wheel">
        <circle cx={320} cy={128} r={18} className="s s--blue d" pathLength={1} style={dl(1.2)} />
        <circle cx={320} cy={128} r={4} className="s s--blue d" pathLength={1} style={dl(1.4)} />
        {VR_SPOKES.map((d) => (
          <path key={d} d={d} className="s s--blue sk-fade" style={dl(1.5)} />
        ))}
      </g>

      {/* ray cast from the controller, hit point and highlight */}
      <line x1={237} y1={105} x2={302} y2={123} pathLength={1} className="vr-ray" />
      <circle cx={302} cy={123} r={3} className="s s--red vr-on" />
      <path d="M296 112 V104 H304 M336 104 H344 V112 M344 144 V152 H336 M304 152 H296 V144" className="s s--red vr-on" style={lp(0.12)} />
      <text x={320} y={218} textAnchor="middle" className="sk-note vr-closed">
        CLOSED
      </text>
      <text x={320} y={218} textAnchor="middle" className="sk-note vr-open">
        OPEN
      </text>

      <Dim x1={64} y1={262} x2={328} y2={262} label="PLAY AREA 3.0 m" d={1.6} />
    </g>
  );
}

export const systemsSketches: Partial<Record<VisualKind, SketchDef>> = {
  kiosk: { fig: "FIG. N-01 · TICKET KIOSK", cycle: 6, loop: 2.4, body: Kiosk },
  streaming: { fig: "FIG. N-02 · CCTV TO NVR", cycle: 4.8, loop: 2.4, body: Streaming },
  network: { fig: "FIG. N-03 · NETWORK TOPOLOGY", cycle: 5.4, loop: 2.4, body: Network },
  underwater: { fig: "FIG. N-04 · UNDERWATER POD", cycle: 6, loop: 2.4, body: Underwater },
  vr: { fig: "FIG. N-05 · VR TRAINING CELL", cycle: 6, loop: 2.4, body: VrTraining },
};
