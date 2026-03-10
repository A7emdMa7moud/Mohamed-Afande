# 🚀 Sprint 5.5 — Deploy Backend (Render)

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "inventory api"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-api.git
git push -u origin main
```

## Step 2 — Create Render Account

1. Go to [https://render.com](https://render.com)
2. **Sign up with GitHub** (connect automatically)

## Step 3 — Create Web Service

1. Click **New** → **Web Service**
2. **Connect repository** and select your project
3. Choose your GitHub repo

## Step 4 — Service Settings

| Field             | Value                        |
| ----------------- | ---------------------------- |
| **Name**          | `inventory-api`              |
| **Environment**   | `Node`                       |
| **Build Command** | `npm install`                |
| **Start Command** | `npm start`                  |
| **Region**        | Choose closest to your users |

## Step 5 — Environment Variables

Add these in Render Dashboard → Environment:

| Key           | Value                                     |
| ------------- | ----------------------------------------- |
| `MONGODB_URI` | Your MongoDB Atlas connection string      |
| `MONGO_URI`   | _(alternative)_ Same as MONGODB_URI       |
| `JWT_SECRET`  | A strong random secret for production     |
| `JWT_EXPIRE`  | `7d` (optional)                           |
| `NODE_ENV`    | `production` (optional, Render sets this) |

**MongoDB Atlas:** Get connection string from Atlas → Clusters → Connect → Connect your application.

## Step 6 — Deploy

1. Click **Create Web Service**
2. Render will: install dependencies → build → deploy
3. After 1–2 minutes you get a URL like: `https://inventory-api.onrender.com`

## Step 7 — Test the API

### Public base URL

```
https://inventory-api.onrender.com/api
```

### Test with Postman / Insomnia

1. **Register**
   - `POST https://inventory-api.onrender.com/api/auth/register`
   - Body: `{ "email": "admin@example.com", "password": "123456", "role": "admin" }`

2. **Login**
   - `POST https://inventory-api.onrender.com/api/auth/login`
   - Body: `{ "email": "admin@example.com", "password": "123456" }`
   - Copy the `token` from the response

3. **Get Products** (protected)
   - `GET https://inventory-api.onrender.com/api/products`
   - Header: `Authorization: Bearer YOUR_TOKEN`

## Step 8 — Postman Collection

Update `postman_collection.json` baseUrl to your Render URL:

```
https://inventory-api.onrender.com/api
```

## Step 9 — CORS

CORS is already enabled in `app.js`:

```javascript
app.use(cors());
```

The frontend can call the API from any domain.

---

## API Endpoints Overview

| Resource   | Base Path         | Methods                                              |
| ---------- | ----------------- | ---------------------------------------------------- |
| Auth       | `/api/auth`       | POST register, login                                 |
| Categories | `/api/categories` | GET, POST, PUT, DELETE                               |
| Models     | `/api/models`     | GET, POST, PUT, DELETE                               |
| Products   | `/api/products`   | GET, POST, PUT, DELETE, GET /low-stock               |
| Stock      | `/api/stock`      | GET, POST                                            |
| Invoices   | `/api/invoices`   | GET, POST, DELETE                                    |
| Reports    | `/api/reports`    | GET /month/:year/:month, /top-products, /model-sales |
| Dashboard  | `/api/dashboard`  | GET /summary                                         |

---

## Troubleshooting

- **Build fails:** Ensure `package.json` has correct `start` script
- **MongoDB connection error:** Check MONGODB_URI in Environment variables
- **401 Unauthorized:** Add `Authorization: Bearer <token>` header for protected routes
- **Cold start:** Free tier sleeps after inactivity; first request may take ~30s
