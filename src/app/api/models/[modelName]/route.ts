import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ modelName: string }> }
) {
  try {
    const { modelName } = await params;
    const decoded = decodeURIComponent(modelName);

    const products = await prisma.product.findMany({
      where: { modelName: decoded },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);

    const txCount = await prisma.productTransaction.count({
      where: { productId: { in: productIds } },
    });
    if (txCount > 0) {
      return NextResponse.json(
        { error: `이 모델에 ${txCount}건의 거래 내역이 있어 삭제할 수 없습니다.` },
        { status: 409 }
      );
    }

    await prisma.productStock.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.product.deleteMany({ where: { modelName: decoded } });
    return NextResponse.json({ deleted: decoded });
  } catch {
    return NextResponse.json({ error: "모델 삭제 실패" }, { status: 500 });
  }
}
