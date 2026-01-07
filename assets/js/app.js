import { loadData } from "./api.js";
import { route, go } from "./router.js";
import { addToCart, getCart, setQty } from "./store.js";
import { renderTopbar, renderFooter, renderMenu, updateCartBadge, openPaymentModal, closePaymentModal, buildWhatsAppMessage, closeMenu } from "./ui.js";
import { fmtZar, capWords } from "./utils.js";
import { signup, login, logout, getSession, requireAuth } from "./auth.js";

const view = () => document.getElementById("view");

let SITE = null;
let CATEGORIES = [];
let PRODUCTS = [];

window.addEventListener("hashchange", async () => { await render(); closeMenu(); });

window.addEventListener("load", async () => {
  const { site, catalog } = await loadData();
  SITE = site;
  CATEGORIES = catalog.categories || [];
  PRODUCTS = catalog.products || [];
  await render();
});

async function render(){
  await renderTopbar(SITE);
  renderFooter(SITE, CATEGORIES);
  await renderMenu(CATEGORIES);
  wireModal();

  const r = route();
  const parts = r.parts;

  // Hide back button on home
  const backBtn = document.getElementById("backBtn");
  if(backBtn) backBtn.style.visibility = (r.raw === "#/" || r.raw === "#" || r.raw === "") ? "hidden" : "visible";

  // AUTH ROUTES
  if(parts[0] === "login") return renderLogin();
  if(parts[0] === "signup") return renderSignup();
  if(parts[0] === "account") return renderAccount();
  if(parts[0] === "logout") { await logout(); go("#/"); return; }

  if(parts[0] === "" || parts[0] === undefined) return renderHome();
  if(parts[0] === "category") return renderCategory(parts[1]);
  if(parts[0] === "product") return renderProduct(parts[1]);
  if(parts[0] === "cart") return renderCart();
  if(parts[0] === "contact") return renderContact();
  if(parts[0] === "service") return renderService(parts[1]);

  return renderHome();
}

function renderHome(){
  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">SATECH</div>
      <p class="subtitle">
        Refurbished & new laptops, iPhones, smart devices and professional technical repairs, trusted by businesses and individuals.
      </p>

      <div class="hero">
        <div class="hero-card">
          <div class="cta-row">
            <button class="btn-primary btn-pill btn-wide" id="shopNowBtn">Shop Now</button>
          </div>

          <div class="hero-image">
            <img alt="Devices"
              src="https://images.unsplash.com/photo-1616430005484-7f3c7feb21b8?auto=format&fit=crop&w=1400&q=70">
          </div>
        </div>
      </div>

      <div class="grid" style="padding-bottom:18px">
        ${CATEGORIES.map(c => `
          <div class="card" data-cat="${c.slug}" role="button" aria-label="${c.title}">
            <div class="card-inner">
              <div style="font-weight:900; font-size:18px; margin:0 0 4px; letter-spacing:-.2px">${c.title}</div>
              <div style="color:var(--muted); line-height:1.65; font-weight:700">${c.desc}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;

  document.getElementById("shopNowBtn").onclick = () => go("#/category/iphones");
  document.querySelectorAll("[data-cat]").forEach(el => {
    el.onclick = () => go(`#/category/${el.getAttribute("data-cat")}`);
  });
}

