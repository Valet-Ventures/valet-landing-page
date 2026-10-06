import test from "node:test";
import assert from "node:assert/strict";

import {
  FOUNDING_MEMBER_SUBJECT,
  buildFoundingMemberEmailHtml,
  buildFoundingMemberEmailText,
} from "../lib/waitlist/foundingMemberEmail";

test("subject matches the agreed line", () => {
  assert.equal(FOUNDING_MEMBER_SUBJECT, "Welcome to Valet: You're a Founding Member");
});

test("html shows the number prominently and carries the required copy", () => {
  const html = buildFoundingMemberEmailHtml(51);

  assert.match(html, /#51/);
  assert.match(html, /You're officially Founding Member #51\./);
  assert.match(html, /YOU'RE ON THE<br>VALET WAITLIST\./);
  assert.match(html, /We'll let you know when early access is ready\./);
  assert.match(html, /Founding Members will be among the first to experience Valet and help shape what comes next\./);

  // The number gets its own oversized treatment, not just a mention in a sentence.
  assert.match(html, /class="member-number"[^>]*font-size:76px/);
});

test("html renders whatever number it is given", () => {
  for (const n of [51, 52, 137, 1042]) {
    assert.match(buildFoundingMemberEmailHtml(n), new RegExp(`#${n}\\b`));
    assert.match(buildFoundingMemberEmailText(n), new RegExp(`Founding Member #${n}\\.`));
  }
});

test("html is CTA-free: the only link is unsubscribe", () => {
  const html = buildFoundingMemberEmailHtml(51);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  assert.equal(hrefs.length, 1, `expected only an unsubscribe link, got ${JSON.stringify(hrefs)}`);
  assert.match(hrefs[0], /^mailto:.*Unsubscribe/);
});

test("html promises no date and no immediate access", () => {
  const html = buildFoundingMemberEmailHtml(51).toLowerCase();

  for (const forbidden of ["log in", "login", "sign in", "get started", "download the app", "launches on", "available now", "your account is ready"]) {
    assert.ok(!html.includes(forbidden), `must not promise: ${forbidden}`);
  }
  assert.ok(!/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/.test(html));
});

test("html is email-client safe: table layout, inline styles, no SVG or script", () => {
  const html = buildFoundingMemberEmailHtml(51);

  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<table/, "layout must be table-based");
  assert.ok(!/<svg/i.test(html), "Gmail and Outlook strip SVG");
  assert.ok(!/<script/i.test(html), "scripts are stripped and look like spam");
  assert.match(html, /@media only screen and \(max-width:620px\)/, "needs a mobile breakpoint");
  assert.match(html, /<img[^>]*alt="Valet"/, "logo needs alt text for image-blocking clients");
  assert.match(html, /mso-hide:all/, "needs a hidden preheader");
});

test("text fallback is plain, complete, and has no markup", () => {
  const text = buildFoundingMemberEmailText(51);

  assert.ok(!/<[a-z][^>]*>/i.test(text), "plain-text part must contain no markup");
  assert.match(text, /You're officially Founding Member #51\./);
  assert.match(text, /You're on the Valet waitlist\./);
  assert.match(text, /We'll let you know when early access is ready\./);
  assert.match(text, /help shape\nwhat comes next\./);
});

test("rejects a number that is missing or nonsensical", () => {
  for (const bad of [0, -1, 1.5, NaN]) {
    assert.throws(() => buildFoundingMemberEmailHtml(bad as number), /positive integer/);
    assert.throws(() => buildFoundingMemberEmailText(bad as number), /positive integer/);
  }
});
