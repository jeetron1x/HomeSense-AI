export type ApplianceCategory = 'hvac' | 'fridge' | 'washer' | 'fan' | 'other';

export interface BeeMetrics {
  annualKwh: number;
  monthlyKwh: number;
  dailyKwh: number;
  annualCostInr: number;
  monthlyCostInr: number;
  dailyCostInr: number;
  ratedWatts: number;
  baselineAnnualKwh: number;
  annualSavingsInr: number;
  carbonOffsetKg: number;
  efficiencyMetric: string;
  efficiencyValue: string;
}

export const DEFAULT_TARIFF_RATE = 8.0; // ₹8.0 / kWh (Member 3 homrsense_ai.py standard)

/**
 * Member 3's Core Cost Calculation logic (from homrsense_ai.py)
 */
export function calculateMember3Cost(
  wattage: number | null,
  hoursPerDay: number = 24.0,
  tariffRate: number = DEFAULT_TARIFF_RATE
) {
  if (wattage === null || wattage <= 0) {
    return { daily_units: null, daily_cost: null, monthly_cost: null };
  }

  const dailyUnits = Number(((wattage / 1000.0) * hoursPerDay).toFixed(3));
  const dailyCost = Number((dailyUnits * tariffRate).toFixed(2));
  const monthlyCost = Number((dailyCost * 30.0).toFixed(2));

  return {
    daily_units: dailyUnits,
    daily_cost: dailyCost,
    monthly_cost: monthlyCost,
  };
}

/**
 * Computes electrical, tariff, and savings metrics
 * aligned with Member 3's homrsense_ai.py cost calculations.
 */
export function calculateBeeMetrics(
  category: ApplianceCategory,
  starRating: number,
  annualKwh: number,
  capacityValue: number,
  tariffRate: number = DEFAULT_TARIFF_RATE,
  dailyHours: number = 24.0
): BeeMetrics {
  const stars = Math.min(5, Math.max(1, Math.round(starRating)));

  // Member 3 logic: If wattage is not explicitly provided, derive average operating wattage
  // Average power = (Annual kWh / 8760 hours in a year) * 1000 W
  let ratedWatts = annualKwh > 0 ? Math.round((annualKwh / 8760.0) * 1000) : 100;
  if (category === 'hvac') {
    ratedWatts = annualKwh > 0 ? Math.round((annualKwh * 1000) / 1600) : 1400;
  } else if (category === 'washer') {
    ratedWatts = 350;
  } else if (category === 'fan') {
    ratedWatts = stars >= 5 ? 28 : 50;
  }

  let efficiencyMetric = 'Annual Units';
  let efficiencyValue = `${annualKwh} kWh/yr`;

  if (category === 'fridge') {
    efficiencyMetric = 'Volume Efficiency';
    efficiencyValue = `${capacityValue > 0 ? capacityValue : 260}L • ${annualKwh} kWh`;
  } else if (category === 'hvac') {
    efficiencyMetric = 'Cooling Capacity';
    efficiencyValue = `${capacityValue > 0 ? capacityValue : 1.5} Ton • ${annualKwh} kWh`;
  } else if (category === 'washer') {
    efficiencyMetric = 'Load Capacity';
    efficiencyValue = `${capacityValue > 0 ? capacityValue : 7} kg • ${annualKwh} kWh`;
  } else if (category === 'fan') {
    efficiencyMetric = 'BLDC Sweep';
    efficiencyValue = `${capacityValue > 0 ? capacityValue : 1200} mm • ${ratedWatts}W`;
  }

  // Baseline for comparison (1-Star baseline)
  const baselineAnnualKwh = Math.round(annualKwh * (1 + (stars - 1) * 0.15));

  // Member 3 Cost Computations
  const cost = calculateMember3Cost(ratedWatts, dailyHours, tariffRate);
  const dailyKwh = cost.daily_units || Number((annualKwh / 365).toFixed(2));
  const dailyCostInr = cost.daily_cost !== null ? Math.round(cost.daily_cost) : Math.round((annualKwh * tariffRate) / 365);
  const monthlyCostInr = cost.monthly_cost !== null ? Math.round(cost.monthly_cost) : Math.round(dailyCostInr * 30);
  const annualCostInr = Math.round(annualKwh * tariffRate);

  const baselineAnnualCost = Math.round(baselineAnnualKwh * tariffRate);
  const annualSavingsInr = Math.max(0, baselineAnnualCost - annualCostInr);
  const carbonOffsetKg = Math.max(0, Math.round((baselineAnnualKwh - annualKwh) * 0.82));
  const monthlyKwh = Number((annualKwh / 12).toFixed(1));

  return {
    annualKwh,
    monthlyKwh,
    dailyKwh,
    annualCostInr,
    monthlyCostInr,
    dailyCostInr,
    ratedWatts,
    baselineAnnualKwh,
    annualSavingsInr,
    carbonOffsetKg,
    efficiencyMetric,
    efficiencyValue,
  };
}
