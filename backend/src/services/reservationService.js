const pool = require("../config/db");
const AppError = require("../utils/AppError");
const crypto = require("crypto");

// Create Reservation
const createReservation = async (productId, quantity, idempotencyKey) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
      throw new AppError("Quantity must be a positive integer", 400);
    }

    if (
      typeof idempotencyKey !== "string" ||
      !idempotencyKey.trim() ||
      idempotencyKey.length > 255
    ) {
      throw new AppError("Valid Idempotency-Key is required", 400);
    }

    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ productId, quantity }))
      .digest("hex");

    // Prevent simultaneous requests using the same idempotency key
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [idempotencyKey]
    );

    const existingKey = await client.query(
      "SELECT * FROM idempotency_keys WHERE key = $1",
      [idempotencyKey]
    );

    if (existingKey.rows.length > 0) {
      if (existingKey.rows[0].request_hash !== requestHash) {
        throw new AppError(
          "Idempotency key already used with different request data",
          409
        );
      }

      const existingReservation = await client.query(
        "SELECT * FROM reservations WHERE id = $1",
        [existingKey.rows[0].reservation_id]
      );

      await client.query("COMMIT");

      return existingReservation.rows[0];
    }

    // Atomic update prevents overselling
    const product = await client.query(
      `UPDATE products
       SET available_quantity = available_quantity - $1,
           updated_at = NOW()
       WHERE id = $2
         AND available_quantity >= $1
       RETURNING *`,
      [quantity, productId]
    );

    if (product.rows.length === 0) {
      const existingProduct = await client.query(
        "SELECT id FROM products WHERE id = $1",
        [productId]
      );

      if (existingProduct.rows.length === 0) {
        throw new AppError("Product not found", 404);
      }

      throw new AppError("Not enough stock available", 409);
    }

    const result = await client.query(
      `INSERT INTO reservations (product_id, quantity)
       VALUES ($1, $2)
       RETURNING *`,
      [productId, quantity]
    );

    const reservation = result.rows[0];

    await client.query(
      `INSERT INTO idempotency_keys
       (key, request_hash, reservation_id)
       VALUES ($1, $2, $3)`,
      [idempotencyKey, requestHash, reservation.id]
    );

    await client.query("COMMIT");

    return reservation;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};


// Get Reservation By ID
const getReservationById = async (id) => {
  const result = await pool.query(
    `SELECT
       r.*,
       p.name AS product_name,
       p.sku
     FROM reservations r
     JOIN products p ON r.product_id = p.id
     WHERE r.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

// Get All Reservations With Filters
const getAllReservations = async (filters = {}) => {
  const { date, status, productId, search } = filters;

  const conditions = [];
  const values = [];

  // Filter by reservation creation date
  if (date) {
    values.push(date);

    conditions.push(
      `r.created_at >= $${values.length}::date
       AND r.created_at < ($${values.length}::date + INTERVAL '1 day')`
    );
  }

  // Filter by reservation status
  if (status) {
    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }

  // Filter by product ID
  if (productId) {
    values.push(productId);
    conditions.push(`r.product_id = $${values.length}`);
  }

  // Search by product name or SKU
  if (search) {
    values.push(`%${search}%`);

    conditions.push(
      `(p.name ILIKE $${values.length}
        OR p.sku ILIKE $${values.length})`
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query(
    `SELECT
       r.*,
       p.name AS product_name,
       p.sku AS product_sku
     FROM reservations r
     JOIN products p ON p.id = r.product_id
     ${whereClause}
     ORDER BY r.created_at DESC, r.id DESC`,
    values
  );

  return result.rows;
};

// Confirm Reservation
const confirmReservation = async (id) => {
  const client = await pool.connect();
  let committed = false;

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM reservations WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Reservation not found", 404);
    }

    const reservation = result.rows[0];

    if (reservation.status !== "PENDING") {
      throw new AppError(
        `Cannot confirm a ${reservation.status} reservation`,
        409
      );
    }

    // Expired reservations cannot be confirmed
    if (new Date(reservation.expires_at) <= new Date()) {
      await client.query(
        `UPDATE reservations
         SET status = 'EXPIRED',
             updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      await client.query(
        `UPDATE products
         SET available_quantity = available_quantity + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [reservation.quantity, reservation.product_id]
      );

      await client.query("COMMIT");
      committed = true;

      throw new AppError("Reservation has expired", 409);
    }

    const confirmed = await client.query(
      `UPDATE reservations
       SET status = 'CONFIRMED',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    committed = true;

    return confirmed.rows[0];

  } catch (error) {
    if (!committed) {
      await client.query("ROLLBACK");
    }

    throw error;

  } finally {
    client.release();
  }
};


// Release Reservation
const releaseReservation = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM reservations WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Reservation not found", 404);
    }

    const reservation = result.rows[0];

    if (reservation.status !== "PENDING") {
      throw new AppError(
        `Cannot release a ${reservation.status} reservation`,
        409
      );
    }

    const expired = new Date(reservation.expires_at) <= new Date();

    const updated = await client.query(
      `UPDATE reservations
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [expired ? "EXPIRED" : "RELEASED", id]
    );

    // Return reserved stock
    await client.query(
      `UPDATE products
       SET available_quantity = available_quantity + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reservation.quantity, reservation.product_id]
    );

    await client.query("COMMIT");

    return updated.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};


// Expire Old Reservations
const expireReservations = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT *
       FROM reservations
       WHERE status = 'PENDING'
         AND expires_at <= NOW()
       ORDER BY expires_at
       LIMIT 100
       FOR UPDATE SKIP LOCKED`
    );

    for (const reservation of result.rows) {
      await client.query(
        `UPDATE reservations
         SET status = 'EXPIRED',
             updated_at = NOW()
         WHERE id = $1`,
        [reservation.id]
      );

      await client.query(
        `UPDATE products
         SET available_quantity = available_quantity + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [reservation.quantity, reservation.product_id]
      );
    }

    await client.query("COMMIT");

    return result.rows.length;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};


// Export Functions
module.exports = {
  createReservation,
  getAllReservations,
  getReservationById,
  confirmReservation,
  releaseReservation,
  expireReservations
};