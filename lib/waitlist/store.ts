/** Persistence for waitlist signups, behind an interface so the flow is testable without a DB. */

export const SIGNUP_SOURCES = ["landing", "founding-member", "equity-partner"] as const;
export type SignupSource = (typeof SIGNUP_SOURCES)[number];
export const DEFAULT_SOURCE: SignupSource = "landing";

export function resolveSource(raw: unknown): SignupSource {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (SIGNUP_SOURCES as readonly string[]).includes(value)
    ? (value as SignupSource)
    : DEFAULT_SOURCE;
}

export interface SignupInput {
  email: string;
  source: SignupSource;
  referrer: string | null;
  userAgent: string | null;
}

export interface ClaimOutcome {
  /** NULL only for rows that predate the founding-member migration. */
  foundingMemberNumber: number | null;
  /** false means the email was already on the list, so no number was consumed. */
  created: boolean;
  status: string;
}

export type WaitlistStoreErrorKind = "unreachable" | "not_configured" | "rejected";

export class WaitlistStoreError extends Error {
  // Written out rather than using parameter properties: Node's strip-only TypeScript mode
  // cannot transform those, and the test runner executes these files directly.
  readonly kind: WaitlistStoreErrorKind;
  readonly detail?: string;

  constructor(message: string, kind: WaitlistStoreErrorKind, detail?: string) {
    super(message);
    this.name = "WaitlistStoreError";
    this.kind = kind;
    this.detail = detail;
  }
}

export interface WaitlistStore {
  /** Atomically claims the next founding member number, or returns the existing one. */
  claimFoundingMember(input: SignupInput): Promise<ClaimOutcome>;
  /** Plain signup for sources that do not get a founding member number. */
  addSignup(input: SignupInput): Promise<{ created: boolean }>;
}

/** Project root only, e.g. `https://xyz.supabase.co` — not `/rest/v1`. */
export function supabaseProjectUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

function isDuplicateConflict(status: number, body: string): boolean {
  if (status === 409) return true;
  try {
    return (JSON.parse(body) as { code?: string }).code === "23505";
  } catch {
    return body.includes("23505") || /duplicate key|unique constraint/i.test(body);
  }
}

export function createSupabaseWaitlistStore(rawUrl: string, serviceKey: string): WaitlistStore {
  const base = supabaseProjectUrl(rawUrl);
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    throw new WaitlistStoreError(
      "SUPABASE_URL must start with https:// (Project URL only, without /rest/v1).",
      "not_configured",
    );
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  async function post(path: string, body: unknown, extraHeaders: Record<string, string> = {}) {
    try {
      return await fetch(`${base}${path}`, {
        method: "POST",
        headers: { ...headers, ...extraHeaders },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // DNS failure, refused connection, timeout. Surfaced as a typed error so the route can
      // answer with JSON rather than letting the rejection escape as an empty 500.
      throw new WaitlistStoreError(
        "Could not reach the waitlist database. Check that SUPABASE_URL points at a reachable project.",
        "unreachable",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return {
    async claimFoundingMember(input) {
      const res = await post("/rest/v1/rpc/claim_founding_member", {
        p_email: input.email,
        p_source: input.source,
        p_referrer: input.referrer,
        p_user_agent: input.userAgent,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new WaitlistStoreError(mapPostgrestError(res.status, text), "rejected", text);
      }

      // The function RETURNS TABLE, so PostgREST gives back an array of one row.
      const rows = JSON.parse(text) as Array<{
        founding_member_number: number | null;
        created: boolean;
        status: string;
      }>;
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) {
        throw new WaitlistStoreError("claim_founding_member returned no row", "rejected", text);
      }
      return {
        foundingMemberNumber: row.founding_member_number ?? null,
        created: Boolean(row.created),
        status: row.status,
      };
    },

    async addSignup(input) {
      const res = await post(
        "/rest/v1/waitlist_signups",
        {
          email: input.email,
          source: input.source,
          referrer: input.referrer,
          user_agent: input.userAgent,
        },
        { Prefer: "return=minimal" },
      );

      if (res.ok) return { created: true };

      const text = await res.text();
      if (isDuplicateConflict(res.status, text)) return { created: false };
      throw new WaitlistStoreError(mapPostgrestError(res.status, text), "rejected", text);
    },
  };
}

/** Turns PostgREST's error codes into something a maintainer can act on. */
export function mapPostgrestError(status: number, body: string): string {
  let code = "";
  let message = "";
  try {
    const parsed = JSON.parse(body) as { code?: string; message?: string };
    code = parsed.code ?? "";
    message = parsed.message ?? "";
  } catch {
    /* non-JSON body */
  }

  if (code === "PGRST125" || (message.includes("Invalid path") && message.includes("request URL"))) {
    return "Invalid Supabase API URL. Set SUPABASE_URL to the project root only (e.g. https://YOUR_REF.supabase.co).";
  }
  if (code === "PGRST202" || message.includes("Could not find the function")) {
    return "Waitlist numbering is not set up yet. Apply the `founding_member_waitlist` migration to your Supabase project.";
  }
  if (
    code === "PGRST205" ||
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  ) {
    return "Waitlist storage is not set up yet. Apply the `waitlist_signups` migration to your Supabase project.";
  }
  if (status === 401 || status === 403) {
    return "Database authorization failed. Use SUPABASE_SERVICE_ROLE_KEY (not the anon key) on the server.";
  }
  return "Something went wrong. Please try again.";
}
