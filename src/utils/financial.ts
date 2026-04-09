/**
 * Financial feasibility calculations for biochar carbon credit project
 * NPV, IRR, Payback Period, Levelised Cost, Sensitivity Analysis
 */

import type {
  EconomicInputs,
  BiocharResults,
  AnnualCashFlow,
  FinancialResults,
  SensitivityResult,
} from '../types';

// ─── CapEx ────────────────────────────────────────────────────────────────────

export function calculateTotalCapex(inputs: EconomicInputs): number {
  const c = inputs.capex;
  const base =
    c.pyrolysisUnit +
    c.feedstockHandling +
    c.biocharStorage +
    c.gasTreatment +
    c.landAndCivil +
    c.electricalAndControl;
  return base * (1 + c.contingency / 100);
}

// ─── Annual OpEx ──────────────────────────────────────────────────────────────

export function calculateAnnualOpex(
  inputs: EconomicInputs,
  biochar: BiocharResults,
  totalCapex: number,
  year: number,
): number {
  const o = inputs.opex;
  const inflFactor = Math.pow(1 + inputs.inflationRate / 100, year - 1);

  // feedstock cost based on approximate dry feed estimate (biochar / avg yield fraction)
  const dryFeedstockEstimate = biochar.biocharYield / 0.3;
  const feedstockOpex = dryFeedstockEstimate * o.feedstockCost;
  const maintenance = totalCapex * (o.maintenancePct / 100);
  // Energy cost: energyCost ($/kWh) × estimated 300 kWh/t dry feedstock
  const energyOpex = dryFeedstockEstimate * 300 * o.energyCost;
  const transport = biochar.biocharYield * o.transportCost;
  const total =
    (feedstockOpex +
      o.laborCost +
      maintenance +
      energyOpex +
      transport +
      o.certificationCost +
      o.miscOpex) *
    inflFactor;
  return total;
}

// ─── Annual Revenue ───────────────────────────────────────────────────────────

export function calculateAnnualRevenue(
  inputs: EconomicInputs,
  biochar: BiocharResults,
  year: number,
): number {
  const r = inputs.revenue;
  const inflFactor = Math.pow(1 + inputs.inflationRate / 100, year - 1);

  const creditRevenue = biochar.netCarbonCredits * r.carbonCreditPrice;
  const biocharRevenue =
    biochar.biocharYield * r.biocharPrice * r.biocharSalesFraction;
  const syngasRevenue = r.syngasRevenue ?? 0;
  const heatRevenue = r.heatRevenue ?? 0;

  return (creditRevenue + biocharRevenue + syngasRevenue + heatRevenue) * inflFactor;
}

// ─── IRR Calculation (Newton-Raphson) ─────────────────────────────────────────

export function calculateIRR(cashFlows: number[]): number {
  let rate = 0.10; // initial guess 10%
  for (let i = 0; i < 1000; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv += (-t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-8) {
      rate = newRate;
      break;
    }
    rate = newRate;
    if (rate < -0.99) { rate = -0.99; break; }
  }
  return rate * 100; // return as percentage
}

// ─── Full Financial Model ─────────────────────────────────────────────────────

