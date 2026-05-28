const cache = new Map()

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path)

  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)

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

function warnMissingContent(type, id, error) {
  console.warn(`[content] Missing ${type} "${id}". Rendering a placeholder so the UI can continue.`, error)
}

function createMonsterPlaceholder(id, error) {
  warnMissingContent('monster', id, error)

  const name = id
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown Monster'

  return {
    id,
    name,
    level: 1,
    hp: 12,
    attack: 1,
    defense: 0,
    durationMs: 3000,
    xp: 1,
    missingContent: true
  }
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

  return Promise.all(
    [...ids].map((id) => fetchJSON(`./content/monsters/${id}.json`).catch((error) => createMonsterPlaceholder(id, error)))
  )
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

  const zones = await loadZones(zonesIndex)

  const [skills, monsters, shopItems] = await Promise.all([
    loadSkills(skillsIndex),
    loadMonsters(zones),
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
