const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createHealthRouter({ healthService }) {
  const router = express.Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const health = await healthService.getHealth();
      res.status(200).json(health);
    })
  );

  return router;
}

module.exports = createHealthRouter;
