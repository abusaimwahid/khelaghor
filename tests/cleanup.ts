import { bootstrapTestDatabase } from "./bootstrap";
import { resetTestDatabaseSchema } from "./setup-db";

export async function resetAndBootstrapTestDatabase() {
  await resetTestDatabaseSchema();
  await bootstrapTestDatabase();
}
