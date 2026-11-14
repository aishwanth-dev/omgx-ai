/**
 * Project portfolio. Every record is transcribed from content/ABOUT_OMGX_AI.md
 * sections 6–10. Nothing here is invented: no dates, outcomes, metrics,
 * images or client logos. Fields that the profile does not document are
 * omitted, and `detailsNotSupplied` marks entries the profile explicitly
 * describes as "Additional detail: Not supplied".
 */

export type FilterKey =
  | "ai-software"
  | "industrial"
  | "immersive"
  | "hardware"
  | "networking"
  | "underwater"
  | "research";

export const workFilters: { key: FilterKey | "all"; label: string }[] = [
  { key: "all", label: "All Work" },
  { key: "ai-software", label: "AI & Software" },
  { key: "industrial", label: "Industrial Automation & Manufacturing" },
  { key: "immersive", label: "Immersive Technologies (AR / VR / XR)" },
  { key: "hardware", label: "Hardware & Embedded Systems" },
  { key: "networking", label: "Surveillance, Video Streaming & Networking" },
  { key: "underwater", label: "Underwater Monitoring" },
  { key: "research", label: "Research & Other Initiatives" },
];

/** Visual families for the procedural, clearly-labelled conceptual illustrations. */
export type VisualKind =
  | "scada"
  | "data"
  | "wireless"
  | "assembly"
  | "servo"
  | "testrig"
  | "process"
  | "robotics"
  | "andon"
  | "embedded"
  | "kiosk"
  | "streaming"
  | "network"
  | "vr"
  | "ar"
  | "platform"
  | "underwater"
  | "research"
  | "agent";

export type ProjectStatus = "Completed" | "Proof of concept" | "Concept";

export type Project = {
  slug: string;
  /** Client or client reference exactly as documented. Absent when not documented. */
  client?: string;
  clientLabel?: "Client" | "Client reference";
  title: string;
  category: string;
  /** Only set when the profile documents the status. */
  status?: ProjectStatus;
  summary: string;
  functionality?: string[];
  functionalityLabel?: string;
  technologies?: string[];
  technologyLabel?: string;
  location?: string;
  associatedOrganisation?: string;
  notes?: string[];
  detailsNotSupplied?: boolean;
  tags: FilterKey[];
  /** Primary filter used for grouping and related-project suggestions. */
  primary: FilterKey;
  visual: VisualKind;
  section: string;
};

