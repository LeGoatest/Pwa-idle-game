const cache = new Map();

async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);

  const res = await fetch(path);
  const data = await res.json();

  cache.set(path, data);
  return data;
}

export async function loadZonesIndex() {
  return loadJSON("/content/zones_index.json");
}

export async function loadZone(id) {
  return loadJSON(`/content/zones/${id}.json`);
}

export async function loadMonster(id) {
  return loadJSON(`/content/monsters/${id}.json`);
}

export async function loadDropTable(id) {
  return loadJSON(`/content/drop_tables/${id}.json`);
}

export async function loadSkillsIndex() {
  return loadJSON("/content/skills_index.json");
}

export async function loadSkill(id) {
  return loadJSON(`/content/skills/${id}.json`);
}
