import React from "react";

export const fontStack = `'Fraunces', Georgia, serif`;
export const uiStack = `'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif`;
export const monoStack = `'JetBrains Mono', ui-monospace, monospace`;

export const COLORS = {
  bg: "#f5f1ea",
  bgAlt: "#ebe4d5",
  ink: "#1c2620",
  inkSoft: "#4a5450",
  rule: "#d6cdb8",
  green: "#2d4a3e",
  greenSoft: "#456a5a",
  terracotta: "#c47b50",
  ochre: "#bda47a",
  cream: "#faf6ee",
};

export const CAT_COLORS = {
  Reduce: "#a3a380",
  Recover: "#7d8c5c",
  Repair: "#bda47a",
  Replace: "#456a5a",
  Regenerate: "#c47b50",
  Bundle: "#2d4a3e",
};

export function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
      input, textarea, select, button { font-family: inherit; }
    `}</style>
  );
}

export const fmt = {
  money: (n) => {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${Math.round(n).toLocaleString()}`;
  },
  moneyFull: (n) => `$${Math.round(n).toLocaleString()}`,
  num: (n) => Math.round(n).toLocaleString(),
  kwh: (n) => `${(n / 1000).toFixed(0)} MWh`,
  kbtu: (n) => `${(n / 1000).toFixed(0)} MMBtu`,
  pct: (n) => `${(n * 100).toFixed(0)}%`,
  ghg: (n) => `${Math.round(n)} t`,
};
