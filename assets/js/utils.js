export function fmtZar(n){
  const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "R" + s;
}

export function encodeMsg(msg){
  return encodeURIComponent(msg);
}

export function capWords(s){
  return s.split(" ").map(w => w ? w[0].toUpperCase()+w.slice(1) : w).join(" ");
}
