const cache = new Map<string, string>();

/**
 * Resolves a design-token CSS variable to its value, for the few places that need a
 * literal colour (e.g. SVG attributes inside third-party components).
 */
export function cssVar(name: `--${string}`): string {
  let v = cache.get(name);
  if (v === undefined) {
    v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    cache.set(name, v);
  }
  return v;
}
