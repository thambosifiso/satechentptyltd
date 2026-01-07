import { loadData } from "./api.js";
import { route, go } from "./router.js";
import { addToCart, getCart, setQty } from "./store.js";
import { renderTopbar, renderFooter, renderMenu, updateCartBadge, openPaymentModal, closePaymentModal, buildWhatsAppMessage, closeMenu } from "./ui.js";
import { fmtZar, capWords } from "./utils.js";

const view = () => document.getElementById("view");

let SITE = null;
let CATEGORIES = [];
let PRODUCTS = [];

window.addEventListener("hashchange", () => { render(); closeMenu(); });
window.addEventListener("load", async () => {
  const { site, catalog } = await loadData();
  SITE = site;
  CATEGORIES = catalog.categories || [];
  PRODUCTS = catalog.products || [];
  render();
});

function render(){
  renderTopbar(SITE);
  renderFooter(SITE, CATEGORIES);
  renderMenu(CATEGORIES);
  wireModalClose();

  const r = route();
  const parts = r.parts;

  // Hide back on home
  const backBtn = document.getElementById("backBtn");
  if(backBtn) backBtn.style.visibility = (r.raw === "#/" || r.raw === "#" || r.raw === "") ? "hidden" : "visible";

  // routes
  if(parts[0] === "" || parts[0] === undefined) return renderHome();
  if(parts[0] === "category") return renderCategory(parts[1]);
  if(parts[0] === "product") return renderProduct(parts[1]);
  if(parts[0] === "cart") return renderCart();
  if(parts[0] === "contact") return renderContact();
  if(parts[0] === "service") return renderService(parts[1]);

  return renderHome();
}

