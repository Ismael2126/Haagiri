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
loadSolarSettings();
  } else {
    loginScreen.style.display = "flex";
    adminPanel.style.display = "none";
  }
});

async function loadLeads() {
  leadsTable.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  const q = query(collection(db, "quoteRequests"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allLeads = snapshot.docs.map(item => ({
    id: item.id,
    ...item.data()
  }));

  updateStats();
  renderLeads();
}

function renderLeads() {
  const search = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = allLeads.filter(lead => {
    const text = `
      ${lead.name || ""}
      ${lead.phone || ""}
      ${lead.island || ""}
      ${lead.billNo || ""}
      ${lead.accountNo || ""}
      ${lead.meterNo || ""}
    `.toLowerCase();

    return text.includes(search) && (status === "All" || lead.status === status);
  });

  if (filtered.length === 0) {
    leadsTable.innerHTML = `<tr><td colspan="7">No records found</td></tr>`;
    return;
  }

  leadsTable.innerHTML = filtered.map(lead => `
    <tr>
      <td>${formatDate(lead.createdAt)}</td>
      <td>${escapeHTML(lead.name)}</td>
      <td>${escapeHTML(lead.phone)}</td>
      <td>${escapeHTML(lead.island)}</td>
      <td>${escapeHTML(lead.billNo)}</td>
      <td><span class="status-pill ${lead.status || "New"}">${lead.status || "New"}</span></td>
      <td><button class="view-btn" onclick="openDetails('${lead.id}')">View</button></td>
    </tr>
  `).join("");
}

function updateStats() {
  document.getElementById("totalCount").textContent = allLeads.length;
  document.getElementById("newCount").textContent = countStatus("New");
  document.getElementById("contactedCount").textContent = countStatus("Contacted");
  document.getElementById("quotedCount").textContent = countStatus("Quoted");
  document.getElementById("closedCount").textContent = countStatus("Closed");
}

function countStatus(status) {
  return allLeads.filter(x => (x.status || "New") === status).length;
}

function openDetails(id) {
  selectedLeadId = id;

  const lead = allLeads.find(x => x.id === id);
  if (!lead) return;

  document.getElementById("detailsContent").innerHTML = `
    <div><label>Name</label><p>${escapeHTML(lead.name)}</p></div>
    <div><label>Phone</label><p>${escapeHTML(lead.phone)}</p></div>
    <div><label>Island</label><p>${escapeHTML(lead.island)}</p></div>
    <div><label>Bill No</label><p>${escapeHTML(lead.billNo)}</p></div>
    <div><label>Account No</label><p>${escapeHTML(lead.accountNo)}</p></div>
    <div><label>Meter No</label><p>${escapeHTML(lead.meterNo)}</p></div>
    <div><label>Provider</label><p>${escapeHTML(lead.provider)}</p></div>
    <div><label>Date</label><p>${formatDate(lead.createdAt)}</p></div>
    <div class="full-detail"><label>Message</label><p>${escapeHTML(lead.message)}</p></div>
  `;

  document.getElementById("modalStatus").value = lead.status || "New";
  document.getElementById("adminNotes").value = lead.adminNotes || "";
  document.getElementById("detailsModal").classList.add("show");
}

function closeModal() {
  document.getElementById("detailsModal").classList.remove("show");
}

async function saveStatus() {
  if (!selectedLeadId) return;

  const newStatus = document.getElementById("modalStatus").value;
  const adminNotes = document.getElementById("adminNotes").value.trim();

  await updateDoc(doc(db, "quoteRequests", selectedLeadId), {
    status: newStatus,
    adminNotes
  });

  const lead = allLeads.find(x => x.id === selectedLeadId);
  if (lead) {
    lead.status = newStatus;
    lead.adminNotes = adminNotes;
  }

  updateStats();
  renderLeads();
  closeModal();
}

function whatsappCustomer() {
  const lead = allLeads.find(x => x.id === selectedLeadId);
  if (!lead || !lead.phone) return;

  let phone = lead.phone.replace(/\D/g, "");

  if (!phone.startsWith("960")) {
    phone = "960" + phone;
  }

  const text =
    `Hello ${lead.name || ""},%0A%0A` +
    `This is Haagiri Solar regarding your Fenaka solar quotation request.%0A` +
    `We would like to follow up with you.`;

  window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
}

function exportCSV() {
  const rows = [
    ["Date", "Name", "Phone", "Island", "Bill No", "Account No", "Meter No", "Provider", "Status", "Admin Notes", "Message"]
  ];

  allLeads.forEach(lead => {
    rows.push([
      formatDate(lead.createdAt),
      lead.name || "",
      lead.phone || "",
      lead.island || "",
      lead.billNo || "",
      lead.accountNo || "",
      lead.meterNo || "",
      lead.provider || "",
      lead.status || "",
      lead.adminNotes || "",
      lead.message || ""
    ]);
  });

  const csv = rows.map(row =>
    row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "haagiri-quote-requests.csv";
  a.click();

  URL.revokeObjectURL(url);
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "-";

  return timestamp.toDate().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHTML(value) {
  if (!value) return "-";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", renderLeads);
statusFilter.addEventListener("change", renderLeads);

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.openDetails = openDetails;
window.closeModal = closeModal;
window.saveStatus = saveStatus;
window.whatsappCustomer = whatsappCustomer;
window.exportCSV = exportCSV;
async function loadSolarSettings() {
  const ref = doc(db, "solarSettings", "default");
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("setPanelWatt").value = data.panelWatt || "";
  document.getElementById("setPanelLength").value = data.panelLength || "";
  document.getElementById("setPanelWidth").value = data.panelWidth || "";
  document.getElementById("setPanelPrice").value = data.panelPrice || "";
  document.getElementById("setInverterPricePerKw").value = data.inverterPricePerKw || "";
  document.getElementById("setBatteryPricePerKwh").value = data.batteryPricePerKwh || "";
  document.getElementById("setAccessoryPercent").value = data.accessoryPercent || "";
  document.getElementById("setSunHours").value = data.sunHours || "";
}

async function saveSolarSettings() {
  const data = {
    panelWatt: Number(document.getElementById("setPanelWatt").value),
    panelLength: Number(document.getElementById("setPanelLength").value),
    panelWidth: Number(document.getElementById("setPanelWidth").value),
    panelPrice: Number(document.getElementById("setPanelPrice").value),
    inverterPricePerKw: Number(document.getElementById("setInverterPricePerKw").value),
    batteryPricePerKwh: Number(document.getElementById("setBatteryPricePerKwh").value),
    accessoryPercent: Number(document.getElementById("setAccessoryPercent").value),
    sunHours: Number(document.getElementById("setSunHours").value),
    updatedAt: new Date()
  };

  await setDoc(doc(db, "solarSettings", "default"), data);

  document.getElementById("settingsMsg").textContent = "Solar settings saved successfully.";
}
window.saveSolarSettings = saveSolarSettings;