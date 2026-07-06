---
name: cmp-compliance-research
description: >-
  Use when asked to audit, check, review, or research a website's cookie banner,
  CMP, consent flow, tracking consent, privacy choices, GDPR/UK PECR/CCPA/CPRA
  compliance, Global Privacy Control handling, or dark patterns. Produces an
  evidence-backed, non-legal-advice assessment using live browser inspection,
  network/storage evidence, and current regulator guidance.
---

# CMP Compliance Research

Audit the actual consent experience, not just what the banner claims. Treat this
as a technical/privacy UX assessment, not legal advice. Ground conclusions in
live evidence and regulator guidance.

## When To Use

Use this skill when the user asks whether a site, app, or landing page:

- has a compliant cookie banner or consent management platform (CMP);
- honors `Reject All`, granular preferences, withdrawal, or opt-out choices;
- has cookie/banner dark patterns;
- sets cookies or loads trackers before consent;
- respects Global Privacy Control (GPC) or CCPA/CPRA opt-out signals;
- discloses third parties, purposes, sale/share, advertising, analytics, or
  identity-resolution tooling clearly enough.

## Research Baseline

Always read or refresh authoritative sources when the answer depends on current
law/guidance. Prefer official/regulator sources:

- EU: EDPB Cookie Banner Taskforce report and EDPB consent guidance.
- UK: ICO PECR/storage-and-access-technologies guidance.
- California: CPPA/CCPA regulations, CPPA dark-pattern advisories, California
  DOJ GPC materials.
- Other jurisdictions only if the user asks or site targeting makes them
  relevant.

Extract the practical tests, not a law lecture:

- prior consent for non-exempt storage/access;
- reject/refuse must be available and meaningful;
- privacy-protective path no harder than accept path;
- no pre-enabled non-essential purposes;
- granular purpose controls where consent is used;
- third-party identities/purposes available before consent;
- choices must function as intended and be honored;
- withdrawal/change preferences must be easy;
- dark patterns invalidate consent where applicable;
- GPC/opt-out preference signals matter for CCPA sale/share contexts.

## Live Audit Protocol

Use a clean browser context. Prefer `agent-browser` for browser testing.

1. **Reset state**
   - close existing sessions if safe;
   - set desktop viewport;
   - clear cookies/storage/request log;
   - open the target URL and wait for scripts.

2. **Record first-layer UI**
   - capture snapshot and screenshot if helpful;
   - list buttons/links exactly as shown;
   - note order, prominence, color, size, mobile layout, and whether there is a
     visible customize/settings option.

3. **Inspect before-choice tracking**
   - collect cookies, `document.cookie`, localStorage, sessionStorage;
   - list script URLs and performance resources matching tracking/ad/CMP terms;
   - inspect request log/HAR when useful.
   - Look for Google Analytics/GTM/DoubleClick, Meta/Facebook, LinkedIn,
     TikTok, Hotjar, HubSpot, Segment, PostHog, Intercom, Poptin, Clearbit,
     Demandbase, RB2B/Retention, Hyros, affiliate/referral pixels, etc.

4. **Test reject path**
   - click `Reject All` / `Decline All` / equivalent;
   - record consent cookie/state;
   - reload and re-check requests, cookies, scripts, and storage;
   - flag any analytics/ads/identity trackers still loading or setting IDs
     unless clearly essential and documented.

5. **Test accept path only if needed**
   - use a separate clean session;
   - compare cookies/requests to reject path;
   - do not let accepted state contaminate reject evidence.

6. **Test granular settings**
   - open preferences/settings;
   - verify non-essential categories are off by default;
   - verify category labels are understandable;
   - check cookie/vendor table if present;
   - save selective choices and verify only selected purposes run.

7. **Test withdrawal/revisit**
   - after accepting, verify an easy preferences link/icon exists;
   - withdraw consent and reload;
   - verify trackers stop and prior non-essential cookies are removed or no
     longer used where feasible.

8. **Test mobile**
   - set a common mobile viewport;
   - repeat first-layer UX review;
   - note if reject is below accept, hidden, clipped, or harder to tap.

9. **Check CMP config and page source**
   - inspect CMP config JSON when public;
   - note active law/region mode, GPC settings, Google Consent Mode, IAB TCF,
     category defaults, and whether scripts are loaded before CMP bootstraps;
   - inspect page source for hard-coded tracking scripts outside CMP control.

