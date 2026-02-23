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

Set `window.FIREBASE_CONFIG` in `index.html` with your project credentials:

```js
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
};
```

Firestore structure for NGO feed (collection: `ngos`):

```json
{
  "name": "UNHCR Dadaab Field Office",
  "focus": "Protection, registration, legal aid",
  "camp": "Hagadera / Ifo / Dagahaley",
  "contact": "+254-700-000-101"
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
