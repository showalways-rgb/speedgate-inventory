import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VARIANTS = ["Master", "Slave", "Center", "이동형"];

// 모든 기존 모델에 누락된 파생모델(이동형 등)을 자동 생성
export async function POST() {
  try {
    const existing = await prisma.product.findMany({
      select: { modelName: true, variant: true },
    });

    const existingSet = new Set(existing.map(p => `${p.modelName}__${p.variant}`));
    const modelNames = [...new Set(existing.map(p => p.modelName))];

    for (const modelName of modelNames) {
      for (const variant of VARIANTS) {
        const key = `${modelName}__${variant}`;
        if (!existingSet.has(key)) {
          const product = await prisma.product.create({
            data: { modelName, variant },
          });
          await prisma.productStock.upsert({
            where: { productId: product.id },
            update: {},
            create: { productId: product.id, quantity: 0 },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "파생모델 보완 실패" }, { status: 500 });
  }
}
