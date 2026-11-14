/**
 * The four primary technology verticals, in the exact order required by
 * content/ABOUT_OMGX_AI.md section 4. Do not reorder.
 */

export type CapabilitySlug =
  | "artificial-intelligence"
  | "industrial-automation"
  | "immersive-technologies"
  | "hardware-engineering";

export type Capability = {
  slug: CapabilitySlug;
  index: "01" | "02" | "03" | "04";
  title: string;
  shortTitle: string;
  positioning: string;
  intro: string;
  /** Four short labels used by the interactive ring connectors. */
  keywords: [string, string, string, string];
  capabilities: string[];
  solutions: string[];
  relatedProjects: string[];
  relatedInitiatives: string[];
  theme: "dark" | "light";
};

export const capabilities: Capability[] = [
  {
    slug: "artificial-intelligence",
    index: "01",
    title: "Artificial Intelligence & Machine Learning",
    shortTitle: "AI & Machine Learning",
    positioning: "Applied intelligence for business processes, operations and industry.",
    intro:
      "Our primary technology vertical. We design AI applications, intelligent workflows and computer-vision systems, and integrate them with the platforms and physical operations they need to serve.",
    keywords: ["Generative AI", "AI agents", "Computer vision", "Predictive analytics"],
    capabilities: [
      "Artificial intelligence and machine learning applications",
      "Generative AI solutions",
      "AI-powered enterprise applications",
      "AI agents and intelligent workflow automation",
      "Computer vision and visual intelligence",
      "Predictive analytics and intelligent decision systems",
      "Custom AI platforms and integrations",
      "Business process automation",
    ],
    solutions: [
      "Custom AI application development",
      "Enterprise AI integration",
      "AI agents and workflow automation",
      "Generative AI solutions",
      "Computer-vision systems",
      "Intelligent data analysis",
      "Predictive analytics",
      "AI-powered business automation",
    ],
    relatedProjects: ["industrial-ar-safety-training", "xr-training-content-platform"],
    relatedInitiatives: [
      "bona-ai",
      "bizigpt",
      "omgx-os",
      "omgx-app",
      "jev-vision-integration",
      "binwin-ai-applications",
      "mallika-ai-receptionist",
      "pattern-internet",
      "fruit-brain",
      "pitwall",
      "omg-now",
    ],
    theme: "dark",
  },
  {
    slug: "industrial-automation",
    index: "02",
    title: "Industrial Automation & Robotics",
    shortTitle: "Industrial Automation",
    positioning: "Control, monitoring and automation engineered for the production floor.",
    intro:
      "The foundation of the company. Machine integration, PLC, SCADA and HMI systems, motion control and production data acquisition, built for assembly lines, test rigs and process plants.",
    keywords: ["PLC · SCADA · HMI", "Servo & motion", "Machine monitoring", "Automated testing"],
    capabilities: [
      "Industrial automation and machine integration",
      "Robotics and automated machinery",
      "PLC, SCADA and HMI systems",
      "Servo and motion control",
      "VFD and motor control",
      "Hydraulic and pneumatic automation",
      "Industrial IoT and machine monitoring",
      "Production data acquisition",
      "Automated testing and inspection",
      "Smart manufacturing systems",
      "Predictive maintenance solutions",
      "Custom industrial engineering",
    ],
    solutions: [
      "Industrial automation engineering",
      "Robotic system integration",
      "Smart manufacturing solutions",
      "Machine monitoring and integration",
      "Production automation",
      "Predictive maintenance",
      "Automated testing systems",
      "Industrial process optimisation",
    ],
    relatedProjects: [
      "ashok-leyland-h-engine-scada",
      "bosch-assembly-line-data-acquisition",
      "bosch-wireless-nutrunner-monitoring",
      "beml-cylinder-head-assembly",
      "tvs-weld-frame-rectification",
      "tvs-kick-effort-test-rig",
      "ifb-window-regulator-test-rig",
      "wrigleys-pallet-coating-system",
      "apc-pick-and-place",
      "apc-wireless-andon",
    ],
    relatedInitiatives: [],
    theme: "light",
  },
  {
    slug: "immersive-technologies",
    index: "03",
    title: "Immersive Technologies: AR / VR / XR",
    shortTitle: "Immersive Technologies",
    positioning: "Virtual, augmented and extended reality for training, safety and simulation.",
    intro:
      "Commercial VR, AR and XR applications: immersive industrial training, safety simulations, interactive 3D environments and the platforms used to create and deploy them.",
    keywords: ["VR simulation", "AR guidance", "XR training", "Interactive 3D"],
    capabilities: [
      "Commercial virtual-reality applications",
      "Augmented-reality applications",
      "Extended-reality solutions",
      "Immersive industrial training",
      "VR-based safety simulations",
      "Interactive 3D environments",
      "Engineering and equipment simulations",
      "Enterprise immersive applications",
      "AR-assisted operator guidance",
      "XR training and content platforms",
    ],
    solutions: [
      "Commercial VR application development",
      "AR application development",
      "XR training platforms",
      "Industrial safety simulations",
      "Virtual equipment simulations",
      "Immersive enterprise applications",
      "Interactive 3D environments",
    ],
    relatedProjects: [
      "log9-battery-vr-simulation",
      "aviation-vr-training",
      "industrial-ar-safety-training",
      "xr-training-content-platform",
      "unity-cloud-ide-xr-builder",
    ],
    relatedInitiatives: [],
    theme: "dark",
  },
  {
    slug: "hardware-engineering",
    index: "04",
    title: "Hardware Engineering & Integration",
    shortTitle: "Hardware Engineering",
    positioning: "Embedded systems, sensors and electronics that connect software to the physical world.",
    intro:
      "Embedded development, electronics and sensor integration, industrial communication and data acquisition, from custom controllers and kiosks to camera and video-streaming systems.",
    keywords: ["Embedded systems", "Sensor integration", "Data acquisition", "Serial · TCP/IP"],
    capabilities: [
      "Embedded systems development",
      "Hardware–software integration",
      "Electronics and sensor integration",
      "Industrial communication systems",
      "Data acquisition systems",
      "Camera and video-streaming integration",
      "Custom electronic controllers",
      "Serial and TCP/IP communication",
      "Sensor-based monitoring",
      "Custom hardware prototyping",
      "Specialised engineering systems",
    ],
    solutions: [
      "Embedded systems development",
      "Custom electronics integration",
      "Sensor and device integration",
      "Hardware–software engineering",
      "Industrial communication",
      "Data acquisition",
      "Custom controllers and prototypes",
    ],
    relatedProjects: [
      "iti-digital-coin-validator",
      "southern-railways-ticket-vending-machine",
      "bosch-wireless-nutrunner-monitoring",
      "bmtc-mobile-video-surveillance",
      "gvk-airstream",
      "fishin-india-underwater-monitoring",
    ],
    relatedInitiatives: [],
    theme: "light",
  },
];

export const customRnd = {
  title: "Custom R&D and Engineering",
  note: "A cross-disciplinary service across all four verticals, not a fifth vertical.",
  items: [
    "Technical feasibility research",
    "Custom technology development",
    "Proof-of-concept engineering",
    "Hardware and software prototyping",
    "Technology integration",
    "Specialised engineering projects",
  ],
};

export const getCapability = (slug: string) => capabilities.find((c) => c.slug === slug);
