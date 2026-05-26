import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
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
const db = getFirestore(app);

let solarSettings = null;

async function loadSolarSettings() {
  const snap = await getDoc(doc(db, "solarSettings", "default"));

  if (snap.exists()) {
    solarSettings = snap.data();
    calculateSolar();
  } else {
    solarSettings = {
      panelWatt: 550,
      panelLength: 2.28,
      panelWidth: 1.13,
      panelPrice: 2500,
      inverterPricePerKw: 1800,
      batteryPricePerKwh: 3500,
      accessoryPercent: 15,
      sunHours: 4.5
    };
    calculateSolar();
  }
}

loadSolarSettings();

function toggleMenu() {
  const nav = document.getElementById("nav");
  if (nav) nav.classList.toggle("show");
}
window.toggleMenu = toggleMenu;

document.querySelectorAll("#nav a, .nav-quote, .hero-buttons a, .feature-panel a").forEach(link => {
  link.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (!targetId || !targetId.startsWith("#")) return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 120,
      behavior: "smooth"
    });

    const nav = document.getElementById("nav");
    if (nav) nav.classList.remove("show");
  });
});

const navLinks = document.querySelectorAll("#nav a");
const sections = document.querySelectorAll("#home, #solutions, #projects, #quote, #contact");

function updateActiveNav() {
  let current = "home";

  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 180) {
      current = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNav);
window.addEventListener("load", updateActiveNav);

function calculateSolar() {
  const monthlyUsage = Number(document.getElementById("monthlyUsage")?.value || 0);
  const resultBox = document.getElementById("calcResult");

  if (!resultBox) return null;

  if (!solarSettings) {
    resultBox.innerHTML = `
      <h3>Solar Estimate</h3>
      <p>Loading solar product settings...</p>
    `;
    return null;
  }

  if (!monthlyUsage) {
    resultBox.innerHTML = `
      <h3>Solar Estimate</h3>
      <p>Enter monthly usage to calculate system size, roof area and price.</p>
    `;
    return null;
  }

  const panelWatt = Number(solarSettings.panelWatt || 550);
  const panelLength = Number(solarSettings.panelLength || 2.28);
  const panelWidth = Number(solarSettings.panelWidth || 1.13);
  const panelPrice = Number(solarSettings.panelPrice || 0);
  const inverterPricePerKw = Number(solarSettings.inverterPricePerKw || 0);
  const batteryPricePerKwh = Number(solarSettings.batteryPricePerKwh || 0);
  const accessoryPercent = Number(solarSettings.accessoryPercent || 0);
  const sunHours = Number(solarSettings.sunHours || 4.5);

  const dailyKwh = monthlyUsage / 30;
  const requiredKw = dailyKwh / sunHours;
  const safeKw = requiredKw * 1.25;

  const panels = Math.ceil((safeKw * 1000) / panelWatt);
  const finalSystemKw = (panels * panelWatt) / 1000;

  const panelArea = panelLength * panelWidth;
  const roofArea = panels * panelArea;

  const inverterKw = Math.ceil(finalSystemKw);
  const batteryKwh = Math.ceil(dailyKwh * 0.35);

  const panelCost = panels * panelPrice;
  const inverterCost = inverterKw * inverterPricePerKw;
  const batteryCost = batteryKwh * batteryPricePerKwh;

  const subTotal = panelCost + inverterCost + batteryCost;
  const accessoryCost = subTotal * (accessoryPercent / 100);
  const totalPrice = subTotal + accessoryCost;

  resultBox.innerHTML = `
    <h3>Solar Estimate</h3>

    <div class="result-grid">
      <div><small>Monthly Usage</small><strong>${monthlyUsage.toFixed(0)} kWh</strong></div>
      <div><small>Daily Usage</small><strong>${dailyKwh.toFixed(1)} kWh</strong></div>
      <div><small>System Needed</small><strong>${finalSystemKw.toFixed(2)} kW</strong></div>
      <div><small>Panels Needed</small><strong>${panels} × ${panelWatt}W</strong></div>
      <div><small>Panel Size</small><strong>${panelLength}m × ${panelWidth}m</strong></div>
      <div><small>Roof Area Needed</small><strong>${roofArea.toFixed(2)} m²</strong></div>
      <div><small>Inverter Size</small><strong>${inverterKw} kW</strong></div>
      <div><small>Battery Estimate</small><strong>${batteryKwh} kWh</strong></div>
      <div><small>Estimated Price</small><strong>MVR ${totalPrice.toLocaleString()}</strong></div>
    </div>

    <div class="accessory-list">
      <small>Accessories Included</small>
      <p>Solar panels, inverter, battery, mounting structure, DC cable, AC cable, breakers, earthing kit, monitoring and installation accessories.</p>
    </div>
  `;

  return {
    monthlyUsage,
    dailyKwh: Number(dailyKwh.toFixed(2)),
    requiredKw: Number(finalSystemKw.toFixed(2)),
    panelWatt,
    panels,
    panelLength,
    panelWidth,
    roofArea: Number(roofArea.toFixed(2)),
    inverterKw,
    batteryKwh,
    panelCost,
    inverterCost,
    batteryCost,
    accessoryCost: Number(accessoryCost.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2))
  };
}

window.calculateSolar = calculateSolar;

async function sendQuote(event) {
  event.preventDefault();

  const button = event.target.querySelector("button");

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const island = document.getElementById("island").value.trim();
  const billNo = document.getElementById("billNo").value.trim();
  const accountNo = document.getElementById("accountNo").value.trim();
  const meterNo = document.getElementById("meterNo").value.trim();
  const message = document.getElementById("message").value.trim();

  const calculation = calculateSolar();

  if (!calculation) {
    alert("Please enter monthly usage first.");
    return;
  }

  button.textContent = "Saving...";
  button.disabled = true;

  try {
    await addDoc(collection(db, "quoteRequests"), {
      name,
      phone,
      island,
      billNo,
      accountNo,
      meterNo,
      message,
      provider: "Fenaka",
      status: "New",
      calculation,
      createdAt: serverTimestamp()
    });

    const whatsappNumber = "9607777777";

    const text =
      `Hello Haagiri Solar,%0A%0A` +
      `I need a Fenaka solar quotation.%0A%0A` +
      `Name: ${name}%0A` +
      `Phone: ${phone}%0A` +
      `Island: ${island}%0A` +
      `Fenaka Bill No: ${billNo}%0A` +
      `Account No: ${accountNo}%0A` +
      `Meter No: ${meterNo}%0A%0A` +
      `Monthly Usage: ${calculation.monthlyUsage} kWh%0A` +
      `Recommended Solar Size: ${calculation.requiredKw} kW%0A` +
      `Panels Needed: ${calculation.panels} × ${calculation.panelWatt}W%0A` +
      `Roof Area Needed: ${calculation.roofArea} m²%0A` +
      `Inverter Size: ${calculation.inverterKw} kW%0A` +
      `Battery Estimate: ${calculation.batteryKwh} kWh%0A` +
      `Estimated Price: MVR ${calculation.totalPrice.toLocaleString()}%0A%0A` +
      `Details: ${message}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");

    event.target.reset();
    calculateSolar();
    button.textContent = "Save & Send Fenaka Quote Request";
  } catch (error) {
    console.error(error);
    alert("Failed to save quote request.");
    button.textContent = "Save & Send Fenaka Quote Request";
  }

  button.disabled = false;
}

window.sendQuote = sendQuote;