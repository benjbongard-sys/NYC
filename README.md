# NOUX Private Edition

A password-unlocked, encrypted personal trip planner hosted on GitHub Pages.

## Privacy and security model

The published itinerary is encrypted locally using AES-256-GCM. Its PBKDF2 passphrase is **never included in the repository or GitHub Actions secrets**, and is never transmitted to a backend. The public HTML/CSS entry screen, venue images and dependency bundles can be downloaded without authentication; the AES-encrypted itinerary cannot be decrypted without the private passphrase. This is **client-side content encryption, not server-side HTTP access control**. Real private access restrictions require a separate authenticated host (such as Cloudflare Access or a private app server).

This repository had earlier unencrypted revisions. Replacing the current branch does **not guarantee deletion of prior commits, GitHub caches, forks or workflow artifacts**. Do not rely on the gate for complete erasure of previously published details. In the GitHub repository settings, consider private hosting or a new repository and Cloudflare Access for stronger privacy.

## Deployed features

- Cinematic unlock animation; itinerary encrypted at rest.
- Complete dynamic daily schedule, choices and travel estimates, and independently recorded bookings.
- Global search (Cmd/Ctrl+K) across all itinerary stops and wishes.
- Full-location Leaflet map with planned pins versus alternates.
- Departure-day itinerary returns to the hotel for stored luggage; pickup time is editable and explicitly unconfirmed.
- Official MTA subway GTFS-Realtime feed client. The Cloudflare Worker is **not deployed automatically** without the account owner's approval.
- Verified venue photographs bundled locally during GitHub Pages Actions builds.

## Activate the optional MTA Cloudflare Worker

1. Create/authorise a Cloudflare Workers account.
2. In GitHub repository **Settings → Secrets and variables → Actions**, create secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts edit + routes rights) and `CLOUDFLARE_ACCOUNT_ID`. Do not paste keys into chat.
3. Run **Actions → Deploy official MTA realtime proxy → Run workflow**.
4. The deploy log prints the `https://noux-mta-live.<your-subdomain>.workers.dev` address. Check its `/health` endpoint.
5. In **Settings → Secrets and variables → Actions → Variables**, add `MTA_PROXY_URL` with that address and rerun the Pages workflow; alternatively paste the URL once into the planner settings.
6. Confirm the planner displays real GTFS station-arrival predictions. Neither MTA nor the Worker provides verified door-to-door routing time. Before this configuration, direct browser MTA access may be blocked by CORS; the UI reports this instead of fabricating data.

The passphrase is held by the owner, never in this repository. For upgrades, encrypt private modules locally and upload only the new ciphertext.