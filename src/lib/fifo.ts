import { prisma } from "./prisma";

/** 트랜잭션 내부 `tx` 또는 기본 클라이언트 */
export type CounterDb = Pick<typeof prisma, "counter">;

export async function fifoStockOut(
  itemId: number,
  quantity: number,
  txId: number,
  db: CounterDb = prisma
): Promise<void> {
  const available = await db.counter.findMany({
    where: { itemId, status: "IN_STOCK" },
    orderBy: { seq: "asc" },
    take: quantity,
  });

  if (available.length < quantity) {
    throw new Error(`재고 부족: 현재 IN_STOCK ${available.length}개, 요청 ${quantity}개`);
  }

  await db.counter.updateMany({
    where: { id: { in: available.map((c) => c.id) } },
    data: { status: "SHIPPED", outTxId: txId },
  });
}

export async function currentStock(itemId: number, db: CounterDb = prisma): Promise<number> {
  return db.counter.count({ where: { itemId, status: "IN_STOCK" } });
}

export async function getNextSeq(itemId: number, db: CounterDb = prisma): Promise<number> {
  const last = await db.counter.findFirst({
    where: { itemId },
    orderBy: { seq: "desc" },
  });
  return (last?.seq ?? 0) + 1;
}

export async function createCounters(
  itemId: number,
  quantity: number,
  txId: number,
  db: CounterDb = prisma
): Promise<void> {
  const nextSeq = await getNextSeq(itemId, db);
  const data = Array.from({ length: quantity }, (_, i) => ({
    itemId,
    seq: nextSeq + i,
    status: "IN_STOCK",
    inTxId: txId,
  }));
  await db.counter.createMany({ data });
}
