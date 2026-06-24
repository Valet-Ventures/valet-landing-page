import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist · Valet",
  description:
    "Be first in line for Valet — the modern homebase for collector-car ownership. Value intelligence, maintenance planning, and enthusiast community, all driven by your VIN.",
};

export default function WaitlistPage() {
  return (
    <div className="page">
      <header className="topbar">
        <Link href="/" className="mini-logo" aria-label="Valet home">
          <Image
            className="mini-logo-img"
            src="/branding/logo-v-main.svg"
            alt="Valet"
            width={147}
            height={110}
            unoptimized
          />
        </Link>
        <span className="topbar-meta">
          EST {"·"} 2026
        </span>
      </header>

      <main className="hero">
        <h1 className="wordmark">
          <Image
            className="wordmark-img wordmark-img--deck"
            src="/branding/logo-white-w-gold-w-line.svg"
            alt="Valet — Drive more, stress less"
            width={181}
            height={66}
            unoptimized
            priority
          />
        </h1>

        <div className="divider divider-after-logo" role="presentation" />

        <p className="blurb">
          The modern homebase for collector-car ownership. Value intelligence,
          maintenance planning, and enthusiast community, all driven by your VIN.
        </p>
        <p className="blurb">
          We&apos;re building something new for the collector community.
          Launching soon.
        </p>

        <div className="cta-stack">
          <Link className="btn btn-primary" href="/">
            Learn More
            <span className="arrow" aria-hidden={true}>
              &rsaquo;
            </span>
          </Link>
          <WaitlistForm />
        </div>
      </main>

      <footer className="foot">
        <div className="foot-brand">
          <div className="foot-logo" aria-hidden={true}>
            <Image
              className="foot-logo-img"
              src="/branding/logo-v-main.svg"
              alt=""
              width={147}
              height={110}
              unoptimized
            />
          </div>
          <span className="foot-copy">
            &copy; 2026 Valet Ventures Inc. All rights reserved.
          </span>
        </div>
        <div className="foot-links">
          <Link href="/privacy" className="foot-link-subtle">
            Privacy
          </Link>
          <span className="foot-links-sep" aria-hidden={true}>
            &middot;
          </span>
          <a href="mailto:johnny@valet.app">johnny@valet.app</a>
        </div>
      </footer>
    </div>
  );
}
