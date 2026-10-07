/**
 * Internal alert to the founders when someone signs up on the website.
 *
 * Before this existed a signup reached the database and nobody: two investors asked for
 * partnership information in October 2026 and neither founder knew. Partnership requests alert
 * every time, even from someone already on the list, because the list stores one row per address
 * and a repeat request would otherwise vanish.
 */
import type { SignupSource } from "./store";

/** Overridable with WAITLIST_ALERT_TO (comma-separated) in the route. */
export const DEFAULT_ALERT_TO = ["jens@valet.app", "johnny@valet.app"];

export interface SignupAlertInput {
  email: string;
  source: SignupSource;
  /** False when the address was already on the list. */
  created: boolean;
  foundingMemberNumber?: number | null;
  referrer?: string | null;
}

/** Which signups are worth a founder's attention. */
export function shouldAlert(source: SignupSource, created: boolean): boolean {
  return source === "equity-partner" || created;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function buildSignupAlert(input: SignupAlertInput): { subject: string; html: string; text: string } {
  const { email, source, created, foundingMemberNumber, referrer } = input;

  let subject: string;
  let what: string;
  if (source === "equity-partner") {
    subject = `Valet: partnership request from ${email}`;
    what = created
      ? "asked to connect with the founding team about partnering."
      : "asked to connect with the founding team about partnering. They were already on the list, so this is a repeat or a new interest.";
  } else if (source === "founding-member") {
    const n = foundingMemberNumber ? ` #${foundingMemberNumber}` : "";
    subject = `Valet: new Founding Member${n}, ${email}`;
    what = `joined as Founding Member${n} and was sent the welcome email.`;
  } else {
    subject = `Valet: new waitlist signup, ${email}`;
    what = "joined the waitlist.";
  }

  const from = referrer ? `Signed up from ${referrer}.` : "";
  const reply = source === "equity-partner" ? "Reply to this email to answer them directly." : "";

  const text = [`${email} ${what}`, from, reply].filter(Boolean).join("\n\n");
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;">
<p><strong>${escapeHtml(email)}</strong> ${escapeHtml(what)}</p>
${from ? `<p style="color:#555;">${escapeHtml(from)}</p>` : ""}
${reply ? `<p style="color:#555;">${escapeHtml(reply)}</p>` : ""}
</div>`;

  return { subject, html, text };
}
