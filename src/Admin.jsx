import React, { useState, useMemo } from "react";
import { fontStack, uiStack, monoStack, COLORS, CAT_COLORS } from "./theme.jsx";
import { validateBuilding, computeBaselineDerived, BUILDING_TYPES, CATEGORIES, SCHEMA_VERSION } from "./schema.js";
import { navigate } from "./router.js";

// ============================================================================
// EMPTY TEMPLATES
// ============================================================================

function emptyBuilding() {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: "",
    name: "",
    type: "Commercial Office",
    location: "",
    yearBuilt: "",
    floorArea: "",
    stories: "",
    construction: "",
    occupancy: "",
    notes: "",
    baseline: {
      electricityKwh: "",
      gasKbtu: "",
      peakKw: "",
      ghgGas: "",
      ghgElec: "",
      eui: "",
      annualElecCost: "",
      annualGasCost: "",
      npvElecCost: "",
      npvGasCost: "",
    },
    measures: [],
  };
}

function emptyMeasure() {
  return {
    id: "",
    name: "",
    cat: "Reduce",
    isBundle: false,
    elecKwh: "",
    peakKw: "",
    gasKbtu: "",
    ghgGas: "",
    ghgElec: "",
    eui: "",
    investment: "",
    npvTotalCost: "",
    savings: "",
  };
}

// Convert form strings to numbers before saving / validating
function coerceNumbers(obj, fields) {
  const out = { ...obj };
  for (const f of fields) {
    if (typeof out[f] === "string") {
      const n = parseFloat(out[f]);
      out[f] = isNaN(n) ? out[f] : n;
    }
  }
  return out;
}

function buildingToValidatable(b) {
  const baseFields = ["electricityKwh", "gasKbtu", "peakKw", "ghgGas", "ghgElec", "eui", "annualElecCost", "annualGasCost", "npvElecCost", "npvGasCost"];
  const measureFields = ["elecKwh", "peakKw", "gasKbtu", "ghgGas", "ghgElec", "eui", "investment", "npvTotalCost", "savings"];
  const intFields = ["yearBuilt", "floorArea", "stories"];
  return {
    ...coerceNumbers(b, intFields),
    baseline: coerceNumbers(b.baseline, baseFields),
    measures: b.measures.map((m) => coerceNumbers(m, measureFields)),
  };
}

// ============================================================================
// MAIN ADMIN COMPONENT
// ============================================================================

