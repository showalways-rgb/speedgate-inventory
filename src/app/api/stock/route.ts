import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;

  const items = await prisma.item.findMany({
    where: categoryId
      ? { subcategory: { categoryId } }
      : undefined,
    include: { subcategory: { include: { category: true } } },
    orderBy: { id: "asc" },
  });

  const result = await Promise.all(
    items.map(async (item) => {
      const [inAgg, currentStock] = await Promise.all([
        prisma.transaction.aggregate({
          where: { itemId: item.id, type: "IN" },
          _sum: { quantity: true },
        }),
        prisma.counter.count({ where: { itemId: item.id, status: "IN_STOCK" } }),
      ]);
      const totalIn = inAgg._sum.quantity ?? 0;
      const totalOut = totalIn - currentStock;
      return {
        itemId: item.id,
        itemName: item.name,
        subcategoryName: item.subcategory.name,
        categoryName: item.subcategory.category.name,
        categoryId: item.subcategory.categoryId,
        totalIn,
        totalOut,
        currentStock,
      };
    })
  );

  return NextResponse.json(result);
}
