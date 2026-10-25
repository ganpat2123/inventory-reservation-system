const reservationService = require("../services/reservationService");

// Create Reservation
const createReservation = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey || typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key header is required"
      });
    }

    if (idempotencyKey.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key is too long"
      });
    }

    if (
      !product_id ||
      typeof product_id !== "string" ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 2147483647
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID and positive whole number quantity are required"
      });
    }

    const reservation = await reservationService.createReservation(
      product_id,
      quantity,
      idempotencyKey
    );

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation
    });

  } catch (error) {
    next(error);
  }
};


// Get Reservation Details
const getReservationById = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservationById(
      req.params.id
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    next(error);
  }
};

// Get All Reservations With Filters
const getAllReservations = async (req, res, next) => {
  try {
    const { date, status, product_id, search } = req.query;

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "RELEASED",
      "EXPIRED"
    ];

    // Validate date: YYYY-MM-DD
    if (date !== undefined) {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res.status(400).json({
          success: false,
          message: "Date must be in YYYY-MM-DD format"
        });
      }

      const parsedDate = new Date(`${date}T00:00:00Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date"
        });
      }
    }

    // Validate status
    if (
      status !== undefined &&
      (
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation status"
      });
    }

    // Validate product ID
    if (
      product_id !== undefined &&
      (
        typeof product_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product_id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Validate search
    if (
      search !== undefined &&
      (
        typeof search !== "string" ||
        search.length > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Search must be a string of maximum 100 characters"
      });
    }

    // Fetch reservations
    const reservations = await reservationService.getAllReservations({
      date,
      status,
      productId: product_id,
      search: search?.trim()
    });

    return res.status(200).json({
      success: true,
      message: "Reservations retrieved successfully",
      data: reservations
    });

  } catch (error) {
    next(error);
  }
};


// Confirm Reservation
const confirmReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.confirmReservation(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Reservation confirmed successfully",
      data: reservation
    });

  } catch (error) {
    next(error);
  }
};


// Release Reservation
const releaseReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.releaseReservation(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Reservation processed successfully",
      data: reservation
    });

  } catch (error) {
    next(error);
  }
};


// Expire Old Pending Reservations
const expireReservations = async (req, res, next) => {
  try {
    const expiredCount = await reservationService.expireReservations();

    return res.status(200).json({
      success: true,
      message: "Expired reservations processed successfully",
      data: {
        expired_count: expiredCount
      }
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createReservation,
  getAllReservations,
  getReservationById,
  confirmReservation,
  releaseReservation,
  expireReservations
};