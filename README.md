# 스피드게이트 재고관리 시스템

> GATE / 단말기 / 쉼터 전 품목의 입고·출고·현재고를 관리하는 웹 애플리케이션

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [주요 기능](#2-주요-기능)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [품목 구성](#5-품목-구성-대분류--소분류--모델)
6. [데이터 모델](#6-데이터-모델)
7. [API 엔드포인트](#7-api-엔드포인트)
8. [로컬 개발 환경 설정](#8-로컬-개발-환경-설정)
9. [배포 가이드 (Vercel + Supabase)](#9-배포-가이드-vercel--supabase)
10. [화면 구성](#10-화면-구성)
11. [환경 변수](#11-환경-변수)

---

## 1. 프로젝트 개요

스피드게이트가 취급하는 **GATE / 단말기 / 쉼터** 전 품목의 재고를 통합 관리하는 웹 애플리케이션입니다.

### 목적

- 수기 대장 또는 별도 파일로 관리되던 입출고 내역을 DB 기반으로 전환
- 현장별 납품 이력을 모델 단위로 추적하여 출고 순서 오류를 방지
- 관리자가 언제 어디서든 스마트폰으로 재고를 조회하고 입출고 처리 가능

### 핵심 설계 원칙

| 원칙 | 설명 |
|------|------|
| **계층형 품목 구성** | 대분류 → 소분류 → 모델 3단계로 품목을 체계적으로 관리 |
| **카운터 기반 추적** | 입고된 각 유닛에 순번을 부여하여 개별 추적 가능 |
| **선입선출(FIFO) 출고** | 가장 먼저 입고된 순번부터 출고 처리되어 재고 회전 원칙 준수 |
| **AI 자연어 조회** | Claude API를 통해 SQL 없이 자연어로 DB 조회 가능 |
| **반응형 UI** | PC와 스마트폰 모두 동일한 기능을 제공 |

---

## 2. 주요 기능

### 2-1. 재고 현황 (대시보드)

메인 화면으로, 전체 재고 상태를 한눈에 파악할 수 있습니다.

**바 차트 시각화**
- 상단에 **대분류 필터 탭**(GATE / 단말기 / 쉼터)을 제공
- 선택한 대분류에 속한 모든 모델의 재고 수치를 **가로 바 차트**로 표시
- 각 모델 행에 세 가지 구간이 한 줄에 표시됨:
  - 🟦 **입고 및 재고**: 누적 입고 수량
  - 🟩 **출고**: 누적 출고 수량
  - ⬜ **현재고**: `Counter` 테이블의 `IN_STOCK` 상태 수량
- 재고가 0인 모델도 행으로 표시하여 전체 품목을 확인 가능

**Claude AI 자연어 검색창**
- 차트 하단에 텍스트 입력창 제공
- 입력한 질문을 Claude API로 전달하고 DB를 조회하여 자연어로 답변 반환
- DB 범위: 이 시스템에 등록된 거래 내역에 한정 (외부 데이터 미사용)
- 예시:
  - `"2025년 BT-400의 출고 대수를 알려줘!"` → `"2025년 BT-400의 출고 대수는 총 8대입니다."`
  - `"이번 달 가장 많이 출고된 모델은?"` → `"BF-500 Master로, 이번 달 5대 출고됐습니다."`
  - `"강남 현장에 납품된 목록을 날짜순으로 알려줘"` → 날짜·모델·수량 목록 반환

---

### 2-2. 입고 등록

새 재고를 시스템에 등록하는 페이지입니다.

**입력 항목**

| 항목 | 필수 | 설명 |
|------|------|------|
| 대분류 | ✅ | GATE / 단말기 / 쉼터 중 선택 |
| 소분류 | ✅ | 선택한 대분류에 해당하는 소분류만 표시 (쉼터는 생략) |
| 모델 | ✅ | 선택한 소분류에 해당하는 모델만 표시 |
| 입고 날짜 | ✅ | 달력 입력 (기본값: 오늘) |
| 수량 | ✅ | 입고 유닛 수 (양의 정수) |
| 현장명 | ✅ | 입고 출처 또는 관련 현장 |
| 추가모듈 | — | **GATE 대분류 선택 시에만 표시**, 선택 리스트 또는 직접 입력 |
| 세부사양 | — | **GATE 대분류 선택 시에만 표시**, 선택 리스트 또는 직접 입력 |

**카운터 채번 방식**
- 입고 등록 시 수량만큼 `Counter` 레코드가 자동 생성됨
- 각 `Counter`는 해당 모델의 다음 순번(`seq`)을 부여받음
- 예: BT-400 기존 최대 순번이 10이고 5개 입고 시 → seq 11, 12, 13, 14, 15 생성
- 모든 `Counter`는 초기 상태 `IN_STOCK`으로 생성

---

### 2-3. 출고 등록

재고를 현장에 납품하거나 출고 처리하는 페이지입니다.

**입력 항목**

| 항목 | 필수 | 설명 |
|------|------|------|
| 대분류 | ✅ | GATE / 단말기 / 쉼터 중 선택 |
| 소분류 | ✅ | 선택한 대분류에 해당하는 소분류만 표시 (쉼터는 생략) |
| 모델 | ✅ | 선택한 소분류에 해당하는 모델만 표시 |
| 출고 날짜 | ✅ | 달력 입력 (기본값: 오늘) |
| 수량 | ✅ | 출고 유닛 수 (현재고 이하로만 입력 가능) |
| 현장명 | ✅ | 납품 현장명 |
| 추가모듈 | — | **GATE 대분류 선택 시에만 표시**, 선택 리스트 또는 직접 입력 |
| 세부사양 | — | **GATE 대분류 선택 시에만 표시**, 선택 리스트 또는 직접 입력 |

**선입선출(FIFO) 출고 처리 방식**
1. 해당 모델의 `Counter` 중 `status = "IN_STOCK"` 레코드를 `seq` 오름차순으로 조회
2. 요청 수량만큼 앞에서부터 순서대로 `status = "SHIPPED"`, `outTxId` 연결
3. 출고 결과 화면에서 처리된 카운터 순번 목록을 확인 가능
4. 재고 부족(현재고 < 요청 수량) 시 오류 메시지 표시, 처리 중단

---

### 2-4. 입출고 현황

등록된 모든 거래 내역을 조회하고 수정·삭제하는 페이지입니다.

**조회 기능**
- 전체 거래 내역을 최신순으로 표시
- 필터 조건: 대분류 / 소분류 / 모델명 / 구분(입고·출고) / 날짜 범위

**표시 컬럼**

| 컬럼 | 내용 |
|------|------|
| 날짜 | 거래 발생 일자 |
| 대분류 / 소분류 | 품목 계층 |
| 모델명 | 거래 대상 모델 |
| 구분 | 입고 / 출고 |
| 수량 | 해당 거래 수량 |
| 현장명 | 거래 관련 현장 |
| 추가모듈 | GATE 품목의 경우 표시 |
| 세부사양 | GATE 품목의 경우 표시 |
| 연결 카운터 | 해당 거래로 처리된 순번 범위 |

**수정 / 삭제**
- 수량·날짜·현장명·구분 수정 가능
- 수정 또는 삭제 시 연결된 `Counter`의 상태(`IN_STOCK` ↔ `SHIPPED`)를 자동 재계산
- 재고 정합성이 깨지는 수정은 오류 메시지로 차단

---

### 2-5. 설정

시스템 마스터 데이터와 초기화를 관리하는 페이지입니다.

**모델 관리**
- 품목 계층(대분류 → 소분류)에 새 모델 추가
- 모델명 변경 (단, 거래 내역이 있는 모델은 이름 변경 주의)
- 모델 삭제 — 거래 내역이 하나라도 있으면 삭제 불가 (무결성 보호)

**추가모듈 / 세부사양 리스트 관리** (GATE 전용)
- 입고·출고 폼에서 선택 가능한 공통 리스트 항목 추가·삭제
- 현재 등록된 항목 목록 확인
- 삭제해도 기존 거래 내역의 값은 유지됨 (참조 키가 아닌 텍스트 저장)

**DB 초기화**
- 모든 `Transaction`, `Counter` 레코드를 일괄 삭제
- 품목 구성(Category / Subcategory / Item)과 선택 리스트(AddonOption)는 유지
- 초기화 전 확인 다이얼로그 표시

---

## 3. 기술 스택

| 구분 | 기술 | 버전 | 비고 |
|------|------|------|------|
| **프레임워크** | Next.js | 16 | App Router, React Server Components |
| **언어** | TypeScript | 5 | 전체 코드베이스 타입 안전 |
| **ORM** | Prisma | 5 | 마이그레이션, 타입 생성 |
| **데이터베이스** | PostgreSQL | — | 프로덕션: Supabase |
| **데이터베이스** | SQLite | — | 로컬 개발용 |
| **스타일링** | Tailwind CSS | 4 | Utility-first, Inline Styles 혼용 |
| **UI 컴포넌트** | Radix UI | — | 접근성 기반 헤드리스 컴포넌트 |
| **아이콘** | Lucide React | — | 아이콘 라이브러리 |
| **AI** | Claude API (Anthropic) | claude-3-5-sonnet | 자연어 DB 조회 |
| **배포** | Vercel | — | Git push 자동 배포 |
| **DB 호스팅** | Supabase | — | Connection Pooling, Direct URL 분리 |

---

## 4. 프로젝트 구조

```
inventory/
├── prisma/
│   ├── schema.prisma          # DB 스키마 정의 (Category/Subcategory/Item/Transaction/Counter/AddonOption)
│   └── seed.ts                # 초기 품목 계층 시드 — GATE/단말기/쉼터 전 품목, 추가모듈/세부사양 초기 리스트
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 루트 레이아웃 — Sidebar + ClientLayout 래핑
│   │   ├── page.tsx           # 재고 현황 (대시보드) — 바 차트 + AI 검색창
│   │   ├── globals.css        # 전역 CSS 변수, 폰트, 리셋 스타일
│   │   │
│   │   ├── stock-in/
│   │   │   └── page.tsx       # 입고 등록 — CategorySelector + 입고 폼 + 카운터 채번
│   │   ├── stock-out/
│   │   │   └── page.tsx       # 출고 등록 — CategorySelector + 출고 폼 + FIFO 처리
│   │   ├── status/
│   │   │   └── page.tsx       # 입출고 현황 — 필터·정렬·수정·삭제 테이블
│   │   ├── settings/
│   │   │   └── page.tsx       # 설정 — 모델 관리 + 선택 리스트 관리 + DB 초기화
│   │   │
│   │   └── api/
│   │       ├── categories/
│   │       │   └── route.ts             # GET  — 대분류 목록
│   │       ├── subcategories/
│   │       │   └── route.ts             # GET  — 소분류 목록 (?categoryId=)
│   │       ├── items/
│   │       │   ├── route.ts             # GET  — 모델 목록 (?subcategoryId=) | POST — 모델 추가
│   │       │   └── [id]/route.ts        # DELETE — 모델 삭제
│   │       ├── stock/
│   │       │   └── route.ts             # GET  — 전체 현재고 집계 (바 차트용)
│   │       ├── transactions/
│   │       │   ├── route.ts             # GET  — 내역 조회 (필터 지원) | POST — 입고 등록
│   │       │   └── [id]/route.ts        # PATCH — 수정 | DELETE — 삭제
│   │       ├── stock-out/
│   │       │   └── route.ts             # POST — FIFO 출고 처리
│   │       ├── addon-options/
│   │       │   ├── route.ts             # GET  — 선택 리스트 조회 | POST — 항목 추가
│   │       │   └── [id]/route.ts        # DELETE — 항목 삭제
│   │       ├── ai-search/
│   │       │   └── route.ts             # POST — Claude API 자연어 검색
│   │       └── reset/
│   │           └── route.ts             # POST — DB 초기화 (거래·카운터 삭제)
│   │
│   ├── components/
│   │   ├── Sidebar.tsx             # 내비게이션 사이드바 — PC 고정, 모바일 슬라이드
│   │   ├── ClientLayout.tsx        # 모바일 햄버거 메뉴 클라이언트 컴포넌트
│   │   ├── CategorySelector.tsx    # 대분류→소분류→모델 계단식 연동 드롭다운
│   │   ├── StockChart.tsx          # 모델별 입출고 가로 바 차트 (Recharts 또는 SVG)
│   │   └── AiSearch.tsx            # Claude AI 자연어 검색창 (스트리밍 응답 지원)
│   │
│   └── lib/
│       ├── prisma.ts          # Prisma 클라이언트 싱글톤 (개발/프로덕션 분기)
│       ├── fifo.ts            # FIFO 출고 처리 핵심 로직 — Counter seq 오름차순 SHIPPED 처리
│       ├── seed-data.ts       # 품목 계층 + 추가모듈/세부사양 초기 데이터 상수
│       └── utils.ts           # 공통 유틸리티 함수 (cn, 날짜 포맷 등)
│
├── .env.example               # 환경 변수 템플릿
├── vercel.json                # Vercel 빌드 명령 설정
├── package.json
└── tsconfig.json
```

---

## 5. 품목 구성 (대분류 / 소분류 / 모델)

입고·출고 폼에서 **대분류 → 소분류 → 모델** 순으로 연동 선택됩니다.  
`seed.ts`에 아래 구성이 초기 데이터로 등록되어 있으며, 설정 페이지에서 모델을 추가할 수 있습니다.

| 대분류 | 소분류 | 품목 (모델명) | 단위 |
|--------|--------|--------------|------|
| GATE | Turnstile | BT-400 | EA |
| GATE | Turnstile | BT-400M | EA |
| GATE | Turnstile | BT-500 | EA |
| GATE | Turnstile | BT-500 Dummy | EA |
| GATE | Flap | BF-400 Master | EA |
| GATE | Flap | BF-400 Slave | EA |
| GATE | Flap | BF-400 Center | EA |
| GATE | Flap | BF-400M | EA |
| GATE | Flap | BF-500 Master | EA |
| GATE | Flap | BF-500 Slave | EA |
| GATE | Flap | BF-500 Center | EA |
| GATE | Flap | SBTL7000 Master | EA |
| GATE | Flap | SBTL7000 Slave | EA |
| GATE | Flap | SBTL7000 Center | EA |
| GATE | 전신게이트 | FHT2300D | EA |
| 단말기 | 안면인식 | SPEEDFACE-V3L | EA |
| 단말기 | 안면인식 | SPEEDFACE-V3L-QR | EA |
| 단말기 | 안면인식 | SPEEDFACE-V5L | EA |
| 단말기 | 안면인식 | SPEEDFACE-V5L-MF | EA |
| 단말기 | 안면인식 | SPEEDFACE-V5L-RFID | EA |
| 단말기 | 안면인식 | SPEEDFACE-V5L-QR | EA |
| 단말기 | 안면인식 | SenseFace 4A | EA |
| 단말기 | 안면인식 | Ubio X Face SC [13.56Mhz] | EA |
| 단말기 | 안면인식 | Ubio X Face Pro | EA |
| 단말기 | 지문인식 | AC-5000IK SC | EA |
| 단말기 | 지문인식 | AC-2200 RF(125Khz) | EA |
| 단말기 | 지문인식 | AC-2100 PLUS[13.56Mhz] | EA |
| 단말기 | 지문인식 | AC-2100 SC | EA |
| 단말기 | 지문인식 | AC-2200 SC | EA |
| 단말기 | 지문인식 | AC-1100 RF | EA |
| 단말기 | 지문인식 | AC-2200 RF | EA |
| 쉼터 | — | 구급상자 | EA |
| 쉼터 | — | 냉장고 | EA |
| 쉼터 | — | 접이식의자 | EA |
| 쉼터 | — | 접이식테이블 | EA |
| 쉼터 | — | 제세동기 | EA |
| 쉼터 | — | 체온계 | EA |
| 쉼터 | — | 혈압계 | EA |
| 쉼터 | — | 헬스ID | EA |

> **쉼터** 대분류는 소분류가 없으므로 대분류 선택 시 모델 목록이 바로 표시됩니다.  
> **추가모듈 / 세부사양** 입력 필드는 대분류가 **GATE**일 때만 노출됩니다. 단말기·쉼터에서는 표시되지 않습니다.  
> 두 필드 모두 아래 공통 선택 리스트에서 고르거나 자유 텍스트로 직접 입력할 수 있습니다.

### 추가모듈 공통 선택 리스트 (GATE 전용, 초기값)

| # | 추가모듈 |
|---|---------|
| 1 | 케이블 덕트 |
| 2 | 이동식플레이트 |
| 3 | Fence(SUS) |

### 세부사양 공통 선택 리스트 (GATE 전용, 초기값)

| # | 세부사양 |
|---|---------|
| 1 | 540mm |
| 2 | 710mm |
| 3 | 800mm |
| 4 | 400mm |
| 5 | 베이스 플레이트, 상판, 방부목 Ass'y |

> 초기값 이후 추가·삭제는 **설정 페이지 > 추가모듈/세부사양 리스트 관리**에서 가능합니다.

### 연동 선택 흐름 (입고 / 출고 폼)

```
[1단계: 대분류 선택]     [2단계: 소분류 선택]       [3단계: 모델 선택]
┌───────────┐           ┌──────────────┐           ┌─────────────────────┐
│ ● GATE    │  ──────►  │ ● Turnstile  │  ──────►  │ ○ BT-400            │
│ ○ 단말기  │           │ ○ Flap       │           │ ○ BT-400M           │
│ ○ 쉼터    │           │ ○ 전신게이트  │           │ ● BT-500            │
└───────────┘           └──────────────┘           │ ○ BT-500 Dummy      │
                                                   └─────────────────────┘
                                                   ↓ (GATE 선택 시 추가 노출)
                                                   ┌─────────────────────┐
                                                   │ 추가모듈: [케이블 덕트 ▼] │
                                                   │ 세부사양: [540mm     ▼] │
                                                   └─────────────────────┘

예시: GATE → Flap → BF-400 Master / Slave / Center / BF-400M 중 선택
예시: 단말기 → 지문인식 → AC-5000IK SC 외 6종 중 선택
예시: 쉼터 → (소분류 건너뜀) → 구급상자 외 7종 중 선택
```

---

## 6. 데이터 모델

### ERD 개요

```
Category (대분류)
  └── Subcategory (소분류, 쉼터는 name="")
        └── Item (모델)
              ├── Transaction (입출고 거래)
              │     └── Counter (FIFO 카운터) ← inTxId / outTxId
              └── Counter (FIFO 카운터)

AddonOption (추가모듈/세부사양 선택 리스트, 독립 테이블)
```

### Prisma 스키마

```prisma
// 대분류 (GATE / 단말기 / 쉼터)
model Category {
  id            Int           @id @default(autoincrement())
  name          String        @unique   // "GATE" | "단말기" | "쉼터"
  subcategories Subcategory[]
}

// 소분류 (Turnstile / Flap / 전신게이트 / 안면인식 / 지문인식)
// 쉼터: 소분류 없이 Item이 직접 연결되므로 name = "" (빈 문자열)로 처리
model Subcategory {
  id         Int       @id @default(autoincrement())
  name       String                // "" | "Turnstile" | "Flap" | ...
  category   Category  @relation(fields: [categoryId], references: [id])
  categoryId Int
  items      Item[]
  @@unique([categoryId, name])
}

// 모델 (BT-400, SPEEDFACE-V5L, 구급상자 등 전 품목)
model Item {
  id            Int           @id @default(autoincrement())
  name          String        @unique  // 모델명
  unit          String        @default("EA")
  subcategory   Subcategory   @relation(fields: [subcategoryId], references: [id])
  subcategoryId Int
  transactions  Transaction[]
  counters      Counter[]
}

// 입출고 거래 내역
model Transaction {
  id        Int       @id @default(autoincrement())
  item      Item      @relation(fields: [itemId], references: [id])
  itemId    Int
  type      String    // "IN" | "OUT"
  quantity  Int       // 해당 거래의 수량
  note      String?   // 현장명
  addon     String?   // 추가모듈 — GATE 대분류에서만 입력 (자유 텍스트)
  spec      String?   // 세부사양 — GATE 대분류에서만 입력 (자유 텍스트)
  date      DateTime  // 실제 거래 일자
  createdAt DateTime  @default(now())
  counters  Counter[]
}

// FIFO 카운터 — 입고 유닛 하나하나를 순번으로 추적
// 입고 5개 시 seq 1~5 레코드가 생성되며, 출고 시 앞번호부터 SHIPPED 처리
model Counter {
  id        Int         @id @default(autoincrement())
  item      Item        @relation(fields: [itemId], references: [id])
  itemId    Int
  seq       Int         // 해당 모델 내 입고 순번 (누적, 재사용 안 함)
  status    String      // "IN_STOCK" | "SHIPPED"
  inTxId    Int         // 이 카운터를 생성한 입고 거래 ID
  outTxId   Int?        // 이 카운터를 소진한 출고 거래 ID (출고 전: null)
  createdAt DateTime    @default(now())

  @@unique([itemId, seq])  // 모델별 순번 중복 불가
}

// 추가모듈 / 세부사양 공통 선택 리스트 (GATE 전용)
// 거래 데이터의 addon/spec 필드와 외래키 관계 없이 독립 관리
// 리스트 항목 삭제해도 기존 거래 내역의 값은 그대로 유지됨
model AddonOption {
  id    Int    @id @default(autoincrement())
  type  String // "ADDON" | "SPEC"
  value String // 표시 값 (예: "케이블 덕트", "540mm")
  order Int    @default(0)  // 정렬 순서
  @@unique([type, value])
}
```

### 재고 계산 방식

| 구분 | 계산 방법 |
|------|---------|
| **현재고** | `Counter` 테이블에서 해당 `itemId`의 `status = "IN_STOCK"` 레코드 수 |
| **누적 입고** | 해당 `itemId`의 `Transaction` 중 `type = "IN"` 수량 합계 |
| **누적 출고** | 해당 `itemId`의 `Transaction` 중 `type = "OUT"` 수량 합계 |

**입고 처리 흐름**
1. `Transaction` 레코드 생성 (`type = "IN"`)
2. 해당 `Item`의 현재 최대 `seq` 조회
3. 수량만큼 `Counter` 레코드 생성 (`seq +1`씩, `status = "IN_STOCK"`, `inTxId` 연결)

**출고 처리 흐름 (FIFO)**
1. 재고 확인: `IN_STOCK` 카운터 수 ≥ 요청 수량인지 검증
2. `Transaction` 레코드 생성 (`type = "OUT"`)
3. `seq` 오름차순으로 요청 수량만큼 `Counter` 상태를 `SHIPPED`로 변경, `outTxId` 연결

**수정/삭제 시 재계산**
- 입고 거래 삭제: 연결된 `Counter` 삭제 → 단, 이미 `SHIPPED`된 카운터가 있으면 삭제 불가
- 출고 거래 삭제: 연결된 `Counter`를 `IN_STOCK`으로 복원, `outTxId = null`
- 수량 수정: 기존 효과 취소 후 새 수량으로 재적용

---

## 7. API 엔드포인트

### 품목 구조 관련

| 메서드 | 경로 | 설명 | 응답 예시 |
|--------|------|------|---------|
| `GET` | `/api/categories` | 대분류 목록 | `[{ id, name }]` |
| `GET` | `/api/subcategories?categoryId=1` | 대분류별 소분류 | `[{ id, name, categoryId }]` |
| `GET` | `/api/items?subcategoryId=2` | 소분류별 모델 | `[{ id, name, unit }]` |
| `POST` | `/api/items` | 새 모델 추가 | `{ id, name, unit, subcategoryId }` |
| `DELETE` | `/api/items/[id]` | 모델 삭제 | `{ success: true }` |

### 재고 관련

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/stock` | 전체 모델 현재고 조회 (바 차트용) |
| `GET` | `/api/stock?categoryId=1` | 대분류 필터 적용 현재고 조회 |
| `POST` | `/api/transactions` | 입고 등록 (카운터 자동 채번) |
| `POST` | `/api/stock-out` | **FIFO 출고 처리** |
| `GET` | `/api/transactions` | 전체 입출고 내역 조회 |
| `GET` | `/api/transactions?itemId=1&type=OUT&from=2025-01-01&to=2025-12-31` | 필터 조회 |
| `PATCH` | `/api/transactions/[id]` | 거래 내역 수정 |
| `DELETE` | `/api/transactions/[id]` | 거래 내역 삭제 |

### GATE 전용 선택 리스트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/addon-options?type=ADDON` | 추가모듈 선택 리스트 조회 |
| `GET` | `/api/addon-options?type=SPEC` | 세부사양 선택 리스트 조회 |
| `POST` | `/api/addon-options` | 선택 항목 추가 |
| `DELETE` | `/api/addon-options/[id]` | 선택 항목 삭제 |

### 기타

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/ai-search` | Claude AI 자연어 DB 조회 |
| `POST` | `/api/reset` | DB 전체 초기화 (Transaction·Counter 삭제) |

### 요청/응답 예시

**입고 등록** `POST /api/transactions`

```json
// Request Body
{
  "itemId": 1,
  "type": "IN",
  "quantity": 5,
  "note": "강남 현장",
  "addon": "케이블 덕트",
  "spec": "540mm",
  "date": "2025-04-24"
}

// Response 201
{
  "transaction": {
    "id": 10,
    "itemId": 1,
    "type": "IN",
    "quantity": 5,
    "note": "강남 현장",
    "addon": "케이블 덕트",
    "spec": "540mm",
    "date": "2025-04-24T00:00:00.000Z"
  },
  "counters": [
    { "seq": 11, "status": "IN_STOCK" },
    { "seq": 12, "status": "IN_STOCK" },
    { "seq": 13, "status": "IN_STOCK" },
    { "seq": 14, "status": "IN_STOCK" },
    { "seq": 15, "status": "IN_STOCK" }
  ]
}
```

**FIFO 출고 처리** `POST /api/stock-out`

```json
// Request Body
{
  "itemId": 1,
  "quantity": 3,
  "note": "부산 현장",
  "date": "2025-04-25"
}

// Response 201
{
  "transaction": {
    "id": 11,
    "itemId": 1,
    "type": "OUT",
    "quantity": 3,
    "note": "부산 현장",
    "date": "2025-04-25T00:00:00.000Z"
  },
  "shippedCounters": [
    { "seq": 11, "status": "SHIPPED", "outTxId": 11 },
    { "seq": 12, "status": "SHIPPED", "outTxId": 11 },
    { "seq": 13, "status": "SHIPPED", "outTxId": 11 }
  ]
}

// Response 400 (재고 부족)
{
  "error": "재고 부족: 현재 IN_STOCK 2개, 요청 3개"
}
```

**현재고 조회** `GET /api/stock?categoryId=1`

```json
// Response 200
[
  {
    "itemId": 1,
    "itemName": "BT-400",
    "subcategoryName": "Turnstile",
    "categoryName": "GATE",
    "totalIn": 16,
    "totalOut": 8,
    "currentStock": 8
  },
  {
    "itemId": 2,
    "itemName": "BT-500",
    "subcategoryName": "Turnstile",
    "categoryName": "GATE",
    "totalIn": 7,
    "totalOut": 7,
    "currentStock": 0
  }
]
```

**Claude AI 검색** `POST /api/ai-search`

```json
// Request Body
{
  "query": "2025년 BT-400의 출고 대수를 알려줘!"
}

// Response 200
{
  "answer": "2025년 BT-400의 출고 대수는 총 8대입니다. (1월 3대, 3월 5대)"
}

// Response 500 (API 키 오류 등)
{
  "error": "AI 검색 처리 중 오류가 발생했습니다."
}
```

---

## 8. 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20 이상
- npm 또는 yarn
- (선택) Anthropic API Key — AI 검색 기능 사용 시 필요

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/showalways-rgb/speedgate-inventory.git
cd speedgate-inventory

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
```

`.env` 파일을 열어 다음과 같이 설정합니다:

```env
# SQLite 로컬 개발
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# Claude AI 검색창 (선택, 없으면 AI 검색 기능 비활성화)
ANTHROPIC_API_KEY="sk-ant-..."
```

```bash
# 4. schema.prisma의 provider를 "sqlite"로 변경 후 스키마 반영
#    (기본값 "postgresql" → "sqlite"로 임시 변경)
npx prisma db push

# 5. 초기 품목 데이터 시드
#    GATE/단말기/쉼터 전 품목과 추가모듈/세부사양 초기 리스트가 등록됨
npm run db:seed

# 6. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 스크립트 목록

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (포트 3000, HMR 지원) |
| `npm run build` | 프로덕션 빌드: `prisma generate` → `prisma db push` → `next build` |
| `npm run start` | 프로덕션 서버 실행 (`npm run build` 후 사용) |
| `npm run db:migrate` | Prisma 마이그레이션 파일 생성 및 적용 |
| `npm run db:seed` | 초기 품목 계층 + 선택 리스트 시드 실행 |

### 자주 발생하는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `Environment variable not found: DATABASE_URL` | `.env` 파일 없음 | `cp .env.example .env` 후 값 입력 |
| `PrismaClientKnownRequestError: datasource provider not supported` | `schema.prisma` provider가 `postgresql`인 채로 SQLite 사용 | provider를 `"sqlite"`로 변경 |
| `Table does not exist` | `db push` 미실행 | `npx prisma db push` 실행 |
| `seed.ts` 실행 오류 | 기존 데이터 중복 | DB 초기화 후 재시드: `npx prisma db push --force-reset && npm run db:seed` |

---

## 9. 배포 가이드 (Vercel + Supabase)

### 9-1. Supabase 데이터베이스 설정

1. [supabase.com](https://supabase.com) 회원가입 후 새 프로젝트 생성
2. 프로젝트 홈 → **Connect** 버튼 클릭
3. **ORM** 탭 선택 → Prisma 전용 `DATABASE_URL`과 `DIRECT_URL` 복사

```env
# Connection Pooling (애플리케이션 쿼리용, 포트 6543)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (마이그레이션·스키마 변경용, 포트 5432)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

> `DATABASE_URL`은 PgBouncer 커넥션 풀링을 사용하고, `DIRECT_URL`은 Prisma 마이그레이션 시 직접 연결에 사용됩니다.

### 9-2. Vercel 배포

1. [vercel.com](https://vercel.com) 회원가입 후 GitHub 연동
2. **Add New Project** → `speedgate-inventory` 저장소 **Import**
3. **Environment Variables** 섹션에 다음 3개 추가:

| 변수명 | 설명 | 예시 값 |
|--------|------|---------|
| `DATABASE_URL` | Supabase Connection Pooling URL (포트 6543) | `postgresql://...6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct URL (포트 5432) | `postgresql://...5432/postgres` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | `sk-ant-...` |

4. **Deploy** 클릭

### 9-3. 빌드 및 배포 흐름

```
git push → Vercel 자동 트리거
  └── prisma generate    # Prisma 클라이언트 생성
  └── prisma db push     # Supabase 스키마 동기화 (--accept-data-loss 옵션 포함)
  └── next build         # Next.js 프로덕션 빌드
  └── 배포 완료
```

- 최초 배포 후 초기 데이터 시드가 필요하면 로컬에서 Supabase DIRECT_URL을 `.env`에 설정하고 `npm run db:seed` 실행
- 이후 GitHub에 push할 때마다 Vercel이 자동으로 재배포

### 9-4. 프로덕션 URL

| 환경 | URL |
|------|-----|
| 프로덕션 (Vercel) | https://speedgate-inventory-29024ca57-showalways-rgbs-projects.vercel.app/ |

---

## 10. 화면 구성

### 내비게이션

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 재고 현황 | `/` | 대분류 필터 탭 + 모델별 바 차트 + Claude AI 검색창 |
| 입고 | `/stock-in` | 계단식 품목 선택 + 입고 폼 + 카운터 채번 결과 표시 |
| 출고 | `/stock-out` | 계단식 품목 선택 + 출고 폼 + FIFO 처리된 카운터 목록 표시 |
| 입출고 현황 | `/status` | 필터·정렬 가능한 전체 거래 내역 테이블, 수정·삭제 지원 |
| 설정 | `/settings` | 모델 추가·삭제 / 선택 리스트 관리 / DB 초기화 |

> **현재고 페이지(`/inventory`) 없음** — 현재고는 재고 현황 바 차트에서 직접 확인합니다.

### 재고 현황 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│  재고 현황                                                        │
│                                                                  │
│  [ GATE ]  [ 단말기 ]  [ 쉼터 ]   ← 대분류 필터 탭              │
│                                                                  │
│  게이트 입출고 현황 (GATE 선택 시)                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ BT-400        ████████████████ 16  ████ 8   ████ 8        │  │
│  │ BT-400M       ██ 2                          ██ 2          │  │
│  │ BT-500        ████████████ 12  ████ 4       ████████ 8    │  │
│  │ BT-500 Dummy  ████ 4                        ████ 4        │  │
│  │ BF-400 Master ████████ 8       ██ 2         ██████ 6      │  │
│  │ ...                                                        │  │
│  │           0        10      20       30                     │  │
│  │  🟦 입고 및 재고   🟩 출고   ⬜ 현재고                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Claude AI 검색                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 질문을 입력하세요... (예: "이번달 BT-400 출고 대수는?")     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  → 답변: "이번 달 BT-400 출고 대수는 총 4대입니다."              │
└──────────────────────────────────────────────────────────────────┘
```

### 입고 / 출고 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│  입고 등록                                                        │
│                                                                  │
│  대분류   [ GATE          ▼ ]                                    │
│  소분류   [ Turnstile     ▼ ]   ← 대분류 선택 시 연동            │
│  모델     [ BT-400        ▼ ]   ← 소분류 선택 시 연동            │
│                                                                  │
│  입고 날짜  [ 2025-04-24     ]                                   │
│  수량       [ 5              ]                                   │
│  현장명     [ 강남 현장       ]                                   │
│                                                                  │
│  ── GATE 선택 시만 표시 ──────────────────────────────────────  │
│  추가모듈   [ 케이블 덕트  ▼ ]  또는 직접 입력                   │
│  세부사양   [ 540mm        ▼ ]  또는 직접 입력                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [ 입고 등록 ]                                                   │
│                                                                  │
│  ✅ 등록 완료 — BT-400 seq 11~15 생성 (IN_STOCK)                │
└──────────────────────────────────────────────────────────────────┘
```

### 반응형 레이아웃

| 환경 | 레이아웃 |
|------|---------|
| **PC (768px 이상)** | 왼쪽 고정 사이드바 (220px) + 오른쪽 콘텐츠 영역 |
| **모바일 (768px 미만)** | 상단 헤더 + 햄버거(☰) 버튼 → 오버레이 사이드바 슬라이드 |

---

## 11. 환경 변수

`.env.example` 파일:

```env
# ── PostgreSQL (Supabase) — 프로덕션 ─────────────────────────────
# Connection Pooling (애플리케이션 런타임 쿼리)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"

# Direct Connection (Prisma 마이그레이션 / db push)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

# ── SQLite — 로컬 개발 ────────────────────────────────────────────
# schema.prisma의 provider를 "sqlite"로 변경 후 사용
# DATABASE_URL="file:./dev.db"
# DIRECT_URL="file:./dev.db"

# ── Claude AI 자연어 검색 (Anthropic) ────────────────────────────
# 없으면 AI 검색창이 비활성화됨
ANTHROPIC_API_KEY="sk-ant-..."
```

### 변수 설명

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `DATABASE_URL` | ✅ | Prisma가 쿼리 실행에 사용하는 DB 연결 URL |
| `DIRECT_URL` | ✅ | `db push` / `migrate` 시 직접 연결에 사용 |
| `ANTHROPIC_API_KEY` | — | Claude API Key. 없으면 `/api/ai-search` 500 반환 |

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.  
> 비밀번호 등 민감한 정보는 절대 공개 저장소에 올리지 마세요.

---

## 라이선스

© 2025 Cian. All rights reserved.
