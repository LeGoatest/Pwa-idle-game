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
  const registry = await getRegistry();
  const monster = registry.monsters[monsterId];
  if (!monster) {
    throw new Error(`Monster not found: ${monsterId}`);
  }
  return monster;
}

export async function loadDropTable(dropTableId) {
  const registry = await getRegistry();
  const dropTable = registry.dropTables[dropTableId];
  if (!dropTable) {
    throw new Error(`Drop table not found: ${dropTableId}`);
  }
  return dropTable;
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

export async function loadMonsterList() {
  const registry = await getRegistry();
  return registry.monstersList;
}

export async function loadDropTableList() {
  const registry = await getRegistry();
  return registry.dropTablesList;
}
