/**
 * Where the backend lives, from the browser's point of view.
 *
 * In production the backend serves this bundle itself, so the page's own
 * origin is the API origin - that keeps working behind a reverse proxy or on
 * a non-8080 port, which a hardcoded `:8080` would not.
 *
 * The vite dev server is the exception: it serves the page on 5173 while the
 * backend stays on 8080, so that one case is special-cased.
 */
const DEV_PORTS = new Set(["5173", "4173"]);

export const API_BASE = DEV_PORTS.has(window.location.port)
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : window.location.origin;

export const WS_BASE = API_BASE.replace(/^http/, "ws");
