-- RemoveUnusedTables
-- Drop tables in correct order to handle foreign key constraints
-- 테이블이 존재하는 경우에만 삭제 (새 데이터베이스에서는 아무 작업도 하지 않음)

-- Drop Notification table
DROP TABLE IF EXISTS "Notification" CASCADE;

-- Drop Comment table
DROP TABLE IF EXISTS "Comment" CASCADE;

-- Drop Post table
DROP TABLE IF EXISTS "Post" CASCADE;

-- Drop TeamMember table
DROP TABLE IF EXISTS "TeamMember" CASCADE;

-- Drop Team table
DROP TABLE IF EXISTS "Team" CASCADE;

