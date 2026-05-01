import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fifoStockOut, currentStock } from "@/lib/fifo";

export async function POST(req: Request) {
  const body = await req.json();
  const { itemId, quantity, note, addon, spec, price, date } = body;

  if (!itemId || !quantity || !date) {
    return NextResponse.json({ error: "itemId, quantity, date 필수" }, { status: 400 });
  }

  const qty = Number(quantity);
  const stock = await currentStock(Number(itemId));
  if (stock < qty) {
    return NextResponse.json(
      { error: `재고 부족: 현재 IN_STOCK ${stock}개, 요청 ${qty}개` },
      { status: 400 }
    );
  }

  const tx = await prisma.transaction.create({
    data: {
      itemId: Number(itemId),
      type: "OUT",
      quantity: qty,
      note: note || null,
      addon: addon || null,
      spec: spec || null,
      price: price != null ? Number(price) : null,
      date: new Date(date),
    },
  });

  await fifoStockOut(Number(itemId), qty, tx.id);

  const shippedCounters = await prisma.counter.findMany({
    where: { outTxId: tx.id },
    orderBy: { seq: "asc" },
  });

  return NextResponse.json({ transaction: tx, shippedCounters }, { status: 201 });
}
