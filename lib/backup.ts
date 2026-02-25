import CryptoJS from "crypto-js";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PendingTransaction,
  Transaction,
  Budget,
  getPendingTransactions,
  getTransactions,
  getBudgets,
} from "./storage";

const BACKUP_VERSION = 1;
const FILE_EXTENSION = "taqqafi";

export type BackupData = {
  version: number;
  createdAt: number;
  transactions: Transaction[];
  pendingTransactions: PendingTransaction[];
  budgets: Budget[];
  processedHashes: string[];
  settings: {
    currency?: string;
    theme?: string;
    plan?: string;
  };
};

export type ImportMode = "replace" | "merge";

export async function collectBackupData(): Promise<BackupData> {
  const [transactions, pendingTransactions, budgets, hashesRaw, currency, theme, plan] =
    await Promise.all([
      getTransactions(),
      getPendingTransactions(),
      getBudgets(),
      AsyncStorage.getItem("@taqqafi_hashes"),
      AsyncStorage.getItem("@taqqafi_currency"),
      AsyncStorage.getItem("@taqqafi_theme"),
      AsyncStorage.getItem("@taqqafi_plan"),
    ]);

  const processedHashes: string[] = hashesRaw ? JSON.parse(hashesRaw) : [];

  return {
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    transactions,
    pendingTransactions,
    budgets,
    processedHashes,
    settings: {
      currency: currency ?? undefined,
      theme: theme ?? undefined,
      plan: plan ?? undefined,
    },
  };
}

export function encryptBackup(data: BackupData, password: string): string {
  const json = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(json, password).toString();
  return encrypted;
}

export function decryptBackup(encrypted: string, password: string): BackupData {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) {
    throw new Error("Wrong password or corrupted backup file.");
  }
  const data: BackupData = JSON.parse(decrypted);
  if (!data.version || !data.transactions) {
    throw new Error("Invalid backup format.");
  }
  return data;
}

export async function exportBackup(password: string): Promise<void> {
  const data = await collectBackupData();
  const encrypted = encryptBackup(data, password);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `taqqafi_backup_${dateStr}.${FILE_EXTENSION}`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, encrypted, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/octet-stream",
      dialogTitle: "Save Taqqafi Backup",
    });
  }
}

export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return content;
}

export async function restoreBackup(
  data: BackupData,
  mode: ImportMode
): Promise<{ transactions: number; budgets: number; pending: number }> {
  if (mode === "replace") {
    await AsyncStorage.setItem(
      "@taqqafi_transactions",
      JSON.stringify(data.transactions)
    );
    await AsyncStorage.setItem(
      "@taqqafi_pending",
      JSON.stringify(data.pendingTransactions)
    );
    await AsyncStorage.setItem(
      "@taqqafi_budgets",
      JSON.stringify(data.budgets)
    );
    await AsyncStorage.setItem(
      "@taqqafi_hashes",
      JSON.stringify(data.processedHashes)
    );

    if (data.settings.currency)
      await AsyncStorage.setItem("@taqqafi_currency", data.settings.currency);
    if (data.settings.theme)
      await AsyncStorage.setItem("@taqqafi_theme", data.settings.theme);
    if (data.settings.plan)
      await AsyncStorage.setItem("@taqqafi_plan", data.settings.plan);

    return {
      transactions: data.transactions.length,
      budgets: data.budgets.length,
      pending: data.pendingTransactions.length,
    };
  }

  const [existingTx, existingPending, existingBudgets, existingHashesRaw] =
    await Promise.all([
      getTransactions(),
      getPendingTransactions(),
      getBudgets(),
      AsyncStorage.getItem("@taqqafi_hashes"),
    ]);

  const existingTxIds = new Set(existingTx.map((t) => t.id));
  const newTx = data.transactions.filter((t) => !existingTxIds.has(t.id));
  const mergedTx = [...existingTx, ...newTx];

  const existingPendingIds = new Set(existingPending.map((t) => t.id));
  const newPending = data.pendingTransactions.filter(
    (t) => !existingPendingIds.has(t.id)
  );
  const mergedPending = [...existingPending, ...newPending];

  const existingBudgetIds = new Set(existingBudgets.map((b) => b.id));
  const newBudgets = data.budgets.filter((b) => !existingBudgetIds.has(b.id));
  const mergedBudgets = [...existingBudgets, ...newBudgets];

  const existingHashes: string[] = existingHashesRaw
    ? JSON.parse(existingHashesRaw)
    : [];
  const hashSet = new Set([...existingHashes, ...data.processedHashes]);

  await AsyncStorage.setItem("@taqqafi_transactions", JSON.stringify(mergedTx));
  await AsyncStorage.setItem("@taqqafi_pending", JSON.stringify(mergedPending));
  await AsyncStorage.setItem("@taqqafi_budgets", JSON.stringify(mergedBudgets));
  await AsyncStorage.setItem("@taqqafi_hashes", JSON.stringify([...hashSet]));

  return {
    transactions: newTx.length,
    budgets: newBudgets.length,
    pending: newPending.length,
  };
}

export function formatBackupDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
