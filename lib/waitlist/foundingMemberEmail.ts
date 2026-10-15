/**
 * Founding Member confirmation email.
 *
 * Table-based with inline styles throughout, because Gmail strips <head> styles, Outlook uses
 * Word for layout, and neither renders SVG. The wordmark is a PNG with the forest background
 * baked in so it blends with the header even before it loads, and it carries alt text for the
 * many clients that block images by default.
 *
 * Since Johnny 05 (2026-10-15) signing up gets you straight in, so the email carries the way in:
 * an "Open Valet" button for the web app, and the iPhone app as an App Store button plus a QR
 * code for people reading on a computer. The QR is a hosted PNG because email clients block SVG
 * and data URIs.
 */

const BG = "#121a16";
const CARD = "#1E332B";
const GOLD = "#C4A972";
const GOLD_D = "#B8963E";
const GOLD_B = "#D4BF92";
const CREAM = "#F5F0E8";
const CREAM_D = "#EBE3D5";
const MUTED = "#8A8678";

const DISPLAY = "'Saira Extra Condensed','Arial Narrow',Arial,sans-serif";
const BODY = "'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const MONO = "'DM Mono',ui-monospace,'Courier New',Courier,monospace";

const LOGO_URL = "https://valet.app/branding/logo-email.png";
export const WEB_APP_SIGNUP_URL = "https://platform.valet.app/auth?mode=signup";
export const APP_STORE_URL = "https://apps.apple.com/app/valet-car-collection/id6793459186";
const APP_QR_URL = "https://valet.app/app/valet-app-qr.png";
const UNSUBSCRIBE = "mailto:johnny@valet.app?subject=Unsubscribe%20from%20Valet%20emails";

/** Subject line is fixed by spec. */
export const FOUNDING_MEMBER_SUBJECT = "Welcome to Valet: You're a Founding Member";

function assertNumber(n: number): number {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`founding member number must be a positive integer, got ${String(n)}`);
  }
  return n;
}

export function buildFoundingMemberEmailText(memberNumber: number): string {
  const n = assertNumber(memberNumber);
  return [
    "VALET",
    "",
    `You're officially Founding Member #${n}.`,
    "",
    "Your garage is ready. Create your account on the web, then take Valet with you on your iPhone.",
    "",
    `Open Valet: ${WEB_APP_SIGNUP_URL}`,
    `Valet on the App Store: ${APP_STORE_URL}`,
    "",
    "Founding Members are the first to use Valet and help shape what comes next.",
    "",
    "---",
    "© 2026 Valet Ventures Inc.",
    "You're receiving this because you joined Valet as a Founding Member.",
    "To unsubscribe, reply to this email or write to johnny@valet.app.",
  ].join("\n");
}

