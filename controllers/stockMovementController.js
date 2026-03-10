const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const {
  getPaginationOptions,
  paginatedResponse,
} = require('../middleware/paginationMiddleware');

const getAllStockMovements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);

    const [movements, total] = await Promise.all([
      StockMovement.find()
        .populate('product', 'name quantity')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      StockMovement.countDocuments(),
    ]);

    res.json(paginatedResponse(movements, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const getStockMovementById = async (req, res, next) => {
  try {
    const movement = await StockMovement.findById(req.params.id).populate(
      'product',
      'name quantity'
    );
    if (!movement) {
      return res.status(404).json({ message: 'Stock movement not found' });
    }
    res.json(movement);
  } catch (error) {
    next(error);
  }
};

const createStockMovement = async (req, res, next) => {
  try {
    const { product, type, quantity, note } = req.body;

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (type === 'sale' || type === 'adjustment') {
      const qtyChange = type === 'sale' ? -quantity : quantity;
      const newQuantity = productDoc.quantity + qtyChange;
      if (newQuantity < 0) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${productDoc.quantity}`,
        });
      }
    }

    const movement = await StockMovement.create(req.body);

    if (type === 'purchase') {
      productDoc.quantity += quantity;
    } else if (type === 'sale') {
      productDoc.quantity -= quantity;
    } else if (type === 'adjustment') {
      productDoc.quantity += quantity;
    }
    await productDoc.save();

    await movement.populate('product', 'name quantity');
    res.status(201).json(movement);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStockMovements,
  getStockMovementById,
  createStockMovement,
};
