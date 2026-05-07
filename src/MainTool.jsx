import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } from "recharts";
import { fontStack, uiStack, monoStack, COLORS, CAT_COLORS, fmt } from "./theme.jsx";
import { loadAllBuildings } from "./loader.js";
import { navigate } from "./router.js";

// ============================================================================
// CALCULATIONS
// ============================================================================

function computeImpact(building, selectedIds) {
  const b = building.baseline;
  if (selectedIds.length === 0) {
    return {
      electricityKwh: b.electricityKwh,
      gasKbtu: b.gasKbtu,
      ghgTotal: b.ghgGas + b.ghgElec,
      eui: b.eui,
      investment: 0,
      npvTotalCost: b.npvTotalCost,
      savings: 0,
      annualTotalCost: b.annualTotalCost,
      annualElecCost: b.annualElecCost,
      annualGasCost: b.annualGasCost,
      isVerified: true,
    };
  }
  const selected = selectedIds.map((id) => building.measures.find((m) => m.id === id)).filter(Boolean);

  if (selected.length === 1 && selected[0].isBundle) {
    const m = selected[0];
    return {
      electricityKwh: m.elecKwh,
      gasKbtu: m.gasKbtu,
      ghgTotal: m.ghgGas + m.ghgElec,
      eui: m.eui,
      investment: m.investment,
      npvTotalCost: m.npvTotalCost,
      savings: m.savings,
      annualTotalCost: b.annualElecCost * (m.elecKwh / Math.max(b.electricityKwh, 1)) + b.annualGasCost * (b.gasKbtu > 0 ? m.gasKbtu / b.gasKbtu : 0),
      annualElecCost: b.annualElecCost * (m.elecKwh / Math.max(b.electricityKwh, 1)),
      annualGasCost: b.annualGasCost * (b.gasKbtu > 0 ? m.gasKbtu / b.gasKbtu : 0),
      isVerified: true,
    };
  }

  // Sum of deltas
  let dElec = 0, dGas = 0, dGhgGas = 0, dGhgElec = 0, dEui = 0, invest = 0;
  for (const m of selected) {
    dElec += m.elecKwh - b.electricityKwh;
    dGas += m.gasKbtu - b.gasKbtu;
    dGhgGas += m.ghgGas - b.ghgGas;
    dGhgElec += m.ghgElec - b.ghgElec;
    dEui += m.eui - b.eui;
    invest += m.investment;
  }
  const newElec = Math.max(0, b.electricityKwh + dElec);
  const newGas = Math.max(0, b.gasKbtu + dGas);
  const newGhg = Math.max(0, b.ghgGas + b.ghgElec + dGhgGas + dGhgElec);
  const newEui = Math.max(0, b.eui + dEui);
  const sumSavings = selected.reduce((s, m) => s + m.savings, 0);
  const elecRatio = newElec / Math.max(b.electricityKwh, 1);
  const gasRatio = b.gasKbtu > 0 ? newGas / b.gasKbtu : 0;
  return {
    electricityKwh: newElec,
    gasKbtu: newGas,
    ghgTotal: newGhg,
    eui: newEui,
    investment: invest,
    npvTotalCost: b.npvTotalCost - sumSavings,
    savings: sumSavings,
    annualTotalCost: b.annualElecCost * elecRatio + b.annualGasCost * gasRatio,
    annualElecCost: b.annualElecCost * elecRatio,
    annualGasCost: b.annualGasCost * gasRatio,
    isVerified: selected.length === 1 || selected.every((m) => m.isBundle),
  };
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function Stepper({ step, onStep }) {
  const steps = ["Building", "Specifications", "Measures", "Impact"];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <React.Fragment key={label}>
            <button
              onClick={() => (done || active ? onStep(i) : null)}
              disabled={!done && !active}
              style={{
                background: "transparent",
                border: "none",
                cursor: done || active ? "pointer" : "default",
                fontFamily: uiStack,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? COLORS.green : done ? COLORS.inkSoft : COLORS.rule,
                fontWeight: active ? 600 : 400,
                padding: "4px 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `1px solid ${active ? COLORS.green : done ? COLORS.inkSoft : COLORS.rule}`,
                  background: active ? COLORS.green : "transparent",
                  color: active ? COLORS.cream : done ? COLORS.inkSoft : COLORS.rule,
                  textAlign: "center",
                  lineHeight: "20px",
                  fontFamily: fontStack,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {i + 1}
              </span>
              {label}
            </button>
            {i < steps.length - 1 && <div style={{ flex: "0 0 24px", height: 1, background: done ? COLORS.inkSoft : COLORS.rule }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Header({ step, onStep }) {
  return (
    <header style={{ padding: "28px 48px 24px", borderBottom: `1px solid ${COLORS.rule}`, background: COLORS.cream, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(6px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 6 }}>
            California Energy Commission · Field Study
          </div>
          <h1 style={{ margin: 0, fontFamily: fontStack, fontSize: 32, fontWeight: 400, color: COLORS.ink, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Building Decarbonization
            <span style={{ fontStyle: "italic", color: COLORS.greenSoft }}> Pathways</span>
          </h1>
        </div>
        <Stepper step={step} onStep={onStep} />
      </div>
    </header>
  );
}

// --- STEP 1: BUILDING SELECTION -------------------------------------------

function BuildingSelect({ buildings, onSelect }) {
  return (
    <div style={{ padding: "64px 48px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 56, maxWidth: 720 }}>
        <div style={{ fontFamily: uiStack, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 16 }}>Step One</div>
        <h2 style={{ fontFamily: fontStack, fontSize: 44, fontWeight: 400, margin: "0 0 16px", color: COLORS.ink, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {buildings.length} building{buildings.length === 1 ? "" : "s"}.<br />
          <span style={{ fontStyle: "italic", color: COLORS.greenSoft }}>{buildings.length} pathway{buildings.length === 1 ? "" : "s"} to net zero.</span>
        </h2>
        <p style={{ fontFamily: uiStack, fontSize: 16, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
          Each building tells a different story about decarbonization. Select one to explore its current performance, retrofit options, and the long-term economics of the path to 2045.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {buildings.map((b) => <BuildingCard key={b.id} building={b} onSelect={() => onSelect(b.id)} />)}
      </div>
    </div>
  );
}

function BuildingCard({ building, onSelect }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onSelect} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? COLORS.cream : "transparent", border: `1px solid ${hover ? COLORS.green : COLORS.rule}`, textAlign: "left", padding: 0, cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden", fontFamily: uiStack, display: "flex", flexDirection: "column" }}>
      <BuildingIllustration type={building.type} id={building.id} />
      <div style={{ padding: "24px 28px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 10 }}>{building.type}</div>
        <h3 style={{ fontFamily: fontStack, fontSize: 26, fontWeight: 400, margin: "0 0 12px", color: COLORS.ink, letterSpacing: "-0.01em" }}>{building.name}</h3>
        <div style={{ display: "flex", gap: 20, marginBottom: 18, fontSize: 13, color: COLORS.inkSoft }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Built</div>
            <div style={{ fontFamily: fontStack, fontSize: 18, color: COLORS.ink }}>{building.yearBuilt}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Area</div>
            <div style={{ fontFamily: fontStack, fontSize: 18, color: COLORS.ink }}>{(building.floorArea / 1000).toFixed(0)}k ft²</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>EUI</div>
            <div style={{ fontFamily: fontStack, fontSize: 18, color: COLORS.ink }}>{building.baseline.eui}</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55, margin: "0 0 20px", flex: 1 }}>{building.location}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, borderTop: `1px solid ${COLORS.rule}` }}>
          <span style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.green, fontWeight: 500 }}>Explore</span>
          <span style={{ fontFamily: fontStack, fontSize: 22, color: COLORS.green, transform: hover ? "translateX(4px)" : "translateX(0)", transition: "transform 0.3s ease" }}>→</span>
        </div>
      </div>
    </button>
  );
}

function BuildingIllustration({ type, id }) {
  // Pick illustration by type. Falls back gracefully for unknown types.
  if (type === "Commercial Office" || id === "office") {
    return (
      <svg viewBox="0 0 320 160" style={{ width: "100%", height: 160, background: COLORS.bgAlt, display: "block" }}>
        <rect x="120" y="20" width="80" height="130" fill={COLORS.greenSoft} />
        {Array.from({ length: 12 }).map((_, r) => Array.from({ length: 6 }).map((_, c) => (
          <rect key={`${r}${c}`} x={128 + c * 11} y={28 + r * 10} width="7" height="6" fill={COLORS.cream} opacity="0.7" />
        )))}
        <rect x="80" y="80" width="40" height="70" fill={COLORS.ochre} />
        <rect x="200" y="60" width="40" height="90" fill={COLORS.ochre} opacity="0.8" />
      </svg>
    );
  }
  if (type === "Big-Box Retail" || id === "retail") {
    return (
      <svg viewBox="0 0 320 160" style={{ width: "100%", height: 160, background: COLORS.bgAlt, display: "block" }}>
        <rect x="40" y="80" width="240" height="70" fill={COLORS.terracotta} opacity="0.85" />
        <rect x="40" y="74" width="240" height="8" fill={COLORS.green} />
        <rect x="60" y="100" width="40" height="50" fill={COLORS.cream} opacity="0.8" />
        <rect x="120" y="100" width="40" height="50" fill={COLORS.cream} opacity="0.8" />
        <rect x="180" y="100" width="40" height="50" fill={COLORS.cream} opacity="0.8" />
        <rect x="60" y="60" width="20" height="14" fill={COLORS.green} opacity="0.5" />
        <rect x="120" y="60" width="20" height="14" fill={COLORS.green} opacity="0.5" />
        <rect x="180" y="60" width="20" height="14" fill={COLORS.green} opacity="0.5" />
        <rect x="240" y="60" width="20" height="14" fill={COLORS.green} opacity="0.5" />
      </svg>
    );
  }
  if (type === "Multifamily Residential" || id === "multifamily") {
    return (
      <svg viewBox="0 0 320 160" style={{ width: "100%", height: 160, background: COLORS.bgAlt, display: "block" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <g key={i}>
            <rect x={30 + i * 70} y="60" width="60" height="90" fill={COLORS.ochre} opacity={0.7 + i * 0.05} />
            <polygon points={`${30 + i * 70},60 ${60 + i * 70},45 ${90 + i * 70},60`} fill={COLORS.green} />
            <rect x={40 + i * 70} y="80" width="12" height="14" fill={COLORS.cream} />
            <rect x={68 + i * 70} y="80" width="12" height="14" fill={COLORS.cream} />
            <rect x={40 + i * 70} y="110" width="12" height="14" fill={COLORS.cream} />
            <rect x={68 + i * 70} y="110" width="12" height="14" fill={COLORS.cream} />
          </g>
        ))}
      </svg>
    );
  }
  // Generic fallback for any new type
  return (
    <svg viewBox="0 0 320 160" style={{ width: "100%", height: 160, background: COLORS.bgAlt, display: "block" }}>
      <rect x="80" y="40" width="160" height="110" fill={COLORS.greenSoft} />
      <polygon points="60,45 240,45 160,15" fill={COLORS.green} />
      <rect x="100" y="65" width="30" height="35" fill={COLORS.cream} />
      <rect x="145" y="65" width="30" height="35" fill={COLORS.cream} />
      <rect x="190" y="65" width="30" height="35" fill={COLORS.cream} />
      <rect x="100" y="115" width="30" height="35" fill={COLORS.cream} />
      <rect x="145" y="115" width="30" height="35" fill={COLORS.ochre} />
      <rect x="190" y="115" width="30" height="35" fill={COLORS.cream} />
    </svg>
  );
}

// --- STEP 2: SPECIFICATIONS -----------------------------------------------

function Specifications({ building, onBack, onNext }) {
  const b = building.baseline;
  const totalEnergy = b.electricityKwh * 3.412 + b.gasKbtu;
  const elecPct = (b.electricityKwh * 3.412) / totalEnergy;
  const gasPct = b.gasKbtu / totalEnergy;
  const totalGhg = b.ghgGas + b.ghgElec;

  return (
    <div style={{ padding: "56px 48px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: uiStack, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 12 }}>Step Two · Specifications</div>
        <h2 style={{ fontFamily: fontStack, fontSize: 38, fontWeight: 400, margin: "0 0 8px", color: COLORS.ink, letterSpacing: "-0.02em" }}>{building.name}</h2>
        <div style={{ fontFamily: uiStack, fontSize: 15, color: COLORS.inkSoft }}>{building.location} · {building.type}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 48 }}>
        <div>
          <SectionLabel>Building characteristics</SectionLabel>
          <SpecRow label="Year built" value={building.yearBuilt} />
          <SpecRow label="Floor area" value={`${building.floorArea.toLocaleString()} ft²`} />
          <SpecRow label="Stories" value={building.stories} />
          <SpecRow label="Construction" value={building.construction} />
          <SpecRow label="Occupancy" value={building.occupancy} />
          <div style={{ marginTop: 28 }}>
            <SectionLabel>Notes</SectionLabel>
            <p style={{ fontFamily: uiStack, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.65, margin: 0 }}>{building.notes}</p>
          </div>
        </div>
        <div>
          <SectionLabel>Current performance · 2024 baseline</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <Metric label="Energy use intensity" value={b.eui} unit="kBtu/ft²" />
            <Metric label="Peak demand" value={fmt.num(b.peakKw)} unit="kW" />
            <Metric label="Annual electricity" value={fmt.kwh(b.electricityKwh)} unit="" />
            <Metric label="Annual gas" value={fmt.kbtu(b.gasKbtu)} unit="" />
            <Metric label="Annual utility cost" value={fmt.money(b.annualTotalCost)} unit="" highlight />
            <Metric label="Annual GHG emissions" value={fmt.ghg(totalGhg)} unit="CO₂" highlight />
          </div>
          <SectionLabel>Energy mix</SectionLabel>
          <div style={{ display: "flex", height: 12, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${elecPct * 100}%`, background: COLORS.greenSoft }} />
            <div style={{ width: `${gasPct * 100}%`, background: COLORS.terracotta }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: uiStack, fontSize: 12, color: COLORS.inkSoft }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: COLORS.greenSoft, marginRight: 6 }} />Electricity {(elecPct * 100).toFixed(0)}%</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: COLORS.terracotta, marginRight: 6 }} />Natural gas {(gasPct * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} backLabel="Choose another building" nextLabel="Select retrofit measures" />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${COLORS.rule}` }}>
      {children}
    </div>
  );
}

function SpecRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: `1px dotted ${COLORS.rule}`, gap: 16 }}>
      <span style={{ fontFamily: uiStack, fontSize: 13, color: COLORS.inkSoft, flex: "0 0 130px" }}>{label}</span>
      <span style={{ fontFamily: fontStack, fontSize: 16, color: COLORS.ink, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Metric({ label, value, unit, highlight }) {
  return (
    <div style={{ padding: "16px 18px", background: highlight ? COLORS.cream : "transparent", border: `1px solid ${highlight ? COLORS.green : COLORS.rule}` }}>
      <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.inkSoft, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: fontStack, fontSize: 24, color: COLORS.ink, fontWeight: 400, letterSpacing: "-0.01em" }}>
        {value}{unit && <span style={{ fontSize: 12, color: COLORS.inkSoft, marginLeft: 4, fontFamily: uiStack }}>{unit}</span>}
      </div>
    </div>
  );
}

// --- STEP 3: MEASURES ------------------------------------------------------

function Measures({ building, selected, onToggle, onBack, onNext }) {
  const grouped = useMemo(() => {
    const cats = {};
    for (const m of building.measures) {
      if (!cats[m.cat]) cats[m.cat] = [];
      cats[m.cat].push(m);
    }
    return cats;
  }, [building]);
  const order = ["Reduce", "Recover", "Repair", "Replace", "Regenerate", "Bundle"];
  return (
    <div style={{ padding: "56px 48px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: uiStack, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 12 }}>Step Three · Retrofit Measures</div>
        <h2 style={{ fontFamily: fontStack, fontSize: 38, fontWeight: 400, margin: "0 0 12px", color: COLORS.ink, letterSpacing: "-0.02em" }}>
          Choose your <span style={{ fontStyle: "italic", color: COLORS.greenSoft }}>pathway</span>
        </h2>
        <p style={{ fontFamily: uiStack, fontSize: 15, color: COLORS.inkSoft, margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
          Measures are organized by the 6R Resilient Retrofit Framework — Reduce, Recover, Repair, Replace, and Regenerate — moving from low-cost operational changes to capital-intensive electrification and renewables.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
        {order.map((cat) => grouped[cat] ? (
          <div key={cat}>
            <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: CAT_COLORS[cat], fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${CAT_COLORS[cat]}` }}>{cat}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped[cat].map((m) => (
                <MeasureCard key={m.id} measure={m} selected={selected.includes(m.id)} onToggle={() => onToggle(m.id)} />
              ))}
            </div>
          </div>
        ) : null)}
      </div>
      <div style={{ padding: "16px 20px", background: COLORS.cream, border: `1px solid ${COLORS.rule}`, marginBottom: 32, fontFamily: uiStack, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55 }}>
        <strong style={{ color: COLORS.ink }}>{selected.length}</strong> measure{selected.length === 1 ? "" : "s"} selected.
        {selected.length > 1 && !selected.every((id) => building.measures.find((m) => m.id === id)?.isBundle) && (
          <span> Combined results are an <em>approximation</em> using sum-of-deltas — engineered bundles (marked <span style={{ color: COLORS.green, fontWeight: 600 }}>verified</span>) reflect modeled interactions between measures.</span>
        )}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} backLabel="Back to specifications" nextLabel="See impact analysis" disableNext={selected.length === 0} />
    </div>
  );
}

function MeasureCard({ measure, selected, onToggle }) {
  const [hover, setHover] = useState(false);
  const positive = measure.savings >= 0;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onToggle}
      style={{ background: selected ? COLORS.cream : hover ? "rgba(250, 246, 238, 0.5)" : "transparent", border: `1px solid ${selected ? COLORS.green : COLORS.rule}`, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s ease", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 18, height: 18, border: `1.5px solid ${selected ? COLORS.green : COLORS.inkSoft}`, background: selected ? COLORS.green : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.cream, fontSize: 11, fontFamily: uiStack, fontWeight: 700 }}>
          {selected && "✓"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fontStack, fontSize: 15, color: COLORS.ink, lineHeight: 1.3, fontWeight: 400, marginBottom: 6 }}>
            {measure.name}
            {measure.isBundle && (
              <span style={{ marginLeft: 8, fontFamily: uiStack, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: COLORS.green, color: COLORS.cream, padding: "2px 6px", fontWeight: 600, whiteSpace: "nowrap", display: "inline-block", verticalAlign: "middle" }}>Verified</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, fontFamily: monoStack, fontSize: 11, color: COLORS.inkSoft }}>
            <span>{fmt.money(measure.investment)} invest</span>
            <span style={{ color: positive ? COLORS.greenSoft : COLORS.terracotta, fontWeight: 500 }}>{positive ? "+" : ""}{fmt.money(measure.savings)} 25-yr</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, backLabel, nextLabel, disableNext }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 28, borderTop: `1px solid ${COLORS.rule}` }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", fontFamily: uiStack, fontSize: 13, letterSpacing: "0.05em", color: COLORS.inkSoft, cursor: "pointer", padding: "10px 0" }}>← {backLabel}</button>
      <button onClick={onNext} disabled={disableNext} style={{ background: disableNext ? COLORS.rule : COLORS.green, color: COLORS.cream, border: "none", padding: "14px 28px", fontFamily: uiStack, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: disableNext ? "not-allowed" : "pointer", transition: "background 0.2s ease" }}>
        {nextLabel} →
      </button>
    </div>
  );
}

// --- STEP 4: IMPACT --------------------------------------------------------

function Impact({ building, selected, onBack, onReset, onModify }) {
  const b = building.baseline;
  const r = useMemo(() => computeImpact(building, selected), [building, selected]);
  const totalBaselineGhg = b.ghgGas + b.ghgElec;
  const ghgReductionPct = totalBaselineGhg > 0 ? ((totalBaselineGhg - r.ghgTotal) / totalBaselineGhg) * 100 : 0;
  const costSavingsPct = (1 - r.annualTotalCost / b.annualTotalCost) * 100;
  const euiReductionPct = (1 - r.eui / b.eui) * 100;

  return (
    <div style={{ padding: "56px 48px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: uiStack, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.greenSoft, marginBottom: 12 }}>Step Four · Impact Analysis</div>
        <h2 style={{ fontFamily: fontStack, fontSize: 38, fontWeight: 400, margin: "0 0 12px", color: COLORS.ink, letterSpacing: "-0.02em" }}>
          Your decarbonization <span style={{ fontStyle: "italic", color: COLORS.greenSoft }}>scenario</span>
        </h2>
        <div style={{ fontFamily: uiStack, fontSize: 14, color: COLORS.inkSoft }}>
          {building.name} · <strong style={{ color: COLORS.ink }}>{selected.length} measure{selected.length === 1 ? "" : "s"} selected</strong>
          {!r.isVerified && <span style={{ marginLeft: 12, padding: "2px 8px", background: COLORS.bgAlt, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.terracotta, fontWeight: 600 }}>Approximate</span>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 48 }}>
        <HeadlineMetric label="GHG reduction" value={`${ghgReductionPct.toFixed(0)}%`} sub={`${fmt.ghg(totalBaselineGhg - r.ghgTotal)} CO₂ / yr`} accent={COLORS.green} />
        <HeadlineMetric label="EUI reduction" value={`${euiReductionPct.toFixed(0)}%`} sub={`${r.eui.toFixed(1)} kBtu/ft²`} accent={COLORS.greenSoft} />
        <HeadlineMetric label="Annual cost change" value={`${costSavingsPct >= 0 ? "−" : "+"}${Math.abs(costSavingsPct).toFixed(0)}%`} sub={fmt.money(b.annualTotalCost - r.annualTotalCost) + " / yr"} accent={costSavingsPct >= 0 ? COLORS.greenSoft : COLORS.terracotta} />
        <HeadlineMetric label="Initial investment" value={fmt.money(r.investment)} sub="Capital cost" accent={COLORS.ochre} />
        <HeadlineMetric label="25-year net benefit" value={fmt.money(r.savings)} sub={r.savings >= 0 ? "Net savings (NPV)" : "Net cost (NPV)"} accent={r.savings >= 0 ? COLORS.green : COLORS.terracotta} large />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
        <ChartCard title="Annual Energy Consumption" subtitle="Electricity vs natural gas, before and after retrofits"><EnergyChart baseline={b} result={r} /></ChartCard>
        <ChartCard title="Annual Utility Cost" subtitle="Operating expenditure on energy"><CostChart baseline={b} result={r} /></ChartCard>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
        <ChartCard title="Greenhouse Gas Emissions" subtitle="Tonnes CO₂ equivalent per year"><GhgChart baseline={b} result={r} /></ChartCard>
        <ChartCard title="Investment vs Long-Term Benefit" subtitle="Initial cost compared to 25-year present value of savings"><InvestmentChart investment={r.investment} savings={r.savings} /></ChartCard>
      </div>
      <div style={{ marginBottom: 32 }}>
        <SectionLabel>Selected measures</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {selected.map((id) => {
            const m = building.measures.find((mm) => mm.id === id);
            if (!m) return null;
            const positive = m.savings >= 0;
            return (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${COLORS.rule}`, gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, background: CAT_COLORS[m.cat], flexShrink: 0, borderRadius: "50%" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fontStack, fontSize: 15, color: COLORS.ink }}>
                      {m.name}
                      {m.isBundle && <span style={{ marginLeft: 8, fontFamily: uiStack, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: COLORS.green, color: COLORS.cream, padding: "2px 6px", fontWeight: 600 }}>Verified</span>}
                    </div>
                    <div style={{ fontFamily: uiStack, fontSize: 11, color: COLORS.inkSoft, letterSpacing: "0.05em", textTransform: "uppercase" }}>{m.cat}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24, fontFamily: monoStack, fontSize: 13 }}>
                  <span style={{ color: COLORS.inkSoft, minWidth: 100, textAlign: "right" }}>{fmt.money(m.investment)}</span>
                  <span style={{ color: positive ? COLORS.greenSoft : COLORS.terracotta, fontWeight: 500, minWidth: 100, textAlign: "right" }}>{positive ? "+" : ""}{fmt.money(m.savings)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 28, borderTop: `1px solid ${COLORS.rule}`, flexWrap: "wrap", gap: 12 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", fontFamily: uiStack, fontSize: 13, color: COLORS.inkSoft, cursor: "pointer", padding: "10px 0" }}>← Back to measures</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onModify} style={{ background: "transparent", color: COLORS.green, border: `1px solid ${COLORS.green}`, padding: "12px 24px", fontFamily: uiStack, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer" }}>Modify measures</button>
          <button onClick={onReset} style={{ background: COLORS.green, color: COLORS.cream, border: "none", padding: "12px 24px", fontFamily: uiStack, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer" }}>Try another building</button>
        </div>
      </div>
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${COLORS.rule}`, fontFamily: uiStack, fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.6 }}>
        Source: California Energy Commission Building Decarbonization Field Study, February 2026. Prepared by ADM Associates (a Qualus Company) and ENERlite Consulting. Net present values computed over 2035–2060 with 5.5% discount rate, 3% electricity escalation, 4% gas escalation. Excludes incentives and tax credits.
      </div>
    </div>
  );
}

function HeadlineMetric({ label, value, sub, accent, large }) {
  return (
    <div style={{ padding: large ? "24px 24px" : "20px 20px", background: COLORS.cream, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontFamily: uiStack, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.inkSoft, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: fontStack, fontSize: large ? 36 : 30, color: accent, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: uiStack, fontSize: 12, color: COLORS.inkSoft }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ padding: "24px 28px 28px", background: COLORS.cream, border: `1px solid ${COLORS.rule}` }}>
      <h3 style={{ fontFamily: fontStack, fontSize: 20, fontWeight: 400, margin: "0 0 4px", color: COLORS.ink, letterSpacing: "-0.01em" }}>{title}</h3>
      <div style={{ fontFamily: uiStack, fontSize: 12, color: COLORS.inkSoft, marginBottom: 20 }}>{subtitle}</div>
      <div style={{ height: 240 }}>{children}</div>
    </div>
  );
}

function EnergyChart({ baseline, result }) {
  const data = [
    { name: "Baseline", Electricity: Math.round((baseline.electricityKwh * 3.412) / 1000), "Natural Gas": Math.round(baseline.gasKbtu / 1000) },
    { name: "After Retrofits", Electricity: Math.round((result.electricityKwh * 3.412) / 1000), "Natural Gas": Math.round(result.gasKbtu / 1000) },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: COLORS.inkSoft, fontSize: 12, fontFamily: uiStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} />
        <YAxis tick={{ fill: COLORS.inkSoft, fontSize: 11, fontFamily: monoStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} label={{ value: "MMBtu", angle: -90, position: "insideLeft", fill: COLORS.inkSoft, fontSize: 11, fontFamily: uiStack }} />
        <Tooltip contentStyle={{ background: COLORS.cream, border: `1px solid ${COLORS.green}`, fontFamily: uiStack, fontSize: 12 }} />
        <Bar dataKey="Electricity" stackId="a" fill={COLORS.greenSoft} />
        <Bar dataKey="Natural Gas" stackId="a" fill={COLORS.terracotta} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CostChart({ baseline, result }) {
  const data = [
    { name: "Baseline", Electricity: Math.round(baseline.annualElecCost), "Natural Gas": Math.round(baseline.annualGasCost) },
    { name: "After Retrofits", Electricity: Math.round(result.annualElecCost), "Natural Gas": Math.round(result.annualGasCost) },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: COLORS.inkSoft, fontSize: 12, fontFamily: uiStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} />
        <YAxis tick={{ fill: COLORS.inkSoft, fontSize: 11, fontFamily: monoStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip contentStyle={{ background: COLORS.cream, border: `1px solid ${COLORS.green}`, fontFamily: uiStack, fontSize: 12 }} formatter={(v) => fmt.moneyFull(v)} />
        <Bar dataKey="Electricity" stackId="a" fill={COLORS.greenSoft} />
        <Bar dataKey="Natural Gas" stackId="a" fill={COLORS.terracotta} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function GhgChart({ baseline, result }) {
  const fixed = [
    { name: "Baseline", Gas: baseline.ghgGas, Electricity: baseline.ghgElec },
    {
      name: "After Retrofits",
      Gas: baseline.gasKbtu > 0 ? baseline.ghgGas * (result.gasKbtu / baseline.gasKbtu) : 0,
      Electricity: baseline.electricityKwh > 0 ? baseline.ghgElec * (result.electricityKwh / baseline.electricityKwh) : 0,
    },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={fixed} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: COLORS.inkSoft, fontSize: 12, fontFamily: uiStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} />
        <YAxis tick={{ fill: COLORS.inkSoft, fontSize: 11, fontFamily: monoStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} label={{ value: "tonnes CO₂", angle: -90, position: "insideLeft", fill: COLORS.inkSoft, fontSize: 11, fontFamily: uiStack }} />
        <Tooltip contentStyle={{ background: COLORS.cream, border: `1px solid ${COLORS.green}`, fontFamily: uiStack, fontSize: 12 }} formatter={(v) => `${Math.round(v)} t`} />
        <Bar dataKey="Gas" stackId="a" fill={COLORS.terracotta} />
        <Bar dataKey="Electricity" stackId="a" fill={COLORS.greenSoft} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function InvestmentChart({ investment, savings }) {
  const data = [
    { name: "Initial Investment", value: investment, fill: COLORS.ochre },
    { name: "25-Year NPV Benefit", value: savings, fill: savings >= 0 ? COLORS.green : COLORS.terracotta },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
        <XAxis type="number" tick={{ fill: COLORS.inkSoft, fontSize: 11, fontFamily: monoStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} tickFormatter={(v) => fmt.money(v)} />
        <YAxis dataKey="name" type="category" tick={{ fill: COLORS.ink, fontSize: 12, fontFamily: uiStack }} axisLine={{ stroke: COLORS.rule }} tickLine={false} width={140} />
        <Tooltip contentStyle={{ background: COLORS.cream, border: `1px solid ${COLORS.green}`, fontFamily: uiStack, fontSize: 12 }} formatter={(v) => fmt.moneyFull(v)} />
        <ReferenceLine x={0} stroke={COLORS.ink} />
        <Bar dataKey="value">
          {data.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
          <LabelList dataKey="value" position="right" formatter={(v) => fmt.money(v)} style={{ fill: COLORS.ink, fontFamily: monoStack, fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// MAIN TOOL ROOT
// ============================================================================

export default function MainTool() {
  const [step, setStep] = useState(0);
  const [buildings, setBuildings] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [selectedMeasures, setSelectedMeasures] = useState([]);

  useEffect(() => {
    loadAllBuildings()
      .then(setBuildings)
      .catch((e) => setLoadError(e.message));
  }, []);

  if (loadError) {
    return (
      <div style={{ padding: 64, fontFamily: uiStack, color: COLORS.terracotta, textAlign: "center" }}>
        <h2 style={{ fontFamily: fontStack, color: COLORS.ink }}>Failed to load buildings</h2>
        <p>{loadError}</p>
        <p style={{ color: COLORS.inkSoft, fontSize: 13 }}>Check that <code>public/buildings/index.json</code> exists and lists at least one valid building.</p>
      </div>
    );
  }

  if (!buildings) {
    return (
      <div style={{ padding: 80, fontFamily: fontStack, color: COLORS.greenSoft, textAlign: "center", fontSize: 18 }}>
        Loading buildings…
      </div>
    );
  }

  const building = selectedBuildingId ? buildings.find((b) => b.id === selectedBuildingId) : null;

  const goToStep = (s) => {
    if (s === 0) setStep(0);
    else if (s >= 1 && selectedBuildingId) {
      if (s === 3 && selectedMeasures.length === 0) return;
      setStep(s);
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedBuildingId(null);
    setSelectedMeasures([]);
  };

  const toggleMeasure = (id) => {
    setSelectedMeasures((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.ink, fontFamily: uiStack }}>
      <Header step={step} onStep={goToStep} />
      {step === 0 && <BuildingSelect buildings={buildings} onSelect={(id) => { setSelectedBuildingId(id); setSelectedMeasures([]); setStep(1); }} />}
      {step === 1 && building && <Specifications building={building} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
      {step === 2 && building && <Measures building={building} selected={selectedMeasures} onToggle={toggleMeasure} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && building && <Impact building={building} selected={selectedMeasures} onBack={() => setStep(2)} onModify={() => setStep(2)} onReset={reset} />}
      <footer style={{ padding: "24px 48px", borderTop: `1px solid ${COLORS.rule}`, fontFamily: uiStack, fontSize: 11, color: COLORS.inkSoft, letterSpacing: "0.05em", textAlign: "center" }}>
        Decarbonization Pathways · A visual decision-support portal · Based on CEC Field Study (CEC-600-2026-XXX)
        <button onClick={() => navigate("admin")} style={{ marginLeft: 16, background: "transparent", border: "none", color: COLORS.inkSoft, cursor: "pointer", fontFamily: uiStack, fontSize: 11, letterSpacing: "0.05em", textDecoration: "underline" }}>Add a building</button>
      </footer>
    </div>
  );
}