export function buildFoundingMemberEmailHtml(memberNumber: number): string {
  const n = assertNumber(memberNumber);
  const preheader = `You're officially Founding Member #${n}. Your garage is ready, on the web and on iPhone.`;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>You're a Valet Founding Member</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG};-webkit-font-smoothing:antialiased;">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:ital,wght@0,500;0,800;1,800&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  body,#bodyTable{margin:0!important;padding:0!important;width:100%!important;background-color:${BG}!important;}
  img{border:0;display:block;outline:none;text-decoration:none;}
  a{color:${GOLD};text-decoration:none;}
  @media only screen and (max-width:620px){
    .email-wrapper{width:100%!important;}
    .email-content{padding-left:22px!important;padding-right:22px!important;}
    .hero-headline{font-size:38px!important;line-height:.98!important;}
    .member-number{font-size:60px!important;}
    .logo-img{width:190px!important;}
  }
</style>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;</div>
<table id="bodyTable" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BG};margin:0;padding:0;">
<tr><td align="center" style="padding:40px 20px;">
  <table class="email-wrapper" width="580" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;width:100%;">

    <tr><td align="center" style="background-color:${CARD};border-radius:4px 4px 0 0;padding:40px 48px 32px;border-bottom:1px solid rgba(184,150,62,.25);">
      <img class="logo-img" src="${LOGO_URL}" width="240" height="60" alt="Valet" style="display:block;margin:0 auto;width:240px;max-width:100%;height:auto;" />
    </td></tr>

    <tr><td class="email-content" style="background-color:${CARD};padding:0 48px 8px;">
      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:34px 0 22px;"><tr>
        <td style="font-family:${MONO};font-size:11px;color:${GOLD_D};letter-spacing:2px;padding-right:12px;">01</td>
        <td style="font-family:${BODY};font-size:11px;color:${GOLD_B};letter-spacing:4px;text-transform:uppercase;padding-left:12px;font-weight:300;">FOUNDING MEMBER</td>
      </tr></table>

      <h1 class="hero-headline" style="font-family:${DISPLAY};font-weight:800;font-style:italic;font-size:48px;line-height:.95;letter-spacing:-1px;text-transform:uppercase;color:${CREAM};margin:0;padding:0;">WELCOME TO<br>VALET.</h1>
      <div style="width:48px;height:1.5px;background-color:${GOLD_D};margin:24px 0 28px;"></div>
    </td></tr>

    <tr><td class="email-content" style="background-color:${CARD};padding:0 48px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid rgba(196,169,114,.45);border-radius:10px;background-color:rgba(13,21,18,.5);">
        <tr><td align="center" style="padding:26px 20px 28px;">
          <div style="font-family:${MONO};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${GOLD_D};padding-bottom:10px;">You're officially</div>
          <div class="member-number" style="font-family:${DISPLAY};font-weight:800;font-style:italic;font-size:76px;line-height:1;color:${GOLD};padding-bottom:8px;">#${n}</div>
          <div style="font-family:${BODY};font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${CREAM_D};font-weight:400;">Founding Member</div>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="email-content" style="background-color:${CARD};padding:30px 48px 40px;">
      <p style="font-family:${BODY};font-size:16px;line-height:1.7;color:${CREAM};font-weight:400;margin:0 0 16px;padding:0;">You're officially Founding Member #${n}.</p>
      <p style="font-family:${BODY};font-size:16px;line-height:1.7;color:${CREAM_D};font-weight:300;margin:0 0 16px;padding:0;">Your garage is ready. Create your account on the web, then take Valet with you on your iPhone.</p>
      <p style="font-family:${BODY};font-size:16px;line-height:1.7;color:${CREAM_D};font-weight:300;margin:0 0 26px;padding:0;">Founding Members are the first to use Valet and help shape what comes next.</p>
      <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td align="center" bgcolor="${GOLD}" style="border-radius:6px;background-color:${GOLD};">
          <a href="${WEB_APP_SIGNUP_URL}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${MONO};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${BG};text-decoration:none;font-weight:500;">Open Valet</a>
        </td>
      </tr></table>
    </td></tr>

    <tr><td class="email-content" style="background-color:${CARD};padding:0 48px 40px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid rgba(184,150,62,.25);">
        <tr>
          <td width="148" valign="top" style="padding:28px 20px 0 0;">
            <img src="${APP_QR_URL}" width="128" height="128" alt="QR code for Valet on the App Store" style="display:block;width:128px;height:128px;border-radius:6px;" />
          </td>
          <td valign="top" style="padding:28px 0 0;">
            <div style="font-family:${MONO};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${GOLD_D};padding-bottom:10px;">Valet on iPhone</div>
            <p style="font-family:${BODY};font-size:15px;line-height:1.6;color:${CREAM_D};font-weight:300;margin:0 0 16px;padding:0;">On a computer, scan the code with your iPhone camera. On your phone, tap the button.</p>
            <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td align="center" style="border-radius:6px;border:1px solid ${GOLD};">
                <a href="${APP_STORE_URL}" target="_blank" style="display:inline-block;padding:11px 20px;font-family:${MONO};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};text-decoration:none;">Download on the App Store</a>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td align="center" style="background-color:${BG};border-radius:0 0 4px 4px;padding:28px 48px 8px;">
      <p style="font-family:${MONO};font-size:10px;letter-spacing:1.5px;color:${MUTED};margin:0 0 8px;padding:0;">&copy; 2026 VALET VENTURES INC</p>
      <p style="font-family:${BODY};font-size:11px;line-height:1.6;color:${MUTED};font-weight:300;margin:0;padding:0;">You're receiving this because you joined Valet as a Founding Member.<br><a href="${UNSUBSCRIBE}" style="color:${GOLD_D};text-decoration:underline;">Unsubscribe</a></p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}
