import { loadItemList, loadItemRegistry as loadRegistryMap } from './content_loader.js';

let itemRegistry = {};
let itemList = [];

export async function loadItemRegistry() {
  const [map, list] = await Promise.all([
    loadRegistryMap(),
    loadItemList()
  ]);

  itemRegistry = map || {};
  itemList = list || [];
  return itemRegistry;
}

export function getItem(id) {
  return itemRegistry[id] || null;
}

export function getItemsByTag(tag) {
  return itemList.filter((item) => Array.isArray(item.tags) && item.tags.includes(tag));
}

export function getAllItems() {
  return itemList;
}
