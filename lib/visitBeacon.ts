/**
 * Visit counting for valet.app: one anonymous page view per page load and route change, posted
 * to the Valet server (POST https://platform.valet.app/api/visit, which decides what is kept).
 *
 * No cookies, nothing stored in the browser, no IP or user agent sent by us (the server reads
 * the user agent only to tell phone, tablet and desktop apart, and keeps a daily-rotating hash
 * for unique visitors). Never from localhost, a Netlify preview, or the pitch pages.
 *
 * The same rules are inlined in public/valet-landing.html, which can't import this file; keep
 * the two in step.
 */

export const VISIT_ENDPOINT = "https://platform.valet.app/api/visit";

/** The hosts whose visits count. Netlify previews and localhost don't. */
export const COUNTED_HOSTS = ["valet.app", "www.valet.app"];

/** Not the public site: investor pages behind their own gates. */
const SKIPPED_PATHS = ["/deck", "/presenter"];

export type VisitPayload = {
  site: "website";
  path: string;
  code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_host?: string;
};

export function isCountedLocation({ hostname, protocol }: { hostname: string; protocol: string }): boolean {
  return protocol === "https:" && COUNTED_HOSTS.includes(String(hostname || "").toLowerCase());
}

export function isCountedPath(pathname: string): boolean {
  return !SKIPPED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** The referrer's host, or nothing when there is none or it is valet.app itself. */
export function referrerHost(referrer: string, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host || host === ownHost.toLowerCase() || COUNTED_HOSTS.includes(host)) return null;
    return host;
  } catch {
    return null;
  }
}

/** Path, sign-up code, utm tags and (first page only) the referrer's host. Nothing else. */
export function visitPayload({
  pathname,
  search,
  referrer,
  ownHost,
  includeReferrer,
}: {
  pathname: string;
  search: string;
  referrer: string;
  ownHost: string;
  includeReferrer: boolean;
}): VisitPayload {
  const params = new URLSearchParams(search || "");
  const payload: VisitPayload = { site: "website", path: pathname || "/" };
  const code = params.get("code");
  if (code) payload.code = code.slice(0, 40);
  for (const k of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const v = params.get(k);
    if (v) payload[k] = v.slice(0, 100);
  }
  const host = includeReferrer ? referrerHost(referrer, ownHost) : null;
  if (host) payload.referrer_host = host;
  return payload;
}

type FetchLike = (url: string, init: RequestInit) => Promise<unknown>;

/** Fire and forget: never awaited, never throws, no cookies, no preflight (text/plain). */
export function sendVisit(payload: VisitPayload, fetchImpl: FetchLike | null = typeof fetch === "function" ? fetch : null): void {
  if (!fetchImpl) return;
  try {
    const p = fetchImpl(VISIT_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" },
      keepalive: true,
      credentials: "omit",
      mode: "no-cors",
    });
    if (p && typeof (p as Promise<unknown>).catch === "function") (p as Promise<unknown>).catch(() => {});
  } catch {
    /* a visit count is never worth an error */
  }
}
