# Icon Dictionary (Canonical)

This document defines the mapping between system semantics and Iconify icons.
All icons MUST use the `i-lucide` collection where possible for consistency.

## 1. Core Navigation (Bottom Dock)
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Combat | `i-lucide:swords` | `icon-md` |
| Gathering | `i-lucide:pickaxe` | `icon-md` |
| Crafting | `i-lucide:hammer` | `icon-md` |
| Inventory | `i-lucide:package` | `icon-md` |
| Journal | `i-lucide:book-open` | `icon-md` |

## 2. Resource & Stats
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Gold | `i-lucide:coins` | `icon-sm text-yellow-500` |
| Health (HP) | `i-lucide:heart` | `icon-sm text-red-500` |
| Attack (ATK) | `i-lucide:sword` | `icon-sm text-orange-400` |
| Defense (DEF) | `i-lucide:shield` | `icon-sm text-blue-400` |
| Experience (XP) | `i-lucide:sparkles` | `icon-sm text-cyan-400` |

## 3. Utilities & Actions
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Settings | `i-lucide:settings` | `icon-md` |
| Save | `i-lucide:save` | `icon-sm` |
| Reset | `i-lucide:refresh-cw` | `icon-sm` |
| Install | `i-lucide:download` | `icon-sm` |
| Success | `i-lucide:check-circle-2` | `icon-sm text-green-500` |
| Locked | `i-lucide:lock` | `icon-sm icon-locked` |

## 4. Usage Rules
- All icons MUST include the base `icon-ui` class (inherited via `icon-sm/md/lg`).
- State-based styling (e.g., `icon-active`, `icon-locked`) MUST be applied via classes defined in `input.css`.
- New icon mappings MUST be added to this dictionary before use.