export const projects: Project[] = [
  // 6. Industrial automation and manufacturing
  {
    slug: "ashok-leyland-h-engine-scada",
    client: "Ashok Leyland, Ennore",
    clientLabel: "Client",
    title: "H-Engine Assembly Line SCADA Monitoring System",
    category: "Industrial Automation / SCADA",
    summary:
      "Developed a centralised SCADA-based data acquisition and monitoring system for the H-Engine assembly line. Multiple machines were integrated through Siemens OPC Server, consolidating production data at a central PC server.",
    functionality: [
      "Centralised machine monitoring",
      "Real-time data acquisition",
      "OK/NOK production status identification",
      "Timestamping of production events",
      "Historical data retrieval",
      "Production monitoring and reporting",
    ],
    technologies: ["Siemens OPC Server", "SCADA", "Industrial communication", "Centralised PC server"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "scada",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "bosch-assembly-line-data-acquisition",
    client: "Bosch, Bengaluru",
    clientLabel: "Client",
    title: "Assembly Line Data Acquisition System",
    category: "Industrial Data Acquisition",
    summary:
      "Collected data from Bosch-supplied machines and consolidated it into a central server and customer SQL server.",
    functionality: [
      "Machine data collection",
      "Centralised data storage",
      "Local raw-data storage",
      "Customer SQL integration",
      "Custom VB6 and Excel reporting",
    ],
    technologies: [
      "Siemens Simatic PC Station",
      "CP1613",
      "CP343-1 Lean",
      "Simatic Net",
      "OPC",
      "S7 Manager",
      "VB6",
      "SQL Server",
    ],
    tags: ["industrial"],
    primary: "industrial",
    visual: "data",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "bosch-wireless-nutrunner-monitoring",
    client: "Bosch",
    clientLabel: "Client",
    title: "Wireless Factory Floor Data Acquisition",
    category: "Industrial IoT / Wireless Data Acquisition",
    summary:
      "Developed a wireless monitoring system to collect data from 18 DC nutrunners across an approximately 600-metre coverage area.",
    functionality: [
      "Wireless machine-data collection",
      "Serial-to-TCP/IP communication",
      "Central mobile-server collection",
      "Production and failure analysis",
      "Cp/Cpk statistical analysis",
    ],
    technologies: ["Rabbit RCM3000", "Compex access points", "TCP/IP", "VB6", "Winsock"],
    tags: ["industrial", "hardware"],
    primary: "industrial",
    visual: "wireless",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "beml-cylinder-head-assembly",
    client: "BEML, Mysore",
    clientLabel: "Client",
    title: "Cylinder Head Assembly System",
    category: "Industrial Automation / Assembly",
    summary: "Developed an automated cylinder-head bolt-tightening system.",
    functionality: [
      "Automated tightening sequences",
      "X/Y movement control",
      "Servo-controlled DC nutrunner operation",
      "PLC sequence control",
      "HMI-based operation and result display",
    ],
    technologies: ["Bosch Rexroth IndraDrive", "PLC", "HMI", "Servo-controlled DC nutrunners"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "assembly",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "tvs-weld-frame-rectification",
    client: "TVS Motor Company, Padi",
    clientLabel: "Client",
    title: "Weld Frame Rectification",
    category: "Industrial Automation / Servo Control / Measurement",
    summary:
      "Developed a system for correcting weld-frame deformation through hydraulic servo control and LVDT feedback.",
    functionality: [
      "Five hydraulic servo valves",
      "Five LVDT feedback channels",
      "Comparison against master values",
      "Real-time measurement and visualisation",
    ],
    technologies: ["Hydraulic servo valves", "LVDT", "NI multifunction DAQ", "VB6"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "servo",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "tvs-kick-effort-test-rig",
    client: "TVS Motor Company",
    clientLabel: "Client",
    title: "Kick Effort Test Rig",
    category: "Automated Testing / Measurement",
    summary: "Developed an automated test rig for measuring and analysing motorcycle kick effort.",
    functionality: [
      "Pneumatic test operation",
      "Load measurement",
      "Real-time data acquisition",
      "Load-versus-time graphical analysis",
      "Excel reporting",
    ],
    technologies: ["Festo pneumatic components", "Load cells", "NI DAQ", "VB6", "Excel"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "testrig",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "ifb-window-regulator-test-rig",
    client: "IFB APL, Bengaluru",
    clientLabel: "Client",
    title: "Window Regulator Test Rig",
    category: "Automated Testing / Production Line",
    summary: "Developed an online production-line test system for power and manual window regulators.",
    functionality: [
      "Automated product testing",
      "Fault identification",
      "Current-versus-time analysis",
      "Distance-versus-time analysis",
      "Barcode identification and reporting",
    ],
    technologies: ["Siemens servo DC motor", "Dynalog DAQ", "Zebra barcode printer", "VB6", "Excel"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "testrig",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "wrigleys-pallet-coating-system",
    client: "Wrigley's India / Kenya project experience",
    clientLabel: "Client reference",
    title: "Computerised Pallet Coating System",
    category: "Process Automation",
    summary:
      "Developed an automated coating system for applying sugar/flavour coating to chewing-gum pellets using controlled process timing.",
    functionality: [
      "Automated coating cycles",
      "Process timing control",
      "Temperature and humidity monitoring",
      "Motor and pneumatic control",
      "Production reporting",
    ],
    technologies: ["Siemens S7-300 PLC", "VFD", "Sensors", "ProTool", "VB6", "DAQ components"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "process",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "apc-pick-and-place",
    client: "APC Limited",
    clientLabel: "Client",
    title: "Pick-and-Place Machine",
    category: "Robotics / Material Handling",
    summary:
      "Developed an automated system for identifying different box models on a conveyor and stacking them onto pallets.",
    functionality: [
      "Automated box identification and handling",
      "Model selection through HMI",
      "Conveyor-based material handling",
      "Pneumatic pick-and-place",
      "Automated pallet stacking",
    ],
    technologies: ["Messung Nexgen PLC/HMI", "Mitsubishi VFD", "Festo pneumatic components", "Codesys/Soft Touch"],
    tags: ["industrial"],
    primary: "industrial",
    visual: "robotics",
    section: "Industrial automation and manufacturing",
  },
  {
    slug: "apc-wireless-andon",
    client: "APC India",
    clientLabel: "Client",
    title: "Wireless Andon System",
    category: "Industrial Monitoring / Wireless Andon",
    summary:
      "Developed a wireless Andon system connecting touchscreen Andon boxes to Android tablets and television-based central monitoring.",
    functionality: [
      "Wireless event communication",
      "Centralised Andon monitoring",
      "Event and timestamp logging",
      "MySQL event storage",
      "SMS escalation for unacknowledged events",
    ],
    technologies: ["Mini2440 ARM controller", "TCP/IP", "Android", "MySQL"],
    tags: ["industrial", "hardware"],
    primary: "industrial",
    visual: "andon",
    section: "Industrial automation and manufacturing",
  },

  // 7. Specialised engineering and embedded systems
  {
    slug: "iti-digital-coin-validator",
    client: "ITI Limited",
    clientLabel: "Client",
    title: "Digital Coin Validator",
    category: "Embedded Systems / Hardware Engineering",
    summary:
      "Developed a digital coin-validation system using Hall-effect sensing to distinguish metals and identify coins.",
    technologies: ["Hall-effect sensors", "Rabbit RCM3000", "Dynamic C"],
    tags: ["hardware"],
    primary: "hardware",
    visual: "embedded",
    section: "Specialised engineering and embedded systems",
  },
  {
    slug: "southern-railways-ticket-vending-machine",
    client: "Southern Railways",
    clientLabel: "Client",
    title: "Platform Ticket Vending Machine",
    category: "Hardware Integration / Ticketing Kiosk",
    summary:
      "Developed an interactive kiosk capable of accepting Indian coins, dispensing change and printing platform tickets.",
    technologies: [
      "Custom coin validator",
      "Change giver",
      "DC motors",
      "Solenoid relays",
      "Epson printer",
      "RS232",
      "VB6",
    ],
    tags: ["hardware"],
    primary: "hardware",
    visual: "kiosk",
    section: "Specialised engineering and embedded systems",
  },

  // 8. Surveillance, video streaming and networking
  {
    slug: "bmtc-mobile-video-surveillance",
    client: "BMTC",
    clientLabel: "Client",
    title: "Mobile Video Surveillance POC",
    category: "Video Surveillance / Networking",
    status: "Proof of concept",
    summary:
      "Proof of concept demonstrating live streaming from Wi-Fi IP cameras installed inside buses to a central data centre.",
    technologies: ["RTSP", "ONVIF", "Wi-Fi IP cameras", "D-Link 3G modems"],
    tags: ["networking", "hardware"],
    primary: "networking",
    visual: "streaming",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "gvk-airstream",
    client: "GVK India",
    clientLabel: "Client",
    title: "Airstream",
    category: "Video Streaming / Camera Management",
    status: "Proof of concept",
    summary: "Developed a proof of concept for centralised airport camera streaming and management.",
    functionality: [
      "Central streaming server",
      "Camera management",
      "User, group and location management",
      "Android live camera viewing",
      "Mobile video broadcasting",
    ],
    tags: ["networking", "hardware"],
    primary: "networking",
    visual: "streaming",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "anssird-mobicast",
    client: "ANSSIRD",
    clientLabel: "Client reference",
    title: "Mobicast",
    category: "Mobile / Satellite Communication",
    status: "Proof of concept",
    summary:
      "Developed a proof of concept for smartphone-based two-way satellite communication for rural development applications.",
    functionality: ["Mobile broadcaster", "Streaming server", "Android player and broadcaster"],
    functionalityLabel: "Components",
    tags: ["networking"],
    primary: "networking",
    visual: "network",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "ipdr-lms",
    title: "IPDR-LMS",
    category: "Telecom Data / Network Monitoring",
    summary: "Telecom network data processing, analysis and monitoring solution.",
    detailsNotSupplied: true,
    tags: ["networking", "ai-software"],
    primary: "networking",
    visual: "network",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "netgis",
    title: "NETGIS",
    category: "Network GIS / Infrastructure Visualisation",
    summary: "Network geographic information and infrastructure visualisation solution.",
    detailsNotSupplied: true,
    tags: ["networking", "ai-software"],
    primary: "networking",
    visual: "network",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "bharatnet-network-monitoring",
    title: "BharatNet Network Monitoring",
    category: "Broadband Infrastructure Monitoring",
    summary: "Broadband infrastructure monitoring and visibility solution.",
    detailsNotSupplied: true,
    tags: ["networking"],
    primary: "networking",
    visual: "network",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "mikrotik-network-monitoring",
    title: "MikroTik Network Monitoring",
    category: "Network Monitoring / Analytics",
    summary: "SNMP-based router monitoring and network analytics.",
    detailsNotSupplied: true,
    tags: ["networking"],
    primary: "networking",
    visual: "network",
    section: "Surveillance, video streaming and networking",
  },
  {
    slug: "rlms-tv-recorder",
    title: "RLMS TV Recorder",
    category: "IPTV / Media Systems",
    summary: "IPTV streaming, channel recording and playback solution.",
    detailsNotSupplied: true,
    tags: ["networking"],
    primary: "networking",
    visual: "streaming",
    section: "Surveillance, video streaming and networking",
  },

  // 9. Immersive technology projects
  {
    slug: "log9-battery-vr-simulation",
    client: "Log9",
    clientLabel: "Client",
    title: "Exploding Battery VR Simulation",
    category: "Virtual Reality / Immersive Simulation",
    status: "Completed",
    summary:
      "Completed a VR-based simulation project focused on an exploding battery scenario. The project used immersive virtual reality to represent a battery explosion scenario in a simulated environment.",
    technologies: [
      "Virtual reality",
      "Immersive 3D simulation",
      "Battery incident visualisation",
      "Interactive virtual environments",
    ],
    technologyLabel: "Technology domain",
    tags: ["immersive"],
    primary: "immersive",
    visual: "vr",
    section: "Immersive technology projects",
  },
  {
    slug: "aviation-vr-training",
    title: "Aviation VR Training",
    category: "Virtual Reality / Training",
    summary: "Immersive virtual-reality training software for aviation-related training scenarios.",
    detailsNotSupplied: true,
    tags: ["immersive"],
    primary: "immersive",
    visual: "vr",
    section: "Immersive technology projects",
  },
  {
    slug: "industrial-ar-safety-training",
    title: "Industrial AR Safety & Training",
    category: "Augmented Reality / Industrial Training",
    status: "Concept",
    summary:
      "AR-based operator guidance and industrial safety training concepts using AR glasses and AI-assisted compliance.",
    notes: ["Supported devices, client names and deployment outcomes are not documented."],
    tags: ["immersive", "ai-software"],
    primary: "immersive",
    visual: "ar",
    section: "Immersive technology projects",
  },
  {
    slug: "xr-training-content-platform",
    title: "XR Training Content Platform",
    category: "XR / Training Platform",
    summary: "AI-assisted training content creation, evaluation and enterprise deployment.",
    detailsNotSupplied: true,
    tags: ["immersive", "ai-software"],
    primary: "immersive",
    visual: "platform",
    section: "Immersive technology projects",
  },
  {
    slug: "unity-cloud-ide-xr-builder",
    title: "Unity Cloud IDE / XR Builder",
    category: "XR Development Tools",
    summary: "Cloud-based XR application development environment with hardware-specific compilation capabilities.",
    detailsNotSupplied: true,
    tags: ["immersive", "ai-software"],
    primary: "immersive",
    visual: "platform",
    section: "Immersive technology projects",
  },

  // 10. Underwater monitoring
  {
    slug: "fishin-india-underwater-monitoring",
    client: "Fishin' India Private Limited",
    clientLabel: "Client",
    title: "Underwater Tilapia Monitoring & Live-Streaming System",
    category: "Underwater Monitoring / Live Video Streaming",
    status: "Completed",
    location: "Visakhapatnam, India",
    associatedOrganisation: "The Fishin' Company",
    summary:
      "Developed an underwater monitoring solution for observing tilapia fish in a fisheries environment. The system enabled live underwater video streaming, providing remote visual monitoring of fish activity and underwater conditions.",
    functionality: [
      "Underwater tilapia monitoring",
      "Live underwater video streaming",
      "Remote visual observation",
      "Underwater camera and hardware integration",
      "Video transmission and monitoring",
    ],
    functionalityLabel: "Documented capabilities",
    technologies: [
      "Underwater monitoring",
      "Live video streaming",
      "Camera integration",
      "Hardware–software integration",
      "Specialised engineering",
    ],
    technologyLabel: "Technology domains",
    tags: ["underwater", "hardware"],
    primary: "underwater",
    visual: "underwater",
    section: "Underwater monitoring",
  },
];

export const featuredProjectSlugs = [
  "ashok-leyland-h-engine-scada",
  "bosch-wireless-nutrunner-monitoring",
  "beml-cylinder-head-assembly",
  "log9-battery-vr-simulation",
  "fishin-india-underwater-monitoring",
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const projectDisplayName = (p: Project) => {
  if (!p.client) return p.title;
  const shortClient = p.client.split(",")[0].replace(" India / Kenya project experience", "");
  return `${shortClient} — ${p.title}`;
};

export const relatedProjects = (p: Project, limit = 3) =>
  projects
    .filter((o) => o.slug !== p.slug && o.tags.some((t) => p.tags.includes(t)))
    .sort((a, b) => Number(b.primary === p.primary) - Number(a.primary === p.primary))
    .slice(0, limit);
