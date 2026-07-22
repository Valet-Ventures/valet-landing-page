import type { Metadata } from "next";
import Link from "next/link";

import { DeckVMarkImg } from "@/components/deck/deckBranding";

export const metadata: Metadata = {
  title: "Support · Valet",
  description: "Get help with Valet — contact us and find answers to common questions.",
};

export default function SupportPage() {
  return (
    <div className="page privacy-page">
      <header className="privacy-deck-topbar">
        <Link href="/" className="privacy-deck-v-link" aria-label="Valet home">
          <DeckVMarkImg height={24} />
        </Link>
        <span className="privacy-deck-topbar-meta">HELP · SUPPORT</span>
      </header>

      <main className="privacy-main">
        <h1 className="privacy-h1-deck">Support</h1>
        <p className="privacy-meta-line">Valet · We&apos;re here to help</p>

        <section className="privacy-section" aria-labelledby="support-contact">
          <h2 id="support-contact" className="privacy-h2">
            Contact us
          </h2>
          <p>
            Questions about your garage, valuations, community, or account? Email{" "}
            <a href="mailto:jens@valet.app">jens@valet.app</a> and we&apos;ll get back to you as soon as we
            can — usually within a couple of business days.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="support-vehicle">
          <h2 id="support-vehicle" className="privacy-h2">
            Adding a vehicle
          </h2>
          <p>
            Open your Garage and tap Add Vehicle. Enter or scan your VIN with the camera to auto-fill the
            make, model, trim, and year, or add the details manually.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="support-valuations">
          <h2 id="support-valuations" className="privacy-h2">
            Valuations
          </h2>
          <p>
            Valet estimates each vehicle&apos;s value from comparable market listings and sales data.
            Values are estimates for personal tracking and are not formal appraisals.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="support-delete">
          <h2 id="support-delete" className="privacy-h2">
            Deleting your account
          </h2>
          <p>
            In the app, go to Profile → Edit Profile → Delete account. This permanently removes your
            account and all associated data (garage, posts, comments, and uploaded photos) and cannot be
            undone.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="support-block">
          <h2 id="support-block" className="privacy-h2">
            Blocking someone
          </h2>
          <p>
            Tap the block icon on any post or comment to block that user — you&apos;ll no longer see each
            other&apos;s posts, comments, or profiles. Manage or undo blocks under Profile → Edit Profile →
            Blocked accounts. You can also report content for review.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="support-privacy">
          <h2 id="support-privacy" className="privacy-h2">
            Privacy
          </h2>
          <p>
            See our <Link href="/privacy">Privacy Policy</Link> for what we collect and how it&apos;s used.
          </p>
        </section>
      </main>

      <footer className="foot privacy-foot privacy-foot-deck">
        <div className="foot-brand privacy-foot-deck-brand">
          <Link href="/" className="privacy-foot-deck-v-link" aria-label="Valet home">
            <DeckVMarkImg height={18} />
          </Link>
          <span className="privacy-foot-deck-meta">
            &copy; 2026 Valet Ventures Inc. All rights reserved. · Support
          </span>
        </div>
      </footer>
    </div>
  );
}
