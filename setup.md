# BeeWise prototype setup

The hosted app starts in demo mode. Demo notes are browser-local. Live data requires your own Supabase project. No cloud database or hardware connection has been provisioned for you.

1. Create a Supabase Free project. In Authentication, create an email/password user. This app signs in existing users; it does not provide account signup.
2. Run schema.sql once using SQL Editor. Copy your user's UUID from Authentication.
3. Use the commented SQL at the end of schema.sql to create a hive and device. Generate a unique random device secret of at least 32 characters. Only its SHA-256 hash is stored in the database. Record the device UUID and secret for Arduino.
4. Create an Edge Function called ingest using ingest.ts. Disable gateway JWT verification for this function (CLI: supabase functions deploy ingest --no-verify-jwt). The function authenticates every POST using the device secret. Use the standard server-provided SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables; never place the service-role key in the app or Arduino.
5. In the app's Connect device tab, enter the project URL, publishable/anon key, and the user's email/password. Sign in. The authenticated owner can see only their hive readings and inspections. Device records and key hashes are not exposed to app users.
6. Send HTTPS POST from Arduino or your existing gateway to https://YOUR_PROJECT.supabase.co/functions/v1/ingest. Include Content-Type: application/json and x-device-key: YOUR_DEVICE_SECRET. Keep credentials out of URLs.

Example body (replace both UUIDs and use the actual measurement time):
```json
{"reading_id":"42adef52-c5ab-4e61-b792-41ef6bdbac79","device_id":"YOUR_DEVICE_UUID","measured_at":"2026-10-10T05:00:00Z","temperature_c":29.5,"humidity_pct":67,"co2_ppm":2300,"battery_v":12.4}
```

Generate reading_id once per measurement, and reuse it on retries. Queue failed uploads locally. HTTP 201 means stored; 200 with duplicate=true means already stored. Use backoff for 503. Correct invalid payloads or credentials for 400/401. A 409 means the ID conflicts with another device.

## Use on a phone
Open the deployed app in your phone browser. Use Add to Home Screen when available. The Sites version is owner-private and requires the owning account. To share outside that account, deploy this dist folder to your own Cloudflare Pages project. Do not change database policies to public to share the app.

## Prototype limits
Charts show the latest 10,000 loaded readings across your hives. Live refresh runs every 60 seconds while the app is open. In-app alerts are configurable prototype indicators, not diagnoses; there are no background push or SMS notifications. Login is memory-only and requires signing in again after closing or reloading. Demo mode caches the interface for basic offline use; live readings are not durably cached offline. Free tier quotas and inactivity pausing apply. Export data periodically.

## Validation before field use
Confirm two different users cannot read each other's data. Test wrong device keys, retry duplicates, disconnected uploads, sensor limits, and real device HTTPS support. Live Supabase and Arduino integration must be tested after project setup. Add server rate limiting before broad device deployment.
