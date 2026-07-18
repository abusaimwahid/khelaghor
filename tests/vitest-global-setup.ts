import { resetAndBootstrapTestDatabase } from "./cleanup";

export default async function setup() {
  await resetAndBootstrapTestDatabase();
}
