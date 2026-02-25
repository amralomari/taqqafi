import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import {
  PendingTransaction,
  Transaction,
  Budget,
  BudgetSummary,
  getPendingTransactions,
  getTransactions,
  getMonthlyBudgets,
  getBudgetSummaries,
  addPendingTransaction,
  approveTransaction,
  removePendingTransaction,
  updatePendingTransaction,
  updateTransaction,
  deleteTransaction,
  addTransaction,
  saveBudget,
  deleteBudget,
} from "@/lib/storage";
import { parseSms } from "@/lib/smsParser";
import { mapCategory, Category } from "@/lib/categoryMapper";
import { getCurrentPlan, Plan } from "@/lib/featureGate";
import { CurrencyCode, getCurrencyByCode } from "@/lib/currencies";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENCY_KEY = "@taqqafi_currency";

interface AppContextValue {
  plan: Plan;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => Promise<void>;
  currencyLabel: string;

  pendingTransactions: PendingTransaction[];
  transactions: Transaction[];
  budgets: Budget[];
  budgetSummaries: BudgetSummary[];

  currentMonth: number;
  currentYear: number;
  totalSpentThisMonth: number;
  totalBudgetThisMonth: number;

  isLoading: boolean;
  smsPermissionGranted: boolean | null;

  refresh: () => Promise<void>;
  requestSmsPermission: () => Promise<boolean>;

  processSmsMessage: (smsBody: string, sender: string) => Promise<boolean>;
  approvePending: (pending: PendingTransaction) => Promise<void>;
  dismissPending: (id: string) => Promise<void>;
  editPendingAndApprove: (pending: PendingTransaction) => Promise<void>;
  updateApprovedTransaction: (tx: Transaction) => Promise<void>;
  deleteApprovedTransaction: (id: string) => Promise<void>;
  addManualTransaction: (
    amount: number,
    merchant: string,
    category: Category,
    date: Date
  ) => Promise<void>;

  addBudget: (
    category: Category,
    monthlyLimit: number,
    month: number,
    year: number
  ) => Promise<void>;
  editBudget: (budget: Budget) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [currentMonth] = useState(now.getMonth() + 1);
  const [currentYear] = useState(now.getFullYear());

