const NURSE_APP_ROLES = new Set(["nurse", "caregiver"]);

function requireNurseAppRole(req, res, next) {
  const role = String(req.user?.role || "").toLowerCase();

  if (!NURSE_APP_ROLES.has(role)) {
    return res.status(403).json({
      message: "This action is available only to nurse or caregiver accounts.",
    });
  }

  next();
}

module.exports = { requireNurseAppRole, NURSE_APP_ROLES };