export default function Admin() {
  const [building, setBuilding] = useState(emptyBuilding());
  const [showJson, setShowJson] = useState(false);
  const [importError, setImportError] = useState("");

  const validatable = useMemo(() => buildingToValidatable(building), [building]);
  const errors = useMemo(() => validateBuilding(validatable), [validatable]);
  const isValid = errors.length === 0;

  const updateField = (field, value) => setBuilding({ ...building, [field]: value });
  const updateBaseline = (field, value) => setBuilding({ ...building, baseline: { ...building.baseline, [field]: value } });
  const updateMeasure = (index, field, value) => {
    const next = [...building.measures];
    next[index] = { ...next[index], [field]: value };
    setBuilding({ ...building, measures: next });
  };
  const addMeasure = () => setBuilding({ ...building, measures: [...building.measures, emptyMeasure()] });
  const removeMeasure = (index) => {
    setBuilding({ ...building, measures: building.measures.filter((_, i) => i !== index) });
  };
  const duplicateMeasure = (index) => {
    const m = { ...building.measures[index], id: building.measures[index].id + "-copy" };
    const next = [...building.measures];
    next.splice(index + 1, 0, m);
    setBuilding({ ...building, measures: next });
  };

  const downloadJson = () => {
    const json = JSON.stringify(validatable, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${building.id || "new-building"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Convert numbers back to strings for the form (so empty inputs don't show 0)
        const stringify = (obj) => {
          const out = {};
          for (const k in obj) out[k] = obj[k] === undefined || obj[k] === null ? "" : String(obj[k]);
          return out;
        };
        setBuilding({
          schemaVersion: data.schemaVersion || SCHEMA_VERSION,
          id: data.id || "",
          name: data.name || "",
          type: data.type || "Commercial Office",
          location: data.location || "",
          yearBuilt: data.yearBuilt ?? "",
          floorArea: data.floorArea ?? "",
          stories: data.stories ?? "",
          construction: data.construction || "",
          occupancy: data.occupancy || "",
          notes: data.notes || "",
          baseline: stringify(data.baseline || {}),
          measures: (data.measures || []).map((m) => ({
            ...emptyMeasure(),
            ...stringify(m),
            isBundle: !!m.isBundle,
            cat: m.cat || "Reduce",
          })),
        });
        setImportError("");
      } catch (err) {
        setImportError(`Could not parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // allow re-importing same file
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.ink, fontFamily: uiStack }}>
      <AdminHeader />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: uiStack, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 12 }}>
            Building Builder · Admin
          </div>
          <h2 style={{ fontFamily: fontStack, fontSize: 38, fontWeight: 400, margin: "0 0 12px", color: COLORS.ink, letterSpacing: "-0.02em" }}>
            Add a new <span style={{ fontStyle: "italic", color: COLORS.greenSoft }}>building</span>
          </h2>
          <p style={{ fontFamily: uiStack, fontSize: 14, color: COLORS.inkSoft, margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
            Fill in your building's specifications, baseline performance, and the retrofit measures you've modeled. When everything is valid, download the JSON file and add it to the project's <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>public/buildings/</code> folder, then list it in <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>index.json</code>.
          </p>
        </div>

        {/* Import / actions bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontFamily: uiStack, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.green, cursor: "pointer", padding: "10px 16px", border: `1px solid ${COLORS.green}`, fontWeight: 500 }}>
            Import existing JSON
            <input type="file" accept=".json,application/json" onChange={importJson} style={{ display: "none" }} />
          </label>
          <button onClick={() => setBuilding(emptyBuilding())} style={{ background: "transparent", border: `1px solid ${COLORS.rule}`, color: COLORS.inkSoft, padding: "10px 16px", fontFamily: uiStack, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontWeight: 500 }}>
            Reset form
          </button>
          {importError && <span style={{ color: COLORS.terracotta, fontSize: 12 }}>{importError}</span>}
        </div>

        {/* SECTION 1: Basics */}
        <FormSection title="Building basics" subtitle="Identity, location, and physical characteristics.">
          <FormGrid>
            <Field label="ID (URL slug)" hint="lowercase, hyphens only, e.g. 'kaiser-pasadena'" required>
              <Input value={building.id} onChange={(v) => updateField("id", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="my-building-id" />
            </Field>
            <Field label="Display name" required>
              <Input value={building.name} onChange={(v) => updateField("name", v)} placeholder="Kaiser Permanente Pasadena Medical Office" />
            </Field>
            <Field label="Building type" required>
              <Select value={building.type} options={BUILDING_TYPES} onChange={(v) => updateField("type", v)} />
            </Field>
            <Field label="Location" hint="city, state — used for display only" required>
              <Input value={building.location} onChange={(v) => updateField("location", v)} placeholder="Los Angeles County, CA" />
            </Field>
            <Field label="Year built" required>
              <Input type="number" value={building.yearBuilt} onChange={(v) => updateField("yearBuilt", v)} placeholder="1985" />
            </Field>
            <Field label="Floor area (ft²)" required>
              <Input type="number" value={building.floorArea} onChange={(v) => updateField("floorArea", v)} placeholder="120000" />
            </Field>
            <Field label="Number of stories" required>
              <Input type="number" value={building.stories} onChange={(v) => updateField("stories", v)} placeholder="5" />
            </Field>
            <Field label="Construction" hint="frame type, envelope" required>
              <Input value={building.construction} onChange={(v) => updateField("construction", v)} placeholder="Steel frame, brick veneer, double-glazed" />
            </Field>
            <Field label="Occupancy" hint="hours, density, schedule" required wide>
              <Input value={building.occupancy} onChange={(v) => updateField("occupancy", v)} placeholder="Mon–Fri 7 AM – 7 PM, ~250 occupants" />
            </Field>
            <Field label="Notes" hint="story, context, key constraints — shown to users on the spec page" required wide>
              <Textarea value={building.notes} onChange={(v) => updateField("notes", v)} placeholder="Why this building? What makes its decarbonization journey distinctive?" rows={3} />
            </Field>
          </FormGrid>
        </FormSection>

        {/* SECTION 2: Baseline */}
        <FormSection title="Baseline performance" subtitle="Annual energy use, emissions, and utility costs at the start of analysis. Use modeled or metered values consistent with your study.">
          <FormGrid>
            <Field label="Annual electricity (kWh)" required>
              <Input type="number" value={building.baseline.electricityKwh} onChange={(v) => updateBaseline("electricityKwh", v)} />
            </Field>
            <Field label="Annual natural gas (kBtu)" required>
              <Input type="number" value={building.baseline.gasKbtu} onChange={(v) => updateBaseline("gasKbtu", v)} />
            </Field>
            <Field label="Peak electric demand (kW)" required>
              <Input type="number" value={building.baseline.peakKw} onChange={(v) => updateBaseline("peakKw", v)} />
            </Field>
            <Field label="Energy use intensity (kBtu/ft²/yr)" required>
              <Input type="number" value={building.baseline.eui} onChange={(v) => updateBaseline("eui", v)} step="0.1" />
            </Field>
            <Field label="GHG from gas (tonnes CO₂)" required>
              <Input type="number" value={building.baseline.ghgGas} onChange={(v) => updateBaseline("ghgGas", v)} step="0.1" />
            </Field>
            <Field label="GHG from electricity (tonnes CO₂)" hint="0 if all renewable" required>
              <Input type="number" value={building.baseline.ghgElec} onChange={(v) => updateBaseline("ghgElec", v)} step="0.1" />
            </Field>
            <Field label="Annual electricity cost ($)" required>
              <Input type="number" value={building.baseline.annualElecCost} onChange={(v) => updateBaseline("annualElecCost", v)} />
            </Field>
            <Field label="Annual gas cost ($)" required>
              <Input type="number" value={building.baseline.annualGasCost} onChange={(v) => updateBaseline("annualGasCost", v)} />
            </Field>
            <Field label="25-yr NPV electricity cost ($)" required>
              <Input type="number" value={building.baseline.npvElecCost} onChange={(v) => updateBaseline("npvElecCost", v)} />
            </Field>
            <Field label="25-yr NPV gas cost ($)" required>
              <Input type="number" value={building.baseline.npvGasCost} onChange={(v) => updateBaseline("npvGasCost", v)} />
            </Field>
          </FormGrid>
        </FormSection>

        {/* SECTION 3: Measures */}
        <FormSection title={`Retrofit measures (${building.measures.length})`} subtitle="Each measure is one parametric scenario from your modeling. Mark engineered combinations as 'verified bundles' — these are the ones with modeled interaction effects.">
          {building.measures.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", border: `1px dashed ${COLORS.rule}`, color: COLORS.inkSoft, fontSize: 14, marginBottom: 16 }}>
              No measures yet. Add your first one below.
            </div>
          )}
          {building.measures.map((m, i) => (
            <MeasureForm
              key={i}
              index={i}
              measure={m}
              onUpdate={(field, value) => updateMeasure(i, field, value)}
              onRemove={() => removeMeasure(i)}
              onDuplicate={() => duplicateMeasure(i)}
            />
          ))}
          <button onClick={addMeasure} style={{ background: COLORS.cream, border: `1px dashed ${COLORS.green}`, color: COLORS.green, padding: "16px 24px", fontFamily: uiStack, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", width: "100%", fontWeight: 500, marginTop: 8 }}>
            + Add a measure
          </button>
        </FormSection>

        {/* Validation panel + actions */}
        <ValidationPanel errors={errors} isValid={isValid} />

        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={downloadJson} disabled={!isValid} style={{ background: isValid ? COLORS.green : COLORS.rule, color: COLORS.cream, border: "none", padding: "16px 32px", fontFamily: uiStack, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, cursor: isValid ? "pointer" : "not-allowed" }}>
            ↓ Download {building.id || "new-building"}.json
          </button>
          <button onClick={() => setShowJson(!showJson)} style={{ background: "transparent", color: COLORS.green, border: `1px solid ${COLORS.green}`, padding: "16px 24px", fontFamily: uiStack, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer" }}>
            {showJson ? "Hide" : "Preview"} JSON
          </button>
        </div>

        {showJson && (
          <pre style={{ marginTop: 24, padding: 24, background: COLORS.ink, color: "#d6e3da", fontFamily: monoStack, fontSize: 12, overflow: "auto", maxHeight: 500, lineHeight: 1.6, border: `1px solid ${COLORS.green}` }}>
            {JSON.stringify(validatable, null, 2)}
          </pre>
        )}

        {/* Deployment instructions */}
        <DeployInstructions buildingId={building.id} isValid={isValid} />
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function AdminHeader() {
  return (
    <header style={{ padding: "28px 48px 24px", borderBottom: `1px solid ${COLORS.rule}`, background: COLORS.cream, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 6 }}>
            Decarbonization Pathways · Admin
          </div>
          <h1 style={{ margin: 0, fontFamily: fontStack, fontSize: 28, fontWeight: 400, color: COLORS.ink, letterSpacing: "-0.02em" }}>
            Building <span style={{ fontStyle: "italic", color: COLORS.greenSoft }}>Builder</span>
          </h1>
        </div>
        <button onClick={() => navigate("")} style={{ background: "transparent", border: `1px solid ${COLORS.rule}`, color: COLORS.inkSoft, padding: "10px 18px", fontFamily: uiStack, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontWeight: 500 }}>
          ← Back to tool
        </button>
      </div>
    </header>
  );
}

function FormSection({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 48, paddingBottom: 32, borderBottom: `1px solid ${COLORS.rule}` }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: fontStack, fontSize: 24, fontWeight: 400, margin: "0 0 6px", color: COLORS.ink, letterSpacing: "-0.01em" }}>{title}</h3>
        <p style={{ fontFamily: uiStack, fontSize: 13, color: COLORS.inkSoft, margin: 0, lineHeight: 1.5, maxWidth: 640 }}>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function FormGrid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>{children}</div>;
}

function Field({ label, hint, required, wide, children }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : "auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontFamily: uiStack, fontSize: 12, color: COLORS.ink, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: COLORS.terracotta, marginLeft: 4 }}>*</span>}
        </label>
        {hint && <span style={{ fontFamily: uiStack, fontSize: 10, color: COLORS.inkSoft, fontStyle: "italic" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", step }) {
  return (
    <input type={type} value={value} step={step} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 12px", fontFamily: type === "number" ? monoStack : uiStack, fontSize: 14, border: `1px solid ${COLORS.rule}`, background: COLORS.cream, color: COLORS.ink, outline: "none", transition: "border-color 0.2s" }}
      onFocus={(e) => (e.target.style.borderColor = COLORS.green)} onBlur={(e) => (e.target.style.borderColor = COLORS.rule)} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 12px", fontFamily: uiStack, fontSize: 14, border: `1px solid ${COLORS.rule}`, background: COLORS.cream, color: COLORS.ink, outline: "none", resize: "vertical", lineHeight: 1.5 }}
      onFocus={(e) => (e.target.style.borderColor = COLORS.green)} onBlur={(e) => (e.target.style.borderColor = COLORS.rule)} />
  );
}

function Select({ value, options, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", fontFamily: uiStack, fontSize: 14, border: `1px solid ${COLORS.rule}`, background: COLORS.cream, color: COLORS.ink, outline: "none", cursor: "pointer" }}>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: uiStack, fontSize: 13, color: COLORS.ink, cursor: "pointer", userSelect: "none" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: COLORS.green, cursor: "pointer" }} />
      {label}
    </label>
  );
}

function MeasureForm({ index, measure, onUpdate, onRemove, onDuplicate }) {
  const [collapsed, setCollapsed] = useState(false);
  const accentColor = CAT_COLORS[measure.cat] || COLORS.green;

  return (
    <div style={{ border: `1px solid ${COLORS.rule}`, borderLeft: `4px solid ${accentColor}`, background: COLORS.cream, marginBottom: 12 }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: collapsed ? "none" : `1px solid ${COLORS.rule}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: monoStack, fontSize: 12, color: COLORS.inkSoft, minWidth: 28 }}>#{index + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fontStack, fontSize: 16, color: COLORS.ink, lineHeight: 1.2 }}>
              {measure.name || <span style={{ color: COLORS.inkSoft, fontStyle: "italic" }}>Untitled measure</span>}
              {measure.isBundle && <span style={{ marginLeft: 8, fontFamily: uiStack, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: COLORS.green, color: COLORS.cream, padding: "2px 6px", fontWeight: 600 }}>Verified Bundle</span>}
            </div>
            <div style={{ fontFamily: uiStack, fontSize: 11, color: COLORS.inkSoft, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>{measure.cat}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: `1px solid ${COLORS.rule}`, color: COLORS.inkSoft, padding: "6px 12px", fontFamily: uiStack, fontSize: 11, cursor: "pointer" }}>{collapsed ? "Expand" : "Collapse"}</button>
          <button onClick={onDuplicate} style={{ background: "transparent", border: `1px solid ${COLORS.rule}`, color: COLORS.inkSoft, padding: "6px 12px", fontFamily: uiStack, fontSize: 11, cursor: "pointer" }}>Duplicate</button>
          <button onClick={onRemove} style={{ background: "transparent", border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, padding: "6px 12px", fontFamily: uiStack, fontSize: 11, cursor: "pointer" }}>Remove</button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: "20px 18px" }}>
          <FormGrid>
            <Field label="Measure ID" hint="lowercase, hyphens" required>
              <Input value={measure.id} onChange={(v) => onUpdate("id", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="hpwh" />
            </Field>
            <Field label="Display name" required>
              <Input value={measure.name} onChange={(v) => onUpdate("name", v)} placeholder="Heat Pump Water Heater" />
            </Field>
            <Field label="Category" required>
              <Select value={measure.cat} options={CATEGORIES} onChange={(v) => onUpdate("cat", v)} />
            </Field>
            <Field label="Type" hint="bundles use modeled interaction effects">
              <div style={{ paddingTop: 10 }}>
                <Checkbox checked={measure.isBundle} onChange={(v) => onUpdate("isBundle", v)} label="Verified bundle (engineered package)" />
              </div>
            </Field>
          </FormGrid>

          <div style={{ marginTop: 20, marginBottom: 8, fontFamily: uiStack, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft }}>
            Resulting performance after this measure
          </div>
          <FormGrid>
            <Field label="Electricity (kWh/yr)" required>
              <Input type="number" value={measure.elecKwh} onChange={(v) => onUpdate("elecKwh", v)} />
            </Field>
            <Field label="Peak demand (kW)" required>
              <Input type="number" value={measure.peakKw} onChange={(v) => onUpdate("peakKw", v)} />
            </Field>
            <Field label="Natural gas (kBtu/yr)" required>
              <Input type="number" value={measure.gasKbtu} onChange={(v) => onUpdate("gasKbtu", v)} />
            </Field>
            <Field label="EUI (kBtu/ft²/yr)" required>
              <Input type="number" step="0.1" value={measure.eui} onChange={(v) => onUpdate("eui", v)} />
            </Field>
            <Field label="GHG from gas (t CO₂)" required>
              <Input type="number" step="0.1" value={measure.ghgGas} onChange={(v) => onUpdate("ghgGas", v)} />
            </Field>
            <Field label="GHG from electricity (t CO₂)" required>
              <Input type="number" step="0.1" value={measure.ghgElec} onChange={(v) => onUpdate("ghgElec", v)} />
            </Field>
          </FormGrid>

          <div style={{ marginTop: 20, marginBottom: 8, fontFamily: uiStack, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft }}>
            Economics
          </div>
          <FormGrid>
            <Field label="Initial investment ($)" required>
              <Input type="number" value={measure.investment} onChange={(v) => onUpdate("investment", v)} />
            </Field>
            <Field label="25-yr NPV total cost ($)" required>
              <Input type="number" value={measure.npvTotalCost} onChange={(v) => onUpdate("npvTotalCost", v)} />
            </Field>
            <Field label="25-yr NPV savings vs baseline ($)" hint="negative = net cost" required>
              <Input type="number" value={measure.savings} onChange={(v) => onUpdate("savings", v)} />
            </Field>
          </FormGrid>
        </div>
      )}
    </div>
  );
}

