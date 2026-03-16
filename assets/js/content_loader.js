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
