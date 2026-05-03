const { isValidIsoDate } = require("../utils/time");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "bad_request";
  error.publicMessage = message;
  return error;
}

function requireCameraId(query) {
  const cameraId = query.cameraId || query.camera_id;
  if (!cameraId || typeof cameraId !== "string") {
    throw badRequest("cameraId is required");
  }
  return cameraId;
}

function requireDateRange(query) {
  const from = query.from;
  const to = query.to;

  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    throw badRequest("from and to must be valid ISO 8601 timestamps");
  }

  if (Date.parse(from) > Date.parse(to)) {
    throw badRequest("from must be before to");
  }

  return { from, to };
}

module.exports = {
  requireCameraId,
  requireDateRange,
};
