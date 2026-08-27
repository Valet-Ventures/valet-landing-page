/**
 * Exercises the real `claim_founding_member` function, which the unit tests can only model.
 *
 * Opt-in: set WAITLIST_INTEGRATION=1 alongside SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * It writes to whichever project those point at, so it restores the counter and deletes its
 * own rows in a finally block. Without that restore it would permanently consume real
 * founding member numbers.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { createSupabaseWaitlistStore, supabaseProjectUrl } from "../../lib/waitlist/store";

const URL_RAW = process.env.SUPABASE_URL?.trim();
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const ENABLED = process.env.WAITLIST_INTEGRATION === "1" && Boolean(URL_RAW && KEY);

const skip = ENABLED
  ? false
  : "set WAITLIST_INTEGRATION=1 with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run";

const BASE = URL_RAW ? supabaseProjectUrl(URL_RAW) : "";
const headers = {
  apikey: KEY ?? "",
  Authorization: `Bearer ${KEY ?? ""}`,
  "Content-Type": "application/json",
};

const TAG = "claude-integration";
const addr = (n: number) => `${TAG}-${n}@valet-test.invalid`;

async function readCounter(): Promise<number> {
  const res = await fetch(`${BASE}/rest/v1/founding_member_counter?select=last_number&id=eq.1`, { headers });
  const rows = (await res.json()) as Array<{ last_number: number }>;
  return rows[0].last_number;
}

async function restore(counter: number) {
  await fetch(`${BASE}/rest/v1/waitlist_signups?email=like.${TAG}-*`, { method: "DELETE", headers });
  await fetch(`${BASE}/rest/v1/founding_member_counter?id=eq.1`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ last_number: counter }),
  });
}

test("claim_founding_member assigns sequential numbers and never renumbers a duplicate", { skip }, async () => {
  const store = createSupabaseWaitlistStore(URL_RAW!, KEY!);
  const before = await readCounter();

  try {
    const first = await store.claimFoundingMember({ email: addr(1), source: "founding-member", referrer: null, userAgent: null });
    const second = await store.claimFoundingMember({ email: addr(2), source: "founding-member", referrer: null, userAgent: null });

    assert.equal(first.created, true);
    assert.equal(first.foundingMemberNumber, before + 1);
    assert.equal(first.status, "waitlisted");
    assert.equal(second.foundingMemberNumber, before + 2);

    const repeat = await store.claimFoundingMember({ email: addr(1), source: "founding-member", referrer: null, userAgent: null });
    assert.equal(repeat.created, false);
    assert.equal(repeat.foundingMemberNumber, first.foundingMemberNumber);
    assert.equal(await readCounter(), before + 2, "a duplicate must not advance the counter");
  } finally {
    await restore(before);
  }
});

test("claim_founding_member holds up under concurrent submissions", { skip }, async () => {
  const store = createSupabaseWaitlistStore(URL_RAW!, KEY!);
  const before = await readCounter();

  try {
    const N = 12;
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        store.claimFoundingMember({ email: addr(100 + i), source: "founding-member", referrer: null, userAgent: null }),
      ),
    );

    const numbers = results.map((r) => r.foundingMemberNumber as number);
    assert.equal(new Set(numbers).size, N, "concurrent claims produced a duplicate number");
    assert.deepEqual(
      [...numbers].sort((a, b) => a - b),
      Array.from({ length: N }, (_, i) => before + 1 + i),
      "numbers must be contiguous with no gaps",
    );
  } finally {
    await restore(before);
  }
});

test("the same email submitted concurrently yields exactly one record", { skip }, async () => {
  const store = createSupabaseWaitlistStore(URL_RAW!, KEY!);
  const before = await readCounter();

  try {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        store.claimFoundingMember({ email: addr(200), source: "founding-member", referrer: null, userAgent: null }),
      ),
    );

    assert.equal(results.filter((r) => r.created).length, 1, "exactly one claim may create the row");
    const numbers = new Set(results.map((r) => r.foundingMemberNumber));
    assert.equal(numbers.size, 1, "all callers must see the same number");
    assert.equal(await readCounter(), before + 1, "only one number may be consumed");
  } finally {
    await restore(before);
  }
});
