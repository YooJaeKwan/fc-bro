@echo off
REM 새로운 데이터베이스 초기화 스크립트 (간단 버전 - Windows)

echo 🔄 새로운 데이터베이스 초기화 시작...
echo.

REM 1. Prisma Client 생성
echo 1️⃣ Prisma Client 생성 중...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma Client 생성 실패
    pause
    exit /b 1
)
echo.

REM 2. 스키마 직접 적용 (마이그레이션 없이)
echo 2️⃣ 데이터베이스 스키마 적용 중 (테이블 생성)...
echo    이 과정은 몇 분 걸릴 수 있습니다...
echo.
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo ❌ 스키마 적용 실패
    pause
    exit /b 1
)
echo.

REM 3. 테스트 데이터 생성 (선택사항)
echo 3️⃣ 테스트 데이터 생성 중...
call node scripts/seed-dev-data.js --force
if errorlevel 1 (
    echo ⚠️  테스트 데이터 생성 실패 (무시 가능)
)
echo.

echo ✅ 데이터베이스 초기화 완료!
echo.
echo 📋 다음 단계:
echo    - Prisma Studio 실행: npx prisma studio
echo    - 개발 서버 실행: npm run dev
echo.

pause

