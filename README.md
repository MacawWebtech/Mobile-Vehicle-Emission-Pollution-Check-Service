# Clearway — Mobile Vehicle Emission Check HTML Template

**Clean Air, Delivered.** A multi-page Bootstrap 5 template for a doorstep emission / pollution-check (PUC) service: certified technicians drive to the customer, test the vehicle on the spot and issue the certificate digitally.

- Version: **1.2.0** · Bootstrap **5.3.3** · Bootstrap Icons **1.11.3**
- Fonts: **Sora** (headings) + **Nunito Sans** (body) via Google Fonts
- No build step. Open `index.html` (or `pages/index.html`) in a browser.

Full, illustrated docs: open **`documentation/index.html`**.

---

## 1. Install

1. Unzip the folder.
2. Open `pages/index.html` in any modern browser — or serve the folder:
   ```bash
   npx serve .          # or: python3 -m http.server 8080
   ```
3. Deploy the whole folder to any static host (Netlify, Vercel, GitHub Pages, cPanel).
   - The root `index.html` simply forwards to `pages/index.html`.
   - Netlify / Vercel: copy `pages/404.html` to the site root if you want it used as the global 404.

CSS/JS libraries load from the jsDelivr CDN. To work fully offline, download Bootstrap, Bootstrap Icons and the two fonts into `assets/` and update the `<link>`/`<script>` paths in each page `<head>` (see `assets/fonts/README.md`).

### Photos

Every image on the site is a real photograph (Unsplash License — free for commercial use). Out of the box the pages load them as **WebP** from Unsplash's CDN with responsive `srcset`, so nothing is missing on first open. For production, store them on your own server:

```bash
bash download-images.sh https://www.your-domain.com
```

This downloads all 34 photos into `assets/images/photos/` and rewrites every page to use the local files (absolute URLs for `og:image` and JSON-LD use your domain). To use your own photos — strongly recommended for the hero, About and team shots — replace the files in `assets/images/photos/` with the same names. Only the logo and favicon stay as SVG, since a logo must be vector.

Maps on the Coverage and Contact pages are live Google Maps embeds (no API key); change the `q=` address in the `<iframe>`.

## 2. File structure

```
clearway/
├── index.html                  → redirects to pages/index.html
├── sitemap.xml · robots.txt
├── assets/
│   ├── css/  style.css         core design system + all components
│   │         dark-mode.css     dark theme tokens & overrides
│   │         rtl.css           right-to-left adjustments
│   ├── js/   main.js           theme, RTL, nav, validation, pincode, coverage, counters
│   │         dashboard.js      skeletons, stepper, countdowns, filters, QR modal, toasts
│   ├── images/                 logo-mark.svg, favicon.svg, photos/ (filled by download-images.sh)
│   └── fonts/README.md         how to self-host the fonts
├── pages/                      25 HTML pages (see below)
├── download-images.sh          saves all photos locally as WebP and relinks the pages
└── documentation/index.html
```

## 3. Pages

| Area | Files |
|---|---|
| Public | `index.html` (Home — Classic), `index-2.html` (Home — Photo), `services.html`, `service-details.html` (car), `service-details-two-wheeler.html`, `service-details-commercial.html`, `service-details-renewal.html`, `coverage.html`, `about.html`, `pricing.html`, `blog.html`, `blog-details.html`, `contact.html`, `legal.html` |
| Utility | `404.html`, `coming-soon.html` (maintenance) |
| Auth | `login.html` — login, register tab, forgot-password panel (`login.html#register`, `login.html#forgot`) |
| Dashboard | `dashboard.html` (overview), `dashboard-book.html` (4-step stepper), `dashboard-bookings.html`, `dashboard-certificates.html`, `dashboard-reminders.html`, `dashboard-payments.html`, `dashboard-profile.html`, `dashboard-settings.html`; logout is a confirmation modal on every dashboard page |

Every page has a unique `<title>` (≤ 60 chars), a 150–160 char meta description, one `<h1>`, canonical + Open Graph tags, and JSON-LD (LocalBusiness / AutomotiveBusiness, Service, FAQPage, BreadcrumbList, BlogPosting, ContactPage). Dashboard, 404 and coming-soon pages are `noindex`.

