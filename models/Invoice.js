const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    wholesalePrice: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    items: [invoiceItemSchema],
    totalPrice: Number,
    totalProfit: Number,
    notes: String,
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
