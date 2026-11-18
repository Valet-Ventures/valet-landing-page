#!/usr/bin/env node
/**
 * Rebuilds the served landing page from a pristine design drop.
 *
 * Design (Johnny) hands over version-stamped HTML in `docs/` (git-ignored), built from his own
 * source, so every customisation we add gets wiped by each new drop. This script re-applies them
 * all in one pass. Every substitution asserts it matched exactly once, so a drop that renames or
 * restructures something fails loudly here rather than silently shipping a page that lost the
 * waitlist wiring, the visit beacon or an honest sentence.
 *
 *   node scripts/apply-landing-customisations.mjs docs/valet_landing_v68.html public/valet-landing.html
 *
 * Written for v68 (18 Nov 2026). The design and copy are Johnny's; what this adds is:
 *   - head tags a static file needs (canonical, favicon, theme colour, social cards)
 *   - the real waitlist wiring: POST /api/waitlist with the source and a honeypot, errors shown
 *     inline, and the founding member flow straight into the web app
 *   - the anonymous visit beacon (same rules as lib/visitBeacon.ts, tested in tests/visitBeacon)
 *   - footer links that go somewhere
 *   - copy that matches what the product does today: Connie researches shops, finds parts, files
 *     records and marks jobs booked, but she does not email shops or sellers, collect quotes or
 *     read your inbox (Jens, 12 Nov: "Connie doesn't book or get quotes"), and the investor form
 *     connects you with the founders rather than promising a deck nobody sends automatically.
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
  `drive what you drive." />\n<link rel="preconnect"`,
  `drive what you drive." />
<meta name="theme-color" content="#1e332b" />
<!-- Served at \`/\` via a rewrite (netlify.toml); canonical keeps the raw .html path out of search results. -->
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

/* ---------- form states: error, submitting, honeypot ---------- */
sub(
  `.cta-row.done .wait-form{display:none;}`,
  `.cta-row.done .wait-form{display:none;}
.cta-err{position:relative;font-family:var(--mono);font-size:11px;letter-spacing:1.5px;color:#F0B4A8;text-transform:uppercase;padding:10px 0 0;display:none;}
.cta-row.err .cta-err{display:block;}
.wait-form button[disabled]{opacity:.55;cursor:default;}
/* Honeypot: off-screen rather than display:none so bots that skip hidden fields still fill it. */
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}`,
  "form-state CSS",
);

const HONEYPOT = `<div class="hp" aria-hidden="true"><label>Company website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>`;

/* ---------- Founding Member CTA ----------
   Nothing sends a login link: the form claims a founding member number, emails it with the iPhone
   app link, and takes them straight into the web app to create their account (Johnny 05). */
sub(
  `<p class="cta-p">Enter your email and we’ll send your login link for the mobile app and web platform. No card, no dues for founders.</p>
        <form class="wait-form cta-form" data-ok="okM">
          <input type="email" required placeholder="your@email.com" aria-label="Email for founding member login link" />
          <button class="btn" type="submit">Send my login link</button>
        </form>
        <div class="cta-ok" id="okM">Login link on its way. Welcome to the founding garage.</div>`,
  `<p class="cta-p">Enter your email to claim your founding member number and go straight into Valet to create your account. We’ll email your number with a link to the iPhone app. No card, no dues for founders.</p>
        <form class="wait-form cta-form" data-ok="okM" data-source="founding-member">
          ${HONEYPOT}
          <input type="email" name="email" required placeholder="your@email.com" aria-label="Email to become a founding member" />
          <button class="btn" type="submit">Claim my founding number</button>
        </form>
        <div class="cta-ok" id="okM">You’re in. Taking you to Valet…</div>
        <div class="cta-err" role="alert"></div>`,
  "founding member form",
);

/* ---------- Equity partner CTA: the founders reply personally (15b6b6c) ---------- */
sub(
  `<p class="cta-p">Enter your email to receive partnership information, including the full pitch deck and the founding round terms.</p>
        <form class="wait-form cta-form" data-ok="okE">
          <input type="email" required placeholder="your@email.com" aria-label="Email for partnership information" />
          <button class="btn" type="submit">Request partnership info</button>
        </form>
        <div class="cta-ok" id="okE">Partnership brief incoming, deck included.</div>`,
  `<p class="cta-p">Enter your email to connect directly with the founding team. We’ll be in touch personally.</p>
        <form class="wait-form cta-form" data-ok="okE" data-source="equity-partner">
          ${HONEYPOT}
          <input type="email" name="email" required placeholder="your@email.com" aria-label="Email to connect with the founding team" />
          <button class="btn" type="submit">Connect with the founders</button>
        </form>
        <div class="cta-ok" id="okE">Thank you. The founders will be in touch personally.</div>
        <div class="cta-err" role="alert"></div>`,
  "equity partner form",
);