## 4. Customization

**Brand colours** — edit the tokens at the top of `assets/css/style.css` (light) and `assets/css/dark-mode.css` (dark):

```css
:root {
  --cw-primary: #0E4D45;   /* deep teal / forest */
  --cw-accent:  #8DDB5A;   /* lime — "pass / clean" */
  --cw-amber:   #F2A93B;   /* reminders & alerts */
  --cw-danger:  #C93A3A;   /* fail / expired only */
  --cw-bg:      #F7F6F1;   /* off-white */
  --cw-text:    #1F2426;   /* charcoal */
}
```

**Fonts** — change the Google Fonts `<link>` in each `<head>` and `--cw-font-display` / `--cw-font-body`.

**Name, phone, prices** — search the pages for `Clearway`, `1800-000-1234`, `wa.me/910000000000`, `₹`. Every spot you must change is marked with a `TODO` comment.

**Serviceable pincodes** — `assets/js/main.js` §06, `SERVICEABLE` map (or replace `cwLookupPincode()` with an API call).

**Breakpoints** — template components use `<640`, `640–1024`, `1024–1280`, `>1280` (see §14 of `style.css`; the main nav collapses below 1024px via `.navbar-expand-cw`). Page layout uses Bootstrap's own grid classes (`sm/md/lg/xl/xxl`).

## 5. Integrations (placeholders ready)

| Integration | Where | What to do |
|---|---|---|
| Formspree | `contact.html`, `coming-soon.html` | Replace `https://formspree.io/f/YOUR_FORM_ID`. `main.js` submits with `fetch` and shows a friendly status. |
| Netlify Forms | any `form.cw-validate` | Remove `action`, add `data-netlify="true"` and a `name`. |
| Mailchimp | footer newsletter | Paste your embedded-form action URL and bot-field name. |
| Google Maps | `coverage.html`, `contact.html` | Live keyless embeds — change the `q=` address, or swap in a Maps Embed API / My Maps URL that draws your zones. |
| Booking calendar | `dashboard-book.html` + `dashboard.js` §06 | POST the stepper data to Cal.com / Calendly / your API. |
| Stripe | booking step 4 + payments "Add a card" modal | Mount Stripe Elements into `#stripe-card-element` / `#stripe-card-modal`. |
| PayPal | booking step 4 | Render `paypal.Buttons()` into `#paypal-button-container`. |
| WhatsApp | floating button, footer, contact | Replace `https://wa.me/910000000000`. |

Without real endpoints, forms run in **demo mode** (validate → success message).

## 6. Features

- Dark / light mode with OS detection and a remembered choice (`localStorage`), no flash on load
- One-click RTL: swaps to `bootstrap.rtl.min.css`, mirrors directional icons and the route-line animation
- WCAG 2.1 AA: checked colour contrast, visible focus rings, skip link, ARIA on toggles/tabs/accordions/steppers, keyboard-operable everything, 44px touch targets
- Friendly client-side validation with per-field messages (`data-msg-required`, `data-msg-pattern`, …)
- Skeleton loaders on dashboard cards and tables (`data-skeleton` pattern)
- Signature elements: route-line dividers (van → home → certificate), animated pollution gauge, certificate cards with PASS / VALID TILL stamps
- Animations respect `prefers-reduced-motion` and are reduced on phones

## 7. Credits

