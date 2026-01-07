const CART_KEY = "satech_cart_v3";

export function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); }
  catch { return {}; }
}
export function setCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

export function addToCart(id, qty=1){
  const c = getCart();
  c[id] = (c[id] || 0) + qty;
  if(c[id] <= 0) delete c[id];
  setCart(c);
  return c;
}

export function setQty(id, qty){
  const c = getCart();
  if(qty <= 0) delete c[id];
  else c[id] = qty;
  setCart(c);
  return c;
}

export function cartCount(){
  const c = getCart();
  return Object.values(c).reduce((a,b)=>a+b,0);
}
