import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemIdParam = searchParams.get("itemId");
  if (!itemIdParam) {
    return NextResponse.json({ error: "itemId 필수" }, { status: 400 });
  }

  const itemId = Number(itemIdParam);
  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "유효하지 않은 itemId" }, { status: 400 });
  }

  const counter = await prisma.counter.findFirst({
    where: { itemId, status: "IN_STOCK" },
    orderBy: { seq: "asc" },
  });

  if (!counter) {
    return NextResponse.json({ price: null });
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: counter.inTxId },
    select: { price: true },
  });

  return NextResponse.json({ price: tx?.price ?? null });
}
