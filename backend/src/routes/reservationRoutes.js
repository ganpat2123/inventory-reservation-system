
const express = require("express");
const router = express.Router();

const reservationController = require("../controllers/reservationController");

/**
 * @swagger
 * tags:
 *   - name: Reservations
 *     description: Manage inventory reservations
 */

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     description: Reserve product stock for 10 minutes. Supports idempotency.
 *     tags: [Reservations]
 *     security:
 *       - IdempotencyKey: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique key for a reservation attempt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Reservation created or existing reservation returned
 *       400:
 *         description: Invalid quantity, product ID or missing idempotency key
 *       404:
 *         description: Product not found
 *       409:
 *         description: Insufficient stock or idempotency conflict
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations
 *     description: |
 *       Retrieve reservation history with product details.
 *       Filter by creation date, status, product ID, or product name/SKU.
 *       All filters are optional and can be combined.
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         description: Filter by reservation creation date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-10-25"
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter reservations by status
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING
 *             - CONFIRMED
 *             - RELEASED
 *             - EXPIRED
 *       - in: query
 *         name: product_id
 *         required: false
 *         description: Filter reservations by product UUID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         required: false
 *         description: Search by product name or SKU
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: Samsung
 *     responses:
 *       200:
 *         description: Reservations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Reservations retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Reservation'
 *                       - type: object
 *                         properties:
 *                           product_name:
 *                             type: string
 *                           product_sku:
 *                             type: string
 *       400:
 *         description: Invalid date, status, product ID or search
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reservations/expire:
 *   post:
 *     summary: Expire old pending reservations
 *     description: Expire pending reservations past their expiry time and restore stock.
 *     tags: [Reservations]
 *     responses:
 *       200:
 *         description: Expired reservations processed successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation details
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation details retrieved
 *       400:
 *         description: Invalid reservation ID
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reservations/{id}/confirm:
 *   post:
 *     summary: Confirm a pending reservation
 *     description: Confirm reservation without deducting stock again.
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation confirmed successfully
 *       400:
 *         description: Invalid reservation ID
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Reservation expired or cannot be confirmed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/reservations/{id}/release:
 *   post:
 *     summary: Release a pending reservation
 *     description: Release reserved stock back to the available inventory.
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation released or expired
 *       400:
 *         description: Invalid reservation ID
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Reservation cannot be released
 *       500:
 *         description: Internal server error
 */

// Expire Reservations
router.post("/expire", reservationController.expireReservations);

// Create Reservation
router.post("/", reservationController.createReservation);

// Get All Reservations With Filters
router.get("/", reservationController.getAllReservations);

// Get Reservation Details
router.get("/:id", reservationController.getReservationById);

// Confirm Reservation
router.post("/:id/confirm", reservationController.confirmReservation);

// Release Reservation
router.post("/:id/release", reservationController.releaseReservation);

module.exports = router;
