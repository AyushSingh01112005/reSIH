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
 * Estimate CO2 from the MQ-135 Rs/R0 response curve with limited temperature
 * and humidity corrections. Rs and R0 must both be positive kilo-ohm values.
 */
export function estimateCO2(
  mq135RsKohm: unknown,
  mq135R0Kohm: unknown,
  temperature: unknown,
  humidity: unknown
): number | null {
  const rs = finiteNumber(mq135RsKohm);
  const r0 = finiteNumber(mq135R0Kohm);

  if (rs === null || r0 === null || rs <= 0 || r0 <= 0) return null;

  const ratio = rs / r0;
  let co2 = 1000 * Math.pow(ratio, -2.72);

  const safeTemperature = finiteNumber(temperature) ?? 25;
  const safeHumidity = finiteNumber(humidity) ?? 50;
  co2 *= 1 + (safeHumidity - 50) * 0.002;
  co2 *= 1 + (safeTemperature - 25) * 0.005;

  return Math.round(Math.max(350, Math.min(co2, 5000)));
}

/**
 * The Rs/R0 calculation is the canonical CO2 value for every app consumer.
 * Older readings without calibration values use the previous raw-gas estimate
 * (or 400 ppm ambient) so they never become an invalid 0 ppm datapoint.
 */
export function resolveCO2Ppm(telemetry: TelemetryWithGasAndCO2): number {
  const co2 = estimateCO2(
    telemetry.mq135_rs_kohm,
    telemetry.mq135_r0_kohm,
    telemetry.temperature,
    telemetry.humidity
  );

  if (co2 !== null) return co2;

  const gasRaw = finiteNumber(telemetry.gas_raw ?? telemetry.raw_gas);
  if (gasRaw === null || gasRaw <= 0) return 400;

  return Math.round(Math.min(Math.max(400 + (gasRaw - 300) * 0.9, 400), 5000));
}
