// lib/silosense/products.ts

/**
 * Product-specific parameters.
 *
 * IMPORTANT:
 * These are PROTOTYPE values.
 *
 * For real/accurate shelf-life prediction, these parameters
 * must be calibrated using real experimental or validated
 * historical data for each product.
 */

export type ProductProfile = {
  name: string;

  // Temperature at which the reference deterioration rate applies.
  referenceTemperatureC: number;

  // Q10 temperature coefficient.
  q10: number;

  // Humidity limits.
  optimalHumidity: number;
  criticalHumidity: number;

  // Gas sensor limits.
  gasSafe: number;
  gasCritical: number;

  // CO2 limits.
  co2Safe: number;
  co2Critical: number;

  // Maximum acceptable accumulated damage.
  criticalDamage: number;

  // How strongly humidity affects deterioration.
  humiditySensitivity: number;

  // How strongly gas affects deterioration.
  gasSensitivity: number;

  // How strongly CO2 affects deterioration.
  co2Sensitivity: number;

  // Risk weights.
  temperatureRiskWeight: number;
  humidityRiskWeight: number;
  gasRiskWeight: number;
  co2RiskWeight: number;
  damageRiskWeight: number;
};


/**
 * Example: Mango
 *
 * These values are only starting values for your prototype.
 */
export const MANGO: ProductProfile = {
  name: "Mango",

  referenceTemperatureC: 13,

  q10: 2.2,

  optimalHumidity: 90,
  criticalHumidity: 95,

  gasSafe: 1000,
  gasCritical: 3000,

  co2Safe: 1000,
  co2Critical: 3000,

  criticalDamage: 12,

  humiditySensitivity: 0.25,
  gasSensitivity: 0.20,
  co2Sensitivity: 0.20,

  temperatureRiskWeight: 0.40,
  humidityRiskWeight: 0.15,
  gasRiskWeight: 0.15,
  co2RiskWeight: 0.10,
  damageRiskWeight: 0.20,
};


/**
 * All supported products.
 *
 * Adding a new product later only requires adding
 * another ProductProfile here.
 */
export const PRODUCTS: Record<string, ProductProfile> = {
  mango: MANGO,
};