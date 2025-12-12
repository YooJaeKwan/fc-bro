# 데이터 Export/Import 스크립트

데이터베이스 데이터를 JSON 형태로 export하고 import할 수 있는 스크립트입니다.

## Export (데이터 내보내기)

현재 데이터베이스의 모든 데이터를 JSON 파일로 export합니다.

```bash
node scripts/export-data.js
```

**결과:**
- `data-exports/export-YYYY-MM-DD.json` 파일이 생성됩니다.
- 파일에는 다음 데이터가 포함됩니다:
  - User (사용자)
  - Schedule (일정)
  - ScheduleAttendance (참석 기록)
  - SchedulePlayerStat (선수 통계)

## Import (데이터 가져오기)

JSON 파일에서 데이터베이스로 데이터를 import합니다.

```bash
node scripts/import-data.js <파일경로>
```

**예시:**
```bash
node scripts/import-data.js data-exports/export-2025-01-15.json
```

**주의사항:**
- Import 시 기존 데이터가 모두 삭제되고 새 데이터로 대체됩니다.
- Import 전에 반드시 현재 데이터를 export하여 백업하세요.

## 사용 시나리오

1. **마이그레이션 전 백업**
   ```bash
   # 1. 현재 데이터 export
   node scripts/export-data.js
   
   # 2. 마이그레이션 실행
   npx prisma migrate deploy
   
   # 3. 문제 발생 시 데이터 복구
   node scripts/import-data.js data-exports/export-YYYY-MM-DD.json
   ```

2. **개발 환경 간 데이터 복사**
   ```bash
   # 프로덕션에서 export
   node scripts/export-data.js
   
   # 개발 환경에서 import
   node scripts/import-data.js data-exports/export-YYYY-MM-DD.json
   ```

3. **테스트 데이터 준비**
   ```bash
   # 테스트 데이터 export
   node scripts/export-data.js
   
   # 필요 시 테스트 환경에 import
   node scripts/import-data.js data-exports/export-YYYY-MM-DD.json
   ```

