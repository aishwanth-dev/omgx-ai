/**
 * Products, concepts and research initiatives — content/ABOUT_OMGX_AI.md section 11.
 * The profile does not confirm a public launch status for any of these, so
 * every item carries "Status to be confirmed". Never relabel as Live/Launched
 * without written confirmation from OMGX AI.
 * OMG Glitz is deliberately excluded.
 */
import type { FilterKey } from "./projects";
import { site } from "./site";

export type InitiativeType = "product" | "concept" | "research" | "other";

export type Initiative = {
  slug: string;
  name: string;
  type: InitiativeType;
  description: string;
  status: "Status to be confirmed";
  tags: FilterKey[];
};

export const initiativeTypeLabels: Record<InitiativeType, { label: string; group: string; blurb: string }> = {
  product: {
    label: "Product / application initiative",
    group: "Products, applications & software initiatives",
    blurb: "Applications and software initiatives across AI, vision and developer tooling.",
  },
  concept: {
    label: "Concept / platform initiative",
    group: "Concepts & platform initiatives",
    blurb: "Platform and application concepts under exploration. Not launched products.",
  },
  research: {
    label: "Research",
    group: "Research",
    blurb: "Exploratory research into new forms of machine intelligence.",
  },
  other: {
    label: "Other business initiative",
    group: "Other business initiative",
    blurb: "Outside the four core technology verticals.",
  },
};

export const initiatives: Initiative[] = [
  {
    slug: "bona-ai",
    name: "BONA AI",
    type: "product",
    description: "AI-powered business communication, lead generation and automation for SMEs and service businesses.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "bizigpt",
    name: "BiziGPT",
    type: "product",
    description: "WhatsApp-based AI business assistant for retailers and local businesses.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "jev-vision-integration",
    name: "JEV Vision Integration",
    type: "product",
    description: "AI vision-based industrial inspection focused on sealant detection and operator compliance.",
    status: "Status to be confirmed",
    tags: ["ai-software", "industrial"],
  },
  {
    slug: "binwin-ai-applications",
    name: "BinWin AI Applications",
    type: "product",
    description: "AI-enabled web application, admin dashboard, partner application and AI vision scanner.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "pitwall",
    name: "Pitwall",
    type: "product",
    description: "Open-source AI developer command-centre plugin for Omarchy Linux.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "omgx-os",
    name: "OMGX-OS",
    type: "concept",
    description: "Multi-tenant AI agent orchestration platform concept.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "omgx-app",
    name: "OMGX-app",
    type: "concept",
    description: "Voice-first agentic AI communication application concept.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "mallika-ai-receptionist",
    name: "Mallika AI Receptionist",
    type: "concept",
    description: "AI-powered receptionist concept for salon customer support and appointment booking.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "omg-now",
    name: "OMG Now",
    type: "concept",
    description: "Hyperlocal services and apartment-community gateway super-app concept.",
    status: "Status to be confirmed",
    tags: ["ai-software"],
  },
  {
    slug: "pattern-internet",
    name: "Pattern Internet",
    type: "research",
    description: "Research into distributed pattern intelligence and decentralised agent architecture.",
    status: "Status to be confirmed",
    tags: ["research", "ai-software"],
  },
  {
    slug: "fruit-brain",
    name: "Fruit Brain",
    type: "research",
    description: "Experimental research into dynamical intelligence and biologically inspired computing.",
    status: "Status to be confirmed",
    tags: ["research", "ai-software"],
  },
  {
    slug: "omg-collections",
    name: "OMG Collections",
    type: "other",
    description: "Ladies' fashion retail business initiative. Not part of the four core technology verticals.",
    status: "Status to be confirmed",
    tags: ["research"],
  },
];

/** Initiatives approved for public display (OMG Collections hidden until approved). */
export const publicInitiatives = initiatives.filter((i) => i.slug !== "omg-collections" || site.showOmgCollections);

export const getInitiative = (slug: string) => publicInitiatives.find((i) => i.slug === slug);
