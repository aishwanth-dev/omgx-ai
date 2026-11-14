import { NextResponse } from "next/server";
import { validateContact } from "@/lib/contact";

/**
 * Enquiry endpoint. Validates input and forwards it to the OMGX-approved
 * delivery service configured in OMGX_CONTACT_WEBHOOK_URL. If no service is
 * configured it returns 503 so the form can say so honestly. It never reports
 * success without a confirmed delivery.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { data, errors } = validateContact(body as Record<string, unknown>);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, error: "validation", fields: errors }, { status: 422 });
  }
  // Honeypot filled: treat as spam without revealing that to the client.
  if (data.website) {
    return NextResponse.json({ ok: false, error: "rejected" }, { status: 400 });
  }

  const endpoint = process.env.OMGX_CONTACT_WEBHOOK_URL?.trim();
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!endpoint.startsWith("https://")) {
    console.error("[contact] OMGX_CONTACT_WEBHOOK_URL must use https.");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const token = process.env.OMGX_CONTACT_WEBHOOK_TOKEN?.trim();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        source: "omgx-ai-website",
        submittedAt: new Date().toISOString(),
        name: data.name,
        email: data.email,
        company: data.company,
        category: data.category,
        description: data.description,
        budget: data.budget || null,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[contact] delivery failed with status ${res.status}`);
      return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("[contact] delivery error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