/* ---------- submit handler ---------- */
sub(
  `document.querySelectorAll('.cta-form').forEach(f=>{f.addEventListener('submit',ev=>{ev.preventDefault();
  f.closest('.cta-row').classList.add('done');});});`,
  `/* Waitlist capture -> POST /api/waitlist. \`data-source\` tags which CTA the signup came from;
   the route allowlists the value before it reaches the database. The founding member CTA gets
   a sequential number back and goes straight into the web app. */
var EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@.]+$/;
var APP_ORIGIN="https://platform.valet.app";
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
      // Straight into the platform (Johnny 05): sign up, or sign in if the email already has an
      // account. The email rides in the fragment, which never reaches a server or its logs.
      var dest=APP_ORIGIN+"/auth"+(data.hasAccount?"":"?mode=signup")+"#email="+encodeURIComponent(email);
      okBox.textContent=data.hasAccount
        ? "\\u2713 Welcome back"+(n?", Founding Member"+num:"")+". Taking you to sign in\\u2026"
        : "\\u2713 You're in"+(n?", Founding Member"+num:"")+". Taking you to Valet to create your account\\u2026";
      setTimeout(function(){window.location.href=dest;},1600);
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

/* ---------- footer: no Instagram until the account passes 1,000 followers (9ce0763) ---------- */
sub(
  `<a href="#">Instagram</a><a href="#">Privacy</a><a href="#">Contact</a>`,
  `<a href="/privacy">Privacy</a><a href="mailto:johnny@valet.app">Contact</a>`,
  "footer links",
);

/* ---------- visit beacon (5781481), last thing in the body ---------- */
sub(
  `</script>\n</body>`,
  `</script>
<script>
/* Visit counting: one anonymous page view per load, posted to the Valet server. Sends the path,
   a sign-up code and utm tags from the URL, and the referrer's host. No cookies, nothing stored
   in the browser, never from localhost or a preview. Same rules as lib/visitBeacon.ts. */
setTimeout(function(){try{
  var l=window.location,h=l.hostname.toLowerCase();
  if(l.protocol!=='https:'||(h!=='valet.app'&&h!=='www.valet.app'))return;
  var q=new URLSearchParams(l.search),p=l.pathname==='/valet-landing.html'?'/':(l.pathname||'/');
  var b={site:'website',path:p};
  if(q.get('code'))b.code=q.get('code').slice(0,40);
  ['utm_source','utm_medium','utm_campaign'].forEach(function(k){if(q.get(k))b[k]=q.get(k).slice(0,100);});
  var r='';try{r=document.referrer?new URL(document.referrer).hostname.toLowerCase():'';}catch(e){}
  if(r&&r!=='valet.app'&&r!=='www.valet.app')b.referrer_host=r;
  var f=fetch('https://platform.valet.app/api/visit',{method:'POST',body:JSON.stringify(b),headers:{'Content-Type':'text/plain'},keepalive:true,credentials:'omit',mode:'no-cors'});
  if(f&&f.catch)f.catch(function(){});
}catch(e){}},300);
</script>
</body>`,
  "visit beacon",
);

/* ======================================================================================
   Honest copy. Johnny's v68 shows Connie emailing shops and sellers, collecting quotes and
   reading the owner's inbox. None of that exists: she researches on the web, opens pages
   (with approval), files records, marks roadmap jobs booked and reprices the car. Visuals,
   timings and structure stay his; only the words change.
   ====================================================================================== */

/* Section copy and the Connie board */
sub(
  `and when something comes due Connie finds the right local specialists and brings you their quotes.</p>`,
  `and when something comes due Connie points you to the right local specialists and logs the work once it’s done.</p>`,
  "copy: roadmap section lead",
);
sub(`<li>Get the quotes</li>`, `<li>Compare the shops</li>`, "copy: Connie board step");
sub(
  `researching shops, requesting quotes, finding parts and filing paperwork.`,
  `researching shops, finding parts and filing paperwork.`,
  "copy: Connie intro",
);

/* Roadmap rows: nobody's quotes are "in" */
sub(
  `'<div class="st2 q">Not booked · 2 quotes in</div>','<span class="mk lb">Mark booked</span>']];`,
  `'<div class="st2 q">Not booked · 3 shops recommended</div>','<span class="mk lb">Mark booked</span>']];`,
  "copy: desktop roadmap balljoint row",
);
sub(
  `'<span class="mk lb">Mark booked</span>','','<div class="st2 q">Not booked · 2 quotes in</div>'],`,
  `'<span class="mk lb">Mark booked</span>','','<div class="st2 q">Not booked · 3 shops recommended</div>'],`,
  "copy: phone roadmap balljoint row",
);
sub(`ic('spark')+'Ask Connie for quotes</span>'`, `ic('spark')+'Ask Connie for shops</span>'`, "copy: roadmap ask button");

/* Desktop tour: the roof receipt is told to Connie, not dug out of an inbox */
sub(
  `refreshed at Trackside Independent last week. Receipt’s in my email.';`,
  `refreshed at Trackside Independent last week, $1,280.';`,
  "copy: desktop change log message",
);
sub(
  `['Searching your inbox for Trackside Independent…','Found the receipt · Nov 10, 2026 · $1,280','Filed it to the 360’s service record',`,
  `['Reading the 360’s service file…','Logged the job · Nov 10, 2026 · $1,280','Filed it to the 360’s service record',`,
  "copy: desktop change log steps",
);

