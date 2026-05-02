import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fifoStockOut, currentStock } from "@/lib/fifo";
import {
  isVirtualOutItemName,
  normalizeVirtualOutItemName,
  VIRTUAL_OUT_PARENT_ITEMS,
} from "@/lib/virtual-out-models";

type CompanionMeta = { label: string };

function trimOrNull(s: unknown): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  return t.length ? t : null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { itemId, quantity, note, addon, price, date } = body;

  if (!itemId || !quantity || !date) {
    return NextResponse.json({ error: "itemId, quantity, date 필수" }, { status: 400 });
  }

  const qty = Number(quantity);
  const item = await prisma.item.findUnique({ where: { id: Number(itemId) } });
  if (!item) return NextResponse.json({ error: "품목을 찾을 수 없습니다." }, { status: 404 });

  const addonName = trimOrNull(addon);

  const companionSlots: CompanionMeta[] = [];
  if (addonName) companionSlots.push({ label: addonName });

  /** 품목명 → Item (입고 시 동일 이름으로 생성됨) */
  const slotsWithItem: { meta: CompanionMeta; itemRow: { id: number } }[] = [];
  for (const meta of companionSlots) {
    const row = await prisma.item.findUnique({ where: { name: meta.label } });
    if (!row) {
      return NextResponse.json(
        { error: `「${meta.label}」품목을 찾을 수 없습니다. 입고 등록 화면에서 추가모듈로 동일 이름으로 먼저 입고해 주세요.` },
        { status: 400 }
      );
    }
    slotsWithItem.push({ meta, itemRow: row });
  }

  /** 동일 입고 품목이 추가모듈에 동시에 지정되면 수량을 합산해 한 번만 출고 */
  const byItemId = new Map<number, { itemRow: { id: number }; metas: CompanionMeta[] }>();
  for (const row of slotsWithItem) {
    const id = row.itemRow.id;
    const prev = byItemId.get(id);
    if (!prev) {
      byItemId.set(id, { itemRow: row.itemRow, metas: [row.meta] });
    } else {
      prev.metas.push(row.meta);
    }
  }

  const virtual = isVirtualOutItemName(item.name);

  /** 가상 출고 시 FIFO 차감할 본체 품목 id (트랜잭션 안에서 순서대로 차감) */
  let virtualParentItemIds: number[] = [];

  if (virtual) {
    const key = normalizeVirtualOutItemName(item.name);
    const parentNames = VIRTUAL_OUT_PARENT_ITEMS[key];
    if (!parentNames?.length) {
      return NextResponse.json(
        { error: `가상 출고 모델「${item.name}」에 연결된 본체 품목 매핑이 없습니다.` },
        { status: 400 }
      );
    }
    for (const parentName of parentNames) {
      const parent = await prisma.item.findUnique({ where: { name: parentName } });
      if (!parent) {
        return NextResponse.json(
          { error: `본체 품목「${parentName}」을(를) 찾을 수 없습니다. 먼저 입고 등록해 주세요.` },
          { status: 400 }
        );
      }
      const s = await currentStock(parent.id);
      if (s < qty) {
        return NextResponse.json(
          { error: `「${parentName}」재고 부족: 현재 IN_STOCK ${s}개, 요청 ${qty}개` },
          { status: 400 }
        );
      }
      virtualParentItemIds.push(parent.id);
    }
  } else {
    const stock = await currentStock(Number(itemId));
    if (stock < qty) {
      return NextResponse.json(
        { error: `재고 부족: 현재 IN_STOCK ${stock}개, 요청 ${qty}개` },
        { status: 400 }
      );
    }
  }

  for (const [, { itemRow, metas }] of byItemId) {
    const need = qty * metas.length;
    const s = await currentStock(itemRow.id);
    if (s < need) {
      const label = metas.map((m) => m.label).join(" · ");
      return NextResponse.json(
        { error: `「${label}」재고 부족: 현재 IN_STOCK ${s}개, 동반 출고 필요 ${need}개(출고 수량 ${qty}×${metas.length})` },
        { status: 400 }
      );
    }
  }

  const noteStr = note && String(note).trim() ? String(note).trim() : null;

  try {
    const { mainTx, shippedCounters, companionShipped, virtualOut } = await prisma.$transaction(
      async (tx) => {
        const mainTx = await tx.transaction.create({
          data: {
            itemId: Number(itemId),
            type: "OUT",
            quantity: qty,
            note: noteStr,
            addon: addonName,
            price: price != null ? Number(price) : null,
            date: new Date(date),
          },
        });

        if (virtual) {
          for (const parentId of virtualParentItemIds) {
            await fifoStockOut(parentId, qty, mainTx.id, tx);
          }
        } else {
          await fifoStockOut(Number(itemId), qty, mainTx.id, tx);
        }

        const shippedMain = await tx.counter.findMany({
          where: { outTxId: mainTx.id },
          orderBy: { seq: "asc" },
        });

        const companionShipped: { name: string; seqFrom: number; seqTo: number }[] = [];

        for (const { itemRow, metas } of byItemId.values()) {
          const need = qty * metas.length;
          const addonLabels = metas.map((m) => m.label);
          const cTx = await tx.transaction.create({
            data: {
              itemId: itemRow.id,
              type: "OUT",
              quantity: need,
              note: null,
              addon: addonLabels[0] ?? null,
              price: null,
              date: new Date(date),
            },
          });
          await fifoStockOut(itemRow.id, need, cTx.id, tx);
          const shipped = await tx.counter.findMany({
            where: { outTxId: cTx.id },
            orderBy: { seq: "asc" },
          });
          if (shipped.length > 0) {
            const label =
              metas.length > 1 ? `${metas.map((m) => m.label).join(" + ")} (합산 ${need})` : metas[0].label;
            companionShipped.push({
              name: label,
              seqFrom: shipped[0].seq,
              seqTo: shipped[shipped.length - 1].seq,
            });
          }
        }

        return {
          mainTx,
          shippedCounters: shippedMain,
          companionShipped,
          virtualOut: virtual,
        };
      }
    );

    return NextResponse.json(
      {
        transaction: mainTx,
        shippedCounters,
        companionShipped,
        virtualOut,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("재고 부족")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    throw e;
  }
}
