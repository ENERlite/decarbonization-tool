import { validateBuilding, computeBaselineDerived } from "./schema.js";

// Resolve the base path so this works under any deployment (Vercel root, subdirectory, etc.)
function basePath() {
  // import.meta.env.BASE_URL is provided by Vite based on `base` in vite.config.js
  return import.meta.env.BASE_URL || "/";
}

export async function loadBuildingIndex() {
  const url = basePath() + "buildings/index.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load building index from ${url}`);
  const data = await res.json();
  return data.buildings;
}

export async function loadBuilding(id) {
  const url = `${basePath()}buildings/${id}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load building "${id}"`);
  const raw = await res.json();
  const errors = validateBuilding(raw);
  if (errors.length > 0) {
    console.warn(`Building "${id}" has validation issues:`, errors);
  }
  // Decorate with derived properties
  return {
    ...raw,
    baseline: computeBaselineDerived(raw.baseline),
  };
}

export async function loadAllBuildings() {
  const ids = await loadBuildingIndex();
  const buildings = await Promise.all(ids.map(loadBuilding));
  return buildings;
}
