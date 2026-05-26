import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy
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
const db = getFirestore(app);

let allLeads = [];
let selectedLeadId = null;

const leadsTable = document.getElementById("leadsTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

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

    const matchSearch = text.includes(search);
    const matchStatus = status === "All" || lead.status === status;

    return matchSearch && matchStatus;
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
      <td><span class="status-pill ${lead.status}">${lead.status || "New"}</span></td>
      <td>
        <button class="view-btn" onclick="openDetails('${lead.id}')">View</button>
      </td>
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
  return allLeads.filter(x => x.status === status).length;
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
  document.getElementById("detailsModal").classList.add("show");
}

function closeModal() {
  document.getElementById("detailsModal").classList.remove("show");
}

async function saveStatus() {
  if (!selectedLeadId) return;

  const newStatus = document.getElementById("modalStatus").value;

  await updateDoc(doc(db, "quoteRequests", selectedLeadId), {
    status: newStatus
  });

  const lead = allLeads.find(x => x.id === selectedLeadId);
  if (lead) lead.status = newStatus;

  updateStats();
  renderLeads();
  closeModal();
}

function exportCSV() {
  const rows = [
    ["Date", "Name", "Phone", "Island", "Bill No", "Account No", "Meter No", "Provider", "Status", "Message"]
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

window.openDetails = openDetails;
window.closeModal = closeModal;
window.saveStatus = saveStatus;
window.exportCSV = exportCSV;

loadLeads();