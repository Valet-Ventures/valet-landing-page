/**
 * Waitlist signup flow, kept free of Next.js and network specifics so it can be driven
 * directly by tests with a fake store and a recording mailer.
 */
import { isPlausibleEmail, normalizeEmail } from "./email";
import { FOUNDING_MEMBER_SUBJECT, buildFoundingMemberEmailHtml, buildFoundingMemberEmailText } from "./foundingMemberEmail";
import type { Mailer } from "./mailer";
import { buildSignupAlert, shouldAlert } from "./signupAlert";
import { type SignupSource, type WaitlistStore, WaitlistStoreError, resolveSource } from "./store";

export interface SignupRequest {
  email?: unknown;
  source?: unknown;
  /** Honeypot. Any non-empty value means a bot filled a field humans cannot see. */
  website?: unknown;
  referrer?: string | null;
  userAgent?: string | null;
}

export interface SignupResult {
  status: number;
  body: {
    ok: boolean;
    created?: boolean;
    alreadyRegistered?: boolean;
    foundingMemberNumber?: number | null;
    emailSent?: boolean;
    error?: string;
  };
}

export interface SignupDeps {
  store: WaitlistStore;
  /** Omitted when no provider is configured; signup still succeeds, emailSent comes back false. */
  mailer?: Mailer;
  /** Founders to alert about signups; omitted or empty sends no alerts. */
  alertTo?: string[];
  onError?: (context: string, err: unknown) => void;
}

export async function handleSignup(req: SignupRequest, deps: SignupDeps): Promise<SignupResult> {
  const { store, mailer, alertTo, onError } = deps;

  // Honeypot: answer exactly like success so a bot learns nothing, but write nothing.
  const honeypot = typeof req.website === "string" ? req.website : "";
  if (honeypot.trim() !== "") {
    return { status: 200, body: { ok: true } };
  }

  const raw = typeof req.email === "string" ? req.email : "";
  const email = normalizeEmail(raw);
  if (!email || !isPlausibleEmail(email)) {
    return { status: 422, body: { ok: false, error: "Enter a valid email address" } };
  }

  const source = resolveSource(req.source);
  const input = {
    email,
    source,
    referrer: req.referrer ?? null,
    userAgent: req.userAgent ?? null,
  };

  // The signup is already committed when this runs, so a failed alert is logged, never surfaced.
  async function alertFounders(source: SignupSource, created: boolean, foundingMemberNumber?: number | null) {
    if (!mailer || !alertTo?.length || !shouldAlert(source, created)) return;
    try {
      await mailer.send({
        to: alertTo,
        replyTo: email,
        ...buildSignupAlert({ email, source, created, foundingMemberNumber, referrer: req.referrer }),
      });
    } catch (err) {
      onError?.("signup alert send", err);
    }
  }

  try {
    if (source !== "founding-member") {
      const { created } = await store.addSignup(input);
      await alertFounders(source, created);
      return { status: 200, body: { ok: true, created, alreadyRegistered: !created } };
    }

    const outcome = await store.claimFoundingMember(input);

    // Only a genuinely new signup triggers an email. A repeat submission returns the number
    // they already hold and sends nothing.
    let emailSent = false;
    if (outcome.created && outcome.foundingMemberNumber !== null && mailer) {
      try {
        await mailer.send({
          to: email,
          subject: FOUNDING_MEMBER_SUBJECT,
          html: buildFoundingMemberEmailHtml(outcome.foundingMemberNumber),
          text: buildFoundingMemberEmailText(outcome.foundingMemberNumber),
        });
        emailSent = true;
      } catch (err) {
        // The signup is committed and the number is theirs. Failing the whole request would
        // invite a retry that cannot give them a second number, so report it instead.
        onError?.("founding-member email send", err);
      }
    }
    await alertFounders(source, outcome.created, outcome.foundingMemberNumber);

    return {
      status: 200,
      body: {
        ok: true,
        created: outcome.created,
        alreadyRegistered: !outcome.created,
        foundingMemberNumber: outcome.foundingMemberNumber,
        emailSent,
      },
    };
  } catch (err) {
    onError?.("waitlist signup", err);
    if (err instanceof WaitlistStoreError) {
      return { status: err.kind === "unreachable" ? 502 : 500, body: { ok: false, error: err.message } };
    }
    return { status: 500, body: { ok: false, error: "Something went wrong. Please try again." } };
  }
}
