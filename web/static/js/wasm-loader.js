import { BASE_PATH } from "./base-path.js";

(function () {
  let bootPromise = null;

  async function instantiateWasm() {
    if (!WebAssembly.instantiateStreaming) {
      WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
      };
    }

    const go = new Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch(`${BASE_PATH}/static/wasm/app.wasm`),
      go.importObject
    );

    go.run(result.instance);
  }

  async function loadJSON(url, fallback = null) {
    const res = await fetch(`${BASE_PATH}${url}`, { cache: "no-store" });
    if (!res.ok) {
      if (fallback !== null) return fallback;
      throw new Error(`Failed to load ${url}`);
    }
    return res.json();
  }

  async function loadJSONL(url) {
    const res = await fetch(`${BASE_PATH}${url}`, { cache: "no-store" });
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
    return Promise.all(
      (ids || []).map(async (id) => {
        const res = await fetch(`${BASE_PATH}${base}/${id}.json`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to load ${base}/${id}.json`);
        return res.json();
      })
    );
  }

  async function buildRegistry() {
    const items = await loadJSONL("/content/items.jsonl");
    const skillsIndex = await loadJSON("/content/skills_index.json", { skills: [] });
    const zonesIndex = await loadJSON("/content/zones_index.json", { zones: [] });
    const shopIndex = await loadJSON("/content/shop_index.json", { items: [] });

    const skillIDs = (skillsIndex.skills || []).map((x) =>
      typeof x === "string" ? x : x.id
    );

    const zoneIDs = (zonesIndex.zones || []).map((x) =>
      typeof x === "string" ? x : x.id
    );

    const skills = await loadByIds("/content/skills", skillIDs);
    const zones = await loadByIds("/content/zones", zoneIDs);

    const monsterIDs = [
      ...new Set(
        zones.flatMap((z) => (Array.isArray(z.monsters) ? z.monsters : []))
      ),
    ];

    const monsters = await loadByIds("/content/monsters", monsterIDs);

    return {
      items: indexById(items),
      itemsList: items,
      skills: indexById(skills),
      skillsList: skills,
      zones: indexById(zones),
      zonesList: zones,
      monsters: indexById(monsters),
      monstersList: monsters,
      skillsIndex,
      zonesIndex,
      shopIndex,
    };
  }

  async function boot(saveJSON = "") {
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      await instantiateWasm();

      const registry = await buildRegistry();
      window.__GAME_WASM_REGISTRY__ = registry;

      const result = window.gameInit(JSON.stringify(registry), saveJSON);
      if (!result || !result.ok) {
        throw new Error(result?.error || "gameInit failed");
      }

      return result;
    })();

    return bootPromise;
  }

  window.GameWASM = {
    async init(saveJSON = "") {
      return boot(saveJSON);
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
    },
  };
})();
