# 스피드게이트 재고관리 시스템

스피드게이트 6개 모델(SG-100 ~ SG-600)의 Master/Slave/Center 파생별 부품 재고를 관리하는 웹앱입니다.

## 기능

- **대시보드**: 재고 현황 요약 및 부족 재고 알림
- **입고 등록**: 모델·부품별 입고 처리
- **출고 등록**: 모델·부품별 출고 처리 (재고 초과 방지)
- **현재고**: 모델 × 부품 매트릭스 테이블
- **거래 내역**: 전체 입출고 이력 조회 및 필터링

## 로컬 개발 실행

```bash
# 의존성 설치
npm install

# DB 마이그레이션 및 초기 데이터 삽입
npx prisma migrate dev
npm run db:seed

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

## Railway 배포

### 방법 1: SQLite + 영구 볼륨 (간단)

1. Railway 프로젝트 생성
2. GitHub 레포지토리 연결
3. **Volumes** 탭에서 볼륨 추가: `/app/prisma`
4. 환경 변수 설정:
   ```
   DATABASE_URL=file:/app/prisma/prod.db
   NODE_ENV=production
   ```
5. 배포 명령어는 `railway.json`에 설정되어 있습니다.

### 방법 2: PostgreSQL (권장)

1. Railway 프로젝트에 PostgreSQL 플러그인 추가
2. `prisma/schema.prisma`의 `provider = "sqlite"` → `provider = "postgresql"` 변경
3. 기존 마이그레이션 삭제 후 재생성:
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   ```
4. GitHub에 Push → Railway 자동 배포
5. Railway가 `DATABASE_URL`을 자동으로 설정합니다.
6. 시드 데이터 실행 (Railway Shell에서):
   ```bash
   npm run db:seed
   ```

## 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | 데이터베이스 연결 URL | `file:./prisma/dev.db` |
| `NODE_ENV` | 실행 환경 | `production` |

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **DB**: Prisma ORM + SQLite/PostgreSQL
- **UI**: Tailwind CSS
- **배포**: Railway
