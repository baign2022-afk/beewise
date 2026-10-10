# BeeWise — Hive Monitor

Mobile-friendly progressive web app for a beehive-monitoring prototype.

## Features

- Clearly labeled sample data for two demo hives
- Temperature, humidity, CO₂ and battery charts
- Configurable in-app warnings
- Inspection journal and CSV export
- Supabase sign-in and database integration
- Authenticated Arduino ingestion endpoint

## Run locally

No build or package installation is required:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Serve over HTTPS for hosted PWA installation. You can deploy the repository root to a static host such as Cloudflare Pages; no build command is needed.

## Connect real data

Follow [setup.md](setup.md). Run [schema.sql](schema.sql) in your Supabase project and deploy [ingest.ts](ingest.ts) as the `ingest` Edge Function. Then use the app's Connect device tab.

Never commit database service-role keys, device secrets, passwords or `.env` files. Only publishable/anon keys belong in the client. No credentials are included in this project.

## Prototype limitations

Demo inspections are stored on this browser only. Live mode requires your own Supabase setup and device HTTPS uploads. Alerts are displayed in-app, not background push notifications. Thresholds are prototype preferences, not validated health diagnoses. Live integration and outdoor reliability require testing. See setup.md for retention, authentication and validation details.

The previous repository version remains recoverable through Git history.
