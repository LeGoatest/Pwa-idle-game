import { loadMonster, loadDropTable } from "../content_loader.js";

export async function getMonsterData(monsterId) {
  const monster = await loadMonster(monsterId);
  const drops = await loadDropTable(monster.dropTable);

  return {
    monster,
    drops
  };
}

export function rollDrops(table) {
  const rewards = [];

  for (const entry of table.drops) {
    if (Math.random() < entry.chance) {
      const amount = entry.min
        ? rand(entry.min, entry.max)
        : 1;

      rewards.push({
        item: entry.item,
        amount
      });
    }
  }

  return rewards;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
