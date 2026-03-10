const express = require('express');
const Joi = require('joi');
const router = express.Router();
const validate = require('../middleware/validateMiddleware');
const {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
} = require('../controllers/modelController');

const modelSchema = Joi.object({
  name: Joi.string().required().trim(),
});

router.get('/', getAllModels);
router.get('/:id', getModelById);
router.post('/', validate(modelSchema), createModel);
router.put('/:id', validate(modelSchema), updateModel);
router.delete('/:id', deleteModel);

module.exports = router;
