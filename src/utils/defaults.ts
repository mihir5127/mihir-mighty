import type { FeedstockParams, PyrolysisParams, EconomicInputs } from '../types';

export const DEFAULT_FEEDSTOCK: FeedstockParams = {
  feedstockType: 'Wood chips',
  quantity: 5000,        // 5,000 dry tonnes/year
  moistureContent: 20,   // 20%
  ashContent: 2,         // 2%
  carbonContent: 50,     // 50%
};

export const DEFAULT_PYROLYSIS: PyrolysisParams = {
  temperature: 500,          // °C
  residenceTime: 60,         // minutes
  systemType: 'Slow pyrolysis',
  heatSource: 'Self-sustaining (syngas)',
  energyConsumption: 300,    // kWh/tonne dry feedstock
};

export const DEFAULT_ECONOMIC_INPUTS: EconomicInputs = {
  capex: {
    pyrolysisUnit: 800_000,
    feedstockHandling: 150_000,
    biocharStorage: 80_000,
    gasTreatment: 120_000,
    landAndCivil: 200_000,
    electricalAndControl: 100_000,
    contingency: 15,
  },
  opex: {
    feedstockCost: 30,       // $/tonne dry
    laborCost: 200_000,      // $/year
    maintenancePct: 3,       // % of CapEx
    energyCost: 0.10,        // $/kWh
    transportCost: 15,       // $/tonne biochar
    certificationCost: 25_000,
    miscOpex: 20_000,
  },
  revenue: {
    carbonCreditPrice: 50,   // $/tonne CO2e
    biocharPrice: 400,       // $/tonne biochar
    biocharSalesFraction: 0.70,
    syngasRevenue: 30_000,
    heatRevenue: 20_000,
  },
  projectLife: 20,
  discountRate: 10,
  inflationRate: 2.5,
  taxRate: 25,
  depreciationYears: 10,
};
