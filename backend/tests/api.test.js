const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const app = require("../src/app");
const pool = require("../src/config/db");

const startTestServer = async () => {
  const server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const port = server.address().port;

  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`
  };
};

const closeTestServer = async (server) => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

const cleanupProduct = async (productId) => {
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

test("HTTP API product and reservation flow", async () => {
  const { server, baseUrl } = await startTestServer();

  let productId = null;

  try {
    const sku = `HTTP-TEST-${randomUUID()}`;

    // Create product
    const productResponse = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "HTTP Test Product",
        sku,
        total_quantity: 10
      })
    });

    assert.equal(productResponse.status, 201);

    const productBody = await productResponse.json();

    productId = productBody.data.id;

    assert.equal(productBody.data.available_quantity, 10);

    // Get product details
    const getProductResponse = await fetch(
      `${baseUrl}/api/products/${productId}`
    );

    assert.equal(getProductResponse.status, 200);

    // Create reservation
    const reservationKey = randomUUID();

    const reservationResponse = await fetch(
      `${baseUrl}/api/reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": reservationKey
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 3
        })
      }
    );

    assert.equal(reservationResponse.status, 201);

    const reservationBody = await reservationResponse.json();

    const reservationId = reservationBody.data.id;

    assert.equal(reservationBody.data.status, "PENDING");

    // Verify stock deduction
    const updatedProductResponse = await fetch(
      `${baseUrl}/api/products/${productId}`
    );

    const updatedProduct = await updatedProductResponse.json();

    assert.equal(updatedProduct.data.available_quantity, 7);

    // Confirm reservation
    const confirmResponse = await fetch(
      `${baseUrl}/api/reservations/${reservationId}/confirm`,
      {
        method: "POST"
      }
    );

    assert.equal(confirmResponse.status, 200);

    const confirmBody = await confirmResponse.json();

    assert.equal(confirmBody.data.status, "CONFIRMED");

    // Confirmed reservation cannot be released
    const releaseResponse = await fetch(
      `${baseUrl}/api/reservations/${reservationId}/release`,
      {
        method: "POST"
      }
    );

    assert.equal(releaseResponse.status, 409);

    // Missing idempotency key
    const missingKeyResponse = await fetch(
      `${baseUrl}/api/reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      }
    );

    assert.equal(missingKeyResponse.status, 400);

    // Product not found
    const missingProductResponse = await fetch(
      `${baseUrl}/api/products/00000000-0000-4000-8000-000000000000`
    );

    assert.equal(missingProductResponse.status, 404);

  } finally {
    if (productId) {
      await cleanupProduct(productId);
    }

    await closeTestServer(server);
  }
});

test.after(async () => {
  await pool.end();
});