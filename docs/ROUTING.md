# NOUX NYC — live-assisted door-to-door subway routing

This release adds scheduled subway routing for **23–27 November 2026** using official MTA static GTFS together with the already-connected official GTFS-Realtime feeds.

## What it actually computes

- The selected itinerary stop pair supplies geographic origin and destination. Custom stops with coordinates work as well.
- Official static GTFS supplies date-specific subway trips, time-dependent station-to-station departures, service patterns and station transfer passages. **Thanksgiving (26 Nov) has a separate service calendar.**
- The connection-scan algorithm chooses a plausible earliest-arrival subway itinerary including waiting, line changes and approximate walking legs. It does not assume a normal weekday timetable on a holiday.
- When checking a leg on the **actual visit day**, and sufficiently close to departure, NOUX requests the relevant MTA GTFS-Realtime feeds through the Cloudflare Worker. A train leg is marked **LIVE** only if a real `TripUpdate` lists its boarding and destination stops in the correct order and predicts both times. Feed timestamps are checked for freshness.
- If no matching live train exists, that leg stays explicitly **scheduled**; if a delay causes a published connection to be missed, NOUX warns that the route must be recalculated rather than inventing a departure time.
- Changing one of Lyna’s eight choices or adding/moving a personal stop changes the stop pairs and therefore the proposed journeys. Booked cruise and airport-transfer commitments remain fixed.

## Accuracy boundaries

- **Walking times are estimates** from straight-line distance multiplied by a street-network factor; not verified walking routes, elevator availability, accessibility or street closures. Google Maps transit directions and the official MTA service status are linked for last-mile verification.
- GTFS-Realtime is a stream of train predictions, not a full walking-and-transfer routing API. Even matched predictions may change, and missing predictions are not fabricated.
- This is not yet OpenTripPlanner running a current street graph. It is a timetable-driven, live-assisted subway planner designed for the holiday visit. An OpenTripPlanner/Valhalla backend would be the next step for accessibility, exact pedestrian directions, guaranteed alternatives and comprehensive realtime re-optimisation.
- All route calculations and GTFS schedule files are public MTA data. Personal itinerary decisions continue to be decrypted **only in the browser**; no personal route requests are sent to the Cloudflare Worker, only public train feed IDs.

## Data build

- `python scripts/build_mta_timetable.py` downloads the MTA GTFS from `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip` and compiles date-specific connection scans.
- Its outputs under `assets/subway/` include a station/network manifest, per-day JSON and per-day gzip variants.
- Modern browsers use `DecompressionStream('gzip')` and fetch ~smaller payloads; older browsers fall back to JSON.
- The GitHub Pages pipeline runs Node tests for route computation and protobuf trip prediction parsing, then verifies all five dates and publishes only public GTFS data and the private AES-encrypted itinerary.
- The generated network can be refreshed by rerunning the **Publish encrypted NOUX planner** workflow on GitHub.

## No new credentials required

The existing Cloudflare Worker at `https://noux-mta-live.benjbongard.workers.dev` continues to supply live predictions. No extra API key, VPS access, MTA token or passphrase is required for publishing the routing-data module. GitHub Actions never receives the itinerary decryption passphrase.