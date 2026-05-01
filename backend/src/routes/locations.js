const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

/**
 * @openapi
 * /api/locations:
 *   get:
 *     summary: Get all map pin locations
 *     description: Returns incidents, sensors, CCTV nodes, and construction zones for the live map.
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of location pins
 */
router.get("/", requireAuth, (req, res) => {
  // TODO: replace with real DB/Kafka query
  const locations = [
    {
      id: "INC-001",
      type: "incident",
      severity: "critical",
      lat: 6.0248,
      lng: 80.2172,
      title: "Galle Fort Junction Collision",
      description: "Vehicle pile-up affecting southbound flow. Emergency services on site.",
      status: "active",
      timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
      details: { lanesAffected: "3 of 4", delayMinutes: 42 },
    },
    {
      id: "INC-002",
      type: "incident",
      severity: "warning",
      lat: 6.0545,
      lng: 80.2209,
      title: "Jungle Beach Road Obstruction",
      description: "Broken-down vehicle blocking left lane. Tow truck dispatched.",
      status: "active",
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      details: { lanesAffected: "1 of 2", delayMinutes: 12 },
    },
    {
      id: "CON-001",
      type: "construction",
      severity: "info",
      lat: 6.0182,
      lng: 80.2477,
      title: "Unawatuna Road Widening",
      description: "Ongoing road widening project. Expect reduced speed zones.",
      status: "ongoing",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
      details: { lanesAffected: "1 of 2", delayMinutes: 5 },
    },
    {
      id: "SEN-001",
      type: "sensor",
      severity: "info",
      lat: 6.0358,
      lng: 80.2291,
      title: "Traffic Sensor Node #14",
      description: "Active loop detector. Currently monitoring volume and speed.",
      status: "online",
      timestamp: new Date().toISOString(),
      details: { volumePerHour: 1240, avgSpeedKmh: 47 },
    },
    {
      id: "SEN-002",
      type: "sensor",
      severity: "info",
      lat: 6.042,
      lng: 80.235,
      title: "Traffic Sensor Node #22",
      description: "Active loop detector. High volume detected.",
      status: "online",
      timestamp: new Date().toISOString(),
      details: { volumePerHour: 2100, avgSpeedKmh: 28 },
    },
    {
      id: "CCTV-001",
      type: "cctv",
      severity: "info",
      lat: 6.0283,
      lng: 80.2152,
      title: "CCTV CAM-07",
      description: "HD surveillance camera. Live feed available.",
      status: "online",
      timestamp: new Date().toISOString(),
      details: { resolution: "1080p", fov: "180°" },
    },
  ];

  res.json(locations);
});

module.exports = router;
