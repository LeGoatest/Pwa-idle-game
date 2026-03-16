import { gainXp } from "./progression.js"

function roll(min,max){
  return Math.floor(Math.random()*(max-min+1))+min
}

export function processCombat(state, contentState, delta){

  const monster = contentState.activeMonster
  if(!monster) return false

  state.activity.progress += delta

  const duration = monster.durationMs || 2000

  let changed=false

  while(state.activity.progress >= duration){

    state.activity.progress -= duration

    const dmg = Math.max(1,state.attack || 1)
    state.enemyHp -= dmg

    if(state.enemyHp <= 0){

      state.kills++

      const table = contentState.registry.dropTables[monster.dropTable]

      if(table?.gold){
        state.gold += roll(table.gold.min, table.gold.max)
      }

      for(const d of table?.drops || []){

        if(Math.random() < d.chance){

          const amt = roll(d.min||1,d.max||1)

          state.inventory[d.item] =
            (state.inventory[d.item] || 0) + amt
        }
      }

      gainXp(state,"combat",monster.xp || 5)

      state.enemyHp = monster.hp
      state.enemyMaxHp = monster.hp
    }

    changed=true
  }

  return changed
}
