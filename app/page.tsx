import Image from "next/image";
import Link from "next/link";

import { WaitlistForm } from "@/components/WaitlistForm";

const GARAGE_FEATURES = [
  {
    title: "Real-time fair market value",
    body: "VIN-specific valuation that accounts for your exact year, trim, mileage, options, and condition — not a generic range.",
  },
  {
    title: "5-year forecast",
    body: "A forward-looking projection so you can make buy, hold, and sell decisions with data instead of forum speculation.",
  },
  {
    title: "Carrying-cost curve",
    body: "Aligns your maintenance spend against appreciation so you see the true return on ownership over time.",
  },
  {
    title: "Maintenance roadmap",
    body: "Upcoming service intervals, estimated costs, and scheduling — no more surprise five-figure belt services.",
  },
];

const COMMUNITY_FEATURES = [
  {
    title: "VIN-driven placement",
    body: "Add a car and instantly join communities specific to your marque, model, and region.",
  },
  {
    title: "Event-driven content",
    body: "Concours, rallies, Cars & Coffee — high-signal content organized around real-world gatherings.",
  },
  {
    title: "Event-photo tagging",
    body: "Upload photos, tag the event and the cars. Both owners stay connected through that moment.",
  },
  {
    title: "Local networking",
    body: "Build a real network of people you actually want to drive with — not anonymous forum handles.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add your VIN",
    body: "Enter your vehicle identification number and Valet builds a complete ownership profile for your exact car.",
  },
  {
    n: "02",
    title: "See the full picture",
    body: "Get a real-time valuation, a 5-year forecast, a maintenance roadmap, and a carrying-cost analysis in one place.",
  },
  {
    n: "03",
    title: "Find your community",
    body: "Get auto-placed into local communities for the marques and models you own, organized around real-world events.",
  },
];