/* Desktop tour: the belt service. Research and a recommendation, then the owner books. */
sub(
  `'Compared reviews, belt-service experience and labor rates','Drafted a quote request with your car’s details']);
  await approve(th,ic('mail','au')+'<span>Email a quote request to the top <b>4 shops</b>, with your VIN and service history attached</span>','quote requests sent to 4 shops');
  await think(th,'Waiting on replies',['Marque &amp; Motor Works replied','V8 Officina replied','Trackside Independent replied'],520);
  const a1=say(th,'ans','Three shops have replied. Here is how they compare for an engine-out belt service.');
  for(const r of [['pk','Marque &amp; Motor Works','6.2 mi · 40+ belt jobs on 360s','$6,400','Opening Feb 9','OEM belt kit'],['','V8 Officina','8.1 mi · factory-trained','$6,950','Five-week wait','OEM belt kit'],['','Trackside Independent','11.4 mi · did your roof work','$7,100','Three-week wait','Aftermarket kit']])`,
  `'Compared reviews and belt-service experience','Matched them to Valet’s recommended specialists']);
  await approve(th,ic('spark','au')+'<span>Open the top <b>3 shops’</b> websites and check their 360 belt-service work</span>','3 shop websites read');
  await think(th,'Reading their sites',['Marque &amp; Motor Works · 40+ belt jobs on 360s','V8 Officina · factory-trained technicians','Trackside Independent · did your roof work'],520);
  const a1=say(th,'ans','Here is how the three compare for an engine-out belt service.');
  for(const r of [['pk','Marque &amp; Motor Works','6.2 mi · 40+ belt jobs on 360s','★ 4.9','Ferrari specialist','Most 360 belt jobs'],['','V8 Officina','8.1 mi · factory-trained','★ 4.8','Ferrari service','Factory-trained'],['','Trackside Independent','11.4 mi · did your roof work','★ 4.7','Vintage Italian','Knows your car']])`,
  "copy: desktop belt service flow",
);
sub(
  `<div>Marque &amp; Motor Works is the pick, $550 under the next best and the soonest opening. I’ve asked them to hold photos of the old belts for your records. Tell me once you’ve booked and I’ll update your roadmap.</div>`,
  `<div>Marque &amp; Motor Works is the pick: the closest, with the most belt jobs on 360s. Call them for a price and an opening, and tell me once you’ve booked so I can update your roadmap.</div>`,
  "copy: desktop belt service answer",
);

