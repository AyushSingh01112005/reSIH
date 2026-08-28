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

  // Crop-specific ideal band and the outer range used to map stress to 100%.
  idealTemperatureMin: number;
  idealTemperatureMax: number;
  criticalTemperatureMin: number;
  criticalTemperatureMax: number;

  // Q10 temperature coefficient.
  q10: number;

  // Humidity limits.
  idealHumidityMin: number;
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

  // Shelf life in hours at the reference conditions.
  baselineShelfLifeHours: number;

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

  /**
   * Measured condition/RSL pairs used to calibrate this product.  The sensor
   * values are deliberately kept in their native units: `gasRaw` is an MQ
   * sensor index, while `co2Ppm` is ppm.
   */
  shelfLifeCalibration: Array<{
    temperature: number;
    humidity: number;
    co2Ppm: number;
    gasRaw: number;
    shelfLifeHours: number;
  }>;

  /** Normalising widths for the multivariate calibration distance. */
  calibrationScale: {
    temperature: number;
    humidity: number;
    co2Ppm: number;
    gasRaw: number;
  };

  // Multipliers applied only while a live incident signal is present.
  alcoholDamageMultiplier: number;
  physicalDamageMultiplier: number;
};


/**
 * Example: Mango
 *
 * Calibrated against the supplied mango storage observations.  The reference
 * condition (13 C, 88% RH, 450 ppm CO2, gas index 500) has an 18-day life.
 *
 * 13 C and 90-95% RH are published mango storage targets; the slightly lower
 * 88% reference humidity reflects the supplied measurement data.  `gasRaw`
 * remains a device-specific index and must be recalibrated if the sensor or
 * its firmware conversion changes.
 */
export const MANGO: ProductProfile = {
  name: "Mango",

  referenceTemperatureC: 13,
  idealTemperatureMin: 12,
  idealTemperatureMax: 14,
  criticalTemperatureMin: 8,
  criticalTemperatureMax: 23,

  q10: 2.2,

  idealHumidityMin: 85,
  optimalHumidity: 88,
  criticalHumidity: 95,

  gasSafe: 500,
  gasCritical: 2600,

  co2Safe: 450,
  co2Critical: 2400,

  // Damage is expressed as the fraction of usable shelf life consumed.
  criticalDamage: 1,
  baselineShelfLifeHours: 432,

  humiditySensitivity: 0.35,
  gasSensitivity: 1.0,
  co2Sensitivity: 0.8,

  temperatureRiskWeight: 0.35,
  humidityRiskWeight: 0.10,
  gasRiskWeight: 0.20,
  co2RiskWeight: 0.15,
  damageRiskWeight: 0.20,

  calibrationScale: {
    temperature: 6,
    humidity: 8,
    co2Ppm: 400,
    gasRaw: 500,
  },

  alcoholDamageMultiplier: 1.4,
  physicalDamageMultiplier: 1.2,

  shelfLifeCalibration: [
    { temperature: 13, humidity: 88, co2Ppm: 450, gasRaw: 500, shelfLifeHours: 432 },
    { temperature: 15, humidity: 85, co2Ppm: 520, gasRaw: 650, shelfLifeHours: 296.9 },
    { temperature: 22, humidity: 80, co2Ppm: 700, gasRaw: 850, shelfLifeHours: 128.2 },
    { temperature: 28, humidity: 75, co2Ppm: 950, gasRaw: 1100, shelfLifeHours: 65 },
    { temperature: 34, humidity: 65, co2Ppm: 1200, gasRaw: 1400, shelfLifeHours: 33.1 },
    { temperature: 30, humidity: 92, co2Ppm: 1350, gasRaw: 1600, shelfLifeHours: 39.4 },
    { temperature: 25, humidity: 85, co2Ppm: 1800, gasRaw: 2100, shelfLifeHours: 38.2 },
    { temperature: 26, humidity: 82, co2Ppm: 1000, gasRaw: 1200, shelfLifeHours: 55.6 },
    { temperature: 27, humidity: 84, co2Ppm: 1100, gasRaw: 1300, shelfLifeHours: 55.6 },
    { temperature: 28, humidity: 80, co2Ppm: 1050, gasRaw: 1250, shelfLifeHours: 50.6 },
    { temperature: 15.8, humidity: 82, co2Ppm: 1120, gasRaw: 1850, shelfLifeHours: 69.6 },
    { temperature: 32, humidity: 88, co2Ppm: 2100, gasRaw: 2300, shelfLifeHours: 9.8 },
    { temperature: 8, humidity: 85, co2Ppm: 500, gasRaw: 600, shelfLifeHours: 224.9 },
    { temperature: 36, humidity: 90, co2Ppm: 2400, gasRaw: 2600, shelfLifeHours: 4.7 },
    { temperature: 38, humidity: 95, co2Ppm: 2800, gasRaw: 2900, shelfLifeHours: 3.5 },
  ],
};