export function calculateFinancials(
  inputs: EconomicInputs,
  biochar: BiocharResults,
): FinancialResults {
  const totalCapex = calculateTotalCapex(inputs);
  const annualDepreciation = totalCapex / inputs.depreciationYears;
  const discountRate = inputs.discountRate / 100;

  const cashFlows: AnnualCashFlow[] = [];
  // Year 0: capex outflow
  const irrCashFlowSeries: number[] = [-totalCapex];

  let cumulativeCashFlow = -totalCapex;
  let npvCumulative = -totalCapex;
  let paybackYear = -1;

  for (let yr = 1; yr <= inputs.projectLife; yr++) {
    const revenue = calculateAnnualRevenue(inputs, biochar, yr);
    const opex = calculateAnnualOpex(inputs, biochar, totalCapex, yr);
    const ebitda = revenue - opex;
    const depreciation = yr <= inputs.depreciationYears ? annualDepreciation : 0;
    const ebit = ebitda - depreciation;
    const tax = Math.max(ebit * (inputs.taxRate / 100), 0);
    const nopat = ebit - tax;
    const cashFlow = nopat + depreciation; // add back non-cash depreciation
    cumulativeCashFlow += cashFlow;
    const df = Math.pow(1 + discountRate, yr);
    const discountedCF = cashFlow / df;
    npvCumulative += discountedCF;

    if (paybackYear === -1 && cumulativeCashFlow >= 0) {
      paybackYear = yr - 1 + (cumulativeCashFlow - cashFlow) / -cashFlow * -1;
      // More precise: linear interpolation
      const prevCumul = cumulativeCashFlow - cashFlow;
      paybackYear = (yr - 1) + Math.abs(prevCumul) / cashFlow;
    }

    irrCashFlowSeries.push(cashFlow);
    cashFlows.push({
      year: yr,
      revenue,
      opex,
      ebitda,
      depreciation,
      ebit,
      tax,
      nopat,
      cashFlow,
      cumulativeCashFlow,
      discountedCashFlow: discountedCF,
      npvCumulative,
    });
  }

  const npv = npvCumulative;
  const irr = calculateIRR(irrCashFlowSeries);

  const annualRevenue = cashFlows[0]?.revenue ?? 0;
  const annualOpex = cashFlows[0]?.opex ?? 0;
  const annualEbitda = cashFlows[0]?.ebitda ?? 0;
  const ebitdaMargin = annualRevenue > 0 ? (annualEbitda / annualRevenue) * 100 : 0;

  // Break-even volume (tonnes CO2e at current credit price to cover OpEx)
  const breakEvenTonnes =
    inputs.revenue.carbonCreditPrice > 0
      ? annualOpex / inputs.revenue.carbonCreditPrice
      : 0;

  // ROI = (total undiscounted cash flows / CapEx - 1) × 100
  const totalUndiscountedCF = cashFlows.reduce((a, b) => a + b.cashFlow, 0);
  const roiPct = ((totalUndiscountedCF - totalCapex) / totalCapex) * 100;

  // Levelised cost of biochar
  const totalDiscountedOpex = cashFlows.reduce(
    (s, cf, i) => s + cf.opex / Math.pow(1 + discountRate, i + 1),
    0,
  );
  const totalDiscountedBiochar = cashFlows.reduce(
    (s, _cf, i) => s + biochar.biocharYield / Math.pow(1 + discountRate, i + 1),
    0,
  );
  const lcoBiochar =
    totalDiscountedBiochar > 0
      ? (totalCapex + totalDiscountedOpex) / totalDiscountedBiochar
      : 0;

  // Levelised cost per carbon credit
  const totalDiscountedCredits = cashFlows.reduce(
    (s, _cf, i) =>
      s + biochar.netCarbonCredits / Math.pow(1 + discountRate, i + 1),
    0,
  );
  const lcoCarbonCredit =
    totalDiscountedCredits > 0
      ? (totalCapex + totalDiscountedOpex) / totalDiscountedCredits
      : 0;

  return {
    totalCapex,
    annualRevenue,
    annualOpex,
    annualEbitda,
    ebitdaMargin,
    npv,
    irr,
    paybackPeriod: paybackYear,
    cashFlows,
    breakEvenTonnes,
    roiPct,
    lcoBiochar,
    lcoCarbonCredit,
  };
}

// ─── Sensitivity Analysis ─────────────────────────────────────────────────────

export function runSensitivityAnalysis(
  baseInputs: EconomicInputs,
  baseBiochar: BiocharResults,
): SensitivityResult[] {
  const baseResult = calculateFinancials(baseInputs, baseBiochar);

  function vary(
    label: string,
    mutate: (factor: number) => { inputs: EconomicInputs; biochar: BiocharResults },
  ): SensitivityResult {
    const low = mutate(0.80);
    const high = mutate(1.20);
    const rLow = calculateFinancials(low.inputs, low.biochar);
    const rHigh = calculateFinancials(high.inputs, high.biochar);
    return {
      variable: label,
      low: -20,
      base: 0,
      high: 20,
      npvLow: rLow.npv,
      npvBase: baseResult.npv,
      npvHigh: rHigh.npv,
      irrLow: rLow.irr,
      irrBase: baseResult.irr,
      irrHigh: rHigh.irr,
    };
  }

  return [
    vary('Carbon Credit Price', (f) => ({
      inputs: {
        ...baseInputs,
        revenue: { ...baseInputs.revenue, carbonCreditPrice: baseInputs.revenue.carbonCreditPrice * f },
      },
      biochar: baseBiochar,
    })),
    vary('Biochar Price', (f) => ({
      inputs: {
        ...baseInputs,
        revenue: { ...baseInputs.revenue, biocharPrice: baseInputs.revenue.biocharPrice * f },
      },
      biochar: baseBiochar,
    })),
    vary('Carbon Credits Volume', (f) => ({
      inputs: baseInputs,
      biochar: { ...baseBiochar, netCarbonCredits: baseBiochar.netCarbonCredits * f },
    })),
    vary('Feedstock Cost', (f) => ({
      inputs: {
        ...baseInputs,
        opex: { ...baseInputs.opex, feedstockCost: baseInputs.opex.feedstockCost * f },
      },
      biochar: baseBiochar,
    })),
    vary('Capital Expenditure', (f) => ({
      inputs: {
        ...baseInputs,
        capex: {
          ...baseInputs.capex,
          pyrolysisUnit: baseInputs.capex.pyrolysisUnit * f,
          feedstockHandling: baseInputs.capex.feedstockHandling * f,
          biocharStorage: baseInputs.capex.biocharStorage * f,
          gasTreatment: baseInputs.capex.gasTreatment * f,
          landAndCivil: baseInputs.capex.landAndCivil * f,
          electricalAndControl: baseInputs.capex.electricalAndControl * f,
        },
      },
      biochar: baseBiochar,
    })),
    vary('Discount Rate', (f) => ({
      inputs: { ...baseInputs, discountRate: baseInputs.discountRate * f },
      biochar: baseBiochar,
    })),
  ];
}

export function formatCurrency(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatNum(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
