const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const pool = require("../src/config/db");
const productService = require("../src/services/productService");
const reservationService = require("../src/services/reservationService");

const createTestProduct = async (quantity) => {
  return productService.createProduct(
    "Concurrency Test Product",
    `TEST-CON-${randomUUID()}`,
    quantity
  );
};

const cleanupTestProduct = async (productId) => {
  await pool.query(
    `DELETE FROM idempotency_keys
     WHERE reservation_id IN (
       SELECT id FROM reservations WHERE product_id = $1
     )`,
    [productId]
  );

  await pool.query(
    "DELETE FROM reservations WHERE product_id = $1",
    [productId]
  );

  await pool.query(
    "DELETE FROM products WHERE id = $1",
    [productId]
  );
};

test("Only one reservation succeeds when 10 requests compete for 1 stock", async () => {
  const product = await createTestProduct(1);

  try {
    const requests = Array.from({ length: 10 }, () => {
      return reservationService.createReservation(
        product.id,
        1,
        randomUUID()
      );
    });

    const results = await Promise.allSettled(requests);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );

    const failed = results.filter(
      (result) => result.status === "rejected"
    );

    assert.equal(successful.length, 1);
    assert.equal(failed.length, 9);

    for (const result of failed) {
      assert.equal(result.reason.statusCode, 409);
    }

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedProduct.total_quantity, 1);
    assert.equal(updatedProduct.available_quantity, 0);

    const reservations = await pool.query(
      "SELECT * FROM reservations WHERE product_id = $1",
      [product.id]
    );

    assert.equal(reservations.rows.length, 1);
    assert.equal(reservations.rows[0].status, "PENDING");

  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Concurrent requests with the same idempotency key create only one reservation", async () => {
  const product = await createTestProduct(10);
  const key = randomUUID();

  try {
    const requests = Array.from({ length: 10 }, () => {
      return reservationService.createReservation(
        product.id,
        2,
        key
      );
    });

    const results = await Promise.allSettled(requests);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );

    assert.equal(successful.length, 10);

    const reservationIds = successful.map(
      (result) => result.value.id
    );

    assert.equal(new Set(reservationIds).size, 1);

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedProduct.available_quantity, 8);

    const reservations = await pool.query(
      "SELECT * FROM reservations WHERE product_id = $1",
      [product.id]
    );

    assert.equal(reservations.rows.length, 1);

  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Concurrent reservations never reduce stock below zero", async () => {
  const product = await createTestProduct(5);

  try {
    const requests = Array.from({ length: 20 }, () => {
      return reservationService.createReservation(
        product.id,
        1,
        randomUUID()
      );
    });

    const results = await Promise.allSettled(requests);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );

    assert.equal(successful.length, 5);

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedProduct.available_quantity, 0);
    assert.ok(updatedProduct.available_quantity >= 0);

    const reservations = await pool.query(
      "SELECT COUNT(*)::int AS count FROM reservations WHERE product_id = $1",
      [product.id]
    );

    assert.equal(reservations.rows[0].count, 5);

  } finally {
    await cleanupTestProduct(product.id);
  }
});

test.after(async () => {
  await pool.end();
});