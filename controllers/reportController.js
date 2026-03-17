const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { INVALID_YEAR_MONTH } = require("../utils/messages");

const getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res
        .status(400)
        .json({ success: false, error: INVALID_YEAR_MONTH });
    }

    const [invoiceStats, purchaseStats] = await Promise.all([
      Invoice.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $year: "$date" }, yearNum] },
                { $eq: [{ $month: "$date" }, monthNum] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalPrice" },
            totalProfit: { $sum: "$totalProfit" },
            totalInvoices: { $sum: 1 },
            totalItemsSold: { $sum: { $size: "$items" } },
          },
        },
        {
          $project: {
            _id: 0,
            totalSales: { $ifNull: ["$totalSales", 0] },
            totalProfit: { $ifNull: ["$totalProfit", 0] },
            totalInvoices: { $ifNull: ["$totalInvoices", 0] },
            totalItemsSold: { $ifNull: ["$totalItemsSold", 0] },
          },
        },
      ]),
      StockMovement.aggregate([
        {
          $match: {
            type: "purchase",
            $expr: {
              $and: [
                { $eq: [{ $year: "$date" }, yearNum] },
                { $eq: [{ $month: "$date" }, monthNum] },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productData",
          },
        },
        { $unwind: { path: "$productData", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: null,
            totalPurchaseValue: { $sum: { $multiply: ["$quantity", "$productData.wholesalePrice"] } },
            totalPurchaseQuantity: { $sum: "$quantity" },
          },
        },
        {
          $project: {
            _id: 0,
            totalPurchaseValue: { $ifNull: ["$totalPurchaseValue", 0] },
            totalPurchaseQuantity: { $ifNull: ["$totalPurchaseQuantity", 0] },
          },
        },
      ]),
    ]);

    const invoiceData = invoiceStats[0] || {
      totalSales: 0,
      totalProfit: 0,
      totalInvoices: 0,
      totalItemsSold: 0,
    };

    const purchaseData = purchaseStats[0] || {
      totalPurchaseValue: 0,
      totalPurchaseQuantity: 0,
    };

    const profitMargin =
      invoiceData.totalSales > 0
        ? (invoiceData.totalProfit / invoiceData.totalSales) * 100
        : 0;

    const report = {
      ...invoiceData,
      ...purchaseData,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
    };

    res.json(report);
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const [productStats, stockStats, lowStockCount, salesStats, stockValueStats] =
      await Promise.all([
        Product.countDocuments(),
        Product.aggregate([
          { $group: { _id: null, total: { $sum: "$quantity" } } },
          { $project: { _id: 0, total: 1 } },
        ]),
        Product.countDocuments({ quantity: { $lte: 5 } }),
        Invoice.aggregate([
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$totalPrice" },
              totalProfit: { $sum: "$totalProfit" },
            },
          },
          { $project: { _id: 0 } },
        ]),
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalStockValue: { $sum: { $multiply: ["$quantity", "$wholesalePrice"] } },
              totalPotentialProfit: { $sum: { $multiply: ["$quantity", { $subtract: ["$salePrice", "$wholesalePrice"] }] } },
            },
          },
          { $project: { _id: 0, totalStockValue: 1, totalPotentialProfit: 1 } },
        ]),
      ]);

    const summary = {
      totalProducts: productStats,
      totalStock: stockStats[0]?.total ?? 0,
      lowStockProducts: lowStockCount,
      totalSales: salesStats[0]?.totalSales ?? 0,
      totalProfit: salesStats[0]?.totalProfit ?? 0,
      totalStockValue: stockValueStats[0]?.totalStockValue ?? 0,
      totalPotentialProfit: stockValueStats[0]?.totalPotentialProfit ?? 0,
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const topProducts = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "models",
          localField: "productDoc.model",
          foreignField: "_id",
          as: "modelDoc",
        },
      },
      {
        $unwind: { path: "$modelDoc", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          productName: { $ifNull: ["$productDoc.name", "Unknown"] },
          model: { $ifNull: ["$modelDoc.name", "-"] },
          totalSold: 1,
        },
      },
    ]);

    res.json(topProducts);
  } catch (error) {
    next(error);
  }
};

const getModelSales = async (req, res, next) => {
  try {
    const modelSales = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      { $unwind: "$productDoc" },
      {
        $lookup: {
          from: "models",
          localField: "productDoc.model",
          foreignField: "_id",
          as: "modelDoc",
        },
      },
      {
        $unwind: { path: "$modelDoc", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: { $ifNull: ["$modelDoc.name", "Unknown"] },
          totalSales: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalSales: -1 } },
      {
        $project: {
          _id: 0,
          model: "$_id",
          totalSales: 1,
        },
      },
    ]);

    res.json(modelSales);
  } catch (error) {
    next(error);
  }
};

const getActiveProducts = async (req, res, next) => {
  try {
    let matchStage = {};
    let monthLabel = "all";

    if (req.query.month) {
      const monthStr = String(req.query.month).trim();
      const match = monthStr.match(/^(\d{4})-(\d{2})$/);
      if (!match) {
        return res
          .status(400)
          .json({ success: false, error: INVALID_YEAR_MONTH });
      }

      const yearNum = parseInt(match[1], 10);
      const monthNum = parseInt(match[2], 10);
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res
          .status(400)
          .json({ success: false, error: INVALID_YEAR_MONTH });
      }

      monthLabel = `${match[1]}-${match[2]}`;
      matchStage = {
        createdAt: {
          $gte: new Date(yearNum, monthNum - 1, 1),
          $lt: new Date(yearNum, monthNum, 1),
        },
      };
    }

    const agg = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$product",
          purchaseTotal: {
            $sum: { $cond: [{ $eq: ["$type", "purchase"] }, "$quantity", 0] },
          },
          saleTotal: {
            $sum: { $cond: [{ $eq: ["$type", "sale"] }, "$quantity", 0] },
          },
          totalOps: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: { path: "$productData", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "models",
          localField: "productData.model",
          foreignField: "_id",
          as: "modelData",
        },
      },
      { $unwind: { path: "$modelData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "productData.category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$saleTotal", 2] },
              "$purchaseTotal",
              "$totalOps",
            ],
          },
          productId: "$_id",
          productName: "$productData.name",
          modelId: "$modelData._id",
          modelName: "$modelData.name",
          categoryId: "$categoryData._id",
          categoryName: "$categoryData.name",
          month: monthLabel,
          product: {
            _id: "$productData._id",
            name: "$productData.name",
            model: {
              _id: "$modelData._id",
              name: "$modelData.name",
            },
            category: {
              _id: "$categoryData._id",
              name: "$categoryData.name",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          productId: 1,
          productName: 1,
          modelId: 1,
          modelName: 1,
          categoryId: 1,
          categoryName: 1,
          month: 1,
          purchaseTotal: 1,
          saleTotal: 1,
          totalOps: 1,
          score: 1,
          product: 1,
        },
      },
      { $sort: { score: -1 } },
    ]);

    const result = agg.map((p) => {
      let level = "C";
      if (p.score >= 100) level = "A+";
      else if (p.score >= 80) level = "A";
      else if (p.score >= 60) level = "B+";
      else if (p.score >= 40) level = "B";
      else if (p.score >= 20) level = "C+";

      return { ...p, level };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyReport,
  getDashboardSummary,
  getTopProducts,
  getModelSales,
  getActiveProducts,
};
