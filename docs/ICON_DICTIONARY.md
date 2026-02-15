# Icon Dictionary (Canonical)

This document defines the mapping between system semantics and Iconify icons.
All icons MUST use the `game-icons` collection for themed game elements and `lucide` for clean UI elements where appropriate.

## 1. Core Navigation (Bottom Dock)
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Hunt | `icon-[game-icons--crossed-swords]` | `icon-md` |
| Equipment | `icon-[game-icons--battle-gear]` | `icon-md` |
| Skills | `icon-[game-icons--skills]` | `icon-md` |
| Inventory | `icon-[game-icons--locked-chest]` | `icon-md` |
| Settings | `icon-[game-icons--cog]` | `icon-md` |

## 1.1 Skills Launcher
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Woodcutting | `icon-[game-icons--birch-trees]` | `icon-md` |
| Mining | `icon-[game-icons--pickelhaube]` | `icon-md` |
| Fishing | `icon-[game-icons--fishing-net]` | `icon-md` |
| Cooking | `icon-[game-icons--cauldron]` | `icon-md` |

## 2. Resource & Stats
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Gold | `icon-[game-icons--coins]` | `icon-sm text-yellow-500` |
| Health (HP) | `icon-[game-icons--health-normal]` | `icon-sm text-red-500` |
| Attack (ATK) | `icon-[game-icons--broadsword]` | `icon-sm text-orange-400` |
| Defense (DEF) | `icon-[game-icons--shield]` | `icon-sm text-blue-400` |

## 3. Utilities & Actions
| Semantic | Icon | Class |
| :--- | :--- | :--- |
| Settings | `icon-[game-icons--cog]` | `icon-md` |
| Close | `icon-[game-icons--cancel]` | `icon-sm` |
| Save | `icon-[game-icons--save]` | `icon-sm` |
| Reset | `icon-[game-icons--trash-can]` | `icon-sm` |

## 4. Usage Rules
- All icons MUST follow the `icon-[{collection}--{icon-name}]` syntax for Tailwind 4 dynamic selectors.
- Sizing classes (`icon-sm/md/lg`) should be applied to control dimensions.
- Color utility classes (e.g., `text-cyan-400`) should be used to style monochrome icons.
