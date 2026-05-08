const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} configuration`);
  }
  return value;
}

/**
 * Decodes the payload of a JWT without verifying the signature.
 * Returns null if the token is malformed. Callers must treat a null result as an auth failure.
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch (err) {
    console.error("JWT payload decode failed:", err.message);
    return null;
  }
}

/**
 * @openapi
 * /api/auth/begin:
 *   get:
 *     summary: Initiate Keycloak login
 *     description: Generates a CSRF state token, stores it in a short-lived httpOnly cookie, and redirects the browser to the Keycloak authorization endpoint.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to Keycloak authorization page.
 *       500:
 *         description: Authentication provider configuration error.
 */
// GET /api/auth/begin
// Generates state + nonce, persists them as httpOnly cookies, then redirects to Keycloak.
// In dev bypass mode, skip Keycloak entirely and use the dev-login shortcut.
router.get("/begin", (req, res) => {
  try {
    if (process.env.DEV_BYPASS_AUTH === "true") {
      return res.redirect(getRequiredEnv("DEV_LOGIN_REDIRECT_PATH"));
    }
    const state = crypto.randomBytes(32).toString("hex");
    const nonce = crypto.randomBytes(32).toString("hex");

    const isProd = process.env.NODE_ENV === "production";
    const stateCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000, // 10 minutes
    };

    res.cookie("oauth_state", state, stateCookieOpts);
    res.cookie("oauth_nonce", nonce, stateCookieOpts);

    const authUrl = new URL(
      `${getRequiredEnv("KEYCLOAK_URL")}/realms/${getRequiredEnv("KEYCLOAK_REALM")}/protocol/openid-connect/auth`
    );
    authUrl.searchParams.set("client_id", getRequiredEnv("KEYCLOAK_CLIENT_ID"));
    authUrl.searchParams.set("redirect_uri", getRequiredEnv("KEYCLOAK_REDIRECT_URI"));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);

    return res.redirect(authUrl.toString());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: CSRF state token that must match the oauth_state cookie.
 *     responses:
 *       302:
 *         description: Redirects to the dashboard or back to the login app on failure.
 */
// GET /api/auth/callback?code=...&state=...
// Keycloak redirects here after user authenticates.
// Backend validates state, then exchanges the code for tokens using the client secret (never exposed to browser).
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;
  const storedNonce = req.cookies?.oauth_nonce;

  // Clear CSRF cookies regardless of outcome
  res.clearCookie("oauth_state", { path: "/" });
  res.clearCookie("oauth_nonce", { path: "/" });

  if (!code) {
    return res.redirect(`${process.env.LOGIN_APP_URL}/?error=missing_code`);
  }

  if (!state || !storedState || state !== storedState) {
    return res.redirect(`${process.env.LOGIN_APP_URL}/?error=invalid_state`);
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

  const { access_token, refresh_token, id_token } = tokens;

  // Validate nonce in the ID token to prevent replay attacks.
  // Fail if id_token is present but storedNonce is missing (could indicate cookie tampering).
  if (id_token) {
    if (!storedNonce) {
      return res.redirect(`${process.env.LOGIN_APP_URL}/?error=invalid_nonce`);
    }
    const idPayload = decodeJwtPayload(id_token);
    if (!idPayload) {
      return res.redirect(`${process.env.LOGIN_APP_URL}/?error=invalid_token`);
    }
    if (idPayload.nonce !== storedNonce) {
      return res.redirect(`${process.env.LOGIN_APP_URL}/?error=invalid_nonce`);
    }
  }

  // Validate access_token is present and looks like a JWT before decoding
  const payload = decodeJwtPayload(access_token);
  if (!payload) {
    return res.redirect(`${process.env.LOGIN_APP_URL}/?error=invalid_token`);
  }

  // Decode JWT payload to read roles — full signature verify happens in auth middleware
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
  if (refresh_token) {
    res.cookie("refresh_token", refresh_token, { ...cookieOpts, maxAge: 24 * 60 * 60 * 1000 });
  }

  // Redirect browser to the correct dashboard based on role
  const destination =
    role === "admin"
      ? process.env.ADMIN_DASHBOARD_URL
      : process.env.TRAFFIC_DASHBOARD_URL;

  return res.redirect(destination);
});

/**
 * @openapi
 * /api/auth/dev-login:
 *   get:
 *     summary: Create a local development session
 *     description: Only available when DEV_BYPASS_AUTH=true. Sets a development auth cookie and redirects to the traffic dashboard.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Development auth cookie was set and the browser is redirected.
 *       404:
 *         description: Development bypass is disabled.
 */
// GET /api/auth/dev-login  — DEVELOPMENT ONLY, bypasses Keycloak entirely
// Only active when DEV_BYPASS_AUTH=true; returns 404 in production.
router.get("/dev-login", (req, res) => {
  try {
    if (process.env.DEV_BYPASS_AUTH !== "true") {
      return res.status(404).json({ error: "not_found" });
    }

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", "dev-bypass-token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    return res.redirect(getRequiredEnv("DEV_LOGIN_DASHBOARD_URL"));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and redirect to Keycloak logout
 *     description: Clears auth cookies and initiates Keycloak logout flow
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout initiated, client should redirect to logout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 logoutUrl:
 *                   type: string
 *                   description: URL to redirect for Keycloak logout
 */
// POST /api/auth/logout
router.post("/logout", (req, res) => {
  // Clear auth cookies
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("oauth_state", { path: "/" });
  res.clearCookie("oauth_nonce", { path: "/" });

  // Build Keycloak logout URL with redirect back to login app
  let logoutUrl;
  if (process.env.DEV_BYPASS_AUTH === "true") {
    // In dev bypass mode, just redirect to login app
    logoutUrl = `${process.env.LOGIN_APP_URL || "http://localhost:3003"}`;
  } else {
    // In production, use Keycloak logout endpoint
    const keycloakLogoutUrl = new URL(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`
    );
    keycloakLogoutUrl.searchParams.set(
      "redirect_uri",
      `${process.env.LOGIN_APP_URL || "http://localhost:3003"}`
    );
    logoutUrl = keycloakLogoutUrl.toString();
  }

  res.json({ 
    ok: true,
    logoutUrl: logoutUrl
  });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get authenticated user
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Valid session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSession'
 *       401:
 *         description: Missing or invalid cookie/token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

module.exports = router;
