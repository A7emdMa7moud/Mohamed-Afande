const Model = require("../models/Model");
const { MODEL_NOT_FOUND, MODEL_DELETED } = require("../utils/messages");
const {
  getPaginationOptions,
  paginatedResponse,
} = require("../middleware/paginationMiddleware");

const getAllModels = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);

    const [models, total] = await Promise.all([
      Model.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(),
    ]);

    res.json(paginatedResponse(models, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const getModelById = async (req, res, next) => {
  try {
    const model = await Model.findById(req.params.id);
    if (!model) {
      return res.status(404).json({ success: false, error: MODEL_NOT_FOUND });
    }
    res.json(model);
  } catch (error) {
    next(error);
  }
};

const createModel = async (req, res, next) => {
  try {
    const model = await Model.create(req.body);
    res.status(201).json(model);
  } catch (error) {
    next(error);
  }
};

const updateModel = async (req, res, next) => {
  try {
    const model = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!model) {
      return res.status(404).json({ success: false, error: MODEL_NOT_FOUND });
    }
    res.json(model);
  } catch (error) {
    next(error);
  }
};

const deleteModel = async (req, res, next) => {
  try {
    const model = await Model.findByIdAndDelete(req.params.id);
    if (!model) {
      return res.status(404).json({ success: false, error: MODEL_NOT_FOUND });
    }
    res.json({ success: true, message: MODEL_DELETED, model });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
};
