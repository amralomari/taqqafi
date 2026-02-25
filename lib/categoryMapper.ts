/**
 * Maps merchant names and SMS keywords to spending categories.
 * All mapping is done locally — no external API calls.
 */

export type Category =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Bills"
  | "Health"
  | "Entertainment"
  | "Education"
  | "Misc";

export const ALL_CATEGORIES: Category[] = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Education",
  "Misc",
];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Food: [
    "mcdonald", "mcdonalds", "burger king", "kfc", "pizza hut", "dominos",
    "subway", "starbucks", "dunkin", "costa", "jarir bakery", "shutter",
    "restaurant", "cafe", "coffee", "bakery", "kitchen", "grill", "food",
    "lunch", "dinner", "breakfast", "meal", "shawarma", "falafel",
    "مطعم", "كافيه", "قهوة", "مخبز", "وجبة", "أكل", "طعام",
    "noon food", "hungerstation", "jahez", "toyor",
  ],
  Transport: [
    "uber", "careem", "taxi", "lyft", "gas", "petrol", "fuel", "aramco",
    "salik", "parking", "metro", "bus", "train", "airline", "saudia",
    "flynas", "flyadeal", "riyadh airport", "jeddah airport",
    "سيارة", "تاكسي", "وقود", "محطة", "طيران", "مطار",
  ],
  Shopping: [
    "amazon", "noon", "namshi", "sivvi", "shein", "h&m", "zara",
    "aldo", "nike", "adidas", "puma", "apple store", "samsung",
    "extra", "jarir", "lulu", "carrefour", "hyper", "mall",
    "ikea", "danube", "tamimi", "bin dawood",
    "تسوق", "متجر", "محل", "بوتيك",
  ],
  Bills: [
    "stc", "mobily", "zain", "electricity", "water", "sec", "sewage",
    "dewa", "kahramaa", "internet", "broadband", "subscription",
    "netflix", "spotify", "apple", "google play", "microsoft",
    "insurance", "bank charge", "fee", "annual",
    "فاتورة", "اشتراك", "كهرباء", "مياه", "اتصالات",
  ],
  Health: [
    "pharmacy", "hospital", "clinic", "doctor", "medical",
    "dentist", "vision", "lab", "nahdi", "al dawaa", "binzagr",
    "chemist", "health",
    "صيدلية", "مستشفى", "عيادة", "طبيب", "دواء",
  ],
  Entertainment: [
    "cinema", "vox", "muvi", "imax", "reel", "bowl", "game",
    "playstation", "xbox", "steam", "netflix", "spotify", "anghami",
    "shahid", "sports", "gym", "fitness",
    "سينما", "ترفيه", "ألعاب", "رياضة",
  ],
  Education: [
    "university", "college", "school", "tuition", "course", "udemy",
    "coursera", "book", "stationary",
    "جامعة", "مدرسة", "تعليم", "كتاب",
  ],
  Misc: [],
};

/**
 * Given a merchant name and optional raw SMS text,
 * returns the best matching category or "Misc" as fallback.
 */
export function mapCategory(merchant: string, rawText?: string): Category {
  const combined = `${merchant} ${rawText ?? ""}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "Misc") continue;
    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return category as Category;
      }
    }
  }

  return "Misc";
}

export function getCategoryIcon(category: Category): string {
  const icons: Record<Category, string> = {
    Food: "fast-food-outline",
    Transport: "car-outline",
    Shopping: "bag-outline",
    Bills: "receipt-outline",
    Health: "medkit-outline",
    Entertainment: "game-controller-outline",
    Education: "school-outline",
    Misc: "ellipsis-horizontal-outline",
  };
  return icons[category] ?? "ellipsis-horizontal-outline";
}
