import test from "node:test";
import assert from "node:assert/strict";

import {
  APP_STORE_URL,
  FOUNDING_MEMBER_SUBJECT,
  WEB_APP_SIGNUP_URL,
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
  assert.match(html, /WELCOME TO<br>VALET\./);
  assert.match(html, /Your garage is ready\./);
  assert.ok(!/waitlist|early access/i.test(html.replace(/mailto:[^"]+/g, "")), "signup is no longer a waitlist");

  // The number gets its own oversized treatment, not just a mention in a sentence.
  assert.match(html, /class="member-number"[^>]*font-size:76px/);
});

test("html renders whatever number it is given", () => {
  for (const n of [51, 52, 137, 1042]) {
    assert.match(buildFoundingMemberEmailHtml(n), new RegExp(`#${n}\\b`));
    assert.match(buildFoundingMemberEmailText(n), new RegExp(`Founding Member #${n}\\.`));
  }
});

test("html links to the web app, the App Store and unsubscribe, and nothing else", () => {
  const html = buildFoundingMemberEmailHtml(51);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(hrefs.slice(0, 2), [WEB_APP_SIGNUP_URL, APP_STORE_URL]);
  assert.equal(hrefs.length, 3, `unexpected links: ${JSON.stringify(hrefs)}`);
  assert.match(hrefs[2], /^mailto:.*Unsubscribe/);
});

test("html shows the App Store QR code as a hosted image with alt text", () => {
  const html = buildFoundingMemberEmailHtml(51);
  assert.match(html, /<img[^>]*src="https:\/\/valet\.app\/app\/valet-app-qr\.png"[^>]*alt="QR code for Valet on the App Store"/);
  assert.ok(!/src="data:/.test(html), "email clients block data URIs");
});

test("text version carries both links", () => {
  const text = buildFoundingMemberEmailText(51);
  assert.ok(text.includes(WEB_APP_SIGNUP_URL));
  assert.ok(text.includes(APP_STORE_URL));
});

test("html promises no date", () => {
  const html = buildFoundingMemberEmailHtml(51).toLowerCase();
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
  assert.match(text, /Your garage is ready\./);
  assert.match(text, /help shape what comes next\./);
  assert.ok(!/waitlist|early access/i.test(text.replace(/Unsubscribe.*$/im, "")), "signup is no longer a waitlist");
});

test("rejects a number that is missing or nonsensical", () => {
  for (const bad of [0, -1, 1.5, NaN]) {
    assert.throws(() => buildFoundingMemberEmailHtml(bad as number), /positive integer/);
    assert.throws(() => buildFoundingMemberEmailText(bad as number), /positive integer/);
  }
});
