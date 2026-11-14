/** Shared contact-form contract, validated on both client and server. */

export const PROJECT_CATEGORIES = [
  "Artificial Intelligence & Machine Learning",
  "Industrial Automation & Robotics",
  "Immersive Technologies: AR / VR / XR",
  "Hardware Engineering & Integration",
  "Custom R&D and Engineering",
  "Not sure yet",
] as const;

export type ContactPayload = {
  name: string;
  email: string;
  company: string;
  category: string;
  description: string;
  budget: string;
  /** Honeypot; must stay empty. */
  website: string;
};

export type ContactErrors = Partial<Record<keyof ContactPayload, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = { name: 120, email: 200, company: 160, description: 5000, budget: 120 };

export function validateContact(input: Partial<Record<keyof ContactPayload, unknown>>): {
  data: ContactPayload;
  errors: ContactErrors;
} {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const data: ContactPayload = {
    name: str(input.name),
    email: str(input.email),
    company: str(input.company),
    category: str(input.category),
    description: str(input.description),
    budget: str(input.budget),
    website: str(input.website),
  };
  const errors: ContactErrors = {};
  if (!data.name) errors.name = "Please enter your full name.";
  else if (data.name.length > LIMITS.name) errors.name = "Please shorten your name.";
  if (!data.email) errors.email = "Please enter your work email.";
  else if (!EMAIL.test(data.email) || data.email.length > LIMITS.email) errors.email = "Please enter a valid email address.";
  if (!data.company) errors.company = "Please enter your company or organisation.";
  else if (data.company.length > LIMITS.company) errors.company = "Please shorten the organisation name.";
  if (!PROJECT_CATEGORIES.includes(data.category as (typeof PROJECT_CATEGORIES)[number]))
    errors.category = "Please choose a project category.";
  if (data.description.length < 20) errors.description = "Please describe the project in at least 20 characters.";
  else if (data.description.length > LIMITS.description) errors.description = "Please keep the description under 5,000 characters.";
  if (data.budget.length > LIMITS.budget) errors.budget = "Please shorten the budget note.";
  return { data, errors };
}
