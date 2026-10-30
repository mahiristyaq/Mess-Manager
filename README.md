# Mess Manager Premium (মেস ম্যানেজার)

A modern, responsive React + TypeScript application for managing bachelor mess and shared living expenses, daily meals, grocery deposits, and monthly financial settlements.

## Features

- **Mess Portal & Multi-Mess Switcher**: Login with a Mess Code (e.g. `mess123`) or create a new mess; local registry caches known messes for 1-tap switching.
- **Meal Counter**: Daily calendar meal tracking with +/- buttons and quick 1-click presets (`সবার ০`, `সবার ১`, `সবার ২`).
- **Market & Expense Tracking**: Record grocery expenses and deposits with payer / member attribution. Supports automatic pool deduction (`জমা থেকে সমন্বয়`) vs personal out-of-pocket tracking.
- **Meal Rate & Summary Dashboard**: Live computation of meal rate (`মোট বাজার ÷ মোট মিল`), member balances, cash left in pool, and recent transactions.
- **Final Settlement & Report**: Full balance breakdown (`পাবে / দেবে`), CSV export, and JSON database backup/restore.
- **Admin Lock & Member Management**: SHA-256 hashed admin PIN protection for settings, member renaming with historical cascading, and direct adjustments.
- **Cloud Sync**: Firebase Firestore REST sync with offline local caching and fallback.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS
- Lucide React Icons
- Firebase Firestore REST integration
