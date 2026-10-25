
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const app = require("../src/app");
const pool = require("../src/config/db");

test("Reservation history filters and validation", async () => {
  const server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const sku = `FILTER-${randomUUID()}`;
  let productId;

  try {
    const productResponse = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Filter Test Product",
        sku,
        total_quantity: 10
      })
    });

    assert.equal(productResponse.status, 201);

    const product = await productResponse.json();
    productId = product.data.id;

    const reservationResponse = await fetch(
      `${baseUrl}/api/reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID()
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 2
        })
      }
    );

    assert.equal(reservationResponse.status, 201);

    const reservation = await reservationResponse.json();
    const reservationId = reservation.data.id;

    // Product ID filter
    const productFilter = await fetch(
      `${baseUrl}/api/reservations?product_id=${productId}`
    );

    assert.equal(productFilter.status, 200);

    const productFilterBody = await productFilter.json();

    assert.ok(Array.isArray(productFilterBody.data));
    assert.ok(
      productFilterBody.data.some((item) => item.id === reservationId)
    );

    // Status filter
    const statusFilter = await fetch(
      `${baseUrl}/api/reservations?product_id=${productId}&status=PENDING`
    );

    assert.equal(statusFilter.status, 200);

    const statusBody = await statusFilter.json();

    assert.ok(
      statusBody.data.some((item) => item.id === reservationId)
    );

    // Search filter
    const searchFilter = await fetch(
      `${baseUrl}/api/reservations?search=${encodeURIComponent(sku)}`
    );

    assert.equal(searchFilter.status, 200);

    const searchBody = await searchFilter.json();

    assert.ok(
      searchBody.data.some((item) => item.id === reservationId)
    );

    // Date filter (UTC database test date)
    const date = new Date(reservation.data.created_at)
      .toISOString()
      .slice(0, 10);

    const dateFilter = await fetch(
      `${baseUrl}/api/reservations?product_id=${productId}&date=${date}`
    );

    assert.equal(dateFilter.status, 200);

    // Invalid date
    const invalidDate = await fetch(
      `${baseUrl}/api/reservations?date=2026-02-30`
    );

    assert.equal(invalidDate.status, 400);

    // Invalid status
    const invalidStatus = await fetch(
      `${baseUrl}/api/reservations?status=INVALID`
    );

    assert.equal(invalidStatus.status, 400);

    // Invalid product ID
    const invalidProductId = await fetch(
      `${baseUrl}/api/reservations?product_id=invalid`
    );

    assert.equal(invalidProductId.status, 400);

  } finally {
    if (productId) {
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
    }

    await new Promise((resolve) => server.close(resolve));
  }
});

test.after(async () => {
  await pool.end();
});
