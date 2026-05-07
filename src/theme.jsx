import React from "react";

export const fontStack = `'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
export const uiStack = `'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
export const monoStack = `'JetBrains Mono', ui-monospace, monospace`;

export const COLORS = {
  bg: "#ffffff",
  bgAlt: "#f7f9fa",
  ink: "#3f4858",
  inkSoft: "#5a6470",
  rule: "#e3e7ec",
  green: "#24a39c",
  greenSoft: "#3fbab3",
  greenDark: "#1a7d77",
  navy: "#3f4858",
  navyDark: "#2b3340",
  terracotta: "#a8483f",
  terracottaSoft: "#c56f61",
  ochre: "#e8b948",
  sage: "#7fa89f",
  cream: "#ffffff",
};

// Map old "green" name to teal so existing code keeps working
COLORS.greenAlias = COLORS.green;

export const CAT_COLORS = {
  Reduce: "#7fa89f",
  Recover: "#24a39c",
  Repair: "#e8b948",
  Replace: "#3f4858",
  Regenerate: "#a8483f",
  Bundle: "#1a7d77",
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
