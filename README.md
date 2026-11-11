# 🍽️ Mess Manager (মেস ম্যানেজার)

A fast, offline-capable Progressive Web Application (PWA) built with **React 19, TypeScript, Tailwind CSS, and Firebase Firestore** for managing shared living expenses, daily meal tracking, market expenses, and monthly financial settlements.

---

## ✨ Key Features

- **📊 Live Dashboard & Auto Current Month**: Always opens on the current calendar month (`YYYY-MM`) by default, displaying live Meal Rate (`মোট বাজার খরচ ÷ মোট মিল`), Total Market Expenses, Total Meals, Active Members, and individual Receivable/Payable (`পাবে / দেবে`) balances.
- **🍛 Smart Daily Meal Tracker**: Track daily meals per member with `+` / `-` steppers, `+০.৫` half-meal toggles, and 1-tap presets (`সবার ০`, `সবার ১`, `সবার ২`).
- **🛍️ Market Expense Ledger**: Add, edit, filter by member, and export monthly market expenses to CSV. Includes automatic local draft recovery if the modal closes unexpectedly.
- **📑 Final Settlement Report (চূড়ান্ত হিসাব)**: Switch between a mobile-fitted **Full Table View** (zero horizontal scroll cutoff) and **Detailed Card View**. Export reports to CSV or download/restore full JSON backups.
- **👥 Historical-Safe Member Management**:
  - **Add Member**: Automatically tags new members with `joinedMonth` so past months' member counts and fixed-cost shares remain 100% untouched.
  - **Remove Member**: Supports scheduling a member's departure starting next month (`leftMonth`) so current and past month sheets stay intact.
- **🔐 Enhanced Security & Manager Lock**:
  - **SHA-256 PIN Hashing** with **Brute-Force Lockout Protection** (30s cooldown after 5 failed attempts).
  - **Auto Month Locking**: Past months lock automatically after the 5th of the new month for regular members unless unlocked by the Manager.
  - **Hardened Firestore Rules**: Anti-enumeration (`allow get` only, `allow list: if false`) and strict schema/size validation.
- **🌐 Bilingual & Multi-Currency**: Instant switching between **বাংলা (Bangla)** and **English**, plus support for **9 currencies** (`BDT ৳`, `USD $`, `EUR €`, `GBP £`, `INR ₹`, `SAR ﷼`, `AED د.إ`, `CAD C$`, `MYR RM`).
- **📲 Installable PWA & Offline-First Sync**: Works seamlessly offline with IndexedDB/LocalStorage persistence and syncs automatically in real time when back online.

---

## 🗂️ Project Structure

```text
Mess-Manager/
├── public/                     # Static PWA icons, manifest.json & favicon
├── src/
│   ├── components/
│   │   ├── modals/
│   │   │   ├── AdminGateModal.tsx    # Manager PIN setup, unlock & brute-force lockout
│   │   │   ├── AuthModal.tsx         # Mess login, creation & saved mess switcher
│   │   │   ├── ConfirmModal.tsx      # Confirmation dialog for destructive actions
│   │   │   ├── EntryModal.tsx        # Add/Edit market expense with draft auto-save
│   │   │   ├── ReportEditModal.tsx   # Manager direct adjustment for final report
│   │   │   └── SettingsModal.tsx     # Full manager settings & member management
│   │   ├── tabs/
│   │   │   ├── HomeTab.tsx           # Dashboard overview, meal rate & balances
│   │   │   ├── MealsTab.tsx          # Date navigator & daily meal counter
│   │   │   ├── MarketTab.tsx         # Monthly market ledger, filter & CSV export
│   │   │   └── ReportTab.tsx         # Final settlement table/cards & JSON backup
│   │   ├── Header.tsx                # Top bar, month selector & sync status badge
│   │   ├── Navbar.tsx                # Bottom navigation bar
│   │   ├── PWAInstallButton.tsx      # Android/Desktop install & iOS guide
│   │   ├── QuickSettingsDrawer.tsx   # Slide-over drawer for theme, language & account
│   │   ├── Toast.tsx                 # Non-intrusive toast notifications
│   │   └── TransactionItem.tsx       # Individual expense row component
│   ├── context/
│   │   ├── LanguageContext.tsx       # Bilingual (BN/EN) & currency formatting context
│   │   ├── MessContext.tsx           # Core state, calculations & cloud sync engine
│   │   └── ThemeContext.tsx          # Dark / Light / System theme manager
│   ├── hooks/
│   │   └── usePWAInstall.ts          # Service worker & install prompt hook
│   ├── services/
│   │   └── firebaseSync.ts           # Firestore SDK + REST fallback & atomic summaries
│   ├── utils/
│   │   ├── helpers.ts                # Pure calculation, date & formatting utilities
│   │   └── translations.ts           # Full Bangla & English dictionary
│   ├── App.tsx                       # Root layout & modal scroll-lock coordinator
│   ├── index.css                     # Tailwind directives & theme design tokens
│   ├── main.tsx                      # React DOM entry point
│   └── types.ts                      # TypeScript interfaces
├── firestore.rules             # Production Firestore security rules
├── package.json                # Dependencies & build scripts
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite + PWA bundler configuration
```

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/mahiristyaq/Mess-Manager.git
cd Mess-Manager
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 4. Build for production
```bash
npm run build
```

