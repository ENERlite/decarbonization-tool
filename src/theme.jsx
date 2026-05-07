import React from "react";

export const fontStack = `'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
export const uiStack = `'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
export const monoStack = `'JetBrains Mono', ui-monospace, monospace`;

export const COLORS = {
  bg: "#f4f6f8",
  bgAlt: "#eef1f4",
  ink: "#3f4858",
  inkSoft: "#5a6470",
  rule: "#e3e7ec",
  green: "#1f8b85",
  greenSoft: "#3fa39c",
  greenDark: "#155f5b",
  navy: "#3f4858",
  navyDark: "#2b3340",
  terracotta: "#a8483f",
  terracottaSoft: "#c56f61",
  ochre: "#e8b948",
  sage: "#7fa89f",
  cream: "#ffffff",
};

export const CAT_COLORS = {
  Reduce: "#7fa89f",
  Recover: "#1f8b85",
  Repair: "#e8b948",
  Replace: "#3f4858",
  Regenerate: "#a8483f",
  Bundle: "#155f5b",
};

export function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200;0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;0,6..12,700;0,6..12,800;1,6..12,300;1,6..12,400&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: 'Nunito Sans', sans-serif; }
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
