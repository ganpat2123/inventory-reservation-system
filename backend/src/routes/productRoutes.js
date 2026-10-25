const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product and inventory management
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - total_quantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 16
 *               sku:
 *                 type: string
 *                 example: IP-001
 *               total_quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid product details
 *       409:
 *         description: Duplicate SKU
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

router.post("/", productController.createProduct);

router.get("/", productController.getAllProducts);

router.get("/:id", productController.getProductById);

module.exports = router;