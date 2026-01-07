// assets/js/ui.js
import { go } from "./router.js";
import { cartCount } from "./store.js";
import { fmtZar } from "./utils.js";
import { getSession, logout } from "./auth.js";

const $ = (id) => document.getElementById(id);

export async function renderTopbar(site){
  const el = $("topbar");
  const session = await getSession();

  el.innerHTML = `
    <div class="topbar-inner">
      <div class="brand" id="logoBtn" style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <img src="assets/img/logo.png" alt="SATECH Logo"
             style="height:34px;width:34px;object-fit:contain;display:block"
             onerror="this.style.display='none'">
        <span style="font-weight:900;letter-spacing:.3px">SATECH</span>
      </div>

      <button class="btn-primary btn-pill" id="backBtn">← Back to Home</button>

      <button class="icon-btn" id="accountBtn" aria-label="Account" title="Account">👤</button>

      <button class="icon-btn" id="cartBtn" aria-label="Cart" title="Cart">
        🛒 <span class="badge" id="cartCount">0</span>
      </button>

      <button class="icon-btn" id="menuBtn" aria-label="Menu" title="Menu">☰</button>
    </div>
  `;

  $("logoBtn").onclick = () => go("#/");
  $("backBtn").onclick = () => go("#/");
  $("cartBtn").onclick = () => go("#/cart");

  $("accountBtn").onclick = () => {
    if(session) go("#/account");
    else go("#/login");
  };

  $("menuBtn").onclick = () => toggleMenu();

  updateCartBadge();
}

export function renderFooter(site, categories){
  const el = $("footer");
  if(!el) return;

  el.innerHTML = `
    <div style="text-align:center; color:rgba(255,255,255,.86); margin-bottom:10px; font-weight:700;">
      ${site?.supportText || "Book your repair and let our experts handle it efficiently."}
    </div>

    <div style="display:flex;justify-content:center;margin-bottom:14px">
      <button class="support" id="supportBtn">Contact Support</button>
    </div>

    <h3>${site?.brand || "SATECH ENTERPRISE"}</h3>
    <p>${site?.tagline || "Gadgets, accessories & repairs you can trust."}</p>

    <div class="cols">
      <div class="col">
        <h4>Shop</h4>
        ${(categories||[]).map(c => `<a href="#/category/${c.slug}">${c.title}</a>`).join("")}
      </div>

      <div class="col">
        <h4>Services</h4>
        <a href="#/service/laptop-repairs">Laptop Repairs</a>
        <a href="#/service/phone-repairs">Phone Repairs</a>
        <a href="#/service/software-troubleshooting">Software Troubleshooting</a>
      </div>

      <div class="col">
        <h4>Powered By</h4>
        <p><!-- removed --></p>
      </div>
    </div>
  `;

  const supportBtn = $("supportBtn");
  if(supportBtn) supportBtn.onclick = () => go("#/contact");
}

export async function renderMenu(categories){
  const sheet = $("sheet");
  if(!sheet) return;

  const session = await getSession();

  sheet.innerHTML = `
    <h3>Menu</h3>
    <a href="#/">Home</a>
    ${(categories||[]).map(c => `<a href="#/category/${c.slug}">${c.title}</a>`).join("")}
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

  const logoutLink = $("logoutLink");
  if(logoutLink){
    logoutLink.onclick = async (e) => {
      e.preventDefault();
      await logout();
      closeMenu();
      go("#/");
    };
  }
}

export function updateCartBadge(){
  const badge = $("cartCount");
  if(badge) badge.textContent = cartCount();
}

/* =========================
   MENU CONTROLS
========================= */

export function toggleMenu(){
  const sheet = $("sheet");
  if(!sheet) return;
  sheet.classList.toggle("open");
}

export function closeMenu(){
  const sheet = $("sheet");
  if(!sheet) return;
  sheet.classList.remove("open");
}

/* =========================
   CHECKOUT / PAYMENT MODAL
========================= */

export function buildWhatsAppMessage(site, items, total, reference){
  const lines = [];
  lines.push(`Hello ${site?.brand || "SATECH"}, I want to place an order.`);
  lines.push(`Reference: ${reference}`);
  lines.push("");
  lines.push("Items:");
  items.forEach(i => lines.push(`- ${i.name} x${i.qty} = ${fmtZar(i.price * i.qty)}`));
  lines.push("");
  lines.push(`Total: ${fmtZar(total)}`);
  lines.push("");
  lines.push("Please confirm availability & delivery.");
  return lines.join("\n");
}

export function openPaymentModal(site, total, reference, waMessage){
  const overlay = $("overlay");
  if(!overlay) return;

  $("paybox").innerHTML = `
    <div><b>Bank:</b> ${site.payment.bank}</div>
    <div><b>Account Name:</b> ${site.payment.accountName}</div>
    <div><b>Account Number:</b> ${site.payment.accountNumber}</div>
    <div><b>Branch Code:</b> ${site.payment.branchCode}</div>
    <div><b>Reference:</b> ${reference}</div>
  `;

  $("dueText").textContent = fmtZar(total);
  $("payEmail").textContent = site.email;
  $("payWhatsapp").textContent = site.whatsappDisplay;

  overlay.style.display = "flex";

  // WhatsApp checkout button (optional if exists)
  const waBtn = $("waCheckoutBtn");
  if(waBtn){
    waBtn.onclick = () => {
      window.open(`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(waMessage)}`, "_blank");
    };
  }
}

export function closePaymentModal(){
  const overlay = $("overlay");
  if(!overlay) return;
  overlay.style.display = "none";
}
