import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isCountedLocation, isCountedPath, referrerHost, sendVisit, visitPayload, VISIT_ENDPOINT } from "../lib/visitBeacon";

test("only valet.app and www.valet.app over https send", () => {
  assert.equal(isCountedLocation({ hostname: "valet.app", protocol: "https:" }), true);
  assert.equal(isCountedLocation({ hostname: "www.valet.app", protocol: "https:" }), true);
  assert.equal(isCountedLocation({ hostname: "localhost", protocol: "http:" }), false);
  assert.equal(isCountedLocation({ hostname: "127.0.0.1", protocol: "http:" }), false);
  assert.equal(isCountedLocation({ hostname: "deploy-preview-12--valet.netlify.app", protocol: "https:" }), false);
  assert.equal(isCountedLocation({ hostname: "valet.app", protocol: "http:" }), false);
});

test("the pitch pages are not counted", () => {
  assert.equal(isCountedPath("/"), true);
  assert.equal(isCountedPath("/privacy"), true);
  assert.equal(isCountedPath("/deck"), false);
  assert.equal(isCountedPath("/deck/techstars"), false);
  assert.equal(isCountedPath("/presenter"), false);
});

test("the referrer is a host only, and never valet.app itself", () => {
  assert.equal(referrerHost("https://www.lotustalk.com/threads/valet.1/?p=2", "valet.app"), "www.lotustalk.com");
  assert.equal(referrerHost("https://valet.app/privacy", "valet.app"), null);
  assert.equal(referrerHost("https://www.valet.app/", "valet.app"), null);
  assert.equal(referrerHost("", "valet.app"), null);
  assert.equal(referrerHost("nonsense", "valet.app"), null);
});

test("the payload has the path, code and utm tags, and nothing else from the URL", () => {
  assert.deepEqual(
    visitPayload({
      pathname: "/",
      search: "?code=LOTUSTALK&utm_source=lotustalk&fbclid=abc&email=a@b.com",
      referrer: "https://www.lotustalk.com/threads/1",
      ownHost: "valet.app",
      includeReferrer: true,
    }),
    { site: "website", path: "/", code: "LOTUSTALK", utm_source: "lotustalk", referrer_host: "www.lotustalk.com" }
  );
  assert.deepEqual(
    visitPayload({ pathname: "/privacy", search: "", referrer: "https://www.lotustalk.com/", ownHost: "valet.app", includeReferrer: false }),
    { site: "website", path: "/privacy" }
  );
});

test("sending never throws, sends no cookies and needs no preflight", () => {
  const calls: { url: string; init: RequestInit }[] = [];
  sendVisit({ site: "website", path: "/" }, (url, init) => {
    calls.push({ url, init });
    return Promise.reject(new Error("offline"));
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, VISIT_ENDPOINT);
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.mode, "no-cors");
  assert.equal((calls[0].init.headers as Record<string, string>)["Content-Type"], "text/plain");
  assert.doesNotThrow(() => sendVisit({ site: "website", path: "/" }, () => { throw new Error("boom"); }));
  assert.doesNotThrow(() => sendVisit({ site: "website", path: "/" }, null));
});

test("the landing page's inline beacon keeps the same rules", () => {
  const html = readFileSync(new URL("../public/valet-landing.html", import.meta.url), "utf8");
  assert.match(html, /https:\/\/platform\.valet\.app\/api\/visit/);
  assert.match(html, /h!=='valet\.app'&&h!=='www\.valet\.app'/, "only counted on valet.app");
  assert.match(html, /credentials:'omit'/);
  assert.doesNotMatch(html, /document\.cookie|localStorage\.setItem\('valet/);
});
