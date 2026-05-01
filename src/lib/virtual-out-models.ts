/** 재고(FIFO 카운터)와 무관하게 출고만 등록·집계하는 모델명 */
export const VIRTUAL_OUT_ITEM_NAMES = new Set(["BT-400M", "BF-400M"]);

/** DB·UI 문자열 차이(앞뒤 공백 등) 허용 */
export function normalizeVirtualOutItemName(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function isVirtualOutItemName(name: string): boolean {
  return VIRTUAL_OUT_ITEM_NAMES.has(normalizeVirtualOutItemName(name));
}

/** 가상 출고(M) 시 FIFO로 차감할 본체 품목명 (품목명 → 부모 이름 배열) */
export const VIRTUAL_OUT_PARENT_ITEMS: Record<string, string[]> = {
  "BT-400M": ["BT-400"],
  "BF-400M": ["BF-400 Master", "BF-400 Slave"],
};
