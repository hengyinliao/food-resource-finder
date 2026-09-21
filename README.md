# Food Resource Finder — Prototype

Prototype designed by Hengyin Liao. A focused community food-access demonstration:

**A short questionnaire → matching resources → a personalized printed sheet.**

All 20 resources, addresses, schedules, contacts and accessibility attributes are fictional. They must not be used to access real services.

## Open it

Open `index.html` in a modern browser. The questionnaire, translations, settings, filters and printing work without installation, a build, or a server.

Optional browser location assistance may require localhost or HTTPS, depending on the browser. For local testing, run `python -m http.server 8000 --bind 127.0.0.1` from this folder and visit `http://localhost:8000`. Manual selection and searching all pilot areas always work without location permission.

## Experience

- A simple welcome screen, visible English / 中文 buttons, discreet prototype identity, and an expandable About section with the designer credit and intended audience.
- Four questions with large native controls, a progress indicator, Back, and secondary Start again. Going back retains answers; restarting clears answers while keeping language and accessibility settings.
- Immediate display settings: larger text (18px → 23px base), higher contrast, simplified view and reduced motion. Operating-system reduced-motion preferences are also respected.
- Specific optional filters for step-free / wheelchair access, an accessible washroom, seating and easy physical access. Multiple needs combine; each must be explicitly listed as available.
- “I just want to see resources with accessibility information” is exclusive of feature-specific choices. It includes known positive or negative information. “No preference” clears access requirements.
- Three matching resources shown initially. Additional matches are revealed without weakening filters.
- Scannable cards with optional details. The Directions button explains that addresses are fictional and does not send people to a sample location.
- A small future-map research prompt; no map or response collection.

## Sample data and matching

`data.js` is the single resource source for digital and printed results. `matching.js` contains matching and approximate area suggestion logic. `i18n.js` holds interface text; add a language dictionary and a header language button to extend it. Five resource descriptions have Chinese translations; organization names, addresses and phone numbers are preserved.

- “A free meal” excludes paid meals. Other categories may contain free and low-cost resources.
- “Everyone” shows all-age programs. A specific audience includes both all-age and group-specific programs. Sample adult eligibility is 25–64, senior eligibility 65+, and Family means households with children.
- Need, audience, selected area and hard preferences must match. “No registration preferred” sorts drop-in resources first rather than excluding registration-based programs.
- “Open today” checks the sample weekly schedule in America/Vancouver time. It does not mean open now and does not account for holidays.
- Each accessibility feature is `true`, `false`, or `null` (unknown). Unknown is never treated as inaccessible. All current profiles explicitly have `verification: 'unverified'` and `verifiedAt: null`.
- The displayed September 2026 “Last verified” date is marked as a sample record; it does not verify real services or accessibility attributes.

## Location and privacy

Location assistance is optional, with an explanation **before** the user clicks “Use my approximate location.” The browser is asked for a one-time, non-high-accuracy location. A tiny in-browser calculation suggests one of five pilot areas, then requires confirmation. These anchors are rough suggestions, not official neighbourhood boundaries. Outside-area or overly imprecise coordinates produce a manual fallback.

Permission denial, timeout, unsupported browsers and late responses are handled. No coordinates are stored or transmitted by application code. Browser/OS location services operate according to the user's browser permission. No external geocoding or map service is used.

Only four display-setting booleans are saved in localStorage (`food-finder-accessibility-v1`). If storage is unavailable, settings work for the current visit. Answers and the suggested area exist only in memory. There are no accounts, analytics, cookies, databases or backend.

## Print

“Print these results” prints only the currently displayed matching resources. Use “Show more options” first if more matches are wanted.

The Letter-sized black-and-white sheet has a “Food Resources for You” heading, chosen area/need/audience/interface language, preferences, September 2026 update date and the demo warning. Contact information, eligibility, fees and accessibility notes print even if details are collapsed onscreen. Known unavailable accessibility features are included; unknown features are not represented as inaccessible. The designer attribution appears at the end.

Website navigation, controls, decoration and directions prompts are excluded. The larger-text setting also increases print text size.

## GitHub Pages publication

The prepared workflow in `.github/workflows/pages.yml` publishes only `index.html`, `styles.css`, `data.js`, `matching.js`, `i18n.js`, and `app.js`. Tests, documentation, ZIP archives, and QA screenshots are not included in the deployed website. Links use relative paths so the questionnaire also works at a project URL under `/food-resource-finder/`.

Enable GitHub Pages with **GitHub Actions** as the source before running the workflow. Use **Actions → Publish Food Resource Finder → Run workflow** to publish the latest `main` branch. The workflow is manual, so pushing code alone does not publish changes. Private-repository Pages availability depends on the GitHub account plan; publishing the source publicly is a separate visibility choice.

## Checks

Open `tests.html` for 25 deterministic sample-data, filtering and approximate-area checks.

Optional automated browser and PDF checks:

```powershell
python -m pip install playwright pypdf
python verify.py
```

The script uses installed Microsoft Edge by default; set `CHROMIUM_PATH` for another Chromium browser. It checks keyboard interactions and focus, setting persistence and unavailable storage, English/Chinese switching, answer retention, accessibility-filter choices, empty results, card disclosures, location success/denial/timeout/stale responses, 320px and 375px reflow with all display settings enabled, and Letter PDF contents. Geolocation is mocked, so tests never request your real position. Screenshots and sample PDFs are saved to `qa-output/`.

These checks do not replace testing with community members, screen-reader users or different assistive technologies.