export default function Home() {
  return (
    <div className="page lp">
      <header className="lp-topbar">
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
        <nav className="lp-nav" aria-label="Primary">
          <a href="#product" className="lp-nav-link">
            Product
          </a>
          <a href="#how" className="lp-nav-link">
            How it works
          </a>
          <Link href="/waitlist" className="lp-nav-cta">
            Join waitlist
          </Link>
        </nav>
      </header>

      <main className="lp-main">
        {/* ---------- Hero ---------- */}
        <section className="lp-hero">
          <Image
            className="wordmark-img wordmark-img--deck"
            src="/branding/logo-white-w-gold-w-line.svg"
            alt="Valet — Drive more, stress less"
            width={181}
            height={66}
            unoptimized
            priority
          />
          <p className="lp-eyebrow">The homebase for collector-car ownership</p>
          <h1 className="lp-hero-title">
            <span className="lp-hero-line">Know what your cars are worth.</span>
            <span className="lp-hero-line">Maintain them with confidence.</span>
            <span className="lp-hero-line">Connect with people who get it.</span>
          </h1>
          <p className="lp-hero-lede">
            Valet is the automotive community&apos;s first consumer platform that
            both enables and enhances our favorite parts of the lifestyle —
            collecting cars and connecting with our community. Portfolio
            intelligence meets concierge ownership meets social network, all
            unified by your VIN.
          </p>
          <div className="lp-hero-cta">
            <Link className="btn btn-primary" href="/waitlist">
              Join the waitlist
              <span className="arrow" aria-hidden={true}>
                &rsaquo;
              </span>
            </Link>
            <a className="lp-btn-ghost" href="#product">
              See what&apos;s inside
            </a>
          </div>
        </section>

        {/* ---------- Problem ---------- */}
        <section className="lp-section lp-problem" aria-labelledby="problem-h">
          <div className="lp-section-head">
            <span className="lp-tag">The problem</span>
            <h2 id="problem-h" className="lp-h2">
              The real stress of owning a collector car isn&apos;t writing the
              check — it&apos;s everything that comes after.
            </h2>
            <p className="lp-section-sub">
              Every owner navigates the same questions: What is my car actually
              worth? Where is that value heading? What maintenance is coming, and
              will it protect the car&apos;s value? Am I net positive after years
              of carrying costs? The tools serving enthusiasts haven&apos;t
              evolved in 15 years.
            </p>
          </div>
          <div className="lp-grid lp-grid-2">
            <div className="lp-card">
              <h3 className="lp-card-title">Valuations without context</h3>
              <p className="lp-card-body">
                Directional numbers that shift weekly and don&apos;t account for
                your specific car — and never tell you where the value is heading.
              </p>
            </div>
            <div className="lp-card">
              <h3 className="lp-card-title">Maintenance as a black box</h3>
              <p className="lp-card-body">
                No forward-looking roadmap of what&apos;s due, when, and what it
                costs — and no tool connecting that spend to value impact.
              </p>
            </div>
            <div className="lp-card">
              <h3 className="lp-card-title">No picture of true return</h3>
              <p className="lp-card-body">
                Insurance, storage, fuel, detailing, service — nothing aggregates
                carrying costs against appreciation to show the real net return.
              </p>
            </div>
            <div className="lp-card">
              <h3 className="lp-card-title">A fragmented community</h3>
              <p className="lp-card-body">
                You meet someone with an incredible build at a show, talk for an
                hour — and leave with no way to reconnect through the cars you
                share.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Product ---------- */}
        <section id="product" className="lp-section" aria-labelledby="product-h">
          <div className="lp-section-head">
            <span className="lp-tag">The product</span>
            <h2 id="product-h" className="lp-h2">
              Two halves of ownership, finally in one place.
            </h2>
            <p className="lp-section-sub">
              Valet brings together the financial side of owning a collector car
              and the social side of enjoying it — connected by the one thing
              unique to every vehicle: its VIN.
            </p>
          </div>

          <div className="lp-grid lp-grid-2 lp-products">
            <article className="lp-product">
              <div className="lp-product-head">
                <span className="lp-product-kicker">Garage</span>
                <span className="lp-product-pill">Free</span>
              </div>
              <p className="lp-product-lede">
                The moment you add a VIN, Valet generates a complete financial
                ownership profile — reframing your car as an asset with a
                measurable return curve, not a hobby expense bucket.
              </p>
              <ul className="lp-feature-list">
                {GARAGE_FEATURES.map((f) => (
                  <li key={f.title} className="lp-feature">
                    <span className="lp-feature-title">{f.title}</span>
                    <span className="lp-feature-body">{f.body}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="lp-product">
              <div className="lp-product-head">
                <span className="lp-product-kicker">Communities</span>
                <span className="lp-product-pill lp-product-pill--alt">
                  From $2/mo
                </span>
              </div>
              <p className="lp-product-lede">
                Your VIN auto-places you into niche, local communities for the
                marques and models you own — organized around events and
                real-world connections, not forum threads.
              </p>
              <ul className="lp-feature-list">
                {COMMUNITY_FEATURES.map((f) => (
                  <li key={f.title} className="lp-feature">
                    <span className="lp-feature-title">{f.title}</span>
                    <span className="lp-feature-body">{f.body}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className="lp-section" aria-labelledby="how-h">
          <div className="lp-section-head">
            <span className="lp-tag">How it works</span>
            <h2 id="how-h" className="lp-h2">
              From one number to your whole world of cars.
            </h2>
          </div>
          <div className="lp-grid lp-grid-3">
            {STEPS.map((s) => (
              <div key={s.n} className="lp-step">
                <span className="lp-step-n">{s.n}</span>
                <h3 className="lp-card-title">{s.title}</h3>
                <p className="lp-card-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Who it's for ---------- */}
        <section className="lp-section lp-who" aria-labelledby="who-h">
          <div className="lp-section-head">
            <span className="lp-tag">Who it&apos;s for</span>
            <h2 id="who-h" className="lp-h2">
              Built for a generation of enthusiasts who care about the value of
              their cars and the culture around them.
            </h2>
            <p className="lp-section-sub">
              Collector cars have outpaced both the S&amp;P 500 and US real
              estate over the last 15 years, and a new wave of millennial and
              Gen-Z enthusiasts is buying, driving, and obsessing over the cars
              they grew up dreaming about. Valet is the modern homebase built for
              them — whether you own one car or ten.
            </p>
          </div>
        </section>

        {/* ---------- Mission / founder ---------- */}
        <section className="lp-section lp-mission" aria-labelledby="mission-h">
          <span className="lp-tag">Why we&apos;re building Valet</span>
          <blockquote className="lp-quote">
            “The ownership experience should be something we enjoy, not something
            we stress about. Across the collector-car culture I&apos;ve become
            close to, we&apos;re all consumed by the same priorities —
            understanding what our cars are worth, keeping up with maintenance,
            and finding the right people to drive with. That&apos;s the problem
            worth solving.”
          </blockquote>
          <p id="mission-h" className="lp-quote-attr">
            Johnny — Founder &amp; CEO, Valet
          </p>
        </section>

        {/* ---------- Waitlist CTA ---------- */}
        <section className="lp-section lp-cta-section" aria-labelledby="cta-h">
          <h2 id="cta-h" className="lp-h2 lp-cta-title">
            Drive more, stress less.
          </h2>
          <p className="lp-section-sub lp-cta-sub">
            We&apos;re building something new for the collector community.
            Join the waitlist to be first in line when Valet launches.
          </p>
          <div className="lp-cta-form">
            <WaitlistForm />
          </div>
        </section>
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
          <Link href="/waitlist" className="foot-link-subtle">
            Waitlist
          </Link>
          <span className="foot-links-sep" aria-hidden={true}>
            &middot;
          </span>
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
