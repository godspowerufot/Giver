# Giver

Check who you give the most. Upload a CSV or Excel wallet statement to rank recipients, see who sends you money, net balances, and spend-down suggestions.

**Privacy:** Your statement is parsed entirely in the browser. Files are not uploaded or saved to any server.

## Stack

- Next.js (App Router)
- Tailwind CSS
- React Context API
- `exceljs` + `papaparse` (client-side parse)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose a `.csv` / `.xlsx` file.

## Architecture

```
src/
  app/                 # routes + global styles
  components/
    layout/            # shell, header
    upload/            # dropzone
    dashboard/         # metrics, rankings, tables
    ui/                # buttons, panels
  context/             # LedgerProvider + state
  hooks/               # useLedger
  lib/
    parse/             # column detection, money, counterparties
    analytics/         # aggregates + recommendations
    types.ts
    format.ts
```

## Direction detection

The parser auto-detects:

1. Debit / Credit columns (OPay-style statements)
2. Signed amounts (negative = out)
3. A type/direction column (`sent` / `received`, `debit` / `credit`)
