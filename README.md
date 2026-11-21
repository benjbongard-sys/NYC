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
- Departure-day itinerary returns to the hotel for stored luggage before the **arranged guided group coach at approximately 17:00 on Friday 27 November**. The exact lobby boarding time is subject to the travel organiser.
- Official MTA subway GTFS-Realtime feed client, via a deployable Cloudflare Worker. Without an authorised Worker, no direct blocked browser requests or fabricated arrivals are shown.
- Verified venue photographs bundled locally during GitHub Pages Actions builds.
- Custom-stop editor: add, edit, remove and position a stop, search a NYC address with Photon after a button click, look up a relevant Wikipedia photograph and description, upload your own photo or provide an HTTPS image link.
- Selecting a custom stop immediately updates the relevant day, changes the map and calendar export, estimates travel buffers and moves flexible stops when possible. Fixed appointments (especially the booked Monday cruise and Friday transfer pickup) never move; conflicts are clearly flagged. These are planning estimates, not certified travel times or validated venue opening hours.
- Personal custom stops remain local until **Shared trip sync** is paired. Once enabled, custom stops and saved choices are end-to-end encrypted and automatically copied to the partner's paired browser. Offline edits remain local until connectivity returns. Never enter access tokens or passwords in custom-stop fields.


## Food wishlist additions (21 November 2026)

The public `food-wishlist.js` extension adds up to 13 curated NYC food suggestions to the **existing** native `food` wishlist category **only after the encrypted itinerary unlocks**. It retains existing wishlist entries and their priorities, recognises common naming variants to avoid duplicates, and marks four newly introduced classics as core: Katz's, Shake Shack, Joe's Pizza and L'Industrie. Other new food entries are optional, with no preselected day.

The enhancer does not modify the ciphertext, local or shared user preferences, booked events, or the route planner. Both devices receive the same public list with the latest deployed code. The additions are not reservations, and menus, pricing and Thanksgiving hours must be checked before visiting.

**Food place details (21 November 2026).** `food-wishlist.js` now carries branch-specific public metadata for all 13 picks: full street address, official site, published standard hours, known holiday exception, best-fit itinerary day, approximate visit duration and concise geographical advice. `food-guide.js` renders those details in a responsive panel **outside React's managed root**. Open it via the **Food details & hours** control while the native Wishlist is visible, by clicking a recognised Food wishlist card, or through **Explore → Food locations & hours**. Each listing offers directions and a current Google Maps hours search. No client API keys, background requests or new reservations are involved.

Restaurant hours are **not** live opening guarantees. Official holiday notices are preserved: Russ & Daughters and Lobster Place are closed on Thanksgiving 26 November, while Katz's advertises an early 18:00 closing. Levain's pop-up and Magnolia Bakery have differing published regular hours across official sources; the guide explicitly discloses this. An unknown personally added Food wish receives a labelled "location/hours not verified" fallback with a search link rather than invented details. The guide never changes the native four-element Wishlist row or app's day plans.


## Travel Companion + Lyna's guided NOUX Passport (21 November 2026)

A single **Travel Companion** button appears after successful encrypted unlock. It opens five compact panels: **Passport**, **GO**, **Tickets**, **Nearby** and **Offline**. The control sits **outside React's managed root**; opening or closing it must not reinitialise the private itinerary, change any booking or reveal the passphrase.

### 1. Passport · guided discovery, 11+ real decisions

Choose **Lyna** (default) or **Benjamin**. The tour builds its chapters dynamically from the *actual* entries in `NYC_DATA.CHOICES` rather than an independent list, and then introduces the food Wishlist, Map/MTA, custom-stop editor, next-stop navigation, booking readiness, offline pack, packing and shared-device sync. Every step shows the current saved option when known. Use **Choose** to navigate to and click the matching option in the existing native Decisions card; if that UI cannot be matched safely, the app opens the decision for manual selection instead of guessing. **Stamp as reviewed** and **Decide later** save separate per-person progress. These are review markers, **not reservations** and not changes to the current itinerary.

The tour's small progress markers are stored in the existing choice journal at `noux_choice_journal_v2`. That journal is already covered by encrypted **cross-device sync** once the phones are paired; no personal ticket number, passphrase or booking reference is stored in those flags.

### 2. GO · one next move

Reads the already-decrypted private itinerary, New York local time and the latest choices from browser storage. During the trip it shows the current/next event, start time, nearby scheduled stops and one-tap **walking** and **public-transit** directions in Google Maps. Outside the trip dates it shows a selectable preview day. All timing and travel estimates remain planning information; offline maps and realtime train arrivals are **not** guaranteed.

### 3. Tickets · booking readiness

Combines real `booked`, `confirmed`, `arranged`, `ticket-to-check`, `unverified`, `hours-to-check` and `verify` statuses from the private itinerary with reminders to verify the cruise's **actual pier** and the operator's **airport-coach meeting point**. A tick means *reviewed by a person*, not that NOUX bought or confirmed a ticket. Review ticks are saved locally and synchronised when paired, without overwriting bookings.

### 4. Nearby · useful food and indoor alternatives

