import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDlwYYVt9r8aSCjzFKsFQ1PkNGM745fL8",
  authDomain: "haagiri.firebaseapp.com",
  projectId: "haagiri",
  storageBucket: "haagiri.firebasestorage.app",
  messagingSenderId: "214704041466",
  appId: "1:214704041466:web:3d6c4584ff25c07da4c843",
  measurementId: "G-GB1ER0CTL2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allLeads = [];
let selectedLeadId = null;

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const leadsTable = document.getElementById("leadsTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

async function adminLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msg = document.getElementById("loginMsg");

  msg.textContent = "Logging in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    msg.textContent = "";
  } catch (error) {
    msg.textContent = "Login failed. Check email/password.";
    console.error(error);
  }
}

async function adminLogout() {
  await signOut(auth);
}

onAuthStateChanged(auth, user => {
  if (user) {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadLeads();
    loadProductPrices();
  } else {
    loginScreen.style.display = "flex";
    adminPanel.style.display = "none";
  }
});

async function loadProductPrices() {
  const snap = await getDoc(doc(db, "solarProducts", "default"));

  if (!snap.exists()) return;

  const d = snap.data();

  panelWatt.value = d.panelWatt || "";
  panelLength.value = d.panelLength || "";
  panelWidth.value = d.panelWidth || "";
  panelPrice.value = d.panelPrice || "";
  inverterPrice.value = d.inverterPrice || "";
  batteryPrice.value = d.batteryPrice || "";
  mountingPrice.value = d.mountingPrice || "";
  dcCablePrice.value = d.dcCablePrice || "";
  acCablePrice.value = d.acCablePrice || "";
  breakerPrice.value = d.breakerPrice || "";
  earthingPrice.value = d.earthingPrice || "";
  installationPrice.value = d.installationPrice || "";
  sunHours.value = d.sunHours || "";
  safetyMargin.value = d.safetyMargin || "";
  batteryPercent.value = d.batteryPercent || "";
  otherAccessoryPercent.value = d.otherAccessoryPercent || "";
}

async function saveProductPrices() {

  const data = {
    panelWatt: Number(panelWatt.value || 0),
    panelLength: Number(panelLength.value || 0),
    panelWidth: Number(panelWidth.value || 0),
    panelPrice: Number(panelPrice.value || 0),
    inverterPrice: Number(inverterPrice.value || 0),
    batteryPrice: Number(batteryPrice.value || 0),
    mountingPrice: Number(mountingPrice.value || 0),
    dcCablePrice: Number(dcCablePrice.value || 0),
    acCablePrice: Number(acCablePrice.value || 0),
    breakerPrice: Number(breakerPrice.value || 0),
    earthingPrice: Number(earthingPrice.value || 0),
    installationPrice: Number(installationPrice.value || 0),
    sunHours: Number(sunHours.value || 4.5),
    safetyMargin: Number(safetyMargin.value || 25),
    batteryPercent: Number(batteryPercent.value || 35),
    otherAccessoryPercent: Number(otherAccessoryPercent.value || 10),
    updatedAt: new Date()
  };

  await setDoc(doc(db, "solarProducts", "default"), data);

  settingsMsg.textContent = "Product prices saved successfully.";
}

async function loadLeads() {

  leadsTable.innerHTML =
    `<tr><td colspan="9">Loading...</td></tr>`;

  const q =
    query(
      collection(db, "quoteRequests"),
      orderBy("createdAt", "desc")
    );

  const snapshot = await getDocs(q);

  allLeads =
    snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

  updateStats();
  renderLeads();
}

function renderLeads() {

  const search =
    searchInput.value.toLowerCase();

  const status =
    statusFilter.value;

  const filtered =
    allLeads.filter(lead => {

      const text = `
      ${lead.name || ""}
      ${lead.phone || ""}
      ${lead.island || ""}
      ${lead.billNo || ""}
      `
      .toLowerCase();

      return text.includes(search)
      &&
      (status === "All"
      ||
      (lead.status || "New") === status);
    });

  if (!filtered.length) {
    leadsTable.innerHTML =
      `<tr><td colspan="9">No records found</td></tr>`;
    return;
  }

  leadsTable.innerHTML =
    filtered.map(lead => {

      const c = lead.calculation || {};

      return `
      <tr>
        <td>${formatDate(lead.createdAt)}</td>
        <td>${escapeHTML(lead.name)}</td>
        <td>${escapeHTML(lead.phone)}</td>
        <td>${escapeHTML(lead.island)}</td>
        <td>${c.monthlyUsage || "-"} kWh</td>
        <td>${c.requiredKw || "-"} kW</td>
        <td>MVR ${formatMoney(c.totalPrice)}</td>
        <td>${lead.status || "New"}</td>
        <td>
          <button
          class="view-btn"
          onclick="openDetails('${lead.id}')">
          View
          </button>
        </td>
      </tr>
      `;
    }).join("");
}

function updateStats() {
  totalCount.textContent = allLeads.length;
  newCount.textContent = countStatus("New");
  contactedCount.textContent = countStatus("Contacted");
  quotedCount.textContent = countStatus("Quoted");
  closedCount.textContent = countStatus("Closed");
}

function countStatus(status) {
  return allLeads.filter(
    x => (x.status || "New") === status
  ).length;
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "-";

  return timestamp.toDate()
    .toLocaleString("en-GB");
}

function formatMoney(value) {
  if (!value) return "-";
  return Number(value).toLocaleString();
}

function escapeHTML(value) {
  if (!value) return "-";

  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

searchInput.addEventListener(
  "input",
  renderLeads
);

statusFilter.addEventListener(
  "change",
  renderLeads
);

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.saveProductPrices = saveProductPrices;