- [Bootstrap 5](https://getbootstrap.com) — MIT
- [Bootstrap Icons](https://icons.getbootstrap.com) — MIT
- [Sora](https://fonts.google.com/specimen/Sora) & [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans) — SIL Open Font License
- Photos — [Unsplash](https://unsplash.com/license) (free to use, attribution appreciated):
  - `hero-technician.webp` — Technician in uniform inspecting a car — `https://images.unsplash.com/photo-1625047509248-ec889cbff17f`
  - `og-cover.webp` — Mechanic working on a car engine — `https://images.unsplash.com/photo-1615906655593-ad0386982a0f`
  - `city-skyline.webp` — City high-rises under a blue sky — `https://images.unsplash.com/photo-1627306036351-036986f292a9`
  - `svc-two-wheeler.webp` — Scooter parked on a city pavement — `https://images.unsplash.com/photo-1591517487866-e7c7bf9896fb`
  - `svc-car.webp` — Blue hatchback car — `https://images.unsplash.com/photo-1573899754191-bd20f600141c`
  - `svc-commercial.webp` — Yellow and black auto rickshaw on the road — `https://images.unsplash.com/photo-1626149637281-4e227308da18`
  - `svc-renewal.webp` — Open monthly planner on a desk — `https://images.unsplash.com/photo-1435527173128-983b87201f4d`
  - `detail-car-exhaust.webp` — Close-up of a car's exhaust pipe — `https://images.unsplash.com/photo-1692309175422-b9d614f4764e`
  - `detail-scooter.webp` — Scooter parked at the roadside — `https://images.unsplash.com/photo-1648204834832-78e68052c04f`
  - `detail-van.webp` — White van on a tree-lined road — `https://images.unsplash.com/photo-1614976523626-d598aafd4fda`
  - `detail-calendar.webp` — Close-up of a calendar on a table — `https://images.unsplash.com/photo-1649298173603-9c95aa950879`
  - `car-at-home.webp` — Car parked in front of a house — `https://images.unsplash.com/photo-1659536806369-0114c406a20d`
  - `about-team.webp` — Two men standing beside a parked car — `https://images.unsplash.com/photo-1641784188055-5ef9486431cd`
  - `about-tools.webp` — Box of wrenches and service tools — `https://images.unsplash.com/photo-1637640125496-31852f042a60`
  - `blog-emission-limits.webp` — Heavy traffic on a multi-lane highway at golden hour — `https://images.unsplash.com/photo-1530685932526-48ec92998eaa`
  - `blog-renewal-calendar.webp` — Pen resting on an open calendar — `https://images.unsplash.com/photo-1529651737248-dad5e287768e`
  - `blog-test-checklist.webp` — Hand ticking items off a checklist — `https://images.unsplash.com/photo-1754548930574-6a995e5eb5a7`
  - `blog-two-wheeler.webp` — Rider on a blue motor scooter — `https://images.unsplash.com/photo-1623079478319-945f25f0a97b`
  - `blog-failed-test.webp` — Auto rickshaw with smoke coming from the exhaust — `https://images.unsplash.com/photo-1639919397870-cc2c183be021`
  - `blog-clean-air.webp` — City street lined with green trees — `https://images.unsplash.com/photo-1635176061729-35ca541a03a1`
  - `login-phone.webp` — Person holding a smartphone — `https://images.unsplash.com/photo-1592890288564-76628a30a657`
  - `404-empty-road.webp` — Empty road stretching into the distance — `https://images.unsplash.com/photo-1566518447933-8f9399038f23`
  - `coming-soon-lift.webp` — Car raised on a workshop lift — `https://images.unsplash.com/photo-1723099971299-3789db53604c`
- Logo mark — original SVG made for this template
- Demo names, vehicle numbers, prices and emission limits are placeholders. **Confirm emission limits and certificate rules for your region before publishing.**

## 8. Changelog

- **1.2.1** (12 Oct 2026) — About: redesigned "Our story" as a road journey; team cards with portrait photos and a careers banner.
- **1.2.0** (12 Oct 2026) — Second home page `index-2.html` (photo hero, booking bar, vehicle tabs, visit timeline, pass/fail, fleets); Home dropdown in the nav; FAQ help card.
- **1.1.0** (12 Oct 2026) — Real photography across the site (WebP, responsive srcset), live Google Maps on Coverage and Contact, `download-images.sh`.
- **1.0.0** (12 Oct 2026) — Initial release: 24 pages, dark mode, RTL, dashboard with booking stepper.

## 9. Support

Questions or bugs: support@clearway.example (TODO: replace with your support address). Please include the page name, browser and a screenshot.
