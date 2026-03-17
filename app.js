require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const {
  generalLimiter,
  authLimiter,
} = require("./middleware/rateLimitMiddleware");
const { protect } = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const modelRoutes = require("./routes/modelRoutes");
const productRoutes = require("./routes/productRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(morgan("dev"));
app.use(generalLimiter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/categories", protect, categoryRoutes);
app.use("/api/models", protect, modelRoutes);
app.use("/api/products", protect, productRoutes);
app.use("/api/stock", protect, stockMovementRoutes);
app.use("/api/invoices", protect, invoiceRoutes);
app.use("/api/reports", protect, reportRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
