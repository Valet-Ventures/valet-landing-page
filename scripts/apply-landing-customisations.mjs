#!/usr/bin/env node
/**
 * Rebuilds the served landing page from a pristine design drop.
 *
 * Design hands over version-stamped HTML in `docs/`, built from their own source, so every
 * customisation we add gets wiped by each new drop. This script re-applies them all in one
 * pass. Every substitution asserts it matched exactly once, so a drop that renames or
 * restructures something fails loudly here rather than silently shipping a page that lost
 * the waitlist wiring or the branding.
 *
 *   node scripts/apply-landing-customisations.mjs docs/valet_mobile_v7.html public/valet-landing.html
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("usage: apply-landing-customisations.mjs <source.html> <dest.html>");
  process.exit(2);
}

let html = readFileSync(inputPath, "utf8");
const applied = [];

function sub(find, replace, label) {
  const parts = html.split(find);
  if (parts.length !== 2) {
    console.error(`\n✖ ${label}: expected exactly 1 match, found ${parts.length - 1}`);
    console.error("  The design drop likely changed this markup. Update this script.");
    process.exit(1);
  }
  html = parts.join(replace);
  applied.push(label);
}

/* ---------- head metadata: a static file inherits nothing from layout.tsx ---------- */
sub(
  `<title>Valet · Drive more, stress less.</title>\n<link rel="preconnect"`,
  `<title>Valet · Drive more, stress less.</title>
<meta name="description" content="The modern homebase for collector-car ownership. Value intelligence, maintenance planning, and enthusiast community, all driven by your VIN." />
<meta name="theme-color" content="#1e332b" />
<!-- Served at \`/\` via a rewrite in next.config.ts; canonical keeps the raw .html path out of search results. -->
<link rel="canonical" href="/" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Valet" />
<meta property="og:description" content="Drive more, stress less. The modern homebase for collector-car ownership." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Valet" />
<meta name="twitter:description" content="Drive more, stress less. The modern homebase for collector-car ownership." />
<link rel="preconnect"`,
  "head metadata",
);

/* ---------- brand wordmark ---------- */
sub(
  `.logo.dark .rest{color:var(--ink);}`,
  `.logo.dark .rest{color:var(--ink);}
/* Real brand wordmark from \`public/branding\`, in place of the CSS-composed ///VALET lockup.
   Heights match the footprint the text version measured, so layout is unchanged. */
.logo-img{display:block;width:auto;}
.logo-link{display:inline-flex;align-items:center;text-decoration:none;}
nav .logo-img{height:25px;}
footer .logo-img{height:21px;}
/* The text logo here had no font-size rule, so it fell back to the 16px body default and
   rendered about half the size of the one in the main nav. */
.about-top .logo-img{height:25px;}`,
  "logo CSS",
);

const TEXT_LOGO = `<span class="sl"><i>/</i><i>/</i><i>/</i></span><span class="v">V</span><span class="rest">ALET</span>`;
sub(
  `<a class="logo" href="#top" aria-label="Valet home">${TEXT_LOGO}</a>`,
  `<a class="logo-link" href="#top" aria-label="Valet home"><img class="logo-img" src="/branding/logo-white-w-gold.svg" alt="Valet" width="181" height="53" /></a>`,
  "nav logo",
);
sub(
  `  <div class="about-top">\n    <span class="logo">${TEXT_LOGO}</span>`,
  `  <div class="about-top">\n    <img class="logo-img" src="/branding/logo-ink-w-gold.svg" alt="Valet" width="181" height="53" />`,
  "about header logo",
);
sub(
  `    <span class="logo">${TEXT_LOGO}</span>\n    <div class="copy">`,
  `    <img class="logo-img" src="/branding/logo-white-w-gold.svg" alt="Valet" width="181" height="53" />\n    <div class="copy">`,
  "footer logo",
);

/* ---------- form states: error, submitting, honeypot ---------- */
sub(
  `.cta-row.done .cta-p,.cta-row.done .wait-form{display:none;}`,
  `.cta-row.done .cta-p,.cta-row.done .wait-form{display:none;}
.cta-err{font-family:var(--mono);font-size:11px;letter-spacing:1.5px;color:var(--red);text-transform:uppercase;padding:6px 0 10px;display:none;}
.cta-row.err .cta-err{display:block;}
.wait-form button[disabled]{opacity:.55;cursor:default;}
.wait-form button[disabled]:hover{background:var(--gold);border-color:var(--gold);transform:none;}
/* Honeypot: off-screen rather than display:none so bots that skip hidden fields still fill it. */
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}`,
  "form-state CSS",
);

/* ---------- Founding Member CTA ----------
   The stock copy promises a login link and access "from day one". This is a waitlist: nothing
   sends a login link, and promising immediate access would be a broken promise on arrival. */
sub(
  `<p class="cta-p">Enter your email and we'll send your login link for the mobile app and web platform. No card, no dues for founders, your garage and your communities from day one.</p>`,
  `<p class="cta-p">Enter your email to claim your Founding Member number. We'll confirm by email straight away, and we'll let you know when early access is ready. No card, no dues for founding members.</p>`,
  "founding member copy",
);

const HONEYPOT = `<div class="hp" aria-hidden="true"><label>Company website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>`;

