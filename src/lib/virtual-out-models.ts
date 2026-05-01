/** 재고(FIFO 카운터)와 무관하게 출고만 등록·집계하는 모델명 */
export const VIRTUAL_OUT_ITEM_NAMES = new Set(["BT-400M", "BF-400M"]);

/** DB·UI 문자열 차이(앞뒤 공백 등) 허용 */
export function normalizeVirtualOutItemName(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function isVirtualOutItemName(name: string): boolean {
  return VIRTUAL_OUT_ITEM_NAMES.has(normalizeVirtualOutItemName(name));
}

/** 파생 M 출고 1대당 출고 수량·건수를 합산할 본체 품목명 (재고/FIFO는 그대로, 집계만 가산) */
export const VIRTUAL_OUT_CROSS_COUNT_SOURCES = ["BT-400M", "BF-400M"] as const;

export function extraVirtualOutCountForItem(
  itemName: string,
  statsBySourceName: Record<string, { qty: number; txCount: number }>
): { extraQty: number; extraTxCount: number } {
  const btM = statsBySourceName["BT-400M"];
  const bfM = statsBySourceName["BF-400M"];
  if (itemName === "BT-400" && btM) {
    return { extraQty: btM.qty, extraTxCount: btM.txCount };
  }
  if ((itemName === "BF-400 Master" || itemName === "BF-400 Slave") && bfM) {
    return { extraQty: bfM.qty, extraTxCount: bfM.txCount };
  }
  return { extraQty: 0, extraTxCount: 0 };
}
