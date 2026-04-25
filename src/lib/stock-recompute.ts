import type { Prisma } from "@prisma/client";

/** 현재 DB에 쌓인 입출고만으로 계산한 제품 재고(대). */
export async function getComputedProductQty(
  tx: Prisma.TransactionClient,
  productId: number
): Promise<number> {
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
  return Math.max(0, (ins._sum.quantity ?? 0) - (outs._sum.quantity ?? 0));
}

/** 남아 있는 입출고 내역 합계로 제품 재고를 다시 맞춘다. */
export async function recomputeProductStock(
  tx: Prisma.TransactionClient,
  productId: number
) {
  const q = await getComputedProductQty(tx, productId);
  await tx.productStock.upsert({
    where: { productId },
    create: { productId, quantity: q },
    update: { quantity: q },
  });
}

/** 현재 DB에 쌓인 입출고만으로 계산한 부품 재고. */
export async function getComputedPartQty(tx: Prisma.TransactionClient, partId: number): Promise<number> {
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
  return Math.max(0, (ins._sum.quantity ?? 0) - (outs._sum.quantity ?? 0));
}

/** 남아 있는 입출고 내역 합계로 부품 재고를 다시 맞춘다. */
export async function recomputePartStock(tx: Prisma.TransactionClient, partId: number) {
  const q = await getComputedPartQty(tx, partId);
  await tx.partStock.upsert({
    where: { partId },
    create: { partId, quantity: q },
    update: { quantity: q },
  });
}
