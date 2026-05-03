function isValidIsoDate(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isStale(isoDate, staleAfterSeconds) {
  if (!isValidIsoDate(isoDate)) return true;
  return Date.now() - Date.parse(isoDate) > staleAfterSeconds * 1000;
}

function toIsoOrNull(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

module.exports = {
  isValidIsoDate,
  isStale,
  toIsoOrNull,
};
