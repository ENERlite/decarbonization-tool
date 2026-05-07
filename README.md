# Decarbonization Pathways

An interactive decision-support tool for building decarbonization, developed by ENERlite Consulting based on the California Energy Commission Building Decarbonization Field Study (CEC-600-2026-XXX).

The tool walks building owners and management teams through real-world case studies — currently a large commercial office, a big-box retail store, and a multifamily community — and lets them explore the energy, cost, and emissions impact of various retrofit measures.

## Features

- **Linear flow:** Building → Specifications → Measures → Impact
- **Six-output dashboard:** GHG reduction, EUI reduction, annual cost change, initial investment, 25-year NPV benefit, plus four interactive charts
- **6R Framework:** Measures organized by Reduce / Recover / Repair / Replace / Regenerate / Bundle
- **Verified bundles:** Engineered packages with modeled interactions are flagged distinctly from approximated combinations
- **Building Builder admin:** Hidden form-based interface (`#admin`) to add new buildings without writing code

## Architecture

```
public/buildings/
  ├── index.json          ← list of available buildings
  ├── office.json
  ├── retail.json
  └── multifamily.json
src/
  ├── App.jsx             ← root, routes between MainTool and Admin
  ├── MainTool.jsx        ← user-facing 4-step explorer
  ├── Admin.jsx           ← form-based building builder
  ├── schema.js           ← single source of truth for building shape
  ├── loader.js           ← fetches and validates building JSON
  ├── router.js           ← simple hash-based routing
  ├── theme.jsx           ← shared colors, fonts, formatters
  └── main.jsx            ← entry point
```

To add a new building, see [HOW_TO_ADD_A_BUILDING.md](./HOW_TO_ADD_A_BUILDING.md).

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Append `#admin` to access the Building Builder.

## Production build

```bash
npm run build
```

Output goes to `dist/`, ready for any static host. Vercel auto-builds this on every GitHub push.

## Source

Data and methodology: ADM Associates (a Qualus Company) and ENERlite Consulting,
*California Building Decarbonization Case Study*, prepared for the California Energy Commission, February 2026.
