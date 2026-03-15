const cache = new Map();

async function loadJSON(path) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  const data = await response.json();
  cache.set(path, data);
  return data;
}

export function clearContentCache() {
  cache.clear();
}

export async function loadZonesIndex() {
  return loadJSON('./content/zones_index.json');
}

export async function loadZone(zoneId) {
  return loadJSON(`./content/zones/${zoneId}.json`);
}

export async function loadMonster(monsterId) {
  return loadJSON(`./content/monsters/${monsterId}.json`);
}

export async function loadDropTable(dropTableId) {
  return loadJSON(`./content/drop_tables/${dropTableId}.json`);
}

export async function loadSkillsIndex() {
  return loadJSON('./content/skills_index.json');
}

export async function loadSkill(skillId) {
  return loadJSON(`./content/skills/${skillId}.json`);
}
