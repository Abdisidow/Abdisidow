# Refugee Digital Identity and Life-Progress Wallet

A cloud-ready, secure, and AI-powered web prototype tailored for refugees in **Dadaab (Hagadera, Ifo, Dagahaley)** and **Kakuma** camps in Kenya.

## Core capabilities

- **Refugee module**
  - Secure registration/login with ration card or alien ID.
  - Firebase-backed authentication flow (email/password) with demo fallback mode.
  - Personal dashboard with identity profile, food schedule prediction, health/education program visibility, resettlement tracking, training opportunities, and NGO messaging access.
- **NGO staff module**
  - Role-restricted announcement posting for food distribution, DRS Alien card updates, fingerprinting, census, and medical services.
  - Service delivery history logging and quick operational communication.
- **Service module**
  - Centralized listing of cross-camp humanitarian services for easier discovery and referrals.
- **NGO information + toggleable updates feature**
  - Pulls NGO directory data from **Firebase Firestore** (`ngos` collection) when configured.
  - Falls back to local API data (`ngo-data.json`) for offline/demo environments.
  - Adds refugee-controlled update toggles (food, medical, ID/DRS, education, urgent-only) to personalize NGO update feeds.
- **Advanced mobile-style features**
  - KPI summary cards for aid tasks, NGO updates, secure docs, and urgent alerts.
  - Browser notification support for urgent NGO and website updates.
  - Live NGO website monitor that fetches RSS updates from official NGO websites (with resilient fallback).
  - Visual NGO post cards with relevant images in website-monitor and directory sections.
  - Auto-refresh NGO website feed polling to keep users informed.
- **AI refugee assistant**
  - Service discovery and itinerary generation.
  - Food distribution date estimation from household size.
  - Alien card and resettlement guidance.
  - Mood-aware support prompts and multilingual responses (English/Kiswahili/Somali).
  - Behavior logging for recommendation personalization.
- **Privacy and security foundations**
  - MFA code gate (demo flow).
  - Role-based access control checks.
  - AES-GCM encryption for local sensitive records.
  - Audit log of sensitive actions.
  - Exportable profile snapshot.
- **Resilience features**
  - Service worker-based offline caching for key assets.
  - Smart urgent alerts.


## UI and information enhancements

- Modern animated UI with selectable color themes (Ocean, Sunrise, Forest) and dark mode.
- Visual hero and NGO network illustrations under `assets/` for a richer and more attractive experience.
- Camp announcements board with relevant posted operational information (food, DRS, health, training, fingerprinting).
- Verified NGO/service links and enhanced NGO directory entries with website + service info links.


## Advanced innovation modules added

- Blockchain-style identity verification panel with duplicate prevention and tamper-proof history concepts.
- Predictive AI insights for food demand, missed distribution risk, service gaps, and resettlement readiness.
- Real-time analytics dashboard cards for population trends, service usage, resettlement, and health alerts.
- Smart camp navigation panel with nearest clinic/distribution/NGO points and emergency quick action.
- Life-Progress wallet tracker for aid, documents, certifications, and milestones.
- Smart queue ticketing with digital number generation and notification flow.
- Multi-language + voice mode controls (English, Kiswahili, Somali, Arabic).
- Emergency and protection reporting actions (GBV, child protection, anonymous channel).
- Skills/jobs module with training pathways and CV support concepts.
- Security/compliance panel highlighting Kenya Data Protection Act and humanitarian standards alignment.
- SMS/USSD low-bandwidth accessibility module for basic-phone users.
- Visual service highlight gallery with relevant photo cards (housing, health, education, food, legal support, wellbeing) inspired by modern mobile card layouts.
- Camp announcement board and NGO staff posted updates now render with relevant contextual images (food, medical, DRS/ID, census, education, protection).

## Project structure

