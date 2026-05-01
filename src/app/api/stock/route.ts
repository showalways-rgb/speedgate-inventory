import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extraVirtualOutCountForItem,
  isVirtualOutItemName,
  VIRTUAL_OUT_CROSS_COUNT_SOURCES,
} from "@/lib/virtual-out-models";

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;

  const [crossSourceItems, items] = await Promise.all([
    prisma.item.findMany({
      where: { name: { in: [...VIRTUAL_OUT_CROSS_COUNT_SOURCES] } },
      select: { id: true, name: true },
    }),
    prisma.item.findMany({
      where: categoryId ? { subcategory: { categoryId } } : undefined,
      include: { subcategory: { include: { category: true } } },
      orderBy: { id: "asc" },
    }),
  ]);

  const crossIds = crossSourceItems.map((i) => i.id);
  const idToCrossName = Object.fromEntries(crossSourceItems.map((i) => [i.id, i.name])) as Record<
    number,
    (typeof VIRTUAL_OUT_CROSS_COUNT_SOURCES)[number]
  >;

  const itemIds = items.map((i) => i.id);

  const statsBySourceName: Record<string, { qty: number; txCount: number }> = {};

  const [crossOutGrouped, inGrouped, counterGrouped, outGrouped] = await Promise.all([
    crossIds.length > 0
      ? prisma.transaction.groupBy({
          by: ["itemId"],
          where: { type: "OUT", itemId: { in: crossIds } },
          _sum: { quantity: true },
          _count: { id: true },
        })
      : Promise.resolve([]),
    itemIds.length > 0
      ? prisma.transaction.groupBy({
          by: ["itemId"],
          where: { type: "IN", itemId: { in: itemIds } },
          _sum: { quantity: true },
        })
      : Promise.resolve([]),
    itemIds.length > 0
      ? prisma.counter.groupBy({
          by: ["itemId"],
          where: { itemId: { in: itemIds }, status: "IN_STOCK" },
          _count: { id: true },
        })
      : Promise.resolve([]),
    itemIds.length > 0
      ? prisma.transaction.groupBy({
          by: ["itemId"],
          where: { type: "OUT", itemId: { in: itemIds } },
          _sum: { quantity: true },
          _count: { id: true },
        })
      : Promise.resolve([]),
  ]);

  for (const row of crossOutGrouped) {
    const n = idToCrossName[row.itemId];
    if (!n) continue;
    statsBySourceName[n] = {
      qty: row._sum.quantity ?? 0,
      txCount: row._count.id,
    };
  }

  const totalInMap = new Map<number, number>();
  for (const row of inGrouped) {
    totalInMap.set(row.itemId, row._sum.quantity ?? 0);
  }

  const counterStockMap = new Map<number, number>();
  for (const row of counterGrouped) {
    counterStockMap.set(row.itemId, row._count.id);
  }

  const totalOutQtyMap = new Map<number, number>();
  const outCountMap = new Map<number, number>();
  for (const row of outGrouped) {
    totalOutQtyMap.set(row.itemId, row._sum.quantity ?? 0);
    outCountMap.set(row.itemId, row._count.id);
  }

  const result = items.map((item) => {
    const totalIn = totalInMap.get(item.id) ?? 0;
    const totalOutQty = totalOutQtyMap.get(item.id) ?? 0;
    const outCount = outCountMap.get(item.id) ?? 0;

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

    const counterStock = counterStockMap.get(item.id) ?? 0;
    const baseOut = totalIn - counterStock;
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
      currentStock: counterStock,
      virtualOut: false,
      outOrderCount: outCount + extraTxCount,
    };
  });

  return NextResponse.json(result);
}
