import { CurrencyCode } from "./currencies";

const RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  SAR: 3.75,
  AED: 3.67,
  JOD: 0.709,
  BHD: 0.376,
  KWD: 0.307,
  OMR: 0.385,
  QAR: 3.64,
  EGP: 49.5,
  MAD: 9.85,
  TND: 3.12,
  LBP: 89500,
  IQD: 1310,
  SDG: 601,
  LYD: 4.85,
  SYP: 13000,
  YER: 250,
  DZD: 134.5,
  EUR: 0.92,
  GBP: 0.79,
  TRY: 32.5,
};

export function getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
  const fromToUsd = 1 / RATES_TO_USD[from];
  const usdToTarget = RATES_TO_USD[to];
  return fromToUsd * usdToTarget;
}

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  return amount * getExchangeRate(from, to);
}

export function getAllCurrencyCodes(): CurrencyCode[] {
  return Object.keys(RATES_TO_USD) as CurrencyCode[];
}
