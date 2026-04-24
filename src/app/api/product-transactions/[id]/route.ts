import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { note } = await req.json();
  const tx = await prisma.productTransaction.update({
    where: { id: Number(id) },
    data: { note },
  });
  return NextResponse.json(tx);
}