- `index.html`: Responsive multi-module UI + Firebase config injection point.
- `styles.css`: Mobile-first design system.
- `app.js`: Firebase auth integration, NGO fetch, toggleable NGO updates feed logic, AI assistant logic, encryption, RBAC, alerts, and interaction handlers.
- `ngo-data.json`: Fallback NGO directory data source.
- `sw.js`: Offline caching service worker.
- `manifest.json`: PWA metadata.

## Run locally

```bash
python3 -m http.server 4173
```

Then open: `http://localhost:4173`

## Firebase setup

This app now supports **real Firebase authentication + cloud database storage** and is preconfigured with the provided Firebase project credentials.

Firebase is loaded using **browser CDN module scripts** (`https://www.gstatic.com/firebasejs/...`) — no npm install is required for auth/firestore/analytics in this project.

### What you must provide
From Firebase Console → **Project settings** → **Your apps (Web app)**, copy these values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId` (optional, for Analytics)

Then set `window.FIREBASE_CONFIG` in `index.html`:

```js
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

> Current repository default is configured to `refugee-c94df`. Replace values if you want to use your own Firebase project.

### Firebase services to enable
1. **Authentication** → enable **Email/Password** sign-in method.
2. **Cloud Firestore** → create database in production or test mode.
3. (Optional) **Cloud Storage** for future binary uploads.

### Firestore data used by the app
- `ngos` (collection): NGO directory source.
- `users/{uid}` (document): refugee/user profile metadata.
- `users/{uid}/documents` (subcollection): encrypted document records saved from the wallet.

Example NGO document (`ngos` collection):

```json
{
  "name": "UNHCR Dadaab Field Office",
  "focus": "Protection, registration, legal aid",
  "camp": "Hagadera / Ifo / Dagahaley",
  "contact": "+254-700-000-101",
  "website": "https://help.unhcr.org/kenya/",
  "infoLink": "https://help.unhcr.org/kenya/where-to-find-help/"
}
```

## Cloud and scale architecture (recommended production evolution)

1. **Frontend**: Host on CDN (CloudFront/Azure Front Door) with WAF.
2. **API Layer**: Stateless microservices (identity, service-catalog, announcements, AI-assistant, audit).
3. **Data Layer**:
   - Encrypted relational DB for user/service records.
   - Object storage for digital documents (server-side encryption + lifecycle policies).
   - Search index for cross-service discovery.
4. **Security**:
   - IAM-backed RBAC/ABAC.
   - Hardware-backed key management (KMS/HSM).
   - MFA + biometric integration via trusted device APIs.
   - Full audit trail and SIEM integration.
5. **AI Layer**:
   - Safe-guardrailed assistant service with translation, recommendations, and mood triage.
   - Human-in-loop escalation for protection-sensitive cases.
6. **Offline-first**:
   - Service worker and encrypted local sync queue.
   - Conflict-resolution when reconnecting.

## Humanitarian data protection considerations

- Data minimization and purpose limitation.
- Consent and transparent processing notices.
- Access controls by role and need-to-know.
- Secure incident response and breach notification playbooks.
- Compliance alignment with UNHCR/ICRC humanitarian data protection principles.


## Deploy (Firebase Hosting)

1. Install Firebase CLI on your machine:

```bash
npm install -g firebase-tools
```

2. Authenticate and select your project:

```bash
firebase login
firebase use --add
```

3. Update `.firebaserc` default project id if needed, then deploy:

```bash
firebase deploy --only hosting
```

After deploy, Firebase prints a public URL like:
- `https://<your-project-id>.web.app`

## Deploy (Netlify Drop or CLI)

- Drag-and-drop this repository folder into Netlify Drop, or use Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir .
```

## Connect this project to your GitHub repository

Because GitHub account credentials are private to your device, run these commands locally from the project folder:

```bash
git init
bash scripts/connect-github.sh https://github.com/<your-username>/<your-repository>.git
```

If the repository is empty, the script will set `origin` and push your current branch. If `origin` already exists, it updates it before pushing.

Alternative (manual commands):

```bash
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push -u origin $(git branch --show-current)
```
