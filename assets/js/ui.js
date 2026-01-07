// assets/js/ui.js
import { cartCount } from "./store.js";
import { go } from "./router.js";
import { fmtZar, encodeMsg } from "./utils.js";
import { getSession, logout } from "./auth.js";

export async function renderTopbar(site){
  const el = document.getElementById("topbar");
  const session = await getSession();

  const logoHtml = `
    <div class="brand" style="display:flex;align-items:center;gap:10px">
  <img src="assets/img/logo.png" alt="SATECH Logo" style="height:38px">
  <span style="font-weight:900;letter-spacing:.5px">SATECH</span>
</div>

  `;

  el.innerHTML = `
    <div class="topbar-inner">
      ${logoHtml}

      <div class="back-pill">
        <button class="btn-primary btn-pill btn-wide" id="backBtn">← Back to Home</button>
      </div>

      <button class="icon-btn" id="accountBtn" aria-label="Account" title="Account">👤</button>

      <button class="icon-btn" id="cartBtn" aria-label="Cart">
        🛒 <span class="badge" id="cartCount">0</span>
      </button>

      <button class="icon-btn" id="menuBtn" aria-label="Menu">☰</button>
    </div>
  `;

  document.getElementById("logoBtn").onclick = () => go("#/");
  document.getElementById("backBtn").onclick = () => go("#/");
  document.getElementById("cartBtn").onclick = () => go("#/cart");
  document.getElementById("menuBtn").onclick = () => toggleMenu();

  document.getElementById("accountBtn").onclick = () => {
    if(session) go("#/account");
    else go("#/login");
  };

  updateCartBadge();
}

export function renderFooter(site, categories){
  const el = document.getElementById("footer");
  el.innerHTML = `
    <div style="text-align:center; color:rgba(255,255,255,.86); margin-bottom:10px; font-weight:700;">
      ${site.supportText}
    </div>
    <button class="support" id="supportBtn">Contact Support</button>

    <h3>${site.brand}</h3>
    <p>${site.tagline}</p>

    <div class="cols">
      <div class="col">
        <h4>Shop</h4>
        ${categories.map(c => `<a href="#/category/${c.slug}">${c.title}</a>`).join("")}
      </div>

      <div class="col">
        <h4>Services</h4>
        <a href="#/service/laptop-repairs">Laptop Repairs</a>
        <a href="#/service/phone-repairs">Phone Repairs</a>
        <a href="#/service/software-troubleshooting">Software Troubleshooting</a>
      </div>

      <div class="col">
        <h4>Powered By</h4>
        <p>SATECH ENTEPRISE</p>
      </div>
    </div>
  `;

  document.getElementById("supportBtn").onclick = () => go("#/contact");
}

export async function renderMenu(categories){
  const session = await getSession();
  const sheet = document.getElementById("sheet");

  sheet.innerHTML = `
    <h3>Menu</h3>
    <a href="#/">Home</a>
    ${categories.map(c => `<a href="#/category/${c.slug}">${c.title}</a>`).join("")}
    <a href="#/contact">Contact</a>
    <a href="#/cart">Cart</a>

    <h3 style="margin-top:18px">Account</h3>
    ${session ? `
      <a href="#/account">My Account</a>
      <a href="#/logout" id="logoutLink">Logout</a>
    ` : `
      <a href="#/login">Login</a>
      <a href="#/signup">Sign Up</a>
    `}
  `;

  const logoutLink = document.getElementById("logoutLink");
  if(logoutLink){
    logoutLink.onclick = async (e) => {
      e.preventDefault();
      await logout();
      go("#/");
      closeMenu();
    };
  }
}

export function toggleMenu(){
  const sheet = document.getElementById("sheet");
  sheet.classList.toggle("open");
  sheet.setAttribute("aria-hidden", sheet.classList.contains("open") ? "false" : "true");
}

export function closeMenu(){
  const sheet = document.getElementById("sheet");
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden","true");
}

export function updateCartBadge(){
  const badge = document.getElementById("cartCount");
  if(badge) badge.textContent = cartCount();
}

export function buildWhatsAppMessage(site, items, total, reference){
  const lines = [];
  lines.push(`Hello ${site.brand}, I want to place an order.`);
  lines.push(`Reference: ${reference}`);
  lines.push("");
  lines.push("Items:");
  items.forEach(i => lines.push(`- ${i.name} x${i.qty} = ${fmtZar(i.price*i.qty)}`));
  lines.push("");
  lines.push(`Total: ${fmtZar(total)}`);
  lines.push("");
  lines.push("Please confirm availability & delivery.");
  return lines.join("\n");
}

export function openPaymentModal(site, total, reference, waMessage){
  document.getElementById("paybox").innerHTML = `
    <div><b>Bank:</b> ${site.payment.bank}</div>
    <div><b>Account Name:</b> ${site.payment.accountName}</div>
    <div><b>Account Number:</b> ${site.payment.accountNumber}</div>
    <div><b>Branch Code:</b> ${site.payment.branchCode}</div>
    <div><b>Reference:</b> ${reference}</div>
  `;

  document.getElementById("dueText").textContent = fmtZar(total);
  document.getElementById("payEmail").textContent = site.email;
  document.getElementById("payWhatsapp").textContent = site.whatsappDisplay;

  const overlay = document.getElementById("overlay");
  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden","false");

  document.getElementById("waCheckoutBtn").onclick = () => {
    const url = `https://wa.me/${site.whatsappNumber}?text=${encodeMsg(waMessage)}`;
    window.open(url, "_blank");
  };
}

export function closePaymentModal(){
  const overlay = document.getElementById("overlay");
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden","true");
}
