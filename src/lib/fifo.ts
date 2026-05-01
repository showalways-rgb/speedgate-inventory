import { prisma } from "./prisma";

export async function fifoStockOut(
  itemId: number,
  quantity: number,
  txId: number
): Promise<void> {
  const available = await prisma.counter.findMany({
    where: { itemId, status: "IN_STOCK" },
    orderBy: { seq: "asc" },
    take: quantity,
  });

  if (available.length < quantity) {
    throw new Error(`재고 부족: 현재 IN_STOCK ${available.length}개, 요청 ${quantity}개`);
  }

  await prisma.counter.updateMany({
    where: { id: { in: available.map((c) => c.id) } },
    data: { status: "SHIPPED", outTxId: txId },
  });
}

export async function currentStock(itemId: number): Promise<number> {
  return prisma.counter.count({ where: { itemId, status: "IN_STOCK" } });
}

export async function getNextSeq(itemId: number): Promise<number> {
  const last = await prisma.counter.findFirst({
    where: { itemId },
    orderBy: { seq: "desc" },
  });
  return (last?.seq ?? 0) + 1;
}

export async function createCounters(
  itemId: number,
  quantity: number,
  txId: number
): Promise<void> {
  const nextSeq = await getNextSeq(itemId);
  const data = Array.from({ length: quantity }, (_, i) => ({
    itemId,
    seq: nextSeq + i,
    status: "IN_STOCK",
    inTxId: txId,
  }));
  await prisma.counter.createMany({ data });
}
