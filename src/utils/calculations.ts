/**
 * Biochar carbon sequestration calculations
 * Based on: IBI Biochar Standards, Lehmann & Joseph (2015),
 * Woolf et al. (2010) Science, and VERRA VM0044 methodology
 */

import type {
  FeedstockParams,
  PyrolysisParams,
  BiocharResults,
} from '../types';

// Feedstock-specific default parameters (dry basis)
export const FEEDSTOCK_DEFAULTS: Record<
  string,
  { carbon: number; ash: number; yieldFactor: number; stability: number }
> = {
  'Wood chips': { carbon: 50, ash: 2, yieldFactor: 0.30, stability: 0.87 },
  'Rice husk': { carbon: 40, ash: 18, yieldFactor: 0.35, stability: 0.80 },
  'Corn stover': { carbon: 44, ash: 5, yieldFactor: 0.28, stability: 0.82 },
  'Wheat straw': { carbon: 45, ash: 7, yieldFactor: 0.27, stability: 0.81 },
  'Bamboo': { carbon: 49, ash: 3, yieldFactor: 0.32, stability: 0.88 },
  'Green waste': { carbon: 42, ash: 8, yieldFactor: 0.25, stability: 0.78 },
  'Sewage sludge': { carbon: 35, ash: 25, yieldFactor: 0.40, stability: 0.70 },
  'Animal manure': { carbon: 38, ash: 20, yieldFactor: 0.38, stability: 0.72 },
  'Crop residues': { carbon: 45, ash: 6, yieldFactor: 0.28, stability: 0.80 },
  'Wood pellets': { carbon: 51, ash: 1, yieldFactor: 0.31, stability: 0.89 },
};

// Temperature correction for biochar yield (higher temp → lower yield but higher C)
function temperatureYieldFactor(temp: number): number {
  // Yield decreases roughly 0.05% per °C above 350°C
  if (temp < 350) return 1.15;
  if (temp > 700) return 0.75;
  return 1.0 - ((temp - 350) / 350) * 0.25;
}

// Temperature correction for carbon content in biochar
function temperatureCarbonFactor(temp: number): number {
  // Higher temperature → higher fixed carbon content
  if (temp < 400) return 0.80;
  if (temp > 700) return 1.05;
  return 0.80 + ((temp - 400) / 300) * 0.25;
}

// Stability (H:Corg) – higher temp produces more recalcitrant biochar
function stabilityFactor(temp: number, baseStability: number): number {
  const tempBonus = Math.min((temp - 350) / 350 * 0.05, 0.07);
  return Math.min(baseStability + tempBonus, 0.95);
}

// Process emission factor based on system type (kg CO2e / tonne dry feedstock)
export const PROCESS_EMISSION_FACTORS: Record<string, number> = {
  'Slow pyrolysis': 30,
  'Fast pyrolysis': 45,
  'Flash carbonisation': 25,
  'Gasification': 60,
  'Hydrothermal carbonisation': 80,
};

// Heat source emission factor (kg CO2e / kWh)
export const HEAT_SOURCE_EMISSION_FACTORS: Record<string, number> = {
  'Natural gas': 0.202,
  'Grid electricity': 0.233,
  'Self-sustaining (syngas)': 0.012,
  'Renewable electricity': 0.010,
  'Biomass combustion': 0.050,
};

/**
 * Main calculation: feedstock → biochar → carbon credits
 */
export function calculateBiochar(
  feedstock: FeedstockParams,
  pyrolysis: PyrolysisParams,
): BiocharResults {
  const defaults = FEEDSTOCK_DEFAULTS[feedstock.feedstockType] ?? {
    carbon: 45,
    ash: 5,
    yieldFactor: 0.30,
    stability: 0.82,
  };

  // 1. Dry feedstock after removing moisture
  const dryFeedstock = feedstock.quantity * (1 - feedstock.moistureContent / 100);

  // 2. Biochar yield (% of dry feedstock, corrected for temperature)
  const baseYieldPct = defaults.yieldFactor * temperatureYieldFactor(pyrolysis.temperature);
  const biocharYield = dryFeedstock * baseYieldPct;

  // 3. Carbon content in biochar (% of biochar mass)
  const carbonContentPct =
    (feedstock.carbonContent / 100) *
    temperatureCarbonFactor(pyrolysis.temperature) *
    (1 - feedstock.ashContent / 100) /
    baseYieldPct *
    0.9; // 90% efficiency factor
  const carbonContentClamped = Math.min(Math.max(carbonContentPct, 0.40), 0.95);

  // 4. Carbon in biochar (tonnes C/year)
  const carbonInBiochar = biocharYield * carbonContentClamped;

  // 5. Stable carbon fraction (permanence, from stability factor)
  const stab = stabilityFactor(
    pyrolysis.temperature,
    defaults.stability,
  );
  const permanentCarbonSeq = carbonInBiochar * stab;

  // 6. CO2e sequestered (C × 44/12 = 3.667)
  const co2eSeq = permanentCarbonSeq * 3.667;

  // 7. Process emissions
  const sysEmissionFactor =
    PROCESS_EMISSION_FACTORS[pyrolysis.systemType] ?? 35;
  const heatEmissionFactor =
    HEAT_SOURCE_EMISSION_FACTORS[pyrolysis.heatSource] ?? 0.233;

  const processEmissions =
    (dryFeedstock * sysEmissionFactor) / 1000 +
    (dryFeedstock * pyrolysis.energyConsumption * heatEmissionFactor) / 1000;

  // 8. Net carbon credits
  const netCarbonCredits = Math.max(co2eSeq - processEmissions, 0);

  return {
    biocharYield,
    biocharYieldPct: baseYieldPct * 100,
    carbonInBiochar,
    biocharStability: stab * 100,
    permanentCarbonSeq,
    co2eSeq,
    netCarbonCredits,
    processEmissions,
  };
}

export function formatNum(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