function ValidationPanel({ errors, isValid }) {
  if (isValid) {
    return (
      <div style={{ padding: "16px 20px", background: COLORS.cream, border: `1px solid ${COLORS.green}`, borderLeft: `4px solid ${COLORS.green}` }}>
        <div style={{ fontFamily: fontStack, fontSize: 16, color: COLORS.green, marginBottom: 4 }}>✓ Building data is valid</div>
        <div style={{ fontFamily: uiStack, fontSize: 13, color: COLORS.inkSoft }}>Ready to download. The JSON will pass schema validation when loaded by the tool.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "16px 20px", background: COLORS.cream, border: `1px solid ${COLORS.terracotta}`, borderLeft: `4px solid ${COLORS.terracotta}` }}>
      <div style={{ fontFamily: fontStack, fontSize: 16, color: COLORS.terracotta, marginBottom: 8 }}>{errors.length} item{errors.length === 1 ? "" : "s"} need attention</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontFamily: uiStack, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.7 }}>
        {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
        {errors.length > 10 && <li style={{ fontStyle: "italic" }}>...and {errors.length - 10} more</li>}
      </ul>
    </div>
  );
}

function DeployInstructions({ buildingId, isValid }) {
  if (!isValid || !buildingId) return null;
  return (
    <div style={{ marginTop: 48, padding: "28px 32px", background: COLORS.cream, border: `1px solid ${COLORS.rule}` }}>
      <h3 style={{ fontFamily: fontStack, fontSize: 22, fontWeight: 400, margin: "0 0 16px", color: COLORS.ink, letterSpacing: "-0.01em" }}>
        Next steps to publish
      </h3>
      <ol style={{ fontFamily: uiStack, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.8, paddingLeft: 24, margin: 0 }}>
        <li>Click <strong style={{ color: COLORS.green }}>Download</strong> above to save <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>{buildingId}.json</code></li>
        <li>In your project's GitHub repo, navigate to the <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>public/buildings/</code> folder</li>
        <li>Click <em>Add file → Upload files</em> and drop in the downloaded JSON</li>
        <li>Open <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>public/buildings/index.json</code> and add <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>"{buildingId}"</code> to the <code style={{ background: COLORS.bgAlt, padding: "1px 6px", fontFamily: monoStack, fontSize: 12 }}>"buildings"</code> array</li>
        <li>Commit. Vercel auto-redeploys within 1–2 minutes. The new building shows up automatically.</li>
      </ol>
    </div>
  );
}
