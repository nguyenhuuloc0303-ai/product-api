const Product = require('../models/product.model');

// @desc    Create a new Product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const { pid, pname, price, quantity } = req.body;

    if (!pid || !pname || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields (pid, pname, price, quantity) are required.',
      });
    }

    const existingProduct = await Product.findOne({ pid });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: `Product with pid '${pid}' already exists.`,
      });
    }

    const newProduct = new Product({ pid, pname, price, quantity });
    const savedProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: savedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating product.',
      error: error.message,
    });
  }
};

// @desc    Get all Products
// @route   GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { pname: { $regex: search, $options: 'i' } },
          { pid: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving products.',
      error: error.message,
    });
  }
};

// @desc    Get a single Product by pid
// @route   GET /api/products/:pid
const getProductByPid = async (req, res) => {
  try {
    const { pid } = req.params;
    const product = await Product.findOne({ pid });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with pid '${pid}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving product.',
      error: error.message,
    });
  }
};

// @desc    Update a Product by pid
// @route   PUT /api/products/:pid
const updateProductByPid = async (req, res) => {
  try {
    const { pid } = req.params;
    const { pname, price, quantity } = req.body;

    const product = await Product.findOne({ pid });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with pid '${pid}' not found.`,
      });
    }

    if (pname !== undefined) product.pname = pname;
    if (price !== undefined) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating product.',
      error: error.message,
    });
  }
};

// @desc    Delete a Product by pid
// @route   DELETE /api/products/:pid
const deleteProductByPid = async (req, res) => {
  try {
    const { pid } = req.params;
    const deletedProduct = await Product.findOneAndDelete({ pid });

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with pid '${pid}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product with pid '${pid}' deleted successfully.`,
      data: deletedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting product.',
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductByPid,
  updateProductByPid,
  deleteProductByPid,
};
