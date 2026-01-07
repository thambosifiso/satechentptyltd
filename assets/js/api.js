export async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
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
