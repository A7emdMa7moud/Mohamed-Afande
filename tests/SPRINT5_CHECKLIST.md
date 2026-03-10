# Sprint 5 – Final Backend Testing Checklist

## Prerequisites
- Server running: `npm run dev`
- MongoDB connected
- Register/Login to get JWT token

---

## Part 1 — Database Consistency Test

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| 1.1 | Create Category | `POST /api/categories` | 201, returns `_id`, `name` |
| 1.2 | Create Model | `POST /api/models` | 201, returns `_id`, `name` |
| 1.3 | Create Product | `POST /api/products` | 201, product has `category` and `model` refs |

**Verify:** Product is linked to category and model (check populated response).

---

## Part 2 — Stock System Test

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| 2.1 | Add Stock | `POST /api/stock` | quantity increases, 201 |
| 2.2 | — | `GET /api/stock` | StockMovement recorded |
| 2.3 | Adjustment | `POST /api/stock` with `type: "adjustment"` | Stock updated correctly |

**Body example (purchase):**
```json
{ "product": "productId", "type": "purchase", "quantity": 20, "note": "New shipment" }
```

---

## Part 3 — Sales Flow Test

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| 3.1 | Create Invoice | `POST /api/invoices` | Stock decreased, profit calculated, 201 |
| 3.2 | — | `GET /api/invoices/:id` | Invoice saved with items |

**Body example:**
```json
{
  "customerName": "Test Customer",
  "items": [{ "product": "productId", "quantity": 2, "price": 150, "wholesalePrice": 100 }],
  "notes": "Test"
}
```

---

## Part 4 — Reports Accuracy Test

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| 4.1 | Monthly Sales | `GET /api/reports/month/2026/3` | totalSales, totalProfit, totalInvoices |
| 4.2 | Top Products | `GET /api/reports/top-products` | Array with productName, model, totalSold |
| 4.3 | Sales by Model | `GET /api/reports/model-sales` | Array with model, totalSales |

---

## Part 5 — Dashboard Test

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| 5.1 | Summary | `GET /api/dashboard/summary` | totalProducts, totalStock, lowStockProducts, totalSales, totalProfit |

---

## Part 6 — Pagination & Filtering

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| 6.1 | Pagination | `GET /api/products?page=1&limit=10` | data + pagination object |
| 6.2 | Filter category | `GET /api/products?category=id` | Filtered by category |
| 6.3 | Filter model | `GET /api/products?model=id` | Filtered by model |
| 6.4 | Low stock | `GET /api/products?lowStock=true` | quantity <= 5 |

---

## Part 7 — Security Test

| # | Action | Expected |
|---|--------|----------|
| 7.1 | `GET /api/products` without token | 401 Unauthorized |
| 7.2 | `GET /api/products` with Bearer token | 200 OK |

---

## Part 8 — Error Handling

| # | Action | Expected |
|---|--------|----------|
| 8.1 | `GET /api/products/123` (invalid ID) | 400, `{ "success": false, "error": "..." }` |

---

## Run Automated Tests

```bash
npm install
npm run test:e2e
```

Or run all tests:
```bash
npm test
```
