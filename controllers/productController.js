const Product = require("../models/Product");
const Category = require("../models/Category");
const StockMovement = require("../models/StockMovement");
const {
  PRODUCT_NOT_FOUND,
  PRODUCT_DELETED,
  CATEGORY_NOT_FOUND,
} = require("../utils/messages");
const mongoose = require("mongoose");
const {
  getPaginationOptions,
  paginatedResponse,
} = require("../middleware/paginationMiddleware");

// Generate unique productId
const generateProductId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `PRD-${timestamp}-${randomStr}`.toUpperCase();
};

const getAllProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);

    const filter = {};
    if (
      req.query.category &&
      mongoose.Types.ObjectId.isValid(req.query.category)
    ) {
      filter.category = req.query.category;
    }
    if (req.query.model && mongoose.Types.ObjectId.isValid(req.query.model)) {
      filter.model = req.query.model;
    }
    if (req.query.lowStock === "true" || req.query.lowStock === "1") {
      filter.quantity = { $lte: 5 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("model", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json(paginatedResponse(products, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("model", "name");
    if (!product) {
      return res.status(404).json({ success: false, error: PRODUCT_NOT_FOUND });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const initialQuantity = Number(req.body.quantity ?? 0);
    const productData = {
      ...req.body,
      quantity: 0,
    };

    const product = await Product.create(productData);

    if (initialQuantity > 0) {
      await Product.findByIdAndUpdate(product._id, {
        $inc: { quantity: initialQuantity },
      });

      await StockMovement.create({
        product: product._id,
        type: "purchase",
        quantity: initialQuantity,
        note: "إضافة كمية أولية",
      });
    }

    const populatedProduct = await Product.findById(product._id).populate([
      "category",
      "model",
    ]);
    res.status(201).json(populatedProduct);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      // runValidators: true,
    }).populate(["category", "model"]);
    if (!product) {
      return res.status(404).json({ success: false, error: PRODUCT_NOT_FOUND });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const getLowStockProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req, { limit: 50 });

    const [products, total] = await Promise.all([
      Product.find({ quantity: { $lte: 5 } })
        .populate("category", "name")
        .populate("model", "name")
        .sort({ quantity: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ quantity: { $lte: 5 } }),
    ]);

    res.json(paginatedResponse(products, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: CATEGORY_NOT_FOUND });
    }

    const { page, limit, skip } = getPaginationOptions(req);

    const filter = { category: categoryId };
    if (req.query.lowStock === "true" || req.query.lowStock === "1") {
      filter.quantity = { $lte: 5 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("model", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json(paginatedResponse(products, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: PRODUCT_NOT_FOUND });
    }
    res.json({ success: true, message: PRODUCT_DELETED, product });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductsByCategory,
};
