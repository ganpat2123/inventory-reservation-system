const productService = require("../services/productService");

const createProduct = async (req, res, next) => {
  try {
    const { name, sku, total_quantity } = req.body;

    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      name.length > 255 ||
      typeof sku !== "string" ||
      sku.trim() === "" ||
      sku.length > 100 ||
      !Number.isSafeInteger(total_quantity) ||
      total_quantity < 0 ||
      total_quantity > 2147483647
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid product details"
      });
    }

    const product = await productService.createProduct(
      name.trim(),
      sku.trim(),
      total_quantity
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });

  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();

    return res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById
};