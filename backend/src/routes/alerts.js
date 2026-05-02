const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createAlertsRouter({ alertService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  router.get(
    "/active",
    asyncHandler(async (req, res) => {
      res.json(await alertService.listActiveAlerts());
    })
  );

  router.post(
    "/:id/acknowledge",
    asyncHandler(async (req, res) => {
      res.json(alertService.acknowledge(req.params.id, req.user));
    })
  );

  return router;
}

module.exports = createAlertsRouter;
