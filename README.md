# LinkRTC

A mobile app that matches a person's medical profile against real clinical
trials from [ClinicalTrials.gov](https://clinicaltrials.gov). It works offline
with a bundled trial set, or pulls live data over the internet.

> Informational matching only — not medical advice. It does not diagnose, treat,
> or tell anyone to join a study. Final eligibility is decided by the trial team.

## Features

- **Sign-in screen** (demo: any email + any 8+ char password signs you in).
- **Pre-filled demo profile** so the match feed is populated immediately.
- **Two data sources**, switchable in Settings:
  - **Demo** — 3,131 trials bundled in the app, fully offline.
  - **Live** — fresh recruiting trials fetched from ClinicalTrials.gov (public
    API, no key), biased to Massachusetts, over the phone's internet.
- **Matching** by the user's own conditions — each result shows only the
  condition(s) *you* match, not the trial's whole list.
- **Sorted by nearest first** (Live mode, using your location + trial coords).
- **Trial detail**: an "About this trial" summary, phase/type/enrollment, and —
  for live trials — a **map** of the site in Massachusetts with your location
  and the distance between you.
- **Save trials** for later.
- Accessibility: large text, high-contrast colors, big touch targets, and
  screen-reader labels.

## Tech

- React Native + Expo (SDK 58), TypeScript
- On-device matching engine: `src/data/matching.ts`
- Bundled dataset: `src/data/trials.json`
- Live API client: `src/data/liveApi.ts`
- Map (Leaflet / OpenStreetMap in a WebView): `src/components/TrialMap.tsx`

## Project layout

```
src/
  api/         data layer (profile, trials, auth, settings)
  data/        trials.json, matching engine, live API client, local store,
               user-location helper, trial mapper
  components/  TrialMap (OpenStreetMap view)
  screens/     Onboarding (sign-in), MatchFeed, TrialDetail, SavedTrials,
               Settings, MedicalProfile
  navigation/  app navigator
  context/     auth context
android/       native Android project (icon assets, manifest, build config)
```

## Run in development

```bash
npm install
npx expo start
```

## Build a standalone APK

Requires the Android SDK and JDK 17.

```bash
cd android
./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

## Data source

ClinicalTrials.gov v2 API (Massachusetts, recruiting). Bundled records hold
NCT id, title, phase, conditions, city, and status; live records additionally
include coordinates, facility, and a summary.
