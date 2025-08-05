-- 添加协作启用字段到便签表
ALTER TABLE "notes" ADD COLUMN "collaboration_enabled" BOOLEAN NOT NULL DEFAULT false;

-- 添加索引以提高查询性能
CREATE INDEX "idx_notes_collaboration_enabled" ON "notes"("collaboration_enabled");

-- 为现有便签设置默认值（可选，因为已经有DEFAULT false）
-- UPDATE "notes" SET "collaboration_enabled" = false WHERE "collaboration_enabled" IS NULL;
