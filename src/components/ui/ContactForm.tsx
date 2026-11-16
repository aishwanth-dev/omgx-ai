"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/content/site";
import { LIMITS, PROJECT_CATEGORIES, validateContact, type ContactErrors, type ContactPayload } from "@/lib/contact";
import { cooldownRemaining, markSent, sendEnquiry } from "@/lib/emailjs";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error" };

const EMPTY: ContactPayload = { name: "", email: "", company: "", category: "", description: "", budget: "", website: "" };

export function ContactForm({ defaultCategory }: { defaultCategory?: string }) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactPayload>({ ...EMPTY, category: defaultCategory ?? "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [cooldown, setCooldown] = useState(0);

  // Counts down the 30 s resend lock (also restored after a reload).
  useEffect(() => {
    const timer = window.setTimeout(() => setCooldown(Math.ceil(cooldownRemaining() / 1000)), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(Math.ceil(cooldownRemaining() / 1000)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const set = (key: keyof ContactPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: found } = validateContact(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof ContactPayload)[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    if (cooldownRemaining() > 0) return;
    // Honeypot filled: pretend success without sending.
    if (values.website) {
      setStatus({ kind: "sent" });
      setValues({ ...EMPTY });
      return;
    }
    setStatus({ kind: "sending" });
    const result = await sendEnquiry(validateContact(values).data);
    if (result.ok) {
      markSent();
      setCooldown(Math.ceil(cooldownRemaining() / 1000));
      setStatus({ kind: "sent" });
      setValues({ ...EMPTY });
      return;
    }
    setStatus({ kind: "error" });
  };

  const field = (key: keyof ContactPayload) => ({
    id: `${id}-${key}`,
    name: key,
    value: values[key],
    onChange: set(key),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-err` : undefined,
  });

  const err = (key: keyof ContactPayload) =>
    errors[key] ? (
      <p id={`${id}-${key}-err`} className="form__error">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form ref={formRef} className="form" noValidate onSubmit={onSubmit} aria-describedby={`${id}-note`}>
      <div className="form__grid">
        <div className="form__field">
          <label htmlFor={`${id}-name`}>Full name *</label>
          <input type="text" autoComplete="name" maxLength={LIMITS.name} required {...field("name")} />
          {err("name")}
        </div>
        <div className="form__field">
          <label htmlFor={`${id}-email`}>Work email *</label>
          <input type="email" autoComplete="email" inputMode="email" maxLength={LIMITS.email} required {...field("email")} />
          {err("email")}
        </div>
        <div className="form__field">
          <label htmlFor={`${id}-company`}>Company / organisation *</label>
          <input type="text" autoComplete="organization" maxLength={LIMITS.company} required {...field("company")} />
          {err("company")}
        </div>
        <div className="form__field">
          <label htmlFor={`${id}-category`}>Project category *</label>
          <div className="form__select">
            <select required {...field("category")}>
              <option value="" disabled>
                Choose a category
              </option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {err("category")}
        </div>
        <div className="form__field form__field--full">
          <label htmlFor={`${id}-description`}>Project description *</label>
          <textarea data-lenis-prevent="" rows={6} maxLength={LIMITS.description} required {...field("description")} />
          {err("description")}
        </div>
        <div className="form__field form__field--full">
          <label htmlFor={`${id}-budget`}>Budget range (optional)</label>
          <input type="text" maxLength={LIMITS.budget} placeholder="Optional, for example a rough range" {...field("budget")} />
          {err("budget")}
        </div>
        <div className="form__hp" aria-hidden="true">
          <label htmlFor={`${id}-website`}>Website</label>
          <input type="text" tabIndex={-1} autoComplete="off" {...field("website")} />
        </div>
      </div>

      <div className="form__foot">
        <button type="submit" className="btn btn--primary" disabled={status.kind === "sending" || cooldown > 0}>
          {status.kind === "sending" ? "Sending…" : "Start an engineering conversation"}
          <span className="btn__arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p id={`${id}-note`} className="t-small muted form__note">
          Fields marked * are required. Your details are used only to respond to this enquiry.
        </p>
      </div>

      <div aria-live="polite" role="status">
        <AnimatePresence>
          {status.kind === "sent" && (
            <motion.p key="sent" className="form__status form__status--ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Thank you. Your enquiry has reached the OMGX AI team. We will get back to you soon.
            </motion.p>
          )}
          {cooldown > 0 && status.kind !== "sent" && status.kind !== "error" && (
            <motion.p key="wait" className="form__status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Your enquiry was just sent. Please wait {cooldown} seconds before sending another.
            </motion.p>
          )}
          {status.kind === "error" && (
            <motion.p key="err" className="form__status form__status--error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              We could not send your enquiry just now. Please email us at{" "}
              <a href={`mailto:${site.contact.supportEmail}`}>{site.contact.supportEmail}</a>.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