function renderCategory(slug){
  const cat = CATEGORIES.find(c => c.slug === slug);
  const all = PRODUCTS.filter(p => p.category === slug);

  const brands = [...new Set(all.map(p => p.brand).filter(Boolean))].sort();

  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">${cat ? cat.title.replace(" ", "<br>") : "Shop"}</div>
      <p class="subtitle">${cat ? cat.desc : ""}</p>

      ${cat?.heroImg ? `
        <div class="hero" style="margin-top:10px">
          <div class="hero-card">
            <div class="hero-image">
              <img alt="${cat.title}" src="${cat.heroImg}">
            </div>
          </div>
        </div>
      ` : ""}

      <div class="card">
        <div class="card-inner">
          <input class="input" id="q" placeholder="Search products..." />

          <div class="filter-row">
            <select class="select" id="brand">
              <option value="">All brands</option>
              ${brands.map(b => `<option value="${b}">${b}</option>`).join("")}
            </select>

            <select class="select" id="sort">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
            </select>
          </div>

          <div class="filter-row">
            <input class="input" id="min" type="number" placeholder="Min (R)" />
            <input class="input" id="max" type="number" placeholder="Max (R)" />
          </div>

          <div class="filter-row">
            <button class="btn-soft btn-pill" id="clearFilters" style="width:100%">Clear Filters</button>
          </div>
        </div>
      </div>

      <div class="grid" id="list"></div>
    </section>
  `;

  const state = { q:"", brand:"", sort:"featured", min:"", max:"" };
  const listEl = document.getElementById("list");

  const renderList = () => {
    let list = [...all];

    if(state.q){
      const q = state.q.toLowerCase();
      list = list.filter(p => (p.name||"").toLowerCase().includes(q));
    }
    if(state.brand) list = list.filter(p => p.brand === state.brand);
    if(state.min !== "") list = list.filter(p => p.price >= Number(state.min));
    if(state.max !== "") list = list.filter(p => p.price <= Number(state.max));

    if(state.sort === "price-asc") list.sort((a,b)=>a.price-b.price);
    if(state.sort === "price-desc") list.sort((a,b)=>b.price-a.price);
    if(state.sort === "name-asc") list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));

    listEl.innerHTML = list.map(p => `
      <div class="card">
        <div class="card-inner">
          <div class="imgbox">
            <img alt="${p.name}" src="${(p.images && p.images[0]) || ""}">
          </div>
          <div class="prod-name">${p.name}</div>
          <div class="meta">${p.brand || ""} ${p.condition ? "• " + p.condition : ""}</div>
          <div class="price">${fmtZar(p.price)}</div>

          <div style="display:flex; gap:10px">
            <button class="btn-dark" data-add="${p.id}" style="flex:1">Add to Cart</button>
            <button class="btn-soft btn-pill" data-view="${p.id}" style="flex:1">View</button>
          </div>
        </div>
      </div>
    `).join("");

    document.querySelectorAll("[data-add]").forEach(btn => {
      btn.onclick = () => {
        addToCart(btn.getAttribute("data-add"), 1);
        updateCartBadge();
      };
    });

    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.onclick = () => go(`#/product/${btn.getAttribute("data-view")}`);
    });
  };

  document.getElementById("q").oninput = e => { state.q = e.target.value; renderList(); };
  document.getElementById("brand").onchange = e => { state.brand = e.target.value; renderList(); };
  document.getElementById("sort").onchange = e => { state.sort = e.target.value; renderList(); };
  document.getElementById("min").oninput = e => { state.min = e.target.value; renderList(); };
  document.getElementById("max").oninput = e => { state.max = e.target.value; renderList(); };

  document.getElementById("clearFilters").onclick = () => {
    state.q=""; state.brand=""; state.sort="featured"; state.min=""; state.max="";
    document.getElementById("q").value="";
    document.getElementById("brand").value="";
    document.getElementById("sort").value="featured";
    document.getElementById("min").value="";
    document.getElementById("max").value="";
    renderList();
  };

  renderList();
}

