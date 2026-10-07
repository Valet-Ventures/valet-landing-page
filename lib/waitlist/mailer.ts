/** Transactional email, behind an interface so the send can be asserted in tests. */

export interface OutgoingEmail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Where a reply goes, e.g. the person who signed up, so an alert can be answered directly. */
  replyTo?: string;
}

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}

export class MailerError extends Error {
  readonly detail?: string;

  constructor(message: string, detail?: string) {
    super(message);
    this.name = "MailerError";
    this.detail = detail;
  }
}

/** Matches the sender already verified in Resend for the app's auth emails. */
export const DEFAULT_FROM = "Valet <noreply@auth.valet.app>";

export function createResendMailer(apiKey: string, from: string = DEFAULT_FROM): Mailer {
  return {
    async send(email) {
      let res: Response;
      try {
        res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: Array.isArray(email.to) ? email.to : [email.to],
            subject: email.subject,
            html: email.html,
            text: email.text,
            ...(email.replyTo ? { reply_to: email.replyTo } : {}),
          }),
        });
      } catch (err) {
        throw new MailerError(
          "Could not reach the email provider.",
          err instanceof Error ? err.message : String(err),
        );
      }

      if (!res.ok) {
        throw new MailerError(
          `Email provider rejected the send (HTTP ${res.status}).`,
          await res.text().catch(() => ""),
        );
      }
    },
  };
}
