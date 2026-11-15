# NOUX Private Edition

A password-unlocked, encrypted personal trip planner hosted on GitHub Pages.

## Privacy and security model

The published itinerary is encrypted locally using AES-256-GCM. Its PBKDF2 passphrase is **never included in the repository or GitHub Actions secrets**, and is never transmitted to a backend. The public HTML/CSS entry screen, venue images and dependency bundles can be downloaded without authentication; the AES-encrypted itinerary cannot be decrypted without the private passphrase. This is **client-side content encryption, not server-side HTTP access control**. Real private access restrictions require a separate authenticated host (such as Cloudflare Access or a private app server).

This repository had earlier unencrypted revisions. Replacing the current branch does **not guarantee deletion of prior commits, GitHub caches, forks or workflow artifacts**. Do not rely on the gate for complete erasure of previously published details. In the GitHub repository settings, consider private hosting or a new repository and Cloudflare Access for stronger privacy.

## Deployed features

- Cinematic unlock animation; itinerary encrypted at rest.
- Complete dynamic daily schedule, choices and travel estimates, and independently recorded bookings.
- Global search (Cmd/Ctrl+K) across all itinerary stops and wishes.
- All-stops MapLibre vector map using OpenFreeMap, with selected visits, alternatives and custom pins. No requests to blocked OpenStreetMap volunteer tile servers.
- Departure-day itinerary returns to the hotel for stored luggage; pickup time is editable and explicitly unconfirmed.
- Official MTA subway GTFS-Realtime feed client, via a deployable Cloudflare Worker. Without an authorised Worker, no direct blocked browser requests or fabricated arrivals are shown.
- Verified venue photographs bundled locally during GitHub Pages Actions builds.
- Custom-stop editor: add, edit, remove and position a stop, search a NYC address with Photon after a button click, look up a relevant Wikipedia photograph and description, upload your own photo or provide an HTTPS image link.
- Selecting a custom stop immediately updates the relevant day, changes the map and calendar export, estimates travel buffers and moves flexible stops when possible. Fixed appointments (especially the booked Monday cruise and Friday transfer pickup) never move; conflicts are clearly flagged. These are planning estimates, not certified travel times or validated venue opening hours.
- Personal custom stops remain in the browser only; use export/import to move them between devices. Never enter access tokens or passwords in custom-stop fields.

## Activate the optional MTA Cloudflare Worker

1. Create/authorise a Cloudflare Workers account.
2. In GitHub repository **Settings → Secrets and variables → Actions**, create secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts edit + routes rights) and `CLOUDFLARE_ACCOUNT_ID`. Do not paste keys into chat.
3. Run **Actions → Deploy official MTA realtime proxy → Run workflow**.
4. The deploy log prints the `https://noux-mta-live.<your-subdomain>.workers.dev` address. Check its `/health` endpoint.
5. In **Settings → Secrets and variables → Actions → Variables**, add `MTA_PROXY_URL` with that address and rerun the Pages workflow; alternatively paste the URL once into the planner settings.
6. Confirm the planner displays real GTFS station-arrival predictions. Neither MTA nor the Worker provides verified door-to-door routing time. Before this configuration the MTA section explicitly shows as disconnected; no direct browser requests are made or invented. In GitHub Actions, run the Worker workflow only after the two secrets exist.

The passphrase is held by the owner, never in this repository. For upgrades, encrypt private modules locally and upload only the new ciphertext.