function renderProduct(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return go("#/");

  const imgs = p.images || [];
  const specs = p.specs || {};
  const highlights = p.highlights || [];

  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">${p.name}</div>
      <p class="subtitle">${p.brand || ""} ${p.condition ? "• " + p.condition : ""}</p>

      <div class="card" style="margin-top:18px">
        <div class="card-inner">
          <div class="imgbox">
            <img id="mainImg" alt="${p.name}" src="${imgs[0] || ""}">
          </div>

          ${imgs.length > 1 ? `
            <div style="display:flex; gap:10px; overflow:auto; padding-bottom:6px">
              ${imgs.map((src, idx) => `
                <img data-thumb="${src}" alt="thumb ${idx}" src="${src}"
                  style="width:86px;height:86px;object-fit:cover;border-radius:16px;border:1px solid var(--line);cursor:pointer;background:#fff">
              `).join("")}
            </div>
          ` : ""}

          <div class="price" style="margin-top:12px">${fmtZar(p.price)}</div>

          <div style="display:flex; gap:10px; margin-top:10px">
            <button class="btn-dark" id="addBtn" style="flex:1">Add to Cart</button>
            <button class="btn-soft btn-pill" id="waOrderBtn" style="flex:1">Order on WhatsApp</button>
          </div>
        </div>
      </div>

      ${highlights.length ? `
        <div class="card" style="margin-top:16px">
          <div class="card-inner">
            <div style="font-weight:900; margin-bottom:8px">Highlights</div>
            ${highlights.map(h => `<div style="color:var(--muted);font-weight:800;line-height:1.9">• ${h}</div>`).join("")}
          </div>
        </div>
      ` : ""}

      ${Object.keys(specs).length ? `
        <div class="card" style="margin-top:16px; margin-bottom:18px">
          <div class="card-inner">
            <div style="font-weight:900; margin-bottom:8px">Specs</div>
            ${Object.entries(specs).map(([k,v]) => `
              <div style="display:flex; justify-content:space-between; gap:14px; padding:10px 0; border-bottom:1px solid var(--line)">
                <div style="font-weight:900">${k}</div>
                <div style="color:var(--muted); font-weight:800; text-align:right">${v}</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    </section>
  `;

  document.querySelectorAll("[data-thumb]").forEach(t => {
    t.onclick = () => document.getElementById("mainImg").src = t.getAttribute("data-thumb");
  });

  document.getElementById("addBtn").onclick = () => {
    addToCart(p.id, 1);
    updateCartBadge();
    go("#/cart");
  };

  document.getElementById("waOrderBtn").onclick = () => {
    const ref = makeReference();
    const msg = [
      `Hello ${SITE.brand}, I want to order:`,
      `${p.name} ${p.condition ? "(" + p.condition + ")" : ""}`,
      `Price: ${fmtZar(p.price)}`,
      `Reference: ${ref}`,
      "",
      "Please confirm availability & delivery."
    ].join("\n");
    window.open(`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };
}

