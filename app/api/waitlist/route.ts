import { NextRequest, NextResponse } from "next/server";

import { handleSignup } from "@/lib/waitlist/handleSignup";
import { createResendMailer, DEFAULT_FROM } from "@/lib/waitlist/mailer";
import { DEFAULT_ALERT_TO } from "@/lib/waitlist/signupAlert";
import { createSupabaseWaitlistStore, WaitlistStoreError } from "@/lib/waitlist/store";

const MAX_BODY_BYTES = 8192;

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function logError(context: string, err: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[waitlist] ${context}`, err);
  }
}

export async function POST(req: NextRequest) {
  let parsed: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return jsonError("Request too large", 413);
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return jsonError("Invalid payload", 400);
  }
  const body = parsed as Record<string, unknown>;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    return jsonError(
      "Server configuration error. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the landing app (see .env.example).",
      500,
    );
  }

  let store;
  try {
    store = createSupabaseWaitlistStore(supabaseUrl, serviceKey);
  } catch (err) {
    logError("store init", err);
    return jsonError(
      err instanceof WaitlistStoreError ? err.message : "Server configuration error.",
      500,
    );
  }

  // Without a key the signup still succeeds; the response reports emailSent:false so the UI
  // can avoid telling someone to check an inbox that will stay empty.
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const mailer = resendKey
    ? createResendMailer(resendKey, process.env.WAITLIST_EMAIL_FROM?.trim() || DEFAULT_FROM)
    : undefined;
  if (!resendKey) logError("email", "RESEND_API_KEY is not set; skipping confirmation email");

  const headerReferrer = req.headers.get("referer");
  const bodyReferrer = typeof body.referrer === "string" ? body.referrer.trim() : "";

  const result = await handleSignup(
    {
      email: body.email,
      source: body.source,
      website: body.website,
      referrer: headerReferrer?.slice(0, 2048) ?? (bodyReferrer ? bodyReferrer.slice(0, 2048) : null),
      userAgent: req.headers.get("user-agent")?.slice(0, 2048) ?? null,
    },
    { store, mailer, alertTo: alertRecipients(), onError: logError },
  );

  return NextResponse.json(result.body, { status: result.status });
}

/** WAITLIST_ALERT_TO overrides the founders' addresses, comma-separated. */
function alertRecipients(): string[] {
  const fromEnv = process.env.WAITLIST_ALERT_TO?.split(",").map((s) => s.trim()).filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_ALERT_TO;
}

export function GET() {
  return jsonError("Method not allowed", 405);
}
