import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "query 필수" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI 검색 기능이 비활성화되어 있습니다." }, { status: 503 });

  // DB 데이터 수집 (컨텍스트 구성)
  const [transactions, items] = await Promise.all([
    prisma.transaction.findMany({
      include: { item: { include: { subcategory: { include: { category: true } } } } },
      orderBy: { date: "desc" },
      take: 500,
    }),
    prisma.item.findMany({
      include: { subcategory: { include: { category: true } } },
    }),
  ]);

  const stockSummary = await Promise.all(
    items.map(async (item) => {
      const stock = await prisma.counter.count({ where: { itemId: item.id, status: "IN_STOCK" } });
      return `${item.name}(${item.subcategory.category.name}): 현재고 ${stock}`;
    })
  );

  const txSummary = transactions.map((t) =>
    `[${t.date.toISOString().slice(0, 10)}] ${t.item.name} ${t.type === "IN" ? "입고" : "출고"} ${t.quantity}대 현장:${t.note ?? "-"}`
  ).join("\n");

  const systemPrompt = `당신은 스피드게이트 재고관리 시스템의 AI 검색 도우미입니다.
아래 재고 현황과 입출고 내역 데이터를 기반으로 사용자 질문에 정확하게 답하세요.
데이터 범위를 벗어난 질문에는 "데이터에 없는 정보입니다."라고 답하세요.

[현재고 요약]
${stockSummary.join("\n")}

[입출고 내역 (최근 500건)]
${txSummary || "거래 내역 없음"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "AI 검색 처리 중 오류가 발생했습니다." }, { status: 500 });
  }

  const data = await response.json();
  const answer = data.content?.[0]?.text ?? "답변을 생성할 수 없습니다.";
  return NextResponse.json({ answer });
}
