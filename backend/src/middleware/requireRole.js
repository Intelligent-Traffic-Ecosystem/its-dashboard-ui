function getRoles(user) {
  return user?.realm_access?.roles || user?.roles || [];
}

function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    const roles = getRoles(req.user);
    const hasRole = allowedRoles.some((role) => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: "forbidden" });
    }

    return next();
  };
}

module.exports = requireRole;
