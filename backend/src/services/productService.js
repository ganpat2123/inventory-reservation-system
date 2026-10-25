const pool = require("../config/db");

const createProduct = async (name, sku, totalQuantity) => {
  const query = `
    INSERT INTO products (
      name,
      sku,
      total_quantity,
      available_quantity
    )
    VALUES ($1, $2, $3, $3)
    RETURNING *
  `;

  const result = await pool.query(query, [
    name,
    sku,
    totalQuantity
  ]);

  return result.rows[0];
};

const getAllProducts = async () => {
  const result = await pool.query(
    "SELECT * FROM products ORDER BY created_at DESC"
  );

  return result.rows;
};

const getProductById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM products WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById
};