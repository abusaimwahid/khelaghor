const action = process.argv[2] ?? "prepare";
const dryRun = process.argv.includes("--dry-run") || process.env.STAGING_ALLOW_MUTATIONS !== "true";
if (process.env.APP_ENV !== "staging") {
  console.error("Staging fixtures refused: APP_ENV must be staging.");
  process.exit(2);
}
if (action === "cleanup" && dryRun) {
  console.log("Staging fixture cleanup dry-run: no records changed.");
  process.exit(0);
}
if (action === "prepare" && dryRun) {
  console.log("Staging fixture preparation dry-run: no records changed.");
  process.exit(0);
}
console.error("Staging fixture mutations are not implemented in this safe harness.");
process.exit(2);
