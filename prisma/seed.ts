import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 더 이상 기본 모델을 자동 생성하지 않음 (사용자가 직접 설정에서 추가)
const VARIANTS = ["Master", "Slave", "Center", "이동형"];
const PARTS: { name: string; unit: string }[] = [];

// 기존에 자동 생성된 레거시 모델 목록 (트랜잭션 없으면 삭제)
const LEGACY_MODELS = ["SG-100", "SG-200", "SG-300", "SG-400", "SG-500", "SG-600"];

async function main() {
  console.log("Seeding database...");

  // 레거시 모델 정리 (트랜잭션이 없는 경우에만 삭제)
  for (const modelName of LEGACY_MODELS) {
    const products = await prisma.product.findMany({
      where: { modelName },
      include: { transactions: true },
    });
    for (const product of products) {
      if (product.transactions.length === 0) {
        await prisma.productStock.deleteMany({ where: { productId: product.id } });
        await prisma.product.delete({ where: { id: product.id } });
      }
    }
  }

  // 모든 기존 모델에 누락된 파생모델 보완
  const existingProducts = await prisma.product.findMany({ select: { modelName: true, variant: true } });
  const existingSet = new Set(existingProducts.map(p => `${p.modelName}__${p.variant}`));
  const allModelNames = [...new Set(existingProducts.map(p => p.modelName))];

  for (const modelName of allModelNames) {
    for (const variant of VARIANTS) {
      if (!existingSet.has(`${modelName}__${variant}`)) {
        const product = await prisma.product.create({ data: { modelName, variant } });
        await prisma.productStock.upsert({
          where: { productId: product.id },
          update: {},
          create: { productId: product.id, quantity: 0 },
        });
      }
    }
  }

  for (const part of PARTS) {
    await prisma.part.upsert({
      where: { name: part.name },
      update: {},
      create: part,
    });
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