Groups the 13 verified Food Wishlist branches around **Midtown**, **Chelsea/Meatpacking**, **West Village**, **Lower East Side** or **Williamsburg**. The visitor may choose a neighbourhood manually or explicitly allow the browser to identify the nearest **approximate area**. Device GPS coordinates are not sent to our own backend, saved in the itinerary, or needed for normal use; Google Maps resolves the actual route on the user's own device.

A **Check New York forecast** button requests a current and seven-day forecast from [Open-Meteo](https://open-meteo.com/en/docs) (no API key). The app labels rainfall/wind risks and suggests an indoor fallback **within the same area**. It never silently removes an outdoor stop, adjusts a confirmed booking or asserts holiday opening hours without verification.

### 5. Offline Essentials · explicitly opt-in PWA pack

The service worker `sw.js` is registered **after a healthy first React render**. Open **Offline → Save / update offline pack** on **each phone** while connected. The worker caches only the public website assets and the AES-GCM encrypted vault envelope. It does **not** store a passphrase, decrypted itinerary, live MTA predictions, sync token, personal browsing data or external map tiles. The worker does not intercept external APIs.

After status reads **Offline pack ready**, test once by switching to airplane mode and reopening the exact same NOUX URL. The existing private passphrase is still required. Live MTA updates, Google Maps route generation, weather updates and remote synchronisation need connectivity; some embedded venue photos or map tiles may not be visible offline. Cache Storage may be deleted by the browser, so this is a best-effort backup rather than a guarantee of permanent storage.

The **Clear offline pack** action removes *only* offline caches. It does not clear choices, tickets, shared-device pairing or encrypted packing/souvenir lists. On iPhone, do **not** clear website data.

### Release safeguards

The code was designed to load only after the main private app has painted; it does not add elements to React's navigation or change decrypted vault contents. The Pages workflow runs new **`scripts/test_travel_companion.js`** and **`scripts/test_offline_worker.js`** as mandatory regression gates, alongside the existing unlock, sync, route and food tests. Physical-device verification is still necessary before relying on the pack in an airplane or subway tunnel.

## Route-quality safeguards

The public `choice-orchestrator.js` and `day-audit.js` layers run only **after** decryption and read the existing private itinerary; they do not embed private reservations or the passphrase.

- Wednesday defaults to a Manhattan-first afternoon, with optional Williamsburg skyline/oysters/vintage alternatives; a theatre performance and an indoor house-music event are independent selections.
- The optimiser uses tighter photo and focused-gallery durations, clusters nearby stops, inserts honest transfer buffers, and retains dismissed choices in the Explorer's Second Chances / Route Checks sections.
- The arrival-day booked cruise keeps a 60-minute pier transfer and 30-minute boarding window free of speculative extras. Exact pier and actual travel times are read from the booking, not inferred.
- Holiday closures are screened for selected museums. A relaxed parade viewing window is preserved; it does not promise early front-row viewing.
- The departure day preserves a Midtown shopping route while treating the **arranged guided coach around 17:00 on Friday 27 November** as fixed, with bags collected by 16:40 and guests in the lobby by 16:45. Confirm any adjustment directly with the group guide.
- Five-day synthetic regression tests are run in `scripts/test_day_audit.js`, alongside existing choice, venue, routing and subway tests, as part of the Pages deployment workflow.

**Important:** transfer estimates and venue hours are not live guarantees. Protected bookings survive conflicts, which are flagged for human resolution. Choice history and personal stops sync only after both devices join the same encrypted shared room; before pairing, all data stays on each device.

## Final-day coach, sunrise and encrypted checklists

- **Friday 27 November:** breakfast at the hotel from 07:00 to 10:00; check out **before 12:00**, leaving suitcases with hotel reception. The booked group transfer is by coach with a French-speaking guide, **approximately 17:00** from the hotel to JFK Terminal 1. The planner puts guests in the lobby by 16:45. This supersedes the earlier speculative noon/15:50 pickup. The private encrypted itinerary retains actual flight booking details.
- **Brooklyn Bridge sunrise:** a non-ticketed photo-and-walking excursion can be selected for **Wednesday** (default, approximately 06:54 sunrise), **Friday** (approximately 06:56) or skipped. The proposed DUMBO waterfront photo session leads into a Brooklyn → Manhattan pedestrian bridge crossing; travel and dawn weather need rechecking.
- After successful vault unlock, a final **Departure & gifts** navigation tab appears (mobile: visible fixed launcher). It provides **independent Lyna/Benjamin completion tickboxes**, an editable NYC shopping/bringing-home list, separate **Bought** / **Packed** markers, curated shop websites, Google Maps directions and a one-click current Google Maps shop search for any newly added item. The "Suggest best day" action uses an approximate neighbourhood match to the itinerary, **not live stock availability**.
- All ticks and shopping notes are saved **encrypted locally with AES-GCM**. After the two phones have been paired, changes also synchronise through encrypted Cloudflare Durable Object storage, preserving Benjamin's and Lyna's independent checkboxes. Encrypted export/import remains available as a separate backup.
- The shopping suggestions and France customs caveats are informational. Store inventory, special holiday hours, carrier baggage conditions and customs exemptions need verification before purchase.

## Shared trip: Ben + Lyna on separate phones

The optional shared backend is an **independent** Cloudflare Worker (`cloudflare/sync-worker.js`) at `https://noux-sync.benjbongard.workers.dev`. It uses a SQLite-backed Durable Object with one strongly consistent document per randomly generated room. GitHub Actions deploys it automatically on changes to the Worker or its deploy workflow, provided the existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` Actions secrets allow creating/deploying Workers.

**First verify** `https://noux-sync.benjbongard.workers.dev/health` returns `{"ok":true,...}`. The sync tab remains local/offline until this service is deployed. If deployment fails, check **Actions → Deploy NOUX encrypted sync**; do not paste any API token or pairing code into chat.

1. On the first phone, open NOUX and unlock with the existing **private itinerary passphrase**. Select **Set up shared sync**, identify the device as Benjamin (or Lyna), then **Create our shared trip**. Wait for **Shared trip synced**.
2. Click **Copy pairing code** and deliver it privately to the other person. It begins with `NOUX1.` and contains a 128-bit random room ID plus a 256-bit random capability. **The code is a secret**, not an ordinary public link. Do not put it in a GitHub issue, URL, website setting, public chat or screenshot.
3. On the second phone, open the same NOUX URL, unlock with the **same itinerary passphrase**, choose **Lyna** (or Benjamin), paste the pairing code and choose **Join existing trip**.
4. Both browsers poll roughly every 6.5 seconds, and also synchronise after relevant local actions, focus and reconnection. Personal stop additions, itinerary choices and all checkboxes/bring-home items merge **by field or stable ID**. Ben and Lyna's packing ticks are independent. An offline device retains its local edits and submits them on reconnect.
5. Incoming checklist changes appear immediately in the open checklist. An already-open **React itinerary** cannot safely be rehydrated without its private source, so a small **View latest itinerary** prompt appears when another device changes choices or custom stops. Click to reload and enter the passphrase again. The new state is already stored locally before reload.

### Privacy, conflicts and recovery

- The Worker receives **only** authenticated AES-GCM ciphertext. The key is derived locally from the existing itinerary passphrase and vault salt; no passphrase, private itinerary plaintext, custom stop, gift or packing label is sent to Cloudflare. The random pairing token is sent over HTTPS solely as a bearer capability and is stored encrypted on each phone. Cloudflare retains a SHA-256 verifier of the capability, not the raw secret.
- Room writes use a monotonic revision with conflict rejection, followed by field-wise merge and retry. Distinct choices, separately identified stops and individual Bought/Packed/checklist ticks are preserved independently. **When the exact same field is edited simultaneously**, the newer device timestamp wins. Keep your device clocks set automatically.
- Browser storage is **not** replaced with a destructive remote snapshot. On initial pairing with an established room, shared fields win while locally unique custom stops and gifts are retained. If syncing fails, the website keeps working from its existing local copy.
- Pairing and synchronisation cache are encrypted in each browser. If a phone is lost or browser data deleted, unlock NOUX on the replacement device and enter the pairing code again. If you lose the code on both devices, the existing room cannot be recovered from public GitHub data; create a new room using the latest device copy and pair again.
- Embedded custom-stop photographs larger than about **180 KB** remain on the originating device to avoid breaking sync quotas; the stop's title, address, coordinates and other smaller fields still synchronise. You can transfer large photos separately using the existing custom-stop export feature.
- The shared room is **not a user-account login**: anyone with the pairing capability can read or replace its ciphertext, and anyone with **both** the pairing code and itinerary passphrase could decrypt the shared data. Share both separately and privately. No commercial-grade authentication, audit log, automatic revocation or guarantee against malicious authorised edits is claimed.
- Public code and scripts are safe to read. The password-protected vault remains encrypted client-side, not inaccessible via HTTP. Do not store additional personal secrets in custom-stop fields.

## Activate the optional MTA Cloudflare Worker

1. Create/authorise a Cloudflare Workers account.
2. In GitHub repository **Settings → Secrets and variables → Actions**, create secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts edit + routes rights) and `CLOUDFLARE_ACCOUNT_ID`. Do not paste keys into chat.
3. Run **Actions → Deploy official MTA realtime proxy → Run workflow**.
4. The deploy log prints the `https://noux-mta-live.<your-subdomain>.workers.dev` address. Check its `/health` endpoint.
5. In **Settings → Secrets and variables → Actions → Variables**, add `MTA_PROXY_URL` with that address and rerun the Pages workflow; alternatively paste the URL once into the planner settings.
6. Confirm the planner displays real GTFS station-arrival predictions. Neither MTA nor the Worker provides verified door-to-door routing time. Before this configuration the MTA section explicitly shows as disconnected; no direct browser requests are made or invented. In GitHub Actions, run the Worker workflow only after the two secrets exist.

The passphrase is held by the owner, never in this repository. For upgrades, encrypt private modules locally and upload only the new ciphertext.