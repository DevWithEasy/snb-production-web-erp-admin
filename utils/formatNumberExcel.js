export default function formatNumberExcel(num,length) {
  const fixedString = Number(num || 0).toFixed(length);
  if (fixedString.endsWith('.00')) {
    return Number(Number(fixedString.split('.')[0]).toString());
  } else {
    return Number(fixedString);
  }
}
