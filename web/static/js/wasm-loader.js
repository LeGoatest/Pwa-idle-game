(function () {
  let bootPromise = null;

  async function instantiateWasm() {
    if (!WebAssembly.instantiateStreaming) {
      WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return WebAssembly.instantiate(source, importObject);
      };
    }

    const go = new Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch("/static/wasm/app.wasm"),
      go.importObject
    );

    go.run(result.instance);
  }

  async function loadJSON(url, fallback = null) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      if (fallback !== null) return fallback;
      throw new Error(`Failed to load ${url}`);
    }
    return res.json();
  }

  async function loadJSONL(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);

    const text = await res.text();
    return text
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  function indexById(rows) {
    const out = {};
    for (const row of rows || []) {
      if (row && row.id) out[row.id] = row;
    }
    return out;
  }

  async function loadByIds(base, ids) {
    const rows = await Promise.all(
      (ids || []).map(async (id) => {
        const res = await fetch(`${base}/${id}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${base}/${id}.json`);
        return res.json();
      })
    );
    return rows;
  }

  async function buildRegistry() {
    const items = await loadJSONL("/content/items.jsonl");
    const skillsIndex = await loadJSON("/content/skills_index.json", { skills: [] });
    const zonesIndex = await loadJSON("/content/zones_index.json", { zones: [] });
    const shopIndex = await loadJSON("/content/shop_index.json", { items: [] });

    const skillIds = Array.isArray(skillsIndex.skills)
      ? skillsIndex.skills.map((x) => (typeof x === "string" ? x : x.id)).filter(Boolean)
      : [];

    const zoneIds = Array.isArray(zonesIndex.zones)
      ? zonesIndex.zones.map((x) => (typeof x === "string" ? x : x.id)).filter(Boolean)
      : [];

    const skills = await loadByIds("/content/skills", skillIds);
    const zones = await loadByIds("/content/zones", zoneIds);

    const monsterIds = [...new Set(
      zones.flatMap((zone) => Array.isArray(zone.monsters) ? zone.monsters : [])
    )];

    const monsters = await loadByIds("/content/monsters", monsterIds);

    let shopItems = [];
    if (Array.isArray(shopIndex.items) && shopIndex.items.length > 0) {
      const shopIds = shopIndex.items.map((x) => (typeof x === "string" ? x : x.id)).filter(Boolean);
      shopItems = await loadByIds("/content/shop", shopIds);
    }

    return {
      items: indexById(items),
      itemsList: items,
      skills: indexById(skills),
      skillsList: skills,
      zones: indexById(zones),
      zonesList: zones,
      monsters: indexById(monsters),
      monstersList: monsters,
      shopItems: indexById(shopItems),
      shopItemsList: shopItems,
      skillsIndex,
      zonesIndex,
      shopIndex
    };
  }

  async function loadSaveJSON() {
    try {
      return localStorage.getItem("game-save-json") || "";
    } catch {
      return "";
    }
  }

  async function boot() {
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      await instantiateWasm();

      const registry = await buildRegistry();
      const saveJSON = await loadSaveJSON();

      const result = window.gameInit(JSON.stringify(registry), saveJSON);
      if (!result || !result.ok) {
        throw new Error(result?.error || "gameInit failed");
      }

      return result;
    })();

    return bootPromise;
  }

  window.GameWASM = {
    boot,
    async init() {
      return boot();
    },
    tick(deltaMS) {
      return window.gameTick(deltaMS);
    },
    dispatch(action) {
      return window.gameDispatch(JSON.stringify(action));
    },
    exportSave() {
      return window.gameExportSave();
    },
    getState() {
      return window.gameGetState();
    }
  };
})();
