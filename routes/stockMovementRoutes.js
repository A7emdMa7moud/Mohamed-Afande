const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const router = express.Router();
const validate = require('../middleware/validateMiddleware');
const {
  getAllStockMovements,
  getStockMovementById,
  createStockMovement,
} = require('../controllers/stockMovementController');

const stockMovementSchema = Joi.object({
  product: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  type: Joi.string().valid('purchase', 'sale', 'adjustment').required(),
  quantity: Joi.number().required(),
  note: Joi.string().allow(''),
});

router.get('/', getAllStockMovements);
router.get('/:id', getStockMovementById);
router.post('/', validate(stockMovementSchema), createStockMovement);

module.exports = router;
