const cache = new Map()

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path)

  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load ${path}`)

  const json = await res.json()
  cache.set(path, json)
  return json
}

async function fetchJSONL(path) {
  if (cache.has(path)) return cache.get(path)

  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load ${path}`)

  const text = await res.text()

  const rows = text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))

  cache.set(path, rows)
  return rows
}

function index(rows) {
  const out = {}
  for (const row of rows) {
    if (row?.id) out[row.id] = row
  }
  return out
}

async function loadSkills(skillsIndex) {
  const ids = Array.isArray(skillsIndex?.skills)
    ? skillsIndex.skills.map((x) => typeof x === 'string' ? x : x.id).filter(Boolean)
    : []

  const rows = await Promise.all(
    ids.map((id) => fetchJSON(`./content/skills/${id}.json`).catch(() => null))
  )

  return rows.filter(Boolean)
}

async function loadZones(zonesIndex) {
  const ids = Array.isArray(zonesIndex?.zones)
    ? zonesIndex.zones.map((x) => typeof x === 'string' ? x : x.id).filter(Boolean)
    : []

  const rows = await Promise.all(
    ids.map((id) => fetchJSON(`./content/zones/${id}.json`).catch(() => null))
  )

  return rows.filter(Boolean)
}

async function loadMonsters(zones) {
  const ids = new Set()

  for (const zone of zones) {
    for (const monsterId of zone?.monsters || []) {
      ids.add(monsterId)
    }
  }

  const rows = await Promise.all(
    [...ids].map((id) => fetchJSON(`./content/monsters/${id}.json`).catch(() => null))
  )

  return rows.filter(Boolean)
}

async function loadShopItems(shopIndex) {
  const ids = Array.isArray(shopIndex?.items)
    ? shopIndex.items.map((x) => typeof x === 'string' ? x : x.id).filter(Boolean)
    : []

  const rows = await Promise.all(
    ids.map((id) => fetchJSON(`./content/shop/${id}.json`).catch(() => null))
  )

  return rows.filter(Boolean)
}

export async function loadRegistry() {
  const [
    items,
    skillsIndex,
    zonesIndex,
    shopIndex
  ] = await Promise.all([
    fetchJSONL('./content/items.jsonl').catch(() => []),
    fetchJSON('./content/skills_index.json').catch(() => ({ skills: [] })),
    fetchJSON('./content/zones_index.json').catch(() => ({ zones: [] })),
    fetchJSON('./content/shop_index.json').catch(() => ({ items: [] }))
  ])

  const [skills, zones, monsters, shopItems] = await Promise.all([
    loadSkills(skillsIndex),
    loadZones(zonesIndex),
    loadMonsters(await loadZones(zonesIndex)),
    loadShopItems(shopIndex)
  ])

  return {
    items: index(items),
    itemsList: items,

    skills: index(skills),
    skillsList: skills,

    zones: index(zones),
    zonesList: zones,

    monsters: index(monsters),
    monstersList: monsters,

    shopItems: index(shopItems),
    shopItemsList: shopItems,

    skillsIndex,
    zonesIndex,
    shopIndex
  }
}

export function clearRegistryCache() {
  cache.clear()
}
