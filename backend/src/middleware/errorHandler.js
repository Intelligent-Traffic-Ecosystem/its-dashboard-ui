function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  const safeStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;

  res.status(safeStatus).json({
    error: err.code || (safeStatus === 500 ? "internal_error" : "request_failed"),
    message: err.publicMessage || "Request could not be completed",
  });
}

module.exports = errorHandler;
