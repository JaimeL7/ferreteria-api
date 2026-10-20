import { ValidationError } from "../errors/AppError.js";

// Decimal string representation keeps arithmetic independent of binary floats.
export function normalizeAmount(value) {
  if (typeof value !== "string" && typeof value !== "number") throw new ValidationError("precio debe ser una cantidad decimal");
  const raw = String(value);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw) || raw.replace(".", "").length > 34) throw new ValidationError("precio debe ser decimal no negativo y válido");
  const [integer, fraction = ""] = raw.split(".");
  if (fraction.length > 2) throw new ValidationError("Los valores en COP admiten máximo dos decimales");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${integer}.${trimmed}` : integer;
}

function parts(amount) {
  const [integer, fraction = ""] = normalizeAmount(amount).split(".");
  return { integer: BigInt(integer), fraction };
}

export function multiplyAmount(amount, quantity) {
  const { integer, fraction } = parts(amount);
  const scaled = integer * (10n ** BigInt(fraction.length)) + BigInt(fraction || "0");
  const product = scaled * BigInt(quantity);
  const digits = product.toString().padStart(fraction.length + 1, "0");
  const combined = fraction.length ? `${digits.slice(0, -fraction.length)}.${digits.slice(-fraction.length)}` : digits;
  return normalizeAmount(combined);
}

export function addAmounts(values) {
  const parsed = values.map(parts);
  const scale = Math.max(0, ...parsed.map(({ fraction }) => fraction.length));
  const total = parsed.reduce((sum, { integer, fraction }) => sum + integer * (10n ** BigInt(scale)) + BigInt(fraction.padEnd(scale, "0") || "0"), 0n);
  const digits = total.toString().padStart(scale + 1, "0");
  return normalizeAmount(scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits);
}
