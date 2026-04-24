import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODELS = ["SG-100", "SG-200", "SG-300", "SG-400", "SG-500", "SG-600"];
const VARIANTS = ["Master", "Slave", "Center"];
const PARTS: { name: string; unit: string }[] = [];

async function main() {
  console.log("Seeding database...");

  for (const part of PARTS) {
    await prisma.part.upsert({
      where: { name: part.name },
      update: {},
      create: part,
    });
  }

  for (const modelName of MODELS) {
    for (const variant of VARIANTS) {
      await prisma.product.upsert({
        where: { modelName_variant: { modelName, variant } },
        update: {},
        create: { modelName, variant },
      });
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
