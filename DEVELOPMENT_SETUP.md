# Development 환경 설정 가이드

Development 환경에서 데이터베이스를 설정하고 테스트 데이터를 생성하는 방법입니다.

## 🆕 새로운 데이터베이스 초기화 (테이블이 없는 상태)

**아무 테이블도 없는 새로운 데이터베이스를 사용하는 경우:**

```bash
# 방법 1: npm 스크립트 사용 (권장)
npm run init:db

# 방법 2: 전체 초기화 (테이블 생성 + 테스트 데이터)
npm run init:db:full

# 방법 3: 직접 실행
node scripts/init-new-db.js

# 방법 4: Windows 배치 파일 (간단 버전)
scripts\init-new-db-simple.bat
```

**실행 순서:**
1. Prisma Client 생성
2. 스키마 직접 적용 (`prisma db push`) - 모든 테이블 생성
3. 테이블 확인
4. (선택) 테스트 데이터 생성

**또는 수동으로:**

```bash
# 1. Prisma Client 생성
npx prisma generate

# 2. 스키마 적용 (테이블 생성)
npx prisma db push --accept-data-loss

# 3. 테스트 데이터 생성 (선택)
npm run seed:dev -- --force
```

**주의:** `prisma db push`는 마이그레이션 파일을 생성하지 않고 스키마를 직접 적용합니다. 
새 데이터베이스에서는 이 방법이 더 간단하고 안전합니다.

## 📋 사전 준비

### 1. Neon DB Development 브랜치 생성 (권장)

Neon DB는 브랜치 기능을 제공합니다. Development 환경용 브랜치를 생성하는 것을 권장합니다.

1. [Neon Console](https://console.neon.tech)에 로그인
2. 프로젝트 선택
3. "Branches" 메뉴에서 새 브랜치 생성
4. 브랜치 이름: `development` 또는 `dev`
5. 생성된 브랜치의 연결 문자열 복사

### 2. 환경 변수 설정

`.env.local` 파일에 Development 환경용 DATABASE_URL을 설정합니다.

```env
# Development 환경 데이터베이스
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# 카카오 로그인
NEXT_PUBLIC_KAKAO_JS_KEY="your_kakao_js_key_here"
```

**주의:** Production 환경과 Development 환경을 분리하려면:
- Production: `.env.production.local` 또는 Vercel 환경 변수
- Development: `.env.local`

## 🚀 설정 단계

### 빠른 설정 (권장)

모든 설정을 한 번에 실행합니다:

```bash
# Windows
npm run quick-setup:dev

# 또는 스크립트 직접 실행
scripts\quick-setup-dev.bat
```

**실행 내용:**
- 데이터베이스 연결 테스트
- 마이그레이션 실행
- Prisma Client 생성
- 테스트 데이터 생성

### 단계별 설정

#### 1단계: 데이터베이스 설정

```bash
# Development 환경 데이터베이스 설정
npm run setup:dev
```

또는 직접 실행:
```bash
node scripts/setup-dev-db.js
```

**실행 내용:**
- 데이터베이스 연결 테스트
- 마이그레이션 상태 확인
- Prisma Client 확인
- 테이블 확인

#### 2단계: 마이그레이션 실행

```bash
# Development 환경 마이그레이션
npx prisma migrate dev
```

#### 3단계: 테스트 데이터 생성

```bash
# 테스트 데이터 생성 (기존 데이터 유지)
npm run seed:dev

# 테스트 데이터 생성 (기존 데이터 삭제 후 생성)
npm run seed:dev -- --force
```

또는 직접 실행:
```bash
node scripts/seed-dev-data.js
node scripts/seed-dev-data.js --force
```

**생성되는 데이터:**
- 사용자 5명 (관리자 1명, 선수 4명)
- 일정 3개 (자체경기, A매치, 연습)
- 참석 기록 4개

## 📊 생성되는 테스트 계정

| 역할 | 이메일 | 카카오 ID | 비고 |
|------|--------|-----------|------|
| 관리자 | admin@test.com | test_admin_001 | 총무 권한 |
| 선수1 | player1@test.com | test_player_001 | 공격수 |
| 선수2 | player2@test.com | test_player_002 | 미드필더 |
| 선수3 | player3@test.com | test_player_003 | 수비수 |
| 선수4 | player4@test.com | test_player_004 | 윙어 |

## 🔧 유용한 명령어

### Prisma Studio 실행
```bash
npx prisma studio
```
브라우저에서 데이터베이스 데이터를 시각적으로 확인할 수 있습니다.

### 마이그레이션 상태 확인
```bash
npx prisma migrate status
```

### 마이그레이션 수동 실행
```bash
# Development 환경
npx prisma migrate dev

# Production 환경 (주의!)
npx prisma migrate deploy
```

### 데이터베이스 연결 테스트
```bash
node scripts/test-db-connection.js
```

### 데이터 Export/Import
```bash
# 데이터 export
npm run export:data

# 데이터 import
npm run import:data data-exports/export-YYYY-MM-DD.json
```

## ⚠️ 주의사항

1. **Production과 Development 분리**
   - Production 데이터베이스와 Development 데이터베이스를 반드시 분리하세요
   - Neon DB 브랜치 기능을 활용하거나 별도 프로젝트를 사용하세요

2. **마이그레이션 주의**
   - `prisma migrate dev`는 Development 환경에서만 사용
   - `prisma migrate deploy`는 Production 환경에서만 사용

3. **테스트 데이터**
   - Development 환경에서만 테스트 데이터를 사용하세요
   - Production 환경에는 실제 데이터만 저장하세요

## 🐛 문제 해결

### 데이터베이스 연결 오류
```
Error: P1001: Can't reach database server
```
- DATABASE_URL이 올바른지 확인
- Neon DB 프로젝트가 활성화되어 있는지 확인
- 방화벽 설정 확인

### 마이그레이션 오류
```
Error: Migration failed
```
- 기존 마이그레이션과 충돌하는 경우
- `npx prisma migrate reset` 실행 (주의: 모든 데이터 삭제)
- 또는 `npx prisma migrate dev --create-only`로 마이그레이션 파일만 생성

### Prisma Client 오류
```
Error: Prisma Client is not generated
```
- `npx prisma generate` 실행
- 또는 `npm run postinstall` 실행

## 📚 추가 리소스

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Neon DB 문서](https://neon.tech/docs)
- [Prisma Migrate 가이드](https://www.prisma.io/docs/guides/migrate)

