import test from "node:test";
import assert from "node:assert/strict";

import { handleSignup } from "../lib/waitlist/handleSignup";
import { WaitlistStoreError } from "../lib/waitlist/store";
import { FOUNDING_MEMBER_SUBJECT } from "../lib/waitlist/foundingMemberEmail";
import type { OutgoingEmail } from "../lib/waitlist/mailer";
import { createFakeStore, createRecordingMailer } from "./helpers/fakes";

const founding = (email: string) => ({ email, source: "founding-member" });

test("numbering: public numbering starts at 50 so the first signup is #51", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const first = await handleSignup(founding("a@example.com"), { store, mailer });

  assert.equal(first.status, 200);
  assert.equal(first.body.created, true);
  assert.equal(first.body.foundingMemberNumber, 51);
});

test("numbering: each new unique signup increments by one", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const numbers: Array<number | null | undefined> = [];
  for (const email of ["a@example.com", "b@example.com", "c@example.com"]) {
    const res = await handleSignup(founding(email), { store, mailer });
    numbers.push(res.body.foundingMemberNumber);
  }

  assert.deepEqual(numbers, [51, 52, 53]);
});

test("duplicates: a repeat email returns the same number and consumes none", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const first = await handleSignup(founding("dup@example.com"), { store, mailer });
  const again = await handleSignup(founding("dup@example.com"), { store, mailer });
  const next = await handleSignup(founding("fresh@example.com"), { store, mailer });

  assert.equal(first.body.foundingMemberNumber, 51);
  assert.equal(again.body.created, false);
  assert.equal(again.body.alreadyRegistered, true);
  assert.equal(again.body.foundingMemberNumber, 51, "duplicate must not be renumbered");
  assert.equal(next.body.foundingMemberNumber, 52, "duplicate must not have burned #52");
  assert.equal(store.rows.size, 2);
});

test("duplicates: matching is case- and whitespace-insensitive", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const first = await handleSignup(founding("Person@Example.COM"), { store, mailer });
  const again = await handleSignup(founding("  person@example.com  "), { store, mailer });

  assert.equal(first.body.foundingMemberNumber, 51);
  assert.equal(again.body.created, false);
  assert.equal(again.body.foundingMemberNumber, 51);
  assert.equal(mailer.sent.length, 1);
});

test("concurrency: parallel signups get unique, gapless numbers", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const emails = Array.from({ length: 25 }, (_, i) => `user${i}@example.com`);
  const results = await Promise.all(emails.map((e) => handleSignup(founding(e), { store, mailer })));

  const numbers = results.map((r) => r.body.foundingMemberNumber as number);
  assert.equal(new Set(numbers).size, 25, "every number must be unique");
  assert.deepEqual([...numbers].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => 51 + i));
});

test("concurrency: the same email submitted in parallel yields one record and one email", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const results = await Promise.all(
    Array.from({ length: 8 }, () => handleSignup(founding("race@example.com"), { store, mailer })),
  );

  const created = results.filter((r) => r.body.created);
  assert.equal(created.length, 1, "exactly one submission may create the record");
  assert.equal(mailer.sent.length, 1, "exactly one confirmation email");
  assert.equal(store.rows.size, 1);
  for (const r of results) assert.equal(r.body.foundingMemberNumber, 51);
});

test("email: sent only for a new signup, addressed correctly with both parts", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  await handleSignup(founding("new@example.com"), { store, mailer });

  assert.equal(mailer.sent.length, 1);
  const [sent] = mailer.sent;
  assert.equal(sent.to, "new@example.com");
  assert.equal(sent.subject, FOUNDING_MEMBER_SUBJECT);
  assert.match(sent.html, /#51/);
  assert.match(sent.text, /Founding Member #51/);
});

test("email: not sent again for a duplicate", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  await handleSignup(founding("once@example.com"), { store, mailer });
  await handleSignup(founding("once@example.com"), { store, mailer });

  assert.equal(mailer.sent.length, 1);
});

test("email: not sent for non founding-member sources", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const res = await handleSignup({ email: "partner@example.com", source: "equity-partner" }, { store, mailer });

  assert.equal(res.body.ok, true);
  assert.equal(res.body.created, true);
  assert.equal(mailer.sent.length, 0);
  assert.equal(store.claimCalls, 0, "non-founding sources must not consume a number");
});

test("email: a send failure still reports the signup, flagged emailSent:false", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer(new Error("provider down"));
  const errors: string[] = [];

  const res = await handleSignup(founding("fail@example.com"), {
    store,
    mailer,
    onError: (ctx) => errors.push(ctx),
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.created, true);
  assert.equal(res.body.foundingMemberNumber, 51);
  assert.equal(res.body.emailSent, false, "must not claim an email was sent");
  assert.equal(errors.length, 1);
});

