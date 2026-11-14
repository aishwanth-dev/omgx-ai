"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { LIMITS, PROJECT_CATEGORIES, validateContact, type ContactErrors, type ContactPayload } from "@/lib/contact";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const EMPTY: ContactPayload = { name: "", email: "", company: "", category: "", description: "", budget: "", website: "" };

export function ContactForm({ defaultCategory }: { defaultCategory?: string }) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactPayload>({ ...EMPTY, category: defaultCategory ?? "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: ContactErrors };
      if (res.ok && json.ok) {
        setStatus({ kind: "sent" });
        setValues({ ...EMPTY });
        return;
      }
      if (json.error === "validation" && json.fields) {
        setErrors(json.fields);
        setStatus({ kind: "idle" });
        return;
      }
      if (json.error === "not_configured") {
        setStatus({
          kind: "error",
          message:
            "Online enquiries are not connected yet: OMGX AI has not configured a delivery service for this form. Your message was not sent. Please keep a copy and try again once the form is live.",
        });
        return;
      }
      setStatus({ kind: "error", message: "Your message could not be delivered. It was not sent. Please try again in a moment." });
    } catch {
      setStatus({ kind: "error", message: "We couldn't reach the server, so your message was not sent. Please check your connection and try again." });
    }
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
          <textarea rows={6} maxLength={LIMITS.description} required {...field("description")} />
          {err("description")}
        </div>
        <div className="form__field form__field--full">
          <label htmlFor={`${id}-budget`}>Budget range (optional)</label>
          <input type="text" maxLength={LIMITS.budget} placeholder="Leave blank if not yet defined" {...field("budget")} />
          {err("budget")}
        </div>
        <div className="form__hp" aria-hidden="true">
          <label htmlFor={`${id}-website`}>Website</label>
          <input type="text" tabIndex={-1} autoComplete="off" {...field("website")} />
        </div>
      </div>

      <div className="form__foot">
        <button type="submit" className="btn btn--primary" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Start an engineering conversation"}
          <span className="btn__arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p id={`${id}-note`} className="t-small muted form__note">
          Fields marked * are required. Your details are used only to respond to this enquiry. A privacy policy will be
          linked here once OMGX AI publishes one.
        </p>
      </div>

      <div aria-live="polite" role="status">
        <AnimatePresence>
          {status.kind === "sent" && (
            <motion.p key="sent" className="form__status form__status--ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Thank you. Your enquiry was delivered to the OMGX AI team.
            </motion.p>
          )}
          {status.kind === "error" && (
            <motion.p key="err" className="form__status form__status--error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {status.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
