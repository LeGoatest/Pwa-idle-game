# Icon Dictionary (Canonical)

This document defines the mapping between system semantics and Iconify icons.
All icons MUST use the `i-lucide` collection where possible for consistency.

## 1. Core Navigation (Bottom Dock)
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Combat | `icon-[lucide--swords]` | `icon-md` |
| Gathering | `icon-[lucide--pickaxe]` | `icon-md` |
| Crafting | `icon-[lucide--hammer]` | `icon-md` |
| Inventory | `icon-[lucide--package]` | `icon-md` |
| Journal | `icon-[lucide--book-open]` | `icon-md` |

## 2. Resource & Stats
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Gold | `icon-[lucide--coins]` | `icon-sm text-yellow-500` |
| Health (HP) | `icon-[lucide--heart]` | `icon-sm text-red-500` |
| Attack (ATK) | `icon-[lucide--sword]` | `icon-sm text-orange-400` |
| Defense (DEF) | `icon-[lucide--shield]` | `icon-sm text-blue-400` |
| Experience (XP) | `icon-[lucide--sparkles]` | `icon-sm text-cyan-400` |

## 3. Utilities & Actions
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Settings | `icon-[lucide--settings]` | `icon-md` |
| Save | `icon-[lucide--save]` | `icon-sm` |
| Reset | `icon-[lucide--refresh-cw]` | `icon-sm` |
| Install | `icon-[lucide--download]` | `icon-sm` |
| Success | `icon-[lucide--check-circle-2]` | `icon-sm text-green-500` |
| Locked | `icon-[lucide--lock]` | `icon-sm icon-locked` |

## 4. Usage Rules
- All icons MUST include the base `icon-ui` class (inherited via `icon-sm/md/lg`).
- State-based styling (e.g., `icon-active`, `icon-locked`) MUST be applied via classes defined in `input.css`.
- New icon mappings MUST be added to this dictionary before use.
