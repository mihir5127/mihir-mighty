// ─── Feedstock & Pyrolysis ────────────────────────────────────────────────────

export interface FeedstockParams {
  feedstockType: string;
  quantity: number;          // tonnes/year dry weight
  moistureContent: number;   // % wet basis
  ashContent: number;        // % dry basis
  carbonContent: number;     // % dry basis
}

export interface PyrolysisParams {
  temperature: number;       // °C
  residenceTime: number;     // minutes
  systemType: string;        // slow/fast/flash
  heatSource: string;        // gas/electric/self-sustaining
  energyConsumption: number; // kWh/tonne feedstock
}

// ─── Biochar Results ──────────────────────────────────────────────────────────

export interface BiocharResults {
  biocharYield: number;         // tonnes/year
  biocharYieldPct: number;      // % of dry feedstock
  carbonInBiochar: number;      // tonnes C/year
  biocharStability: number;     // % stable carbon (H:Corg ratio proxy)
  permanentCarbonSeq: number;   // tonnes C/year (stable fraction)
  co2eSeq: number;              // tonnes CO2e/year (3.67 × C)
  netCarbonCredits: number;     // after process emissions
  processEmissions: number;     // tonnes CO2e/year
}

// ─── Economic Inputs ─────────────────────────────────────────────────────────

export interface CapexParams {
  pyrolysisUnit: number;         // $
  feedstockHandling: number;     // $
  biocharStorage: number;        // $
  gasTreatment: number;          // $
  landAndCivil: number;          // $
  electricalAndControl: number;  // $
  contingency: number;           // % of total
}

export interface OpexParams {
  feedstockCost: number;        // $/tonne dry feedstock
  laborCost: number;            // $/year
  maintenancePct: number;       // % of CapEx/year
  energyCost: number;           // $/kWh
  transportCost: number;        // $/tonne biochar
  certificationCost: number;    // $/year
  miscOpex: number;             // $/year
}

export interface RevenueParams {
  carbonCreditPrice: number;    // $/tonne CO2e
  biocharPrice: number;         // $/tonne biochar
  biocharSalesFraction: number; // 0-1, fraction sold (vs applied on-farm)
  syngasRevenue?: number;       // $/year (optional by-product)
  heatRevenue: number;          // $/year heat/energy by-product
}

export interface EconomicInputs {
  capex: CapexParams;
  opex: OpexParams;
  revenue: RevenueParams;
  projectLife: number;          // years
  discountRate: number;         // % p.a.
  inflationRate: number;        // % p.a.
  taxRate: number;              // % corporate tax
  depreciationYears: number;    // years straight-line
}

// ─── Financial Results ────────────────────────────────────────────────────────

export interface AnnualCashFlow {
  year: number;
  revenue: number;
  opex: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  tax: number;
  nopat: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  discountedCashFlow: number;
  npvCumulative: number;
}

export interface FinancialResults {
  totalCapex: number;
  annualRevenue: number;
  annualOpex: number;
  annualEbitda: number;
  ebitdaMargin: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  cashFlows: AnnualCashFlow[];
  breakEvenTonnes: number;
  roiPct: number;
  lcoBiochar: number;   // levelised cost of biochar ($/tonne)
  lcoCarbonCredit: number; // levelised cost per credit ($/tonne CO2e)
}

// ─── Sensitivity ─────────────────────────────────────────────────────────────

export interface SensitivityResult {
  variable: string;
  low: number;
  base: number;
  high: number;
  npvLow: number;
  npvBase: number;
  npvHigh: number;
  irrLow: number;
  irrBase: number;
  irrHigh: number;
}
