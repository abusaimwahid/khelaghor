import { prisma } from "../src/server/db";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection ok.");
}

main()
  .catch((error) => {
    console.error("Database connection failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
