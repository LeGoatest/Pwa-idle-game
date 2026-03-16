const cache = new Map()

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path)

  const res = await fetch(path, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to load ${path}`)

  const json = await res.json()
  cache.set(path, json)
  return json
}

async function fetchJSONL(path) {
  if (cache.has(path)) return cache.get(path)

  const res = await fetch(path, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to load ${path}`)

  const text = await res.text()

  const rows = text
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean)
    .map(JSON.parse)

  cache.set(path, rows)
  return rows
}

function index(rows) {
  const out = {}
  for (const r of rows) {
    if (r?.id) out[r.id] = r
  }
  return out
}

async function loadSkills(skillsIndex) {
  const ids = skillsIndex.skills.map(x =>
    typeof x === "string" ? x : x.id
  )

  const rows = await Promise.all(
    ids.map(id =>
      fetchJSON(`./content/skills/${id}.json`).catch(() => null)
    )
  )

  return rows.filter(Boolean)
}

async function loadZones(zonesIndex) {
  const ids = zonesIndex.zones.map(x =>
    typeof x === "string" ? x : x.id
  )

  const rows = await Promise.all(
    ids.map(id =>
      fetchJSON(`./content/zones/${id}.json`).catch(() => null)
    )
  )

  return rows.filter(Boolean)
}

async function loadMonsters(zones) {
  const ids = new Set()

  for (const z of zones) {
    for (const m of z.monsters || []) {
      ids.add(m)
    }
  }

  const rows = await Promise.all(
    [...ids].map(id =>
      fetchJSON(`./content/monsters/${id}.json`).catch(() => null)
    )
  )

  return rows.filter(Boolean)
}

async function loadDropTables(monsters) {
  const ids = new Set()

  for (const m of monsters) {
    if (m.dropTable) ids.add(m.dropTable)
  }

  const rows = await Promise.all(
    [...ids].map(id =>
      fetchJSON(`./content/drop_tables/${id}.json`).catch(() => null)
    )
  )

  return rows.filter(Boolean)
}

async function loadShopItems(shopIndex) {
  const ids = shopIndex.items.map(x =>
    typeof x === "string" ? x : x.id
  )

  const rows = await Promise.all(
    ids.map(id =>
      fetchJSON(`./content/shop/${id}.json`).catch(() => null)
    )
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
    fetchJSONL("./content/items.jsonl").catch(()=>[]),
    fetchJSON("./content/skills_index.json").catch(()=>({skills:[]})),
    fetchJSON("./content/zones_index.json").catch(()=>({zones:[]})),
    fetchJSON("./content/shop_index.json").catch(()=>({items:[]}))
  ])

  const skills = await loadSkills(skillsIndex)
  const zones = await loadZones(zonesIndex)
  const monsters = await loadMonsters(zones)
  const dropTables = await loadDropTables(monsters)
  const shopItems = await loadShopItems(shopIndex)

  return {

    items: index(items),
    itemsList: items,

    skills: index(skills),
    skillsList: skills,

    zones: index(zones),
    zonesList: zones,

    monsters: index(monsters),
    monstersList: monsters,

    dropTables: index(dropTables),
    dropTablesList: dropTables,

    shopItems: index(shopItems),
    shopItemsList: shopItems,

    skillsIndex,
    zonesIndex,
    shopIndex
  }
}

export function clearRegistryCache(){
  cache.clear()
}
