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
   * `/` serves the hand-built v53 landing page from `public/valet-landing-v53.html`.
   * It is a single self-contained file (bespoke CSS + imperative demo animations), so it is
   * served as-is rather than ported to JSX. `beforeFiles` runs ahead of filesystem routing,
   * so this wins even if an `app/page.tsx` is reintroduced later. The previous React landing
   * page still lives at `/v1`.
   */
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/valet-landing-v53.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
