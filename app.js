import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const state = {
  user: null,
  alerts: [],
  history: [],
  docs: [],
  announcements: [],
  ngos: [],
  ngoUpdates: [],
  preferences: { food: true, medical: true, id: true, education: true, urgent: true },
  services: [
    "Food distribution schedule and voucher support",
    "Primary and maternal healthcare clinics",
    "Education and scholarship pathways",
    "Child protection and psychosocial support",
    "Skills training and livelihood programs",
    "Legal aid, registration, and resettlement counseling"
  ]
};

const $ = (id) => document.getElementById(id);
const dashboard = $("dashboard");
let firebaseCtx = { auth: null, db: null, enabled: false };

function logAction(action) {
  state.history.unshift(`${new Date().toLocaleString()} - ${action}`);
  $("history").innerHTML = state.history.map((h) => `<li>${h}</li>`).join("");
}

function pushAlert(text, urgent = false) {
  state.alerts.unshift(`${urgent ? "🚨" : "ℹ️"} ${text}`);
  $("alerts").innerHTML = state.alerts.map((a) => `<li>${a}</li>`).join("");
}

function initFirebase() {
  const config = window.FIREBASE_CONFIG || {};
  if (!config.apiKey || config.apiKey === "REPLACE_ME") {
    pushAlert("Firebase not configured; using demo local auth mode.", true);
    return;
  }
  const app = initializeApp(config);
  firebaseCtx = { auth: getAuth(app), db: getFirestore(app), enabled: true };
}

const enc = new TextEncoder();
const keyFromPassword = async (password) => {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("refugee-wallet-salt"), iterations: 150000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

async function encryptText(text, password) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFromPassword(password);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

const calculateDistributionDate = (familySize) => {
  const d = new Date();
  d.setDate(d.getDate() + (familySize <= 3 ? 12 : familySize <= 6 ? 10 : 8));
  return d.toDateString();
};

function renderProfile() {
  $("profile").innerHTML = `
    <p><strong>${state.user.name}</strong> (${state.user.role.toUpperCase()})</p>
    <p>Email: ${state.user.email}</p>
    <p>Camp: ${state.user.camp}</p>
    <p>${state.user.idType}: ${state.user.idNumber}</p>
    <p>Predicted food date: ${calculateDistributionDate(state.user.familySize)}</p>
    <p>Resettlement: Awaiting interview scheduling</p>`;
}

function renderStaticModules() {
  $("refugeeModule").innerHTML = [
    "Profile and household management",
    "Food distribution calendar",
    "Health and education enrollment status",
    "Resettlement pipeline tracking",
    "Training and livelihood opportunities",
    "Direct messaging with NGO staff"
  ].map((i) => `<li>${i}</li>`).join("");

  $("serviceModule").innerHTML = state.services.map((s) => `<li>${s}</li>`).join("");
}

function renderDocs() {
  $("documents").innerHTML = state.docs.map((d) => `<li>${d.title} <small>(${d.created})</small></li>`).join("");
}

function renderAnnouncements() {
  $("announcements").innerHTML = state.announcements.map((a) => `<li>${a}</li>`).join("");
}

function renderNgoInfo() {
  $("ngoInfo").innerHTML = state.ngos.length
    ? state.ngos.map((ngo) => `<li><strong>${ngo.name}</strong> — ${ngo.focus} (${ngo.camp}) | Contact: ${ngo.contact}</li>`).join("")
    : "<li>No NGO data found.</li>";
}

function renderNgoUpdates() {
  const visible = state.ngoUpdates.filter((u) => {
    const typeOn = state.preferences[u.type];
    if (!typeOn) return false;
    if (!state.preferences.urgent) return true;
    return u.urgent;
  });

  $("ngoUpdates").innerHTML = visible.length
    ? visible.map((u) => `<li>${u.urgent ? "🚨" : "ℹ️"} <strong>${u.source}</strong>: ${u.message}</li>`).join("")
    : "<li>No updates for current toggle preferences.</li>";
}

function deriveNgoUpdates() {
  const camp = state.user?.camp || "Kakuma";
  const defaultUpdates = [
    { type: "food", urgent: true, source: "WFP", message: `Food distribution in ${camp} starts ${calculateDistributionDate(state.user.familySize)}.` },
    { type: "medical", urgent: false, source: "IRC", message: `Mobile clinic and vaccination desk open tomorrow in ${camp}.` },
    { type: "id", urgent: true, source: "DRS", message: "Alien card verification and fingerprinting this week. Bring ration card." },
    { type: "education", urgent: false, source: "NRC", message: "New digital-skills training intake is open for youth and women." }
  ];

  const fromAnnouncements = state.announcements.map((a) => {
    const lower = a.toLowerCase();
    const type = lower.includes("food") ? "food"
      : lower.includes("medical") ? "medical"
      : (lower.includes("drs") || lower.includes("finger")) ? "id"
      : "education";
    return { type, urgent: true, source: "NGO Desk", message: a };
  });

  state.ngoUpdates = [...fromAnnouncements, ...defaultUpdates];
  renderNgoUpdates();
}

function serviceItinerary(camp) {
  const plans = {
    Hagadera: ["08:00 Health", "10:30 Food Office", "14:00 Education Desk"],
    Ifo: ["09:00 Protection", "11:00 Food Collection", "15:00 Livelihood Training"],
    Dagahaley: ["08:30 Maternal Clinic", "12:00 DRS/Alien Card Desk", "16:00 Caseworker Follow-up"],
    Kakuma: ["07:45 Registration", "11:30 Skills Program", "14:30 Resettlement Briefing"]
  };
  return plans[camp] || ["09:00 Help Desk", "12:00 Service Center"];
}

function smartAssistant(query, mood, lang) {
  const q = query.toLowerCase();
  let reply = "I can help with services, food schedules, Alien card updates, and resettlement guidance.";
  if (q.includes("food") || q.includes("ration")) reply = `Estimated next food distribution date is ${calculateDistributionDate(state.user.familySize)}.`;
  else if (q.includes("alien") || q.includes("drs")) reply = "Alien card support at DRS desk on Tuesday/Thursday with biometric token.";
  else if (q.includes("resettlement")) reply = "Resettlement status in review. Keep contact details updated and attend legal counseling.";
  else if (q.includes("service") || q.includes("program")) reply = `Suggested itinerary for ${state.user.camp}: ${serviceItinerary(state.user.camp).join(" • ")}.`;
  if (mood) reply += mood.toLowerCase().includes("stress") ? " I notice stress signals. Consider psychosocial support." : " You're doing well—stay on track.";
  if (lang === "sw") reply = `[Kiswahili] ${reply}`;
  if (lang === "so") reply = `[Somali] ${reply}`;
  logAction(`AI assistant used for query: ${query}`);
  return reply;
}

async function firebaseOrDemoAuth(email, password) {
  if (!firebaseCtx.enabled) return { uid: "demo-local" };
  try {
    const result = await signInWithEmailAndPassword(firebaseCtx.auth, email, password);
    return result.user;
  } catch {
    const created = await createUserWithEmailAndPassword(firebaseCtx.auth, email, password);
    return created.user;
  }
}

async function fetchNgoInformation() {
  try {
    if (firebaseCtx.enabled) {
      const snap = await getDocs(collection(firebaseCtx.db, "ngos"));
      state.ngos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    if (!state.ngos.length) {
      const response = await fetch("ngo-data.json");
      if (!response.ok) throw new Error("NGO fallback fetch failed");
      state.ngos = await response.json();
    }
    renderNgoInfo();
    logAction("NGO information refreshed");
  } catch (error) {
    pushAlert("Unable to fetch NGO data at this moment.", true);
    logAction(`NGO info fetch failed: ${error.message}`);
  }
}

function bindPreferenceToggles() {
  document.querySelectorAll(".pref-toggle").forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const pref = e.target.dataset.pref;
      state.preferences[pref] = e.target.checked;
      renderNgoUpdates();
      logAction(`NGO update toggle changed: ${pref}=${e.target.checked}`);
    });
  });
}

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = {
    name: $("name").value.trim(),
    email: $("email").value.trim(),
    role: $("role").value,
    camp: $("camp").value,
    idType: $("idType").value,
    idNumber: $("idNumber").value.trim(),
    familySize: Number($("familySize").value)
  };

  if ($("mfa").value.length < 6) {
    pushAlert("MFA failed: provide a valid token.", true);
    return;
  }

  try {
    const authUser = await firebaseOrDemoAuth(user.email, $("password").value);
    state.user = { ...user, authUid: authUser.uid };
    localStorage.setItem("session", await encryptText(JSON.stringify({ ...state.user, lastLogin: Date.now() }), $("password").value));

    dashboard.classList.remove("hidden");
    renderProfile();
    renderStaticModules();
    pushAlert("Food distribution update published for all camps.", true);
    pushAlert("Medical outreach clinic available in your zone tomorrow.");
    logAction(`Secure login for ${user.role} in ${user.camp}`);

    await fetchNgoInformation();
    deriveNgoUpdates();
  } catch (error) {
    pushAlert(`Authentication failed: ${error.message}`, true);
    logAction("Authentication failure");
  }
});

