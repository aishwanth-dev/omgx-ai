/** Company story, founder, geography and process — content/ABOUT_OMGX_AI.md sections 1, 3, 12–14. */

export const story = {
  short:
    "OMGX AI is a multidisciplinary technology and engineering company building intelligent systems, advanced automation solutions, immersive technologies and integrated hardware–software systems. We combine software intelligence with physical engineering to solve complex technical and operational challenges.",
  foundation:
    "The company's journey began under Bona fide Digital Services with industrial automation, manufacturing systems, machine integration and hardware–software engineering.",
  expansion:
    "Building on that foundation, OMGX AI has expanded into artificial intelligence, machine learning, intelligent automation, robotics, commercial AR/VR/XR applications and advanced engineering solutions.",
  approach:
    "OMGX AI does not limit its work to predefined products. The team studies problems, researches technologies, designs solutions, develops prototypes and engineers customised systems based on client requirements.",
  positioning:
    "We connect intelligence to the real world. From AI applications and intelligent workflows to industrial control, immersive simulations and integrated hardware, OMGX AI works across the software and physical systems needed to solve complex problems.",
};

export const founder = {
  name: "Gururaj",
  role: "Founder",
  intro:
    "The engineering foundation of OMGX AI is built on the extensive industrial automation and hardware–software integration experience of its founder, Gururaj.",
  detail:
    "He has undertaken and led complex engineering projects alongside his technical team, working on customised automation systems, machine integration, industrial monitoring, specialised engineering and technology implementations.",
  experience: [
    "Industrial automation and manufacturing",
    "Hardware–software integration",
    "Machine control and process automation",
    "Industrial communication and monitoring",
    "Automated testing and measurement",
    "Embedded systems and electronics",
    "Specialised engineering applications",
    "International industrial project execution",
  ],
  /** Set to an approved photograph path in /public once supplied. Never use a generated portrait. */
  photo: null as string | null,
};

/** Journey stages. No dates are published because none are confirmed. */
export const journey = [
  {
    key: "foundation",
    label: "Foundation",
    title: "Bona fide Digital Services",
    body: "Industrial automation, manufacturing systems, machine integration and hardware–software engineering.",
  },
  {
    key: "projects",
    label: "Engineering record",
    title: "Factory floors to field systems",
    body: "SCADA and data acquisition, servo and test rigs, embedded kiosks, video streaming and network monitoring.",
  },
  {
    key: "expansion",
    label: "Expansion",
    title: "OMGX AI",
    body: "Artificial intelligence, machine learning, intelligent automation, robotics, commercial AR/VR/XR and advanced engineering.",
  },
  {
    key: "next",
    label: "Direction",
    title: "Think beyond. Engineer what's next.",
    body: "One engineering partner across software, machines and immersive systems.",
  },
];

export type Location = { key: string; name: string; detail?: string; lat: number; lon: number };

/** Geographies of the team's engineering experience. No offices, counts or clients are implied. */
export const locations: Location[] = [
  { key: "india", name: "India", lat: 21.0, lon: 78.0 },
  { key: "vietnam", name: "Vietnam", lat: 14.06, lon: 108.28 },
  { key: "china", name: "China", lat: 35.86, lon: 104.2 },
  { key: "singapore", name: "Singapore", lat: 1.35, lon: 103.82 },
  { key: "indonesia", name: "Indonesia", detail: "including Jakarta", lat: -6.2, lon: 106.85 },
  { key: "kenya", name: "Kenya", detail: "including Nairobi", lat: -1.29, lon: 36.82 },
];

export const geographyCopy =
  "Our engineering experience spans multiple international markets, bringing practical automation and integration expertise to diverse industrial environments.";

export const processSteps = [
  {
    key: "understand",
    index: "01",
    title: "Understand",
    body: "Study the operational or technical challenge: the process, the machines, the people and the constraints around them.",
  },
  {
    key: "research",
    index: "02",
    title: "Research",
    body: "Explore feasibility, candidate technologies and constraints before committing to an architecture.",
  },
  {
    key: "design",
    index: "03",
    title: "Design",
    body: "Define the system and solution architecture across software, controls, electronics and interfaces.",
  },
  {
    key: "prototype",
    index: "04",
    title: "Prototype",
    body: "Build and validate the relevant proof of concept or prototype against the real requirement.",
  },
  {
    key: "engineer",
    index: "05",
    title: "Engineer & Integrate",
    body: "Develop the customised system and integrate hardware and software as required.",
  },
];

export const processNote =
  "An explanation of how we approach customised engineering work, not a certified methodology.";
