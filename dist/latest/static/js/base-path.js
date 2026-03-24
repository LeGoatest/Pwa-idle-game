export function getBasePath() {
  // Prefer injected base path (templ can set this)
  if (window.__BASE_PATH__ !== undefined) {
    return window.__BASE_PATH__ || "";
  }

  const path = window.location.pathname;
  const parts = path.split("/").filter(Boolean);

  // e.g. /Pwa-idle-game/... → base = /Pwa-idle-game
  if (parts.length > 0) {
    return "/" + parts[0];
  }

  return "";
}

export const BASE_PATH = getBasePath();
