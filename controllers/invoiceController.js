const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const {
  INVOICE_NOT_FOUND,
  INVOICE_DELETED,
  INVOICE_MUST_HAVE_ITEMS,
  PRODUCT_NOT_FOUND,
  productNotFoundInInvoice,
  insufficientStockForProduct,
} = require("../utils/messages");
const StockMovement = require('../models/StockMovement');
const {
  getPaginationOptions,
  paginatedResponse,
} = require('../middleware/paginationMiddleware');

const getAllInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);

    const filter = {};
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('items.product', 'name salePrice')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(filter),
    ]);

    res.json(paginatedResponse(invoices, page, limit, total));
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      'items.product',
      'name salePrice wholesalePrice'
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { customerName, items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: INVOICE_MUST_HAVE_ITEMS });
    }

    const processedItems = [];
    let totalPrice = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: productNotFoundInInvoice(item.product),
        });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        });
      }

      const profit = (item.price - item.wholesalePrice) * item.quantity;
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price,
        wholesalePrice: item.wholesalePrice,
        profit,
      });
      totalPrice += item.price * item.quantity;
      totalProfit += profit;
    }

    const invoice = await Invoice.create({
      customerName,
      items: processedItems,
      totalPrice,
      totalProfit,
      notes,
    });

    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
      await StockMovement.create({
        product: item.product,
        type: 'sale',
        quantity: item.quantity,
        note: `Invoice: ${invoice._id}`,
      });
    }

    await invoice.populate('items.product', 'name salePrice wholesalePrice');
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    for (const item of invoice.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: INVOICE_DELETED, invoice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
};
