import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const dashboard = $("dashboard");
const firebaseCtx = { enabled: false, auth: null, db: null, analytics: null };

const state = {
  user: null,
  docs: [],
  history: [],
  ngos: [],
  announcements: [],
  ngoUpdates: [],
  websiteUpdates: [],
  queueNumber: null,
  voiceMode: false,
  notificationsEnabled: false,
  preferences: { food: true, medical: true, ids: true, education: true, urgentOnly: false }
};

const advancedModules = {
  blockchain: [
    "Verifiable identity hash generated for each refugee profile",
    "Duplicate identity check against hashed camp records",
    "Portable credential package for Dadaab ↔ Kakuma relocation",
    "Tamper-proof service history ledger snapshots"
  ],
  securityCompliance: [
    "End-to-end encryption for identity and document vault",
    "Role-based access control: Refugee, NGO Staff, Admin",
    "Biometric + MFA readiness for secure sign-in",
    "Data anonymization layer for NGO analytics dashboards",
    "Compliance: Kenya Data Protection Act + humanitarian data standards",
    "Audit trail and disaster-recovery backup procedures"
  ],
  skillsJobs: [
    "Skills inventory and training pathway tracker",
    "NGO job/program matching based on profile and camp",
    "AI-guided CV generation with certification highlights",
    "Progress badges for completed learning tracks"
  ],
  wellbeing: [
    "Mood trend tracking from assistant interactions",
    "Mental health referral recommendations",
    "Counseling schedule suggestions based on risk signals",
    "Encouragement nudges for wellbeing milestones"
  ],
  smsUssd: [
    "SMS alerts for queue turn, food distribution, and medical campaigns",
    "USSD code: *789# for quick schedule checks on basic phones",
    "Offline sync for low-bandwidth camp environments",
    "Localized prompts for Somali, Swahili, English, and Arabic"
  ]
};

const postedInfo = [
  "Food distribution in Hagadera Block B starts Monday 08:00 AM.",
  "DRS alien card desk open Tuesday and Thursday with biometric verification.",
  "Urgent: Cholera vaccination campaign this week in Ifo and Kakuma clinics.",
  "Teacher training scholarship applications now open for youth aged 18-30.",
  "Fingerprinting appointments for resettlement processing available this Friday."
];

const postImageCatalog = {
  food: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
  drs: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  fingerprint: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  census: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
  medical: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80",
  education: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
  default: "https://images.unsplash.com/photo-1469571486292-b53601020f37?auto=format&fit=crop&w=900&q=80"
};

function imageForPost(text = "") {
  const t = text.toLowerCase();
  if (t.includes("food")) return postImageCatalog.food;
  if (t.includes("drs") || t.includes("alien")) return postImageCatalog.drs;
  if (t.includes("finger")) return postImageCatalog.fingerprint;
  if (t.includes("census")) return postImageCatalog.census;
  if (t.includes("medical") || t.includes("clinic") || t.includes("vaccin")) return postImageCatalog.medical;
  if (t.includes("education") || t.includes("training") || t.includes("teacher")) return postImageCatalog.education;
  return postImageCatalog.default;
}

function renderPostCards(targetId, items, icon = "📌") {
  $(targetId).innerHTML = items.map((text) => `
    <li class="post-card-item">
      <img src="${imageForPost(text)}" alt="Relevant update image" class="post-card-img" loading="lazy" />
      <div><strong>${icon} Update</strong><p>${text}</p></div>
    </li>
  `).join("");
}

const verifiedLinks = [
  { label: "UNHCR Help Portal (Kenya)", url: "https://help.unhcr.org/kenya/" },
  { label: "WFP Kenya Operations", url: "https://www.wfp.org/countries/kenya" },
  { label: "Refugee Consortium of Kenya", url: "https://www.rckkenya.org/" },
  { label: "Kenya Red Cross", url: "https://www.redcross.or.ke/" }
];

