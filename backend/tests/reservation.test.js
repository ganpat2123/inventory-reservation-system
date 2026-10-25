
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const pool = require("../src/config/db");
const productService = require("../src/services/productService");
const reservationService = require("../src/services/reservationService");

const createTestProduct = async (quantity = 10) => {
  return productService.createProduct(
    "Reservation Test Product",
    `TEST-RES-${randomUUID()}`,
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

test("Create reservation and deduct stock", async () => {
  const product = await createTestProduct();

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      3,
      randomUUID()
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(reservation.status, "PENDING");
    assert.equal(reservation.quantity, 3);
    assert.equal(updatedProduct.available_quantity, 7);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Reject reservation when stock is insufficient", async () => {
  const product = await createTestProduct(2);

  try {
    await assert.rejects(
      reservationService.createReservation(product.id, 5, randomUUID()),
      (error) => error.statusCode === 409
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedProduct.available_quantity, 2);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Confirm reservation without deducting stock twice", async () => {
  const product = await createTestProduct();

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      4,
      randomUUID()
    );

    const confirmed = await reservationService.confirmReservation(
      reservation.id
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(confirmed.status, "CONFIRMED");
    assert.equal(updatedProduct.available_quantity, 6);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Release reservation and restore stock", async () => {
  const product = await createTestProduct();

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      4,
      randomUUID()
    );

    const released = await reservationService.releaseReservation(
      reservation.id
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(released.status, "RELEASED");
    assert.equal(updatedProduct.available_quantity, 10);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Same idempotency key returns the same reservation", async () => {
  const product = await createTestProduct();
  const key = randomUUID();

  try {
    const first = await reservationService.createReservation(
      product.id,
      3,
      key
    );

    const second = await reservationService.createReservation(
      product.id,
      3,
      key
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(first.id, second.id);
    assert.equal(updatedProduct.available_quantity, 7);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Same idempotency key with different quantity returns conflict", async () => {
  const product = await createTestProduct();
  const key = randomUUID();

  try {
    await reservationService.createReservation(product.id, 2, key);

    await assert.rejects(
      reservationService.createReservation(product.id, 3, key),
      (error) => error.statusCode === 409
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedProduct.available_quantity, 8);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Expire reservation and restore stock", async () => {
  const product = await createTestProduct();

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      5,
      randomUUID()
    );

    // Simulate 10-minute expiry without waiting.
    await pool.query(
      `UPDATE reservations
       SET expires_at = NOW() - INTERVAL '1 minute'
       WHERE id = $1`,
      [reservation.id]
    );

    await reservationService.expireReservations();

    const updatedReservation =
      await reservationService.getReservationById(reservation.id);

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedReservation.status, "EXPIRED");
    assert.equal(updatedProduct.available_quantity, 10);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Expired reservation cannot be confirmed", async () => {
  const product = await createTestProduct();

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      2,
      randomUUID()
    );

    await pool.query(
      `UPDATE reservations
       SET expires_at = NOW() - INTERVAL '1 minute'
       WHERE id = $1`,
      [reservation.id]
    );

    await assert.rejects(
      reservationService.confirmReservation(reservation.id),
      (error) => error.statusCode === 409
    );

    const updatedProduct = await productService.getProductById(product.id);

    const updatedReservation =
      await reservationService.getReservationById(reservation.id);

    assert.equal(updatedReservation.status, "EXPIRED");
    assert.equal(updatedProduct.available_quantity, 10);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

test("Confirmed reservation cannot be released", async () => {
  const product = await createTestProduct();

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      3,
      randomUUID()
    );

    await reservationService.confirmReservation(reservation.id);

    await assert.rejects(
      reservationService.releaseReservation(reservation.id),
      (error) => error.statusCode === 409
    );

    const updatedProduct = await productService.getProductById(product.id);

    assert.equal(updatedProduct.available_quantity, 7);
  } finally {
    await cleanupTestProduct(product.id);
  }
});

// Double Expiry Safety Test
test("Expiring a reservation twice does not restore stock twice", async () => {
  const product = await createTestProduct(10);

  try {
    const reservation = await reservationService.createReservation(
      product.id,
      3,
      randomUUID()
    );

    // Make reservation expired
    await pool.query(
      `UPDATE reservations
       SET expires_at = NOW() - INTERVAL '1 minute'
       WHERE id = $1`,
      [reservation.id]
    );

    // First expiry
    await reservationService.expireReservations();

    const firstResult = await productService.getProductById(product.id);

    assert.equal(firstResult.available_quantity, 10);

    // Second expiry
    await reservationService.expireReservations();

    const secondResult = await productService.getProductById(product.id);

    assert.equal(secondResult.available_quantity, 10);

    const updatedReservation =
      await reservationService.getReservationById(reservation.id);

    assert.equal(updatedReservation.status, "EXPIRED");

  } finally {
    await cleanupTestProduct(product.id);
  }
});

test.after(async () => {
  await pool.end();
});