sub(
  `<form class="wait-form cta-form" data-ok="okM" style="margin:0 auto;">
            <input type="email" required placeholder="YOUR@EMAIL.COM" aria-label="Email for founding member login link" />
            <button class="btn" type="submit">Send My Login Link</button>`,
  `<form class="wait-form cta-form" data-ok="okM" data-source="founding-member" style="margin:0 auto;">
            ${HONEYPOT}
            <input type="email" name="email" required placeholder="YOUR@EMAIL.COM" aria-label="Email for the Founding Member waitlist" />
            <button class="btn" type="submit">Become a Founding Member</button>`,
  "founding member form",
);
sub(
  `<div class="cta-ok" id="okM">✓ Login link on its way · Welcome to the founding garage</div>`,
  `<div class="cta-ok" id="okM">✓ You're in. Check your inbox for your Founding Member confirmation.</div>
          <div class="cta-err" role="alert"></div>`,
  "founding member result containers",
);

sub(
  `<form class="wait-form cta-form" data-ok="okE" style="margin:0 auto;">
            <input type="email" required placeholder="YOUR@EMAIL.COM" aria-label="Email for partnership information" />`,
  `<form class="wait-form cta-form" data-ok="okE" data-source="equity-partner" style="margin:0 auto;">
            ${HONEYPOT}
            <input type="email" name="email" required placeholder="YOUR@EMAIL.COM" aria-label="Email for partnership information" />`,
  "equity partner form",
);
sub(
  `<div class="cta-ok" id="okE">✓ Partnership brief incoming · Deck included</div>`,
  `<div class="cta-ok" id="okE">✓ Partnership brief incoming · Deck included</div>
          <div class="cta-err" role="alert"></div>`,
  "equity partner result containers",
);

/* ---------- submit handler ---------- */
sub(
  `document.querySelectorAll('.cta-form').forEach(f=>{f.addEventListener('submit',ev=>{ev.preventDefault();
  f.closest('.cta-row').classList.add('done');});});`,
  `/* Waitlist capture -> POST /api/waitlist. \`data-source\` tags which CTA the signup came from;
   the route allowlists the value before it reaches the database. The founding member CTA gets
   a sequential number back and reports it inline. */
var EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@.]+$/;
document.querySelectorAll('.cta-form').forEach(function(f){f.addEventListener('submit',async function(ev){ev.preventDefault();
  var row=f.closest('.cta-row');
  var input=f.querySelector('input[type=email]');
  var btn=f.querySelector('button[type=submit]');
  var errBox=row.querySelector('.cta-err');
  var okBox=row.querySelector('.cta-ok');
  var email=(input.value||'').trim();
  row.classList.remove('err');

  if(!EMAIL_RE.test(email)){
    errBox.textContent="\\u00d7 Enter a valid email address.";
    row.classList.add('err');
    input.focus();
    return;
  }

  var label=btn.textContent;
  btn.disabled=true;btn.textContent="Sending\\u2026";
  try{
    var res=await fetch('/api/waitlist',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        email:email,
        source:f.dataset.source||'landing',
        website:(f.querySelector('input[name=website]')||{}).value||''
      })
    });
    var data=await res.json().catch(function(){return {};});
    if(!res.ok)throw new Error(data&&data.error?data.error:"Something went wrong. Please try again.");

    if(okBox&&f.dataset.source==='founding-member'){
      var n=data.foundingMemberNumber;
      var num=n?" #"+n:"";
      if(data.alreadyRegistered){
        okBox.textContent="\\u2713 You're already on the waitlist"+(n?" as Founding Member"+num:"")+". Check your inbox for your confirmation.";
      }else if(data.emailSent){
        okBox.textContent="\\u2713 You're in"+(n?", Founding Member"+num:"")+". Check your inbox for your confirmation.";
      }else{
        // No confirmation went out, so do not send them to an inbox that will stay empty.
        okBox.textContent="\\u2713 You're in"+(n?", Founding Member"+num:"")+". We'll be in touch.";
      }
    }
    btn.textContent=label;btn.disabled=false;
    row.classList.add('done');
  }catch(err){
    errBox.textContent="\\u00d7 "+((err&&err.message)||"Network error. Please try again.");
    row.classList.add('err');
    btn.disabled=false;btn.textContent=label;
  }
});});`,
  "submit handler",
);

/* ---------- footer ---------- */
sub(
  `<a href="#">Instagram</a><a href="#">Privacy</a><a href="#">Contact</a>`,
  `<!-- TODO: Instagram still needs the real handle. -->
      <a href="#">Instagram</a><a href="/privacy">Privacy</a><a href="mailto:johnny@valet.app">Contact</a>`,
  "footer links",
);

/* ---------- founder photo as a file asset rather than an inlined blob ---------- */
{
  const re = /<img src="data:image\/jpeg;base64,[A-Za-z0-9+/=]+" alt="Jens, CTO and cofounder of Valet" \/>/;
  const m = html.match(re);
  if (!m) {
    console.error("\n✖ Jens founder img: no match");
    process.exit(1);
  }
  html = html.replace(
    re,
    `<img src="/founders/jens.jpg" width="1040" height="600" loading="lazy" alt="Jens, CTO and cofounder of Valet" />`,
  );
  applied.push(`founder photo (freed ${m[0].length.toLocaleString()} bytes of base64)`);
}

writeFileSync(outputPath, html);
console.log(`${inputPath} -> ${outputPath}`);
for (const label of applied) console.log(`  ✓ ${label}`);
console.log(`\n${applied.length} customisations applied.`);
