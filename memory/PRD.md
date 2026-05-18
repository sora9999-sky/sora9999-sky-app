# Avicenna Pharmacy Management App — PRD

## Original Problem Statement
Generate a full pharmacy management app with a cashier page and a storage page. The cashier can scan by barcode or add by search. Items can be added to storage manually or by scanning a new barcode. Each storage item has: name, barcode (optional), buying price, selling price, supplier, type, stock. Currency is IQD. Pharmacy-friendly colors, simple yet amazing UI. Bill items must have (-) and (+) buttons.

## User Choices
- No login (single shared app)
- Both webcam camera scanner + manual / USB barcode input
- Sale summary on screen (no PDF)
- Stock quantity tracking enabled (auto-decrement on sale)
- "Type" field is free text

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Pydantic models. `/api` prefixed routes.
- **Frontend**: React (Vite/CRA), React Router, shadcn/ui, Tailwind, lucide-react, sonner toasts. html5-qrcode (CDN) for camera scanning.
- **Currency**: IQD, no decimals, locale comma-grouped.

## Implemented Features (initial release — 2026-02-18)
- Seed: 12 realistic pharmacy items on first startup.
- Items API: list/search, get-by-barcode, get-by-id, create (unique barcode), update, delete.
- Sales API: checkout endpoint validates stock and atomically decrements `stock_qty`; returns sale receipt.
- Cashier page (`/cashier`):
  - Auto-focused barcode input (USB scanner friendly, Enter submits).
  - Camera scan toggle (html5-qrcode).
  - Live search of items.
  - Item grid with type, price, stock pill (green / amber low-stock pulse / red out).
  - Cart sidebar with per-line (-) / (+) circular buttons, qty, subtotal, remove icon.
  - Total in IQD. Checkout opens a receipt summary dialog.
- Storage page (`/storage`):
  - Stat cards (total items, inventory cost value, low-stock count).
  - Searchable table with edit/delete actions and stock pills.
  - Add/Edit dialog with form (name, type, prices, supplier, stock, optional barcode + camera scan).
  - Delete confirmation dialog.
- Navigation header with brand and active link styling.
- Design: Outfit + Nunito fonts, emerald + indigo accents, rounded-2xl cards, soft shadows.
- All interactive elements have `data-testid`.

## Backlog / Next
**P1**
- Loading skeleton on Cashier items grid (avoid brief empty flash on first paint).
- Printable / shareable receipt (PDF or thermal print CSS).
- Sales history page with daily revenue + best sellers.

**P2**
- Authentication with cashier vs admin roles.
- Expiry-date tracking and "expiring soon" alerts.
- Multi-currency / VAT support.
- CSV import/export of inventory.
- Reorder suggestions based on sales velocity.

## Code-quality follow-ups (from testing review)
- Move `logger` definition above `seed_db()` (currently works but fragile).
- Migrate `@app.on_event("startup")` to FastAPI `lifespan`.
- `re.escape()` user input before `$regex` in `/api/items?search=`.
- Tighten CORS once auth/domains are decided.
