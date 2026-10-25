const errorHandler = (error, req, res, next) => {

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Duplicate value already exists"
    });
  }

  if (error.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  if (error.code === "23514" || error.code === "22003") {
    return res.status(400).json({
      success: false,
      message: "Invalid quantity or data"
    });
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });

};

module.exports = errorHandler;