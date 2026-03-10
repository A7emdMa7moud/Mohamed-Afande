const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

const getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }

    const result = await Invoice.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: '$date' }, yearNum] },
              { $eq: [{ $month: '$date' }, monthNum] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalPrice' },
          totalProfit: { $sum: '$totalProfit' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: { $ifNull: ['$totalSales', 0] },
          totalProfit: { $ifNull: ['$totalProfit', 0] },
          totalInvoices: { $ifNull: ['$totalInvoices', 0] },
        },
      },
    ]);

    const report = result[0] || {
      totalSales: 0,
      totalProfit: 0,
      totalInvoices: 0,
    };

    res.json(report);
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const [productStats, stockStats, lowStockCount, salesStats] = await Promise.all([
      Product.countDocuments(),
      Product.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } },
        { $project: { _id: 0, total: 1 } },
      ]),
      Product.countDocuments({ quantity: { $lte: 5 } }),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalPrice' },
            totalProfit: { $sum: '$totalProfit' },
          },
        },
        { $project: { _id: 0 } },
      ]),
    ]);

    const summary = {
      totalProducts: productStats,
      totalStock: stockStats[0]?.total ?? 0,
      lowStockProducts: lowStockCount,
      totalSales: salesStats[0]?.totalSales ?? 0,
      totalProfit: salesStats[0]?.totalProfit ?? 0,
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
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'models',
          localField: 'productDoc.model',
          foreignField: '_id',
          as: 'modelDoc',
        },
      },
      {
        $unwind: { path: '$modelDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          productName: { $ifNull: ['$productDoc.name', 'Unknown'] },
          model: { $ifNull: ['$modelDoc.name', '-'] },
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
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: '$productDoc' },
      {
        $lookup: {
          from: 'models',
          localField: 'productDoc.model',
          foreignField: '_id',
          as: 'modelDoc',
        },
      },
      {
        $unwind: { path: '$modelDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: { $ifNull: ['$modelDoc.name', 'Unknown'] },
          totalSales: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      { $sort: { totalSales: -1 } },
      {
        $project: {
          _id: 0,
          model: '$_id',
          totalSales: 1,
        },
      },
    ]);

    res.json(modelSales);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyReport,
  getDashboardSummary,
  getTopProducts,
  getModelSales,
};
