# Flora Lebanon App

Expo/React Native mobile app for Flora Lebanon field capture and mission workflows.

## Run

```bash
npm install
npm run start
```

Platform shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Configuration

The app reads runtime config from `default.config.json`.

Important values:

- API base URL
- API prefix
- app environment metadata

Adjust that file per environment before building or publishing.

`default.config.example.json` is a sanitized development template. To use it,
copy its settings into `default.config.json` and replace `YOUR_COMPUTER_LAN_IP`
with the backend computer's LAN address. `app.dev` selects the development API
instead of the production API; `app.log_enabled` controls the shared logger.
Both flags must be `false` for production releases. The app currently reads
this JSON configuration, not a dotenv file. Do not put secrets in either file:
configuration bundled into a mobile app is accessible to its users.

`google-services.json` is Firebase Android client configuration and is tracked
for native builds. Firebase Admin service-account JSON, EAS `credentials.json`,
signing keys, and real `.env` files must not be committed. If dotenv files are
introduced later, commit only sanitized `.env.example` templates.

## Current Features

- auth and guest-aware startup flow
- profile and organization membership flows
- multi-step plant capture and metadata collection
- background location lookup and village preview
- mission flows for missing-photos plants and villages with few submissions
- flowering section with plant detail modal
- offline-friendly submission creation flow

## Notes

- Protected app requests now fail fast locally if no auth token is available.
- Village detection in metadata is best-effort only; the server retries village resolution on submission.
- Permission-denied flows for location/camera/library may direct users to the device Settings app when the OS no longer allows in-app prompts.
