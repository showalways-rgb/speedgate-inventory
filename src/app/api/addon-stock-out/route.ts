import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fifoStockOut, currentStock } from "@/lib/fifo";

export async function POST(req: Request) {
  const { categoryName, value, date, quantity, price, note } = await req.json();

  if (!categoryName || !value || !date || !quantity) {
    return NextResponse.json({ error: "categoryName, value, date, quantity 필수" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { name: value } });
  if (!item) {
    return NextResponse.json({ error: `"${value}" 품목의 입고 내역이 없습니다.` }, { status: 400 });
  }

  const qty = Number(quantity);
  const stock = await currentStock(item.id);
  if (stock < qty) {
    return NextResponse.json({ error: `재고 부족: 현재고 ${stock}개, 요청 ${qty}개` }, { status: 400 });
  }

  const tx = await prisma.transaction.create({
    data: {
      itemId: item.id,
      type: "OUT",
      quantity: qty,
      price: price != null ? Number(price) : null,
      note: note || null,
      date: new Date(date),
    },
  });

  await fifoStockOut(item.id, qty, tx.id);

  const shippedCounters = await prisma.counter.findMany({
    where: { outTxId: tx.id },
    orderBy: { seq: "asc" },
  });

  return NextResponse.json({ transaction: tx, shippedCounters }, { status: 201 });
}
