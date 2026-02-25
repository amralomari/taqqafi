export type CurrencyCode =
  | "SAR"
  | "AED"
  | "JOD"
  | "BHD"
  | "KWD"
  | "OMR"
  | "QAR"
  | "EGP"
  | "MAD"
  | "TND"
  | "LBP"
  | "IQD"
  | "SDG"
  | "LYD"
  | "SYP"
  | "YER"
  | "DZD"
  | "USD"
  | "EUR"
  | "GBP"
  | "TRY";

export type CurrencyInfo = {
  code: CurrencyCode;
  name: string;
  nameAr: string;
  symbol: string;
  flag: string;
  keywords: string[];
};

export const CURRENCIES: CurrencyInfo[] = [
  {
    code: "SAR",
    name: "Saudi Riyal",
    nameAr: "ريال سعودي",
    symbol: "SR",
    flag: "SA",
    keywords: ["SAR", "SR", "ر.س", "ريال سعودى", "ريال سعودي", "ريال"],
  },
  {
    code: "AED",
    name: "UAE Dirham",
    nameAr: "درهم إماراتي",
    symbol: "AED",
    flag: "AE",
    keywords: ["AED", "د.إ", "درهم اماراتي", "درهم إماراتي", "درهم"],
  },
  {
    code: "JOD",
    name: "Jordanian Dinar",
    nameAr: "دينار أردني",
    symbol: "JD",
    flag: "JO",
    keywords: ["JOD", "JD", "د.أ", "دينار اردني", "دينار أردني"],
  },
  {
    code: "BHD",
    name: "Bahraini Dinar",
    nameAr: "دينار بحريني",
    symbol: "BD",
    flag: "BH",
    keywords: ["BHD", "BD", "د.ب", "دينار بحريني"],
  },
  {
    code: "KWD",
    name: "Kuwaiti Dinar",
    nameAr: "دينار كويتي",
    symbol: "KD",
    flag: "KW",
    keywords: ["KWD", "KD", "د.ك", "دينار كويتي"],
  },
  {
    code: "OMR",
    name: "Omani Rial",
    nameAr: "ريال عماني",
    symbol: "OMR",
    flag: "OM",
    keywords: ["OMR", "ر.ع", "ريال عماني", "ريال عمانى"],
  },
  {
    code: "QAR",
    name: "Qatari Riyal",
    nameAr: "ريال قطري",
    symbol: "QR",
    flag: "QA",
    keywords: ["QAR", "QR", "ر.ق", "ريال قطري", "ريال قطرى"],
  },
  {
    code: "EGP",
    name: "Egyptian Pound",
    nameAr: "جنيه مصري",
    symbol: "EGP",
    flag: "EG",
    keywords: ["EGP", "ج.م", "جنيه مصري", "جنيه مصرى", "جنيه"],
  },
  {
    code: "MAD",
    name: "Moroccan Dirham",
    nameAr: "درهم مغربي",
    symbol: "MAD",
    flag: "MA",
    keywords: ["MAD", "د.م", "درهم مغربي", "درهم مغربى"],
  },
  {
    code: "TND",
    name: "Tunisian Dinar",
    nameAr: "دينار تونسي",
    symbol: "TND",
    flag: "TN",
    keywords: ["TND", "د.ت", "دينار تونسي", "دينار تونسى"],
  },
  {
    code: "LBP",
    name: "Lebanese Pound",
    nameAr: "ليرة لبنانية",
    symbol: "LBP",
    flag: "LB",
    keywords: ["LBP", "ل.ل", "ليرة لبنانية", "ليره لبنانيه"],
  },
  {
    code: "IQD",
    name: "Iraqi Dinar",
    nameAr: "دينار عراقي",
    symbol: "IQD",
    flag: "IQ",
    keywords: ["IQD", "د.ع", "دينار عراقي", "دينار عراقى"],
  },
  {
    code: "SDG",
    name: "Sudanese Pound",
    nameAr: "جنيه سوداني",
    symbol: "SDG",
    flag: "SD",
    keywords: ["SDG", "ج.س", "جنيه سوداني", "جنيه سودانى"],
  },
  {
    code: "LYD",
    name: "Libyan Dinar",
    nameAr: "دينار ليبي",
    symbol: "LYD",
    flag: "LY",
    keywords: ["LYD", "د.ل", "دينار ليبي", "دينار ليبى"],
  },
  {
    code: "SYP",
    name: "Syrian Pound",
    nameAr: "ليرة سورية",
    symbol: "SYP",
    flag: "SY",
    keywords: ["SYP", "ل.س", "ليرة سورية", "ليره سوريه"],
  },
  {
    code: "YER",
    name: "Yemeni Rial",
    nameAr: "ريال يمني",
    symbol: "YER",
    flag: "YE",
    keywords: ["YER", "ر.ي", "ريال يمني", "ريال يمنى"],
  },
  {
    code: "DZD",
    name: "Algerian Dinar",
    nameAr: "دينار جزائري",
    symbol: "DZD",
    flag: "DZ",
    keywords: ["DZD", "د.ج", "دينار جزائري", "دينار جزائرى"],
  },
  {
    code: "USD",
    name: "US Dollar",
    nameAr: "دولار أمريكي",
    symbol: "$",
    flag: "US",
    keywords: ["USD", "دولار امريكي", "دولار أمريكي", "دولار"],
  },
  {
    code: "EUR",
    name: "Euro",
    nameAr: "يورو",
    symbol: "€",
    flag: "EU",
    keywords: ["EUR", "يورو"],
  },
  {
    code: "GBP",
    name: "British Pound",
    nameAr: "جنيه إسترليني",
    symbol: "£",
    flag: "GB",
    keywords: ["GBP", "جنيه استرليني", "جنيه إسترليني"],
  },
  {
    code: "TRY",
    name: "Turkish Lira",
    nameAr: "ليرة تركية",
    symbol: "₺",
    flag: "TR",
    keywords: ["TRY", "TL", "ليرة تركية", "ليره تركيه"],
  },
];

export function getCurrencyByCode(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function detectCurrencyFromSms(text: string): CurrencyCode | null {
  const normalized = text.toLowerCase();
  let bestMatch: { code: CurrencyCode; length: number } | null = null;
  for (const currency of CURRENCIES) {
    for (const keyword of currency.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        if (!bestMatch || keyword.length > bestMatch.length) {
          bestMatch = { code: currency.code, length: keyword.length };
        }
      }
    }
  }
  return bestMatch?.code ?? null;
}
