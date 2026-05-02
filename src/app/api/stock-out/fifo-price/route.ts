import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VIRTUAL_OUT_PARENT_ITEMS,
  isVirtualOutItemName,
  normalizeVirtualOutItemName,
} from "@/lib/virtual-out-models";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemIdParam = searchParams.get("itemId");
  const itemNameParam = searchParams.get("itemName");

  let targetItemId: number | null = null;

  if (itemIdParam) {
    const n = Number(itemIdParam);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "유효하지 않은 itemId" }, { status: 400 });
    }
    targetItemId = n;
  } else if (itemNameParam) {
    const found = await prisma.item.findUnique({ where: { name: itemNameParam }, select: { id: true } });
    if (!found) return NextResponse.json({ price: null });
    targetItemId = found.id;
  } else {
    return NextResponse.json({ error: "itemId 또는 itemName 필수" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: targetItemId }, select: { name: true } });
  if (!item) return NextResponse.json({ price: null });

  if (isVirtualOutItemName(item.name)) {
    const key = normalizeVirtualOutItemName(item.name);
    const parentName = VIRTUAL_OUT_PARENT_ITEMS[key]?.[0];
    if (parentName) {
      const parent = await prisma.item.findUnique({ where: { name: parentName }, select: { id: true } });
      if (parent) targetItemId = parent.id;
    }
  }

  const counter = await prisma.counter.findFirst({
    where: { itemId: targetItemId, status: "IN_STOCK" },
    orderBy: { seq: "asc" },
  });

  if (!counter) {
    const lastIn = await prisma.transaction.findFirst({
      where: { itemId: targetItemId, type: "IN" },
      orderBy: { date: "desc" },
      select: { price: true },
    });
    return NextResponse.json({ price: lastIn?.price ?? null });
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: counter.inTxId },
    select: { price: true },
  });

  return NextResponse.json({ price: tx?.price ?? null });
}