test("email: absent mailer does not block signup", async () => {
  const store = createFakeStore();

  const res = await handleSignup(founding("nomailer@example.com"), { store });

  assert.equal(res.body.created, true);
  assert.equal(res.body.emailSent, false);
});

test("pre-migration rows report as already registered with a null number", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();
  store.seedUnnumbered("early@example.com");

  const res = await handleSignup(founding("early@example.com"), { store, mailer });

  assert.equal(res.body.alreadyRegistered, true);
  assert.equal(res.body.foundingMemberNumber, null);
  assert.equal(mailer.sent.length, 0);
});

test("validation: malformed addresses are rejected before any write", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  for (const bad of ["", "   ", "nope", "no-at-sign.com", "a@b", "a@.com", "a@b..com", "two words@x.com", "@x.com"]) {
    const res = await handleSignup({ email: bad, source: "founding-member" }, { store, mailer });
    assert.equal(res.status, 422, `expected 422 for ${JSON.stringify(bad)}`);
    assert.equal(res.body.error, "Enter a valid email address");
  }
  assert.equal(store.rows.size, 0);
  assert.equal(mailer.sent.length, 0);
});

test("honeypot: a filled hidden field looks like success but writes nothing", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  const res = await handleSignup(
    { email: "bot@example.com", source: "founding-member", website: "http://spam" },
    { store, mailer },
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(store.rows.size, 0);
  assert.equal(mailer.sent.length, 0);
});

test("errors: an unreachable database answers 502 with JSON, not an empty 500", async () => {
  const store = createFakeStore();
  store.claimFoundingMember = async () => {
    throw new WaitlistStoreError("Could not reach the waitlist database.", "unreachable");
  };

  const res = await handleSignup(founding("x@example.com"), { store });

  assert.equal(res.status, 502);
  assert.equal(res.body.ok, false);
  assert.match(String(res.body.error), /Could not reach/);
});

test("errors: a missing migration surfaces an actionable message", async () => {
  const store = createFakeStore();
  store.claimFoundingMember = async () => {
    throw new WaitlistStoreError(
      "Waitlist numbering is not set up yet. Apply the `founding_member_waitlist` migration to your Supabase project.",
      "rejected",
    );
  };

  const res = await handleSignup(founding("x@example.com"), { store });

  assert.equal(res.status, 500);
  assert.match(String(res.body.error), /founding_member_waitlist/);
});

const ALERT_TO = ["jens@valet.app", "johnny@valet.app"];
const alertsIn = (mailer: { sent: OutgoingEmail[] }) =>
  mailer.sent.filter((m) => Array.isArray(m.to) && m.to.join() === ALERT_TO.join());

test("alerts: a new Founding Member alerts the founders, with reply-to set to the member", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  await handleSignup(founding("new@example.com"), { store, mailer, alertTo: ALERT_TO });

  const alerts = alertsIn(mailer);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].subject, /Founding Member #51/);
  assert.equal(alerts[0].replyTo, "new@example.com");
  assert.equal(mailer.sent.length, 2, "welcome email plus one alert");
});

test("alerts: a repeat Founding Member signup alerts no one", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  await handleSignup(founding("dup@example.com"), { store, mailer, alertTo: ALERT_TO });
  await handleSignup(founding("dup@example.com"), { store, mailer, alertTo: ALERT_TO });

  assert.equal(alertsIn(mailer).length, 1);
});

test("alerts: every partnership request alerts, even from an address already on the list", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();
  const partner = (email: string) => ({ email, source: "equity-partner" });

  await handleSignup(founding("member@example.com"), { store, mailer, alertTo: ALERT_TO });
  const repeat = await handleSignup(partner("member@example.com"), { store, mailer, alertTo: ALERT_TO });
  const fresh = await handleSignup(partner("investor@example.com"), { store, mailer, alertTo: ALERT_TO });

  assert.equal(repeat.status, 200);
  assert.equal(repeat.body.alreadyRegistered, true);
  assert.equal(fresh.body.created, true);
  const partnerAlerts = alertsIn(mailer).filter((m) => /partnership request/.test(m.subject));
  assert.equal(partnerAlerts.length, 2, "the repeat request must not vanish");
  assert.match(partnerAlerts[0].text, /already on the list/);
});

test("alerts: no recipients configured sends no alerts", async () => {
  const store = createFakeStore();
  const mailer = createRecordingMailer();

  await handleSignup({ email: "x@example.com", source: "equity-partner" }, { store, mailer });

  assert.equal(mailer.sent.length, 0);
});

test("alerts: a failed alert still reports the signup as a success", async () => {
  const store = createFakeStore();
  const errors: string[] = [];
  const mailer = createRecordingMailer(new Error("provider down"));

  const res = await handleSignup(
    { email: "y@example.com", source: "equity-partner" },
    { store, mailer, alertTo: ALERT_TO, onError: (ctx) => errors.push(ctx) },
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.deepEqual(errors, ["signup alert send"]);
});
