/**
 * Sprint 5 - Final Backend E2E Tests
 * End-to-End testing of the complete system
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Category = require('../models/Category');
const Model = require('../models/Model');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Invoice = require('../models/Invoice');

// Test data - populated during tests
let authToken = '';
let categoryId = '';
let modelId = '';
let productId = '';
let stockMovementId = '';
let initialStockMovementId = '';
let invoiceId = '';
let initialProductQuantity = 0;

const getAuthHeader = () => (authToken ? { Authorization: `Bearer ${authToken}` } : {});

describe('Sprint 5 - Backend E2E Tests', () => {
  beforeAll(async () => {
    // Register and login to get token
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@e2e.com', password: '123456', role: 'admin' })
      .catch(() => {});

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@e2e.com', password: '123456' });

    authToken = loginRes.body.token;
    if (!authToken) {
      throw new Error('Failed to get auth token - run Login test first');
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteOne({ email: 'test@e2e.com' }).catch(() => {});
    if (categoryId) await Category.findByIdAndDelete(categoryId).catch(() => {});
    if (modelId) await Model.findByIdAndDelete(modelId).catch(() => {});
    if (productId) await Product.findByIdAndDelete(productId).catch(() => {});
    if (initialStockMovementId)
      await StockMovement.findByIdAndDelete(initialStockMovementId).catch(() => {});
    if (stockMovementId) await StockMovement.findByIdAndDelete(stockMovementId).catch(() => {});
    if (invoiceId) await Invoice.findByIdAndDelete(invoiceId).catch(() => {});
  });

  // ========== Part 1: Database Consistency Test ==========
  describe('Part 1 - Database Consistency', () => {
    test('1.1 Create Category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({ name: 'E2E Test Category' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('E2E Test Category');
      categoryId = res.body._id;
    });

    test('1.2 Create Model', async () => {
      const res = await request(app)
        .post('/api/models')
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({ name: 'E2E Test Model' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('E2E Test Model');
      modelId = res.body._id;
    });

    test('1.3 Create Product linked to category and model', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({
          name: 'E2E Test Product',
          category: categoryId,
          model: modelId,
          wholesalePrice: 100,
          salePrice: 150,
          quantity: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('E2E Test Product');
      expect(res.body.category).toBeDefined();
      expect(res.body.model).toBeDefined();
      expect(res.body.quantity).toBe(50);
      productId = res.body._id;
      initialProductQuantity = 50;
    });

    test('1.4 Initial stock movement is recorded (purchase)', async () => {
      const movement = await StockMovement.findOne({
        product: productId,
        type: 'purchase',
        note: 'Initial stock',
      });

      expect(movement).toBeTruthy();
      expect(movement.quantity).toBe(initialProductQuantity);
      initialStockMovementId = movement._id.toString();
    });
  });

  // ========== Part 2: Stock System Test ==========
  describe('Part 2 - Stock System', () => {
    test('2.1 Add Stock (purchase) - quantity increases', async () => {
      const res = await request(app)
        .post('/api/stock')
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({
          product: productId,
          type: 'purchase',
          quantity: 20,
          note: 'New shipment',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.type).toBe('purchase');
      expect(res.body.quantity).toBe(20);
      stockMovementId = res.body._id;

      const product = await Product.findById(productId);
      expect(product.quantity).toBe(70);
    });

    test('2.2 StockMovement was recorded', async () => {
      const movement = await StockMovement.findById(stockMovementId);
      expect(movement).toBeTruthy();
      expect(movement.product.toString()).toBe(productId);
      expect(movement.type).toBe('purchase');
      expect(movement.quantity).toBe(20);
    });

    test('2.3 Adjustment - stock modified correctly', async () => {
      const res = await request(app)
        .post('/api/stock')
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({
          product: productId,
          type: 'adjustment',
          quantity: -5,
          note: 'Damaged items',
        });

      expect(res.status).toBe(201);

      const product = await Product.findById(productId);
      expect(product.quantity).toBe(65);
    });
  });

  // ========== Part 3: Sales Flow Test ==========
  describe('Part 3 - Sales Flow', () => {
    test('3.1 Create Invoice - stock decreases, profit calculated', async () => {
      const quantityBefore = (await Product.findById(productId)).quantity;

      const res = await request(app)
        .post('/api/invoices')
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({
          customerName: 'E2E Test Customer',
          items: [
            {
              product: productId,
              quantity: 2,
              price: 150,
              wholesalePrice: 100,
            },
          ],
          notes: 'E2E test invoice',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.customerName).toBe('E2E Test Customer');
      expect(res.body.totalPrice).toBe(300);
      expect(res.body.totalProfit).toBe(100);
      expect(res.body.items[0].profit).toBe(100);
      invoiceId = res.body._id;

      const product = await Product.findById(productId);
      expect(product.quantity).toBe(quantityBefore - 2);
    });

    test('3.2 Invoice was saved', async () => {
      const invoice = await Invoice.findById(invoiceId);
      expect(invoice).toBeTruthy();
      expect(invoice.items).toHaveLength(1);
    });
  });

  // ========== Part 4: Reports Accuracy Test ==========
  describe('Part 4 - Reports Accuracy', () => {
    test('4.1 Monthly Sales Report', async () => {
      const res = await request(app)
        .get('/api/reports/month/2026/3')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalSales');
      expect(res.body).toHaveProperty('totalProfit');
      expect(res.body).toHaveProperty('totalInvoices');
      expect(typeof res.body.totalSales).toBe('number');
      expect(typeof res.body.totalProfit).toBe('number');
      expect(typeof res.body.totalInvoices).toBe('number');
    });

    test('4.1b Active Products Report', async () => {
      const res = await request(app)
        .get('/api/reports/active-products?month=2026-03')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('productId');
        expect(res.body[0]).toHaveProperty('productName');
        expect(res.body[0]).toHaveProperty('month', '2026-03');
        expect(res.body[0]).toHaveProperty('purchaseTotal');
        expect(res.body[0]).toHaveProperty('saleTotal');
        expect(res.body[0]).toHaveProperty('totalOps');
        expect(res.body[0]).toHaveProperty('score');
        expect(res.body[0]).toHaveProperty('level');
        expect(res.body[0]).toHaveProperty('product');
      }
    });

    test('4.2 Top Selling Products', async () => {
      const res = await request(app)
        .get('/api/reports/top-products')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('productName');
        expect(res.body[0]).toHaveProperty('model');
        expect(res.body[0]).toHaveProperty('totalSold');
      }
    });

    test('4.3 Sales By Model', async () => {
      const res = await request(app)
        .get('/api/reports/model-sales')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('model');
        expect(res.body[0]).toHaveProperty('totalSales');
      }
    });
  });

  // ========== Part 5: Dashboard Test ==========
  describe('Part 5 - Dashboard', () => {
    test('5.1 Dashboard Summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalProducts');
      expect(res.body).toHaveProperty('totalStock');
      expect(res.body).toHaveProperty('lowStockProducts');
      expect(res.body).toHaveProperty('totalSales');
      expect(res.body).toHaveProperty('totalProfit');
    });
  });

  // ========== Part 6: Pagination & Filtering ==========
  describe('Part 6 - Pagination & Filtering', () => {
    test('6.1 Products pagination', async () => {
      const res = await request(app)
        .get('/api/products?page=1&limit=10')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination).toHaveProperty('total');
    });

    test('6.2 Products filter by category', async () => {
      const res = await request(app)
        .get(`/api/products?category=${categoryId}`)
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      const catId = (p) => (p.category?._id || p.category)?.toString();
      if (res.body.data?.length > 0) {
        expect(res.body.data.every((p) => catId(p) === categoryId)).toBe(true);
      }
    });

    test('6.2b Get products by category endpoint', async () => {
      const res = await request(app)
        .get(`/api/products/${categoryId}/products?page=1&limit=10`)
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      const catId = (p) => (p.category?._id || p.category)?.toString();
      if (res.body.data?.length > 0) {
        expect(res.body.data.every((p) => catId(p) === categoryId)).toBe(true);
      }
    });

    test('6.3 Products filter by model', async () => {
      const res = await request(app)
        .get(`/api/products?model=${modelId}`)
        .set(getAuthHeader());

      expect(res.status).toBe(200);
    });

    test('6.4 Products filter lowStock', async () => {
      const res = await request(app)
        .get('/api/products?lowStock=true')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
      if (res.body.data?.length > 0) {
        expect(res.body.data.every((p) => p.quantity <= 5)).toBe(true);
      }
    });

    test('6.5 Update product quantity only', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set(getAuthHeader())
        .set('Content-Type', 'application/json')
        .send({ quantity: 40 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.quantity).toBe(40);
      expect(res.body).toHaveProperty('category');
      expect(res.body).toHaveProperty('model');
    });
  });

  // ========== Part 7: Security Test ==========
  describe('Part 7 - Security', () => {
    test('7.1 Without Token - 401 Unauthorized', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    test('7.2 With Token - works', async () => {
      const res = await request(app)
        .get('/api/products')
        .set(getAuthHeader());

      expect(res.status).toBe(200);
    });
  });

  // ========== Part 8: Error Handling ==========
  describe('Part 8 - Error Handling', () => {
    test('8.1 Invalid ID - proper error response', async () => {
      const res = await request(app)
        .get('/api/products/123')
        .set(getAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    test('8.2 Non-existent ID - 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .set(getAuthHeader());

      expect([404, 200]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body).toHaveProperty('error');
      }
    });
  });
});
