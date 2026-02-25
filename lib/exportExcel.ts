import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Transaction } from "./storage";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateCSV(transactions: Transaction[]): string {
  const headers = ["Date", "Merchant", "Category", "Amount", "Currency", "Type", "SMS Text"];
  const rows = transactions.map((tx) => [
    formatDate(tx.approvedAt),
    escapeCSV(tx.merchant),
    escapeCSV(tx.category),
    tx.amount.toFixed(2),
    tx.currency,
    tx.type,
    escapeCSV(tx.rawText),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function exportTransactionsCSV(transactions: Transaction[]): Promise<void> {
  const csv = generateCSV(transactions);
  const fileName = `taqqafi_export_${new Date().toISOString().slice(0, 10)}.csv`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Export Transactions",
      UTI: "public.comma-separated-values-text",
    });
  }
}