/* Desktop tour: the Evo II search. Web research and the market, no emails to sellers. */
sub(
  `'Ran history checks on the closest 3','Emailed two sellers for service records']);`,
  `'Read the history in the closest 3','Compared each with the market']);`,
  "copy: desktop Evo II steps",
);
sub(`'4% under median','Records received, two owners']`, `'4% under median','Records listed, two owners']`, "copy: desktop Evo II row");
sub(
  `await approve(kt,ic('mail','au')+'<span>Email <b>Rally Sport Portland</b> for a pre-purchase inspection slot and price, and ask the seller for a cold-start video</span>','emails sent to the shop and the seller');
  say(kt,'ans','Sent. Their replies land here, and I’ll turn them into a go or no-go checklist for you. If it’s a go, I can gather enclosed transport quotes to Los Angeles.');`,
  `await approve(kt,ic('spark','au')+'<span>Open the Giallo car’s listing and read <b>the seller’s full service history</b></span>','listing read');
  say(kt,'ans','Done. The records run back to 1998. Next is a pre-purchase inspection: <b>Rally Sport Portland</b> works on Integrales, and I’ll turn their report into a go or no-go checklist for you. If it’s a go, I can find enclosed transporters to Los Angeles.');`,
  "copy: desktop Evo II approval and answer",
);

/* Booking sheet (phone and desktop roadmap demos): recommended shops, then the owner books */
sub(
  `const QUOTES=[['Marque &amp; Motor Works','★ 4.9 · 6.2 mi · opening Feb 9 · OEM belt kit','$6,400'],['V8 Officina','★ 4.8 · 8.1 mi · five-week wait','$6,950'],['Trackside Independent','★ 4.7 · 11.4 mi · three-week slot','$7,100']];`,
  `const QUOTES=[['Marque &amp; Motor Works','6.2 mi · 40+ belt jobs on 360s','★ 4.9'],['V8 Officina','8.1 mi · factory-trained','★ 4.8'],['Trackside Independent','11.4 mi · did your roof work','★ 4.7']];`,
  "copy: booking sheet shops",
);
sub(
  `Connie is getting quotes</span></div><div class="thk" id="'+p+'Tk" style="margin-top:8px"><b>Emailing 4 vetted shops</b></div>`,
  `Connie is finding shops</span></div><div class="thk" id="'+p+'Tk" style="margin-top:8px"><b>Valet’s recommended specialists</b></div>`,
  "copy: booking sheet header",
);
sub(
  `['Researched 9 Ferrari specialists near you','Emailed 4 for a quote and first opening','3 replies in, compared on price and wait']`,
  `['Researched 9 Ferrari specialists near you','Matched them to Valet’s recommended shops','Compared reviews and 360 belt experience']`,
  "copy: booking sheet steps",
);

/* Connie chat scenarios (phone demos) */
sub(
  `steps:['Reading your roadmap…','Researched 9 Ferrari specialists','Drafted a quote request'],ap:'Email a quote request to the top <b>4 shops</b>, with your service history attached',reply:'Three replied. <b>Marque &amp; Motor Works</b> is the pick at <b>$6,400</b>, with an opening Feb 9. Tell me once it’s booked and I’ll update your roadmap.'`,
  `steps:['Reading your roadmap…','Researched 9 Ferrari specialists','Compared their 360 belt work'],ap:'Open the top <b>3 shops’</b> websites and check their belt-service work',reply:'<b>Marque &amp; Motor Works</b> is the pick: 40+ belt jobs on 360s, 6 miles away. Call them for a price and an opening, and tell me once it’s booked so I can update your roadmap.'`,
  "copy: chat belt service scenario",
);
sub(
  `{ask:'Roof work’s done. Receipt is in my email.',steps:['Found the Trackside invoice in your inbox',`,
  `{ask:'Roof work’s done at Trackside, $1,280.',steps:['Logged it with Trackside Independent',`,
  "copy: chat roof scenario",
);
sub(
  `steps:['Scanned 14 listings on 6 sites','Ran history checks on the best 3','Emailed two sellers for records'],reply:'One stands out: 1993, Giallo, 38,400 km, <b>$141,500</b>, 4% under median. I’ve set a watch on the market and emailed the seller for records.'`,
  `steps:['Scanned 14 listings on 6 sites','Read the history in the best 3','Compared each with the market'],reply:'One stands out: 1993, Giallo, 38,400 km, <b>$141,500</b>, 4% under median. I’ve set a watch on the market so you see every new sale.'`,
  "copy: chat Evo II scenario",
);

writeFileSync(outputPath, html);
console.log(`${inputPath} -> ${outputPath}`);
for (const label of applied) console.log(`  ✓ ${label}`);
console.log(`\n${applied.length} customisations applied.`);
