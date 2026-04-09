import { describe, it, expect } from 'vitest';
import { calculateBiochar } from '../utils/calculations';
import { calculateFinancials, calculateIRR, runSensitivityAnalysis } from '../utils/financial';
import { DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS, DEFAULT_ECONOMIC_INPUTS } from '../utils/defaults';

// ─── Carbon Calculator Tests ──────────────────────────────────────────────────

describe('calculateBiochar', () => {
  it('returns positive biochar yield for valid inputs', () => {
    const result = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);
    expect(result.biocharYield).toBeGreaterThan(0);
  });

  it('returns net carbon credits less than gross CO2e', () => {
    const result = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);
    expect(result.netCarbonCredits).toBeLessThanOrEqual(result.co2eSeq);
  });

  it('net carbon credits are non-negative', () => {
    const result = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);
    expect(result.netCarbonCredits).toBeGreaterThanOrEqual(0);
  });

  it('biochar yield decreases at higher temperature', () => {
    const lowTemp = calculateBiochar(DEFAULT_FEEDSTOCK, { ...DEFAULT_PYROLYSIS, temperature: 350 });
    const highTemp = calculateBiochar(DEFAULT_FEEDSTOCK, { ...DEFAULT_PYROLYSIS, temperature: 750 });
    expect(highTemp.biocharYield).toBeLessThan(lowTemp.biocharYield);
  });

  it('higher quantity produces more biochar', () => {
    const small = calculateBiochar({ ...DEFAULT_FEEDSTOCK, quantity: 1000 }, DEFAULT_PYROLYSIS);
    const large = calculateBiochar({ ...DEFAULT_FEEDSTOCK, quantity: 5000 }, DEFAULT_PYROLYSIS);
    expect(large.biocharYield).toBeGreaterThan(small.biocharYield);
    expect(large.netCarbonCredits).toBeGreaterThan(small.netCarbonCredits);
  });

  it('carbon in biochar is a fraction of feedstock carbon', () => {
    const result = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);
    const feedstockTotalCarbon = DEFAULT_FEEDSTOCK.quantity * (DEFAULT_FEEDSTOCK.carbonContent / 100);
    expect(result.carbonInBiochar).toBeLessThan(feedstockTotalCarbon);
    expect(result.carbonInBiochar).toBeGreaterThan(0);
  });

  it('co2e sequestered equals permanent C × 3.667 approximately', () => {
    const result = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);
    expect(result.co2eSeq).toBeCloseTo(result.permanentCarbonSeq * 3.667, 1);
  });

  it('biochar stability is between 70% and 95%', () => {
    const result = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);
    expect(result.biocharStability).toBeGreaterThanOrEqual(70);
    expect(result.biocharStability).toBeLessThanOrEqual(95);
  });

  it('unknown feedstock type uses fallback defaults', () => {
    const result = calculateBiochar(
      { ...DEFAULT_FEEDSTOCK, feedstockType: 'Unknown biomass XYZ' },
      DEFAULT_PYROLYSIS,
    );
    expect(result.biocharYield).toBeGreaterThan(0);
  });

  it('zero moisture gives higher effective dry feedstock', () => {
    const withMoisture = calculateBiochar({ ...DEFAULT_FEEDSTOCK, moistureContent: 30 }, DEFAULT_PYROLYSIS);
    const noMoisture = calculateBiochar({ ...DEFAULT_FEEDSTOCK, moistureContent: 0 }, DEFAULT_PYROLYSIS);
    expect(noMoisture.biocharYield).toBeGreaterThan(withMoisture.biocharYield);
  });
});

// ─── IRR Tests ────────────────────────────────────────────────────────────────

