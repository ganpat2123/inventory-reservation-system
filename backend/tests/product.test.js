const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const productService = require("../src/services/productService");

test("Create a product successfully", async () => {
  const sku = `TEST-${Date.now()}`;

  try {
    const product = await productService.createProduct(
      "Test iPhone",
      sku,
      10
    );

    assert.equal(product.name, "Test iPhone");
    assert.equal(product.sku, sku);
    assert.equal(product.total_quantity, 10);
    assert.equal(product.available_quantity, 10);

  } finally {
    await pool.query(
      "DELETE FROM products WHERE sku = $1",
      [sku]
    );
  }
});

test("Get all products", async () => {
  const products = await productService.getAllProducts();

  assert.ok(Array.isArray(products));
});

test("Get product by ID", async () => {
  const sku = `TEST-ID-${Date.now()}`;

  try {
    const product = await productService.createProduct(
      "Test Samsung",
      sku,
      5
    );

    const result = await productService.getProductById(product.id);

    assert.equal(result.id, product.id);
    assert.equal(result.name, "Test Samsung");

  } finally {
    await pool.query(
      "DELETE FROM products WHERE sku = $1",
      [sku]
    );
  }
});

test("Reject duplicate SKU", async () => {
  const sku = `TEST-DUP-${Date.now()}`;

  try {
    await productService.createProduct("First Product", sku, 10);

    await assert.rejects(
      productService.createProduct("Second Product", sku, 5),
      (error) => error.code === "23505"
    );

  } finally {
    await pool.query(
      "DELETE FROM products WHERE sku = $1",
      [sku]
    );
  }
});

test("Reject negative product quantity", async () => {
  const sku = `TEST-NEG-${Date.now()}`;

  await assert.rejects(
    productService.createProduct("Invalid Product", sku, -5),
    (error) => error.code === "23514"
  );
});