// lib/silosense/prediction.ts

import type { ProductProfile } from "./products";


/**
 * EXACTLY matches the important parts of the
 * telemetry structure coming from SiloSense.
 */
export type SiloSensePayload = {
  telemetry: {
    temperature: number;
    humidity: number;
    gas_raw: number;
    co2_sim: number;
  };

  triggers: {
    alcohol_detected: boolean;
    motion_detected: boolean;
    sound_detected: boolean;
    tamper_light: boolean;
  };

  status: {
    wifi_connected: boolean;
    http_response: number;
    uptime_sec: number;
  };

  deviceId: string;

  timestamp_ms: number;

  createdAt?: string | Date;
  updatedAt?: string | Date;
};


/**
 * State maintained for each device/batch.
 *
 * cumulativeDamage is the most important value.
 *
 * It represents deterioration accumulated over time.
 */
export type PredictionState = {
  cumulativeDamage: number;
  lastTimestamp: number;
};


/**
 * Result returned to your Next.js frontend.
 */
export type PredictionResult = {
  deviceId: string;

  product: string;

  riskPercentage: number;

  remainingShelfLifeHours: number;

  remainingShelfLifeDays: number;

  cumulativeDamage: number;

  deteriorationRate: number;

  temperatureFactor: number;

  humidityFactor: number;

  gasFactor: number;

  co2Factor: number;

  temperatureRisk: number;

  humidityRisk: number;

  gasRisk: number;

  co2Risk: number;

  damageRisk: number;

  physicalAlert: boolean;

  alerts: string[];

  status:
    | "SAFE"
    | "WARNING"
    | "CRITICAL";

  explanation: string;
};


/**
 * Keep a number between 0 and 1.
 */
function clamp01(value: number): number {
  return Math.min(
    Math.max(value, 0),
    1
  );
}


/**
 * ----------------------------------------------------
 * TEMPERATURE MODEL
 * ----------------------------------------------------
 *
 * Q10 model:
 *
 *     fT = Q10 ^ ((T - Tref) / 10)
 *
 * If temperature rises 10°C above the reference,
 * deterioration becomes approximately Q10 times faster.
 */
function calculateTemperatureFactor(
  temperature: number,
  profile: ProductProfile
): number {
  return Math.pow(
    profile.q10,
    (
      temperature -
      profile.referenceTemperatureC
    ) / 10
  );
}


/**
 * Temperature risk.
 *
 * This is NOT the deterioration calculation.
 *
 * It answers:
 *
 * "How dangerous is the current temperature?"
 */
function calculateTemperatureRisk(
  temperature: number,
  profile: ProductProfile
): number {

  if (
    temperature <=
    profile.referenceTemperatureC
  ) {
    return 0;
  }

  /**
   * We consider 10°C above reference
   * as the high-risk boundary.
   */
  const criticalTemperature =
    profile.referenceTemperatureC + 10;

  return clamp01(
    (
      temperature -
      profile.referenceTemperatureC
    ) /
    (
      criticalTemperature -
      profile.referenceTemperatureC
    )
  );
}


/**
 * ----------------------------------------------------
 * HUMIDITY
 * ----------------------------------------------------
 */
function calculateHumidityStress(
  humidity: number,
  profile: ProductProfile
): number {

  if (
    humidity <=
    profile.optimalHumidity
  ) {
    return 0;
  }

  return clamp01(
    (
      humidity -
      profile.optimalHumidity
    ) /
    (
      profile.criticalHumidity -
      profile.optimalHumidity
    )
  );
}


/**
 * Convert humidity stress into deterioration multiplier.
 */
function calculateHumidityFactor(
  humidityStress: number,
  profile: ProductProfile
): number {

  return (
    1 +
    humidityStress *
    profile.humiditySensitivity
  );
}


/**
 * ----------------------------------------------------
 * GAS
 * ----------------------------------------------------
 *
 * IMPORTANT:
 *
 * gas_raw is treated as a sensor index here.
 *
 * If your hardware team provides a calibrated
 * ppm conversion, replace these thresholds with
 * actual calibrated values.
 */