function renderCart(){
  const cart = getCart();
  const items = Object.entries(cart)
    .map(([id, qty]) => {
      const p = PRODUCTS.find(x => x.id === id);
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  view().innerHTML = `
    <section class="page page-anim">
      <div class="cart-title">Your Shopping Cart</div>

      <div class="card">
        <div class="card-inner">
          ${
            items.length === 0
              ? `<div style="color:var(--muted); text-align:center; padding:18px 0; font-weight:800;">Your cart is empty.</div>`
              : items.map(i => `
                  <div class="row">
                    <div>
                      <div style="font-weight:900">${i.name}</div>
                      <div style="color:var(--muted); font-weight:800">${fmtZar(i.price)}</div>
                    </div>
                    <div class="qty">
                      <button class="mini" data-dec="${i.id}">−</button>
                      <div style="font-weight:900; width:22px; text-align:center">${i.qty}</div>
                      <button class="mini" data-inc="${i.id}">+</button>
                    </div>
                  </div>
                `).join("")
          }

          <div class="total">
            <div>Total:</div>
            <div>${fmtZar(total)}</div>
          </div>

          <button class="btn-primary btn-pill" id="checkoutBtn"
            ${items.length ? "" : "disabled style='opacity:.5;cursor:not-allowed'"}>Proceed to Checkout</button>
        </div>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-inc]").forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute("data-inc");
      setQty(id, (cart[id] || 0) + 1);
      updateCartBadge();
      renderCart();
    };
  });

  document.querySelectorAll("[data-dec]").forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute("data-dec");
      setQty(id, (cart[id] || 0) - 1);
      updateCartBadge();
      renderCart();
    };
  });

  const checkoutBtn = document.getElementById("checkoutBtn");
  if(checkoutBtn){
    checkoutBtn.onclick = async () => {
      // ✅ REQUIRE LOGIN BEFORE CHECKOUT
      try { await requireAuth(); }
      catch { go("#/login"); return; }

      const reference = makeReference();
      const waMessage = buildWhatsAppMessage(SITE, items, total, reference);
      openPaymentModal(SITE, total, reference, waMessage);
    };
  }
}

function renderContact(){
  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">Contact SATECH<br>ENTERPRISE</div>
      <p class="subtitle">
        Have questions? Reach out to us. We are ready to help with products, repairs, or technical support.
      </p>

      <div class="card" style="margin-top:18px">
        <div class="card-inner" style="text-align:center">
          <div style="font-weight:900; font-size:18px; margin-bottom:10px">Our Location</div>
          <div style="color:var(--muted); line-height:1.7; font-weight:800">${SITE.location}</div>
        </div>
      </div>

      <div class="card" style="margin-top:14px; margin-bottom:18px">
        <div class="card-inner" style="text-align:center">
          <div style="font-weight:900; font-size:18px; margin-bottom:10px">Contact</div>
          <div style="color:var(--muted); line-height:1.9; font-weight:800">
            Email: ${SITE.email}<br>
            WhatsApp: ${SITE.whatsappDisplay}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderService(slug){
  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">${capWords((slug||"service").replaceAll("-"," "))}</div>
      <p class="subtitle">Book your repair and let our experts handle it efficiently.</p>

      <div class="cta-row">
        <button class="btn-primary btn-pill btn-wide" id="contactBtn">Contact Support</button>
      </div>
    </section>
  `;
  document.getElementById("contactBtn").onclick = () => go("#/contact");
}

/* =========================
   AUTH PAGES
========================= */

function renderLogin(){
  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">Login</div>
      <p class="subtitle">Access your account to checkout faster.</p>

      <div class="card" style="margin-top:18px">
        <div class="card-inner">
          <input class="input" id="email" placeholder="Email" />
          <div style="height:10px"></div>
          <input class="input" id="password" type="password" placeholder="Password" />
          <div style="height:14px"></div>

          <button class="btn-primary btn-pill" id="loginBtn" style="width:100%">Login</button>

          <div id="err" style="color:#b42318;font-weight:800;margin-top:12px;display:none"></div>

          <div style="margin-top:14px;color:var(--muted);font-weight:800;text-align:center">
            No account? <a href="#/signup" style="color:var(--primary2);font-weight:900">Sign Up</a>
          </div>
        </div>
      </div>
    </section>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    const err = document.getElementById("err");
    err.style.display = "none";
    try{
      await login({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      });
      go("#/account");
    }catch(e){
      err.textContent = e.message;
      err.style.display = "block";
    }
  };
}

function renderSignup(){
  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">Sign Up</div>
      <p class="subtitle">Create an account for easy checkout.</p>

      <div class="card" style="margin-top:18px">
        <div class="card-inner">
          <input class="input" id="name" placeholder="Full Name" />
          <div style="height:10px"></div>
          <input class="input" id="email" placeholder="Email" />
          <div style="height:10px"></div>
          <input class="input" id="password" type="password" placeholder="Password" />
          <div style="height:14px"></div>

          <button class="btn-primary btn-pill" id="signupBtn" style="width:100%">Create Account</button>

          <div id="err" style="color:#b42318;font-weight:800;margin-top:12px;display:none"></div>

          <div style="margin-top:14px;color:var(--muted);font-weight:800;text-align:center">
            Already have an account? <a href="#/login" style="color:var(--primary2);font-weight:900">Login</a>
          </div>
        </div>
      </div>
    </section>
  `;

  document.getElementById("signupBtn").onclick = async () => {
    const err = document.getElementById("err");
    err.style.display = "none";
    try{
      await signup({
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      });
      go("#/account");
    }catch(e){
      err.textContent = e.message;
      err.style.display = "block";
    }
  };
}

async function renderAccount(){
  const s = await getSession();
  if(!s) { go("#/login"); return; }

  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">My Account</div>
      <p class="subtitle">Welcome back, <b>${s.name}</b>.</p>

      <div class="card" style="margin-top:18px">
        <div class="card-inner">
          <div style="font-weight:900;margin-bottom:8px">Account Info</div>
          <div style="color:var(--muted);font-weight:800;line-height:1.9">
            Name: ${s.name}<br>
            Email: ${s.email}
          </div>

          <div style="height:14px"></div>
          <button class="btn-soft btn-pill" id="logoutBtn" style="width:100%">Logout</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    await logout();
    go("#/");
  };
}

/* MODAL */
function wireModal(){
  document.getElementById("closePaymentBtn").onclick = closePaymentModal;
  document.getElementById("overlay").onclick = (e) => {
    if(e.target.id === "overlay") closePaymentModal();
  };
}

function makeReference(){
  return "SATECH-" + Math.floor(100000 + Math.random()*900000);
}