/* HOME */
function renderHome(){
  view().innerHTML = `
    <section class="page page-anim">
      <div style="height:10px"></div>
      <div class="title">SATECH</div>
      <p class="subtitle">
        Refurbished & new laptops, iPhones, smart devices and professional technical repairs, trusted by businesses and individuals.
      </p>

      <div class="cta-row">
        <button class="btn-primary btn-pill btn-wide" id="shopNowBtn">Shop Now</button>
      </div>

      <div class="hero-img">
        <img alt="Devices" src="https://images.unsplash.com/photo-1616430005484-7f3c7feb21b8?auto=format&fit=crop&w=1400&q=70">
      </div>

      <div class="grid" style="padding-bottom:18px">
        ${CATEGORIES.map(c => `
          <div class="card" data-cat="${c.slug}" role="button">
            <div class="card-inner">
              <div style="font-weight:900; font-size:18px; margin:0 0 4px">${c.title}</div>
              <div style="color:var(--muted); line-height:1.55">${c.desc}</div>
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

/* CATEGORY with SEARCH + FILTERS */
function renderCategory(slug){
  const cat = CATEGORIES.find(c => c.slug === slug);
  const all = PRODUCTS.filter(p => p.category === slug);

  const brands = [...new Set(all.map(p => p.brand).filter(Boolean))].sort();

  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">${cat ? cat.title.replace(" ", "<br>") : "Shop"}</div>
      <p class="subtitle">${cat ? cat.desc : ""}</p>
      ${cat?.heroImg ? `<div class="hero-img"><img alt="${cat.title}" src="${cat.heroImg}"></div>` : ""}

      <!-- Search + Filters -->
      <div class="card" style="margin-top:18px">
        <div class="card-inner">
          <input id="q" placeholder="Search products..." style="width:100%;padding:14px;border-radius:14px;border:1px solid var(--line);font-weight:700;outline:none" />

          <div style="display:flex; gap:10px; margin-top:12px">
            <select id="brand" style="flex:1;padding:14px;border-radius:14px;border:1px solid var(--line);font-weight:800">
              <option value="">All brands</option>
              ${brands.map(b => `<option value="${b}">${b}</option>`).join("")}
            </select>

            <select id="sort" style="flex:1;padding:14px;border-radius:14px;border:1px solid var(--line);font-weight:800">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
            </select>
          </div>

          <div style="display:flex; gap:10px; margin-top:12px">
            <input id="min" type="number" placeholder="Min (R)" style="flex:1;padding:14px;border-radius:14px;border:1px solid var(--line);font-weight:800" />
            <input id="max" type="number" placeholder="Max (R)" style="flex:1;padding:14px;border-radius:14px;border:1px solid var(--line);font-weight:800" />
          </div>

          <button class="btn-soft btn-pill" id="clearFilters" style="margin-top:12px;width:100%">Clear Filters</button>
        </div>
      </div>

      <div class="grid" id="list"></div>
    </section>
  `;

  const state = { q:"", brand:"", sort:"featured", min:"", max:"" };
  const listEl = document.getElementById("list");

  const renderList = () => {
    let list = [...all];

    // filters
    if(state.q){
      const q = state.q.toLowerCase();
      list = list.filter(p => (p.name||"").toLowerCase().includes(q));
    }
    if(state.brand){
      list = list.filter(p => p.brand === state.brand);
    }
    if(state.min !== "") list = list.filter(p => p.price >= Number(state.min));
    if(state.max !== "") list = list.filter(p => p.price <= Number(state.max));

    // sort
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
          <div style="color:var(--muted);font-weight:800;margin-bottom:6px">${p.brand || ""} • ${p.condition || ""}</div>
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

  // wire inputs
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

/* PRODUCT DETAILS PAGE */
function renderProduct(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return go("#/");

  const imgs = p.images || [];
  const specs = p.specs || {};
  const highlights = p.highlights || [];

  view().innerHTML = `
    <section class="page page-anim">
      <div class="title">${p.name}</div>
      <p class="subtitle">${p.brand || ""} • ${p.condition || ""}</p>

      <div class="card" style="margin-top:18px">
        <div class="card-inner">
          <div class="imgbox">
            <img id="mainImg" alt="${p.name}" src="${imgs[0] || ""}">
          </div>

          ${imgs.length > 1 ? `
            <div style="display:flex; gap:10px; overflow:auto; padding-bottom:6px">
              ${imgs.map((src, idx) => `
                <img data-thumb="${src}" alt="thumb ${idx}"
                  src="${src}"
                  style="width:84px;height:84px;object-fit:cover;border-radius:14px;border:1px solid var(--line);cursor:pointer">
              `).join("")}
            </div>
          ` : ""}

          <div class="price" style="margin-top:10px">${fmtZar(p.price)}</div>

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
            ${highlights.map(h => `<div style="color:var(--muted);font-weight:800;line-height:1.8">• ${h}</div>`).join("")}
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

  // gallery
  document.querySelectorAll("[data-thumb]").forEach(t => {
    t.onclick = () => document.getElementById("mainImg").src = t.getAttribute("data-thumb");
  });

  // add to cart
  document.getElementById("addBtn").onclick = () => {
    addToCart(p.id, 1);
    updateCartBadge();
    go("#/cart");
  };

  // WhatsApp order single product
  document.getElementById("waOrderBtn").onclick = () => {
    const ref = makeReference();
    const msg = [
      `Hello ${SITE.brand}, I want to order:`,
      `${p.name} (${p.condition || ""})`,
      `Price: ${fmtZar(p.price)}`,
      `Reference: ${ref}`,
      "",
      "Please confirm availability & delivery."
    ].join("\n");

    window.open(`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };
}

/* CART + CHECKOUT => PAYMENT MODAL + WhatsApp checkout message */
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
              ? `<div style="color:var(--muted); text-align:center; padding:18px 0">Your cart is empty.</div>`
              : items.map(i => `
                  <div class="row">
                    <div>
                      <div style="font-weight:900">${i.name}</div>
                      <div style="color:var(--muted)">${fmtZar(i.price)}</div>
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
    checkoutBtn.onclick = () => {
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
        Have questions? Reach out to us! We are always ready to help you with products, repairs, or technical support.
      </p>

      <div class="card" style="margin-top:26px">
        <div class="card-inner" style="text-align:center">
          <div style="font-weight:900; font-size:18px; margin-bottom:10px">Our Location</div>
          <div style="color:var(--muted); line-height:1.6">${SITE.location}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px; margin-bottom:18px">
        <div class="card-inner" style="text-align:center">
          <div style="font-weight:900; font-size:18px; margin-bottom:10px">Contact</div>
          <div style="color:var(--muted); line-height:1.8">
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

/* Modal close wiring */
function wireModalClose(){
  document.getElementById("closePaymentBtn").onclick = closePaymentModal;
  document.getElementById("overlay").onclick = (e) => {
    if(e.target.id === "overlay") closePaymentModal();
  };
}

function makeReference(){
  return "SATECH-" + Math.floor(100000 + Math.random()*900000);
}
