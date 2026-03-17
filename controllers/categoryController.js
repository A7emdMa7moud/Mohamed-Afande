const Category = require("../models/Category");
const { CATEGORY_NOT_FOUND, CATEGORY_DELETED } = require("../utils/messages");
const {
  getPaginationOptions,
  paginatedResponse,
} = require("../middleware/paginationMiddleware");

const getAllCategories = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);

    const [categories, total] = await Promise.all([
      Category.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Category.countDocuments(),
    ]);

    res.json(paginatedResponse(categories, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: CATEGORY_NOT_FOUND });
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: CATEGORY_NOT_FOUND });
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: CATEGORY_NOT_FOUND });
    }
    res.json({ success: true, message: CATEGORY_DELETED, category });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
