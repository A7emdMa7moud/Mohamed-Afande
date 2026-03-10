const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const router = express.Router();
const validate = require('../middleware/validateMiddleware');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');

const invoiceItemSchema = Joi.object({
  product: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  quantity: Joi.number().required().min(1),
  price: Joi.number().required().min(0),
  wholesalePrice: Joi.number().required().min(0),
});

const invoiceSchema = Joi.object({
  customerName: Joi.string().required().trim(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  notes: Joi.string().allow(''),
});

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', validate(invoiceSchema), createInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
