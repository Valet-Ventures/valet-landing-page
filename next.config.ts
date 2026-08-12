import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Recharts (and `recharts-scale`) are CommonJS-heavy; transpiling avoids intermittent runtime
   * `__webpack_modules__[id] is not a function` during client chunk init.
   */
  transpilePackages: ["recharts", "recharts-scale"],

  /**
   * Avoid intermittent production build failures (e.g. MODULE_NOT_FOUND for
   * `.next/server/chunks/611.js` while loading `pages/_document`) on some
   * machines where the default webpack build worker races chunk emission.
   */
  experimental: {
    webpackBuildWorker: false,
    staticGenerationMaxConcurrency: 1,
  },

  /**
   * `/` serves the hand-built landing page from `public/valet-landing.html`. It is a single
   * self-contained file (bespoke CSS + imperative demo animations) and fully responsive, so
   * it is served as-is rather than ported to JSX. The filename is deliberately unversioned:
   * new drops land in `docs/` version-stamped, then get copied over this, so no config change
   * is needed each time. `beforeFiles` runs ahead of filesystem routing, so this wins even if
   * an `app/page.tsx` is reintroduced later. The previous React landing page lives at `/v1`.
   */
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/valet-landing.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