/**
 * Crop profiles drive the mathematical *risk* engine. Temperature and RH
 * references reflect typical refrigerated storage guidance: apple 0–4 C /
 * 90–95% RH, mature-green tomato 12–15 C / 85–95% RH, potato 4–10 C /
 * 90–95% RH, and mango 12–14 C / 85–90% RH. MQ135 values are device indexes
 * (not ppm), so their thresholds must be field-calibrated for each enclosure.
 */
export const APPLE: ProductProfile = {
  name: "Apple", referenceTemperatureC: 2, idealTemperatureMin: 0, idealTemperatureMax: 4, criticalTemperatureMin: -2, criticalTemperatureMax: 12, q10: 2.0,
  idealHumidityMin: 90, optimalHumidity: 92, criticalHumidity: 97,
  gasSafe: 350, gasCritical: 1800, co2Safe: 800, co2Critical: 3000,
  criticalDamage: 1, baselineShelfLifeHours: 1440,
  humiditySensitivity: 0.3, gasSensitivity: 1.1, co2Sensitivity: 0.7,
  temperatureRiskWeight: 0.4, humidityRiskWeight: 0.1, gasRiskWeight: 0.2, co2RiskWeight: 0.1, damageRiskWeight: 0.2,
  calibrationScale: { temperature: 5, humidity: 7, co2Ppm: 500, gasRaw: 450 },
  alcoholDamageMultiplier: 1.35, physicalDamageMultiplier: 1.15,
  shelfLifeCalibration: [
    { temperature: 2, humidity: 92, co2Ppm: 800, gasRaw: 350, shelfLifeHours: 1440 },
    { temperature: 4, humidity: 90, co2Ppm: 900, gasRaw: 450, shelfLifeHours: 1152 },
    { temperature: 6, humidity: 88, co2Ppm: 1100, gasRaw: 600, shelfLifeHours: 792 },
    { temperature: 8, humidity: 85, co2Ppm: 1300, gasRaw: 750, shelfLifeHours: 528 },
    { temperature: 10, humidity: 82, co2Ppm: 1500, gasRaw: 900, shelfLifeHours: 336 },
    { temperature: 12, humidity: 90, co2Ppm: 1700, gasRaw: 1050, shelfLifeHours: 216 },
    { temperature: 15, humidity: 85, co2Ppm: 1900, gasRaw: 1200, shelfLifeHours: 120 },
    { temperature: 18, humidity: 80, co2Ppm: 2100, gasRaw: 1350, shelfLifeHours: 72 },
    { temperature: 22, humidity: 78, co2Ppm: 2300, gasRaw: 1500, shelfLifeHours: 42 },
    { temperature: 25, humidity: 75, co2Ppm: 2500, gasRaw: 1650, shelfLifeHours: 24 },
    { temperature: 2, humidity: 98, co2Ppm: 1000, gasRaw: 500, shelfLifeHours: 1008 },
    { temperature: 0, humidity: 92, co2Ppm: 800, gasRaw: 350, shelfLifeHours: 1296 },
    { temperature: 5, humidity: 95, co2Ppm: 1400, gasRaw: 800, shelfLifeHours: 600 },
    { temperature: 14, humidity: 92, co2Ppm: 2200, gasRaw: 1450, shelfLifeHours: 108 },
    { temperature: 20, humidity: 90, co2Ppm: 2800, gasRaw: 1750, shelfLifeHours: 48 },
  ],
};

