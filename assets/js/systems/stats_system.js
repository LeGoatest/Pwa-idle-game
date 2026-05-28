import { getItem } from '../item_registry.js'

const MIN_ACTION_SPEED_MS = 800
const MAX_ACTION_SPEED_MS = 10000
const DEFAULT_ACTION_SPEED_MS = 3000
const DEFAULT_MAX_HP = 20

const STAT_LABELS = {
  attack: 'Attack',
  defense: 'Defense',
  maxHp: 'Max HP',
  hp: 'Max HP',
  actionSpeedMs: 'Speed',
  attackSpeedMs: 'Speed',
  critChance: 'Crit',
  accuracy: 'Accuracy'
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function readNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

export function getEquippedItems(state) {
  const equipment = state.equipment || {}

  return Object.values(equipment)
    .filter(Boolean)
    .map((itemId) => getItem(itemId))
    .filter(Boolean)
}

export function getEffectiveStats(state) {
  const base = {
    attack: readNumber(state.attack, 1),
    defense: readNumber(state.defense, 0),
    maxHp: readNumber(state.maxHp, readNumber(state.hp, DEFAULT_MAX_HP)),
    actionSpeedMs: readNumber(state.actionSpeedMs, DEFAULT_ACTION_SPEED_MS),
    critChance: readNumber(state.critChance, 0),
    accuracy: readNumber(state.accuracy, 1)
  }

  for (const item of getEquippedItems(state)) {
    const stats = item.stats || {}

    base.attack += readNumber(stats.attack, 0)
    base.defense += readNumber(stats.defense, 0)
    base.maxHp += readNumber(stats.maxHp, readNumber(stats.hp, 0))
    base.actionSpeedMs += readNumber(stats.actionSpeedMs, readNumber(stats.attackSpeedMs, 0))
    base.critChance += readNumber(stats.critChance, 0)
    base.accuracy += readNumber(stats.accuracy, 0)
  }

  base.attack = Math.max(1, Math.floor(base.attack))
  base.defense = Math.max(0, Math.floor(base.defense))
  base.maxHp = Math.max(1, Math.floor(base.maxHp))
  base.actionSpeedMs = clamp(Math.floor(base.actionSpeedMs), MIN_ACTION_SPEED_MS, MAX_ACTION_SPEED_MS)
  base.critChance = clamp(base.critChance, 0, 1)
  base.accuracy = clamp(base.accuracy, 0.05, 2)

  return base
}

export function getItemStatLines(item) {
  const stats = item?.stats || {}

  return Object.entries(stats)
    .filter(([, value]) => Number.isFinite(value) && value !== 0)
    .map(([stat, value]) => formatStatModifier(stat, value))
}

export function formatStatModifier(stat, value) {
  const label = STAT_LABELS[stat] || stat

  if (stat === 'actionSpeedMs' || stat === 'attackSpeedMs') {
    const sign = value > 0 ? '+' : ''
    return `${label} ${sign}${(value / 1000).toFixed(1)}s`
  }

  if (stat === 'critChance' || stat === 'accuracy') {
    const sign = value > 0 ? '+' : ''
    return `${label} ${sign}${Math.round(value * 100)}%`
  }

  const sign = value > 0 ? '+' : ''
  return `${label} ${sign}${value}`
}

export function getFoodHealValue(item) {
  if (!item) return 0
  if (item.type === 'food' && Number.isFinite(item.heal)) return item.heal
  if (item.effect?.type === 'heal' && Number.isFinite(item.effect.value)) return item.effect.value
  return 0
}

export function consumeBestFood(state, missingHp) {
  const inventory = state.inventory || {}
  const candidates = Object.entries(inventory)
    .filter(([, amount]) => amount > 0)
    .map(([itemId]) => {
      const item = getItem(itemId)
      const heal = getFoodHealValue(item)
      return { itemId, item, heal }
    })
    .filter((candidate) => candidate.heal > 0)
    .sort((a, b) => {
      const aWaste = a.heal >= missingHp ? a.heal - missingHp : Number.POSITIVE_INFINITY
      const bWaste = b.heal >= missingHp ? b.heal - missingHp : Number.POSITIVE_INFINITY

      if (aWaste !== bWaste) return aWaste - bWaste
      return b.heal - a.heal
    })

  const choice = candidates[0]
  if (!choice) return null

  inventory[choice.itemId] -= 1
  if (inventory[choice.itemId] <= 0) delete inventory[choice.itemId]

  return choice
}
