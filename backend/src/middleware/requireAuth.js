const crypto = require("crypto");

let jwksCache = {
  fetchedAt: 0,
  keys: [],
};

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function parseJwt(token) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("invalid_token_format");
  }

  const header = JSON.parse(base64UrlDecode(parts[0]).toString("utf8"));
  const payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf8"));

  return {
    header,
    payload,
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: parts[2],
  };
}

async function getKeycloakJwks() {
  const now = Date.now();
  const cacheAgeMs = 10 * 60 * 1000;

  if (jwksCache.keys.length > 0 && now - jwksCache.fetchedAt < cacheAgeMs) {
    return jwksCache.keys;
  }

  const jwksUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`;
  const response = await fetch(jwksUrl);

  if (!response.ok) {
    throw new Error("jwks_fetch_failed");
  }

  const data = await response.json();
  jwksCache = {
    fetchedAt: now,
    keys: Array.isArray(data.keys) ? data.keys : [],
  };

  return jwksCache.keys;
}

function verifyJwtSignature(tokenParts, jwk) {
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signature = base64UrlDecode(tokenParts.signature);

  return crypto.verify(
    "RSA-SHA256",
    Buffer.from(tokenParts.signingInput),
    publicKey,
    signature
  );
}

function getAudience(payload) {
  if (Array.isArray(payload.aud)) return payload.aud;
  if (typeof payload.aud === "string") return [payload.aud];
  return [];
}

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

function setAuthCookies(res, tokens) {
  const cookieOpts = getCookieOptions();

  res.cookie("access_token", tokens.access_token, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000,
  });

  if (tokens.refresh_token) {
    res.cookie("refresh_token", tokens.refresh_token, {
      ...cookieOpts,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

async function refreshTokens(refreshToken) {
  const tokenUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("refresh_failed");
  }

  return tokenRes.json();
}

async function validateAccessToken(token) {
  const tokenParts = parseJwt(token);
  const keys = await getKeycloakJwks();
  const jwk = keys.find((key) => key.kid === tokenParts.header.kid);

  if (!jwk) {
    throw new Error("unknown_signing_key");
  }

  const validSignature = verifyJwtSignature(tokenParts, jwk);

  if (!validSignature) {
    throw new Error("invalid_signature");
  }

  const issuer = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;
  const audience = getAudience(tokenParts.payload);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (tokenParts.payload.iss !== issuer) {
    throw new Error("invalid_issuer");
  }

  if (typeof tokenParts.payload.exp !== "number" || tokenParts.payload.exp <= nowSeconds) {
    throw new Error("token_expired");
  }

  // Keycloak access tokens may carry the client ID in the `aud` array, in `azp` (authorized
  // party), or both. Accept the token if either claim matches the expected client ID; reject
  // it if neither is present or if neither matches.
  const expectedClientId = process.env.KEYCLOAK_CLIENT_ID;
  const audienceValid =
    audience.includes(expectedClientId) ||
    tokenParts.payload.azp === expectedClientId;

  if (!audienceValid) {
    throw new Error("invalid_audience");
  }

  return tokenParts.payload;
}

async function requireAuth(req, res, next) {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    req.user = {
      sub: "dev-user",
      preferred_username: "dev_operator",
      email: "dev@its.local",
      realm_access: { roles: ["admin", "operator"] },
    };
    return next();
  }

  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  try {
    if (!accessToken) {
      if (!refreshToken) {
        return res.status(401).json({ error: "missing_access_token" });
      }

      const refreshedTokens = await refreshTokens(refreshToken);
      setAuthCookies(res, refreshedTokens);
      req.user = await validateAccessToken(refreshedTokens.access_token);
      return next();
    }

    try {
      req.user = await validateAccessToken(accessToken);
      return next();
    } catch (error) {
      if (error.message !== "token_expired") {
        clearAuthCookies(res);
        return res.status(401).json({ error: error.message || "unauthorized" });
      }
    }

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "token_expired" });
    }

    const refreshedTokens = await refreshTokens(refreshToken);
    setAuthCookies(res, refreshedTokens);
    req.user = await validateAccessToken(refreshedTokens.access_token);
    return next();
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "unauthorized" });
  }
}

module.exports = requireAuth;
