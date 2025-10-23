export default function getPeriodPath(period) {
  if (!period) return;
  return period
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .join("_");
}
