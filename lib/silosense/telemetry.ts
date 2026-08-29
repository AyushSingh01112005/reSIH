/**
 * Normalise the small subset of telemetry used by the shelf-life model.
 *
 * MQ-135 is a broad gas sensor, so this remains an estimate rather than a
 * laboratory-accurate CO2 measurement.
 */
type TelemetryWithGasAndCO2 = {
  gas_raw?: unknown;
  raw_gas?: unknown;
  mq135_rs_kohm?: unknown;
  mq135_r0_kohm?: unknown;
  temperature?: unknown;
  humidity?: unknown;
};

function finiteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Estimate CO2 ppm from the ESP8266's raw MQ135 ADC reading.
 *
 * The sensor is calibrated against a raw reading of 275 in clean air at
 * 420 ppm CO2. This must be kept in sync with the ESP8266 circuit values.
 */
export function calculateCO2PPM(rawGas: unknown): number | null {
  const ADC_MAX = 1023;
  const ADC_VOLTAGE = 3.3;
  const VC = 5.0;
  const RL_KOHM = 20.0;
  const CLEAN_AIR_RAW = 275;
  const CLEAN_AIR_CO2 = 420;
  const A = 116.6;
  const B = -2.769;

  const rawReading = finiteNumber(rawGas);
  if (rawReading === null) return null;

  const clampedRawGas = Math.max(1, Math.min(1022, rawReading));
  const voltage = (clampedRawGas / ADC_MAX) * ADC_VOLTAGE;

  if (voltage <= 0.01 || voltage >= VC) return null;

  const rs = ((VC / voltage) - 1) * RL_KOHM;
  const cleanVoltage = (CLEAN_AIR_RAW / ADC_MAX) * ADC_VOLTAGE;
  const cleanRs = ((VC / cleanVoltage) - 1) * RL_KOHM;
  const cleanRsR0 = Math.pow(CLEAN_AIR_CO2 / A, 1 / B);
  const r0 = cleanRs / cleanRsR0;
  const rsR0 = rs / r0;
  const co2 = A * Math.pow(rsR0, B);

  return Math.round(Math.max(350, Math.min(5000, co2)));
}

/**
 * The raw ADC calculation is the canonical CO2 value for every app consumer.
 * A stored estimate is only used for historical readings without a raw value.
 */
export function resolveCO2Ppm(telemetry: TelemetryWithGasAndCO2): number {
  const gasRaw = finiteNumber(telemetry.gas_raw ?? telemetry.raw_gas);
  const co2 = calculateCO2PPM(gasRaw);
  if (co2 !== null) return co2;

  return 400;
}
