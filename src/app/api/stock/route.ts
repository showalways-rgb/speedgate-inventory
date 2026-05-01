import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extraVirtualOutCountForItem,
  isVirtualOutItemName,
  VIRTUAL_OUT_CROSS_COUNT_SOURCES,
} from "@/lib/virtual-out-models";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;

  const crossSourceItems = await prisma.item.findMany({
    where: { name: { in: [...VIRTUAL_OUT_CROSS_COUNT_SOURCES] } },
    select: { id: true, name: true },
  });
  const crossIds = crossSourceItems.map((i) => i.id);
  const idToCrossName = Object.fromEntries(crossSourceItems.map((i) => [i.id, i.name])) as Record<
    number,
    (typeof VIRTUAL_OUT_CROSS_COUNT_SOURCES)[number]
  >;

  const statsBySourceName: Record<string, { qty: number; txCount: number }> = {};
  if (crossIds.length > 0) {
    const grouped = await prisma.transaction.groupBy({
      by: ["itemId"],
      where: { type: "OUT", itemId: { in: crossIds } },
      _sum: { quantity: true },
      _count: { id: true },
    });
    for (const row of grouped) {
      const n = idToCrossName[row.itemId];
      if (!n) continue;
      statsBySourceName[n] = {
        qty: row._sum.quantity ?? 0,
        txCount: row._count.id,
      };
    }
  }

  const items = await prisma.item.findMany({
    where: categoryId
      ? { subcategory: { categoryId } }
      : undefined,
    include: { subcategory: { include: { category: true } } },
    orderBy: { id: "asc" },
  });

  const result = await Promise.all(
    items.map(async (item) => {
      const [inAgg, counterStock, outAgg, outCount] = await Promise.all([
        prisma.transaction.aggregate({
          where: { itemId: item.id, type: "IN" },
          _sum: { quantity: true },
        }),
        prisma.counter.count({ where: { itemId: item.id, status: "IN_STOCK" } }),
        prisma.transaction.aggregate({
          where: { itemId: item.id, type: "OUT" },
          _sum: { quantity: true },
        }),
        prisma.transaction.count({ where: { itemId: item.id, type: "OUT" } }),
      ]);

      const totalIn = inAgg._sum.quantity ?? 0;
      const totalOutQty = outAgg._sum.quantity ?? 0;

      if (isVirtualOutItemName(item.name)) {
        const totalOut = totalOutQty;
        const currentStock = Math.max(0, totalIn - totalOut);
        return {
          itemId: item.id,
          itemName: item.name,
          subcategoryName: item.subcategory.name,
          categoryName: item.subcategory.category.name,
          categoryId: item.subcategory.categoryId,
          totalIn,
          totalOut,
          currentStock,
          virtualOut: true,
          outOrderCount: outCount,
        };
      }

      const currentStock = counterStock;
      const baseOut = totalIn - currentStock;
      const { extraQty, extraTxCount } = extraVirtualOutCountForItem(item.name, statsBySourceName);
      const totalOut = baseOut + extraQty;
      return {
        itemId: item.id,
        itemName: item.name,
        subcategoryName: item.subcategory.name,
        categoryName: item.subcategory.category.name,
        categoryId: item.subcategory.categoryId,
        totalIn,
        totalOut,
        currentStock,
        virtualOut: false,
        outOrderCount: outCount + extraTxCount,
      };
    })
  );

  return NextResponse.json(result);
}
