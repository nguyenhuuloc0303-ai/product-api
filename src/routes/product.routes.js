const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductByPid,
  updateProductByPid,
  deleteProductByPid,
} = require('../controllers/product.controller');

// CRUD endpoints for Products
router.route('/')
  .post(createProduct)
  .get(getAllProducts);

router.route('/:pid')
  .get(getProductByPid)
  .put(updateProductByPid)
  .delete(deleteProductByPid);

module.exports = router;