export const TOMATO: ProductProfile = {
  name: "Tomato", referenceTemperatureC: 13, idealTemperatureMin: 12, idealTemperatureMax: 15, criticalTemperatureMin: 7, criticalTemperatureMax: 25, q10: 2.3,
  idealHumidityMin: 85, optimalHumidity: 90, criticalHumidity: 96,
  gasSafe: 400, gasCritical: 2000, co2Safe: 500, co2Critical: 2500,
  criticalDamage: 1, baselineShelfLifeHours: 336,
  humiditySensitivity: 0.4, gasSensitivity: 1.1, co2Sensitivity: 0.8,
  temperatureRiskWeight: 0.35, humidityRiskWeight: 0.1, gasRiskWeight: 0.2, co2RiskWeight: 0.15, damageRiskWeight: 0.2,
  calibrationScale: { temperature: 5, humidity: 7, co2Ppm: 450, gasRaw: 450 },
  alcoholDamageMultiplier: 1.45, physicalDamageMultiplier: 1.2,
  shelfLifeCalibration: [
    { temperature: 13, humidity: 90, co2Ppm: 500, gasRaw: 400, shelfLifeHours: 336 },
    { temperature: 15, humidity: 88, co2Ppm: 600, gasRaw: 500, shelfLifeHours: 240 },
    { temperature: 18, humidity: 85, co2Ppm: 750, gasRaw: 650, shelfLifeHours: 144 },
    { temperature: 22, humidity: 82, co2Ppm: 900, gasRaw: 800, shelfLifeHours: 84 },
    { temperature: 26, humidity: 80, co2Ppm: 1100, gasRaw: 1000, shelfLifeHours: 48 },
    { temperature: 30, humidity: 85, co2Ppm: 1300, gasRaw: 1200, shelfLifeHours: 30 },
    { temperature: 34, humidity: 88, co2Ppm: 1500, gasRaw: 1400, shelfLifeHours: 18 },
    { temperature: 10, humidity: 90, co2Ppm: 550, gasRaw: 450, shelfLifeHours: 216 },
    { temperature: 8, humidity: 88, co2Ppm: 650, gasRaw: 550, shelfLifeHours: 144 },
    { temperature: 6, humidity: 85, co2Ppm: 750, gasRaw: 650, shelfLifeHours: 84 },
    { temperature: 13, humidity: 97, co2Ppm: 700, gasRaw: 600, shelfLifeHours: 240 },
    { temperature: 18, humidity: 93, co2Ppm: 1200, gasRaw: 1000, shelfLifeHours: 96 },
    { temperature: 24, humidity: 90, co2Ppm: 1600, gasRaw: 1400, shelfLifeHours: 42 },
    { temperature: 28, humidity: 95, co2Ppm: 2000, gasRaw: 1700, shelfLifeHours: 24 },
    { temperature: 32, humidity: 96, co2Ppm: 2500, gasRaw: 2000, shelfLifeHours: 12 },
  ],
};

export const POTATO: ProductProfile = {
  name: "Potato", referenceTemperatureC: 7, idealTemperatureMin: 4, idealTemperatureMax: 10, criticalTemperatureMin: 1, criticalTemperatureMax: 18, q10: 2.0,
  idealHumidityMin: 90, optimalHumidity: 92, criticalHumidity: 97,
  gasSafe: 300, gasCritical: 1700, co2Safe: 600, co2Critical: 2500,
  criticalDamage: 1, baselineShelfLifeHours: 2160,
  humiditySensitivity: 0.25, gasSensitivity: 1.0, co2Sensitivity: 0.6,
  temperatureRiskWeight: 0.35, humidityRiskWeight: 0.1, gasRiskWeight: 0.2, co2RiskWeight: 0.15, damageRiskWeight: 0.2,
  calibrationScale: { temperature: 6, humidity: 7, co2Ppm: 500, gasRaw: 400 },
  alcoholDamageMultiplier: 1.25, physicalDamageMultiplier: 1.1,
  shelfLifeCalibration: [
    { temperature: 7, humidity: 92, co2Ppm: 600, gasRaw: 300, shelfLifeHours: 2160 },
    { temperature: 5, humidity: 90, co2Ppm: 700, gasRaw: 400, shelfLifeHours: 1800 },
    { temperature: 10, humidity: 90, co2Ppm: 800, gasRaw: 500, shelfLifeHours: 1440 },
    { temperature: 12, humidity: 88, co2Ppm: 1000, gasRaw: 650, shelfLifeHours: 960 },
    { temperature: 15, humidity: 85, co2Ppm: 1200, gasRaw: 800, shelfLifeHours: 600 },
    { temperature: 18, humidity: 82, co2Ppm: 1400, gasRaw: 950, shelfLifeHours: 360 },
    { temperature: 22, humidity: 80, co2Ppm: 1600, gasRaw: 1100, shelfLifeHours: 192 },
    { temperature: 26, humidity: 78, co2Ppm: 1800, gasRaw: 1250, shelfLifeHours: 96 },
    { temperature: 30, humidity: 75, co2Ppm: 2000, gasRaw: 1400, shelfLifeHours: 48 },
    { temperature: 35, humidity: 75, co2Ppm: 2300, gasRaw: 1600, shelfLifeHours: 24 },
    { temperature: 2, humidity: 92, co2Ppm: 700, gasRaw: 400, shelfLifeHours: 1200 },
    { temperature: 7, humidity: 98, co2Ppm: 800, gasRaw: 500, shelfLifeHours: 1680 },
    { temperature: 14, humidity: 95, co2Ppm: 1400, gasRaw: 950, shelfLifeHours: 480 },
    { temperature: 20, humidity: 92, co2Ppm: 1900, gasRaw: 1300, shelfLifeHours: 240 },
    { temperature: 28, humidity: 90, co2Ppm: 2500, gasRaw: 1700, shelfLifeHours: 72 },
  ],
};


/**
 * All supported products.
 *
 * Adding a new product later only requires adding
 * another ProductProfile here.
 */
export const PRODUCTS: Record<string, ProductProfile> = {
  mango: MANGO,
  apple: APPLE,
  tomato: TOMATO,
  potato: POTATO,
};
