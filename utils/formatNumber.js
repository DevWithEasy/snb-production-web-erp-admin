export default function formatNumber(num) {
  const fixedString = Number(num || 0).toFixed(2);
  if (fixedString.endsWith('.00')) {
    return Number(fixedString.split('.')[0]).toString();
  } else {
    return fixedString;
  }
}
