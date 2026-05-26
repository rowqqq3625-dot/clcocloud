/**
 * Print today's 4-digit admin gate code (MMDD in KST).
 *
 * Usage:
 *   node scripts/admin-today-code.cjs
 *   node scripts/admin-today-code.cjs --next 7   # print next 7 days too
 */
function mmddInKst(date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return { day: `${y}-${m}-${d}`, code: `${m}${d}` };
}

function main() {
  const args = process.argv.slice(2);
  let nextDays = 0;
  const nIdx = args.indexOf("--next");
  if (nIdx !== -1 && args[nIdx + 1]) {
    nextDays = Math.max(0, Math.min(30, Number(args[nIdx + 1]) || 0));
  }
  const now = new Date();
  console.log("KST date         | code");
  console.log("-----------------+------");
  for (let i = 0; i <= nextDays; i++) {
    const at = new Date(now.getTime() + i * 86400000);
    const { day, code } = mmddInKst(at);
    console.log(day.padEnd(16), "|", code);
  }
}

main();
