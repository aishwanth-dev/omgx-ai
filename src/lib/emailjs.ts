import type { ContactPayload } from "@/lib/contact";

/**
 * Enquiry delivery through EmailJS, called straight from the browser.
 * The public key is meant to be public. The private key is never used here.
 * All four IDs are public client-side values with built-in defaults, overridable by env.
 */
export const emailjsConfig = {
  serviceId: (process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "").trim() || "service_9hpjj0q",
  publicKey: (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "").trim() || "ehXae-xSQLsI4Hlb2",
  /** Notification sent to the OMGX AI inbox. */
  notifyTemplateId: (process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_NOTIFY ?? "").trim() || "template_s3v35xt",
  /** Auto-reply sent to the visitor. */
  replyTemplateId: (process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_REPLY ?? "").trim() || "template_7dsm5it",
};

export type EnquiryParams = {
  name: string;
  email: string;
  company: string;
  category: string;
  description: string;
  budget: string;
  time: string;
  to_email: string;
  reply_to: string;
};

export function buildTemplateParams(payload: ContactPayload, now: Date = new Date()): EnquiryParams {
  const time = `${now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST`;
  return {
    name: payload.name,
    email: payload.email,
    company: payload.company,
    category: payload.category,
    description: payload.description,
    budget: payload.budget.trim() || "Not specified",
    time,
    to_email: payload.email,
    reply_to: payload.email,
  };
}

export type SendResult = { ok: true } | { ok: false; reason: "not_configured" | "failed" };

/** Sends the notification first. Only if that succeeds is the auto-reply attempted; its failure is ignored. */
export async function sendEnquiry(payload: ContactPayload): Promise<SendResult> {
  const { serviceId, publicKey, notifyTemplateId, replyTemplateId } = emailjsConfig;
  if (!serviceId) return { ok: false, reason: "not_configured" };

  const params = buildTemplateParams(payload);
  let emailjs: typeof import("@emailjs/browser").default;
  try {
    emailjs = (await import("@emailjs/browser")).default;
    await emailjs.send(serviceId, notifyTemplateId, params, { publicKey });
  } catch {
    return { ok: false, reason: "failed" };
  }
  try {
    await emailjs.send(serviceId, replyTemplateId, params, { publicKey });
  } catch {
    /* The enquiry reached the team; the visitor does not need to see an auto-reply failure. */
  }
  return { ok: true };
}

/** Client-side cooldown after a successful send. */
export const COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = "omgx-enquiry-sent-at";

type Store = Pick<Storage, "getItem" | "setItem">;

const defaultStore = (): Store | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/** Milliseconds left before another enquiry may be sent (0 when allowed). */
export function cooldownRemaining(now: number = Date.now(), store: Store | null = defaultStore()): number {
  const last = Number(store?.getItem(COOLDOWN_KEY) ?? 0);
  if (!Number.isFinite(last) || last <= 0) return 0;
  return Math.max(0, Math.min(COOLDOWN_MS, last + COOLDOWN_MS - now));
}

export function markSent(now: number = Date.now(), store: Store | null = defaultStore()): void {
  try {
    store?.setItem(COOLDOWN_KEY, String(now));
  } catch {
    /* storage unavailable: no cooldown */
  }
}
