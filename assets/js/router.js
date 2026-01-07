export function route(){
  const h = location.hash || "#/";
  const parts = h.replace("#/","").split("/");
  return { raw:h, parts };
}

export function go(hash){ location.hash = hash; }
