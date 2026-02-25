import * as Crypto from "expo-crypto";
import { CurrencyCode, detectCurrencyFromSms } from "./currencies";

export type ParsedTransaction = {
  amount: number;
  currency: CurrencyCode;
  merchant: string;
  type: "debit" | "credit";
  rawText: string;
  hash: string;
};

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\u0622|\u0623|\u0625/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .trim();
}

async function computeHash(text: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text.trim().toLowerCase()
  );
  return digest;
}

function arabicNumeralsToWestern(text: string): string {
  const arabicDigits = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
  return text.replace(/[\u0660-\u0669]/g, (d) => String(arabicDigits.indexOf(d)));
}

function flattenText(text: string): string {
  return text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

const ALL_CURRENCY_CODES = [
  "SAR", "SR", "AED", "JOD", "JD", "BHD", "BD", "KWD", "KD",
  "OMR", "QAR", "QR", "EGP", "MAD", "TND", "LBP", "IQD",
  "SDG", "LYD", "SYP", "YER", "DZD", "USD", "EUR", "GBP", "TRY", "TL",
];

const CURRENCY_CODES_RE = ALL_CURRENCY_CODES.join("|");

const BALANCE_KEYWORDS = [
  "balance", "available balance", "remaining balance", "current balance",
  "الرصيد", "الرصيد المتوفر", "الرصيد المتبقي", "رصيدك", "رصيد",
];

const AMOUNT_PATTERNS: RegExp[] = [
  /(?:with\s+amount|amount\s+of|amount\s+is|amount)\s+([\d,]+\.?\d*)/i,
  /(?:بقيمة|بمبلغ|قيمة|مبلغ)\s+([\d,]+\.?\d*)/,
  /(?:المبلغ|مبلغ)\s*:\s*(?:[\u0600-\u06FF\s]*?)\s+([\d,]+\.?\d*)/,
  /(?:ريال\s+سعود[يى]|ريال\s+عمان[يى]|ريال\s+قطر[يى]|ريال\s+يمن[يى]|ريال)\s+([\d,]+\.?\d*)/,
  /(?:درهم|جنيه|دينار|ليرة|ليره)\s*(?:[\u0600-\u06FF]+)?\s+([\d,]+\.?\d*)/,
  /([\d,]+\.?\d*)\s*(?:دينار|ريال|درهم|جنيه|ليرة|ليره)\s*(?:[\u0600-\u06FF]*)/,
  new RegExp(`(?:${CURRENCY_CODES_RE})\\s*([\\d,]+\\.?\\d*)`, "i"),
  new RegExp(`([\\d,]+\\.?\\d*)\\s*(?:${CURRENCY_CODES_RE})(?:\\b|[^A-Za-z])`, "i"),
  /(?:ر\.س|ر\.ع|ر\.ق|ر\.ي|د\.إ|د\.أ|د\.ب|د\.ك|د\.م|د\.ت|د\.ع|د\.ل|د\.ج|ج\.م|ج\.س|ل\.ل|ل\.س)\s*([\d,]+\.?\d*)/,
  /([\d,]+\.?\d*)\s*(?:ر\.س|ر\.ع|ر\.ق|ر\.ي|د\.إ|د\.أ|د\.ب|د\.ك|د\.م|د\.ت|د\.ع|د\.ل|د\.ج|ج\.م|ج\.س|ل\.ل|ل\.س)/,
  /(?:ريال|ر\.س|درهم|جنيه|دينار)\s*([\u0660-\u0669,]+\.?[\u0660-\u0669]*)/,
  /([\u0660-\u0669,]+\.?[\u0660-\u0669]*)\s*(?:ريال|ر\.س|درهم|جنيه|دينار)/,
];

function isNearBalanceKeyword(text: string, matchIndex: number): boolean {
  const prefix = text.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase();
  return BALANCE_KEYWORDS.some((kw) => prefix.includes(kw.toLowerCase()));
}

const MERCHANT_PATTERNS: RegExp[] = [
  /من\s*:\s*([^\n\r]{2,40})(?:\n|$)/,
  /من\s+([A-Za-z0-9*.\-\s&']+?)(?:\s+في\b|\s+بتاريخ|\n|$)/i,
  /(?:at|from|@)\s+([A-Za-z0-9\s\-&'.*]+?)(?:\s+on|\s+dated?|\s+\d|\s+ref|\s+and\b|\n|$)/i,
  /(?:لدى)\s+([\u0600-\u06FF\s]+?)(?:\s+بتاريخ|\s+الرصيد|\.\s|\n|$)/,
  /(?:Merchant|merchant)\s*:\s*([A-Za-z0-9\s\-&'.]+?)(?:\s*\.\s+|\s+Date|\s+Ref|\n|$)/i,
  /(?:to|payment\s+to)\s+([A-Za-z0-9\s\-&'.]+?)(?:\s+on|\s+ref|\s+was|\n|$)/i,
  /(?:POS|purchase|مشتريات)\s*:?\s*([A-Za-z0-9\s\-&'.]{2,30})/i,
];

const DEBIT_KEYWORDS = [
  "deducted", "charged", "debit", "spent", "purchase", "payment", "paid",
  "تم خصم", "مدين", "مشتريات", "دفع", "سداد", "شراء", "خصم", "خصم نهائي",
  "حجز مبلغ", "عملية شراء", "تسديد", "سحب", "صرف",
];

const CREDIT_KEYWORDS = [
  "received", "credited", "credit", "deposited", "refund", "salary",
  "تم إيداع", "دائن", "استرداد", "إيداع", "راتب",
];

export function isFinancialSms(body: string): boolean {
  const flat = flattenText(normalizeArabic(body));
  const patterns = [
    new RegExp(`\\b(?:${CURRENCY_CODES_RE})\\b`, "i"),
    /ر\.س|ر\.ع|ر\.ق|د\.إ|د\.أ|د\.ب|د\.ك|ج\.م|ل\.ل/,
    /ريال|درهم|جنيه|دينار|ليرة/,
    /debit|credit|deducted|charged|payment|transfer|purchase|amount/i,
    /مدين|دائن|خصم|إيداع|حوالة|تحويل|شراء|دفع|سداد|مبلغ|بقيمة|بمبلغ|تسديد|سحب/,
    /mada|مدى|بطاقة|card/i,
    /balance|رصيد/i,
  ];
  return patterns.some((re) => re.test(flat));
}

export async function parseSms(
  body: string
): Promise<ParsedTransaction | null> {
  if (!isFinancialSms(body)) return null;

  const flat = flattenText(body);
  const normalized = normalizeArabic(flat);
  const westernized = arabicNumeralsToWestern(normalized);

  let amount: number | null = null;
  for (const pattern of AMOUNT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags + (pattern.flags.includes("g") ? "" : "g"));
    let match: RegExpExecArray | null;
    while ((match = regex.exec(westernized)) !== null) {
      const raw = match[1].replace(/,/g, "");
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) {
        if (isNearBalanceKeyword(westernized, match.index)) {
          continue;
        }
        amount = parsed;
        break;
      }
    }
    if (amount !== null) break;
  }

  if (amount === null) return null;

  const detectedCurrency = detectCurrencyFromSms(flat) ?? "SAR";

  const lowerFlat = flat.toLowerCase();
  const normalizedLower = normalized.toLowerCase();
  let type: "debit" | "credit" = "debit";
  if (CREDIT_KEYWORDS.some((kw) => normalizedLower.includes(kw.toLowerCase()) || lowerFlat.includes(kw.toLowerCase()))) {
    type = "credit";
  }
  if (DEBIT_KEYWORDS.some((kw) => normalizedLower.includes(kw.toLowerCase()) || lowerFlat.includes(kw.toLowerCase()))) {
    type = "debit";
  }

  let merchant = "Unknown";
  for (const pattern of MERCHANT_PATTERNS) {
    const match = flat.match(pattern);
    if (match) {
      let raw = match[1].trim();
      raw = raw.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
      raw = raw.replace(/\s*\*\s*PENDING\b.*/i, "").trim();
      if (raw.length >= 2 && raw.length <= 50) {
        merchant = raw
          .split(" ")
          .map((w) => {
            if (/^[A-Za-z]/.test(w)) {
              return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            }
            return w;
          })
          .join(" ");
        break;
      }
    }
  }

  const hash = await computeHash(body);

  return {
    amount,
    currency: detectedCurrency,
    merchant,
    type,
    rawText: body,
    hash,
  };
}
