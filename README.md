# Audit Intelligence Platform — POC

An internal audit support tool for financial statement analysis, risk detection, and group consolidation. Built as a proof of concept for audit practice.

## Capabilities

| Feature | Description |
|---|---|
| Single-entity upload | Upload one Excel ledger; get financial statements, balance sheet, P&L |
| Group consolidation | Upload parent + subsidiaries + COA mapping; platform auto-detects entity codes, remaps accounts, and merges JEs |
| Audit findings | 150+ rule-based detections ranked by severity (High / Medium / Low) |
| Audit workpapers | Six structured workpaper areas auto-generated with objectives, procedures, and linked findings |
| Account Explorer | Per-account entity breakdown showing which subsidiary contributed what share of debit/credit, with full JE drill-down |

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, pandas, openpyxl — managed with `uv`
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- Node.js 18+ and npm

## Quick Start

Run both backend and frontend with a single command from the repo root:

```bash
python start.py
```

Then open [http://localhost:3000](http://localhost:3000).

## Manual Start

**Backend** (port 8002):
```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

**Frontend** (port 3000):
```bash
cd frontend
npm install
npm run dev
```

## Sample Data

Four Excel files are included in the repo root for testing:

| File | Description |
|---|---|
| `nusantara_holding.xlsx` | Parent company ledger |
| `nusantara_infra.xlsx` | Subsidiary — Nusantara Infrastructure |
| `nusantara_digit.xlsx` | Subsidiary — Nusantara Digital |
| `nusantara_coa_mapping.xlsx` | COA mapping file (Entity_Code → Parent_Account_No) |

**Single-entity flow**: Upload `nusantara_holding.xlsx` via the home page.

**Group consolidation flow**: Upload all four files via "Group Consolidation" on the home page. Entity codes (HOLDING, INFRA, DIGIT) are auto-detected from filenames.
