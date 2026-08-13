# Giver

Check who you give the most. Upload **CSV** wallet/bank statements (one or many) to rank recipients, nets, and spend suggestions.

**Supported format:** CSV (`.csv`) only for now.

## How unstructured CSVs are handled

1. **Local first** — detect columns (`date`, `amount`, `debit`/`credit`, `type`, `recipient`, `narration`, …) and map into Giver’s `Transaction[]`.
2. **If the layout doesn’t match** (unknown headers, mostly undated/unknown direction, low row yield) → **Gemini Flash** rewrites the CSV into that same shape.
3. **Large CSVs** are sent to Gemini in **chunks** (~120 rows) and merged/deduped.
4. Multiple CSVs can be uploaded and merged in one session.

## Privacy

Known layouts stay in the browser. Unfamiliar CSVs are sent briefly to Gemini to extract rows, then discarded. Your ranked ledger stays in the session.

## Setup

```bash
cp .env.example .env.local
# set GEMINI_API_KEY=...
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose a `.csv` file.
