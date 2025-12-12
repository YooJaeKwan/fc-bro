-- RemoveTeamFormationFields
-- 테이블이 존재하는 경우에만 컬럼 제거
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Schedule') THEN
        ALTER TABLE "Schedule" DROP COLUMN IF EXISTS "teamFormation";
        ALTER TABLE "Schedule" DROP COLUMN IF EXISTS "formationDate";
    END IF;
END $$;

