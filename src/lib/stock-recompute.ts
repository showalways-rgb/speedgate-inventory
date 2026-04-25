import type { Prisma } from "@prisma/client";

/** 남아 있는 입출고 내역 합계로 제품 재고를 다시 맞춘다. */
export async function recomputeProductStock(
  tx: Prisma.TransactionClient,
  productId: number
) {
  const [ins, outs] = await Promise.all([
    tx.productTransaction.aggregate({
      where: { productId, type: "IN" },
      _sum: { quantity: true },
    }),
    tx.productTransaction.aggregate({
      where: { productId, type: "OUT" },
      _sum: { quantity: true },
    }),
  ]);
  const q = (ins._sum.quantity ?? 0) - (outs._sum.quantity ?? 0);
  await tx.productStock.upsert({
    where: { productId },
    create: { productId, quantity: Math.max(0, q) },
    update: { quantity: Math.max(0, q) },
  });
}

/** 남아 있는 입출고 내역 합계로 부품 재고를 다시 맞춘다. */
export async function recomputePartStock(tx: Prisma.TransactionClient, partId: number) {
  const [ins, outs] = await Promise.all([
    tx.partTransaction.aggregate({
      where: { partId, type: "IN" },
      _sum: { quantity: true },
    }),
    tx.partTransaction.aggregate({
      where: { partId, type: "OUT" },
      _sum: { quantity: true },
    }),
  ]);
  const q = (ins._sum.quantity ?? 0) - (outs._sum.quantity ?? 0);
  await tx.partStock.upsert({
    where: { partId },
    create: { partId, quantity: Math.max(0, q) },
    update: { quantity: Math.max(0, q) },
  });
}
