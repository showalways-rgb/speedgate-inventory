import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCounters } from "@/lib/fifo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId") ? Number(searchParams.get("itemId")) : undefined;
  const type = searchParams.get("type") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(itemId ? { itemId } : {}),
      ...(type ? { type } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
            },
          }
        : {}),
    },
    include: {
      item: { include: { subcategory: { include: { category: true } } } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { itemId, quantity, note, addon, spec, date } = body;

  if (!itemId || !quantity || !date) {
    return NextResponse.json({ error: "itemId, quantity, date 필수" }, { status: 400 });
  }

  const tx = await prisma.transaction.create({
    data: {
      itemId: Number(itemId),
      type: "IN",
      quantity: Number(quantity),
      note: note || null,
      addon: addon || null,
      spec: spec || null,
      date: new Date(date),
    },
  });

  await createCounters(Number(itemId), Number(quantity), tx.id);

  const counters = await prisma.counter.findMany({
    where: { inTxId: tx.id },
    orderBy: { seq: "asc" },
  });

  return NextResponse.json({ transaction: tx, counters }, { status: 201 });
}
