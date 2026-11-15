# New York, our way · Ben × Lyna · 23–27 November 2026

A responsive **React** planner for your five New York days with **eight choices that actually recalculate the itinerary**, real photos bundled during the GitHub Pages build, a map tied to the selected stops, offline-friendly navigation, shareable decision state, calendar export, and **MTA GTFS-Realtime platform arrivals** (with a CORS-safe optional Cloudflare Worker).

### What works now
- The Pages workflow installs React **18.3.1** at build time and self-hosts its official UMD bundles under `lib/`. No build server or runtime React CDN is required.
- Choose different nights or the Thursday daytime route and watch the event sequence and map change immediately.
- The booked **23 Nov 16:00 Golden Hour Cruise** is locked as booked; all other tickets stay *unbooked* unless you manually tick an explicit purchased box.
- Travel segments show **approximate** subway/walk allowances, not made-up real-time journey durations. Each segment opens live Google Maps transit directions.
- Choose nearby stations in the subway tab for genuine **official MTA trip update predictions**, or set up the included worker if direct browser requests are CORS-blocked.
- Save choices in localStorage; share choice-only links; export an `.ics` calendar. No automatic purchases or emails.

### Publish as a separate GitHub Pages repository
1. On GitHub, create a **new separate repository** called `nyc-lyna`. Do not overwrite the existing `noux` site.
2. Upload the **contents** of this directory (including `.github/workflows/pages.yml`) to `main`. Git command alternative:
   ```bash
   git init && git add . && git commit -m "Build interactive NYC trip planner"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nyc-lyna.git
   git push -u origin main
   ```
3. In **Settings > Pages > Build and deployment**, select **GitHub Actions**. The workflow downloads actual photo files, validates and embeds them into `assets/photos/`, then deploys the complete folder.
4. Open `https://YOUR_USERNAME.github.io/nyc-lyna/`. Check Actions run for photo success counts.

> **Privacy is important:** the repository contents include private hotel and flight itinerary data, even if you hide the UI behind a JavaScript password. GitHub Pages is not an access-controlled application. Only publish this as a public site if you explicitly accept those details being public. For strong privacy use a private authenticated host or implement client-side encryption of itinerary data with a secret not stored in the repository.

### Photos — deliberately NOT external hotlinks at runtime
`scripts/photo_sources.json` lists public photograph URLs and their original source/credit. The CI process runs `scripts/fetch_photos.py` with Pillow; each file is validated as an actual image, converted to JPEG, resized, then placed under `assets/photos/`. `assets/photo-index.json` maps photo names to downloaded local files. If too many priority photos are unavailable, the build **fails** rather than publishing another pictureless slideshow.

Some fallback images are labelled "NYC atmosphere", **not photographs of the named club**. Photo sources are credited in the UI and image index. **Before any public redistribution, confirm you have appropriate re-publication rights for each photograph**; links to an official photo page do not automatically grant a licence.

### MTA real-time API, live only
MTA official developer site: https://api.mta.info/ (public feeds without keys). Live feed origin: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct/`.

Some browsers block cross-origin binary feed requests. For a robust live feed:
1. Create a **Cloudflare Worker**, using `cloudflare/worker.js` and `cloudflare/wrangler.toml`.
2. Deploy it with `npx wrangler deploy` using an account you control (no MTA API key needed).
3. Enter `https://YOUR-WORKER.workers.dev` under the website **Settings → Cloudflare MTA proxy URL**.
4. Open the **Subway arrivals** tab and choose a station. The worker forwards an allowlisted MTA GTFS-Realtime feed, the browser decodes protobuf and filters platform arrival estimates.

The site never claims to have exact real-time transfers, platform wait times days in advance or up-to-date holiday service without receiving actual data. It includes links to official MTA and live Google Maps routes.

### Validate the cruise pier
Lyna's booking is confirmed for **Monday 23 November at 16:00**. The operator lists Pier 78 next to Pier 79 (NY Waterway terminal), but the voucher’s named pier, boarding deadline and supplier remain authoritative.

### Run locally
First run `npm install --no-save react@18.3.1 react-dom@18.3.1`, then copy `node_modules/react/umd/react.production.min.js` and `node_modules/react-dom/umd/react-dom.production.min.js` to `lib/react.min.js` and `lib/react-dom.min.js`. Start `python3 -m http.server 8000` and visit http://localhost:8000. The Pages workflow performs the React installation automatically.

### Main files
- `data.js` — places, addresses, approximate map coordinates, choices, wishlist
- `itinerary.js` — day-by-day itinerary recomputation, travel allowance, route links, conflict warnings
- `app.js` — React interface, local state and exports
- `mta.js` — binary GTFS-Realtime arrival reader
- `cloudflare/worker.js` — optional CORS-safe MTA proxy
- `scripts/fetch_photos.py` — photo bundling and image checks
- `.github/workflows/pages.yml` — photo bundling + Pages deployment

Prepared November 2026. Events, fees, rooftop availability and holiday hours must be revalidated with the original venue before booking.