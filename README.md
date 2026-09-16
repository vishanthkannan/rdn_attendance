# RDN CREATORS - Workers Weekly Attendance & Payroll System

A production web application built for **RDN CREATORS** to track and manage weekly attendance, daily advances (borrowed amounts), and payroll calculations for civil construction workers.

## Key Features

- **Weekly Roster Management**:
  - Employee group structure with Mason leads and associated roles (Mason, M-Helper, F-Helper).
  - Customizable wage rates per worker role.
  - Quick whole-week fill and granular cell-level attendance & advance editing.
- **Financial & Attendance Calculations**:
  - Daily advances tracking (`₹` borrowed).
  - Dynamic total work units calculation.
  - Automatic balance-to-be-paid computation (`Total Amount - Advances`).
  - Stat summary cards displaying active weekly totals.
- **Week Locking & Navigation**:
  - Week closure feature to lock completed weeks against accidental edits.
  - Quick week navigation with recent weeks shortcuts.
- **Export & Reporting**:
  - Professional PDF export (Weekly Landscape & Monthly Summary) with proper currency formatting.
  - CSV export with UTF-8 BOM encoding for seamless Microsoft Excel compatibility.
- **Cloud & Local Storage**:
  - Supabase PostgreSQL integration for real-time cloud data synchronization.
  - LocalStorage fallback ensuring full functionality in offline / local mode.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Database Setup
Run the SQL script in `supabase_schema.sql` inside your Supabase project's SQL Editor (SQL Editor -> New Query -> Run) to create the tables, security policies, and enable **instant Realtime live sync** across all devices:
- `worker_groups`
- `workers`
- `daily_attendance`
- `closed_weeks`

Once run, any changes made on one phone or computer will appear automatically on all other open devices in under a second without refreshing.

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```
