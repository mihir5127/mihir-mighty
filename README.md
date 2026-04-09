# Biochar Carbon Credit Calculator 🌱

A fully functional **biochar carbon credit calculator** with integrated **economic and financial feasibility planning** — built for biochar project developers, carbon market practitioners, and sustainable agriculture investors.

---

## Features

### 🌿 Carbon Calculator
- **Feedstock Parameters**: Choose from 10 biomass types (wood chips, rice husk, bamboo, etc.) with auto-populated carbon and ash content, or enter custom values
- **Pyrolysis Parameters**: Configure temperature (300–900°C), residence time, system type (slow/fast pyrolysis, gasification, HTC) and heat source
- **Carbon Sequestration Calculation**: Based on IBI Biochar Standards, VERRA VM0044 and Woolf et al. (2010)
  - Temperature-adjusted biochar yield and carbon content
  - H:C<sub>org</sub>-based stability fraction for long-term permanence
  - Gross CO₂e sequestered = Permanent C × 3.667
  - Net carbon credits = Gross CO₂e − process emissions

### 💰 Economic Feasibility
- **Capital Expenditure (CapEx)**: Pyrolysis unit, feedstock handling, storage, gas treatment, land & civil, electrical & control, contingency
- **Operating Expenditure (OpEx)**: Feedstock cost, labour, maintenance, energy, transport, MRV/certification, miscellaneous
- **Revenue Streams**: Carbon credits, biochar sales (configurable sale fraction), syngas/heat by-products
- **Visual breakdowns**: CapEx pie chart, OpEx pie chart, Revenue vs OpEx comparison

### 📈 Financial Planning
- **NPV** (Net Present Value) with configurable discount rate
- **IRR** (Internal Rate of Return) via Newton-Raphson iteration
- **Payback Period** (linear interpolation)
- **ROI** and **EBITDA margin**
- **Levelised Cost of Biochar** (LCO) and **Levelised Cost per Carbon Credit**
- **20-year inflation-adjusted cash flow projections** with full annual table
- **Sensitivity Analysis** – tornado chart showing NPV and IRR response to ±20% changes in 6 key variables

### 📊 Dashboard
- Real-time KPI summary cards
- Carbon sequestration and financial summaries side-by-side
- Project viability indicator (green/yellow/red)
- Quick navigation to all modules

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Testing | Vitest |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Methodology

Carbon sequestration calculations are based on:
- **IBI Biochar Standards (2015)** — stability classification and quality framework
- **VERRA VM0044 v1.1** — additionality and permanence requirements for biochar carbon credits  
- **Woolf et al. (2010), Science** — global biochar carbon sequestration potential
- Temperature-adjusted yield and carbon content from empirical pyrolysis literature

> ⚠️ **Disclaimer**: This tool is for **indicative purposes only**. For formal carbon credit registration, consult a certified project developer and conduct site-specific laboratory analysis.

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # KPI overview & project viability
│   ├── CarbonCalculator.tsx   # Feedstock/pyrolysis inputs + CO₂e results
│   ├── EconomicFeasibility.tsx # CapEx, OpEx, revenue configuration
│   └── FinancialPlanning.tsx  # NPV/IRR/cashflows + sensitivity analysis
├── utils/
│   ├── calculations.ts        # Carbon sequestration formulas
│   ├── financial.ts           # NPV, IRR, cash flow model
│   └── defaults.ts            # Default parameter values
├── types/
│   └── index.ts               # TypeScript type definitions
└── __tests__/
    └── calculations.test.ts   # 25 unit tests
```