$("docForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.user) return;
  state.docs.unshift({
    title: $("docName").value.trim(),
    content: await encryptText($("docText").value.trim(), state.user.idNumber),
    created: new Date().toLocaleDateString()
  });
  renderDocs();
  logAction("Encrypted document stored");
  e.target.reset();
});

$("announcementForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!state.user || state.user.role !== "ngo") {
    pushAlert("RBAC policy: only NGO Staff may post announcements.", true);
    logAction("Blocked unauthorized announcement attempt");
    return;
  }
  const item = `${$("announcementType").value}: ${$("announcementText").value}`;
  state.announcements.unshift(item);
  renderAnnouncements();
  deriveNgoUpdates();
  pushAlert(`New announcement: ${item}`, true);
  logAction(`Announcement posted by NGO staff: ${item}`);
  e.target.reset();
});

$("askAssistant").addEventListener("click", () => {
  if (!state.user) return;
  $("assistantReply").textContent = smartAssistant($("chatInput").value, $("mood").value, $("language").value);
});

$("downloadProfile").addEventListener("click", () => {
  if (!state.user) return;
  const blob = new Blob([JSON.stringify({ profile: state.user, history: state.history }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "refugee-wallet-profile.json";
  a.click();
  URL.revokeObjectURL(url);
  logAction("Profile snapshot exported");
});

$("enableOffline").addEventListener("click", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("sw.js");
    pushAlert("Offline mode enabled: key pages and assets cached.");
    logAction("Service worker registered for offline access");
  } else pushAlert("Offline service worker not supported on this device.", true);
});

$("refreshNgo").addEventListener("click", fetchNgoInformation);
$("refreshUpdates").addEventListener("click", () => {
  deriveNgoUpdates();
  pushAlert("NGO updates refreshed with current toggle preferences.");
  logAction("NGO updates manually refreshed");
});
$("toggleTheme").addEventListener("click", () => document.body.classList.toggle("dark"));

bindPreferenceToggles();
initFirebase();