function calculateGasStress(
  gasRaw: number,
  profile: ProductProfile
): number {

  if (
    gasRaw <=
    profile.gasSafe
  ) {
    return 0;
  }

  return clamp01(
    (
      gasRaw -
      profile.gasSafe
    ) /
    (
      profile.gasCritical -
      profile.gasSafe
    )
  );
}


function calculateGasFactor(
  gasStress: number,
  profile: ProductProfile
): number {

  return (
    1 +
    gasStress *
    profile.gasSensitivity
  );
}


/**
 * ----------------------------------------------------
 * CO2
 * ----------------------------------------------------
 */
function calculateCO2Stress(
  co2: number,
  profile: ProductProfile
): number {

  if (
    co2 <=
    profile.co2Safe
  ) {
    return 0;
  }

  return clamp01(
    (
      co2 -
      profile.co2Safe
    ) /
    (
      profile.co2Critical -
      profile.co2Safe
    )
  );
}


function calculateCO2Factor(
  co2Stress: number,
  profile: ProductProfile
): number {

  return (
    1 +
    co2Stress *
    profile.co2Sensitivity
  );
}


/**
 * ----------------------------------------------------
 * DETERIORATION RATE
 * ----------------------------------------------------
 *
 * k =
 *
 * temperature factor
 * × humidity factor
 * × gas factor
 * × CO2 factor
 *
 * This is our simplified physics-inspired model.
 */
function calculateDeteriorationRate(
  temperatureFactor: number,
  humidityFactor: number,
  gasFactor: number,
  co2Factor: number
): number {

  return (
    temperatureFactor *
    humidityFactor *
    gasFactor *
    co2Factor
  );
}


/**
 * ----------------------------------------------------
 * CUMULATIVE DAMAGE
 * ----------------------------------------------------
 *
 * Damage_new =
 *
 * Damage_old +
 * deteriorationRate × Δt
 *
 * timestamp_ms from your ESP32 is uptime,
 * not necessarily Unix time.
 *
 * Therefore, for reliable intervals, the backend
 * should preferably use the MongoDB createdAt time.
 */
function updateDamage(
  state: PredictionState,
  deteriorationRate: number,
  currentTimestamp: number,
  profile: ProductProfile
): number {

  // timestamp_ms is ESP uptime. A reboot or counter rollover must not
  // create a large artificial exposure interval.
  const deltaHours =
    currentTimestamp >= state.lastTimestamp
      ? Math.min(
          (currentTimestamp - state.lastTimestamp) / (1000 * 60 * 60),
          24
        )
      : 0;

  const damageIncrease =
    deteriorationRate *
    deltaHours;

  const newDamage =
    state.cumulativeDamage +
    damageIncrease;

  return Math.min(
    newDamage,
    profile.criticalDamage
  );
}


/**
 * ----------------------------------------------------
 * DAMAGE → RISK
 * ----------------------------------------------------
 *
 * Non-linear transformation.
 */
function calculateDamageRisk(
  damage: number,
  profile: ProductProfile
): number {

  const normalizedDamage =
    damage /
    profile.criticalDamage;

  return clamp01(
    1 -
    Math.exp(
      -normalizedDamage * 3
    )
  );
}


/**
 * ----------------------------------------------------
 * REMAINING SHELF LIFE
 * ----------------------------------------------------
 *
 * For the prototype we assume:
 *
 * "Current conditions continue into the future."
 *
 * Therefore:
 *
 * RSL =
 *
 * remaining damage /
 * current deterioration rate
 *
 * This should eventually be replaced with
 * future-condition simulation.
 */
function calculateRemainingShelfLife(
  damage: number,
  deteriorationRate: number,
  profile: ProductProfile
): number {

  const remainingDamage =
    Math.max(
      0,
      profile.baselineShelfLifeHours -
      damage
    );

  if (
    deteriorationRate <= 0
  ) {
    return Infinity;
  }

  return Math.max(
    0,
    remainingDamage / deteriorationRate
  );
}


