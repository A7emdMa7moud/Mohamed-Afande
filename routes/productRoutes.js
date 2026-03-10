const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const router = express.Router();
const validate = require('../middleware/validateMiddleware');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require('../controllers/productController');

const productSchema = Joi.object({
  name: Joi.string().required().trim(),
  category: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  model: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  wholesalePrice: Joi.number().required().min(0),
  salePrice: Joi.number().required().min(0),
  quantity: Joi.number().required().min(0),
});

router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProductById);
router.post('/', validate(productSchema), createProduct);
router.put('/:id', validate(productSchema), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