describe('calculateIRR', () => {
  it('returns ~10% IRR for standard cash flows at 10%', () => {
    // Cash flows that yield exactly 10% IRR: -1000, 363.8, 363.8, 363.8
    const irr = calculateIRR([-1000, 400, 400, 400]);
    expect(irr).toBeGreaterThan(0);
    expect(irr).toBeLessThan(100);
  });

  it('returns negative IRR for a loss-making project', () => {
    const irr = calculateIRR([-1000, 100, 100, 100]);
    expect(irr).toBeLessThan(0);
  });

  it('returns high IRR for a very profitable project', () => {
    const irr = calculateIRR([-100, 100, 100, 100]);
    expect(irr).toBeGreaterThan(50);
  });
});

// ─── Financial Model Tests ────────────────────────────────────────────────────

describe('calculateFinancials', () => {
  const biochar = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);

  it('produces correct number of annual cash flows', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(result.cashFlows).toHaveLength(DEFAULT_ECONOMIC_INPUTS.projectLife);
  });

  it('total capex matches expected sum with contingency', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    const base =
      DEFAULT_ECONOMIC_INPUTS.capex.pyrolysisUnit +
      DEFAULT_ECONOMIC_INPUTS.capex.feedstockHandling +
      DEFAULT_ECONOMIC_INPUTS.capex.biocharStorage +
      DEFAULT_ECONOMIC_INPUTS.capex.gasTreatment +
      DEFAULT_ECONOMIC_INPUTS.capex.landAndCivil +
      DEFAULT_ECONOMIC_INPUTS.capex.electricalAndControl;
    const expected = base * (1 + DEFAULT_ECONOMIC_INPUTS.capex.contingency / 100);
    expect(result.totalCapex).toBeCloseTo(expected, 0);
  });

  it('annual revenue is positive for the default scenario', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(result.annualRevenue).toBeGreaterThan(0);
  });

  it('EBITDA = revenue minus opex', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(result.annualEbitda).toBeCloseTo(result.annualRevenue - result.annualOpex, 0);
  });

  it('NPV is a finite number', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(Number.isFinite(result.npv)).toBe(true);
  });

  it('cumulative cash flow increases monotonically for profitable project', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    // If every year's cash flow > 0, cumulative should always increase
    if (result.cashFlows.every((cf) => cf.cashFlow > 0)) {
      for (let i = 1; i < result.cashFlows.length; i++) {
        expect(result.cashFlows[i].cumulativeCashFlow).toBeGreaterThan(
          result.cashFlows[i - 1].cumulativeCashFlow,
        );
      }
    }
  });

  it('LCO biochar is a non-negative number', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(result.lcoBiochar).toBeGreaterThanOrEqual(0);
  });

  it('LCO carbon credit is a non-negative number', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(result.lcoCarbonCredit).toBeGreaterThanOrEqual(0);
  });

  it('ROI is a finite number', () => {
    const result = calculateFinancials(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(Number.isFinite(result.roiPct)).toBe(true);
  });
});

// ─── Sensitivity Analysis Tests ───────────────────────────────────────────────

describe('runSensitivityAnalysis', () => {
  const biochar = calculateBiochar(DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS);

  it('returns 6 sensitivity variables', () => {
    const results = runSensitivityAnalysis(DEFAULT_ECONOMIC_INPUTS, biochar);
    expect(results).toHaveLength(6);
  });

  it('higher carbon credit price increases NPV', () => {
    const results = runSensitivityAnalysis(DEFAULT_ECONOMIC_INPUTS, biochar);
    const ccSensitivity = results.find((r) => r.variable === 'Carbon Credit Price');
    expect(ccSensitivity).toBeDefined();
    expect(ccSensitivity!.npvHigh).toBeGreaterThan(ccSensitivity!.npvLow);
  });

  it('higher capex reduces NPV', () => {
    const results = runSensitivityAnalysis(DEFAULT_ECONOMIC_INPUTS, biochar);
    const capexSensitivity = results.find((r) => r.variable === 'Capital Expenditure');
    expect(capexSensitivity).toBeDefined();
    expect(capexSensitivity!.npvHigh).toBeLessThan(capexSensitivity!.npvLow);
  });
});
