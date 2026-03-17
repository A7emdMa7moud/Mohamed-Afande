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
  getProductsByCategory,
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
  quantity: Joi.number().min(0).default(0),
});

const productUpdateSchema = Joi.object({
  name: Joi.string().trim(),
  category: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  model: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  wholesalePrice: Joi.number().min(0),
  salePrice: Joi.number().min(0),
  quantity: Joi.number().min(0),
}).min(1);

router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:categoryId/products', getProductsByCategory);
router.get('/:id', getProductById);
router.post('/', validate(productSchema), createProduct);
router.put('/:id', validate(productUpdateSchema), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
