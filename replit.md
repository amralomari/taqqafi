# Taqqafi — Privacy-First SMS Expense Tracker

## App Overview
A production-ready Expo React Native app that automatically detects financial transactions from SMS messages (Saudi & MENA banks), parses them locally, requires explicit approval, categorizes them, and tracks them against monthly budgets.

## Architecture

### Tech Stack
- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **State**: React Context + AsyncStorage (fully offline-first)
- **UI**: Light/dark theme (persisted), DM Sans fonts, Expo linear gradient, Reanimated
- **Icons**: @expo/vector-icons (Ionicons)
- **Backend**: Express.js (serves landing page + static Expo build)
- **GitHub**: Octokit integration via Replit connector — repo at github.com/amralomari/taqqafi

### Key Principles
- **100% local SMS parsing** — no raw SMS data ever leaves the device
- **Explicit approval flow** — every detected transaction enters Pending before any budget impact
- **SHA-256 deduplication** — same SMS never processed twice
- **Offline-first** — all data in AsyncStorage, works with no connection

## Folder Structure

```
lib/
  smsParser.ts       — Regex engine: SAR/SR/ر.س, Arabic/English, SHA-256 hash
  categoryMapper.ts  — Keyword-based merchant→category mapping
  featureGate.ts     — FREE/PRO plan gates (billing-ready)
  storage.ts         — AsyncStorage CRUD for Pending, Transactions, Budgets
  currencies.ts      — 20 currencies (SAR, USD, EUR, GBP, TRY + 15 MENA)
  currencyRates.ts   — Offline exchange rates, convertAmount() helper
  exportExcel.ts     — CSV export via expo-file-system + expo-sharing (PRO-gated)
  backup.ts          — AES-encrypted backup/restore with merge/replace modes

context/
  AppContext.tsx     — Single shared state: transactions, pending, budgets, plan, currency
  ThemeContext.tsx   — Light/dark theme with AsyncStorage persistence

constants/
  colors.ts         — DarkColors + LightColors palettes, ThemeColors type

components/
  CategoryBadge.tsx  — Pill badge with category color + icon
  TransactionCard.tsx — Approved transaction row with animation
  BudgetCard.tsx      — Budget progress card with bar
  SmsSimulator.tsx    — Demo panel firing realistic Saudi bank SMS messages

app/(tabs)/
  index.tsx          — Dashboard: hero spend card, stats, alerts, recent transactions, theme toggle
  pending.tsx        — Pending approval queue with Approve / Edit / Dismiss
  budgets.tsx        — Monthly budget management

app/
  add-expense.tsx    — Manual expense entry (FAB on dashboard)
  edit/[id].tsx      — Edit/approve pending or edit approved + currency conversion
  budget-form.tsx    — Add new monthly budget with category + limit
  settings.tsx       — Settings: encrypted backup/restore, theme, plan, about
  _layout.tsx        — Root layout: fonts, providers, StatusBar, theme-aware headers

server/
  github.ts          — GitHub Octokit client via Replit integration
```

## Theme System
- **ThemeContext** stores "dark" | "light" in AsyncStorage key `@taqqafi_theme`
- All screens/components use `useTheme().colors` — no static Colors imports
- Toggle button (sun/moon icon) in Dashboard header
- Dark: #070B14 bg, #00D4A8 accent | Light: #F8FAFC bg, #009B7D accent

## Multi-Currency Support
- 20 currencies: SAR, AED, BHD, KWD, OMR, QAR, EGP, JOD, LBP, IQD, SDG, LYD, TND, MAD, DZD, USD, EUR, GBP, TRY, SYP
- Currency picker modal on Dashboard
- Currency conversion in edit screen with offline rates

## SMS Policy
- **No historical SMS scanning** — only incoming broadcast events
- In Expo Go (demo): SmsSimulator fires realistic Saudi bank SMS strings for full testing
- On real Android device: wire `SmsReceiver` BroadcastReceiver → call `processSmsMessage()`

## Encrypted Backup & Restore
- **lib/backup.ts** — AES-256 encryption via crypto-js, export/import via expo-file-system + expo-sharing + expo-document-picker
- **app/settings.tsx** — Settings screen with backup/restore UI, theme toggle, plan toggle, data summary, about section
- Backup creates `.taqqafi` encrypted file; user saves to Google Drive, iCloud, etc.
- Restore supports **merge** (add new items) or **replace** (overwrite all)
- Password minimum 4 characters; wrong password shows clear error

## Feature Gates (FREE vs PRO)
- FREE: max 3 budgets, no export
- PRO: unlimited budgets, CSV export

## Category System
Food, Transport, Shopping, Bills, Health, Entertainment, Education, Misc
Each mapped from 40+ merchant keywords in Arabic and English.

## Development
- Frontend: port 8081 (Expo Metro)
- Backend: port 5000 (Express)
- Fonts: DM Sans (400, 500, 600, 700)
- GitHub repo: https://github.com/amralomari/taqqafi
