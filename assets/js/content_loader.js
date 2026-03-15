import { clearRegistryCache, loadRegistry } from './registry_loader.js';

let registryPromise = null;

async function getRegistry() {
  if (!registryPromise) {
    registryPromise = loadRegistry();
  }
  return registryPromise;
}

export function clearContentCache() {
  clearRegistryCache();
  registryPromise = null;
}

export async function loadRegistryData() {
  return getRegistry();
}

export async function loadZonesIndex() {
  const registry = await getRegistry();
  return registry.zonesIndex;
}

export async function loadZone(zoneId) {
  const registry = await getRegistry();
  const zone = registry.zones[zoneId];
  if (!zone) {
    throw new Error(`Zone not found: ${zoneId}`);
  }
  return zone;
}

export async function loadMonster(monsterId) {
  const response = await fetch(`./content/monsters/${monsterId}.json`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Monster not found: ${monsterId}`);
  }
  return response.json();
}

export async function loadDropTable(dropTableId) {
  const response = await fetch(`./content/drop_tables/${dropTableId}.json`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Drop table not found: ${dropTableId}`);
  }
  return response.json();
}

export async function loadSkillsIndex() {
  const registry = await getRegistry();
  return registry.skillsIndex;
}

export async function loadSkill(skillId) {
  const registry = await getRegistry();
  const skill = registry.skills[skillId];
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  return skill;
}

export async function loadShopIndex() {
  const registry = await getRegistry();
  return registry.shopIndex;
}

export async function loadShopItem(itemId) {
  const registry = await getRegistry();
  const item = registry.shopItems[itemId];
  if (!item) {
    throw new Error(`Shop item not found: ${itemId}`);
  }
  return item;
}

export async function loadItemRegistry() {
  const registry = await getRegistry();
  return registry.items;
}

export async function loadItemList() {
  const registry = await getRegistry();
  return registry.itemsList;
}

export async function loadShopItems() {
  const registry = await getRegistry();
  return registry.shopItemsList;
}
