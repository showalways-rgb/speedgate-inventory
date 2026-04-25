# 스피드게이트 재고관리 시스템

> 스피드게이트 제품 및 부품의 입고·출고·현재고를 관리하는 웹 애플리케이션

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [주요 기능](#2-주요-기능)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [데이터 모델](#5-데이터-모델)
6. [API 엔드포인트](#6-api-엔드포인트)
7. [로컬 개발 환경 설정](#7-로컬-개발-환경-설정)
8. [배포 가이드 (Vercel + Supabase)](#8-배포-가이드-vercel--supabase)
9. [화면 구성](#9-화면-구성)
10. [환경 변수](#10-환경-변수)

---

## 1. 프로젝트 개요

스피드게이트 제품의 **모델별·파생별 재고**와 **부품 재고**를 독립적으로 관리하는 시스템입니다.

- 제품은 모델(예: SG-100)과 파생 타입(Master / Slave / Center)으로 구분 관리
- 부품은 독립적인 품목으로 개별 관리
- 입고·출고 내역을 날짜, 현장명과 함께 기록
- PC와 스마트폰 모두 사용 가능한 반응형 웹앱

---

## 2. 주요 기능

### 재고 현황 (대시보드)
- 모델별 Master / Slave / Center 재고 수량을 표 형식으로 표시
- 부품별 현재고 및 상태(정상 / 부족 / 없음) 표시
- 한눈에 전체 재고 파악 가능

### 입고 등록
- 제품(모델 + 파생)과 부품을 탭으로 구분하여 독립 입력
- 입고 날짜, 수량, 현장명 입력
- 등록 즉시 현재고 자동 반영

### 출고 등록
- 제품 및 부품 출고 처리
- 출고 날짜, 수량, 현장명 입력
- 재고 부족 시 오류 메시지 표시
- 등록 즉시 현재고 자동 반영

### 입출고 현황
- 제품 / 부품 탭으로 구분된 전체 거래 내역 조회
- 모델명, 파생, 구분(입고/출고) 필터 기능
- **모든 항목 수정 가능**: 날짜, 구분(입고↔출고), 수량, 현장명
- 수정 시 현재고 자동 재계산
- 입고·출고 소계 행 표시

### 현재고
- 제품 재고: 모델 × 파생 매트릭스 표
- 부품 재고: 수량 및 상태 표시 (5개 미만 주의 표시)

### 설정
- **모델 관리**: 추가, 이름 변경, 삭제 (모델 추가 시 Master·Slave·Center 자동 생성)
- **부품 관리**: 추가, 이름·단위 변경, 삭제
- 거래 내역이 있는 모델·부품은 삭제 불가 (데이터 무결성 보호)

---

## 3. 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (App Router) |
| **언어** | TypeScript 5 |
| **ORM** | Prisma 5 |
| **데이터베이스** | PostgreSQL (Supabase) / SQLite (로컬) |
| **스타일링** | Tailwind CSS 4 + Inline Styles |
| **UI 컴포넌트** | Radix UI, Lucide React |
| **배포** | Vercel |
| **DB 호스팅** | Supabase |

---

## 4. 프로젝트 구조

```
inventory/
├── prisma/
│   ├── schema.prisma          # DB 스키마 정의
│   └── seed.ts                # 초기 데이터 시드
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 재고 현황 (대시보드)
│   │   ├── globals.css        # 전역 CSS 변수 및 스타일
│   │   │
│   │   ├── stock-in/
│   │   │   └── page.tsx       # 입고 등록 페이지
│   │   ├── stock-out/
│   │   │   └── page.tsx       # 출고 등록 페이지
│   │   ├── status/
│   │   │   └── page.tsx       # 입출고 현황 페이지
│   │   ├── inventory/
│   │   │   └── page.tsx       # 현재고 페이지
│   │   ├── settings/
│   │   │   └── page.tsx       # 설정 페이지
│   │   │
│   │   └── api/
│   │       ├── products/              # 제품 목록 조회
│   │       ├── parts/                 # 부품 CRUD
│   │       │   └── [partId]/
│   │       ├── models/                # 모델 추가/조회
│   │       │   ├── rename/            # 모델 이름 변경
│   │       │   └── [modelName]/       # 모델 삭제
│   │       ├── product-stock/         # 제품 현재고 조회
│   │       ├── part-stock/            # 부품 현재고 조회
│   │       ├── product-transactions/  # 제품 입출고 내역 CRUD
│   │       │   └── [id]/
│   │       └── part-transactions/     # 부품 입출고 내역 CRUD
│   │           └── [id]/
│   │
│   ├── components/
│   │   ├── Sidebar.tsx        # 내비게이션 사이드바 (반응형)
│   │   ├── ClientLayout.tsx   # 모바일 햄버거 메뉴 레이아웃
│   │   └── StockForm.tsx      # 입고/출고 폼 컴포넌트
│   │
│   └── lib/
│       ├── prisma.ts          # Prisma 클라이언트 싱글톤
│       └── utils.ts           # 유틸리티 함수 (cn)
│
├── .env.example               # 환경 변수 예시
├── vercel.json                # Vercel 배포 설정
├── package.json
└── tsconfig.json
```

---

## 5. 데이터 모델

```prisma
// 제품 (모델 + 파생)
model Product {
  id           Int                  @id @default(autoincrement())
  modelName    String               // 예: SG-100
  variant      String               // Master | Slave | Center
  stock        ProductStock?
  transactions ProductTransaction[]
  @@unique([modelName, variant])
}

// 부품
model Part {
  id           Int               @id @default(autoincrement())
  name         String            @unique
  unit         String            @default("EA")
  stock        PartStock?
  transactions PartTransaction[]
}

// 제품 현재고 (1:1)
model ProductStock {
  id        Int     @id @default(autoincrement())
  product   Product @relation(...)
  productId Int     @unique
  quantity  Int     @default(0)
}

// 부품 현재고 (1:1)
model PartStock {
  id       Int  @id @default(autoincrement())
  part     Part @relation(...)
  partId   Int  @unique
  quantity Int  @default(0)
}

// 제품 입출고 내역
model ProductTransaction {
  id        Int      @id @default(autoincrement())
  product   Product  @relation(...)
  productId Int
  type      String   // "IN" | "OUT"
  quantity  Int
  note      String?  // 현장명
  createdAt DateTime @default(now())
}

// 부품 입출고 내역
model PartTransaction {
  id        Int      @id @default(autoincrement())
  part      Part     @relation(...)
  partId    Int
  type      String   // "IN" | "OUT"
  quantity  Int
  note      String?  // 현장명
  createdAt DateTime @default(now())
}
```

### 재고 계산 방식
- 제품/부품 각각 독립 관리
- 입고(IN): 현재고 + 수량
- 출고(OUT): 현재고 - 수량 (재고 부족 시 오류)
- 내역 **수정** 시: 기존 효과를 취소하고 새 효과를 적용하여 재고 자동 재계산

---

## 6. API 엔드포인트

### 제품 관련

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/products` | 전체 제품 목록 조회 |
| `GET` | `/api/models` | 모델명 목록 조회 |
| `POST` | `/api/models` | 새 모델 추가 (Master/Slave/Center 자동 생성) |
| `POST` | `/api/models/rename` | 모델명 변경 |
| `DELETE` | `/api/models/[modelName]` | 모델 삭제 |
| `GET` | `/api/product-stock` | 제품 현재고 조회 |
| `GET` | `/api/product-transactions` | 제품 입출고 내역 조회 |
| `POST` | `/api/product-transactions` | 제품 입고/출고 등록 |
| `PATCH` | `/api/product-transactions/[id]` | 제품 거래 내역 수정 |

### 부품 관련

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/parts` | 전체 부품 목록 조회 |
| `POST` | `/api/parts` | 새 부품 추가 |
| `PATCH` | `/api/parts/[partId]` | 부품명·단위 수정 |
| `DELETE` | `/api/parts/[partId]` | 부품 삭제 |
| `GET` | `/api/part-stock` | 부품 현재고 조회 |
| `GET` | `/api/part-transactions` | 부품 입출고 내역 조회 |
| `POST` | `/api/part-transactions` | 부품 입고/출고 등록 |
| `PATCH` | `/api/part-transactions/[id]` | 부품 거래 내역 수정 |

### 요청/응답 예시

**제품 입고 등록** `POST /api/product-transactions`
```json
// Request
{
  "productId": 1,
  "type": "IN",
  "quantity": 5,
  "note": "강남 현장",
  "date": "2025-04-24"
}

// Response 201
{
  "id": 10,
  "productId": 1,
  "type": "IN",
  "quantity": 5,
  "note": "강남 현장",
  "createdAt": "2025-04-24T00:00:00.000Z",
  "product": { "id": 1, "modelName": "SG-100", "variant": "Master" }
}
```

**거래 내역 수정** `PATCH /api/product-transactions/10`
```json
// Request (수정할 항목만 전송)
{
  "type": "OUT",
  "quantity": 3,
  "note": "부산 현장",
  "date": "2025-04-25"
}
```

---

## 7. 로컬 개발 환경 설정

### 사전 요구사항
- Node.js 20 이상
- npm 또는 yarn

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
# 로컬 SQLite 사용 시
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"
```

```bash
# 4. 스키마를 로컬 SQLite에 반영
# 주의: schema.prisma의 provider를 "sqlite"로 임시 변경 필요
npx prisma db push

# 5. 초기 데이터 시드
npm run db:seed

# 6. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 스크립트 목록

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (포트 3000) |
| `npm run build` | 프로덕션 빌드 (DB push + seed + next build) |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run db:migrate` | Prisma 마이그레이션 생성 및 적용 |
| `npm run db:seed` | 초기 데이터 시드 실행 |

---

## 8. 배포 가이드 (Vercel + Supabase)

### 8-1. Supabase 데이터베이스 설정

1. [supabase.com](https://supabase.com) 회원가입 후 새 프로젝트 생성
2. 프로젝트 홈 → **Connect** 버튼 클릭
3. **ORM** 탭 선택 (Prisma 전용 URL 제공)
4. `DATABASE_URL`과 `DIRECT_URL` 복사

```env
# Supabase ORM 탭에서 복사
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 8-2. Vercel 배포

1. [vercel.com](https://vercel.com) 회원가입 (GitHub 연동)
2. **Add New Project** → GitHub 저장소(`speedgate-inventory`) 선택 → **Import**
3. **Environment Variables** 섹션에 다음 2개 추가:

| 변수명 | 값 |
|--------|-----|
| `DATABASE_URL` | Supabase Transaction mode URL (포트 6543) |
| `DIRECT_URL` | Supabase Session mode URL (포트 5432) |

4. **Deploy** 클릭

### 8-3. 배포 후 확인

- Vercel 빌드 시 **`prisma generate` → `prisma db push` → `next build`** 순서로 실행됩니다. (`db push`로 스키마 변경이 프로덕션 DB에 반영됩니다.)
- 초기 시드가 필요하면 배포 후 한 번 `npm run db:seed`를 로컬에서 실행하거나, Supabase SQL로 데이터를 넣습니다.
- GitHub에 push할 때마다 Vercel이 자동으로 재배포됩니다.

---

## 9. 화면 구성

### 내비게이션

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 재고 현황 | `/` | 제품·부품 현재고 대시보드 |
| 입고 | `/stock-in` | 입고 등록 폼 |
| 출고 | `/stock-out` | 출고 등록 폼 |
| 입출고 현황 | `/status` | 전체 거래 내역 조회 및 수정 |
| 현재고 | `/inventory` | 상세 현재고 조회 |
| 설정 | `/settings` | 모델·부품 관리 |

### 반응형 레이아웃

- **PC (768px 이상)**: 왼쪽 고정 사이드바 (220px) + 오른쪽 콘텐츠
- **모바일 (768px 미만)**: 상단 헤더 + 햄버거(☰) 버튼 → 슬라이드 사이드바

---

## 10. 환경 변수

`.env.example` 파일:

```env
# PostgreSQL (Supabase) - 프로덕션
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

# SQLite - 로컬 개발 (schema.prisma provider를 sqlite로 변경 필요)
# DATABASE_URL="file:./dev.db"
# DIRECT_URL="file:./dev.db"
```

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다. 비밀번호 등 민감한 정보는 절대 공개 저장소에 올리지 마세요.

---

## 라이선스

© 2025 Cian. All rights reserved.
