import { prisma } from "./prisma";

/**
 * 파생모델 → 구성품(베이스 게이트·추가모듈·세부사양 단독 품목) 연동 BOM.
 * Item.name 은 프로젝트 전역 고유입니다.
 */
export const DERIVED_BOM: Record<string, { bases: string[]; addons: string[]; specs: string[] }> = {
  "BT-400M": {
    bases: ["BT-400"],
    addons: ["이동식플레이트"],
    specs: ["베이스 플레이트, 상판, 방부목 Ass'y"],
  },
  "BF-400M": {
    bases: ["BF-400 Master", "BF-400 Slave", "BF-400 Center"],
    addons: ["이동식플레이트"],
    specs: ["베이스 플레이트, 상판, 방부목 Ass'y"],
  },
};

export type AssemblyComponent = { role: "베이스" | "추가모듈" | "세부사양"; label: string; stock: number };

export type DerivedAssembly = {
  assembleableSets: number;
  bottleneck: AssemblyComponent | null;
  components: AssemblyComponent[];
};

async function stockForNames(names: string[]): Promise<Map<string, number>> {
  if (names.length === 0) return new Map();
  const items = await prisma.item.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
  const map = new Map<string, number>();
  for (const n of names) map.set(n, 0);
  const counts = await Promise.all(
    items.map((item) =>
      prisma.counter.count({ where: { itemId: item.id, status: "IN_STOCK" } }).then((c) => ({ name: item.name, c }))
    )
  );
  for (const { name, c } of counts) map.set(name, c);
  return map;
}

export async function getDerivedAssemblyForItem(derivedItemName: string): Promise<DerivedAssembly | null> {
  const bom = DERIVED_BOM[derivedItemName];
  if (!bom) return null;

  const allNames = [...bom.bases, ...bom.addons, ...bom.specs];
  const stockMap = await stockForNames(allNames);

  const components: AssemblyComponent[] = [];
  for (const label of bom.bases) {
    components.push({ role: "베이스", label, stock: stockMap.get(label) ?? 0 });
  }
  for (const label of bom.addons) {
    components.push({ role: "추가모듈", label, stock: stockMap.get(label) ?? 0 });
  }
  for (const label of bom.specs) {
    components.push({ role: "세부사양", label, stock: stockMap.get(label) ?? 0 });
  }

  const stocks = components.map((c) => c.stock);
  const assembleableSets = stocks.length ? Math.min(...stocks) : 0;

  const bottleneck =
    components.length > 0
      ? components.reduce((a, b) => (a.stock <= b.stock ? a : b))
      : null;

  return { assembleableSets, bottleneck, components };
}
