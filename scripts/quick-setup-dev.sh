#!/bin/bash
# Development 환경 빠른 설정 스크립트 (Windows용은 .bat 파일 사용)

echo "🔄 Development 환경 빠른 설정 시작..."
echo ""

# 1. Prisma Client 생성
echo "1️⃣ Prisma Client 생성 중..."
npx prisma generate
echo ""

# 2. 마이그레이션 실행
echo "2️⃣ 마이그레이션 실행 중..."
npx prisma migrate dev
echo ""

# 3. 테스트 데이터 생성
echo "3️⃣ 테스트 데이터 생성 중..."
node scripts/seed-dev-data.js --force
echo ""

echo "✅ Development 환경 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "   - Prisma Studio 실행: npx prisma studio"
echo "   - 개발 서버 실행: npm run dev"

