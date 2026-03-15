const jsonCache = new Map();

async function fetchJSON(path) {
  if (jsonCache.has(path)) {
    return jsonCache.get(path);
  }

  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  const data = await response.json();
  jsonCache.set(path, data);
  return data;
}

async function fetchJSONL(path) {
  if (jsonCache.has(path)) {
    return jsonCache.get(path);
  }

  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  const text = await response.text();
  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  jsonCache.set(path, rows);
  return rows;
}

function indexById(records) {
  const out = {};
  for (const record of records) {
    if (record?.id) {
      out[record.id] = record;
    }
  }
  return out;
}

async function loadMonstersForZones(zones) {
  const monsterIds = new Set();

  for (const zone of zones) {
    for (const monsterId of zone?.monsters || []) {
      monsterIds.add(monsterId);
    }
  }

  const monsterRows = await Promise.all(
    [...monsterIds].map((id) => fetchJSON(`./content/monsters/${id}.json`).catch(() => null))
  );

  return monsterRows.filter(Boolean);
}

async function loadDropTablesForMonsters(monsters) {
  const tableIds = new Set();

  for (const monster of monsters) {
    if (monster?.dropTable) {
      tableIds.add(monster.dropTable);
    }
  }

  const dropRows = await Promise.all(
    [...tableIds].map((id) => fetchJSON(`./content/drop_tables/${id}.json`).catch(() => null))
  );

  return dropRows.filter(Boolean);
}

export async function loadRegistry() {
  const [
    itemsRows,
    skillsIndex,
    zonesIndex,
    shopIndex
  ] = await Promise.all([
    fetchJSONL('./content/items.jsonl').catch(() => []),
    fetchJSON('./content/skills_index.json').catch(() => ({ skills: [] })),
    fetchJSON('./content/zones_index.json').catch(() => ({ zones: [] })),
    fetchJSON('./content/shop_index.json').catch(() => ({ items: [] }))
  ]);

  const skillIds = Array.isArray(skillsIndex.skills)
    ? skillsIndex.skills.map((entry) => (typeof entry === 'string' ? entry : entry.id)).filter(Boolean)
    : [];

  const zoneIds = Array.isArray(zonesIndex.zones)
    ? zonesIndex.zones.map((entry) => (typeof entry === 'string' ? entry : entry.id)).filter(Boolean)
    : [];

  const shopItemIds = Array.isArray(shopIndex.items)
    ? shopIndex.items.map((entry) => (typeof entry === 'string' ? entry : entry.id)).filter(Boolean)
    : [];

  const [skillsRows, zonesRows, shopRows] = await Promise.all([
    Promise.all(skillIds.map((id) => fetchJSON(`./content/skills/${id}.json`).catch(() => null))),
    Promise.all(zoneIds.map((id) => fetchJSON(`./content/zones/${id}.json`).catch(() => null))),
    Promise.all(shopItemIds.map((id) => fetchJSON(`./content/shop/${id}.json`).catch(() => null)))
  ]);

  const skills = skillsRows.filter(Boolean);
  const zones = zonesRows.filter(Boolean);
  const shopItems = shopRows.filter(Boolean);
  const items = itemsRows.filter(Boolean);

  const monsters = await loadMonstersForZones(zones);
  const dropTables = await loadDropTablesForMonsters(monsters);

  return {
    items: indexById(items),
    itemsList: items,

    skills: indexById(skills),
    skillsList: skills,

    zones: indexById(zones),
    zonesList: zones,

    monsters: indexById(monsters),
    monstersList: monsters,

    dropTables: indexById(dropTables),
    dropTablesList: dropTables,

    shopItems: indexById(shopItems),
    shopItemsList: shopItems,

    skillsIndex,
    zonesIndex,
    shopIndex
  };
}

export function clearRegistryCache() {
  jsonCache.clear();
}
