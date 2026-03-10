const express = require('express');
const Joi = require('joi');
const router = express.Router();
const validate = require('../middleware/validateMiddleware');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const categorySchema = Joi.object({
  name: Joi.string().required().trim(),
});

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', validate(categorySchema), createCategory);
router.put('/:id', validate(categorySchema), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
