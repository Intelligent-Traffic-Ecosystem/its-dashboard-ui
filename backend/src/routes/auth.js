const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

/**
 * @openapi
 * /api/auth/callback:
 *   get:
 *     summary: Exchange authorization code for tokens
 *     description: Handles the Keycloak callback, stores tokens in httpOnly cookies, and redirects to the correct dashboard.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code returned by Keycloak.
 *     responses:
 *       302:
 *         description: Redirects to the dashboard or back to the login app on failure.
 */
// GET /api/auth/callback?code=...
// Keycloak redirects here after user authenticates.
// Backend exchanges the code for tokens using the client secret (never exposed to browser).
router.get("/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.LOGIN_APP_URL}/?error=missing_code`);
  }

  const tokenUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

  let tokens;
  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET, // stays on the server
        redirect_uri: process.env.KEYCLOAK_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) throw new Error("token_exchange_failed");
    tokens = await tokenRes.json();
  } catch {
    return res.redirect(`${process.env.LOGIN_APP_URL}/?error=auth_failed`);
  }

  const { access_token, refresh_token } = tokens;

  // Decode JWT payload to read roles — full signature verify happens in auth middleware
  const payload = JSON.parse(
    Buffer.from(access_token.split(".")[1], "base64url").toString()
  );
  const roles = payload?.realm_access?.roles ?? [];
  const role = roles.includes("admin") ? "admin" : "operator";

  // Set tokens as httpOnly cookies — JS on the page cannot read these
  const isProd = process.env.NODE_ENV === "production";
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };

  res.cookie("access_token", access_token, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refresh_token, { ...cookieOpts, maxAge: 24 * 60 * 60 * 1000 });

  // Redirect browser to the correct dashboard based on role
  const destination =
    role === "admin"
      ? process.env.ADMIN_DASHBOARD_URL
      : process.env.TRAFFIC_DASHBOARD_URL;

  return res.redirect(destination);
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Clear auth cookies
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.json({ ok: true });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get authenticated user
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Valid session
 *       401:
 *         description: Missing or invalid cookie/token
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

module.exports = router;