  const [plan, setPlanState] = useState<Plan>("FREE");
  const [currency, setCurrencyState] = useState<CurrencyCode>("SAR");
  const [pendingTransactions, setPending] = useState<PendingTransaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [smsPermissionGranted, setSmsPermissionGranted] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, t, b, bs, currentPlan, storedCurrency] = await Promise.all([
        getPendingTransactions(),
        getTransactions(),
        getMonthlyBudgets(currentMonth, currentYear),
        getBudgetSummaries(currentMonth, currentYear),
        getCurrentPlan(),
        AsyncStorage.getItem(CURRENCY_KEY),
      ]);
      setPending(p);
      setTransactions(t);
      setBudgets(b);
      setBudgetSummaries(bs);
      setPlanState(currentPlan);
      if (storedCurrency) setCurrencyState(storedCurrency as CurrencyCode);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    let subscription: { remove: () => void } | null = null;

    (async () => {
      try {
        const SmsListener = await import("@/modules/sms-listener");
        const hasPermission = await SmsListener.checkSmsPermission();
        setSmsPermissionGranted(hasPermission);

        if (hasPermission) {
          subscription = SmsListener.addSmsListener((event) => {
            processSmsMessageRef.current(event.body, event.originatingAddress);
          });
        }
      } catch {
        setSmsPermissionGranted(null);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  const processSmsMessageFn = useCallback(
    async (smsBody: string, sender: string): Promise<boolean> => {
      const parsed = await parseSms(smsBody);
      if (!parsed) return false;
      if (parsed.type !== "debit") return false;

      const category = mapCategory(parsed.merchant, parsed.rawText);
      const id = Crypto.randomUUID();

      const pending: PendingTransaction = {
        id,
        hash: parsed.hash,
        amount: parsed.amount,
        currency: parsed.currency,
        merchant: parsed.merchant,
        category,
        type: parsed.type,
        rawText: parsed.rawText,
        receivedAt: Date.now(),
        month: currentMonth,
        year: currentYear,
      };

      const added = await addPendingTransaction(pending);
      if (added) {
        await refresh();
      }
      return added;
    },
    [currentMonth, currentYear, refresh]
  );

  const processSmsMessageRef = React.useRef(processSmsMessageFn);
  useEffect(() => {
    processSmsMessageRef.current = processSmsMessageFn;
  }, [processSmsMessageFn]);

  const requestSmsPermissionFn = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") return false;
    try {
      const SmsListener = await import("@/modules/sms-listener");
      const granted = await SmsListener.requestSmsPermission();
      setSmsPermissionGranted(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  const approvePending = useCallback(
    async (pending: PendingTransaction) => {
      await approveTransaction(pending);
      await refresh();
    },
    [refresh]
  );

  const dismissPending = useCallback(
    async (id: string) => {
      await removePendingTransaction(id);
      await refresh();
    },
    [refresh]
  );

  const editPendingAndApprove = useCallback(
    async (pending: PendingTransaction) => {
      await updatePendingTransaction(pending);
      await approveTransaction(pending);
      await refresh();
    },
    [refresh]
  );

  const updateApprovedTransaction = useCallback(
    async (tx: Transaction) => {
      await updateTransaction(tx);
      await refresh();
    },
    [refresh]
  );

  const deleteApprovedTransaction = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
      await refresh();
    },
    [refresh]
  );

  const addManualTransaction = useCallback(
    async (
      amount: number,
      merchant: string,
      category: Category,
      date: Date
    ) => {
      const id = Crypto.randomUUID();
      const tx: Transaction = {
        id,
        hash: `manual_${id}`,
        amount,
        currency,
        merchant,
        category,
        type: "debit",
        rawText: "Manual entry",
        approvedAt: date.getTime(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
      await addTransaction(tx);
      await refresh();
    },
    [currency, refresh]
  );

  const addBudget = useCallback(
    async (
      category: Category,
      monthlyLimit: number,
      month: number,
      year: number
    ) => {
      const id = Crypto.randomUUID();
      await saveBudget({ id, category, monthlyLimit, month, year });
      await refresh();
    },
    [refresh]
  );

  const editBudget = useCallback(
    async (budget: Budget) => {
      await saveBudget(budget);
      await refresh();
    },
    [refresh]
  );

  const removeBudget = useCallback(
    async (id: string) => {
      await deleteBudget(id);
      await refresh();
    },
    [refresh]
  );

  const setCurrencyFn = useCallback(async (code: CurrencyCode) => {
    await AsyncStorage.setItem(CURRENCY_KEY, code);
    setCurrencyState(code);
  }, []);

  const currencyLabel = getCurrencyByCode(currency).code;

  const totalSpentThisMonth = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.month === currentMonth &&
            t.year === currentYear &&
            t.type === "debit"
        )
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, currentMonth, currentYear]
  );

  const totalBudgetThisMonth = useMemo(
    () => budgets.reduce((sum, b) => sum + b.monthlyLimit, 0),
    [budgets]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      plan,
      currency,
      setCurrency: setCurrencyFn,
      currencyLabel,
      pendingTransactions,
      transactions,
      budgets,
      budgetSummaries,
      currentMonth,
      currentYear,
      totalSpentThisMonth,
      totalBudgetThisMonth,
      isLoading,
      smsPermissionGranted,
      refresh,
      requestSmsPermission: requestSmsPermissionFn,
      processSmsMessage: processSmsMessageFn,
      approvePending,
      dismissPending,
      editPendingAndApprove,
      updateApprovedTransaction,
      deleteApprovedTransaction,
      addManualTransaction,
      addBudget,
      editBudget,
      removeBudget,
    }),
    [
      plan,
      currency,
      setCurrencyFn,
      currencyLabel,
      pendingTransactions,
      transactions,
      budgets,
      budgetSummaries,
      currentMonth,
      currentYear,
      totalSpentThisMonth,
      totalBudgetThisMonth,
      isLoading,
      smsPermissionGranted,
      refresh,
      requestSmsPermissionFn,
      processSmsMessageFn,
      approvePending,
      dismissPending,
      editPendingAndApprove,
      updateApprovedTransaction,
      deleteApprovedTransaction,
      addManualTransaction,
      addBudget,
      editBudget,
      removeBudget,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
