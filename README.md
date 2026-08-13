# Giver

**Who you dey dash pass? Who dey dash you pass?**

Upload an **Excel** or **CSV** OPay/bank statement to rank who you give the most — and who gives you the most.

## How files are handled

1. **OPay / known wallet spreadsheet** — local parse in the browser.
2. **Other bank layouts** — structured into Giver’s format (progress overlay while you wait).
3. Share Pidgin celebration / thank-you cards via link.

Accepted: `.xlsx`, `.xls`, `.csv`. PDF not supported.

## Setup

```bash
cp .env.example .env.local
# OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-4o
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