10. **Optional geo/GPC tests**
   - if jurisdiction matters, test with relevant geo headers/VPN/browser locale
     when available;
   - simulate or enable GPC where tooling supports it and verify behavior.

## Evidence Commands

Useful `agent-browser` patterns:

```bash
agent-browser close --all >/dev/null 2>&1 || true
agent-browser set viewport 1440 1000
agent-browser cookies clear
agent-browser network requests --clear
agent-browser open https://example.com/
sleep 3
agent-browser snapshot
agent-browser cookies get
agent-browser eval 'JSON.stringify({cookie:document.cookie,local:Object.fromEntries(Object.entries(localStorage)),session:Object.fromEntries(Object.entries(sessionStorage)),scripts:[...document.scripts].map(s=>s.src).filter(Boolean),resources:performance.getEntriesByType("resource").map(r=>r.name)})'
```

Filter noisy resources:

```bash
agent-browser eval 'JSON.stringify(performance.getEntriesByType("resource").map(r=>r.name).filter(n=>/google|gtm|analytics|doubleclick|facebook|meta|linkedin|tiktok|hubspot|segment|posthog|intercom|hotjar|clarity|rb2b|retention|demandbase|clearbit|hyros|poptin|cookie/i.test(n)))'
```

Mobile check:

```bash
agent-browser set viewport 390 844
agent-browser cookies clear
agent-browser open https://example.com/
sleep 3
agent-browser snapshot
```

CMP config/source checks:

```bash
python3 - <<'PY'
import requests, re
html = requests.get('https://example.com/', timeout=20).text
for s in re.findall(r'<script[^>]+src=["\']([^"\']+)', html, re.I):
    if re.search('cookie|consent|gtm|google|facebook|posthog|segment|hubspot|intercom|rb2b|retention|hyros', s, re.I):
        print(s)
PY
```

## Dark Pattern Heuristics

Flag as potential dark pattern when the interface:

- makes accept visually dominant while reject is muted, hidden, or link-only;
- puts accept on the first layer but reject only in settings;
- uses confusing labels like `OK`, `Continue`, `Enhance my experience`, or
  `Ask me later` instead of clear yes/no choices;
- makes the privacy-protective path longer, harder, or more time-consuming;
- preselects non-essential purposes;
- bundles unrelated purposes into one consent;
- implies access requires accepting when it does not;
- repeatedly nags after rejection;
- says `Reject All` but still runs non-essential trackers;
- hides withdrawal/settings or makes withdrawal harder than consent.

Classify severity:

- **High:** tracking before consent; reject ignored; reject absent where accept
  exists; preselected ads/analytics; GPC ignored in sale/share context.
- **Medium:** visual asymmetry, buried settings, incomplete vendor disclosure,
  weak withdrawal path.
- **Low:** copy clarity issues, minor prominence differences, missing helpful
  explanations without evidence of tracking misuse.

## Output Format

Keep final concise and evidence-backed.

```md
Verdict: likely [compliant / partially compliant / not compliant]; dark-pattern risk: [low / medium / high].
Not legal advice.

Scope: [URL], [date], [desktop/mobile], [geo if known], clean browser session.

Key findings:
1. [Finding] — evidence: [cookie/request/UI/config observed].
2. [Finding] — evidence: [...].

Compliance concerns:
- [Prior consent / reject honored / granular control / third-party disclosure / withdrawal / GPC].

Dark-pattern observations:
- [Specific UI pattern + why it matters].

Regulatory baseline consulted:
- [EDPB/ICO/CPPA/etc. with practical rule].

Bottom line:
[Plain-English risk assessment + top remediation steps if asked.]
```

## Guardrails

- Do not present as legal advice or a definitive regulator finding.
- Do not rely on banner copy alone; verify actual storage/network behavior.
- Do not assume all third-party scripts are unlawful; distinguish strictly
  necessary/security/fraud/chat features from analytics/ads/identity resolution.
- Do not mix accepted-state evidence into reject-path conclusions.
- If tooling cannot capture network details, say so and base findings on the
  evidence available.
- Prefer exact observed names, URLs, cookie names, and consent state strings over
  vague claims.
