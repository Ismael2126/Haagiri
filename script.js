import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
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

    const targetPosition = target.getBoundingClientRect().top + window.scrollY - 120;

    window.scrollTo({
      top: targetPosition,
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
      createdAt: serverTimestamp()
    });

    button.textContent = "Saved Successfully";

    const whatsappNumber = "9607777777";

    const text =
      `Hello Haagiri Solar,%0A%0A` +
      `I need a Fenaka solar quotation.%0A%0A` +
      `Name: ${name}%0A` +
      `Phone: ${phone}%0A` +
      `Island: ${island}%0A` +
      `Fenaka Bill No: ${billNo}%0A` +
      `Account No: ${accountNo}%0A` +
      `Meter No: ${meterNo}%0A` +
      `Details: ${message}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");

    event.target.reset();
  } catch (error) {
    console.error(error);
    alert("Failed to save quote request. Check Firebase rules.");
    button.textContent = "Send Fenaka Quote Request";
  }

  button.disabled = false;
}

window.sendQuote = sendQuote;