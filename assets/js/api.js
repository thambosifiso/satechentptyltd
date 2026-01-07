export async function loadJSON(path){
  const url = `${path}?v=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

export async function loadData(){
  const [site, catalog] = await Promise.all([
    loadJSON("assets/data/site.json"),
    loadJSON("assets/data/catalog.json")
  ]);
  return { site, catalog };
}
