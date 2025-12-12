@echo off
REM 새로운 데이터베이스 초기화 스크립트 (Windows)

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

REM 2. 마이그레이션 실행 (테이블 생성)
echo 2️⃣ 마이그레이션 실행 중 (테이블 생성)...
echo    이 과정은 몇 분 걸릴 수 있습니다...
echo.
call npx prisma migrate deploy
if errorlevel 1 (
    echo ⚠️  migrate deploy 실패, migrate dev로 시도 중...
    call npx prisma migrate dev
    if errorlevel 1 (
        echo ❌ 마이그레이션 실패
        pause
        exit /b 1
    )
)
echo.

REM 3. 테스트 데이터 생성 (선택사항)
echo 3️⃣ 테스트 데이터 생성 (선택사항)...
echo    테스트 데이터를 생성하시겠습니까? (Y/N)
set /p createData="   입력: "
if /i "%createData%"=="Y" (
    call node scripts/seed-dev-data.js --force
)
echo.

echo ✅ 데이터베이스 초기화 완료!
echo.
echo 📋 다음 단계:
echo    - Prisma Studio 실행: npx prisma studio
echo    - 개발 서버 실행: npm run dev
echo.

pause

