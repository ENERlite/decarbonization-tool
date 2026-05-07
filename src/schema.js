// ============================================================================
// BUILDING SCHEMA
// ============================================================================
// This is the source of truth for what a building's data file must contain.
// Every building JSON file in /public/buildings/ follows this shape.
//
// To add a new building:
//   1. Use the admin page at /admin to fill out a form and download a JSON file
//   2. Save the JSON to public/buildings/<your-id>.json
//   3. Add the filename (without .json) to public/buildings/index.json
//   4. Push to GitHub. Vercel auto-redeploys. Done.
// ============================================================================

export const SCHEMA_VERSION = "1.0";

// Categories from the 6R Resilient Retrofit Framework (CEC study, Feb 2026)
export const CATEGORIES = ["Reduce", "Recover", "Repair", "Replace", "Regenerate", "Bundle"];

export const BUILDING_TYPES = [
  "Commercial Office",
  "Big-Box Retail",
  "Multifamily Residential",
  "Healthcare",
  "Education",
  "Hospitality",
  "Industrial",
  "Mixed-Use",
  "Other",
];

// Default category color mapping (used by the UI)
export const CATEGORY_COLORS = {
  Reduce: "#a3a380",
  Recover: "#7d8c5c",
  Repair: "#bda47a",
  Replace: "#456a5a",
  Regenerate: "#c47b50",
  Bundle: "#2d4a3e",
};

/**
 * The complete shape of a building file.
 *
 * Building = {
 *   schemaVersion: "1.0",
 *   id: string,              // url-safe, e.g. "office", "kaiser-pasadena"
 *   name: string,            // display name
 *   type: string,            // one of BUILDING_TYPES
 *   location: string,        // free text
 *   yearBuilt: number,
 *   floorArea: number,       // ft²
 *   stories: number,
 *   construction: string,    // free text
 *   occupancy: string,       // free text
 *   notes: string,           // free text - context, story, constraints
 *
 *   baseline: {
 *     electricityKwh: number,
 *     gasKbtu: number,
 *     peakKw: number,
 *     ghgGas: number,        // tonnes CO2 / yr
 *     ghgElec: number,       // tonnes CO2 / yr
 *     eui: number,           // kBtu / ft² / yr
 *     annualElecCost: number,
 *     annualGasCost: number,
 *     npvElecCost: number,   // 25-yr NPV
 *     npvGasCost: number,    // 25-yr NPV
 *   },
 *
 *   measures: Measure[]
 * }
 *
 * Measure = {
 *   id: string,              // url-safe within building, e.g. "hpwh"
 *   name: string,
 *   cat: string,             // one of CATEGORIES
 *   isBundle: boolean,       // true = engineered package with verified interactions
 *   elecKwh: number,         // resulting annual electricity (post-measure)
 *   peakKw: number,          // resulting peak demand
 *   gasKbtu: number,         // resulting annual gas
 *   ghgGas: number,          // resulting tonnes CO2 from gas
 *   ghgElec: number,         // resulting tonnes CO2 from electricity
 *   eui: number,             // resulting EUI
 *   investment: number,      // initial cost above baseline ($, in 2026 dollars)
 *   npvTotalCost: number,    // 25-yr NPV total cost (investment + utility) ($)
 *   savings: number,         // 25-yr NPV savings vs baseline ($, can be negative)
 * }
 */

// Derived properties calculated by the app, NOT stored in the JSON:
//   baseline.annualTotalCost  (= annualElecCost + annualGasCost)
//   baseline.npvTotalCost     (= npvElecCost + npvGasCost)
//   baseline.totalGhg         (= ghgGas + ghgElec)

export function computeBaselineDerived(baseline) {
  return {
    ...baseline,
    annualTotalCost: baseline.annualElecCost + baseline.annualGasCost,
    npvTotalCost: baseline.npvElecCost + baseline.npvGasCost,
    totalGhg: baseline.ghgGas + baseline.ghgElec,
  };
}

// Validation: returns array of error strings, empty if valid
export function validateBuilding(b) {
  const errors = [];
  const required = ["id", "name", "type", "location", "yearBuilt", "floorArea", "stories", "construction", "occupancy", "notes", "baseline", "measures"];
  for (const f of required) {
    if (b[f] === undefined || b[f] === null || b[f] === "") errors.push(`Missing required field: ${f}`);
  }
  if (b.id && !/^[a-z0-9-]+$/.test(b.id)) errors.push("id must be lowercase letters, numbers, and hyphens only");
  if (b.type && !BUILDING_TYPES.includes(b.type)) errors.push(`type must be one of: ${BUILDING_TYPES.join(", ")}`);

  if (b.baseline) {
    const baseFields = ["electricityKwh", "gasKbtu", "peakKw", "ghgGas", "ghgElec", "eui", "annualElecCost", "annualGasCost", "npvElecCost", "npvGasCost"];
    for (const f of baseFields) {
      if (typeof b.baseline[f] !== "number" || isNaN(b.baseline[f])) errors.push(`baseline.${f} must be a number`);
    }
  }

  if (Array.isArray(b.measures)) {
    if (b.measures.length === 0) errors.push("At least one measure is required");
    b.measures.forEach((m, i) => {
      const mFields = ["id", "name", "cat", "elecKwh", "peakKw", "gasKbtu", "ghgGas", "ghgElec", "eui", "investment", "npvTotalCost", "savings"];
      for (const f of mFields) {
        if (m[f] === undefined || m[f] === null) errors.push(`measure[${i}].${f} is required`);
      }
      if (m.cat && !CATEGORIES.includes(m.cat)) errors.push(`measure[${i}].cat must be one of: ${CATEGORIES.join(", ")}`);
      if (m.id && !/^[a-z0-9-]+$/.test(m.id)) errors.push(`measure[${i}].id must be lowercase, numbers, hyphens only`);
    });
    // Check for duplicate measure ids
    const ids = b.measures.map((m) => m.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) errors.push(`Duplicate measure ids: ${[...new Set(dupes)].join(", ")}`);
  }

  return errors;
}
