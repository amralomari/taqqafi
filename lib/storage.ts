import AsyncStorage from "@react-native-async-storage/async-storage";
import { Category } from "./categoryMapper";

export type PendingTransaction = {
  id: string;
  hash: string;
  amount: number;
  currency: string;
  merchant: string;
  category: Category;
  type: "debit" | "credit";
  rawText: string;
  receivedAt: number;
  month: number;
  year: number;
};

export type Transaction = {
  id: string;
  hash: string;
  amount: number;
  currency: string;
  merchant: string;
  category: Category;
  type: "debit" | "credit";
  rawText: string;
  approvedAt: number;
  month: number;
  year: number;
};

export type Budget = {
  id: string;
  category: Category;
  monthlyLimit: number;
  month: number;
  year: number;
};

const KEYS = {
  pending: "@taqqafi_pending",
  transactions: "@taqqafi_transactions",
  budgets: "@taqqafi_budgets",
  processedHashes: "@taqqafi_hashes",
};

// ─── Pending Transactions ─────────────────────────────────────────────────────

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.pending);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addPendingTransaction(
  tx: PendingTransaction
): Promise<boolean> {
  const hashes = await getProcessedHashes();
  if (hashes.has(tx.hash)) return false;

  const existing = await getPendingTransactions();
  const updated = [tx, ...existing];
  await AsyncStorage.setItem(KEYS.pending, JSON.stringify(updated));
  return true;
}

export async function removePendingTransaction(id: string): Promise<void> {
  const existing = await getPendingTransactions();
  const updated = existing.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEYS.pending, JSON.stringify(updated));
}

export async function updatePendingTransaction(
  tx: PendingTransaction
): Promise<void> {
  const existing = await getPendingTransactions();
  const updated = existing.map((t) => (t.id === tx.id ? tx : t));
  await AsyncStorage.setItem(KEYS.pending, JSON.stringify(updated));
}

// ─── Approved Transactions ────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.transactions);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function approveTransaction(
  pending: PendingTransaction
): Promise<void> {
  const tx: Transaction = {
    id: pending.id,
    hash: pending.hash,
    amount: pending.amount,
    currency: pending.currency,
    merchant: pending.merchant,
    category: pending.category,
    type: pending.type,
    rawText: pending.rawText,
    approvedAt: Date.now(),
    month: pending.month,
    year: pending.year,
  };

  const existing = await getTransactions();
  await AsyncStorage.setItem(
    KEYS.transactions,
    JSON.stringify([tx, ...existing])
  );
  await markHashProcessed(pending.hash);
  await removePendingTransaction(pending.id);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const existing = await getTransactions();
  const updated = existing.map((t) => (t.id === tx.id ? tx : t));
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(updated));
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const existing = await getTransactions();
  await AsyncStorage.setItem(
    KEYS.transactions,
    JSON.stringify([tx, ...existing])
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await getTransactions();
  const updated = existing.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(updated));
}

export async function getMonthlyTransactions(
  month: number,
  year: number
): Promise<Transaction[]> {
  const all = await getTransactions();
  return all.filter(
    (t) => t.month === month && t.year === year && t.type === "debit"
  );
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function getBudgets(): Promise<Budget[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.budgets);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBudget(budget: Budget): Promise<void> {
  const existing = await getBudgets();
  const idx = existing.findIndex((b) => b.id === budget.id);
  const updated =
    idx >= 0
      ? existing.map((b) => (b.id === budget.id ? budget : b))
      : [...existing, budget];
  await AsyncStorage.setItem(KEYS.budgets, JSON.stringify(updated));
}

export async function deleteBudget(id: string): Promise<void> {
  const existing = await getBudgets();
  const updated = existing.filter((b) => b.id !== id);
  await AsyncStorage.setItem(KEYS.budgets, JSON.stringify(updated));
}

export async function getMonthlyBudgets(
  month: number,
  year: number
): Promise<Budget[]> {
  const all = await getBudgets();
  return all.filter((b) => b.month === month && b.year === year);
}

// ─── Hash Deduplication ───────────────────────────────────────────────────────

async function getProcessedHashes(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.processedHashes);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function markHashProcessed(hash: string): Promise<void> {
  const hashes = await getProcessedHashes();
  hashes.add(hash);
  await AsyncStorage.setItem(
    KEYS.processedHashes,
    JSON.stringify([...hashes])
  );
}

export async function isHashProcessed(hash: string): Promise<boolean> {
  const hashes = await getProcessedHashes();
  return hashes.has(hash);
}

// ─── Budget Calculations (approved transactions only) ─────────────────────────

export type BudgetSummary = {
  budget: Budget;
  spent: number;
  remaining: number;
  percent: number;
  isOverBudget: boolean;
};

export async function getBudgetSummaries(
  month: number,
  year: number
): Promise<BudgetSummary[]> {
  const [budgets, transactions] = await Promise.all([
    getMonthlyBudgets(month, year),
    getMonthlyTransactions(month, year),
  ]);

  return budgets.map((budget) => {
    const spent = transactions
      .filter((t) => t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = Math.max(0, budget.monthlyLimit - spent);
    const percent = Math.min(1, spent / budget.monthlyLimit);
    const isOverBudget = spent > budget.monthlyLimit;

    return { budget, spent, remaining, percent, isOverBudget };
  });
}
