import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCounters } from "@/lib/fifo";

// 추가모듈/세부사양을 독립 품목으로 입고 등록
// 카테고리: "추가모듈" 또는 "세부사양"
// 해당 카테고리/소분류/아이템 없으면 자동 생성 (upsert)
export async function POST(req: Request) {
  const { categoryName, value, date, quantity, price, note } = await req.json();

  if (!categoryName || !value || !date || !quantity) {
    return NextResponse.json({ error: "categoryName, value, date, quantity 필수" }, { status: 400 });
  }

  // 카테고리 upsert
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });

  // 소분류 upsert (name = "")
  const subcategory = await prisma.subcategory.upsert({
    where: { categoryId_name: { categoryId: category.id, name: "" } },
    update: {},
    create: { name: "", categoryId: category.id },
  });

  // 아이템 upsert
  const item = await prisma.item.upsert({
    where: { name: value },
    update: {},
    create: { name: value, unit: "EA", subcategoryId: subcategory.id },
  });

  const tx = await prisma.transaction.create({
    data: {
      itemId: item.id,
      type: "IN",
      quantity: Number(quantity),
      price: price != null ? Number(price) : null,
      note: note || null,
      date: new Date(date),
    },
  });

  await createCounters(item.id, Number(quantity), tx.id);

  const counters = await prisma.counter.findMany({
    where: { inTxId: tx.id },
    orderBy: { seq: "asc" },
  });

  return NextResponse.json({ transaction: tx, counters }, { status: 201 });
}
