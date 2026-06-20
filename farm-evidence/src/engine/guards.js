export const MODES = {
  FARMER: "FARMER",
  RESEARCH: "RESEARCH",
};

export function requireResearchMode(mode, fnName) {
  if (mode !== MODES.RESEARCH) {
    throw new Error(
      `BLOCKED Statistics in Farmer Mode: Statistical comparison requires Research Mode. Your session is currently Farmer Mode. (${fnName})`,
    );
  }
}

export function assertNumber(name, value, { allowZero = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    throw new Error(`${name} is required.`);
  }
  const n = Number(value);
  if (!allowZero && n <= 0) {
    throw new Error(`${name} must be greater than 0.`);
  }
  if (allowZero && n < 0) {
    throw new Error(`${name} must be greater than or equal to 0.`);
  }
  return n;
}

export function assertArray(name, value, { minLength = 1 } = {}) {
  if (!Array.isArray(value) || value.length < minLength) {
    throw new Error(`${name} must be an array with at least ${minLength} item(s).`);
  }
}

export function floorToInt(value) {
  return Math.floor(Number(value));
}