/**
 * ----------------------------------------------------
 * MAIN PREDICTION FUNCTION
 * ----------------------------------------------------
 */
export function predictSiloSense(
  payload: SiloSensePayload,
  previousState: PredictionState,
  profile: ProductProfile
): {
  result: PredictionResult;
  state: PredictionState;
} {

  const {
    telemetry,
    triggers,
    deviceId,
  } = payload;


  /**
   * 1. TEMPERATURE
   */
  const temperatureFactor =
    calculateTemperatureFactor(
      telemetry.temperature,
      profile
    );

  const temperatureRisk =
    calculateTemperatureRisk(
      telemetry.temperature,
      profile
    );


  /**
   * 2. HUMIDITY
   */
  const humidityStress =
    calculateHumidityStress(
      telemetry.humidity,
      profile
    );

  const humidityFactor =
    calculateHumidityFactor(
      humidityStress,
      profile
    );


  /**
   * 3. GAS
   */
  const gasStress =
    calculateGasStress(
      telemetry.gas_raw,
      profile
    );

  const gasFactor =
    calculateGasFactor(
      gasStress,
      profile
    );


  /**
   * 4. CO2
   */
  const co2Stress =
    calculateCO2Stress(
      telemetry.co2_sim,
      profile
    );

  const co2Factor =
    calculateCO2Factor(
      co2Stress,
      profile
    );


  /**
   * 5. TOTAL DETERIORATION RATE
   */
  const deteriorationRate =
    calculateDeteriorationRate(
      temperatureFactor,
      humidityFactor,
      gasFactor,
      co2Factor
    );


  /**
   * 6. CUMULATIVE DAMAGE
   */
  const cumulativeDamage =
    updateDamage(
      previousState,
      deteriorationRate,
      payload.timestamp_ms,
      profile
    );


  /**
   * 7. DAMAGE RISK
   */
  const damageRisk =
    calculateDamageRisk(
      cumulativeDamage,
      profile
    );


  /**
   * 8. PHYSICAL / SECURITY ALERTS
   *
   * These don't directly mean biological spoilage.
   *
   * They indicate something physically suspicious.
   */
  const physicalAlert =
    triggers.motion_detected ||
    triggers.tamper_light ||
    triggers.sound_detected;

  const alerts: string[] = [];

  if (temperatureRisk >= 0.65) {
    alerts.push("Temperature is in the critical range");
  } else if (temperatureRisk >= 0.3) {
    alerts.push("Temperature is above the mango storage target");
  }

  if (humidityStress >= 0.65) {
    alerts.push("Humidity is critically high");
  } else if (humidityStress >= 0.3) {
    alerts.push("Humidity is above the mango storage target");
  }

  if (gasStress >= 0.65) {
    alerts.push("Gas index indicates advanced spoilage activity");
  } else if (gasStress >= 0.3) {
    alerts.push("Gas index is elevated");
  }

  if (co2Stress >= 0.65) {
    alerts.push("CO2 index is critically high");
  } else if (co2Stress >= 0.3) {
    alerts.push("CO2 index is elevated");
  }

  if (triggers.alcohol_detected) {
    alerts.push("Alcohol detected: inspect fruit for fermentation");
  }

  if (triggers.motion_detected || triggers.sound_detected || triggers.tamper_light) {
    alerts.push("Physical or tamper activity detected");
  }


  /**
   * 9. COMPOSITE RISK
   */
  let risk =
    temperatureRisk *
      profile.temperatureRiskWeight +

    humidityStress *
      profile.humidityRiskWeight +

    gasStress *
      profile.gasRiskWeight +

    co2Stress *
      profile.co2RiskWeight +

    damageRisk *
      profile.damageRiskWeight;

  if (triggers.alcohol_detected) {
    risk = Math.max(risk, 0.45);
  }


  /**
   * If tampering or another physical event occurs,
   * force the system into at least WARNING.
   *
   * We do NOT claim that tampering = spoilage.
   */
  if (
    physicalAlert &&
    risk < 0.30
  ) {
    risk = 0.30;
  }


  const riskPercentage =
    Math.round(
      clamp01(risk) * 100
    );


  /**
   * 10. REMAINING SHELF LIFE
   */
  const remainingShelfLifeHours =
    calculateRemainingShelfLife(
      cumulativeDamage,
      deteriorationRate,
      profile
    );


  const remainingShelfLifeDays =
    Number.isFinite(
      remainingShelfLifeHours
    )
      ? remainingShelfLifeHours / 24
      : Infinity;


  /**
   * 11. STATUS
   */
  let status:
    PredictionResult["status"];

  if (
    riskPercentage >= 65
  ) {
    status = "CRITICAL";

  } else if (
    riskPercentage >= 30
  ) {
    status = "WARNING";

  } else {
    status = "SAFE";
  }


  /**
   * 12. EXPLANATION
   *
   * This can later be replaced by an LLM.
   */
  const explanation =
    generateExplanation(
      telemetry.temperature,
      telemetry.humidity,
      telemetry.gas_raw,
      telemetry.co2_sim,
      riskPercentage,
      remainingShelfLifeDays,
      status
    );


  return {
    result: {

      deviceId,

      product:
        profile.name,

      riskPercentage,

      remainingShelfLifeHours:
        Number.isFinite(
          remainingShelfLifeHours
        )
          ? Number(
              remainingShelfLifeHours
                .toFixed(2)
            )
          : Infinity,

      remainingShelfLifeDays:
        Number.isFinite(
          remainingShelfLifeDays
        )
          ? Number(
              remainingShelfLifeDays
                .toFixed(2)
            )
          : Infinity,

      cumulativeDamage:
        Number(
          cumulativeDamage
            .toFixed(4)
        ),

      deteriorationRate:
        Number(
          deteriorationRate
            .toFixed(4)
        ),

      temperatureFactor:
        Number(
          temperatureFactor
            .toFixed(3)
        ),

      humidityFactor:
        Number(
          humidityFactor
            .toFixed(3)
        ),

      gasFactor:
        Number(
          gasFactor
            .toFixed(3)
        ),

      co2Factor:
        Number(
          co2Factor
            .toFixed(3)
        ),

      temperatureRisk:
        Math.round(
          temperatureRisk * 100
        ),

      humidityRisk:
        Math.round(
          humidityStress * 100
        ),

      gasRisk:
        Math.round(
          gasStress * 100
        ),

      co2Risk:
        Math.round(
          co2Stress * 100
        ),

      damageRisk:
        Math.round(
          damageRisk * 100
        ),

      physicalAlert,

      alerts,

      status,

      explanation,
    },


    state: {

      cumulativeDamage,

      lastTimestamp:
        payload.timestamp_ms,
    },
  };
}


/**
 * Simple deterministic explanation.
 *
 * Your LLM can later replace this text.
 */
function generateExplanation(
  temperature: number,
  humidity: number,
  gas: number,
  co2: number,
  risk: number,
  rslDays: number,
  status: PredictionResult["status"]
): string {

  const rsl =
    Number.isFinite(rslDays)
      ? `${rslDays.toFixed(1)} days`
      : "indefinite";


  if (
    status === "CRITICAL"
  ) {

    return (
      `Critical storage conditions detected. ` +
      `Current temperature is ${temperature}°C, ` +
      `humidity is ${humidity}%, ` +
      `gas index is ${gas}, and CO2 index is ${co2}. ` +
      `Overall spoilage risk is ${risk}%. ` +
      `Estimated remaining shelf life is ${rsl}.`
    );
  }


  if (
    status === "WARNING"
  ) {

    return (
      `Storage conditions require attention. ` +
      `Current spoilage risk is ${risk}% ` +
      `with an estimated remaining shelf life ` +
      `of ${rsl}.`
    );
  }


  return (
    `Storage conditions are currently acceptable. ` +
    `Estimated remaining shelf life is ${rsl}.`
  );
}