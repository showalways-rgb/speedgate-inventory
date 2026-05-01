import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;
  const options = await prisma.addonOption.findMany({
    where: type ? { type } : undefined,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(options);
}

export async function POST(req: Request) {
  const { type, value } = await req.json();
  if (!type || !value) {
    return NextResponse.json({ error: "type, value 필수" }, { status: 400 });
  }
  const maxOrder = await prisma.addonOption.aggregate({
    where: { type },
    _max: { order: true },
  });
  const option = await prisma.addonOption.create({
    data: { type, value, order: (maxOrder._max.order ?? 0) + 1 },
  });
  return NextResponse.json(option, { status: 201 });
}