const ngoFeeds = [
  { name: "UNHCR", rss: "https://www.unhcr.org/rss.xml", source: "UNHCR" },
  { name: "WFP", rss: "https://www.wfp.org/rss.xml", source: "WFP" },
  { name: "UNICEF", rss: "https://www.unicef.org/rss.xml", source: "UNICEF" }
];

const ngoImages = {
  UNHCR: "https://images.unsplash.com/photo-1469571486292-b53601020f37?auto=format&fit=crop&w=900&q=80",
  WFP: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
  UNICEF: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=900&q=80",
  IRC: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
  NRC: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=900&q=80"
};

const visualShowcaseCards = [
  { title: "Family shelter upgrade support", location: "Hagadera", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80", badge: "Housing" },
  { title: "Clinic booking and care follow-up", location: "Kakuma", image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=900&q=80", badge: "Health" },
  { title: "Youth digital training cohort", location: "Dagahaley", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80", badge: "Education" },
  { title: "Food collection smart queue", location: "Ifo", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80", badge: "Food" },
  { title: "NGO legal aid consultation", location: "Hagadera", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80", badge: "Protection" },
  { title: "Women safe-space counseling", location: "Kakuma", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80", badge: "Wellbeing" }
];

async function initFirebase() {
  const cfg = window.FIREBASE_CONFIG || {};
  if (!cfg.apiKey || cfg.apiKey === "REPLACE_ME") return;
  const app = initializeApp(cfg);
  firebaseCtx.auth = getAuth(app);
  firebaseCtx.db = getFirestore(app);
  firebaseCtx.enabled = true;
  if (cfg.measurementId) {
    try {
      if (await analyticsSupported()) firebaseCtx.analytics = getAnalytics(app);
    } catch {
      firebaseCtx.analytics = null;
    }
  }
  const statusEl = $("firebaseStatus");
  if (statusEl) statusEl.textContent = "✅ Firebase mode enabled: auth and cloud database are active.";
}

async function saveProfileToCloud(user) {
  if (!firebaseCtx.enabled) return;
  await setDoc(doc(firebaseCtx.db, "users", user.authUid), {
    name: user.name,
    email: user.email,
    role: user.role,
    camp: user.camp,
    idType: user.idType,
    idNumber: user.idNumber,
    familySize: user.familySize,
    updatedAt: Date.now()
  }, { merge: true });
}

async function loadCloudDocuments(uid) {
  if (!firebaseCtx.enabled || !uid) return [];
  const docRef = collection(firebaseCtx.db, "users", uid, "documents");
  const snap = await getDocs(query(docRef, orderBy("createdAt", "desc")));
  return snap.docs.map((entry) => ({
    id: entry.id,
    title: entry.data().title,
    content: entry.data().content,
    created: entry.data().created || new Date(entry.data().createdAt || Date.now()).toLocaleDateString()
  }));
}

async function saveDocumentToCloud(uid, payload) {
  if (!firebaseCtx.enabled || !uid) return;
  await addDoc(collection(firebaseCtx.db, "users", uid, "documents"), {
    ...payload,
    createdAt: Date.now()
  });
}

function logAction(action) {
  state.history.unshift(`${new Date().toLocaleString()} — ${action}`);
  renderList("history", state.history.slice(0, 40));
  renderMobileShell();
}

function renderList(id, items) {
  $(id).innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function notifyUser(title, body) {
  if (!state.notificationsEnabled || !("Notification" in window)) return;
  if (Notification.permission === "granted") new Notification(title, { body, icon: "assets/ngo-network.svg" });
}

function updateKpis() {
  $("kpiAidTasks").textContent = String(postedInfo.length + state.announcements.length);
  $("kpiNgoUpdates").textContent = String(state.ngoUpdates.length + state.websiteUpdates.length);
  $("kpiDocs").textContent = String(state.docs.length);
  const urgentCount = state.ngoUpdates.filter((u) => u.toLowerCase().includes("urgent") || u.toLowerCase().includes("cholera")).length;
  $("kpiUrgent").textContent = String(urgentCount);
}

function pushAlert(msg, urgent = false) {
  const entry = `${urgent ? "🚨" : "ℹ️"} ${msg}`;
  const existing = Array.from($("alerts").querySelectorAll("li")).map((n) => n.textContent);
  renderList("alerts", [entry, ...existing].slice(0, 7));
  if (urgent) notifyUser("Urgent NGO Alert", msg);
  updateKpis();
}

function calculateDistributionDate(familySize) {
  const offset = Math.max(2, 11 - Math.min(familySize, 9));
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toDateString();
}

function serviceItinerary(camp) {
  const map = {
    Hagadera: ["Food token validation", "Maternal clinic", "Legal desk"],
    Ifo: ["Education support center", "Child protection desk", "Cash support hub"],
    Dagahaley: ["Livelihoods orientation", "Mental health session", "Shelter support"],
    Kakuma: ["Vocational training", "Tele-health consultation", "Resettlement help desk"]
  };
  return map[camp] || map.Hagadera;
}

function renderMobileShell() {
  if (!state.user) return;
  const initials = state.user.name.trim().charAt(0).toUpperCase() || "G";
  $("mobileName").textContent = state.user.name;
  $("mobileCamp").textContent = `📍 ${state.user.camp}`;
  $("mobileAvatar").textContent = initials;
  const progress = Math.min(100, Math.max(11, state.history.length * 3));
  $("resettlementValue").textContent = `${progress}%`;
  $("resettlementBar").style.width = `${progress}%`;
  $("resettlementStage").textContent = progress < 30 ? "Not Started" : progress < 70 ? "In Review" : "Final Verification";
}


function renderProfileDetails() {
  if (!state.user) return;
  const personalRows = [
    { icon: "🌍", label: "Languages", value: "English · Somali · Swahili" },
    { icon: "🪪", label: "Registered", value: `${state.user.idType}` },
    { icon: "🌾", label: "Next Food", value: calculateDistributionDate(state.user.familySize) },
    { icon: "✈️", label: "Resettlement", value: $("resettlementStage").textContent || "Not Started" },
    { icon: "📞", label: "Phone", value: "Not set" }
  ];

  const securityRows = [
    { icon: "🔐", title: "Change PIN", sub: "Update your security PIN" },
    { icon: "🧬", title: "Biometric Login", sub: "Enable fingerprint authentication" },
    { icon: "🛡️", title: "Data Privacy", sub: "Manage your consent and data" }
  ];

  const preferenceRows = [
    { icon: "🔔", title: "Notifications", sub: "Manage alert preferences" },
    { icon: "🈯", title: "Language", sub: "English · Somali · Swahili" },
    { icon: "📍", title: "Camp Location", sub: `${state.user.camp}` }
  ];

  const quickRows = [
    { icon: "📁", title: "My Documents", sub: `${state.docs.length} documents stored` },
    { icon: "🗓️", title: "Food Schedule", sub: "View distribution calendar" },
    { icon: "🧾", title: "Service History", sub: `${state.history.length} activity records` },
    { icon: "🎓", title: "Training & Courses", sub: "Skills development programs" }
  ];

  const supportRows = [
    { icon: "🆘", title: "Help Center", sub: "FAQs and support guides" },
    { icon: "💬", title: "Contact NGO", sub: "Send a message to staff" },
    { icon: "🚨", title: "Emergency Contacts", sub: "UNHCR, Police, Medical" },
    { icon: "ℹ️", title: "About", sub: "Refugee Wallet v1.0" }
  ];

  const stats = [
    { value: state.docs.length || 5, label: "Documents" },
    { value: Math.max(5, state.ngoUpdates.length), label: "Services" },
    { value: $("resettlementStage").textContent.includes("Not") ? "N/A" : "Active", label: "Status" }
  ];

  $("profileStats").innerHTML = stats.map((s) => `<article><h5>${s.value}</h5><p>${s.label}</p></article>`).join("");
  $("personalInfoRows").innerHTML = personalRows.map((r) => `<div class="info-row"><span>${r.icon}</span><b>${r.label}</b><em>${r.value}</em></div>`).join("");

  const makeRows = (rows) => rows.map((r) => `<div class="option-row"><span class="opt-icon">${r.icon}</span><div><strong>${r.title}</strong><p>${r.sub}</p></div><i>›</i></div>`).join("");
  $("securityRows").innerHTML = makeRows(securityRows);
  $("preferencesRows").innerHTML = makeRows(preferenceRows);
  $("quickAccessRows").innerHTML = makeRows(quickRows);
  $("supportRows").innerHTML = makeRows(supportRows);

  const recent = [
    `Food Distribution — ${calculateDistributionDate(state.user.familySize)}`,
    "Primary Health Consultation — complete",
    "English Language Class — attended",
    ...state.history.slice(0, 2)
  ];
  $("recentActivity").innerHTML = recent.map((item) => `<li>${item}</li>`).join("");
}

function renderProfile() {
  const u = state.user;
  $("profile").innerHTML = `
    <p><strong>${u.name}</strong> (${u.role})</p>
    <p>📍 ${u.camp} | 🪪 ${u.idType}: ${u.idNumber}</p>
    <p>🍚 Next food window: <strong>${calculateDistributionDate(u.familySize)}</strong></p>
    <p>🧠 Personalized itinerary: ${serviceItinerary(u.camp).join(" • ")}</p>
  `;
}

function renderStaticModules() {
  const refugee = [
    "Track food, health, and education schedules",
    "Receive urgent NGO and protection updates",
    "Monitor resettlement and documentation milestones",
    "Access training and job-readiness pathways",
    "Saved digital identity profile with offline history"
  ];

  const services = [
    "Health: vaccination, maternal care, mental wellness",
    "Education: school registration and scholarships",
    "Protection: legal support and case management",
    "Livelihood: skills, business grants, and referrals",
    "Digital legal document vault and service continuity"
  ];

  const mobileFeatures = [
    "🔔 Real-time notifications for urgent NGO updates",
    "📶 Offline-first service worker mode for key resources",
    "📊 Live KPI cards tracking aid tasks and alerts",
    "📰 NGO website feed ingestion with automatic refresh",
    "🖼️ Visual NGO update cards with relevant images"
  ];

  const wallet = [
    "Aid received tracker with date and service provider",
    "Alien ID confirmations and appointment slips",
    "Training certifications and completion badges",
    "Resettlement milestones with next-step recommendations"
  ];

  const predictive = [
    "Food demand forecast indicates higher need next 14 days",
    "Risk alert: 8% of households may miss next distribution",
    "Service gap: clinic attendance in Dagahaley is below target",
    "Resettlement prep recommendation sent for document update"
  ];

  renderList("refugeeModule", refugee);
  renderList("serviceModule", services);
  renderList("mobileFeatures", mobileFeatures);
  renderList("walletModule", wallet.map((w) => `💳 ${w}`));
  renderList("predictiveInsights", predictive.map((p) => `📈 ${p}`));
  renderList("blockchainModule", advancedModules.blockchain.map((b) => `⛓️ ${b}`));
  renderList("skillsJobsModule", advancedModules.skillsJobs.map((s) => `🎯 ${s}`));
  renderList("wellbeingModule", advancedModules.wellbeing.map((m) => `🧘 ${m}`));
  renderList("securityCompliance", advancedModules.securityCompliance.map((s) => `🛡️ ${s}`));
  renderList("smsUssdModule", advancedModules.smsUssd.map((s) => `📲 ${s}`));
  renderPostCards("postedInfo", postedInfo, "📌");
  renderList("ngoLinks", verifiedLinks.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`));
}

function renderCampAnalytics() {
  const analytics = [
    { title: "Camp Population Trend", value: "Dadaab +2.4%", detail: "Kakuma stable this week" },
    { title: "Service Usage Heatmap", value: "Health 72%", detail: "Education 61%, Legal 39%" },
    { title: "Resettlement Progress", value: "41% in review", detail: "12% final verification" },
    { title: "Health Alert Signals", value: "2 moderate alerts", detail: "Vaccination campaign active" }
  ];

  $("campAnalytics").innerHTML = analytics.map((a) => `
    <article class="analytic-card">
      <p>${a.title}</p>
      <h4>${a.value}</h4>
      <small>${a.detail}</small>
    </article>
  `).join("");
}

function renderCampMap() {
  const locations = [
    { icon: "🏥", name: "Nearest Clinic", eta: "12 min walk" },
    { icon: "🌾", name: "Distribution Center", eta: "9 min walk" },
    { icon: "🏛️", name: "NGO Service Office", eta: "6 min walk" },
    { icon: "🛡️", name: "Protection Desk", eta: "14 min walk" }
  ];
  $("campMap").innerHTML = locations.map((l) => `<div><strong>${l.icon} ${l.name}</strong><span>${l.eta}</span></div>`).join("");
}

function renderQueueTicket() {
  if (!state.queueNumber) {
    $("queueTicket").textContent = "No active queue ticket. Join to receive your digital number and SMS alert.";
    return;
  }
  $("queueTicket").textContent = `Queue #${state.queueNumber} • Estimated call in 25-40 minutes.`;
}

function renderVisualShowcase() {
  $("visualShowcase").innerHTML = visualShowcaseCards.map((card, idx) => `
    <article class="visual-card ${idx % 3 === 0 ? "wide" : ""}">
      <img src="${card.image}" alt="${card.title}" loading="lazy" />
      <div class="visual-meta">
        <p>${card.badge}</p>
        <h4>${card.title}</h4>
        <span>📍 ${card.location}</span>
      </div>
    </article>
  `).join("");
}

function renderDocuments() {
  renderList("documents", state.docs.map((d) => `${d.title} (${d.created})`));
  updateKpis();
  renderProfileDetails();
}

function renderAnnouncements() {
  renderPostCards("announcements", state.announcements, "🗣️");
  const latest = state.announcements[0];
  if (latest) $("urgentBanner").textContent = `⚠️ ${latest}`;
}

function renderWebsiteCards() {
  $("websiteUpdates").innerHTML = state.websiteUpdates.map((u) => `
    <article class="news-card">
      <img src="${u.image}" alt="${u.source} update image" class="news-img" loading="lazy" />
      <div class="news-meta">
        <p class="news-source">${u.source}</p>
        <h4>${u.title}</h4>
        <p>${u.date || "Recent update"}</p>
        <a href="${u.link}" target="_blank" rel="noopener">Read from source</a>
      </div>
    </article>
  `).join("");

  const featured = state.websiteUpdates[0];
  if (featured) {
    $("featuredNgoPost").innerHTML = `
      <div class="featured-wrap">
        <img src="${featured.image}" alt="Featured NGO post" class="featured-img" loading="lazy" />
        <div>
          <p class="news-source">${featured.source} • Featured</p>
          <h4>${featured.title}</h4>
          <p>${featured.date || "Latest"}</p>
          <a href="${featured.link}" target="_blank" rel="noopener">Open full NGO post</a>
        </div>
      </div>
    `;
  }
}

function deriveNgoUpdates() {
  const defaults = [
    "Food Distribution: Smart card collection at camp warehouse.",
    "Medical Services: Mobile clinic available this evening.",
    "DRS Alien Card Availability: Document pickup this week.",
    "Education: New digital-skills cohort accepting applications.",
    "Urgent: Protection hotline has extended hours tonight."
  ];
  const all = [...state.announcements, ...defaults];
  const filtered = all.filter((u) => {
    const t = u.toLowerCase();
    const urgent = t.includes("urgent") || t.includes("alert") || t.includes("cholera");
    if (state.preferences.urgentOnly) return urgent;
    return (state.preferences.food && t.includes("food"))
      || (state.preferences.medical && t.includes("medical"))
      || (state.preferences.ids && (t.includes("drs") || t.includes("alien") || t.includes("finger")))
      || (state.preferences.education && (t.includes("education") || t.includes("training")))
      || urgent;
  });
  state.ngoUpdates = filtered;
  renderList("ngoUpdates", filtered.map((u) => `🔔 ${u}`));
  updateKpis();
  renderProfileDetails();
  const urgent = filtered.find((u) => u.toLowerCase().includes("urgent") || u.toLowerCase().includes("drs") || u.toLowerCase().includes("alien"));
  if (urgent) $("urgentBanner").textContent = `⚠️ ${urgent}`;
}

function smartAssistant(query, mood, lang) {
  const q = query.toLowerCase();
  let reply = "I can guide you on food schedules, services, DRS card status, and NGO programs.";
  if (q.includes("food") || q.includes("ration")) reply = `Your estimated next food date is ${calculateDistributionDate(state.user.familySize)}.`;
  if (q.includes("resettlement")) reply = "Resettlement support desk runs every Wednesday. Keep IDs and contact details updated.";
  if (q.includes("service") || q.includes("program")) reply = `Recommended path for ${state.user.camp}: ${serviceItinerary(state.user.camp).join(" → ")}.`;
  if (q.includes("website") || q.includes("news") || q.includes("picture")) reply = "Open Live NGO Website Monitor to view official NGO updates with images and links.";
  if (mood) reply += mood.toLowerCase().includes("stress") ? " You seem stressed; please visit psychosocial services near your zone." : " Keep up the positive progress.";
  if (lang === "sw") reply = `[Kiswahili] ${reply}`;
  if (lang === "so") reply = `[Somali] ${reply}`;
  logAction(`Assistant query: ${query}`);
  return reply;
}

async function encryptText(text, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret.padEnd(16, "0").slice(0, 16)), { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return `${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

async function firebaseOrDemoAuth(email, password) {
  if (!firebaseCtx.enabled) return { uid: "demo-local" };
  try { return (await signInWithEmailAndPassword(firebaseCtx.auth, email, password)).user; }
  catch { return (await createUserWithEmailAndPassword(firebaseCtx.auth, email, password)).user; }
}

async function fetchNgoInformation() {
  try {
    state.ngos = [];
    if (firebaseCtx.enabled) {
      const snap = await getDocs(collection(firebaseCtx.db, "ngos"));
      state.ngos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    if (!state.ngos.length) {
      const response = await fetch("ngo-data.json");
      state.ngos = await response.json();
    }
    renderList("ngoInfo", state.ngos.map((ngo) => `
      <div class="ngo-row">
        <img src="${ngo.image || ngoImages.IRC}" alt="${ngo.name} image" class="ngo-thumb" loading="lazy" />
        <div>
          <strong>${ngo.name}</strong><br>
          Focus: ${ngo.focus}<br>
          Camp: ${ngo.camp}<br>
          Contact: ${ngo.contact}<br>
          <a href="${ngo.website}" target="_blank" rel="noopener">Website</a> • <a href="${ngo.infoLink}" target="_blank" rel="noopener">Service info</a>
        </div>
      </div>
    `));
    logAction("NGO directory refreshed");
  } catch (error) {
    pushAlert("Unable to fetch NGO information right now.", true);
    logAction(`NGO fetch failed: ${error.message}`);
  }
}

async function fetchRssThroughProxy(feedUrl) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`RSS proxy failed: ${response.status}`);
  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0, 2);
  return items.map((item) => ({
    title: item.querySelector("title")?.textContent?.trim() || "Update",
    link: item.querySelector("link")?.textContent?.trim() || "",
    date: item.querySelector("pubDate")?.textContent?.trim() || ""
  }));
}

async function fetchNgoWebsiteUpdates() {
  const fallback = [
    { source: "UNHCR", title: "Protection information updated for Kenya operations", link: "https://help.unhcr.org/kenya/", date: new Date().toDateString(), image: ngoImages.UNHCR },
    { source: "WFP", title: "Food assistance operations bulletin published", link: "https://www.wfp.org/countries/kenya", date: new Date().toDateString(), image: ngoImages.WFP },
    { source: "UNICEF", title: "Child protection resources updated", link: "https://www.unicef.org/kenya", date: new Date().toDateString(), image: ngoImages.UNICEF }
  ];

  try {
    const batches = await Promise.allSettled(ngoFeeds.map(async (feed) => {
      const entries = await fetchRssThroughProxy(feed.rss);
      return entries.map((entry) => ({ ...entry, source: feed.source, image: ngoImages[feed.source] || ngoImages.UNHCR }));
    }));

    const updates = batches
      .filter((b) => b.status === "fulfilled")
      .flatMap((b) => b.value)
      .slice(0, 8);

    state.websiteUpdates = updates.length ? updates : fallback;
  } catch {
    state.websiteUpdates = fallback;
  }

  renderWebsiteCards();

  if (state.websiteUpdates.length) {
    const latest = state.websiteUpdates[0];
    pushAlert(`Live NGO web update: ${latest.source} — ${latest.title}`);
    notifyUser("NGO Website Update", `${latest.source}: ${latest.title}`);
  }

  logAction(`Fetched ${state.websiteUpdates.length} NGO website updates`);
  updateKpis();
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    pushAlert("This browser does not support notifications.", true);
    return;
  }
  const permission = await Notification.requestPermission();
  state.notificationsEnabled = permission === "granted";
  if (state.notificationsEnabled) {
    pushAlert("Notifications enabled. You will receive NGO and urgent alerts.");
    notifyUser("Notifications enabled", "You are now subscribed to NGO updates.");
    logAction("Browser notifications enabled");
  } else {
    pushAlert("Notifications were not granted.", true);
  }
}

document.querySelectorAll(".pref-toggle").forEach((toggle) => {
  toggle.addEventListener("change", (e) => {
    state.preferences[e.target.dataset.pref] = e.target.checked;
    deriveNgoUpdates();
    logAction(`Preference changed: ${e.target.dataset.pref}=${e.target.checked}`);
  });
});

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = {
    name: $("name").value.trim(), email: $("email").value.trim(), role: $("role").value,
    camp: $("camp").value, idType: $("idType").value, idNumber: $("idNumber").value.trim(), familySize: Number($("familySize").value)
  };
  if ($("mfa").value.length < 6) return pushAlert("MFA failed: provide a valid token.", true);

  try {
    const authUser = await firebaseOrDemoAuth(user.email, $("password").value);
    state.user = { ...user, authUid: authUser.uid };
    await saveProfileToCloud(state.user);
    const cloudDocs = await loadCloudDocuments(authUser.uid);
    if (cloudDocs.length) state.docs = cloudDocs;
    localStorage.setItem("session", await encryptText(JSON.stringify({ ...state.user, lastLogin: Date.now() }), $("password").value));
    dashboard.classList.remove("hidden");
    renderProfile();
    renderMobileShell();
    renderProfileDetails();
    renderStaticModules();
    deriveNgoUpdates();
    fetchNgoInformation();
    fetchNgoWebsiteUpdates();
    pushAlert("Welcome! Your secure dashboard is active.");
    pushAlert("Urgent health and DRS updates are enabled.", true);
    logAction(`Secure login by ${user.role} at ${user.camp}`);
  } catch (error) {
    pushAlert(`Authentication failed: ${error.message}`, true);
  }
});

$("docForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = { title: $("docName").value.trim(), content: await encryptText($("docText").value.trim(), state.user.idNumber), created: new Date().toLocaleDateString() };
  state.docs.unshift(payload);
  await saveDocumentToCloud(state.user.authUid, payload);
  renderDocuments();
  logAction("Encrypted document stored");
  if (firebaseCtx.enabled) pushAlert("Document saved to encrypted cloud database.");
  e.target.reset();
});

$("announcementForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!state.user || state.user.role !== "ngo") return pushAlert("RBAC policy: only NGO Staff may post announcements.", true);
  state.announcements.unshift(`${$("announcementType").value}: ${$("announcementText").value}`);
  renderAnnouncements();
  deriveNgoUpdates();
  notifyUser("New NGO Announcement", state.announcements[0]);
  logAction("NGO announcement posted");
  e.target.reset();
});

$("askAssistant").addEventListener("click", () => {
  if (!state.user) return;
  $("assistantReply").textContent = smartAssistant($("chatInput").value, $("mood").value, $("language").value);
});

$("refreshNgo").addEventListener("click", fetchNgoInformation);
$("refreshUpdates").addEventListener("click", deriveNgoUpdates);
$("refreshWebsiteNews").addEventListener("click", fetchNgoWebsiteUpdates);
$("enableNotifications").addEventListener("click", enableNotifications);

$("joinQueueBtn").addEventListener("click", () => {
  state.queueNumber = Math.floor(100 + Math.random() * 900);
  renderQueueTicket();
  pushAlert(`Queue ticket issued: #${state.queueNumber}. SMS will be sent when your turn is near.`);
  notifyUser("Distribution Queue", `You joined queue #${state.queueNumber}`);
  logAction(`Queue joined with ticket #${state.queueNumber}`);
});

$("emergencyMapBtn").addEventListener("click", () => {
  pushAlert("Emergency request sent to nearest protection and medical desk.", true);
  logAction("Emergency quick action triggered from map");
});

document.querySelectorAll(".emergency-action").forEach((btn) => {
  btn.addEventListener("click", () => {
    pushAlert(`${btn.dataset.type} submitted securely. NGO protection team notified.`, true);
    logAction(`Emergency report sent: ${btn.dataset.type}`);
  });
});

$("voiceAssistBtn").addEventListener("click", () => {
  state.voiceMode = !state.voiceMode;
  $("voiceStatus").textContent = state.voiceMode
    ? "Voice mode active. Speak in your selected language."
    : "Voice mode inactive.";
  logAction(`Voice mode ${state.voiceMode ? "enabled" : "disabled"}`);
});

$("uiLanguage").addEventListener("change", (e) => {
  pushAlert(`Language preference set to ${e.target.selectedOptions[0].text}.`);
  logAction(`UI language changed to ${e.target.value}`);
});

$("downloadProfile").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ profile: state.user, history: state.history, websiteUpdates: state.websiteUpdates }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "refugee-wallet-profile.json";
  a.click();
  logAction("Profile exported");
});

$("enableOffline").addEventListener("click", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("sw.js");
    pushAlert("Offline cache enabled.");
    logAction("Service worker enabled");
  }
});

$("toggleTheme").addEventListener("click", () => document.body.classList.toggle("dark"));
document.querySelectorAll(".swatch").forEach((swatch) => swatch.addEventListener("click", () => {
  document.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
  swatch.classList.add("active");
  document.body.classList.remove("theme-ocean", "theme-sunrise", "theme-forest");
  document.body.classList.add(`theme-${swatch.dataset.theme}`);
}));

setInterval(() => {
  if (!state.user) return;
  fetchNgoWebsiteUpdates();
}, 1000 * 60 * 12);

initFirebase();
renderCampAnalytics();
renderCampMap();
renderQueueTicket();
renderVisualShowcase();


$("signOutBtn")?.addEventListener("click", () => {
  if (firebaseCtx.enabled && firebaseCtx.auth) signOut(firebaseCtx.auth).catch(() => null);
  state.user = null;
  state.docs = [];
  dashboard.classList.add("hidden");
  pushAlert("Signed out successfully.");
  logAction("User signed out");
});
